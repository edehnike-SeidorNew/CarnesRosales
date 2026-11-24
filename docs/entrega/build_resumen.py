"""
PDF de entrega de Carnes Rosales: resumen del sistema (qué hace cada pantalla, funcionalidades, estado,
valor estimado de la primera etapa y qué queda para la segunda y la tercera). Basado en la plantilla del
resumen de EzMel, con los colores de Carnes Rosales.

Uso:
  pip install reportlab pillow
  python build_resumen.py

Las capturas están en ./capturas (se sacan del sistema en modo demo).
Los valores se cambian acá abajo: PRECIO_ETAPA_1 y la lista MODULOS.
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

# ── Valores estimados (en pesos argentinos; se cambian acá) ─────────────────
PRECIO_ETAPA_1 = 640000  # 520.000 + 120.000 de avisos de cobro (Cobranzas y WhatsApp)
MODULOS = [
    {"etapa": 2, "nombre": "Stock de mercadería", "precio": 150000},
    {"etapa": 2, "nombre": "Proveedores y cuentas a pagar", "precio": 150000},
    {"etapa": 3, "nombre": "Planilla de empleados", "precio": 80000},
    {"etapa": 3, "nombre": "Gastos de la empresa", "precio": 90000},
]


def pesos_ar(n):
    return "$ " + f"{n:,.0f}".replace(",", ".") + " ARS"


def valor_de(nombre):
    return next(m["precio"] for m in MODULOS if m["nombre"] == nombre)


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
precio_grande = ParagraphStyle("precio_grande", fontName="Helvetica-Bold", fontSize=26, textColor=BLUE, leading=31)


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


def modulo(nombre, etiqueta, resumen, funciones, valor=None):
    """Bloque de una sección futura: cabecera con nombre, etapa y valor, resumen y lista de funciones."""
    derecha = etiqueta + (f"  ·  {pesos_ar(valor)}" if valor else "")
    cab = Table([[Paragraph(nombre, ParagraphStyle("mn", fontName="Helvetica-Bold", fontSize=10.5, textColor=NAVY, leading=14)),
                  Paragraph(derecha, ParagraphStyle("mp", fontName="Helvetica-Bold", fontSize=8.6, textColor=BLUE, leading=14, alignment=2))]],
                colWidths=[CONTENT_W - 78 * mm, 78 * mm])
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
             Paragraph("Carnes Rosales — Clientes, cuentas corrientes, ventas, remitos y pagos", title), Spacer(1, 8),
             Paragraph("Qué hace cada pantalla, cómo se trabaja, en qué estado está, cuánto vale la primera etapa y qué queda para la segunda y la tercera.", sub),
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
    "inicio": prepare("02-inicio.png"),
    "clientes": prepare("03-clientes.png"),
    "filtros": prepare("04-filtros.png"),
    "cuenta": prepare("05-cuenta-corriente.png"),
    "venta": prepare("06-registrar-venta.png"),
    "pago": prepare("07-registrar-pago.png"),
    "pagos": prepare("08-pagos.png"),
    "remitos": prepare("09-remitos.png", (0, 0, 2160, 1000)),
    "remito_pdf": prepare("12-remito-pdf.png"),
    "cobranzas": prepare("13-cobranzas.png", (0, 0, 2160, 1410)),
    "aviso": prepare("14-aviso-whatsapp.png", (0, 0, 2160, 1010)),
    "productos": prepare("10-productos.png"),
    "usuarios": prepare("11-usuarios.png", (0, 0, 2160, 1000)),
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
    ("3. Se registra la venta", "con la fecha, el número de remito y los productos. El producto se busca por nombre o por rubro (o se escribe uno personalizado) y el precio de la lista se completa solo, aunque se puede cambiar en esa venta. El total se calcula y se suma al saldo del cliente."),
    ("4. Se entrega el remito", "cada venta queda como un <b>remito</b>: se ve en pantalla, se imprime o se descarga en PDF con el logo y los datos del cliente, listo para firmar."),
    ("5. Se registra el pago", "con la fecha, el número de recibo, el importe y el medio de pago (efectivo, cheque o billetera virtual). Si el cliente paga con varios medios a la vez, se agrega una fila por cada uno. Antes de guardar se ve cómo queda el saldo."),
    ("6. Descuentos y cargos", "lo que resta del saldo sin ser plata cobrada (un descuento, un retiro de mercadería) y lo que suma sin ser una venta (un préstamo) se cargan aparte, para no mezclarlos con lo cobrado ni con lo vendido."),
    ("7. Se consulta", "el <b>Inicio</b> muestra lo vendido, los kilos por producto, lo cobrado y lo que falta cobrar. En <b>Pagos</b> están todos los cobros juntos, para cerrar la caja."),
    ("8. Se le manda el resumen al cliente", "desde su cuenta corriente se descarga un <b>PDF</b> con el saldo adeudado y el detalle de sus compras y pagos."),
    ("9. Se cobra lo atrasado", "en <b>Cobranzas</b> figuran los clientes que compraron y llevan 7, 10, 15, 30 o más de 30 días sin pagar (o todos los que deben), con lo que deben y su teléfono. Desde ahí se les manda un <b>mensaje de recordatorio por WhatsApp</b> con el monto y la fecha de la compra, que se puede editar antes de enviarlo."),
]:
    story.append(bullet(label, text))
    story.append(Spacer(1, 3.5))

story += heading("Pantallas del sistema")
story.append(Paragraph("Menú a la izquierda (se puede plegar para ganar lugar) y, en cada pantalla, un panel de opciones a la derecha. En el celular el menú es desplegable.", body))
story.append(Spacer(1, 6))
for label, text in [
    ("Ingreso", "pantalla de acceso con el logo y una foto de la marca. Email y contraseña, «¿Olvidaste tu contraseña?» y «Crear cuenta» para quienes fueron invitados."),
    ("Inicio", "tablero del negocio. Arriba se elige el período (hoy, semana, mes, trimestre, semestre, año o un día puntual con calendario) y las tarjetas muestran el total vendido, los kilos vendidos, lo cobrado y el total a cobrar. Debajo, los kilos vendidos por producto, agrupados por rubro (vacuno, cerdo, pollo, embutidos): cada rubro muestra los 4 productos más vendidos y un «Mostrar más», y se puede cerrar. A la derecha, los cobros por medio de pago y los clientes con mayor saldo."),
    ("Clientes", "lista de clientes con número, nombre, titular, localidad, último pago y saldo adeudado. Tiene buscador y un botón de filtros (localidad, saldo, último pago y orden). Desde el panel derecho se da de alta un cliente nuevo, con su saldo anterior si ya debía algo."),
    ("Cuenta corriente del cliente", "se abre al tocar un cliente. Arriba, cuatro tarjetas: saldo adeudado, compras, pagado y último pago. Debajo, el <b>historial de movimientos</b> con las columnas de la planilla (fecha, comprobante, concepto, medio de pago, kilos, precio por kilo, subtotal, total compra, pago entrante y saldo adeudado), filtros por período y los botones <b>Imprimir</b> y <b>Descargar PDF</b>. En el panel derecho: registrar venta, pago, descuento o cargo, mandarle un <b>aviso de cobro por WhatsApp</b>, editar los datos del cliente y ver sus datos."),
    ("Registrar venta", "formulario del remito: fecha, número y uno o más productos. El producto se elige con un <b>buscador</b> (por nombre o por rubro, con filtros por rubro y el precio de lista a la vista), o con «Agregar producto personalizado» si no está en la lista."),
    ("Registrar pago", "formulario del recibo: fecha, número y una o más filas de medio de pago e importe (con «Agregar otro medio de pago»). Muestra el total del cobro, el saldo actual y el saldo después del pago."),
    ("Remitos", "todas las ventas como remitos, con filtro por período y buscador por cliente, número o producto. De cada uno se puede ver, imprimir, descargar en PDF, <b>enviar por WhatsApp</b>, <b>editar</b> y eliminar. El PDF sale en una hoja apaisada con el <b>original y el duplicado</b> lado a lado. «Nuevo remito» abre la cuenta del cliente elegido con la venta lista para cargar."),
    ("Productos", "lista de productos con su rubro y su precio por kilo. El administrador los edita, crea productos nuevos y elimina los que todavía no tienen ventas; el precio de lista es el que se sugiere al vender. Los demás usuarios la ven pero no la cambian."),
    ("Cobranzas", "los clientes que ya pasaron 7 días sin pagar, como tarjetas rojas con el nombre, el teléfono, el monto adeudado a la fecha y desde qué compra. Un filtro elige el plazo (7, 10, 15, 30, más de 30 días o todos los que deben), y arriba se ve cuántos clientes son, cuánto suman y el total a cobrar, que coincide con el del Inicio. Cada tarjeta lleva a la cuenta del cliente o directo al mensaje de WhatsApp."),
    ("Pagos", "todos los pagos recibidos, de todos los clientes, en una sola lista. Se filtra por período, por medio de pago y por cliente o número de recibo, con el total cobrado y el total de cada medio."),
    ("Usuarios", "solo para el administrador: lista de usuarios con su rol y su estado, cambio de rol, dar o quitar el acceso, e invitar a una persona nueva."),
]:
    story.append(bullet(label, text))
    story.append(Spacer(1, 3.5))

story += heading("Funcionalidades")
for t_, d_ in [
    ("Ingreso seguro con usuarios y roles", "Email y contraseña, con recuperación de contraseña por email. Tres roles: <b>administrador</b> (hace todo, incluido borrar, administrar usuarios y cambiar rubros y precios), <b>vendedor</b> (carga y corrige clientes, ventas y pagos; no borra) y <b>solo lectura</b> (consulta). Los permisos se aplican en las pantallas, en cada operación y en la propia base de datos."),
    ("Alta de usuarios por invitación", "El administrador invita con el email y el rol; la persona se registra con ese email y entra directamente con su rol. Quien se registra sin invitación queda sin acceso hasta que el administrador lo habilite."),
    ("Clientes y filtros", "Alta, edición y baja con los datos de la planilla (nombre, titular, dirección, localidad, C.U.I.T., contacto y observaciones). Filtros por localidad, saldo y último pago, y orden por mayor saldo o por último pago. Los listados con período (Inicio, Pagos, Remitos y cuenta del cliente) se filtran por hoy, semana, mes, trimestre, semestre, año o un día puntual con calendario."),
    ("Ventas con varios productos y buscador", "Un remito puede tener varios productos, cada uno con sus kilos y su precio por kilo. El producto se busca por nombre o por rubro; si no está, se escribe uno personalizado. El precio de lista se sugiere solo y se puede cambiar en esa venta (el sistema avisa cuando se usa otro precio)."),
    ("Remitos en PDF, original y duplicado", "Cada venta tiene su remito, en una hoja apaisada con dos copias iguales lado a lado (original y duplicado): logo, datos del cliente, renglones, total en letras y lugar para la firma. Se imprime o se descarga, se corrige con «Editar» y se elimina con confirmación."),
    ("Remito por WhatsApp", "Se escribe el teléfono del cliente y se abre WhatsApp con el detalle del remito ya armado (productos, kilos, importes y total). El número se acomoda solo: con 0, con 15 o con +54 9."),
    ("Cobranzas: clientes que no pagaron", "Pantalla con los clientes que llevan 7, 10, 15, 30 o más de 30 días sin pagar (o todos los que deben), en tarjetas rojas con su teléfono, el monto adeudado a la fecha y la compra más vieja sin cubrir. Los pagos y descuentos se aplican primero a lo más viejo."),
    ("Mensaje de cobro por WhatsApp", "Desde Cobranzas o desde la cuenta del cliente se arma el mensaje de recordatorio con el monto y la fecha de la compra, y se abre WhatsApp listo para enviar. El texto se puede editar antes de mandarlo; si el contacto no está cargado se escribe el nombre y el teléfono, y los días sin pagar se pueden cambiar."),
    ("Productos, rubros y precios de lista", "Cada producto tiene su rubro y su precio por kilo, que el administrador cambia desde la pantalla Productos. Con eso se agrupa el tablero de Inicio y se completa el precio al vender."),
    ("Pagos con medio de pago", "Cada pago registra si fue en efectivo, con cheque o por billetera virtual. Un mismo cobro se puede repartir en varios medios (por ejemplo, parte en efectivo y parte en cheque): se guardan juntos, con la misma fecha y número de recibo, y se ven en el historial del cliente y en la pantalla de Pagos."),
    ("Descuentos y cargos", "Los descuentos y retiros restan del saldo sin contar como plata cobrada; los cargos (por ejemplo, un préstamo) suman al saldo sin contar como venta ni como kilos. Así el Inicio y los totales de Pagos no se distorsionan."),
    ("Saldo siempre calculado", "El saldo no se escribe a mano: sale de sumar el saldo anterior, las ventas y los cargos, y restar los pagos y los descuentos. Si se corrige o se elimina un movimiento, el saldo se recalcula solo."),
    ("Corregir y eliminar con confirmación", "Las ventas, los pagos, los descuentos y los cargos se pueden corregir. Eliminar queda reservado al administrador y siempre pide confirmación en un cuadro propio, con el logo, antes de borrar."),
    ("Avisos en pantalla", "Cada acción importante muestra un aviso arriba de todo («Venta registrada», «Pago registrado», «Remito eliminado»…), y los errores también."),
    ("Resumen de cuenta en PDF", "Con el logo, los datos del cliente, el saldo adeudado y el detalle de compras y pagos, para descargar y enviarle o para imprimir. Respeta el período elegido, incluso un día puntual."),
    ("Quién cargó cada cosa", "Cada movimiento guarda qué usuario lo cargó, y se ve en la columna «Cargó»."),
    ("Carga inicial desde la planilla", "Se cargan los 94 clientes de la planilla con todo su historial (saldo anterior, ventas, pagos, descuentos y cargos), con un cotejo hoja por hoja contra el Excel que se está terminando de revisar."),
    ("Celular, tablet y computadora", "Las pantallas se adaptan al tamaño: en el celular las tablas se ven como tarjetas (se baja con el dedo en vez de scrollear hacia los costados), los menús de opciones aparecen plegados y los importes entran completos. Los calendarios y las listas desplegables tienen el mismo estilo del sistema."),
]:
    story.append(check(t_, d_))

story.append(CondPageBreak(135 * mm))  # que el título no quede solo al pie de la página
story += heading("Así se ve")
story.append(figure(IMG["login"], 150, "Ingreso: el logo y una foto de la marca, con acceso por email y contraseña."))
story.append(figure(IMG["inicio"], 150, "Inicio: período elegido arriba, tarjetas con los totales y, por rubro, los 4 productos más vendidos con «Mostrar más». A la derecha, cobros por medio de pago y mayores saldos."))
story.append(figure(IMG["clientes"], 150, "Clientes: buscador, botón de filtros y lista con último pago y saldo adeudado. A la derecha, las opciones y el resumen."))
story.append(figure(IMG["filtros"], 150, "Filtros de clientes: localidad, saldo adeudado, último pago y orden de la lista."))
story.append(figure(IMG["cuenta"], 150, "Cuenta corriente de un cliente: tarjetas con el saldo y el historial de movimientos, con filtros por período y descarga en PDF."))
story.append(figure(IMG["venta"], 150, "Registrar venta: el selector de producto con buscador, filtros por rubro y el precio de lista de cada producto."))
story.append(figure(IMG["pago"], 150, "Registrar pago repartido en dos medios (efectivo y cheque): cada fila con su importe, el total del cobro y el saldo después del pago."))
story.append(figure(IMG["remitos"], 150, "Remitos: todas las ventas, con buscador y filtro por período; de cada una se puede ver, imprimir, descargar y eliminar."))
story.append(figure(IMG["remito_pdf"], 150, "Remito en PDF: hoja apaisada con el original y el duplicado lado a lado, con logo, datos del cliente, renglones, total en letras y lugar para la firma."))
story.append(figure(IMG["productos"], 150, "Productos: rubro y precio por kilo de cada producto, para el administrador. El resto de los usuarios los ve sin editar."))
story.append(figure(IMG["cobranzas"], 150, "Cobranzas (filtro «+ 30 días»): clientes que llevan más de 30 días sin pagar, con su teléfono, el monto adeudado y la compra más vieja sin cubrir. Los botones cambian el plazo (7, 10, 15, 30, más de 30 días o todos); arriba, cuántos clientes son, cuánto suman y el total a cobrar."))
story.append(figure(IMG["aviso"], 150, "Mensaje de cobro por WhatsApp, desde la cuenta del cliente: nombre, teléfono y días sin pagar editables, y el mensaje armado con el monto y la fecha de la compra, que se puede modificar antes de enviar."))
story.append(figure(IMG["pagos"], 150, "Pagos: todos los cobros con el total y el desglose por medio de pago."))
story.append(figure(IMG["usuarios"], 150, "Usuarios (solo administrador): rol y estado de cada usuario, e invitaciones pendientes. Ejemplo con datos ficticios."))

story.append(CondPageBreak(70 * mm))
story += heading("Estado actual")
story.append(status_line("<b>Las pantallas de la primera etapa están programadas y probadas</b> con los datos reales de la planilla, en modo de demostración."))
story.append(status_line("La base de datos está diseñada y probada: tablas, permisos por rol y la carga de los <b>94 clientes</b> con su historial completo (813 movimientos), con un control de saldo cliente por cliente."))
story.append(status_line("Se están terminando de cotejar los saldos de los 94 clientes contra la planilla."))
story.append(Spacer(1, 6))

story.append(CondPageBreak(75 * mm))  # el bloque de valor no se parte entre dos páginas
story += heading("Valor estimado de la primera etapa")
story.append(Paragraph(pesos_ar(PRECIO_ETAPA_1), precio_grande))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Incluye el diseño y el desarrollo completo de lo que se describe en este resumen: ingreso con usuarios y roles, clientes y cuentas corrientes, "
    "ventas con buscador de productos, pagos, descuentos y cargos, remitos en PDF apaisado (original y duplicado) con impresión, envío por WhatsApp y edición, productos con rubros y precios de lista, cobranzas con mensajes de recordatorio por WhatsApp a los clientes que no pagaron, tablero de inicio, "
    "resumen de cuenta en PDF, y la carga de los 94 clientes de la planilla, con el cotejo de sus saldos.", body))
story.append(Spacer(1, 3))
story.append(Paragraph("Valor estimado, en pesos argentinos. No incluye los servicios de terceros (base de datos y publicación), que tienen planes gratuitos para empezar.", small))

story.append(CondPageBreak(95 * mm))
story += heading("Próximas etapas")
story.append(Paragraph(
    "Lo que sigue queda fuera de la primera etapa y se puede contratar por separado. La segunda etapa completa la operación con la mercadería y los proveedores; "
    "la tercera suma el personal y los gastos.", body))
story.append(Spacer(1, 8))

story.append(modulo(
    "Stock de mercadería", "SEGUNDA ETAPA",
    "Saber cuántos kilos hay de cada corte sin contarlos a mano todos los días. La lista de precios por producto ya está en la primera etapa.",
    [
        "El stock entra con cada compra de mercadería y sale solo con los kilos de cada venta.",
        "Ajuste por conteo: se carga lo que hay de verdad y el sistema registra la diferencia (merma).",
        "Arranca en cero: cada corte empieza a llevar stock desde su primera carga.",
        "Aviso en la venta cuando se vende más de lo que figura en stock, y último costo y margen por kilo.",
        "Tarjetas de stock por producto en el Inicio.",
    ], valor=valor_de("Stock de mercadería")))
story.append(modulo(
    "Proveedores y cuentas a pagar", "SEGUNDA ETAPA",
    "Lo mismo que la cuenta corriente de los clientes, pero al revés: a quién se le compra y cuánto se le debe.",
    [
        "Cada compra de mercadería queda asociada a su proveedor, con los kilos y el costo.",
        "Cuentas a pagar: lo comprado menos lo ya pagado a cada proveedor.",
        "Registro de los pagos a proveedores, con fecha, importe y medio de pago.",
        "Aviso de pago a proveedores: el sistema avisa cuando pasaron 7 días desde la compra y todavía no se le pagó, en lugar de tener que revisar proveedor por proveedor (el mismo aviso de Cobranzas, pero para los pagos).",
        "Forma de aviso a definir: lista de avisos dentro del sistema y mensaje de WhatsApp ya armado para enviar con un botón.",
    ], valor=valor_de("Proveedores y cuentas a pagar")))

story.append(modulo(
    "Planilla de empleados", "TERCERA ETAPA",
    "Registro informativo de los pagos a empleados.",
    [
        "Fecha y monto de cada pago, por empleado.",
        "Solo para consulta: no genera recibos de sueldo ni liquidaciones.",
    ], valor=valor_de("Planilla de empleados")))
story.append(modulo(
    "Gastos de la empresa", "TERCERA ETAPA",
    "Documentar mes a mes en qué se gasta.",
    [
        "Carga de cada gasto por rubro: luz, combustible, y los que se definan.",
        "Total de gastos del mes y por rubro.",
        "Tarjeta de gastos del mes en el Inicio.",
    ], valor=valor_de("Gastos de la empresa")))

# ── Resumen de valores ──
story.append(CondPageBreak(95 * mm))
story += heading("Resumen de valores estimados")
total_2 = sum(m["precio"] for m in MODULOS if m["etapa"] == 2)
total_3 = sum(m["precio"] for m in MODULOS if m["etapa"] == 3)
der = ParagraphStyle("der", parent=body, alignment=2)
der_b = ParagraphStyle("der_b", parent=body, alignment=2, fontName="Helvetica-Bold")
bold = ParagraphStyle("bold", parent=body, fontName="Helvetica-Bold")
filas = [[Paragraph("<b>Etapa y módulo</b>", small), Paragraph("<b>Valor estimado</b>", ParagraphStyle("r", parent=small, alignment=2))]]
filas.append([Paragraph("Primera etapa — sistema completo descripto en este resumen", bold), Paragraph(pesos_ar(PRECIO_ETAPA_1), der_b)])
for etapa, total in ((2, total_2), (3, total_3)):
    filas.append([Paragraph(f"{'Segunda' if etapa == 2 else 'Tercera'} etapa", bold), Paragraph(pesos_ar(total), der_b)])
    for m in MODULOS:
        if m["etapa"] == etapa:
            filas.append([Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;" + m["nombre"], body), Paragraph(pesos_ar(m["precio"]), der)])
filas.append([Paragraph("<b>Total de las tres etapas</b>", bold), Paragraph(pesos_ar(PRECIO_ETAPA_1 + total_2 + total_3), der_b)])
t = Table(filas, colWidths=[CONTENT_W - 50 * mm, 50 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SOFT), ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
    ("BACKGROUND", (0, -1), (-1, -1), SOFT), ("LINEABOVE", (0, -1), (-1, -1), 1.2, BLUE),
    ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
story.append(t)
story.append(Spacer(1, 6))
story.append(Paragraph("Valores estimados, en pesos argentinos. Cada etapa se puede contratar por separado y los módulos pueden cambiar de etapa o de alcance si se definen distinto.", small))

doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=14 * mm, bottomMargin=22 * mm,
                      title="Carnes Rosales — Resumen del sistema", author="Ezequiel Dehnike")
doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(M, 22 * mm, CONTENT_W, H - 36 * mm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=footer)])
doc.build(story)
print("ok", OUT, round(os.path.getsize(OUT) / 1024 / 1024, 2), "MB")
