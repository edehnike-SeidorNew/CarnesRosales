# Carga desde la planilla

Genera `supabase/seed/0005_clientes_y_ventas.sql` a partir de la planilla de Excel (una hoja por cliente).
Necesita Python 3 y `openpyxl`. Se corre en este orden, desde la raíz del proyecto:

```bash
python -I herramientas/carga/movs.py   "planilla.xlsx" movs.json
python -I herramientas/carga/plan.py   movs.json plan.json
python -I herramientas/carga/generar_clientes.py plan.json "planilla.xlsx" . informe.json
```

- `movs.py` lee las hojas y clasifica cada fila (saldo, producto, pago, otra cosa).
- `plan.py` arma remitos, pagos y créditos de cada cliente y compara el saldo con la columna SALDO de la hoja.
  Imprime las hojas que no cierran y las filas que omite.
- `generar_clientes.py` escribe el SQL (un bloque por cliente, con su control de saldo). Las reglas están
  documentadas en el encabezado del archivo generado.

No incluye las hojas DAVID R, KOKI, VARIOS ni AMERICO (están en la lista `NO_CLIENTES` de `movs.py`).
