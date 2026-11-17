"""Genera el SQL de carga: por cada hoja de cliente, el cliente y enseguida sus movimientos, uno por uno.

Uso: python -I generar_clientes.py plan.json planilla.xlsx proyecto/  [informe.json]
Salida: <proyecto>/supabase/seed/0005_clientes_y_ventas.sql
"""
import sys, io, json, re, unicodedata
from collections import Counter
from openpyxl import load_workbook

plan = json.load(open(sys.argv[1], encoding="utf-8"))
wb = load_workbook(sys.argv[2], data_only=True)
raiz = sys.argv[3]
AUTOR = "renzo_rosales@hotmail.es"

sql = lambda s: "'" + str(s).replace("'", "''") + "'"
plata = lambda n: f"{n:.2f}"
sin_tildes = lambda s: "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
norm = lambda v: " ".join(str(v).split()) if v is not None else ""

# ── Nombres de producto: un solo nombre por corte, aunque la planilla lo escriba de varias formas ──
ALIAS = {
    "B DE LOMO": "BOLA DE LOMO", "B.DE LOMO": "BOLA DE LOMO", "B. DE LOMO": "BOLA DE LOMO", "B.DELOMO": "BOLA DE LOMO",
    "CUDRADA": "CUADRADA", "VACIOS": "VACIO", "BIIFE": "BIFE", "ASADOS": "ASADO", "PECHOS": "PECHO", "PECHO VACUNO": "PECHO",
    "ENTRAÑAS": "ENTRAÑA", "BODIOLA": "BONDIOLA", "CHINCHU": "CHINCHULIN",
    "T/ASADO": "TAPA DE ASADO", "T. DE ASADO": "TAPA DE ASADO", "TAPA ASADO": "TAPA DE ASADO", "T/NALGA": "TAPA DE NALGA",
    "P/MUSLO": "PATA MUSLO", "PATA Y MUSLO": "PATA MUSLO", "CJ P/MUSLO": "PATA MUSLO", "CJ PATA MUSLO": "PATA MUSLO",
    "SALCHICHA": "SALCHICHA PARRILERA", "SALCHICHA PARR": "SALCHICHA PARRILERA", "MORC VASCA": "MORCILLA VASCA",
    "1/2 R": "MEDIA RES", "1/2R": "MEDIA RES", "1/2 RES": "MEDIA RES", "2/2 R": "MEDIA RES", "1/2 R (SIN RAL)": "MEDIA RES",
    "1/2 CERDO": "MEDIA RES DE CERDO", "1 CERDO": "CERDO",
    "3/2 CAPON": "CAPON", "CAPON 1/2": "CAPON",
    "PALETA CERDO": "PALETA DE CERDO", "PECHITO DE CERDO": "PECHITO", "BIFE CHORIZO": "BIFE DE CHORIZO", "COLITA CUADRIL": "COLITA DE CUADRIL",
    "CJ POLLO": "POLLO", "CORDEROS": "CORDERO", "CORDER0S": "CORDERO", "DELANTEROS": "DELANTERO", "POLLO CJ": "POLLO", "CJ SUPREMA": "SUPREMA", "ASARUEDA": "ASA/RUEDA",
}
# Rubro de los nombres que no están en la lista de precios (los de la lista ya lo traen del 0004).
RUBRO = {
    "Vacuno": ["ASADO", "BIFE", "PICADA", "LOMO", "NALGA", "DELANTERO", "MEDIA RES", "CHINCHULIN", "RIÑON", "TAPA DE ASADO", "TAPA DE NALGA", "COLITA DE CUADRIL", "BIFE DE CHORIZO", "BOLA DE LOMO", "CUADRADA", "ENTRAÑA", "VACIO", "ROAST BEEF", "PECHO", "MATAMBRE", "PECETO", "CUADRIL", "MOCHO", "PARRILLERO", "RUEDA", "OSOBUCO", "FALDA", "ESPINAZO", "ASADO BIFE", "ASADO C/VACIO", "ASA/MATAMBRE", "ASA/RUEDA", "BIFE S/L", "BOLA DE LOMO/CUADRADA", "BOLA DE LOMO/TAPA", "CUAD/BOLA DE LOMO", "COLITA/PECETO", "PALETA/ROAST BEEF", "PALETA"],
    "Cerdo": ["MEDIA RES DE CERDO", "CERDO", "CAPON", "PECHITO", "CARRE", "JAMON", "BONDIOLA", "PALETA DE CERDO", "PARRILLERO CERDO", "JAMON Y PALETA"],
    "Pollo": ["SUPREMA", "PATA MUSLO", "POLLO", "POLLO (POR UNIDAD)", "PATA MUSLO (POR UNIDAD)"],
    "Embutidos y chacinados": ["CHORIZO", "MORCILLA", "MORCILLA VASCA", "SALCHICHA PARRILERA"],
    "Cordero": ["CORDERO"],
}


def producto(det, precio):
    n = norm(det).upper()
    unidad = n.endswith("(POR UNIDAD)")
    n = n.replace("(POR UNIDAD)", "").strip()
    if not n:
        return "SIN DETALLE" + (" (POR UNIDAD)" if unidad else "")
    n = re.sub(r"\s*/\s*", "/", n)
    n = re.sub(r"B\.? ?DE ?LOMO", "BOLA DE LOMO", n).replace("B.LOMO", "BOLA DE LOMO")
    if n not in ALIAS:
        m = re.match(r"^\d+\s*(?:CJ\s+)?(.+)$", n)
        if m and not re.match(r"^\d+/\d+", n):
            n = m.group(1).strip()  # "2 CJ SUPREMA", "4CJ PATA MUSLO", "11 CORDERO": la cantidad ya está en kilos
    n = ALIAS.get(n, n)
    if n == "POLLO" and precio and precio >= 30000:
        unidad = True  # cajón de pollo: el precio es por caja, aunque la planilla le ponga 1 kg
    return n + (" (POR UNIDAD)" if unidad else "")


# ── Localidades y direcciones: se leen del título de cada hoja ──
LOCALIDADES = {"MAR DEL TUYU", "MAR DE AJO", "STA TERESITA", "VILLA CLELIA", "SAN BERNARDO"}
detalles = {}
for f in wb.worksheets[0].iter_rows(min_row=2, values_only=True):
    if isinstance(f[0], (int, float)) and norm(f[1]):
        detalles[int(f[0])] = dict(zip(("nombre", "titular", "direccion", "localidad"), (norm(v) for v in f[1:5])))


def ficha(h):
    nombre = norm(re.sub(r"^\s*\d+\s*", "", h["hoja"])).upper()
    titulo = [norm(t) for t in h["titulo"]]
    f = {"nombre": nombre, "titular": "", "direccion": "", "localidad": "", "observaciones": ""}
    notas = []
    if titulo and sin_tildes(titulo[0]).upper() != sin_tildes(nombre).upper():
        notas.append(titulo[0])  # nombre completo que figura en el título de la hoja
    for extra in titulo[1:]:
        e = extra.upper()
        if e in LOCALIDADES:
            f["localidad"] = f["localidad"] or extra
        elif e.endswith(" STA TERESITA"):
            f["direccion"] = f["direccion"] or extra[: -len(" STA TERESITA")].strip()
            f["localidad"] = f["localidad"] or "STA TERESITA"
        elif e.startswith("CALLE "):
            f["direccion"] = f["direccion"] or extra
        else:
            notas.append(extra)
    # La hoja "CLIENTES DETALLES" sólo se usa si habla del mismo cliente (el nombre o el titular está en el título).
    d = detalles.get(h["numero"])
    if d and any(d[k] for k in ("titular", "direccion", "localidad")):
        texto = sin_tildes(" ".join(titulo)).upper()
        if (d["nombre"] and sin_tildes(d["nombre"]).upper() in texto) or (d["titular"] and sin_tildes(d["titular"].split()[-1]).upper() in texto):
            f["titular"] = d["titular"]
            f["direccion"] = f["direccion"] or d["direccion"]
            f["localidad"] = f["localidad"] or d["localidad"]
    f["observaciones"] = " · ".join(notas)
    return f


# Datos sueltos en el encabezado de una hoja (un teléfono, por ejemplo): se guardan como observación.
EXTRA_ENCABEZADO = {}
for ws in wb.worksheets:
    m = re.match(r"\s*(\d+)", ws.title)
    if not m:
        continue
    for f in ws.iter_rows(min_row=2, max_row=2, values_only=True):
        for c in f:
            if isinstance(c, (int, float)) and len(str(int(c))) >= 8:
                EXTRA_ENCABEZADO[int(m.group(1))] = str(int(c))

informe = {"creditos": Counter(), "creditos_importe": Counter(), "medios": Counter(), "productos": Counter(), "unidad": [], "fechas": [], "omitidas": [], "sin_medio": 0, "pagos": 0, "descuentos": 0, "cargos": 0, "ventas": 0}
o = io.StringIO()
total_esperado = 0.0
bloques = []

for h in plan:
    n = h["numero"]
    f = ficha(h)
    if n in EXTRA_ENCABEZADO:
        f["observaciones"] = (f["observaciones"] + " · " if f["observaciones"] else "") + f"Número suelto en la hoja: {EXTRA_ENCABEZADO[n]}"
    esperado = round(h["saldo_hoja"], 2)
    total_esperado += esperado
    b = io.StringIO()
    movs = 0
    b.write(f"-- {'═' * 74}\n-- CLIENTE {n} · {f['nombre']}   (hoja \"{h['hoja'].strip()}\")\n-- {'═' * 74}\n")
    b.write("begin;\ndo $carga$\ndeclare\n  v_id    uuid;\n  v_saldo numeric;\n  v_cant  integer;\n  v_autor constant text := " + sql(AUTOR) + ";\nbegin\n")
    b.write(f"  if exists (select 1 from public.clientes where numero = {n}) then\n    raise notice 'Cliente {n} ({f['nombre']}): ya estaba cargado, se saltea.';\n    return;\n  end if;\n\n")
    b.write(f"  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)\n  values ({n}, {sql(f['nombre'])}, {sql(f['titular'])}, {sql(f['direccion'])}, {sql(f['localidad'])}, {sql(f['observaciones'])}, v_autor)\n  returning id into v_id;\n\n")
    if h["saldo_anterior"] != 0:
        partes = " + ".join(f"{p['detalle'] or 'SALDO'} {p['importe']:g}" for p in h["saldo_partes"])
        b.write(f"  -- Saldo anterior (fila de la hoja: {partes})\n")
        b.write(f"  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '{h['fecha_saldo']}', 'saldo_inicial', {plata(h['saldo_anterior'])});\n")
        movs += 1
    for e in h["eventos"]:
        corr = f" · fecha original de la planilla: {e['fecha_original']}" if e.get("fecha_original") else ""
        if e.get("fecha_original"):
            informe["fechas"].append((n, e["fecha_original"], e["fecha"]))
        if e["clase"] == "venta":
            items = []
            for i in e["items"]:
                nombre = producto(i["detalle"], i["precio"])
                informe["productos"][nombre] += 1
                if i["por_unidad"]:
                    informe["unidad"].append((n, nombre, i["kilos"], i["precio"]))
                assert i["kilos"] > 0 and i["precio"] > 0, (n, i)
                items.append((nombre, round(i["kilos"], 3), round(i["precio"], 2), i["detalle"]))
            texto = " + ".join(f"{x[0]} {x[1]:g} {'u' if '(POR UNIDAD)' in x[0] else 'kg'} x {x[2]:g}" for x in items)
            cargo = " (cargo sin producto en la planilla)" if e.get("cargo") else ""
            b.write(f"\n  -- fila {e['fila']} · {e['fecha']} · remito {e['comprobante'] or 's/n'}{cargo}{corr}\n  --   {texto}\n")
            js = json.dumps([{"detalle": x[0], "kilos": x[1], "precio": x[2]} for x in items], ensure_ascii=False)
            b.write(f"  perform public.registrar_venta(v_id, '{e['fecha']}', {sql(e['comprobante'])}, {sql(js)}::jsonb);\n")
            informe["ventas"] += 1
        elif e["clase"] == "cargo":
            informe["cargos"] += 1
            b.write(f"\n  -- fila {e['fila']} · {e['fecha']} · CARGO \"{e['detalle']}\" (suma al saldo, no es una venta de productos){corr}\n")
            b.write(f"  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '{e['fecha']}', 'cargo', {sql(e['comprobante'])}, {plata(e['importe'])}, {sql(e['detalle'])});\n")
        else:
            medio = None  # El Excel no trae el medio de pago: queda vacío y se completa después.
            det = f"\"{e['detalle']}\"" if e.get("detalle") else ""
            if e["clase"] == "credito":
                # Descuentos, retiros y consumos: restan del saldo pero NO son plata cobrada, van como "descuento".
                informe["creditos"][e["tipo_credito"]] += 1
                informe["creditos_importe"][e["tipo_credito"]] += e["importe"]
                informe["descuentos"] += 1
                b.write(f"\n  -- fila {e['fila']} · {e['fecha']} · DESCUENTO ({e['tipo_credito']}) {det}{corr}\n")
                b.write(f"  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '{e['fecha']}', 'descuento', {sql(e['comprobante'])}, {plata(e['importe'])}, {sql(e['detalle'])});\n")
            else:
                informe["pagos"] += 1
                informe["medios"][medio or "sin especificar"] += 1
                b.write(f"\n  -- fila {e['fila']} · {e['fecha']} · PAGO {det}{corr}\n")
                m_sql = f"'{medio}'" if medio else "null"
                b.write(f"  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '{e['fecha']}', 'pago', {sql(e['comprobante'])}, {plata(e['importe'])}, {m_sql});\n")
        movs += 1
    for om in h["omitidas"]:
        informe["omitidas"].append((n, om["fila"], om["detalle"], om["motivo"]))
        b.write(f"\n  -- fila {om['fila']} · \"{om['detalle']}\": {om['motivo']}. No se carga.\n")
    b.write("\n  -- Todo lo de este cliente figura a nombre de quien hace la carga.\n  update public.movimientos set creado_por = v_autor where cliente_id = v_id;\n\n")
    b.write(f"  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.\n")
    b.write(f"  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;\n")
    b.write(f"  if v_saldo is distinct from {plata(esperado)} then\n    raise exception 'Cliente {n} ({f['nombre']}): el saldo dio %, la planilla dice {plata(esperado)}', v_saldo;\n  end if;\n")
    b.write(f"  select count(*) into v_cant from public.movimientos where cliente_id = v_id;\n")
    b.write(f"  if v_cant <> {movs} then\n    raise exception 'Cliente {n} ({f['nombre']}): se cargaron % movimientos y esperaba {movs}', v_cant;\n  end if;\n")
    b.write(f"  raise notice 'Cliente {n} ({f['nombre']}): ok · {movs} movimientos · saldo {plata(esperado)}';\nend\n$carga$;\ncommit;\n\n")
    bloques.append(b.getvalue())

# Rubro de los productos nuevos (los de la lista de precios ya lo traen del 0004).
rubros = []
for rubro, nombres in RUBRO.items():
    for nombre in nombres:
        rubros.append(f"    ({sql(rubro)}, {sql(nombre)})")

o.write(f"""-- Carnes Rosales — carga de clientes y sus ventas y pagos, desde la planilla "CARNES ROSALES VENTAS (1).xlsx".
-- Archivo generado desde la planilla: no editar a mano.
--
-- ORDEN: correr DESPUÉS de 0001_esquema.sql, 0003_stock_usuarios_roles.sql y 0004_cortes.sql.
-- Se corre en el SQL Editor de Supabase, pegando todo y tocando Run.
--
-- CÓMO CARGA: un cliente por vez, en este orden: se crea el cliente (con el nombre de su hoja y el N° de la
-- hoja) y enseguida sus movimientos, en el orden de la hoja: saldo anterior, ventas (con sus renglones) y pagos.
-- Cada cliente va en su propia transacción y termina con un control: el saldo tiene que dar EXACTAMENTE el
-- de la columna SALDO de su hoja. Si no da, ese cliente no queda cargado y la carga se frena avisando cuál.
-- Si se frena, se corrige y se vuelve a correr todo: los clientes que ya estaban cargados se saltean solos.
--
-- QUIÉN FIGURA COMO AUTOR: todo se carga a nombre de {AUTOR}, para que en el historial de
-- cada cliente (columna "Cargó") se vea quién lo cargó.
--
-- INCLUYE las 94 hojas: las numeradas del 1 al 90 y, en el orden de la hoja SALDOS, 91 AMERICO, 92 DAVID R,
-- 93 KOKI y 94 VARIOS. Los 94 saldos coinciden con la hoja SALDOS.
--
-- DECISIONES DE CARGA (todas visibles en los comentarios de cada cliente):
--   * Pagos: el Excel no trae el medio de pago, así que todos quedan "sin especificar" y se completa después.
--     Lo que decía la planilla (EFVO, TRANSF, CH...) figura en el comentario de cada pago.
--   * Descuentos, retiros y consumos ("RETIRO ASADO", "DESCUENTO", "COMIDA"...): restan al saldo pero NO son
--     plata cobrada, así que se cargan aparte, como "descuento" (con lo que decía la planilla en la nota).
--     No suman a lo cobrado ni a la lista de pagos.
--   * Productos con precio por caja o unidad (sin kilos): van como "<producto> (POR UNIDAD)", con la cantidad
--     de cajas en la columna de kilos.
--   * Un cargo sin producto en el DEBE ("SABORES DEL CAMPO", "PRESTAMO", "FABIAN"...) se carga como "cargo": suma al
--     saldo pero no es una venta de productos (no cuenta en lo vendido ni en los kilos). Un importe de arrastre
--     ("SALDO MELLI", "AMS SALDO", o el que está arriba de todo sin fecha) va como saldo anterior.
--   * Un producto con kilos pero sin precio escrito toma el precio del importe de la fila (DEBE / kilos).
--   * VARIOS junta a varios clientes chicos en una sola hoja: se carga como una sola cuenta.
--   * Una línea que la propia planilla no suma a su saldo se deja afuera y queda anotada (VARIOS, matambre de ROSALES).
--   * Fechas imposibles de la planilla (2016, enero, junio, 23/11): se usa la fecha del movimiento anterior.
--   * Filas de PAGO sin importe: se omiten (la planilla tampoco las suma).

""")
o.write("""-- Aviso claro si todavía no se corrió 0003 (agrega "quién cargó" y los permisos).
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movimientos' and column_name = 'creado_por') then
    raise exception 'Falta correr antes 0001, 0003 y 0004 (en ese orden).';
  end if;
end $$;

""")
o.write("".join(bloques))
o.write(f"""-- {'═' * 74}
-- Rubro de los productos que no están en la lista de precios
-- {'═' * 74}
begin;
update public.productos p
set categoria = r.categoria
from (values
{",\n".join(rubros)}
) as r (categoria, nombre)
where lower(p.nombre) = lower(r.nombre) and p.categoria = '';
commit;

-- {'═' * 74}
-- {AUTOR} como administrador
-- Si todavía no se registró en la app, queda invitado como administrador: cuando se registre con ese
-- mismo email entra directo con todos los permisos. Si ya se había registrado, se lo habilita acá.
-- {'═' * 74}
begin;
insert into public.invitaciones (email, rol)
select {sql(AUTOR)}, 'admin'
where not exists (select 1 from public.perfiles where lower(email) = {sql(AUTOR)})
on conflict do nothing;
update public.perfiles set rol = 'admin', activo = true where lower(email) = {sql(AUTOR)};
commit;

-- {'═' * 74}
-- Resumen final: tienen que ser {len(plan)} clientes y un saldo total de {plata(total_esperado)}.
-- {'═' * 74}
select count(*) as clientes, sum(saldo) as saldo_total from public.saldos_clientes;
-- Para ver cliente por cliente:
-- select numero, nombre_fantasia, saldo from public.saldos_clientes order by numero;
""")
ruta = raiz + "/supabase/seed/0005_clientes_y_ventas.sql"
io.open(ruta, "w", encoding="utf-8", newline="\n").write(o.getvalue())

# ── lib/datos.ts: la demo muestra exactamente lo mismo que carga el SQL ──
datos_ts = raiz + "/lib/datos.ts"
previo = io.open(datos_ts, encoding="utf-8").read()
catalogo = previo[previo.index("/** Lista de precios de la planilla"):]
ts = lambda v: json.dumps(v, ensure_ascii=False)
num = lambda x: str(int(x)) if float(x) == int(x) else repr(round(float(x), 3))

t = io.StringIO()
t.write('''import type { Cliente, Movimiento } from "./tipos";

// Datos de la demo, generados desde la planilla "CARNES ROSALES VENTAS (1).xlsx" (no editar a mano): son los MISMOS
// que carga supabase/seed/0005_clientes_y_ventas.sql. Una cuenta por hoja (1 a 94), con su saldo anterior, sus ventas,
// sus pagos, descuentos y cargos, tal como figuran en la planilla.

const cliente = (numero: number, nombreFantasia: string, titular = "", direccion = "", localidad = "", observaciones = ""): Cliente => ({
  id: String(numero),
  numero,
  nombreFantasia,
  titular,
  direccion,
  localidad,
  cuit: "",
  contacto: "",
  observaciones,
});

export const CLIENTES: Cliente[] = [
''')
fichas = []
for h in plan:
    f = ficha(h)
    if h["numero"] in EXTRA_ENCABEZADO:
        f["observaciones"] = (f["observaciones"] + " · " if f["observaciones"] else "") + f"Número suelto en la hoja: {EXTRA_ENCABEZADO[h['numero']]}"
    resto = [f["titular"], f["direccion"], f["localidad"], f["observaciones"]]
    while resto and resto[-1] == "":
        resto.pop()
    t.write("  cliente(" + ", ".join([str(h["numero"]), ts(f["nombre"])] + [ts(x) for x in resto]) + "),\n")
t.write('''];

type SinAutor<T> = T extends unknown ? Omit<T, "creadoPor"> : never;

const BASE: SinAutor<Movimiento>[] = [
''')
mid = 0
for h in plan:
    cid = str(h["numero"])
    if h["saldo_anterior"] != 0:
        mid += 1
        t.write(f'  {{ id: "m{mid}", clienteId: "{cid}", fecha: "{h["fecha_saldo"]}", tipo: "saldo_inicial", comprobante: "", importe: {num(h["saldo_anterior"])} }},\n')
    for e in h["eventos"]:
        mid += 1
        if e["clase"] == "venta":
            its = ", ".join(f'{{ detalle: {ts(producto(i["detalle"], i["precio"]))}, kilos: {num(round(i["kilos"], 3))}, precio: {num(round(i["precio"], 2))} }}' for i in e["items"])
            t.write(f'  {{ id: "m{mid}", clienteId: "{cid}", fecha: "{e["fecha"]}", tipo: "venta", comprobante: {ts(e["comprobante"])}, items: [{its}] }},\n')
        elif e["clase"] == "pago":
            t.write(f'  {{ id: "m{mid}", clienteId: "{cid}", fecha: "{e["fecha"]}", tipo: "pago", comprobante: {ts(e["comprobante"])}, importe: {num(e["importe"])}, medioPago: null }},\n')
        else:  # crédito -> descuento; cargo -> cargo
            tipo = "descuento" if e["clase"] == "credito" else "cargo"
            t.write(f'  {{ id: "m{mid}", clienteId: "{cid}", fecha: "{e["fecha"]}", tipo: "{tipo}", comprobante: {ts(e["comprobante"])}, importe: {num(e["importe"])}, nota: {ts(e["detalle"])} }},\n')
t.write(f'''];

// Todo figura cargado por Renzo, igual que en el script de la base.
export const MOVIMIENTOS: Movimiento[] = BASE.map((m) => ({{ ...m, creadoPor: "{AUTOR}" }}) as Movimiento);

''')
t.write(catalogo)
io.open(datos_ts, "w", encoding="utf-8", newline="\n").write(t.getvalue())
print("demo:", datos_ts, "| movimientos:", mid)


print("archivo:", ruta, "| tamaño KB:", round(len(o.getvalue().encode("utf-8")) / 1024), "| clientes:", len(plan), "| total esperado:", plata(total_esperado))
print("ventas:", informe["ventas"], "| pagos:", informe["pagos"], "| descuentos:", informe["descuentos"], "| cargos:", informe["cargos"], "| créditos:", dict(informe["creditos"]), {k: round(v) for k, v in informe["creditos_importe"].items()})
print("medios:", dict(informe["medios"]))
print("productos distintos:", len(informe["productos"]))
for nombre, c in sorted(informe["productos"].items(), key=lambda x: (-x[1], x[0])):
    print(f"  {c:4} {nombre}")
print("renglones por unidad:", len(informe["unidad"]))
json.dump({k: (dict(v) if isinstance(v, Counter) else v) for k, v in informe.items()}, open(sys.argv[4], "w", encoding="utf-8"), ensure_ascii=False, indent=1) if len(sys.argv) > 4 else None
