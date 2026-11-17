"""Lee las hojas de cuenta corriente de la planilla (sólo lectura) y las deja como movimientos clasificados.

Uso: python -I movs.py planilla.xlsx salida.json
Cada hoja numerada (1 a 90) es un cliente. Cada fila con datos queda clasificada:
  saldo  : fila "SALDO ..." (arrastre de deuda)            -> importe en DEBE
  pago   : fila "PAGO ..."                                    -> importe en HABER
  item   : producto con kilos y precio (parte de un remito)   -> kilos x precio
  otro   : cualquier otra cosa (queda para revisar a mano)
Se recalcula el saldo corrido y se compara con la columna SALDO de la hoja.
"""
import sys, re, json, datetime
from openpyxl import load_workbook

wb = load_workbook(sys.argv[1], data_only=True)
salida = sys.argv[2]
NO_CLIENTES = {"CLIENTES DETALLES", "SALDOS", "ING MENSUAL", "LISTA DE PRECIOS", "VTA DIARIA", "HOJA6", "HOJA2"}
# Hojas sin número en el nombre: siguen a la 90 en el mismo orden que la hoja SALDOS.
ESPECIALES = {"AMERICO": 91, "DAVID R": 92, "KOKI": 93, "VARIOS": 94}


def norm(v):
    return " ".join(str(v).split()) if v is not None else ""


def num(v):
    if isinstance(v, bool):
        return None
    return float(v) if isinstance(v, (int, float)) else None


def fecha_iso(v):
    return v.date().isoformat() if isinstance(v, datetime.datetime) else None


resultado = []
for ws in wb.worksheets:
    nombre_hoja = ws.title.strip()
    if nombre_hoja.upper() in NO_CLIENTES:
        continue
    m = re.match(r"(\d+)\s*(.*)", nombre_hoja)
    if m:
        numero, resto = int(m.group(1)), m.group(2)
    elif nombre_hoja.upper() in ESPECIALES:
        numero, resto = ESPECIALES[nombre_hoja.upper()], nombre_hoja
    else:
        print("HOJA SIN NÚMERO (se ignora):", repr(ws.title))
        continue
    filas = list(ws.iter_rows(values_only=True))
    ih = next((i for i, f in enumerate(filas) if "FECHA" in [norm(c).upper() for c in f] and "DETALLE" in [norm(c).upper() for c in f]), None)
    if ih is None:
        print("SIN ENCABEZADO:", repr(ws.title))
        continue
    cab = [norm(c).upper().replace("SUTOTAL", "SUBTOTAL") for c in filas[ih]]
    col = {}
    for i, nombre in enumerate(cab):
        if nombre and nombre not in col:
            col[nombre] = i
    titulo = [norm(c) for c in filas[ih - 1] if norm(c) and norm(c).upper() != "UNI"] if ih > 0 else []

    def g(f, nombre):
        i = col.get(nombre)
        return f[i] if i is not None and i < len(f) else None

    fecha_actual, comp_actual, cliente_actual = None, "", ""
    corrido = 0.0
    movs, avisos = [], []
    saldo_columna_final = None
    for n, f in enumerate(filas[ih + 1:], start=ih + 2):
        fecha, comp, det = g(f, "FECHA"), norm(g(f, "FACT/REC")), norm(g(f, "DETALLE"))
        kilos, precio, uni, cant = num(g(f, "KILOS")), num(g(f, "PRECIO")), num(g(f, "UNI")), num(g(f, "CANT"))
        sub, tot, debe, haber, saldo = num(g(f, "SUBTOTAL")), num(g(f, "TOTAL RTO")), num(g(f, "DEBE")), num(g(f, "HABER")), num(g(f, "SALDO"))
        cli = norm(g(f, "CLIENTE"))
        if not any([det, kilos, precio, uni, cant, debe, haber, comp]) :
            continue
        if isinstance(fecha, datetime.datetime):
            fecha_actual = fecha
            comp_actual = ""
        if comp:
            comp_actual = comp
        if cli:
            cliente_actual = cli
        d = det.upper()
        base = {"fila": n, "fecha": fecha_iso(fecha_actual), "fecha_propia": isinstance(fecha, datetime.datetime), "comprobante": comp, "detalle": det, "cliente": cliente_actual,
                "uni": uni, "cant": cant, "kilos": kilos, "precio": precio, "subtotal": sub, "total": tot, "debe": debe, "haber": haber, "saldo_hoja": saldo}
        if d.startswith("SALDO"):
            tipo = "saldo"
        elif re.match(r"^PAGO\b", d) or d.startswith("PAGO"):
            tipo = "pago"
        elif kilos and precio and not haber:
            tipo = "item"
        else:
            tipo = "otro"
        base["tipo"] = tipo
        movs.append(base)
    # saldo final de la hoja: último valor numérico de la columna SALDO en filas con movimiento
    ult = [x["saldo_hoja"] for x in movs if x["saldo_hoja"] is not None]
    # (también puede haber filas "vacías" con el saldo arrastrado: las usamos de respaldo)
    arrastre = [num(g(f, "SALDO")) for f in filas[ih + 1:] if num(g(f, "SALDO")) is not None]
    resultado.append({
        "numero": numero, "hoja": ws.title, "resto": resto, "titulo": titulo, "columnas": [c for c in cab if c],
        "movs": movs, "saldo_final_hoja": (arrastre[-1] if arrastre else None),
    })

resultado.sort(key=lambda r: r["numero"])
json.dump(resultado, open(salida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("hojas de cliente:", len(resultado), "| números:", resultado[0]["numero"], "a", resultado[-1]["numero"])
faltan = sorted(set(range(1, resultado[-1]["numero"] + 1)) - {r["numero"] for r in resultado})
rep = sorted({r["numero"] for r in resultado if [x["numero"] for x in resultado].count(r["numero"]) > 1})
print("números sin hoja:", faltan, "| repetidos:", rep)
from collections import Counter
print("tipos de fila:", dict(Counter(x["tipo"] for r in resultado for x in r["movs"])))
print("variantes de columnas:", len({tuple(r["columnas"]) for r in resultado}))
for v in sorted({tuple(r["columnas"]) for r in resultado}):
    print("  ", [r["numero"] for r in resultado if tuple(r["columnas"]) == v][:6], "...", v)
