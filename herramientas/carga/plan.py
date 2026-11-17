"""Convierte las filas clasificadas (movs.json) en el plan de carga de cada cliente y lo controla contra la planilla.

Uso: python -I plan.py movs.json plan.json
Por hoja: saldo anterior, ventas (remitos con sus ítems), pagos y "créditos" (descuentos, retiros, comida,
transferencias de terceros...), en el orden de la hoja. Se recalcula el saldo y se compara con la columna SALDO.

Reglas (todas verificadas contra la columna SALDO de cada hoja):
  * Un remito es un grupo de renglones: arranca con una fecha o un comprobante nuevo y sigue mientras no haya otro.
    Si el total del grupo está en DEBE es una VENTA; si está en HABER (RETIRO, DESCUENTO...) es un CRÉDITO.
  * Un renglón con DEBE y HABER iguales es una venta pagada en el momento: venta + pago.
  * Filas "PAGO..." y demás filas con HABER y sin producto: pagos (los descuentos, retiros y consumos son "créditos").
  * Producto con precio pero sin kilos (por caja/unidad): cantidad = UNI, o subtotal / precio. Va como "<producto> (POR UNIDAD)".
  * Cargo sin producto en DEBE: venta de 1 unidad con el texto de la planilla como producto.
  * Pago sin importe: se omite (la planilla tampoco lo suma).
  * Fecha fuera de rango (oct-nov 2026): se usa la del movimiento anterior y se deja asentada la original.
"""
import sys, json, re
from collections import Counter

datos = json.load(open(sys.argv[1], encoding="utf-8"))
r2 = lambda x: round(x + 1e-9, 2)
DESDE, HASTA = "2026-10-01", "2026-11-17"

# Filas que la propia planilla no suma a su saldo: no se cargan para que el saldo coincida con la hoja y con SALDOS.
OMITIR = {
    (94, 9): "La planilla NO suma esta línea (2 kg de matambre a ROSALES, $ 26.000) al total del remito: el DEBE dice $ 16.560. Se deja afuera para que el saldo coincida con la planilla y con SALDOS; si corresponde cobrarla, se carga a mano.",
}


def medio(texto):
    t = texto.upper()
    if re.search(r"EFVO|EFECTIVO", t):
        return "efectivo"
    if re.search(r"CHEQUE|\bCH\b|(BCO|PCIA)\b.*N.?\d{6,}", t):
        return "cheque"
    if re.search(r"TRANSF", t):
        return "billetera_virtual"
    return None


def tipo_credito(det, comp):
    t = (det + " " + comp).upper()
    if re.search(r"DESC", t):
        return "descuento"
    if re.search(r"RETIRO|COMPRA", t):
        return "retiro"
    if re.search(r"COMIDA|GASTOS|ALMACEN", t):
        return "consumo"
    return "otro"


salida, resumen = [], []
for h in datos:
    movs = h["movs"]
    pie = None
    if movs and movs[-1]["detalle"] == "" and not movs[-1]["kilos"] and movs[-1]["haber"] and not movs[-1]["debe"] and not movs[-1]["comprobante"]:
        pie = movs[-1]
        suma = sum((x["haber"] or 0) for x in movs[:-1])
        pie["coincide"] = abs(suma - pie["haber"]) < 1
        movs = movs[:-1]
    eventos, omitidas, saldo_partes = [], [], []
    state = {"g": None}

    def cerrar(modo, fila, importe_haber=None):
        """Cierra el grupo abierto como venta o como crédito."""
        g = state["g"]
        if g is None:
            return
        total = r2(sum(i["subtotal"] for i in g["items"]))
        g["total"], g["fila"] = total, fila
        if modo == "credito":
            g["clase"] = "credito"
            g["importe"] = importe_haber
            g["tipo_credito"] = tipo_credito(" ".join(i["detalle"] for i in g["items"]), g["comprobante"])
            g["medio"] = None
            g["detalle"] = " + ".join(f"{i['detalle']} {i['kilos']:g} kg x {i['precio']:g}" for i in g["items"])
            g["diferencia_items"] = r2(total - importe_haber)
        else:
            g["clase"] = "venta"
        eventos.append(g)
        state["g"] = None

    for x in movs:
        tipo, det, comp = x["tipo"], x["detalle"], x["comprobante"]
        propia = x["fecha_propia"]
        if (h["numero"], x["fila"]) in OMITIR:
            omitidas.append({"fila": x["fila"], "motivo": OMITIR[(h["numero"], x["fila"])], "detalle": det})
            continue
        # Producto con kilos pero sin precio escrito: el precio sale del importe de la fila (DEBE / kilos).
        if tipo == "otro" and x["kilos"] and not x["precio"] and x["debe"] and not x["haber"]:
            x = {**x, "precio": r2(x["debe"] / x["kilos"])}
        if tipo == "saldo":
            cerrar("venta", x["fila"] - 1)
            if x["debe"] and not x["haber"]:
                saldo_partes.append({"fila": x["fila"], "fecha": x["fecha"], "detalle": det, "importe": x["debe"]})
            else:
                omitidas.append({"fila": x["fila"], "motivo": "SALDO con HABER: no entendido", "detalle": det})
            continue
        es_item = tipo == "item" or (tipo == "otro" and x["precio"] and (x["kilos"] or x["uni"] or x["subtotal"]) and not (x["haber"] and not x["debe"] and not x["kilos"] and not x["uni"]))
        if es_item and x["precio"]:
            if state["g"] is None or propia or comp:
                cerrar("venta", x["fila"] - 1)
                state["g"] = {"clase": "venta", "fecha": x["fecha"], "comprobante": comp, "items": []}
            por_unidad = not x["kilos"]
            cant = x["kilos"] if x["kilos"] else (x["uni"] if x["uni"] else (x["subtotal"] / x["precio"] if x["subtotal"] else None))
            if not cant:
                omitidas.append({"fila": x["fila"], "motivo": "producto sin cantidad", "detalle": det})
                continue
            nombre = det + (" (POR UNIDAD)" if por_unidad else "")
            state["g"]["items"].append({"detalle": nombre, "kilos": cant, "precio": x["precio"], "subtotal": r2(cant * x["precio"]), "por_unidad": por_unidad, "fila": x["fila"]})
            if x["debe"]:
                state["g"]["debe_hoja"] = x["debe"]
            if x["debe"] and not x["haber"]:
                cerrar("venta", x["fila"])  # el total del remito (DEBE) cierra el grupo: lo que siga es otro movimiento
            elif x["haber"] and x["debe"]:
                cerrar("venta", x["fila"])
                eventos.append({"clase": "pago", "fecha": x["fecha"], "comprobante": "", "importe": x["haber"], "medio": None, "detalle": "pagado en el momento de la venta", "fila": x["fila"]})
            elif x["haber"]:
                cerrar("credito", x["fila"], x["haber"])
            continue
        # fila sin producto
        cerrar("venta", x["fila"] - 1)
        if x["haber"]:
            texto = f"{det} {comp}"
            # Transferencias, cheques, depósitos y deudas pagadas son pagos aunque no digan "PAGO"; el resto
            # (descuentos, retiros, comida...) son créditos: restan al saldo pero no son plata cobrada.
            es_pago = tipo == "pago" or bool(re.search(r"TRANSF|CHEQUE|\bCH\b|BCO|PCIA|DEUDA|EFVO", texto.upper()))
            comp_num = comp if re.fullmatch(r"\d+", comp or "") else ""
            eventos.append({"clase": "pago" if es_pago else "credito", "tipo_credito": None if es_pago else tipo_credito(det, comp), "fecha": x["fecha"], "comprobante": comp_num,
                            "importe": x["haber"], "medio": medio(texto), "detalle": (det + (" · " + comp if comp and not comp_num else "")).strip(), "fila": x["fila"]})
        elif tipo == "pago":
            omitidas.append({"fila": x["fila"], "motivo": "pago sin importe en la planilla (no suma al saldo)", "detalle": det})
        elif x["debe"]:
            if re.search(r"SALDO", det.upper()) or (not eventos and not saldo_partes and not propia):
                # Arrastre de deuda: "AMS SALDO", o un importe al tope de la hoja, sin fecha ni producto.
                saldo_partes.append({"fila": x["fila"], "fecha": x["fecha"], "detalle": det, "importe": x["debe"]})
            else:
                # Cargo sin producto (préstamo, ajuste a favor...): suma al saldo pero no es una venta.
                eventos.append({"clase": "cargo", "fecha": x["fecha"], "comprobante": comp if re.fullmatch(r"\d+", comp or "") else "", "importe": x["debe"], "detalle": det, "fila": x["fila"]})
        else:
            omitidas.append({"fila": x["fila"], "motivo": "fila no entendida", "detalle": det})
    cerrar("venta", movs[-1]["fila"] if movs else 0)

    # ── fechas: fuera de rango -> la del movimiento anterior ──
    fechas_ok = [e["fecha"] for e in eventos if e.get("fecha") and DESDE <= e["fecha"] <= HASTA]
    fecha_saldo = next((p["fecha"] for p in saldo_partes if p["fecha"] and DESDE <= p["fecha"] <= HASTA), None) or (min(fechas_ok) if fechas_ok else "2026-10-15")
    anterior, fechas_corregidas = fecha_saldo, []
    for e in eventos:
        f = e.get("fecha")
        if not f or not (DESDE <= f <= HASTA):
            fechas_corregidas.append({"fila": e["fila"], "original": f, "usada": anterior})
            e["fecha_original"] = f
            e["fecha"] = anterior
        anterior = e["fecha"]
    saldo_ant = r2(sum(p["importe"] for p in saldo_partes))

    # ── control: saldo corrido contra la columna SALDO, donde la planilla lo cambia ──
    corrido, diferencias = saldo_ant, []
    cambios = []  # (fila, saldo hoja) donde el saldo de la hoja cambia
    previo = None
    for x in movs:
        if x["saldo_hoja"] is not None:
            if previo is not None and abs(x["saldo_hoja"] - previo) > 0.001:
                cambios.append((x["fila"], x["saldo_hoja"]))
            previo = x["saldo_hoja"]
    acum = {}
    for e in eventos:
        corrido = r2(corrido + (e["total"] if e["clase"] == "venta" else e["importe"] if e["clase"] == "cargo" else -e["importe"]))
        e["corrido"] = corrido
        acum[e["fila"]] = corrido
    for fila, saldo_hoja in cambios:
        previos = [c for f, c in acum.items() if f <= fila]
        calc = previos[-1] if previos else saldo_ant
        if abs(calc - saldo_hoja) > 1:
            diferencias.append((fila, calc, saldo_hoja))
    avisos = []
    for e in eventos:
        if e["clase"] == "venta" and e.get("debe_hoja") is not None and abs(e["debe_hoja"] - e["total"]) > 1:
            avisos.append(f"remito fila {e['fila']}: ítems {e['total']} vs DEBE {e['debe_hoja']}")
        if e["clase"] == "credito" and e.get("diferencia_items") is not None and abs(e["diferencia_items"]) > 1:
            avisos.append(f"crédito fila {e['fila']}: ítems {e['total']} vs HABER {e['importe']}")
    final_hoja = h["saldo_final_hoja"]
    resumen.append({"numero": h["numero"], "corrido": corrido, "hoja": final_hoja, "dif": diferencias[:2], "avisos": avisos, "omitidas": omitidas, "pie": None if pie is None else pie["coincide"]})
    salida.append({"numero": h["numero"], "hoja": h["hoja"], "resto": h["resto"], "titulo": h["titulo"], "fecha_saldo": fecha_saldo, "saldo_anterior": saldo_ant,
                   "saldo_partes": saldo_partes, "eventos": eventos, "omitidas": omitidas, "fechas_corregidas": fechas_corregidas,
                   "saldo_calculado": corrido, "saldo_hoja": final_hoja, "diferencias": diferencias, "avisos": avisos})

json.dump(salida, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)

mal = [r for r in resumen if r["hoja"] is None or abs(r["corrido"] - r["hoja"]) > 1]
print("hojas:", len(resumen), "| saldo final calculado = saldo de la hoja:", len(resumen) - len(mal))
print("pie de totales que no coincide:", [r["numero"] for r in resumen if r["pie"] is False])
print("eventos:", dict(Counter(e["clase"] for s in salida for e in s["eventos"])), "| créditos por tipo:", dict(Counter(e["tipo_credito"] for s in salida for e in s["eventos"] if e["clase"] == "credito")))
print("--- saldo final distinto ---")
for r in mal:
    print(r["numero"], "calculado:", r["corrido"], "hoja:", r["hoja"], "| diferencias por fila:", r["dif"])
print("--- diferencias intermedias o avisos ---")
for r in resumen:
    if r["dif"] or r["avisos"]:
        print(r["numero"], "| dif:", r["dif"], "|", r["avisos"])
print("--- filas omitidas ---")
for s in salida:
    for o in s["omitidas"]:
        print(s["numero"], o)
print("--- fechas corregidas ---")
for s in salida:
    for f in s["fechas_corregidas"]:
        print(s["numero"], f)
