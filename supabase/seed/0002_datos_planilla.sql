-- Carnes Rosales — carga inicial desde la planilla "CARNES ROSALES VENTAS.xlsx".
-- Correr DESPUÉS de 0001_esquema.sql, una sola vez, con la base vacía.
-- Archivo generado desde la planilla: no editar a mano.
--
-- Qué carga:
--   * 89 clientes: una cuenta por cada hoja de la planilla (86 numerados + DAVID ROSALES, KOKI y
--     CLIENTES VARIOS como 87, 88 y 89).
--   * El saldo de cada cuenta al 2026-11-11 (último día con movimientos), como saldo anterior.
--     Es el saldo final de la hoja de cada cliente.
--   * La cuenta completa de El Buen Gusto (hoja "1 BRUNO"), fila por fila.
-- Qué NO carga: el detalle de ventas y pagos de las otras 88 hojas (ver README).
--
-- Todo va en una transacción y termina con un control: cantidad de clientes, saldo de cada uno y
-- total general. Si un número no coincide, se cancela la carga entera.

begin;

-- Freno: no cargar dos veces.
do $$
begin
  if exists (select 1 from public.clientes) or exists (select 1 from public.movimientos) then
    raise exception 'La base ya tiene datos: esta carga es sólo para una base vacía.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------
insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones) values
  (1, 'EL BUEN GUSTO', 'BRUNO', '', '', 'BUEN SABOR'),
  (2, 'EBER', '', '', '', ''),
  (3, 'TOMASA', '', '', '', ''),
  (4, 'FER 222', '', '', '', ''),
  (5, 'LA ROTONDA', 'GONZALO BENITEZ', 'AV. SAN BERNARDO', 'SAN BERNARDO', ''),
  (6, 'FABI TOMI', '', '', '', ''),
  (7, 'NICO PARRI', '', '', '', ''),
  (8, 'CHINO CALLE 8', '', '', '', ''),
  (9, 'AMADEUS', '', '', '', ''),
  (10, 'MERCADO MARIO', '', 'CALLE 3 N°1477', 'STA TERESITA', ''),
  (11, 'EL QUINCHO', '', '', '', ''),
  (12, 'ROTISERIA PATO', '', '', '', ''),
  (13, 'ROTISERIA SAN JUAN', '', '', '', ''),
  (14, 'COSTA DULCE', '', '', '', ''),
  (15, 'RODRIGO PASSINI', '', '', '', ''),
  (16, 'ERIC', '', '', '', ''),
  (17, 'DARIO LEDESMA', '', '', '', ''),
  (18, 'FABI HORIZONTE', '', '', '', ''),
  (19, 'GUILLERMO CHURRUPIT', '', '', '', ''),
  (20, 'LUCHO RAMIREZ', '', '', '', ''),
  (21, 'AVATAR', '', '', '', ''),
  (22, 'B.C CARMONA', '', '', '', ''),
  (23, 'A Y B', '', '', '', ''),
  (24, 'VICCENZO', '', '', '', ''),
  (25, 'MIGUEL SANTA RITA', '', '', '', ''),
  (26, 'MACOCO', '', '', '', ''),
  (27, 'EL TANITO (OSCAR)', '', '', '', ''),
  (28, 'MERC. MITRE', '', '', '', ''),
  (29, 'ALTA GRACIA', '', '', '', ''),
  (30, 'CRISTIAN POSSE', '', '', '', ''),
  (31, 'GUSTAVO MARIEL', '', 'SARMIENTO 825', 'MAR DE AJO', ''),
  (32, 'CHINO CHASCOMUS', '', '', '', ''),
  (33, 'NELDO', '', '', '', ''),
  (34, 'DANI PAVON', '', '', '', 'GARITA 5'),
  (35, 'LA CABAÑITA', '', '', '', ''),
  (36, 'GUSTAVO DE LA REDUCCION', '', '', '', ''),
  (37, 'GONZALO VAZQUEZ', '', '', '', ''),
  (38, 'MARISA AV SAN BERNARDO', '', '', '', ''),
  (39, 'BENDITA ESQUINA', '', '', '', ''),
  (40, 'LA PERLA', '', '', '', ''),
  (41, 'LEO CHINO', '', '', 'MAR DEL TUYU', ''),
  (42, 'PANCHULO', '', '', '', ''),
  (43, 'MAXI', '', '', '', ''),
  (44, 'SEBA 3 M', '', '', '', ''),
  (45, 'FABIAN RAMIREZ', '', '', '', ''),
  (46, 'LA GRAN FAMILIA', '', '', '', ''),
  (47, 'MIGUEL PABON', '', '', '', 'LO DE SOFIA'),
  (48, 'SUPER PAVON', '', '', '', ''),
  (49, 'EL GRAN CHORIPAN', '', '', '', ''),
  (50, 'SAN JOSE', '', '', '', ''),
  (51, 'OVIDIO (WEBER)', '', '', '', 'PAVON'),
  (52, 'EL CENTRAL', '', '', '', ''),
  (53, 'LA ARDILLA', '', '', '', ''),
  (54, 'PABLO', '', '', '', 'MARANO'),
  (55, 'TATA DANIEL', '', '', 'MAR DEL TUYU', ''),
  (56, 'LOS CHICOS', '', '', 'MAR DEL TUYU', ''),
  (57, 'FLACO', '', '', 'VILLA CLELIA', ''),
  (58, 'PABLO NAHIR', '', '', '', ''),
  (59, 'MERCADO PEREZ', '', '', '', ''),
  (60, 'CRISPIN', '', '', 'STA TERESITA', ''),
  (61, 'SUP. EL TATA', '', '', 'MAR DE AJO', ''),
  (62, 'LOS PRIMOS', '', '', 'MAR DE AJO', ''),
  (63, 'SABORES DE CAMPO', '', '', '', ''),
  (64, 'MERC. MODELO MARTIN', '', '', '', ''),
  (65, 'EMANUEL FERNANDO', '', '', 'MAR DEL TUYU', ''),
  (66, 'ABC', '', '', 'MAR DEL TUYU', ''),
  (67, 'MANAOS', '', '', '', ''),
  (68, 'NICO DE PASCUAL', '', '', '', ''),
  (69, 'HOTEL 17 NOVIEMBRE', '', '', '', ''),
  (70, 'PIZZERIA EL MAQUINA', '', 'CALLE 38 N°1321', 'STA TERESITA', ''),
  (71, 'HUEVO DE ORO', '', 'CALLE 41', 'STA TERESITA', ''),
  (72, 'C. PACCINI', '', '', '', 'MERC.LA PAZ'),
  (73, 'MIGUEL 32', '', '', '', ''),
  (74, 'OVIDIO', '', '', '', 'N ATLANTIS'),
  (75, '3 SOLES', '', '', '', ''),
  (76, 'HECTOR CACERES', '', '', '', ''),
  (77, 'LO DE NICO', '', '', '', ''),
  (78, 'PASTA MARISA', '', '', '', 'DE LA REDUCCION'),
  (79, 'LOLO', '', '', '', 'ESQ. LA GRAN FLIA'),
  (80, 'TOP', '', '', '', 'CATALANO'),
  (81, 'LOS HERMANOS', '', '', '', 'NEWBERY Y BELGRANO'),
  (82, 'MAVERICK', '', '', '', ''),
  (83, 'DANELA', '', '', '', ''),
  (84, 'VENDETTA', '', '', '', ''),
  (85, 'CARN. PARAGUAY', '', 'CALLE 41 N°1366', '', ''),
  (86, 'CHICHO', '', '', '', ''),
  (87, 'DAVID ROSALES', '', '', '', 'Cuenta especial de la planilla (fuera de la numeración de clientes)'),
  (88, 'KOKI', '', '', '', 'Cuenta especial de la planilla (fuera de la numeración de clientes)'),
  (89, 'CLIENTES VARIOS', '', '', '', 'Cuenta especial de la planilla (fuera de la numeración de clientes)');

-- Que el próximo cliente nuevo siga la numeración.
select setval(pg_get_serial_sequence('public.clientes', 'numero'), (select max(numero) from public.clientes));

-- ---------------------------------------------------------------------------
-- Cuenta completa de El Buen Gusto (hoja "1 BRUNO") — un movimiento por sentencia, en el orden
-- de la planilla. Los pagos de la planilla no tienen medio de pago: quedan "sin especificar".
-- ---------------------------------------------------------------------------
-- 2026-10-15 · SALDO 77050
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe) values ((select id from public.clientes where numero = 1), '2026-10-15', 'saldo_inicial', '', 77050.00);
-- 2026-10-15 · remito 5575 · PICADA 11.8 kg x 13000 + VACIO 9.6 kg x 16500
select public.registrar_venta((select id from public.clientes where numero = 1), '2026-10-15', '5575', '[{"detalle": "PICADA", "kilos": 11.80, "precio": 13000.00}, {"detalle": "VACIO", "kilos": 9.60, "precio": 16500.00}]'::jsonb);
-- 2026-10-22 · recibo 5539 · PAGO 100000
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe) values ((select id from public.clientes where numero = 1), '2026-10-22', 'pago', '5539', 100000.00);
-- 2026-10-22 · remito 5889 · PICADA 10 kg x 12500
select public.registrar_venta((select id from public.clientes where numero = 1), '2026-10-22', '5889', '[{"detalle": "PICADA", "kilos": 10.00, "precio": 12500.00}]'::jsonb);
-- 2026-10-23 · recibo 5970 · PAGO 100000
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe) values ((select id from public.clientes where numero = 1), '2026-10-23', 'pago', '5970', 100000.00);
-- 2026-10-26 · recibo 5542 · PAGO 180000
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe) values ((select id from public.clientes where numero = 1), '2026-10-26', 'pago', '5542', 180000.00);
-- 2026-11-04 · remito 3077 · PICADA 17 kg x 13000
select public.registrar_venta((select id from public.clientes where numero = 1), '2026-11-04', '3077', '[{"detalle": "PICADA", "kilos": 17.00, "precio": 13000.00}]'::jsonb);
-- 2026-11-11 · remito 2734 · PICADA 15.8 kg x 13000
select public.registrar_venta((select id from public.clientes where numero = 1), '2026-11-11', '2734', '[{"detalle": "PICADA", "kilos": 15.80, "precio": 13000.00}]'::jsonb);

-- ---------------------------------------------------------------------------
-- Saldo de las demás cuentas al 2026-11-11 (saldo final de cada hoja). Las cuentas en cero no
-- llevan movimiento.
-- ---------------------------------------------------------------------------
insert into public.movimientos (cliente_id, fecha, tipo, importe)
select c.id, '2026-11-11', 'saldo_inicial', s.saldo
from (values
  (2, 1292590.00),
  (3, 164200.00),
  (4, 1824354.00),
  (5, 1131031.00),
  (6, 356210.00),
  (7, 627650.00),
  (8, -50.00),
  (9, 1383680.00),
  (10, 601400.00),
  (11, 304800.00),
  (12, 515700.00),
  (13, 902210.00),
  (14, 4054850.00),
  (15, 1339590.00),
  (16, 322700.00),
  (17, 3520.00),
  (18, 2592300.00),
  (19, 1683290.00),
  (20, 411950.00),
  (21, 3111060.00),
  (22, 551750.00),
  (23, 3085271.00),
  (24, 575400.00),
  (25, 5686751.00),
  (26, 393660.00),
  (27, 589410.00),
  (28, 371200.00),
  (30, 1031030.00),
  (32, 309965.00),
  (33, 1875533.00),
  (34, 21730.00),
  (35, 4587930.00),
  (37, 939510.00),
  (38, 926090.00),
  (39, 1300.00),
  (41, 4438999.00),
  (42, 290000.00),
  (43, 3019070.00),
  (44, 1677670.00),
  (45, 540830.00),
  (46, 1396500.00),
  (47, 1207930.00),
  (48, 574150.00),
  (49, 2716080.00),
  (50, 804420.00),
  (51, 968950.00),
  (52, 306110.00),
  (53, 1126480.00),
  (54, 1233750.00),
  (55, 436850.00),
  (56, 340700.00),
  (57, 595660.00),
  (58, 48000.00),
  (59, 1880880.00),
  (60, 213560.00),
  (61, 1823490.00),
  (63, 189000.00),
  (64, 183230.00),
  (65, 100000.00),
  (66, 237530.00),
  (68, 85500.00),
  (70, 505770.00),
  (71, 2313900.00),
  (73, 1972060.00),
  (74, 256500.00),
  (77, 392100.00),
  (79, 108000.00),
  (81, 490320.00),
  (82, 258370.00),
  (83, 291000.00),
  (84, 315000.00),
  (85, 837000.00),
  (86, 292500.00),
  (87, 5845330.00),
  (88, 1542250.00),
  (89, 47960.00)
) as s (numero, saldo)
join public.clientes c on c.numero = s.numero
order by s.numero;

-- ---------------------------------------------------------------------------
-- Control contra la planilla. Si algo no coincide, se cancela toda la carga.
-- ---------------------------------------------------------------------------
do $$
declare
  v_valor numeric;
  v_mal   text;
begin
  select count(*) into v_valor from public.clientes;
  if v_valor <> 89 then raise exception 'Clientes: esperaba 89, hay %', v_valor; end if;

  -- Saldo de cada cuenta contra el saldo final de su hoja.
  select string_agg(format('N° %s: esperaba %s, dio %s', e.numero, e.saldo, s.saldo), '; ') into v_mal
  from (values
    (1, 560250.00),
    (2, 1292590.00),
    (3, 164200.00),
    (4, 1824354.00),
    (5, 1131031.00),
    (6, 356210.00),
    (7, 627650.00),
    (8, -50.00),
    (9, 1383680.00),
    (10, 601400.00),
    (11, 304800.00),
    (12, 515700.00),
    (13, 902210.00),
    (14, 4054850.00),
    (15, 1339590.00),
    (16, 322700.00),
    (17, 3520.00),
    (18, 2592300.00),
    (19, 1683290.00),
    (20, 411950.00),
    (21, 3111060.00),
    (22, 551750.00),
    (23, 3085271.00),
    (24, 575400.00),
    (25, 5686751.00),
    (26, 393660.00),
    (27, 589410.00),
    (28, 371200.00),
    (29, 0.00),
    (30, 1031030.00),
    (31, 0.00),
    (32, 309965.00),
    (33, 1875533.00),
    (34, 21730.00),
    (35, 4587930.00),
    (36, 0.00),
    (37, 939510.00),
    (38, 926090.00),
    (39, 1300.00),
    (40, 0.00),
    (41, 4438999.00),
    (42, 290000.00),
    (43, 3019070.00),
    (44, 1677670.00),
    (45, 540830.00),
    (46, 1396500.00),
    (47, 1207930.00),
    (48, 574150.00),
    (49, 2716080.00),
    (50, 804420.00),
    (51, 968950.00),
    (52, 306110.00),
    (53, 1126480.00),
    (54, 1233750.00),
    (55, 436850.00),
    (56, 340700.00),
    (57, 595660.00),
    (58, 48000.00),
    (59, 1880880.00),
    (60, 213560.00),
    (61, 1823490.00),
    (62, 0.00),
    (63, 189000.00),
    (64, 183230.00),
    (65, 100000.00),
    (66, 237530.00),
    (67, 0.00),
    (68, 85500.00),
    (69, 0.00),
    (70, 505770.00),
    (71, 2313900.00),
    (72, 0.00),
    (73, 1972060.00),
    (74, 256500.00),
    (75, 0.00),
    (76, 0.00),
    (77, 392100.00),
    (78, 0.00),
    (79, 108000.00),
    (80, 0.00),
    (81, 490320.00),
    (82, 258370.00),
    (83, 291000.00),
    (84, 315000.00),
    (85, 837000.00),
    (86, 292500.00),
    (87, 5845330.00),
    (88, 1542250.00),
    (89, 47960.00)
  ) as e (numero, saldo)
  join public.saldos_clientes s on s.numero = e.numero
  where s.saldo <> e.saldo;
  if v_mal is not null then raise exception 'Saldos distintos a la planilla: %', v_mal; end if;

  -- Total de todas las cuentas (suma de los saldos finales de las 89 hojas).
  select sum(saldo) into v_valor from public.saldos_clientes;
  if v_valor <> 86033214.00 then raise exception 'Total general: esperaba 86033214.00, dio %', v_valor; end if;

  -- El Buen Gusto, fila por fila (columna SALDO de la hoja "1 BRUNO").
  if (select array_agg(acumulado order by orden) from (
        select orden, sum(efecto) over (order by fecha, orden) as acumulado
        from public.movimientos_importes where cliente_id = (select id from public.clientes where numero = 1)
      ) x) <> array[77050.00, 388850.00, 288850.00, 413850.00, 313850.00, 133850.00, 354850.00, 560250.00]::numeric[] then
    raise exception 'El Buen Gusto: los saldos acumulados no coinciden con la planilla';
  end if;
end $$;

commit;

-- Para mirar el resultado después de correrlo:
-- select * from public.saldos_clientes order by numero;
