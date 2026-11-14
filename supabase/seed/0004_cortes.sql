-- Carnes Rosales — catálogo inicial de cortes.
-- Correr DESPUÉS de 0003_stock_usuarios_roles.sql. Se puede correr más de una vez: no duplica.
--
-- OJO: esta lista NO sale de la planilla. En las capturas de la planilla sólo figuran Picada y
-- Vacíos; los otros seis son la lista de ejemplo de la primera demo. Revisarla antes de correr:
-- borrar los renglones que no correspondan y agregar los que falten.
-- Cada corte del catálogo tiene su card en el Inicio y en Stock.

begin;

select public.producto_por_nombre(corte)
from (values
  ('Picada'),
  ('Vacíos'),
  ('Asado'),
  ('Nalga'),
  ('Cuadril'),
  ('Bola de lomo'),
  ('Matambre'),
  ('Milanesa')
) as lista (corte);

commit;

-- Para ver cómo quedó:
-- select nombre, precio from public.productos order by nombre;
