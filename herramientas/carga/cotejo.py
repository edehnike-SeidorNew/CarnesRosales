"""Cotejo fila por fila: cada fila de cada hoja del Excel contra lo que se carga. Falla si alguna fila queda sin destino.

Uso: python -I cotejo.py movs.json plan.json planilla.xlsx generar_clientes.py salida.xlsx
"""
import sys, io, json, re, unicodedata
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

movs_json, plan_json, excel, generador, salida = sys.argv[1:6]
movs = {h["numero"]: h for h in json.load(open(movs_json, encoding="utf-8"))}
plan = {h["numero"]: h for h in json.load(open(plan_json, encoding="utf-8"))}

# Mismos nombres de producto que usa el script de carga.
src = io.open(generador, encoding="utf-8").read()
ini, fin = src.index("ALIAS = {"), src.index("# ── Localidades")
norm = lambda v: " ".join(str(v).split()) if v is not None else ""
ns = {"re": re, "norm": norm, "unicodedata": unicodedata}
exec(src[ini:fin], ns)
producto = ns["producto"]

# Saldos de la hoja SALDOS (número -> importe).
wb = load_workbook(excel, data_only=True)
saldos_hoja = {}
for f in wb["SALDOS"].iter_rows(min_row=2, values_only=True):
    if isinstance(f[0], (int, float)) and f[2] is not None:
        saldos_hoja[int(f[0])] = float(f[2])
extra_saldos = {}
for f in wb["SALDOS"].iter_rows(min_row=2, values_only=True):
    nombre = norm(f[1]).upper()
    if isinstance(f[2], (int, float)) and not isinstance(f[0], (int, float)):
        extra_saldos[nombre] = float(f[2])
saldos_hoja[92] = extra_saldos.get("DAVID")
saldos_hoja[93] = extra_saldos.get("KOKI (A.M.S)")
saldos_hoja[94] = extra_saldos.get("CLIENTES VARIOS")

filas_detalle, resumen, problemas = [], [], []
for n in sorted(plan):
    h, p = movs[n], plan[n]
    rows = h["movs"]
    pie = None
    if rows and rows[-1]["detalle"] == "" and not rows[-1]["kilos"] and rows[-1]["haber"] and not rows[-1]["debe"] and not rows[-1]["comprobante"]:
        pie = rows[-1]["fila"]
    destino = {}  # fila -> (texto, importe, producto, corrido, nota)

    def marcar(fila, texto, importe=None, prod="", corrido=None, nota=""):
        previo = destino.get(fila)
        if previo and previo[0].startswith("Pago") and texto.startswith("Venta"):
            texto = "Venta + pago en el momento"
            importe = (importe, previo[1])
        destino[fila] = (texto, importe, prod, corrido, nota)

    for s in p["saldo_partes"]:
        marcar(s["fila"], "Saldo anterior", s["importe"], "", None, f"Se suma al saldo anterior ({s['detalle']})")
    for e in p["eventos"]:
        if e["clase"] == "venta":
            for i in e["items"]:
                marcar(i["fila"], "Venta", i["subtotal"], producto(i["detalle"], i["precio"]), None, ("Por unidad" if i["por_unidad"] else ""))
            marcar(e["fila"], "Venta", destino[e["fila"]][1], destino[e["fila"]][2], e["corrido"], f"Total del remito {e['total']:,.0f}".replace(",", "."))
        elif e["clase"] == "pago":
            marcar(e["fila"], "Pago", e["importe"], "", e["corrido"], "Medio de pago vacío" + (f" · dice: {e['detalle']}" if e.get("detalle") else ""))
        elif e["clase"] == "credito":
            for i in e.get("items", []):
                marcar(i["fila"], "Descuento (renglón)", None, "", None, "Forma parte de un descuento: el importe va en la fila del HABER")
            marcar(e["fila"], f"Descuento ({e.get('tipo_credito')})", e["importe"], "", e["corrido"], e.get("detalle", ""))
        elif e["clase"] == "cargo":
            marcar(e["fila"], "Cargo", e["importe"], "", e["corrido"], e.get("detalle", ""))
    for o in p["omitidas"]:
        marcar(o["fila"], "NO se carga", None, "", None, o["motivo"])

    for x in rows:
        if x["fila"] == pie:
            d = ("Fila de totales de la hoja", None, "", None, "Es la suma de los HABER: no se carga")
        else:
            d = destino.get(x["fila"])
            if d is None:
                problemas.append((n, x["fila"], x["detalle"]))
                d = ("SIN DESTINO (revisar)", None, "", None, "")
        imp = d[1]
        if isinstance(imp, tuple):
            imp = imp[0]
        filas_detalle.append([
            n, h["hoja"].strip(), x["fila"], x["fecha"] if x["fecha_propia"] else None, x["comprobante"] or None, x["detalle"] or None, x["kilos"], x["precio"],
            x["debe"], x["haber"], x["saldo_hoja"], d[0], imp, d[2] or None, d[3], d[4] or None,
        ])
    cuenta = lambda c: sum(1 for e in p["eventos"] if e["clase"] == c)
    sal = saldos_hoja.get(n)
    resumen.append([
        n, h["hoja"].strip(), sal, p["saldo_hoja"], p["saldo_calculado"], None if sal is None else round(sal - p["saldo_calculado"], 2),
        cuenta("venta"), cuenta("pago"), cuenta("credito"), cuenta("cargo"), len(p["omitidas"]), len(p["fechas_corregidas"]),
    ])

print("hojas cotejadas:", len(plan), "| filas con datos cotejadas:", len(filas_detalle))
print("filas SIN destino:", problemas if problemas else "ninguna")
dif = [r for r in resumen if r[5] not in (0, None)]
print("hojas donde el saldo cargado difiere de SALDOS:", [(r[0], r[5]) for r in dif] if dif else "ninguna")

# ── Libro de salida ──
libro = Workbook()
hoja1 = libro.active
hoja1.title = "Resumen por cliente"
cab1 = ["N°", "Hoja", "Saldo en SALDOS", "Saldo de la hoja", "Saldo cargado", "Diferencia SALDOS - cargado", "Ventas", "Pagos", "Descuentos", "Cargos", "Filas que no se cargan", "Fechas corregidas"]
hoja1.append(cab1)
for r in resumen:
    hoja1.append(r)
hoja1.append([])
hoja1.append(["", "TOTAL", sum(r[2] or 0 for r in resumen), sum(r[3] for r in resumen), sum(r[4] for r in resumen), sum((r[5] or 0) for r in resumen)])

hoja2 = libro.create_sheet("Fila por fila")
cab2 = ["N°", "Hoja", "Fila del Excel", "Fecha", "FACT/REC", "DETALLE", "KILOS", "PRECIO", "DEBE", "HABER", "SALDO (hoja)", "Qué se carga", "Importe cargado", "Producto cargado", "Saldo del sistema", "Nota"]
hoja2.append(cab2)
for f in filas_detalle:
    hoja2.append(f)

hoja3 = libro.create_sheet("Avisos")
hoja3.append(["N°", "Hoja", "Fila del Excel", "Qué pasó"])
for n in sorted(plan):
    for o in plan[n]["omitidas"]:
        hoja3.append([n, plan[n]["hoja"].strip(), o["fila"], "No se carga: " + o["motivo"]])
    for fc in plan[n]["fechas_corregidas"]:
        hoja3.append([n, plan[n]["hoja"].strip(), fc["fila"], f"Fecha imposible en la planilla ({fc['original'] or 'vacía'}): se usó {fc['usada']}"])

azul = PatternFill("solid", fgColor="2B2D6E")
for ws, anchos in ((hoja1, [5, 26, 17, 17, 17, 22, 8, 8, 11, 8, 14, 12]), (hoja2, [5, 24, 9, 12, 10, 30, 9, 11, 13, 13, 14, 26, 15, 26, 15, 60]), (hoja3, [5, 26, 10, 120])):
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = azul
        c.alignment = Alignment(wrap_text=True, vertical="center")
    for i, a in enumerate(anchos, start=1):
        ws.column_dimensions[get_column_letter(i)].width = a
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
for ws, cols in ((hoja1, "CDEF"), (hoja2, "GHIJKMO")):
    for fila in ws.iter_rows(min_row=2):
        for c in fila:
            if c.column_letter in cols:
                c.number_format = "#,##0.00"
rojo = PatternFill("solid", fgColor="FBE3E3")
for fila in hoja2.iter_rows(min_row=2):
    if str(fila[11].value).startswith(("NO se carga", "SIN DESTINO")):
        for c in fila:
            c.fill = rojo
libro.save(salida)
print("archivo:", salida)
sys.exit(1 if problemas else 0)
