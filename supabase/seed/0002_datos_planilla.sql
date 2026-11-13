-- Carnes Rosales — carga inicial con los datos de la planilla.
-- Correr DESPUÉS de 0001_esquema.sql, una sola vez, con la base vacía.
--
-- Fuente: las dos capturas de la planilla.
--   * Hoja de clientes: filas 1 a 5 (la fila 6 se ve cortada y NO está cargada).
--   * Hoja "BRUNO": cuenta corriente completa, filas 3 a 11.
--
-- Todo va en una transacción y termina con un control contra los totales de la
-- planilla: si un número no coincide, se cancela la carga entera.

begin;

-- Freno: no cargar dos veces.
do $$
begin
  if exists (select 1 from public.clientes) or exists (select 1 from public.movimientos) then
    raise exception 'La base ya tiene datos: esta carga es sólo para una base vacía.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Clientes — columnas de la planilla: N°, NOMBRE FANTASIA, TITULAR, DIRECCION, LOCALIDAD.
-- C.U.I.T., CONTACTO y OBSERVACIONES están vacías en la planilla para estas filas.
-- ---------------------------------------------------------------------------
insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad) values
  (1, 'El Buen Gusto', 'Bruno',           '',                 ''),
  (2, 'Eber',          '',                '',                 ''),
  (3, 'Tomasa',        '',                '',                 ''),
  (4, 'Fer 222',       '',                '',                 ''),
  (5, 'La Rotonda',    'Gonzalo Benitez', 'Av. San Bernardo', 'San Bernardo');

-- Que el próximo cliente nuevo sea el N° 6.
select setval(pg_get_serial_sequence('public.clientes', 'numero'), (select max(numero) from public.clientes));

-- ---------------------------------------------------------------------------
-- Cuenta corriente de El Buen Gusto (Bruno) — un movimiento por sentencia,
-- en el mismo orden que la planilla, para que el orden de carga quede igual.
-- Los pagos de la planilla no tienen medio de pago: quedan "sin especificar".
-- ---------------------------------------------------------------------------

-- Fila 3 · 15/10/2026 · SALDO · debe $ 77.050,00 · saldo $ 77.050,00
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe)
values ((select id from public.clientes where numero = 1), '2026-10-15', 'saldo_inicial', '', 77050.00);

-- Filas 4 y 5 · 15/10/2026 · remito 5575
--   PICADA 11,80 kg x $ 13.000,00 = $ 153.400,00
--   VACIOS  9,60 kg x $ 16.500,00 = $ 158.400,00
--   total remito $ 311.800,00 · saldo $ 388.850,00
select public.registrar_venta(
  (select id from public.clientes where numero = 1), '2026-10-15', '5575',
  '[{"detalle": "Picada", "kilos": 11.80, "precio": 13000.00},
    {"detalle": "Vacíos", "kilos": 9.60,  "precio": 16500.00}]'::jsonb
);

-- Fila 6 · 22/10/2026 · recibo 5539 · PAGO $ 100.000,00 · saldo $ 288.850,00
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe)
values ((select id from public.clientes where numero = 1), '2026-10-22', 'pago', '5539', 100000.00);

-- Fila 7 · 22/10/2026 · remito 5889 · PICADA 10 kg x $ 12.500,00 = $ 125.000,00 · saldo $ 413.850,00
select public.registrar_venta(
  (select id from public.clientes where numero = 1), '2026-10-22', '5889',
  '[{"detalle": "Picada", "kilos": 10.00, "precio": 12500.00}]'::jsonb
);

-- Fila 8 · 23/10/2026 · recibo 5970 · PAGO $ 100.000,00 · saldo $ 313.850,00
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe)
values ((select id from public.clientes where numero = 1), '2026-10-23', 'pago', '5970', 100000.00);

-- Fila 9 · 26/10/2026 · recibo 5542 · PAGO $ 180.000,00 · saldo $ 133.850,00
insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe)
values ((select id from public.clientes where numero = 1), '2026-10-26', 'pago', '5542', 180000.00);

-- Fila 10 · 04/11/2026 · remito 3077 · PICADA 17,00 kg x $ 13.000,00 = $ 221.000,00 · saldo $ 354.850,00
select public.registrar_venta(
  (select id from public.clientes where numero = 1), '2026-11-04', '3077',
  '[{"detalle": "Picada", "kilos": 17.00, "precio": 13000.00}]'::jsonb
);

-- Fila 11 · 11/11/2026 · remito 2734 · PICADA 15,80 kg x $ 13.000,00 = $ 205.400,00 · saldo $ 560.250,00
select public.registrar_venta(
  (select id from public.clientes where numero = 1), '2026-11-11', '2734',
  '[{"detalle": "Picada", "kilos": 15.80, "precio": 13000.00}]'::jsonb
);

-- ---------------------------------------------------------------------------
-- Control contra la planilla. Si algo no coincide, se cancela toda la carga.
-- ---------------------------------------------------------------------------
do $$
declare
  v_cliente uuid := (select id from public.clientes where numero = 1);
  v_valor   numeric;
  -- Saldo acumulado esperado después de cada movimiento, en el orden de la planilla (columna SALDO).
  v_esperados numeric[] := array[77050.00, 388850.00, 288850.00, 413850.00, 313850.00, 133850.00, 354850.00, 560250.00];
  v_obtenidos numeric[];
begin
  select count(*) into v_valor from public.clientes;
  if v_valor <> 5 then raise exception 'Clientes: esperaba 5, hay %', v_valor; end if;

  select count(*) into v_valor from public.movimientos where cliente_id = v_cliente;
  if v_valor <> 8 then raise exception 'Movimientos de Bruno: esperaba 8, hay %', v_valor; end if;

  select count(*) into v_valor from public.movimientos where cliente_id <> v_cliente;
  if v_valor <> 0 then raise exception 'No debería haber movimientos de otros clientes, hay %', v_valor; end if;

  select count(*) into v_valor from public.movimiento_items;
  if v_valor <> 5 then raise exception 'Ítems de venta: esperaba 5, hay %', v_valor; end if;

  -- Subtotales de cada renglón (columna SUBTOTAL), en orden.
  select array_agg(i.subtotal order by m.orden, i.orden) into v_obtenidos
  from public.movimiento_items i join public.movimientos m on m.id = i.movimiento_id;
  if v_obtenidos <> array[153400.00, 158400.00, 125000.00, 221000.00, 205400.00]::numeric[] then
    raise exception 'Subtotales distintos a la planilla: %', v_obtenidos;
  end if;

  -- Total de compras (suma de TOTAL RTO).
  select sum(efecto) into v_valor from public.movimientos_importes where cliente_id = v_cliente and tipo = 'venta';
  if v_valor <> 863200.00 then raise exception 'Compras: esperaba 863200.00, dio %', v_valor; end if;

  -- Total de pagos (celda I24 de la planilla: $ 380.000,00).
  select -sum(efecto) into v_valor from public.movimientos_importes where cliente_id = v_cliente and tipo = 'pago';
  if v_valor <> 380000.00 then raise exception 'Pagos: esperaba 380000.00, dio %', v_valor; end if;

  -- Saldo acumulado fila por fila (columna SALDO).
  select array_agg(acumulado order by orden) into v_obtenidos
  from (
    select orden, sum(efecto) over (order by fecha, orden) as acumulado
    from public.movimientos_importes where cliente_id = v_cliente
  ) s;
  if v_obtenidos <> v_esperados then
    raise exception 'Saldos acumulados distintos a la planilla: %', v_obtenidos;
  end if;

  -- Saldo final (última fila de la planilla: $ 560.250,00).
  select saldo into v_valor from public.saldos_clientes where numero = 1;
  if v_valor <> 560250.00 then raise exception 'Saldo final: esperaba 560250.00, dio %', v_valor; end if;

  -- Los otros cuatro clientes arrancan en cero.
  select count(*) into v_valor from public.saldos_clientes where numero <> 1 and saldo <> 0;
  if v_valor <> 0 then raise exception 'Hay % clientes sin movimientos con saldo distinto de cero', v_valor; end if;
end $$;

commit;

-- Para mirar el resultado después de correrlo:
-- select * from public.saldos_clientes order by numero;
