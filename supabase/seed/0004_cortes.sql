-- Carnes Rosales — catálogo de productos con su precio de lista.
-- Correr DESPUÉS de 0003_stock_usuarios_roles.sql. Se puede correr más de una vez: no duplica
-- (vuelve a poner la categoría y el precio de la lista).
-- Archivo generado desde la hoja "LISTA DE PRECIOS" de la planilla (lista del 2026-11-07).
--
-- Ajustes respecto de la planilla, para que cada producto tenga un nombre único:
--   * "Media Res" de 100/110/120/130 kg (sin precio) quedó como una sola entrada por rubro:
--     MEDIA RES (vacuno) y MEDIA RES DE CERDO.
--   * PALETA figura en vacuno y en cerdo: la de cerdo quedó como PALETA DE CERDO.
--   * "ROAST BEFF" se corrigió a ROAST BEEF.
-- Cada producto del catálogo tiene su tarjeta en el Inicio y en Stock.

-- Aviso claro si todavía no se corrió 0003 (agrega el rubro y el precio a los productos).
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'productos' and column_name = 'categoria') then
    raise exception 'Falta correr antes 0003_stock_usuarios_roles.sql.';
  end if;
end $$;

-- Una sola sentencia (sin tablas temporales: el SQL Editor de Supabase no las conserva entre sentencias):
-- crea cada producto si no existe y, si ya existe, le actualiza el rubro y el precio.
insert into public.productos (categoria, nombre, precio) values
  ('Vacuno', 'MEDIA RES', null::numeric),
  ('Vacuno', 'MOCHO', 11000.00),
  ('Vacuno', 'RUEDA', 11000.00),
  ('Vacuno', 'PARRILLERO', 13900.00),
  ('Vacuno', 'PECHO', 8900.00),
  ('Vacuno', 'NALGA C/T', 16900.00),
  ('Vacuno', 'NALGA S/T', 19000.00),
  ('Vacuno', 'TAPA DE NALGA', 13500.00),
  ('Vacuno', 'PECETO', 18500.00),
  ('Vacuno', 'CUADRIL', 15900.00),
  ('Vacuno', 'COLITA DE CUADRIL', 19000.00),
  ('Vacuno', 'CUADRADA', 15500.00),
  ('Vacuno', 'BOLA DE LOMO', 15500.00),
  ('Vacuno', 'ASADO C/V Y M', 15500.00),
  ('Vacuno', 'ASADO PLANCHA', 14500.00),
  ('Vacuno', 'VACIO', 16900.00),
  ('Vacuno', 'MATAMBRE', 16900.00),
  ('Vacuno', 'ENTRAÑA', 26000.00),
  ('Vacuno', 'TAPA DE ASADO', 13500.00),
  ('Vacuno', 'BIFE A 13 S/LOMO', 14500.00),
  ('Vacuno', 'BIFE A 7 C/LOMO', 15500.00),
  ('Vacuno', 'BIFE ANCHO', 14500.00),
  ('Vacuno', 'OJO DE BIFE', 18500.00),
  ('Vacuno', 'BIFE DE CHORIZO', 24000.00),
  ('Vacuno', 'LOMO C/CORDON', 26000.00),
  ('Vacuno', 'PALETA', 13500.00),
  ('Vacuno', 'ROAST BEEF', 13500.00),
  ('Vacuno', 'TORTUGUITA', 13500.00),
  ('Vacuno', 'PALOMITA', 13500.00),
  ('Vacuno', 'OSOBUCO', 7000.00),
  ('Vacuno', 'FALDA', 7000.00),
  ('Vacuno', 'PICADA DE ROAST BEEF', 13500.00),
  ('Vacuno', 'PICADA COMUN', 11500.00),
  ('Vacuno', 'ESPINAZO', 5000.00),
  ('Cerdo', 'MEDIA RES DE CERDO', null::numeric),
  ('Cerdo', 'CAPON', 4500.00),
  ('Cerdo', 'PECHITO', 7500.00),
  ('Cerdo', 'CARRE', 7500.00),
  ('Cerdo', 'PECHITO Y CARRE (CONJUNTO)', 7000.00),
  ('Cerdo', 'JAMON', 5000.00),
  ('Cerdo', 'BONDIOLA', 7900.00),
  ('Cerdo', 'CJ BONDIOLA (CONG)', 7000.00),
  ('Cerdo', 'PALETA DE CERDO', 4800.00),
  ('Cerdo', 'GRASA', 2000.00),
  ('Pollo', 'CJ POLLO (EL PARRILLERO)', 67000.00),
  ('Pollo', 'CJ PATA Y MUSLO X KILO', 3200.00),
  ('Pollo', 'CJ SUPREMA X KILO', 7200.00),
  ('Embutidos y chacinados', 'CHORIZO PURO CERDO', 6900.00),
  ('Embutidos y chacinados', 'SALCHICHA PARRILERA', 9200.00),
  ('Embutidos y chacinados', 'MORCILLA VASCA', 6800.00),
  ('Embutidos y chacinados', 'MORCILLA ROSCA', 4400.00)
on conflict ((lower(nombre))) do update
set categoria = excluded.categoria, precio = excluded.precio;

-- Para ver cómo quedó:
-- select categoria, nombre, precio from public.productos order by categoria, nombre;
