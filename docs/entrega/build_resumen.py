"""
PDF de entrega de Carnes Rosales: resumen del sistema (qué hace cada pantalla, funcionalidades,
estado y próximas etapas). Basado en la plantilla del resumen de EzMel, con los colores de Carnes Rosales.

Uso:
  pip install reportlab pillow
  python build_resumen.py

Las capturas están en ./capturas (se sacan del sistema en modo demo).
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
                                TableStyle, Image, KeepTogether, HRFlowable, CondPageBreak)
from reportlab.lib.utils import ImageReader
from reportlab.graphics.shapes import Drawing, PolyLine
from PIL import Image as PILImage

AQUI = os.path.dirname(os.path.abspath(__file__))
CAPTURAS = os.path.join(AQUI, "capturas")
TMP = os.path.join(AQUI, "_tmp")
OUT = os.path.join(AQUI, "CarnesRosales-resumen-sistema.pdf")
os.makedirs(TMP, exist_ok=True)

NAVY = colors.HexColor("#1c1d4a")      # índigo oscuro (marca)
BLUE = colors.HexColor("#2b2d6e")      # color principal
ACCENT = colors.HexColor("#aab4f7")
INK = colors.HexColor("#0c111c")
MUTED = colors.HexColor("#64748b")
LINE = colors.HexColor("#cfd2ec")
GREEN = colors.HexColor("#15803d")
SOFT = colors.HexColor("#eeeffa")
AZUL_HEX = "#2b2d6e"

W, H = A4
M = 22 * mm
CONTENT_W = W - 2 * M

kicker = ParagraphStyle("kicker", fontName="Helvetica-Bold", fontSize=8.5, textColor=ACCENT, leading=11)
title = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=24, textColor=colors.white, leading=29)
sub = ParagraphStyle("sub", fontName="Helvetica", fontSize=11, textColor=colors.HexColor("#dfe2fb"), leading=15)
h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=15, textColor=NAVY, leading=19, spaceBefore=14)
body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.6, textColor=colors.HexColor("#334155"), leading=14)
small = ParagraphStyle("small", fontName="Helvetica", fontSize=8.6, textColor=MUTED, leading=12)
caption = ParagraphStyle("caption", fontName="Helvetica-Oblique", fontSize=8.4, textColor=MUTED, leading=11, spaceBefore=4, spaceAfter=10)
item = ParagraphStyle("item", parent=body, leftIndent=11, bulletIndent=0)
check_t = ParagraphStyle("check_t", fontName="Helvetica-Bold", fontSize=10, textColor=INK, leading=13)
check_d = ParagraphStyle("check_d", fontName="Helvetica", fontSize=9, textColor=MUTED, leading=12.5)


def tick():
    """Tilde verde dibujado como vector (no depende de que la fuente tenga el símbolo)."""
    d = Drawing(11, 11)
    d.add(PolyLine([1, 5.5, 4.2, 2, 10, 9.5], strokeColor=GREEN, strokeWidth=1.8, strokeLineCap=1, strokeLineJoin=1))
    return d


def heading(text):
    return [Paragraph(text, h2), HRFlowable(width="100%", thickness=2, color=BLUE, spaceBefore=3, spaceAfter=9)]


def bullet(label, text):
    return Paragraph(f'<font color="{AZUL_HEX}">•</font>&nbsp;&nbsp;<b>{label}</b> — {text}', item)


def check(titulo, desc):
    inner = [Paragraph(titulo, check_t), Paragraph(desc, check_d)]
    t = Table([[tick(), inner]], colWidths=[8 * mm, CONTENT_W - 8 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 0)]))
    return t


def status_line(text):
    t = Table([[tick(), Paragraph(text, body)]], colWidths=[8 * mm, CONTENT_W - 8 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 5), ("TOPPADDING", (0, 0), (-1, -1), 0)]))
    return t


def callout(titulo, texto, color):
    inner = [Paragraph(f'<font color="{color}"><b>{titulo}</b></font>', ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=8.8, leading=12, spaceAfter=3)),
             Paragraph(texto, body)]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f6f6fd")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, colors.HexColor(color)),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9)]))
    return t


def modulo(nombre, etiqueta, resumen, funciones):
    """Bloque de una sección futura: cabecera con nombre y etiqueta, resumen y lista de funciones."""
    cab = Table([[Paragraph(nombre, ParagraphStyle("mn", fontName="Helvetica-Bold", fontSize=10.5, textColor=NAVY, leading=14)),
                  Paragraph(etiqueta, ParagraphStyle("mp", fontName="Helvetica-Bold", fontSize=8.6, textColor=BLUE, leading=14, alignment=2))]],
                colWidths=[CONTENT_W - 52 * mm, 52 * mm])
    cab.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SOFT), ("LINEBEFORE", (0, 0), (0, -1), 3, BLUE),
                             ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                             ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                             ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    bloque = [cab, Spacer(1, 5), Paragraph(resumen, body), Spacer(1, 3)]
    for f in funciones:
        bloque.append(Paragraph(f'<font color="{AZUL_HEX}">•</font>&nbsp;&nbsp;{f}', item))
    bloque.append(Spacer(1, 11))
    return KeepTogether(bloque)


def prepare(nombre, recorte=None, calidad=88):
    """Pasa la captura a JPEG liviano (y la recorta si hace falta) para no inflar el PDF."""
    src = os.path.join(CAPTURAS, nombre)
    dst = os.path.join(TMP, os.path.splitext(nombre)[0] + ".jpg")
    im = PILImage.open(src).convert("RGB")
    if recorte:
        im = im.crop(recorte)
    im.save(dst, "JPEG", quality=calidad, optimize=True)
    return dst


def framed(path, width_mm):
    iw, ih = ImageReader(path).getSize()
    w = width_mm * mm
    img = Image(path, width=w, height=w * ih / iw)
    frame = Table([[img]], colWidths=[w + 4])
    frame.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 2),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 2),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    frame.hAlign = "LEFT"
    return frame


def figure(path, width_mm, text):
    return KeepTogether([framed(path, width_mm), Paragraph(text, caption)])


def header_block():
    inner = [Spacer(1, 14), Paragraph("RESUMEN DEL SISTEMA · PRIMERA ETAPA", kicker), Spacer(1, 6),
             Paragraph("Carnes Rosales — Clientes, cuentas corrientes, ventas y pagos", title), Spacer(1, 8),
             Paragraph("Qué hace cada pantalla, cómo se trabaja, en qué estado está y qué queda para las próximas etapas.", sub),
             Spacer(1, 16)]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY), ("LEFTPADDING", (0, 0), (-1, -1), 18),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 18), ("TOPPADDING", (0, 0), (-1, -1), 10),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(M, 16 * mm, W - M, 16 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(M, 11.5 * mm, "Resumen del sistema — Carnes Rosales.")
    canvas.drawRightString(W - M, 11.5 * mm, f"Página {doc.page}")
    canvas.restoreState()


# ── Capturas (2160 x 1410); se recorta el espacio vacío de abajo cuando sobra ──
IMG = {
    "login": prepare("01-login.png"),
    "inicio": prepare("02-inicio.png", (0, 0, 2160, 900)),
    "clientes": prepare("03-clientes.png", (0, 0, 2160, 1000)),
    "filtros": prepare("04-filtros.png"),
    "cuenta": prepare("05-cuenta-corriente.png"),
    "venta": prepare("06-registrar-venta.png", (0, 0, 2160, 1240)),
    "pago": prepare("07-registrar-pago.png"),
    "pagos": prepare("08-pagos.png", (0, 0, 2160, 1000)),
    "usuarios": prepare("09-usuarios.png", (0, 0, 2160, 1000)),
    "invitar": prepare("10-invitar.png", (0, 0, 2160, 1000)),
    "stock": prepare("11-stock.png", (0, 0, 2160, 900)),
    "proveedores": prepare("12-proveedores.png", (0, 0, 2160, 900)),
}

story = [header_block(), Spacer(1, 6)]

story += heading("Qué es")
story.append(Paragraph(
    "Un sistema web para Carnes Rosales que reemplaza la planilla de Excel de cuentas corrientes. Guarda los clientes, cada venta "
    "(remito) y cada pago, y calcula solo cuánto debe cada cliente. Se usa desde la computadora, la tablet o el celular, con usuario y contraseña.", body))

story += heading("Cómo se trabaja: de la venta al cobro")
for label, text in [
    ("1. Se ingresa con usuario y contraseña", "cada persona tiene su cuenta y su rol (administrador, vendedor o solo lectura)."),
    ("2. Se busca al cliente", "en <b>Clientes</b>, con el buscador o con los filtros por localidad, saldo y último pago. Al tocarlo se abre su cuenta corriente."),
    ("3. Se registra la venta", "con la fecha, el número de remito y los productos: kilos y precio por kilo de cada uno. El total se calcula solo y se suma al saldo del cliente."),
    ("4. Se registra el pago", "con la fecha, el número de recibo, el importe y el medio de pago (efectivo, cheque o billetera virtual). Antes de guardar se ve cómo queda el saldo."),
    ("5. Se consulta", "el <b>Inicio</b> muestra lo vendido, los kilos por corte, lo cobrado y lo que falta cobrar. En <b>Pagos</b> están todos los cobros juntos, para cerrar la caja."),
    ("6. Se le manda el resumen al cliente", "desde su cuenta corriente se descarga un <b>PDF</b> con sus compras, sus pagos y el saldo adeudado."),
]:
    story.append(bullet(label, text))
    story.append(Spacer(1, 3.5))

story += heading("Pantallas del sistema")
story.append(Paragraph("Menú a la izquierda (se puede plegar para ganar lugar) y, en cada pantalla, un panel de opciones a la derecha. En el celular el menú es desplegable.", body))
story.append(Spacer(1, 6))
for label, text in [
    ("Ingreso", "pantalla de acceso con email y contraseña. Incluye «¿Olvidaste tu contraseña?» y «Creá tu cuenta» para quienes fueron invitados."),
    ("Inicio", "tablero del negocio. Arriba se elige el período (semana, mes, trimestre, semestre o año) y las tarjetas muestran el total vendido, los kilos vendidos, lo cobrado y el total a cobrar. Debajo, una tarjeta por cada corte con sus kilos, el importe y el precio promedio. A la derecha, los cobros por medio de pago y los clientes con mayor saldo."),
    ("Clientes", "lista de clientes con número, nombre de fantasía, titular, localidad, último pago y saldo adeudado. Tiene buscador y un botón de filtros (localidad, saldo, último pago y orden). Desde el panel derecho se da de alta un cliente nuevo, con su saldo anterior si ya debía algo."),
    ("Cuenta corriente del cliente", "se abre al tocar un cliente. Arriba, cuatro tarjetas: saldo adeudado, compras, pagado y último pago. Debajo, el <b>historial de movimientos</b> con las mismas columnas de la planilla (fecha, comprobante, concepto, medio de pago, kilos, precio por kilo, subtotal, total compra, pago entrante y saldo adeudado), filtros por período y el botón <b>Descargar PDF</b>. En el panel derecho: registrar venta, registrar pago, editar los datos del cliente y ver sus datos."),
    ("Registrar venta", "formulario del remito: fecha, número y uno o más productos. El producto se elige de la lista o se escribe uno nuevo."),
    ("Registrar pago", "formulario del recibo: fecha, número, importe y medio de pago. Muestra el saldo actual y el saldo después del pago."),
    ("Pagos", "todos los pagos recibidos, de todos los clientes, en una sola lista. Se filtra por período, por medio de pago y por cliente o número de recibo, con el total cobrado y el total de cada medio."),
    ("Usuarios", "solo para el administrador: lista de usuarios con su rol y su estado, cambio de rol, dar o quitar el acceso, e invitar a una persona nueva."),
]:
    story.append(bullet(label, text))
    story.append(Spacer(1, 3.5))

story += heading("Funcionalidades")
for t_, d_ in [
    ("Ingreso seguro con usuarios y roles", "Email y contraseña, con recuperación de contraseña por email. Tres roles: <b>administrador</b> (hace todo, incluido borrar y administrar usuarios), <b>vendedor</b> (carga y corrige clientes, ventas y pagos; no borra) y <b>solo lectura</b> (consulta). Los permisos se aplican en las pantallas, en cada operación y en la propia base de datos."),
    ("Alta de usuarios por invitación", "El administrador invita con el email y el rol; la persona se registra con ese email y entra directamente con su rol. Quien se registra sin invitación queda sin acceso hasta que el administrador lo habilite."),
    ("Clientes", "Alta y edición con los datos de la planilla: nombre de fantasía, titular, dirección, localidad, C.U.I.T., contacto y observaciones. La numeración sigue sola."),
    ("Filtros de clientes", "Por localidad (varias a la vez), por saldo (con saldo pendiente o al día) y por último pago (pagó en los últimos 7 o 30 días, no paga hace más de 30 días, o sin pagos). También se ordena por mayor saldo o por último pago."),
    ("Ventas con varios productos", "Un remito puede tener varios cortes, cada uno con sus kilos y su precio por kilo. El subtotal de cada renglón y el total se calculan solos."),
    ("Pagos con medio de pago", "Cada pago registra si fue en efectivo, con cheque o por billetera virtual, y se ve en el historial del cliente y en la pantalla de Pagos."),
    ("Saldo siempre calculado", "El saldo no se escribe a mano: sale de sumar el saldo anterior y las ventas, y restar los pagos. Si se corrige o se elimina un movimiento, el saldo se recalcula solo."),
    ("Corregir y eliminar", "Las ventas y los pagos se pueden corregir (fecha, comprobante, productos, importe, medio de pago). Eliminar un movimiento queda reservado al administrador."),
    ("Resumen de cuenta en PDF", "Con los datos del cliente, el saldo anterior, las compras, los pagos y el saldo adeudado, para descargar y enviarle. Respeta el período elegido."),
    ("Quién cargó cada cosa", "Cada movimiento guarda qué usuario lo cargó, y se ve en la columna «Cargó»."),
    ("Tablero de inicio", "Total vendido, kilos vendidos por corte, cobrado por medio de pago y saldos a cobrar, por semana, mes, trimestre, semestre o año."),
    ("Celular, tablet y computadora", "Las pantallas se adaptan al tamaño, y los calendarios y las listas desplegables tienen el mismo estilo del sistema."),
]:
    story.append(check(t_, d_))

story.append(CondPageBreak(135 * mm))  # que el título no quede solo al pie de la página
story += heading("Así se ve")
story.append(figure(IMG["login"], 150, "Ingreso: acceso con email y contraseña."))
story.append(figure(IMG["inicio"], 150, "Inicio: período elegido arriba, tarjetas con los totales, una tarjeta por corte y, a la derecha, cobros por medio de pago y mayores saldos."))
story.append(figure(IMG["clientes"], 150, "Clientes: buscador, botón de filtros y lista con último pago y saldo adeudado. A la derecha, las opciones y el resumen."))
story.append(figure(IMG["filtros"], 150, "Filtros de clientes: localidad, saldo adeudado, último pago y orden de la lista."))
story.append(figure(IMG["cuenta"], 150, "Cuenta corriente de un cliente: tarjetas con el saldo y el historial de movimientos, con filtros por período y descarga en PDF."))
story.append(figure(IMG["venta"], 150, "Registrar venta: fecha, número de remito y productos con sus kilos y su precio por kilo."))
story.append(figure(IMG["pago"], 150, "Registrar pago: importe, medio de pago y saldo después del pago, con el calendario del sistema."))
story.append(figure(IMG["pagos"], 150, "Pagos: todos los cobros con el total y el desglose por medio de pago."))
story.append(figure(IMG["usuarios"], 150, "Usuarios (solo administrador): rol y estado de cada usuario, e invitaciones pendientes. Ejemplo con datos ficticios."))
story.append(figure(IMG["invitar"], 150, "Invitar usuario: email y rol con el que va a entrar."))

story.append(CondPageBreak(70 * mm))
story += heading("Estado actual")
story.append(status_line("<b>Las pantallas de la primera etapa están programadas y probadas</b> con los datos de la planilla, en modo de demostración."))
story.append(status_line("La base de datos está diseñada y probada: tablas, permisos por rol y carga inicial de la planilla con control de totales (el saldo coincide con el Excel)."))
story.append(Spacer(1, 4))
story.append(callout(
    "FALTA PARA EMPEZAR A USARLO",
    "<b>Conectar la base de datos real:</b> crear el proyecto de Supabase, cargar la estructura y publicar el sistema con sus claves. "
    "<b>Cargar la planilla completa:</b> hoy están cargados los clientes y la cuenta corriente que se usaron de muestra; falta el resto de los clientes y sus movimientos. "
    "<b>Definir la lista de cortes</b> que se venden, para que cada uno tenga su tarjeta en el Inicio.",
    AZUL_HEX))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Los servicios de terceros que usa el sistema (base de datos y publicación online) tienen planes gratuitos que alcanzan para empezar.", small))

story.append(CondPageBreak(95 * mm))
story += heading("Próximas etapas")
story.append(Paragraph(
    "Lo que sigue queda fuera de la primera etapa. Stock y Proveedores ya tienen un adelanto armado, que figura en el menú como «Próxima etapa».", body))
story.append(Spacer(1, 8))

story.append(modulo(
    "Stock de mercadería y lista de precios", "SEGUNDA ETAPA · CON ADELANTO",
    "Saber cuántos kilos hay de cada corte sin contarlos a mano todos los días.",
    [
        "El stock entra con cada compra de mercadería y sale solo con los kilos de cada venta.",
        "Ajuste por conteo: se carga lo que hay de verdad y el sistema registra la diferencia (merma).",
        "Arranca en cero: cada corte empieza a llevar stock desde su primera carga.",
        "Lista de precios por corte: al vender, el precio se completa solo. Muestra el último costo y el margen por kilo.",
        "Tarjetas de stock por corte en el Inicio.",
    ]))
story.append(modulo(
    "Proveedores y cuentas a pagar", "SEGUNDA ETAPA · CON ADELANTO",
    "Lo mismo que la cuenta corriente de los clientes, pero al revés: a quién se le compra y cuánto se le debe.",
    [
        "Cada compra de mercadería queda asociada a su proveedor, con los kilos y el costo.",
        "Cuentas a pagar: lo comprado menos lo ya pagado a cada proveedor.",
        "Registro de los pagos a proveedores, con fecha, importe y medio de pago.",
    ]))
story.append(figure(IMG["stock"], 150, "Adelanto de Stock: una tarjeta por corte con los kilos disponibles. Ejemplo con datos ficticios."))
story.append(figure(IMG["proveedores"], 150, "Adelanto de Proveedores: cuentas a pagar con lo comprado, lo pagado y el saldo. Ejemplo con datos ficticios."))

story.append(modulo(
    "Avisos de cobro y de pago", "TERCERA ETAPA",
    "Que el sistema avise cuando pasó el plazo, en lugar de tener que revisar cliente por cliente.",
    [
        "Aviso cuando pasaron 7 días desde la compra de un cliente y todavía no pagó.",
        "El mismo aviso para los pagos a proveedores, a los 7 días de la compra.",
        "Forma de aviso a definir: lista de avisos dentro del sistema y mensaje de WhatsApp ya armado para enviar con un botón.",
    ]))
story.append(modulo(
    "Planilla de empleados", "TERCERA ETAPA",
    "Registro informativo de los pagos a empleados.",
    [
        "Fecha y monto de cada pago, por empleado.",
        "Solo para consulta: no genera recibos de sueldo ni liquidaciones.",
    ]))
story.append(modulo(
    "Gastos de la empresa", "TERCERA ETAPA",
    "Documentar mes a mes en qué se gasta.",
    [
        "Carga de cada gasto por rubro: luz, combustible, y los que se definan.",
        "Total de gastos del mes y por rubro.",
        "Tarjeta de gastos del mes en el Inicio.",
    ]))

doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=14 * mm, bottomMargin=22 * mm,
                      title="Carnes Rosales — Resumen del sistema", author="Ezequiel Dehnike")
doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(M, 22 * mm, CONTENT_W, H - 36 * mm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=footer)])
doc.build(story)
print("ok", OUT, round(os.path.getsize(OUT) / 1024 / 1024, 2), "MB")
