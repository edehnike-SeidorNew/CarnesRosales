-- Carnes Rosales — carga de clientes y sus ventas y pagos, desde la planilla "CARNES ROSALES VENTAS (1).xlsx".
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
-- QUIÉN FIGURA COMO AUTOR: todo se carga a nombre de renzo_rosales@hotmail.es, para que en el historial de
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

-- Aviso claro si todavía no se corrió 0003 (agrega "quién cargó" y los permisos).
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movimientos' and column_name = 'creado_por') then
    raise exception 'Falta correr antes 0001, 0003 y 0004 (en ese orden).';
  end if;
end $$;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 1 · BRUNO   (hoja "1 BRUNO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 1) then
    raise notice 'Cliente 1 (BRUNO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (1, 'BRUNO', 'BRUNO', '', '', 'BUEN SABOR', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 77050)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 77050.00);

  -- fila 5 · 2026-10-15 · remito 5575
  --   PICADA 11.8 kg x 13000 + VACIO 9.6 kg x 16500
  perform public.registrar_venta(v_id, '2026-10-15', '5575', '[{"detalle": "PICADA", "kilos": 11.8, "precio": 13000.0}, {"detalle": "VACIO", "kilos": 9.6, "precio": 16500.0}]'::jsonb);

  -- fila 6 · 2026-10-22 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-22', 'pago', '5539', 100000.00, null);

  -- fila 7 · 2026-10-22 · remito 5889
  --   PICADA 10 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-22', '5889', '[{"detalle": "PICADA", "kilos": 10.0, "precio": 12500.0}]'::jsonb);

  -- fila 8 · 2026-10-23 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '5970', 100000.00, null);

  -- fila 9 · 2026-10-26 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '5542', 180000.00, null);

  -- fila 10 · 2026-11-04 · remito 3077
  --   PICADA 17 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-04', '3077', '[{"detalle": "PICADA", "kilos": 17.0, "precio": 13000.0}]'::jsonb);

  -- fila 11 · 2026-11-11 · remito 2734
  --   PICADA 15.8 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-11', '2734', '[{"detalle": "PICADA", "kilos": 15.8, "precio": 13000.0}]'::jsonb);

  -- fila 12 · 2026-11-13 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '2765', 346000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 214250.00 then
    raise exception 'Cliente 1 (BRUNO): el saldo dio %, la planilla dice 214250.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 9 then
    raise exception 'Cliente 1 (BRUNO): se cargaron % movimientos y esperaba 9', v_cant;
  end if;
  raise notice 'Cliente 1 (BRUNO): ok · 9 movimientos · saldo 214250.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 2 · EBER   (hoja "2 EBER")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 2) then
    raise notice 'Cliente 2 (EBER): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (2, 'EBER', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 468700)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-14', 'saldo_inicial', 468700.00);

  -- fila 4 · 2026-10-14 · remito 5556
  --   MEDIA RES 98 kg x 9700
  perform public.registrar_venta(v_id, '2026-10-14', '5556', '[{"detalle": "MEDIA RES", "kilos": 98.0, "precio": 9700.0}]'::jsonb);

  -- fila 6 · 2026-10-15 · remito 5581
  --   CUADRADA 11.4 kg x 13000 + OSOBUCO 41.4 kg x 7000
  perform public.registrar_venta(v_id, '2026-10-15', '5581', '[{"detalle": "CUADRADA", "kilos": 11.4, "precio": 13000.0}, {"detalle": "OSOBUCO", "kilos": 41.4, "precio": 7000.0}]'::jsonb);

  -- fila 7 · 2026-10-15 · DESCUENTO (retiro) "RETIRO COMIDA"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-15', 'descuento', '', 4400.00, 'RETIRO COMIDA');

  -- fila 8 · 2026-10-16 · PAGO "PAGO · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '', 468700.00, null);

  -- fila 9 · 2026-10-16 · remito 5505
  --   BONDIOLA 23 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-16', '5505', '[{"detalle": "BONDIOLA", "kilos": 23.0, "precio": 6900.0}]'::jsonb);

  -- fila 10 · 2026-10-20 · PAGO "PAGO (FRIMSA) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '', 1000000.00, null);

  -- fila 11 · 2026-10-22 · remito 5537
  --   MEDIA RES 223 kg x 9700
  perform public.registrar_venta(v_id, '2026-10-22', '5537', '[{"detalle": "MEDIA RES", "kilos": 223.0, "precio": 9700.0}]'::jsonb);

  -- fila 12 · 2026-10-23 · PAGO "PAGO (TCB)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '', 542900.00, null);

  -- fila 15 · 2026-10-26 · remito 2664
  --   BONDIOLA 22.7 kg x 7000 + PALETA 25.7 kg x 4700 + JAMON 54.6 kg x 4700
  perform public.registrar_venta(v_id, '2026-10-26', '2664', '[{"detalle": "BONDIOLA", "kilos": 22.7, "precio": 7000.0}, {"detalle": "PALETA", "kilos": 25.7, "precio": 4700.0}, {"detalle": "JAMON", "kilos": 54.6, "precio": 4700.0}]'::jsonb);

  -- fila 16 · 2026-10-27 · PAGO "PAGO TRANSF FRIMSA"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-27', 'pago', '1705', 1180000.00, null);

  -- fila 17 · 2026-10-30 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '1722', 1000000.00, null);

  -- fila 19 · 2026-10-31 · remito 2678
  --   CUADRIL 12 kg x 13000 + CUADRADA 7.2 kg x 12300
  perform public.registrar_venta(v_id, '2026-10-31', '2678', '[{"detalle": "CUADRIL", "kilos": 12.0, "precio": 13000.0}, {"detalle": "CUADRADA", "kilos": 7.2, "precio": 12300.0}]'::jsonb);

  -- fila 20 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '2695', 763970.00, null);

  -- fila 22 · 2026-11-05 · remito 5682
  --   BONDIOLA 21.74 kg x 7000 + BIFE 17.6 kg x 12000
  perform public.registrar_venta(v_id, '2026-11-05', '5682', '[{"detalle": "BONDIOLA", "kilos": 21.74, "precio": 7000.0}, {"detalle": "BIFE", "kilos": 17.6, "precio": 12000.0}]'::jsonb);

  -- fila 23 · 2026-11-05 · DESCUENTO (consumo) "COMIDA"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-05', 'descuento', '', 6000.00, 'COMIDA');

  -- fila 27 · 2026-11-07 · remito 5997
  --   JAMON Y PALETA 26.9 kg x 5000 + CUADRIL 15.46 kg x 12500 + PALETA 7.8 kg x 12500 + BIFE 37 kg x 12000
  perform public.registrar_venta(v_id, '2026-11-07', '5997', '[{"detalle": "JAMON Y PALETA", "kilos": 26.9, "precio": 5000.0}, {"detalle": "CUADRIL", "kilos": 15.46, "precio": 12500.0}, {"detalle": "PALETA", "kilos": 7.8, "precio": 12500.0}, {"detalle": "BIFE", "kilos": 37.0, "precio": 12000.0}]'::jsonb);

  -- fila 28 · 2026-11-11 · remito 2731
  --   CARRE 9.7 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-11', '2731', '[{"detalle": "CARRE", "kilos": 9.7, "precio": 6800.0}]'::jsonb);

  -- fila 29 · 2026-11-12 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '8404', 1226630.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 65960.00 then
    raise exception 'Cliente 2 (EBER): el saldo dio %, la planilla dice 65960.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 19 then
    raise exception 'Cliente 2 (EBER): se cargaron % movimientos y esperaba 19', v_cant;
  end if;
  raise notice 'Cliente 2 (EBER): ok · 19 movimientos · saldo 65960.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 3 · TOMASA   (hoja "3 TOMASA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 3) then
    raise notice 'Cliente 3 (TOMASA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (3, 'TOMASA', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 441550)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 441550.00);

  -- fila 4 · 2026-10-16 · PAGO "PAGO KOKI · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '', 200000.00, null);

  -- fila 8 · 2026-10-22 · remito 5528
  --   VACIO 39 kg x 13500 + ASADO 49.8 kg x 13500 + MATAMBRE 9.5 kg x 13500 + TORTUGUITA 11.2 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-22', '5528', '[{"detalle": "VACIO", "kilos": 39.0, "precio": 13500.0}, {"detalle": "ASADO", "kilos": 49.8, "precio": 13500.0}, {"detalle": "MATAMBRE", "kilos": 9.5, "precio": 13500.0}, {"detalle": "TORTUGUITA", "kilos": 11.2, "precio": 13000.0}]'::jsonb);

  -- fila 9 · 2026-10-23 · PAGO "PAGO KOKI · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '', 300000.00, null);

  -- fila 10 · 2026-10-26 · PAGO "PAGO (AMS) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '', 400000.00, null);

  -- fila 11 · 2026-10-31 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-31', 'pago', '2691', 500000.00, null);

  -- fila 12 · 2026-11-10 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '3049', 200000.00, null);

  -- fila 13 · 2026-11-11 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1536', 150000.00, null);

  -- fila 15 · 2026-11-12 · remito s/n
  --   MOCHO 43 kg x 10500 + ASADO 55.9 kg x 15200
  perform public.registrar_venta(v_id, '2026-11-12', '', '[{"detalle": "MOCHO", "kilos": 43.0, "precio": 10500.0}, {"detalle": "ASADO", "kilos": 55.9, "precio": 15200.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1465380.00 then
    raise exception 'Cliente 3 (TOMASA): el saldo dio %, la planilla dice 1465380.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 9 then
    raise exception 'Cliente 3 (TOMASA): se cargaron % movimientos y esperaba 9', v_cant;
  end if;
  raise notice 'Cliente 3 (TOMASA): ok · 9 movimientos · saldo 1465380.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 4 · FER 222   (hoja "4 FER 222")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 4) then
    raise notice 'Cliente 4 (FER 222): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (4, 'FER 222', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 300800)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 300800.00);

  -- fila 4 · 2026-10-16 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '5508', 200000.00, null);

  -- fila 5 · 2026-10-19 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '5904', 100000.00, null);

  -- fila 7 · 2026-10-27 · remito 1707
  --   PATA MUSLO 30 kg x 3000 + SUPREMA 15 kg x 6500
  perform public.registrar_venta(v_id, '2026-10-27', '1707', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3000.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}]'::jsonb);

  -- fila 8 · 2026-10-29 · remito 1712
  --   BONDIOLA 7.7 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-29', '1712', '[{"detalle": "BONDIOLA", "kilos": 7.7, "precio": 6900.0}]'::jsonb);

  -- fila 9 · 2026-10-29 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 53000.00, null);

  -- fila 12 · 2026-10-29 · remito 5660 · fecha original de la planilla: 2026-01-31
  --   ASADO 22.9 kg x 14500 + BIFE 16 kg x 12000 + PECHITO 5.4 kg x 6600
  perform public.registrar_venta(v_id, '2026-10-29', '5660', '[{"detalle": "ASADO", "kilos": 22.9, "precio": 14500.0}, {"detalle": "BIFE", "kilos": 16.0, "precio": 12000.0}, {"detalle": "PECHITO", "kilos": 5.4, "precio": 6600.0}]'::jsonb);

  -- fila 13 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 190000.00, null);

  -- fila 16 · 2026-11-02 · remito 2832
  --   PATA MUSLO 15 kg x 2900 + BONDIOLA 24.09 kg x 6800 + NALGA 7 kg x 15900
  perform public.registrar_venta(v_id, '2026-11-02', '2832', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "BONDIOLA", "kilos": 24.09, "precio": 6800.0}, {"detalle": "NALGA", "kilos": 7.0, "precio": 15900.0}]'::jsonb);

  -- fila 17 · 2026-11-03 · remito 5668
  --   PATA MUSLO 45 kg x 2800
  perform public.registrar_venta(v_id, '2026-11-03', '5668', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2800.0}]'::jsonb);

  -- fila 18 · 2026-11-03 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '', 126000.00, null);

  -- fila 21 · 2026-11-05 · remito 1740
  --   ASADO 41.6 kg x 14800 + BIFE 13.6 kg x 12000 + PATA MUSLO 30 kg x 2800
  perform public.registrar_venta(v_id, '2026-11-05', '1740', '[{"detalle": "ASADO", "kilos": 41.6, "precio": 14800.0}, {"detalle": "BIFE", "kilos": 13.6, "precio": 12000.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2800.0}]'::jsonb);

  -- fila 22 · 2026-11-06 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '1518', 400000.00, null);

  -- fila 26 · 2026-11-07 · remito 3025
  --   PATA MUSLO 45 kg x 2800 + NALGA 5.3 kg x 15500 + PALETA 14.4 kg x 13000 + BONDIOLA 21.65 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-07', '3025', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2800.0}, {"detalle": "NALGA", "kilos": 5.3, "precio": 15500.0}, {"detalle": "PALETA", "kilos": 14.4, "precio": 13000.0}, {"detalle": "BONDIOLA", "kilos": 21.65, "precio": 6800.0}]'::jsonb);

  -- fila 27 · 2026-11-08 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '3031', 477000.00, null);

  -- fila 30 · 2026-11-08 · remito 5690
  --   SUPREMA 15 kg x 6500 + MORCILLA VASCA 3.5 kg x 6800 + MORCILLA VASCA 5 kg x 4400
  perform public.registrar_venta(v_id, '2026-11-08', '5690', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}, {"detalle": "MORCILLA VASCA", "kilos": 3.5, "precio": 6800.0}, {"detalle": "MORCILLA VASCA", "kilos": 5.0, "precio": 4400.0}]'::jsonb);

  -- fila 32 · 2026-11-09 · remito 3048
  --   PATA MUSLO 45 kg x 2800 + BONDIOLA 22.04 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-09', '3048', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2800.0}, {"detalle": "BONDIOLA", "kilos": 22.04, "precio": 6800.0}]'::jsonb);

  -- fila 33 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1588', 276000.00, null);

  -- fila 34 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1590', 1007000.00, null);

  -- fila 36 · 2026-11-12 · remito 1605
  --   BIFE 17.2 kg x 12000 + CUADRADA 8.6 kg x 12500
  perform public.registrar_venta(v_id, '2026-11-12', '1605', '[{"detalle": "BIFE", "kilos": 17.2, "precio": 12000.0}, {"detalle": "CUADRADA", "kilos": 8.6, "precio": 12500.0}]'::jsonb);

  -- fila 37 · 2026-11-16 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1634', 314000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 541254.00 then
    raise exception 'Cliente 4 (FER 222): el saldo dio %, la planilla dice 541254.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 21 then
    raise exception 'Cliente 4 (FER 222): se cargaron % movimientos y esperaba 21', v_cant;
  end if;
  raise notice 'Cliente 4 (FER 222): ok · 21 movimientos · saldo 541254.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 5 · BENITEZ   (hoja "5 BENITEZ")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 5) then
    raise notice 'Cliente 5 (BENITEZ): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (5, 'BENITEZ', 'GONZALO BENITEZ', 'AV. SAN BERNARDO', 'SAN BERNARDO', 'BENITEZ ( LA ROTONDA)', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO(KOKI) 542531 + SALDO (RENZO) 30600)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-14', 'saldo_inicial', 573131.00);

  -- fila 7 · 2026-10-14 · remito 5554
  --   CUADRADA 11.6 kg x 13000 + CORDERO 23.5 kg x 13000 + BIFE 29.3 kg x 12000
  perform public.registrar_venta(v_id, '2026-10-14', '5554', '[{"detalle": "CUADRADA", "kilos": 11.6, "precio": 13000.0}, {"detalle": "CORDERO", "kilos": 23.5, "precio": 13000.0}, {"detalle": "BIFE", "kilos": 29.3, "precio": 12000.0}]'::jsonb);

  -- fila 8 · 2026-10-20 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5907', 150000.00, null);

  -- fila 9 · 2026-10-30 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '1715', 40000.00, null);

  -- fila 10 · 2026-11-06 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '3022', 60000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1131031.00 then
    raise exception 'Cliente 5 (BENITEZ): el saldo dio %, la planilla dice 1131031.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 5 then
    raise exception 'Cliente 5 (BENITEZ): se cargaron % movimientos y esperaba 5', v_cant;
  end if;
  raise notice 'Cliente 5 (BENITEZ): ok · 5 movimientos · saldo 1131031.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 6 · FABI TOMI   (hoja "6 FABI TOMI")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 6) then
    raise notice 'Cliente 6 (FABI TOMI): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (6, 'FABI TOMI', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 313750)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 313750.00);

  -- fila 4 · 2026-10-16 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '5586', 60000.00, null);

  -- fila 5 · 2026-10-17 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-17', 'pago', '', 50000.00, null);

  -- fila 6 · 2026-10-20 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5876', 40000.00, null);

  -- fila 7 · 2026-10-24 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-24', 'pago', '2659', 50000.00, null);

  -- fila 9 · 2026-10-29 · remito 5797
  --   CUADRADA 6.9 kg x 15000 + PICADA 10.2 kg x 11900
  perform public.registrar_venta(v_id, '2026-10-29', '5797', '[{"detalle": "CUADRADA", "kilos": 6.9, "precio": 15000.0}, {"detalle": "PICADA", "kilos": 10.2, "precio": 11900.0}]'::jsonb);

  -- fila 10 · 2026-11-02 · remito 5987
  --   BIFE 6.2 kg x 10900
  perform public.registrar_venta(v_id, '2026-11-02', '5987', '[{"detalle": "BIFE", "kilos": 6.2, "precio": 10900.0}]'::jsonb);

  -- fila 11 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 50000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 356210.00 then
    raise exception 'Cliente 6 (FABI TOMI): el saldo dio %, la planilla dice 356210.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 8 then
    raise exception 'Cliente 6 (FABI TOMI): se cargaron % movimientos y esperaba 8', v_cant;
  end if;
  raise notice 'Cliente 6 (FABI TOMI): ok · 8 movimientos · saldo 356210.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 7 · NICO PARRI   (hoja "7 NICO PARRI")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 7) then
    raise notice 'Cliente 7 (NICO PARRI): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (7, 'NICO PARRI', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 412000)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 412000.00);

  -- fila 4 · 2026-10-16 · remito 5511
  --   ASADO 10.8 kg x 16000
  perform public.registrar_venta(v_id, '2026-10-16', '5511', '[{"detalle": "ASADO", "kilos": 10.8, "precio": 16000.0}]'::jsonb);

  -- fila 5 · 2026-10-16 · remito 5520
  --   BIFE 22.1 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-16', '5520', '[{"detalle": "BIFE", "kilos": 22.1, "precio": 12500.0}]'::jsonb);

  -- fila 6 · 2026-10-17 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-17', 'pago', '5951', 200000.00, null);

  -- fila 7 · 2026-10-17 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-17', 'pago', '', 100000.00, null);

  -- fila 8 · 2026-10-20 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5879', 110000.00, null);

  -- fila 9 · 2026-10-20 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '', 75000.00, null);

  -- fila 10 · 2026-10-24 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-24', 'pago', '4625', 100000.00, null);

  -- fila 11 · 2026-10-26 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '3057', 140000.00, null);

  -- fila 12 · 2026-10-27 · remito 5544
  --   CUADRIL 29.8 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-27', '5544', '[{"detalle": "CUADRIL", "kilos": 29.8, "precio": 15500.0}]'::jsonb);

  -- fila 13 · 2026-10-29 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '5799', 70000.00, null);

  -- fila 14 · 2026-10-29 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 66000.00, null);

  -- fila 15 · 2026-11-01 · PAGO "PAGO TRANSF (RENZO)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-01', 'pago', '3061', 150000.00, null);

  -- fila 16 · 2026-11-01 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-01', 'pago', '', 150000.00, null);

  -- fila 17 · 2026-11-04 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '5988', 61900.00, null);

  -- fila 19 · 2026-11-04 · remito 3078
  --   CUADRIL 13 kg x 15500 + CUADRADA 22.6 kg x 14500
  perform public.registrar_venta(v_id, '2026-11-04', '3078', '[{"detalle": "CUADRIL", "kilos": 13.0, "precio": 15500.0}, {"detalle": "CUADRADA", "kilos": 22.6, "precio": 14500.0}]'::jsonb);

  -- fila 21 · 2026-11-05 · remito 1514
  --   PICADA 5.6 kg x 13000 + ASADO 26.6 kg x 16000
  perform public.registrar_venta(v_id, '2026-11-05', '1514', '[{"detalle": "PICADA", "kilos": 5.6, "precio": 13000.0}, {"detalle": "ASADO", "kilos": 26.6, "precio": 16000.0}]'::jsonb);

  -- fila 22 · 2026-11-08 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '3096', 300000.00, null);

  -- fila 23 · 2026-11-08 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '', 100000.00, null);

  -- fila 24 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '5692', 100000.00, null);

  -- fila 25 · 2026-11-14 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '1622', 200000.00, null);

  -- fila 26 · 2026-11-15 · remito 2777
  --   OSOBUCO 13.4 kg x 8500
  perform public.registrar_venta(v_id, '2026-11-15', '2777', '[{"detalle": "OSOBUCO", "kilos": 13.4, "precio": 8500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 541550.00 then
    raise exception 'Cliente 7 (NICO PARRI): el saldo dio %, la planilla dice 541550.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 22 then
    raise exception 'Cliente 7 (NICO PARRI): se cargaron % movimientos y esperaba 22', v_cant;
  end if;
  raise notice 'Cliente 7 (NICO PARRI): ok · 22 movimientos · saldo 541550.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 8 · CHINO C 8   (hoja "8 CHINO C 8")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 8) then
    raise notice 'Cliente 8 (CHINO C 8): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (8, 'CHINO C 8', '', '', '', 'CHINO CALLE 8', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 42950)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 42950.00);

  -- fila 4 · 2026-10-19 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '5903', 43000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from -50.00 then
    raise exception 'Cliente 8 (CHINO C 8): el saldo dio %, la planilla dice -50.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 8 (CHINO C 8): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 8 (CHINO C 8): ok · 2 movimientos · saldo -50.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 9 · AMADEUS   (hoja "9 AMADEUS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 9) then
    raise notice 'Cliente 9 (AMADEUS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (9, 'AMADEUS', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 488250)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 488250.00);

  -- fila 4 · 2026-10-19 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '5905', 488000.00, null);

  -- fila 6 · 2026-10-23 · remito 5967
  --   NALGA C/T 76.9 kg x 14500 + BIFE 30.3 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-23', '5967', '[{"detalle": "NALGA C/T", "kilos": 76.9, "precio": 14500.0}, {"detalle": "BIFE", "kilos": 30.3, "precio": 12500.0}]'::jsonb);

  -- fila 7 · 2026-10-29 · PAGO "PAGO CH N°70576676"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '5798', 1494050.00, null);

  -- fila 10 · 2026-10-31 · remito 2680
  --   PICADA 4.8 kg x 11900 + ASADO 14.8 kg x 15500 + VACIO 7 kg x 16900
  perform public.registrar_venta(v_id, '2026-10-31', '2680', '[{"detalle": "PICADA", "kilos": 4.8, "precio": 11900.0}, {"detalle": "ASADO", "kilos": 14.8, "precio": 15500.0}, {"detalle": "VACIO", "kilos": 7.0, "precio": 16900.0}]'::jsonb);

  -- fila 13 · 2026-11-03 · remito 5673
  --   VACIO 6 kg x 16900 + BIFE 5.8 kg x 13000 + LOMO 8.9 kg x 24000
  perform public.registrar_venta(v_id, '2026-11-03', '5673', '[{"detalle": "VACIO", "kilos": 6.0, "precio": 16900.0}, {"detalle": "BIFE", "kilos": 5.8, "precio": 13000.0}, {"detalle": "LOMO", "kilos": 8.9, "precio": 24000.0}]'::jsonb);

  -- fila 15 · 2026-11-06 · remito 3001
  --   VACIO 8 kg x 16900 + OSOBUCO 2.6 kg x 8500
  perform public.registrar_venta(v_id, '2026-11-06', '3001', '[{"detalle": "VACIO", "kilos": 8.0, "precio": 16900.0}, {"detalle": "OSOBUCO", "kilos": 2.6, "precio": 8500.0}]'::jsonb);

  -- fila 19 · 2026-11-09 · remito 1560
  --   VACIO 5.4 kg x 16900 + BIFE 6.8 kg x 24000 + LOMO 3.7 kg x 26000 + PICADA 7 kg x 11500
  perform public.registrar_venta(v_id, '2026-11-09', '1560', '[{"detalle": "VACIO", "kilos": 5.4, "precio": 16900.0}, {"detalle": "BIFE", "kilos": 6.8, "precio": 24000.0}, {"detalle": "LOMO", "kilos": 3.7, "precio": 26000.0}, {"detalle": "PICADA", "kilos": 7.0, "precio": 11500.0}]'::jsonb);

  -- fila 20 · 2026-11-10 · PAGO "PAGO CH N°70576687"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1569', 1383680.00, null);

  -- fila 22 · 2026-11-12 · remito 1606
  --   BIFE DE CHORIZO 15.8 kg x 24000 + LOMO 2.7 kg x 26000
  perform public.registrar_venta(v_id, '2026-11-12', '1606', '[{"detalle": "BIFE DE CHORIZO", "kilos": 15.8, "precio": 24000.0}, {"detalle": "LOMO", "kilos": 2.7, "precio": 26000.0}]'::jsonb);

  -- fila 24 · 2026-11-13 · remito 2763
  --   LOMO 11.5 kg x 26000 + BIFE 11.2 kg x 18500
  perform public.registrar_venta(v_id, '2026-11-13', '2763', '[{"detalle": "LOMO", "kilos": 11.5, "precio": 26000.0}, {"detalle": "BIFE", "kilos": 11.2, "precio": 18500.0}]'::jsonb);

  -- fila 25 · 2026-11-13 · remito 8417
  --   VACIO 3.6 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-13', '8417', '[{"detalle": "VACIO", "kilos": 3.6, "precio": 16900.0}]'::jsonb);

  -- fila 28 · 2026-11-14 · remito 1617
  --   LOMO 2.1 kg x 26000 + ASADO 8.7 kg x 13000 + MATAMBRE 12.8 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-14', '1617', '[{"detalle": "LOMO", "kilos": 2.1, "precio": 26000.0}, {"detalle": "ASADO", "kilos": 8.7, "precio": 13000.0}, {"detalle": "MATAMBRE", "kilos": 12.8, "precio": 16900.0}]'::jsonb);

  -- fila 29 · 2026-11-15 · remito 2773
  --   LOMO 13.7 kg x 26000
  perform public.registrar_venta(v_id, '2026-11-15', '2773', '[{"detalle": "LOMO", "kilos": 13.7, "precio": 26000.0}]'::jsonb);

  -- fila 30 · 2026-11-16 · PAGO "PAGO CH N°70576699"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1637', 1756660.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 9 (AMADEUS): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 15 then
    raise exception 'Cliente 9 (AMADEUS): se cargaron % movimientos y esperaba 15', v_cant;
  end if;
  raise notice 'Cliente 9 (AMADEUS): ok · 15 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 10 · MERC MARIO   (hoja "10 MERC MARIO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 10) then
    raise notice 'Cliente 10 (MERC MARIO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (10, 'MERC MARIO', '', 'CALLE 3 N°1477', 'STA TERESITA', 'MERCADO MARIO', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-04 · remito 3085
  --   PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-04', '3085', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 12 · 2026-11-07 · remito 1522
  --   CUAD/BOLA DE LOMO 8.1 kg x 14000 + MORCILLA VASCA 3.5 kg x 6800 + PALETA DE CERDO 6.6 kg x 5000 + CUADRIL 4.8 kg x 14000 + PATA MUSLO 15 kg x 3200 + SUPREMA 15 kg x 7000 + POLLO (POR UNIDAD) 1 u x 67000 + MORCILLA 2.8 kg x 4500 + CHORIZO 13.2 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-07', '1522', '[{"detalle": "CUAD/BOLA DE LOMO", "kilos": 8.1, "precio": 14000.0}, {"detalle": "MORCILLA VASCA", "kilos": 3.5, "precio": 6800.0}, {"detalle": "PALETA DE CERDO", "kilos": 6.6, "precio": 5000.0}, {"detalle": "CUADRIL", "kilos": 4.8, "precio": 14000.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 7000.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}, {"detalle": "MORCILLA", "kilos": 2.8, "precio": 4500.0}, {"detalle": "CHORIZO", "kilos": 13.2, "precio": 7000.0}]'::jsonb);

  -- fila 13 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1566', 140000.00, null);

  -- fila 16 · 2026-11-10 · remito 2717
  --   POLLO (POR UNIDAD) 1 u x 67000 + SUPREMA 15 kg x 6800 + PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-10', '2717', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6800.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 17 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '', 80000.00, null);

  -- fila 18 · 2026-11-07 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '1577', 45000.00, null);

  -- fila 19 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '', 55000.00, null);

  -- fila 20 · 2026-11-15 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '2772', 83000.00, null);

  -- fila 21 · 2026-11-15 · remito s/n
  --   PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-15', '', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 463400.00 then
    raise exception 'Cliente 10 (MERC MARIO): el saldo dio %, la planilla dice 463400.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 9 then
    raise exception 'Cliente 10 (MERC MARIO): se cargaron % movimientos y esperaba 9', v_cant;
  end if;
  raise notice 'Cliente 10 (MERC MARIO): ok · 9 movimientos · saldo 463400.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 11 · EL QUINCHO   (hoja "11 EL QUINCHO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 11) then
    raise notice 'Cliente 11 (EL QUINCHO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (11, 'EL QUINCHO', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 105800)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 105800.00);

  -- fila 4 · 2026-10-14 · remito 5560
  --   ENTRAÑA 6 kg x 24000
  perform public.registrar_venta(v_id, '2026-10-14', '5560', '[{"detalle": "ENTRAÑA", "kilos": 6.0, "precio": 24000.0}]'::jsonb);

  -- fila 5 · 2026-10-19 · PAGO "PAGO (BLANCO) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '', 105800.00, null);

  -- fila 7 · 2026-10-21 · remito 5785
  --   VACIO 8.4 kg x 15500 + ASADO 12.6 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-21', '5785', '[{"detalle": "VACIO", "kilos": 8.4, "precio": 15500.0}, {"detalle": "ASADO", "kilos": 12.6, "precio": 15500.0}]'::jsonb);

  -- fila 8 · 2026-10-22 · remito 5886
  --   ENTRAÑA 8.2 kg x 24000
  perform public.registrar_venta(v_id, '2026-10-22', '5886', '[{"detalle": "ENTRAÑA", "kilos": 8.2, "precio": 24000.0}]'::jsonb);

  -- fila 9 · 2026-10-26 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '2661', 666300.00, null);

  -- fila 10 · 2026-10-31 · remito 2672
  --   ENTRAÑA 12.5 kg x 24000
  perform public.registrar_venta(v_id, '2026-10-31', '2672', '[{"detalle": "ENTRAÑA", "kilos": 12.5, "precio": 24000.0}]'::jsonb);

  -- fila 11 · 2026-11-05 · remito 1510
  --   ENTRAÑA 8.4 kg x 24000
  perform public.registrar_venta(v_id, '2026-11-05', '1510', '[{"detalle": "ENTRAÑA", "kilos": 8.4, "precio": 24000.0}]'::jsonb);

  -- fila 12 · 2026-11-06 · remito 3011
  --   ENTRAÑA 6.4 kg x 24000
  perform public.registrar_venta(v_id, '2026-11-06', '3011', '[{"detalle": "ENTRAÑA", "kilos": 6.4, "precio": 24000.0}]'::jsonb);

  -- fila 13 · 2026-11-09 · remito 2701
  --   ENTRAÑA 10.4 kg x 24000
  perform public.registrar_venta(v_id, '2026-11-09', '2701', '[{"detalle": "ENTRAÑA", "kilos": 10.4, "precio": 24000.0}]'::jsonb);

  -- fila 14 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '', 600000.00, null);

  -- fila 16 · 2026-11-12 · remito 1538
  --   ENTRAÑA 11.9 kg x 24000 + BIFE 13.4 kg x 18900
  perform public.registrar_venta(v_id, '2026-11-12', '1538', '[{"detalle": "ENTRAÑA", "kilos": 11.9, "precio": 24000.0}, {"detalle": "BIFE", "kilos": 13.4, "precio": 18900.0}]'::jsonb);

  -- fila 17 · 2026-11-13 · remito 1543
  --   BIFE 13.8 kg x 18900
  perform public.registrar_venta(v_id, '2026-11-13', '1543', '[{"detalle": "BIFE", "kilos": 13.8, "precio": 18900.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1104480.00 then
    raise exception 'Cliente 11 (EL QUINCHO): el saldo dio %, la planilla dice 1104480.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 13 then
    raise exception 'Cliente 11 (EL QUINCHO): se cargaron % movimientos y esperaba 13', v_cant;
  end if;
  raise notice 'Cliente 11 (EL QUINCHO): ok · 13 movimientos · saldo 1104480.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 12 · ROT. PATO   (hoja "12 ROT. PATO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 12) then
    raise notice 'Cliente 12 (ROT. PATO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (12, 'ROT. PATO', '', '', '', 'ROTISERIA PATO', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 132850 + SALDO PATO 58800)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 191650.00);

  -- fila 4 · 2026-10-15 · remito 5577
  --   BOLA DE LOMO 27.1 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-15', '5577', '[{"detalle": "BOLA DE LOMO", "kilos": 27.1, "precio": 15500.0}]'::jsonb);

  -- fila 6 · 2026-10-23 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '5971', 50000.00, null);

  -- fila 7 · 2026-10-23 · DESCUENTO (consumo) "COMIDA (20-10-26)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-23', 'descuento', '', 46000.00, 'COMIDA (20-10-26)');

  -- fila 8 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1581', 100000.00, null);

  -- fila 9 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '1624', 100000.00, null);

  -- fila 10 · 2026-11-15 · remito 2776
  --   BONDIOLA 5.7 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-15', '2776', '[{"detalle": "BONDIOLA", "kilos": 5.7, "precio": 7000.0}]'::jsonb);

  -- fila 11 · 2026-11-15 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '', 39900.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 315700.00 then
    raise exception 'Cliente 12 (ROT. PATO): el saldo dio %, la planilla dice 315700.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 8 then
    raise exception 'Cliente 12 (ROT. PATO): se cargaron % movimientos y esperaba 8', v_cant;
  end if;
  raise notice 'Cliente 12 (ROT. PATO): ok · 8 movimientos · saldo 315700.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 13 · ROT.SAN JUAN   (hoja "13 ROT.SAN JUAN")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 13) then
    raise notice 'Cliente 13 (ROT.SAN JUAN): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (13, 'ROT.SAN JUAN', '', '', '', 'ROTISERIA SAN JUAN', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 117800)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 117800.00);

  -- fila 4 · 2026-10-22 · remito 5890
  --   NALGA C/T 30.7 kg x 16900
  perform public.registrar_venta(v_id, '2026-10-22', '5890', '[{"detalle": "NALGA C/T", "kilos": 30.7, "precio": 16900.0}]'::jsonb);

  -- fila 5 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '5986', 200000.00, null);

  -- fila 6 · 2026-11-02 · remito 2833
  --   NALGA C/T 6.9 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-02', '2833', '[{"detalle": "NALGA C/T", "kilos": 6.9, "precio": 16900.0}]'::jsonb);

  -- fila 8 · 2026-11-05 · remito 2847
  --   VACIO 13.8 kg x 15900 + NALGA C/T 19.5 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-05', '2847', '[{"detalle": "VACIO", "kilos": 13.8, "precio": 15900.0}, {"detalle": "NALGA C/T", "kilos": 19.5, "precio": 16900.0}]'::jsonb);

  -- fila 9 · 2026-11-07 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '3093', 200000.00, null);

  -- fila 10 · 2026-11-11 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1585', 200000.00, null);

  -- fila 11 · 2026-11-13 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '2766', 200000.00, null);

  -- fila 12 · 2026-11-14 · remito 8421
  --   NALGA C/T 17.6 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-14', '8421', '[{"detalle": "NALGA C/T", "kilos": 17.6, "precio": 16900.0}]'::jsonb);

  -- fila 13 · 2026-11-14 · remito 8423
  --   TAPA DE ASADO 31.6 kg x 15500
  perform public.registrar_venta(v_id, '2026-11-14', '8423', '[{"detalle": "TAPA DE ASADO", "kilos": 31.6, "precio": 15500.0}]'::jsonb);

  -- fila 14 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '1623', 100000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1189450.00 then
    raise exception 'Cliente 13 (ROT.SAN JUAN): el saldo dio %, la planilla dice 1189450.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 11 then
    raise exception 'Cliente 13 (ROT.SAN JUAN): se cargaron % movimientos y esperaba 11', v_cant;
  end if;
  raise notice 'Cliente 13 (ROT.SAN JUAN): ok · 11 movimientos · saldo 1189450.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 14 · COSTA DULCE   (hoja "14 COSTA DULCE")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 14) then
    raise notice 'Cliente 14 (COSTA DULCE): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (14, 'COSTA DULCE', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 457500)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 457500.00);

  -- fila 4 · 2026-10-16 · remito 5502
  --   ROAST BEEF 32.3 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-16', '5502', '[{"detalle": "ROAST BEEF", "kilos": 32.3, "precio": 13000.0}]'::jsonb);

  -- fila 5 · 2026-10-23 · remito 5961
  --   ROAST BEEF 70.5 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-23', '5961', '[{"detalle": "ROAST BEEF", "kilos": 70.5, "precio": 13000.0}]'::jsonb);

  -- fila 10 · 2026-10-31 · remito 2681
  --   ROAST BEEF 22.2 kg x 13000 + NALGA 50.55 kg x 15000 + TAPA DE ASADO 21.55 kg x 12000 + PATA MUSLO (POR UNIDAD) 4 u x 48000 + SUPREMA 45 kg x 6300
  perform public.registrar_venta(v_id, '2026-10-31', '2681', '[{"detalle": "ROAST BEEF", "kilos": 22.2, "precio": 13000.0}, {"detalle": "NALGA", "kilos": 50.55, "precio": 15000.0}, {"detalle": "TAPA DE ASADO", "kilos": 21.55, "precio": 12000.0}, {"detalle": "PATA MUSLO (POR UNIDAD)", "kilos": 4.0, "precio": 48000.0}, {"detalle": "SUPREMA", "kilos": 45.0, "precio": 6300.0}]'::jsonb);

  -- fila 11 · 2026-10-31 · remito 2682
  --   PATA MUSLO (POR UNIDAD) 10 u x 48000
  perform public.registrar_venta(v_id, '2026-10-31', '2682', '[{"detalle": "PATA MUSLO (POR UNIDAD)", "kilos": 10.0, "precio": 48000.0}]'::jsonb);

  -- fila 12 · 2026-11-15 · PAGO "PAGO CH N° 17531436"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '1627', 1793900.00, null);

  -- fila 13 · 2026-11-15 · PAGO "PAGO CH N° 17531437"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '', 2448600.00, null);

  -- fila 14 · 2026-11-15 · CARGO "SABORES DEL CAMPO" (suma al saldo, no es una venta de productos)
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-15', 'cargo', '', 189000.00, 'SABORES DEL CAMPO');

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1350.00 then
    raise exception 'Cliente 14 (COSTA DULCE): el saldo dio %, la planilla dice 1350.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 8 then
    raise exception 'Cliente 14 (COSTA DULCE): se cargaron % movimientos y esperaba 8', v_cant;
  end if;
  raise notice 'Cliente 14 (COSTA DULCE): ok · 8 movimientos · saldo 1350.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 15 · RODRI PASSINI   (hoja "15 RODRI PASSINI")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 15) then
    raise notice 'Cliente 15 (RODRI PASSINI): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (15, 'RODRI PASSINI', '', '', '', 'RODRIGO PASSINI', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-10 · remito 5860
  --   PATA MUSLO 30 kg x 2900 + SUPREMA 30 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-10', '5860', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6100.0}]'::jsonb);

  -- fila 9 · 2026-10-15 · remito 5570
  --   PECHO 29.1 kg x 8500 + CUADRIL 12.1 kg x 13500 + CUADRADA 6.7 kg x 13500 + BOLA DE LOMO 8.7 kg x 13500 + SUPREMA 30 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-15', '5570', '[{"detalle": "PECHO", "kilos": 29.1, "precio": 8500.0}, {"detalle": "CUADRIL", "kilos": 12.1, "precio": 13500.0}, {"detalle": "CUADRADA", "kilos": 6.7, "precio": 13500.0}, {"detalle": "BOLA DE LOMO", "kilos": 8.7, "precio": 13500.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6100.0}]'::jsonb);

  -- fila 11 · 2026-10-15 · remito 5579
  --   ASADO 15.1 kg x 13600 + SUPREMA 15 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-15', '5579', '[{"detalle": "ASADO", "kilos": 15.1, "precio": 13600.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6100.0}]'::jsonb);

  -- fila 12 · 2026-10-15 · DESCUENTO (descuento) "DESC 1/2 RES 142 kg x 9300"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-15', 'descuento', '', 1320600.00, 'DESC 1/2 RES 142 kg x 9300');

  -- fila 14 · 2026-11-02 · remito 2831
  --   PATA MUSLO 15 kg x 2900 + SUPREMA 15 kg x 6300
  perform public.registrar_venta(v_id, '2026-11-02', '2831', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}]'::jsonb);

  -- fila 15 · 2026-11-04 · remito 3069
  --   SUPREMA 60 kg x 6300
  perform public.registrar_venta(v_id, '2026-11-04', '3069', '[{"detalle": "SUPREMA", "kilos": 60.0, "precio": 6300.0}]'::jsonb);

  -- fila 16 · 2026-11-05 · remito 1736
  --   PARRILLERO 145.5 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-05', '1736', '[{"detalle": "PARRILLERO", "kilos": 145.5, "precio": 13000.0}]'::jsonb);

  -- fila 17 · 2026-11-05 · remito 1504
  --   NALGA C/T 12.1 kg x 15500
  perform public.registrar_venta(v_id, '2026-11-05', '1504', '[{"detalle": "NALGA C/T", "kilos": 12.1, "precio": 15500.0}]'::jsonb);

  -- fila 19 · 2026-11-07 · remito 3027
  --   BONDIOLA 47.72 kg x 6500 + BIFE 39.5 kg x 12500
  perform public.registrar_venta(v_id, '2026-11-07', '3027', '[{"detalle": "BONDIOLA", "kilos": 47.72, "precio": 6500.0}, {"detalle": "BIFE", "kilos": 39.5, "precio": 12500.0}]'::jsonb);

  -- fila 21 · 2026-11-08 · remito 5599
  --   PATA MUSLO 45 kg x 2900 + SUPREMA 60 kg x 6400
  perform public.registrar_venta(v_id, '2026-11-08', '5599', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 60.0, "precio": 6400.0}]'::jsonb);

  -- fila 22 · 2026-11-08 · DESCUENTO (retiro) "RETIRO BIFE 16.7 kg x 12500"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-08', 'descuento', '1533', 208750.00, 'RETIRO BIFE 16.7 kg x 12500');

  -- fila 23 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '5694', 2500000.00, null);

  -- fila 24 · 2026-11-10 · remito 2723
  --   PATA MUSLO 30 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-10', '2723', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2900.0}]'::jsonb);

  -- fila 25 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1594', 700000.00, null);

  -- fila 28 · 2026-11-13 · remito 8408
  --   BOLA DE LOMO/TAPA 26.9 kg x 12000 + SUPREMA 30 kg x 6400 + PATA MUSLO 45 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-13', '8408', '[{"detalle": "BOLA DE LOMO/TAPA", "kilos": 26.9, "precio": 12000.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6400.0}, {"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}]'::jsonb);

  -- fila 31 · 2026-11-14 · remito 8430
  --   BIFE 23.1 kg x 13000 + PATA MUSLO 30 kg x 2900 + SUPREMA 15 kg x 6400
  perform public.registrar_venta(v_id, '2026-11-14', '8430', '[{"detalle": "BIFE", "kilos": 23.1, "precio": 13000.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6400.0}]'::jsonb);

  -- fila 32 · 2026-11-16 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1635', 600000.00, null);

  -- fila 33 · 2026-11-16 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '', 600000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 568190.00 then
    raise exception 'Cliente 15 (RODRI PASSINI): el saldo dio %, la planilla dice 568190.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 18 then
    raise exception 'Cliente 15 (RODRI PASSINI): se cargaron % movimientos y esperaba 18', v_cant;
  end if;
  raise notice 'Cliente 15 (RODRI PASSINI): ok · 18 movimientos · saldo 568190.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 16 · ERIC   (hoja "16 ERIC")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 16) then
    raise notice 'Cliente 16 (ERIC): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (16, 'ERIC', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 6 · 2026-10-27 · remito 1708
  --   PALETA 36.7 kg x 12500 + BONDIOLA 22 kg x 7000 + SUPREMA 15 kg x 6500 + PATA MUSLO 15 kg x 3300
  perform public.registrar_venta(v_id, '2026-10-27', '1708', '[{"detalle": "PALETA", "kilos": 36.7, "precio": 12500.0}, {"detalle": "BONDIOLA", "kilos": 22.0, "precio": 7000.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3300.0}]'::jsonb);

  -- fila 7 · 2026-10-31 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-31', 'pago', '2675', 759750.00, null);

  -- fila 10 · 2026-11-02 · remito 3066
  --   CUADRADA 14.7 kg x 12300 + PATA MUSLO 30 kg x 3300 + BONDIOLA 22.18 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-02', '3066', '[{"detalle": "CUADRADA", "kilos": 14.7, "precio": 12300.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3300.0}, {"detalle": "BONDIOLA", "kilos": 22.18, "precio": 7000.0}]'::jsonb);

  -- fila 11 · 2026-11-07 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '5686', 435070.00, null);

  -- fila 12 · 2026-11-10 · remito 2714
  --   BONDIOLA 46.1 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-10', '2714', '[{"detalle": "BONDIOLA", "kilos": 46.1, "precio": 7000.0}]'::jsonb);

  -- fila 13 · 2026-11-13 · remito 2743
  --   PATA MUSLO 30 kg x 3300
  perform public.registrar_venta(v_id, '2026-11-13', '2743', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3300.0}]'::jsonb);

  -- fila 15 · 2026-11-14 · remito 1612
  --   BONDIOLA 22.3 kg x 7000 + PATA MUSLO 15 kg x 3300
  perform public.registrar_venta(v_id, '2026-11-14', '1612', '[{"detalle": "BONDIOLA", "kilos": 22.3, "precio": 7000.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3300.0}]'::jsonb);

  -- fila 16 · 2026-11-14 · PAGO "PAGO" · fecha original de la planilla: 2026-01-16
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '1632', 627300.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 16 (ERIC): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 8 then
    raise exception 'Cliente 16 (ERIC): se cargaron % movimientos y esperaba 8', v_cant;
  end if;
  raise notice 'Cliente 16 (ERIC): ok · 8 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 17 · DARIO   (hoja "17 DARIO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 17) then
    raise notice 'Cliente 17 (DARIO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (17, 'DARIO', '', '', '', 'DARIO LEDESMA', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO 589500)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 589500.00);

  -- fila 4 · 2026-10-15 · PAGO "PAGO (VACIO)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-15', 'pago', '5516', 46700.00, null);

  -- fila 5 · 2026-10-15 · remito 5521 · fecha original de la planilla: 2026-06-16
  --   CORDERO 77.7 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-15', '5521', '[{"detalle": "CORDERO", "kilos": 77.7, "precio": 12500.0}]'::jsonb);

  -- fila 6 · 2026-10-17 · DESCUENTO (retiro) "RETIRO ASADO 18.35 kg x 14500"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-17', 'descuento', '5771', 266075.00, 'RETIRO ASADO 18.35 kg x 14500');

  -- fila 7 · 2026-10-21 · DESCUENTO (retiro) "COMPRA 1/2 R 99 kg x 10100"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-21', 'descuento', '5778', 999900.00, 'COMPRA 1/2 R 99 kg x 10100');

  -- fila 9 · 2026-10-28 · remito 5592
  --   PALETA 57.5 kg x 12000 + CUADRIL 82.2 kg x 12000
  perform public.registrar_venta(v_id, '2026-10-28', '5592', '[{"detalle": "PALETA", "kilos": 57.5, "precio": 12000.0}, {"detalle": "CUADRIL", "kilos": 82.2, "precio": 12000.0}]'::jsonb);

  -- fila 11 · 2026-11-03 · DESCUENTO (retiro) "VACIO RETIRO 5.755 kg x 15000 + BIFE RETIRO 5.8 kg x 13000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-03', 'descuento', '5664', 161725.00, 'VACIO RETIRO 5.755 kg x 15000 + BIFE RETIRO 5.8 kg x 13000');

  -- fila 13 · 2026-11-04 · DESCUENTO (retiro) "RETIRO NALGA C/T 6.7 kg x 15900 + RETIRO PICADA 2.9 kg x 13000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-04', 'descuento', '2696', 144230.00, 'RETIRO NALGA C/T 6.7 kg x 15900 + RETIRO PICADA 2.9 kg x 13000');

  -- fila 14 · 2026-11-04 · PAGO "DAVID(DEUDA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '', 200000.00, null);

  -- fila 15 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '5680', 753800.00, null);

  -- fila 16 · 2026-11-06 · DESCUENTO (retiro) "RETIRO ASADO 10.4 kg x 15500"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-06', 'descuento', '3020', 161200.00, 'RETIRO ASADO 10.4 kg x 15500');

  -- fila 17 · 2026-11-06 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '', 500000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 3520.00 then
    raise exception 'Cliente 17 (DARIO): el saldo dio %, la planilla dice 3520.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 12 then
    raise exception 'Cliente 17 (DARIO): se cargaron % movimientos y esperaba 12', v_cant;
  end if;
  raise notice 'Cliente 17 (DARIO): ok · 12 movimientos · saldo 3520.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 18 · FABI HORIZONTE   (hoja "18 FABI HORIZONTE")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 18) then
    raise notice 'Cliente 18 (FABI HORIZONTE): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (18, 'FABI HORIZONTE', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 6 · 2026-10-14 · remito 5551
  --   CORDERO 11.7 kg x 13500 + CUADRADA 7.4 kg x 13900 + BOLA DE LOMO 8.8 kg x 13900 + MEDIA RES 98 kg x 10500
  perform public.registrar_venta(v_id, '2026-10-14', '5551', '[{"detalle": "CORDERO", "kilos": 11.7, "precio": 13500.0}, {"detalle": "CUADRADA", "kilos": 7.4, "precio": 13900.0}, {"detalle": "BOLA DE LOMO", "kilos": 8.8, "precio": 13900.0}, {"detalle": "MEDIA RES", "kilos": 98.0, "precio": 10500.0}]'::jsonb);

  -- fila 7 · 2026-10-16 · remito 5512
  --   SUPREMA 15 kg x 6300
  perform public.registrar_venta(v_id, '2026-10-16', '5512', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}]'::jsonb);

  -- fila 8 · 2026-10-19 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '5901', 800000.00, null);

  -- fila 9 · 2026-10-21 · remito 5783
  --   CORDERO 11.7 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-21', '5783', '[{"detalle": "CORDERO", "kilos": 11.7, "precio": 13000.0}]'::jsonb);

  -- fila 11 · 2026-10-22 · remito 5526
  --   MEDIA RES 111 kg x 10600 + ASADO 23.5 kg x 15000
  perform public.registrar_venta(v_id, '2026-10-22', '5526', '[{"detalle": "MEDIA RES", "kilos": 111.0, "precio": 10600.0}, {"detalle": "ASADO", "kilos": 23.5, "precio": 15000.0}]'::jsonb);

  -- fila 12 · 2026-10-22 · PAGO "GOMEZ SIERRA · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-22', 'pago', '', 70000.00, null);

  -- fila 15 · 2026-10-24 · remito 5590
  --   SALCHICHA PARRILERA 8.8 kg x 9000 + CAPON 132.5 kg x 4300 + CHORIZO 11 kg x 6700
  perform public.registrar_venta(v_id, '2026-10-24', '5590', '[{"detalle": "SALCHICHA PARRILERA", "kilos": 8.8, "precio": 9000.0}, {"detalle": "CAPON", "kilos": 132.5, "precio": 4300.0}, {"detalle": "CHORIZO", "kilos": 11.0, "precio": 6700.0}]'::jsonb);

  -- fila 18 · 2026-10-25 · remito 5975
  --   MORCILLA VASCA 3.3 kg x 6500 + PATA MUSLO 45 kg x 2900 + SUPREMA 15 kg x 6300
  perform public.registrar_venta(v_id, '2026-10-25', '5975', '[{"detalle": "MORCILLA VASCA", "kilos": 3.3, "precio": 6500.0}, {"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}]'::jsonb);

  -- fila 19 · 2026-10-23 · PAGO "PAGO (TCB) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '', 300000.00, null);

  -- fila 21 · 2026-10-28 · remito 4629
  --   PATA MUSLO 30 kg x 2900 + SUPREMA 15 kg x 6300
  perform public.registrar_venta(v_id, '2026-10-28', '4629', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}]'::jsonb);

  -- fila 22 · 2026-10-28 · PAGO "PAGO TRANSF (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-28', 'pago', '4628', 100000.00, null);

  -- fila 23 · 2026-10-28 · PAGO "PAGO EFVO (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-28', 'pago', '', 600000.00, null);

  -- fila 25 · 2026-10-28 · remito 5593
  --   CUADRIL 5.8 kg x 13000 + PALETA 9.3 kg x 12300
  perform public.registrar_venta(v_id, '2026-10-28', '5593', '[{"detalle": "CUADRIL", "kilos": 5.8, "precio": 13000.0}, {"detalle": "PALETA", "kilos": 9.3, "precio": 12300.0}]'::jsonb);

  -- fila 26 · 2026-10-30 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '1719', 300000.00, null);

  -- fila 30 · 2026-10-31 · remito 5655
  --   CARRE 7.1 kg x 7000 + PECHITO 17.6 kg x 7000 + ASADO 22.8 kg x 14900 + PECHO 36.7 kg x 8600
  perform public.registrar_venta(v_id, '2026-10-31', '5655', '[{"detalle": "CARRE", "kilos": 7.1, "precio": 7000.0}, {"detalle": "PECHITO", "kilos": 17.6, "precio": 7000.0}, {"detalle": "ASADO", "kilos": 22.8, "precio": 14900.0}, {"detalle": "PECHO", "kilos": 36.7, "precio": 8600.0}]'::jsonb);

  -- fila 31 · 2026-10-31 · PAGO "PAGO (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-31', 'pago', '', 600000.00, null);

  -- fila 35 · 2026-11-02 · remito 2834
  --   PATA MUSLO 45 kg x 2900 + SUPREMA 15 kg x 6300
  perform public.registrar_venta(v_id, '2026-11-02', '2834', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}]'::jsonb);

  -- fila 36 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '5977', 200000.00, null);

  -- fila 37 · 2026-11-02 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 300000.00, null);

  -- fila 38 · 2026-11-04 · PAGO "TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '2693', 200000.00, null);

  -- fila 39 · 2026-11-04 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '', 300000.00, null);

  -- fila 45 · 2026-11-04 · remito 3075
  --   CHORIZO 20 kg x 6700 + MORCILLA VASCA 4.1 kg x 6600 + MORCILLA 6.4 kg x 6500 + PECHITO 21.1 kg x 6900 + CORDERO 9.5 kg x 13000 + PATA MUSLO 60 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-04', '3075', '[{"detalle": "CHORIZO", "kilos": 20.0, "precio": 6700.0}, {"detalle": "MORCILLA VASCA", "kilos": 4.1, "precio": 6600.0}, {"detalle": "MORCILLA", "kilos": 6.4, "precio": 6500.0}, {"detalle": "PECHITO", "kilos": 21.1, "precio": 6900.0}, {"detalle": "CORDERO", "kilos": 9.5, "precio": 13000.0}, {"detalle": "PATA MUSLO", "kilos": 60.0, "precio": 2900.0}]'::jsonb);

  -- fila 47 · 2026-11-05 · remito 1732
  --   DELANTERO 125.3 kg x 9800 + MOCHO 34.4 kg x 10500
  perform public.registrar_venta(v_id, '2026-11-05', '1732', '[{"detalle": "DELANTERO", "kilos": 125.3, "precio": 9800.0}, {"detalle": "MOCHO", "kilos": 34.4, "precio": 10500.0}]'::jsonb);

  -- fila 49 · 2026-11-05 · remito 1501
  --   BOLA DE LOMO/CUADRADA 17.2 kg x 13000 + CARRE 12.2 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-05', '1501', '[{"detalle": "BOLA DE LOMO/CUADRADA", "kilos": 17.2, "precio": 13000.0}, {"detalle": "CARRE", "kilos": 12.2, "precio": 7000.0}]'::jsonb);

  -- fila 50 · 2026-11-06 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '3013', 400000.00, null);

  -- fila 51 · 2026-11-08 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '3030', 431650.00, null);

  -- fila 52 · 2026-11-09 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1552', 300000.00, null);

  -- fila 53 · 2026-11-09 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '', 400000.00, null);

  -- fila 54 · 2026-11-09 · DESCUENTO (retiro) "RETIRO LOMO 3.6 kg x 19000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-09', 'descuento', '3044', 68400.00, 'RETIRO LOMO 3.6 kg x 19000');

  -- fila 55 · 2026-11-09 · remito s/n
  --   POLLO (POR UNIDAD) 1 u x 63000
  perform public.registrar_venta(v_id, '2026-11-09', '', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 63000.0}]'::jsonb);

  -- fila 56 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '2710', 400000.00, null);

  -- fila 57 · 2026-11-11 · remito 2725
  --   PATA MUSLO 60 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-11', '2725', '[{"detalle": "PATA MUSLO", "kilos": 60.0, "precio": 2900.0}]'::jsonb);

  -- fila 58 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1583', 300000.00, null);

  -- fila 59 · 2026-11-11 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1600', 300000.00, null);

  -- fila 64 · 2026-11-12 · remito 2755
  --   PECHO 78.1 kg x 8600 + CHORIZO 10.9 kg x 6500 + ASADO 12.7 kg x 13800 + CUADRIL 12.9 kg x 13000 + BIFE 18.5 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-12', '2755', '[{"detalle": "PECHO", "kilos": 78.1, "precio": 8600.0}, {"detalle": "CHORIZO", "kilos": 10.9, "precio": 6500.0}, {"detalle": "ASADO", "kilos": 12.7, "precio": 13800.0}, {"detalle": "CUADRIL", "kilos": 12.9, "precio": 13000.0}, {"detalle": "BIFE", "kilos": 18.5, "precio": 13000.0}]'::jsonb);

  -- fila 65 · 2026-11-13 · remito 8412
  --   SUPREMA 45 kg x 6600
  perform public.registrar_venta(v_id, '2026-11-13', '8412', '[{"detalle": "SUPREMA", "kilos": 45.0, "precio": 6600.0}]'::jsonb);

  -- fila 66 · 2026-11-13 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '', 200000.00, null);

  -- fila 67 · 2026-11-13 · PAGO "TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '', 200000.00, null);

  -- fila 68 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '1618', 400000.00, null);

  -- fila 69 · 2026-11-14 · remito 8419
  --   PATA MUSLO 75 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-14', '8419', '[{"detalle": "PATA MUSLO", "kilos": 75.0, "precio": 2900.0}]'::jsonb);

  -- fila 70 · 2026-11-14 · remito 8425
  --   CORDERO 11.6 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-14', '8425', '[{"detalle": "CORDERO", "kilos": 11.6, "precio": 13000.0}]'::jsonb);

  -- fila 71 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '8429', 400000.00, null);

  -- fila 72 · 2026-11-16 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1631', 145700.00, null);

  -- fila 73 · 2026-11-16 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '', 230000.00, null);

  -- fila 74 · 2026-11-16 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '', 170000.00, null);

  -- fila 32 · "PAGO (RENZO)": pago sin importe en la planilla (no suma al saldo). No se carga.

  -- fila 33 · "PAGO EFVO": pago sin importe en la planilla (no suma al saldo). No se carga.

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 2237870.00 then
    raise exception 'Cliente 18 (FABI HORIZONTE): el saldo dio %, la planilla dice 2237870.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 45 then
    raise exception 'Cliente 18 (FABI HORIZONTE): se cargaron % movimientos y esperaba 45', v_cant;
  end if;
  raise notice 'Cliente 18 (FABI HORIZONTE): ok · 45 movimientos · saldo 2237870.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 19 · CHURRUPIT   (hoja "19 CHURRUPIT")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 19) then
    raise notice 'Cliente 19 (CHURRUPIT): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (19, 'CHURRUPIT', '', '', '', 'GUILLERMO CHURRUPIT', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-14 · remito 5552
  --   CORDERO 124.8 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-14', '5552', '[{"detalle": "CORDERO", "kilos": 124.8, "precio": 13000.0}]'::jsonb);

  -- fila 4 · 2026-10-14 · remito 5563
  --   PECETO 7.6 kg x 15000
  perform public.registrar_venta(v_id, '2026-10-14', '5563', '[{"detalle": "PECETO", "kilos": 7.6, "precio": 15000.0}]'::jsonb);

  -- fila 5 · 2026-10-15 · DESCUENTO (retiro) "ASADO (RETIRO) 22.9 kg x 15500"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-15', 'descuento', '5574', 354950.00, 'ASADO (RETIRO) 22.9 kg x 15500');

  -- fila 6 · 2026-10-15 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-15', 'pago', '', 1622400.00, null);

  -- fila 7 · 2026-10-22 · remito 5788
  --   ASADO 22 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-22', '5788', '[{"detalle": "ASADO", "kilos": 22.0, "precio": 15500.0}]'::jsonb);

  -- fila 8 · 2026-10-29 · PAGO "BCO PROVINCIA N°16827927"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 1500000.00, null);

  -- fila 9 · 2026-10-31 · remito 2670
  --   CORDERO 79 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-31', '2670', '[{"detalle": "CORDERO", "kilos": 79.0, "precio": 13000.0}]'::jsonb);

  -- fila 11 · 2026-11-03 · remito 2839
  --   PATA MUSLO 30 kg x 2900 + SUPREMA 15 kg x 6400
  perform public.registrar_venta(v_id, '2026-11-03', '2839', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6400.0}]'::jsonb);

  -- fila 13 · 2026-11-05 · remito 1733
  --   ASADO 94.8 kg x 14800 + PARRILLERO 36.9 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-05', '1733', '[{"detalle": "ASADO", "kilos": 94.8, "precio": 14800.0}, {"detalle": "PARRILLERO", "kilos": 36.9, "precio": 13000.0}]'::jsonb);

  -- fila 15 · 2026-11-06 · DESCUENTO (retiro) "CHINCHU (RETIRO) 12.8 kg x 6400 + RIÑON (RETIRO) 8.8 kg x 6600"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-06', 'descuento', '1742', 140000.00, 'CHINCHU (RETIRO) 12.8 kg x 6400 + RIÑON (RETIRO) 8.8 kg x 6600');

  -- fila 16 · 2026-11-10 · remito 2711
  --   PATA MUSLO 45 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-10', '2711', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}]'::jsonb);

  -- fila 17 · 2026-11-10 · PAGO "PAGO CH N°16827928"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1574', 1500000.00, null);

  -- fila 20 · 2026-11-12 · remito 5999
  --   MOCHO 73.2 kg x 10000 + ASADO C/VACIO 127.4 kg x 15200 + PALETA/ROAST BEEF 12.2 kg x 13500
  perform public.registrar_venta(v_id, '2026-11-12', '5999', '[{"detalle": "MOCHO", "kilos": 73.2, "precio": 10000.0}, {"detalle": "ASADO C/VACIO", "kilos": 127.4, "precio": 15200.0}, {"detalle": "PALETA/ROAST BEEF", "kilos": 12.2, "precio": 13500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 3016470.00 then
    raise exception 'Cliente 19 (CHURRUPIT): el saldo dio %, la planilla dice 3016470.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 13 then
    raise exception 'Cliente 19 (CHURRUPIT): se cargaron % movimientos y esperaba 13', v_cant;
  end if;
  raise notice 'Cliente 19 (CHURRUPIT): ok · 13 movimientos · saldo 3016470.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 20 · LUCHO RAMIREZ   (hoja "20 LUCHO RAMIREZ")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 20) then
    raise notice 'Cliente 20 (LUCHO RAMIREZ): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (20, 'LUCHO RAMIREZ', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-14 · remito 5553
  --   MEDIA RES 105 kg x 9800
  perform public.registrar_venta(v_id, '2026-10-14', '5553', '[{"detalle": "MEDIA RES", "kilos": 105.0, "precio": 9800.0}]'::jsonb);

  -- fila 4 · 2026-10-20 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5873', 500000.00, null);

  -- fila 6 · 2026-10-21 · remito 5781
  --   CUADRIL 5.2 kg x 13000 + TORTUGUITA 1.6 kg x 12000
  perform public.registrar_venta(v_id, '2026-10-21', '5781', '[{"detalle": "CUADRIL", "kilos": 5.2, "precio": 13000.0}, {"detalle": "TORTUGUITA", "kilos": 1.6, "precio": 12000.0}]'::jsonb);

  -- fila 8 · 2026-10-22 · remito 5532
  --   BIFE 17.3 kg x 12500 + PALETA 7.7 kg x 12000
  perform public.registrar_venta(v_id, '2026-10-22', '5532', '[{"detalle": "BIFE", "kilos": 17.3, "precio": 12500.0}, {"detalle": "PALETA", "kilos": 7.7, "precio": 12000.0}]'::jsonb);

  -- fila 11 · 2026-10-26 · remito 5792
  --   PALETA 7.8 kg x 11900 + BOLA DE LOMO/CUADRADA 7.8 kg x 11900 + CUADRIL 4.6 kg x 12800
  perform public.registrar_venta(v_id, '2026-10-26', '5792', '[{"detalle": "PALETA", "kilos": 7.8, "precio": 11900.0}, {"detalle": "BOLA DE LOMO/CUADRADA", "kilos": 7.8, "precio": 11900.0}, {"detalle": "CUADRIL", "kilos": 4.6, "precio": 12800.0}]'::jsonb);

  -- fila 12 · 2026-10-26 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '3052', 529000.00, null);

  -- fila 13 · 2026-10-30 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '1718', 200000.00, null);

  -- fila 17 · 2026-10-31 · remito 2671
  --   CUADRIL 6.2 kg x 13000 + PALETA 9 kg x 12000 + CUADRADA 3.6 kg x 12300 + ASADO 22.8 kg x 13900
  perform public.registrar_venta(v_id, '2026-10-31', '2671', '[{"detalle": "CUADRIL", "kilos": 6.2, "precio": 13000.0}, {"detalle": "PALETA", "kilos": 9.0, "precio": 12000.0}, {"detalle": "CUADRADA", "kilos": 3.6, "precio": 12300.0}, {"detalle": "ASADO", "kilos": 22.8, "precio": 13900.0}]'::jsonb);

  -- fila 18 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '5978', 428820.00, null);

  -- fila 21 · 2026-11-05 · remito 1734
  --   BIFE 14 kg x 12000 + CUADRIL 5 kg x 13000 + PALETA 8 kg x 12000
  perform public.registrar_venta(v_id, '2026-11-05', '1734', '[{"detalle": "BIFE", "kilos": 14.0, "precio": 12000.0}, {"detalle": "CUADRIL", "kilos": 5.0, "precio": 13000.0}, {"detalle": "PALETA", "kilos": 8.0, "precio": 12000.0}]'::jsonb);

  -- fila 22 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1551', 521500.00, null);

  -- fila 23 · 2026-11-09 · remito 3045
  --   PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-09', '3045', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 29 · 2026-11-12 · remito 2756
  --   BIFE 17.6 kg x 12000 + PALETA 8.6 kg x 12000 + CUADRIL 6.9 kg x 13000 + ROAST BEEF 8.4 kg x 12000 + BOLA DE LOMO/CUADRADA 9.5 kg x 12500 + TAPA DE ASADO 2.9 kg x 12000
  perform public.registrar_venta(v_id, '2026-11-12', '2756', '[{"detalle": "BIFE", "kilos": 17.6, "precio": 12000.0}, {"detalle": "PALETA", "kilos": 8.6, "precio": 12000.0}, {"detalle": "CUADRIL", "kilos": 6.9, "precio": 13000.0}, {"detalle": "ROAST BEEF", "kilos": 8.4, "precio": 12000.0}, {"detalle": "BOLA DE LOMO/CUADRADA", "kilos": 9.5, "precio": 12500.0}, {"detalle": "TAPA DE ASADO", "kilos": 2.9, "precio": 12000.0}]'::jsonb);

  -- fila 30 · 2026-11-14 · remito 8424
  --   ASADO 5.9 kg x 14900
  perform public.registrar_venta(v_id, '2026-11-14', '8424', '[{"detalle": "ASADO", "kilos": 5.9, "precio": 14900.0}]'::jsonb);

  -- fila 31 · 2026-11-14 · remito 8432
  --   ASADO 10.4 kg x 14900
  perform public.registrar_venta(v_id, '2026-11-14', '8432', '[{"detalle": "ASADO", "kilos": 10.4, "precio": 14900.0}]'::jsonb);

  -- fila 32 · 2026-11-16 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1630', 655850.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 657420.00 then
    raise exception 'Cliente 20 (LUCHO RAMIREZ): el saldo dio %, la planilla dice 657420.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 16 then
    raise exception 'Cliente 20 (LUCHO RAMIREZ): se cargaron % movimientos y esperaba 16', v_cant;
  end if;
  raise notice 'Cliente 20 (LUCHO RAMIREZ): ok · 16 movimientos · saldo 657420.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 21 · AVATAR   (hoja "21 AVATAR")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 21) then
    raise notice 'Cliente 21 (AVATAR): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (21, 'AVATAR', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 6 · 2026-10-15 · remito 5555
  --   BIFE 29.6 kg x 12900 + PECHO 31 kg x 8500 + CUADRIL 25.4 kg x 13500 + MEDIA RES 96 kg x 9700
  perform public.registrar_venta(v_id, '2026-10-15', '5555', '[{"detalle": "BIFE", "kilos": 29.6, "precio": 12900.0}, {"detalle": "PECHO", "kilos": 31.0, "precio": 8500.0}, {"detalle": "CUADRIL", "kilos": 25.4, "precio": 13500.0}, {"detalle": "MEDIA RES", "kilos": 96.0, "precio": 9700.0}]'::jsonb);

  -- fila 9 · 2026-10-15 · remito 5580
  --   BONDIOLA 11.8 kg x 6800 + PALETA 33.7 kg x 13000 + CUADRIL 24.8 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-15', '5580', '[{"detalle": "BONDIOLA", "kilos": 11.8, "precio": 6800.0}, {"detalle": "PALETA", "kilos": 33.7, "precio": 13000.0}, {"detalle": "CUADRIL", "kilos": 24.8, "precio": 13000.0}]'::jsonb);

  -- fila 11 · 2026-10-16 · remito 5503
  --   ASADO 24.7 kg x 12900 + MORCILLA 5.7 kg x 4000
  perform public.registrar_venta(v_id, '2026-10-16', '5503', '[{"detalle": "ASADO", "kilos": 24.7, "precio": 12900.0}, {"detalle": "MORCILLA", "kilos": 5.7, "precio": 4000.0}]'::jsonb);

  -- fila 12 · 2026-10-20 · PAGO "PAGO(FRIMSA S.A.) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '', 2000000.00, null);

  -- fila 13 · 2026-10-21 · PAGO "PAGO (BLANCO) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-21', 'pago', '', 601610.00, null);

  -- fila 14 · 2026-10-21 · PAGO "PAGO (BLANCO) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-21', 'pago', '', 500000.00, null);

  -- fila 19 · 2026-10-21 · remito 5779
  --   DELANTERO 66.1 kg x 9700 + BOLA DE LOMO 12.8 kg x 13500 + CUADRADA 10.1 kg x 13500 + BOLA DE LOMO 3.8 kg x 13500 + CUADRADA 3 kg x 13500
  perform public.registrar_venta(v_id, '2026-10-21', '5779', '[{"detalle": "DELANTERO", "kilos": 66.1, "precio": 9700.0}, {"detalle": "BOLA DE LOMO", "kilos": 12.8, "precio": 13500.0}, {"detalle": "CUADRADA", "kilos": 10.1, "precio": 13500.0}, {"detalle": "BOLA DE LOMO", "kilos": 3.8, "precio": 13500.0}, {"detalle": "CUADRADA", "kilos": 3.0, "precio": 13500.0}]'::jsonb);

  -- fila 21 · 2026-10-22 · remito 5536
  --   BIFE 38.6 kg x 12900 + MEDIA RES 114 kg x 9700
  perform public.registrar_venta(v_id, '2026-10-22', '5536', '[{"detalle": "BIFE", "kilos": 38.6, "precio": 12900.0}, {"detalle": "MEDIA RES", "kilos": 114.0, "precio": 9700.0}]'::jsonb);

  -- fila 24 · 2026-10-26 · remito 5790
  --   SUPREMA 30 kg x 6400 + PATA MUSLO 30 kg x 2900 + BONDIOLA 21.95 kg x 6500
  perform public.registrar_venta(v_id, '2026-10-26', '5790', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6400.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2900.0}, {"detalle": "BONDIOLA", "kilos": 21.95, "precio": 6500.0}]'::jsonb);

  -- fila 25 · 2026-10-26 · PAGO "PAGO TARNSF (KOKI) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '', 1000000.00, null);

  -- fila 26 · 2026-10-27 · PAGO "PAGO TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-27', 'pago', '5892', 1645860.00, null);

  -- fila 28 · 2026-10-28 · remito 4634
  --   SUPREMA 45 kg x 6500 + PATA MUSLO 45 kg x 2900
  perform public.registrar_venta(v_id, '2026-10-28', '4634', '[{"detalle": "SUPREMA", "kilos": 45.0, "precio": 6500.0}, {"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}]'::jsonb);

  -- fila 32 · 2026-10-31 · remito 5658
  --   ASA/RUEDA 62.2 kg x 10500 + DELANTERO 76.4 kg x 9500 + MEDIA RES 118 kg x 9700 + MORCILLA 6.3 kg x 4600
  perform public.registrar_venta(v_id, '2026-10-31', '5658', '[{"detalle": "ASA/RUEDA", "kilos": 62.2, "precio": 10500.0}, {"detalle": "DELANTERO", "kilos": 76.4, "precio": 9500.0}, {"detalle": "MEDIA RES", "kilos": 118.0, "precio": 9700.0}, {"detalle": "MORCILLA", "kilos": 6.3, "precio": 4600.0}]'::jsonb);

  -- fila 33 · 2026-10-31 · remito 2685
  --   PECHITO 26.3 kg x 6600
  perform public.registrar_venta(v_id, '2026-10-31', '2685', '[{"detalle": "PECHITO", "kilos": 26.3, "precio": 6600.0}]'::jsonb);

  -- fila 35 · 2026-11-02 · remito 2836
  --   PATA MUSLO 90 kg x 2900 + BONDIOLA 22.49 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-02', '2836', '[{"detalle": "PATA MUSLO", "kilos": 90.0, "precio": 2900.0}, {"detalle": "BONDIOLA", "kilos": 22.49, "precio": 6500.0}]'::jsonb);

  -- fila 36 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '2699', 3570735.00, null);

  -- fila 37 · 2026-11-04 · remito 3072
  --   PATA MUSLO 45 kg x 2800
  perform public.registrar_venta(v_id, '2026-11-04', '3072', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2800.0}]'::jsonb);

  -- fila 40 · 2026-11-05 · remito 1737
  --   PARRILLERO 71.7 kg x 13500 + ASADO 49.1 kg x 14900 + BONDIOLA 21.23 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-05', '1737', '[{"detalle": "PARRILLERO", "kilos": 71.7, "precio": 13500.0}, {"detalle": "ASADO", "kilos": 49.1, "precio": 14900.0}, {"detalle": "BONDIOLA", "kilos": 21.23, "precio": 6500.0}]'::jsonb);

  -- fila 43 · 2026-11-05 · remito 1505
  --   COLITA DE CUADRIL 6.7 kg x 13900 + BOLA DE LOMO 7.5 kg x 12000 + NALGA 10.4 kg x 15000
  perform public.registrar_venta(v_id, '2026-11-05', '1505', '[{"detalle": "COLITA DE CUADRIL", "kilos": 6.7, "precio": 13900.0}, {"detalle": "BOLA DE LOMO", "kilos": 7.5, "precio": 12000.0}, {"detalle": "NALGA", "kilos": 10.4, "precio": 15000.0}]'::jsonb);

  -- fila 44 · 2026-11-05 · DESCUENTO (retiro) "RETIRO MATAMBRE 37.8 kg x 13500"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-05', 'descuento', '', 510300.00, 'RETIRO MATAMBRE 37.8 kg x 13500');

  -- fila 47 · 2026-11-09 · remito 16487
  --   SUPREMA 45 kg x 6600 + PATA MUSLO 150 kg x 2800 + BONDIOLA 23.02 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-09', '16487', '[{"detalle": "SUPREMA", "kilos": 45.0, "precio": 6600.0}, {"detalle": "PATA MUSLO", "kilos": 150.0, "precio": 2800.0}, {"detalle": "BONDIOLA", "kilos": 23.02, "precio": 6500.0}]'::jsonb);

  -- fila 48 · 2026-11-11 · remito 2729
  --   CARRE 6.6 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-11', '2729', '[{"detalle": "CARRE", "kilos": 6.6, "precio": 6800.0}]'::jsonb);

  -- fila 49 · 2026-11-12 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '', 3066180.00, null);

  -- fila 52 · 2026-11-13 · remito 2752
  --   ASADO 74.1 kg x 14900 + PECHO 41.6 kg x 8600 + SUPREMA 30 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-13', '2752', '[{"detalle": "ASADO", "kilos": 74.1, "precio": 14900.0}, {"detalle": "PECHO", "kilos": 41.6, "precio": 8600.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6500.0}]'::jsonb);

  -- fila 55 · 2026-11-14 · remito 1614
  --   BIFE 27.4 kg x 11000 + CUADRIL 34.2 kg x 13500 + SUPREMA 30 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-14', '1614', '[{"detalle": "BIFE", "kilos": 27.4, "precio": 11000.0}, {"detalle": "CUADRIL", "kilos": 34.2, "precio": 13500.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 2659830.00 then
    raise exception 'Cliente 21 (AVATAR): el saldo dio %, la planilla dice 2659830.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 25 then
    raise exception 'Cliente 21 (AVATAR): se cargaron % movimientos y esperaba 25', v_cant;
  end if;
  raise notice 'Cliente 21 (AVATAR): ok · 25 movimientos · saldo 2659830.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 22 · B.C   (hoja "22 B.C")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 22) then
    raise notice 'Cliente 22 (B.C): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (22, 'B.C', '', '', '', 'B.C CARMONA', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-14 · remito 5557
  --   NALGA 65 kg x 15000 + VACIO 9.4 kg x 16500
  perform public.registrar_venta(v_id, '2026-10-14', '5557', '[{"detalle": "NALGA", "kilos": 65.0, "precio": 15000.0}, {"detalle": "VACIO", "kilos": 9.4, "precio": 16500.0}]'::jsonb);

  -- fila 5 · 2026-10-19 · PAGO "PCIA N°14704360 · CHEQUE"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '', 1130100.00, null);

  -- fila 8 · 2026-11-05 · remito 1508
  --   PICADA 19.5 kg x 9500 + TAPA DE ASADO 14.2 kg x 12500 + MATAMBRE 14 kg x 13500
  perform public.registrar_venta(v_id, '2026-11-05', '1508', '[{"detalle": "PICADA", "kilos": 19.5, "precio": 9500.0}, {"detalle": "TAPA DE ASADO", "kilos": 14.2, "precio": 12500.0}, {"detalle": "MATAMBRE", "kilos": 14.0, "precio": 13500.0}]'::jsonb);

  -- fila 9 · 2026-11-10 · PAGO "PAGO CH N° 14704361"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1572', 551750.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 22 (B.C): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 22 (B.C): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 22 (B.C): ok · 4 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 23 · A Y B   (hoja "23 A Y B")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 23) then
    raise notice 'Cliente 23 (A Y B): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (23, 'A Y B', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-14 · remito 5558
  --   MEDIA RES 115.6 kg x 9900
  perform public.registrar_venta(v_id, '2026-10-14', '5558', '[{"detalle": "MEDIA RES", "kilos": 115.6, "precio": 9900.0}]'::jsonb);

  -- fila 4 · 2026-10-16 · remito 5504
  --   SUPREMA 30 kg x 6200
  perform public.registrar_venta(v_id, '2026-10-16', '5504', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6200.0}]'::jsonb);

  -- fila 5 · 2026-10-20 · PAGO "PAGO (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5883', 1330000.00, null);

  -- fila 7 · 2026-10-22 · remito 5538
  --   ASADO 29 kg x 13900 + MEDIA RES 115 kg x 9900
  perform public.registrar_venta(v_id, '2026-10-22', '5538', '[{"detalle": "ASADO", "kilos": 29.0, "precio": 13900.0}, {"detalle": "MEDIA RES", "kilos": 115.0, "precio": 9900.0}]'::jsonb);

  -- fila 10 · 2026-10-25 · remito 1701
  --   BONDIOLA 22.39 kg x 6900 + POLLO (POR UNIDAD) 2 u x 63000 + CERDO 97 kg x 4300
  perform public.registrar_venta(v_id, '2026-10-25', '1701', '[{"detalle": "BONDIOLA", "kilos": 22.39, "precio": 6900.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 2.0, "precio": 63000.0}, {"detalle": "CERDO", "kilos": 97.0, "precio": 4300.0}]'::jsonb);

  -- fila 11 · 2026-10-27 · remito 1706
  --   MOCHO 29 kg x 11900
  perform public.registrar_venta(v_id, '2026-10-27', '1706', '[{"detalle": "MOCHO", "kilos": 29.0, "precio": 11900.0}]'::jsonb);

  -- fila 12 · 2026-10-27 · DESCUENTO (descuento) "DESC ASADO 27.7 kg x 13900"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-27', 'descuento', '', 385030.00, 'DESC ASADO 27.7 kg x 13900');

  -- fila 13 · 2026-10-30 · PAGO "PAGO (BERNAL S.A.)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '5800', 1500000.00, null);

  -- fila 18 · 2026-10-31 · remito 5656
  --   PECHITO 6 kg x 6600 + CARRE 6.7 kg x 6600 + PALETA DE CERDO 5.9 kg x 4800 + ASADO 25.2 kg x 14500 + POLLO (POR UNIDAD) 4 u x 64000
  perform public.registrar_venta(v_id, '2026-10-31', '5656', '[{"detalle": "PECHITO", "kilos": 6.0, "precio": 6600.0}, {"detalle": "CARRE", "kilos": 6.7, "precio": 6600.0}, {"detalle": "PALETA DE CERDO", "kilos": 5.9, "precio": 4800.0}, {"detalle": "ASADO", "kilos": 25.2, "precio": 14500.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 4.0, "precio": 64000.0}]'::jsonb);

  -- fila 19 · 2026-11-06 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '1516', 400000.00, null);

  -- fila 22 · 2026-11-06 · remito 3006
  --   PECHO 32.8 kg x 8600 + ASADO 34.3 kg x 14900 + MOCHO 29.6 kg x 10300
  perform public.registrar_venta(v_id, '2026-11-06', '3006', '[{"detalle": "PECHO", "kilos": 32.8, "precio": 8600.0}, {"detalle": "ASADO", "kilos": 34.3, "precio": 14900.0}, {"detalle": "MOCHO", "kilos": 29.6, "precio": 10300.0}]'::jsonb);

  -- fila 25 · 2026-11-07 · remito 1523
  --   CAPON 95 kg x 4300 + POLLO (POR UNIDAD) 7 u x 64000 + SUPREMA 15 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-07', '1523', '[{"detalle": "CAPON", "kilos": 95.0, "precio": 4300.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 7.0, "precio": 64000.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}]'::jsonb);

  -- fila 26 · 2026-11-11 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1582', 1000000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 2085271.00 then
    raise exception 'Cliente 23 (A Y B): el saldo dio %, la planilla dice 2085271.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 13 then
    raise exception 'Cliente 23 (A Y B): se cargaron % movimientos y esperaba 13', v_cant;
  end if;
  raise notice 'Cliente 23 (A Y B): ok · 13 movimientos · saldo 2085271.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 24 · VICCENZZO   (hoja "24 VICCENZZO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 24) then
    raise notice 'Cliente 24 (VICCENZZO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (24, 'VICCENZZO', '', '', '', 'VICCENZO', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-14 · remito 5559
  --   LOMO 23.5 kg x 21000
  perform public.registrar_venta(v_id, '2026-10-14', '5559', '[{"detalle": "LOMO", "kilos": 23.5, "precio": 21000.0}]'::jsonb);

  -- fila 4 · 2026-10-20 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5878', 493500.00, null);

  -- fila 5 · 2026-11-05 · remito 2845
  --   LOMO 27.4 kg x 21000
  perform public.registrar_venta(v_id, '2026-11-05', '2845', '[{"detalle": "LOMO", "kilos": 27.4, "precio": 21000.0}]'::jsonb);

  -- fila 6 · 2026-11-10 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1573', 575400.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 24 (VICCENZZO): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 24 (VICCENZZO): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 24 (VICCENZZO): ok · 4 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 25 · MIGUEL S.R   (hoja "25 MIGUEL S.R")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 25) then
    raise notice 'Cliente 25 (MIGUEL S.R): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (25, 'MIGUEL S.R', '', '', '', 'MIGUEL SANTA RITA', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-14 · remito 5564
  --   PECHO 86.7 kg x 8700 + BONDIOLA 23 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-14', '5564', '[{"detalle": "PECHO", "kilos": 86.7, "precio": 8700.0}, {"detalle": "BONDIOLA", "kilos": 23.0, "precio": 6900.0}]'::jsonb);

  -- fila 5 · 2026-10-21 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-21', 'pago', '5884', 100000.00, null);

  -- fila 6 · 2026-10-24 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-24', 'pago', '5973', 100000.00, null);

  -- fila 7 · 2026-10-24 · remito 1703
  --   POLLO (POR UNIDAD) 47 u x 60000
  perform public.registrar_venta(v_id, '2026-10-24', '1703', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 47.0, "precio": 60000.0}]'::jsonb);

  -- fila 8 · 2026-10-29 · PAGO "TRANSF (AMS)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '5894', 400000.00, null);

  -- fila 9 · 2026-10-29 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 234000.00, null);

  -- fila 10 · 2026-10-29 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 285000.00, null);

  -- fila 11 · 2026-10-29 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 375000.00, null);

  -- fila 12 · 2026-10-29 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '5898', 500000.00, null);

  -- fila 13 · 2026-10-29 · remito 5900
  --   SUPREMA 60 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-29', '5900', '[{"detalle": "SUPREMA", "kilos": 60.0, "precio": 6100.0}]'::jsonb);

  -- fila 15 · 2026-10-30 · remito 1714
  --   PATA MUSLO 60 kg x 2750 + BONDIOLA 22.06 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-30', '1714', '[{"detalle": "PATA MUSLO", "kilos": 60.0, "precio": 2750.0}, {"detalle": "BONDIOLA", "kilos": 22.06, "precio": 6900.0}]'::jsonb);

  -- fila 16 · 2026-10-30 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '', 317214.00, null);

  -- fila 17 · 2026-10-31 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-31', 'pago', '5595', 300000.00, null);

  -- fila 20 · 2026-10-31 · remito 5595
  --   POLLO (POR UNIDAD) 35 u x 60000 + PATA MUSLO 16 kg x 2750 + SUPREMA 6 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-31', '5595', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 35.0, "precio": 60000.0}, {"detalle": "PATA MUSLO", "kilos": 16.0, "precio": 2750.0}, {"detalle": "SUPREMA", "kilos": 6.0, "precio": 6100.0}]'::jsonb);

  -- fila 21 · 2026-11-02 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 760000.00, null);

  -- fila 22 · 2026-11-03 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '', 500000.00, null);

  -- fila 23 · 2026-11-04 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '5679', 430000.00, null);

  -- fila 27 · 2026-11-07 · remito 3023
  --   POLLO (POR UNIDAD) 50 u x 60000 + PATA MUSLO 150 kg x 2750 + SUPREMA 75 kg x 6400 + BONDIOLA 22.49 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-07', '3023', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 50.0, "precio": 60000.0}, {"detalle": "PATA MUSLO", "kilos": 150.0, "precio": 2750.0}, {"detalle": "SUPREMA", "kilos": 75.0, "precio": 6400.0}, {"detalle": "BONDIOLA", "kilos": 22.49, "precio": 6900.0}]'::jsonb);

  -- fila 28 · 2026-11-07 · remito 2848
  --   PECHITO 21.1 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-07', '2848', '[{"detalle": "PECHITO", "kilos": 21.1, "precio": 6800.0}]'::jsonb);

  -- fila 29 · 2026-11-07 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '', 300000.00, null);

  -- fila 30 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1556', 500000.00, null);

  -- fila 31 · 2026-11-12 · DESCUENTO (consumo) "GASTOS (GARRAFA Y VS)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-12', 'descuento', '1544', 36900.00, 'GASTOS (GARRAFA Y VS)');

  -- fila 32 · 2026-11-13 · DESCUENTO (retiro) "RETIRO RIÑON 3 kg x 6100"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-13', 'descuento', '8416', 18300.00, 'RETIRO RIÑON 3 kg x 6100');

  -- fila 33 · 2026-11-13 · remito 2741
  --   BIFE 27.9 kg x 10000
  perform public.registrar_venta(v_id, '2026-11-13', '2741', '[{"detalle": "BIFE", "kilos": 27.9, "precio": 10000.0}]'::jsonb);

  -- fila 34 · 2026-11-14 · remito 8420
  --   PECETO 8.9 kg x 16500
  perform public.registrar_venta(v_id, '2026-11-14', '8420', '[{"detalle": "PECETO", "kilos": 8.9, "precio": 16500.0}]'::jsonb);

  -- fila 35 · 2026-11-15 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '2748', 1100000.00, null);

  -- fila 36 · 2026-11-15 · DESCUENTO (retiro) "COMPRA ALMACEN"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-15', 'descuento', '', 3000.00, 'COMPRA ALMACEN');

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 4954401.00 then
    raise exception 'Cliente 25 (MIGUEL S.R): el saldo dio %, la planilla dice 4954401.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 27 then
    raise exception 'Cliente 25 (MIGUEL S.R): se cargaron % movimientos y esperaba 27', v_cant;
  end if;
  raise notice 'Cliente 25 (MIGUEL S.R): ok · 27 movimientos · saldo 4954401.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 26 · MACOCO   (hoja "26 MACOCO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 26) then
    raise notice 'Cliente 26 (MACOCO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (26, 'MACOCO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-14 · remito 5565
  --   PECETO 11.4 kg x 14800
  perform public.registrar_venta(v_id, '2026-10-14', '5565', '[{"detalle": "PECETO", "kilos": 11.4, "precio": 14800.0}]'::jsonb);

  -- fila 4 · 2026-10-22 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-22', 'pago', '', 170000.00, null);

  -- fila 5 · 2026-10-22 · remito 5888
  --   PECETO 34.6 kg x 14800
  perform public.registrar_venta(v_id, '2026-10-22', '5888', '[{"detalle": "PECETO", "kilos": 34.6, "precio": 14800.0}]'::jsonb);

  -- fila 7 · 2026-10-23 · remito 5959
  --   TAPA DE ASADO 47.1 kg x 12000 + ROAST BEEF 50.9 kg x 12000
  perform public.registrar_venta(v_id, '2026-10-23', '5959', '[{"detalle": "TAPA DE ASADO", "kilos": 47.1, "precio": 12000.0}, {"detalle": "ROAST BEEF", "kilos": 50.9, "precio": 12000.0}]'::jsonb);

  -- fila 8 · 2026-10-26 · PAGO "TRANSF (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '3056', 512000.00, null);

  -- fila 9 · 2026-10-26 · remito 2667
  --   PECETO 11.7 kg x 14800
  perform public.registrar_venta(v_id, '2026-10-26', '2667', '[{"detalle": "PECETO", "kilos": 11.7, "precio": 14800.0}]'::jsonb);

  -- fila 10 · 2026-10-27 · PAGO "PAGO TRANSF (AMS)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-27', 'pago', '1710', 1176000.00, null);

  -- fila 11 · 2026-10-27 · remito 5546
  --   ROAST BEEF 29.4 kg x 12000
  perform public.registrar_venta(v_id, '2026-10-27', '5546', '[{"detalle": "ROAST BEEF", "kilos": 29.4, "precio": 12000.0}]'::jsonb);

  -- fila 12 · 2026-10-31 · remito 2689
  --   PECETO 11.4 kg x 14800
  perform public.registrar_venta(v_id, '2026-10-31', '2689', '[{"detalle": "PECETO", "kilos": 11.4, "precio": 14800.0}]'::jsonb);

  -- fila 13 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '5990', 693500.00, null);

  -- fila 14 · 2026-11-05 · remito 1502
  --   PECETO 14.3 kg x 14800
  perform public.registrar_venta(v_id, '2026-11-05', '1502', '[{"detalle": "PECETO", "kilos": 14.3, "precio": 14800.0}]'::jsonb);

  -- fila 15 · 2026-11-07 · remito 2850
  --   PECETO 12.3 kg x 14800
  perform public.registrar_venta(v_id, '2026-11-07', '2850', '[{"detalle": "PECETO", "kilos": 12.3, "precio": 14800.0}]'::jsonb);

  -- fila 16 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1593', 393660.00, null);

  -- fila 17 · 2026-11-12 · remito 1603
  --   ROAST BEEF 22.5 kg x 12000
  perform public.registrar_venta(v_id, '2026-11-12', '1603', '[{"detalle": "ROAST BEEF", "kilos": 22.5, "precio": 12000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 270000.00 then
    raise exception 'Cliente 26 (MACOCO): el saldo dio %, la planilla dice 270000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 14 then
    raise exception 'Cliente 26 (MACOCO): se cargaron % movimientos y esperaba 14', v_cant;
  end if;
  raise notice 'Cliente 26 (MACOCO): ok · 14 movimientos · saldo 270000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 27 · EL TANITO   (hoja "27 EL TANITO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 27) then
    raise notice 'Cliente 27 (EL TANITO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (27, 'EL TANITO', '', '', '', 'EL TANITO (OSCAR)', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-14 · remito 5567
  --   CORDERO 10.6 kg x 13000 + ASADO 20 kg x 14500
  perform public.registrar_venta(v_id, '2026-10-14', '5567', '[{"detalle": "CORDERO", "kilos": 10.6, "precio": 13000.0}, {"detalle": "ASADO", "kilos": 20.0, "precio": 14500.0}]'::jsonb);

  -- fila 5 · 2026-10-20 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5870', 428000.00, null);

  -- fila 6 · 2026-10-22 · remito 5534
  --   ASADO 21 kg x 15000
  perform public.registrar_venta(v_id, '2026-10-22', '5534', '[{"detalle": "ASADO", "kilos": 21.0, "precio": 15000.0}]'::jsonb);

  -- fila 7 · 2026-10-26 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '2663', 314800.00, null);

  -- fila 9 · 2026-10-28 · remito 4632
  --   PECHITO 7.3 kg x 6900 + BONDIOLA 4.4 kg x 7000
  perform public.registrar_venta(v_id, '2026-10-28', '4632', '[{"detalle": "PECHITO", "kilos": 7.3, "precio": 6900.0}, {"detalle": "BONDIOLA", "kilos": 4.4, "precio": 7000.0}]'::jsonb);

  -- fila 10 · 2026-11-06 · remito 3004
  --   ASADO 17.6 kg x 14900
  perform public.registrar_venta(v_id, '2026-11-06', '3004', '[{"detalle": "ASADO", "kilos": 17.6, "precio": 14900.0}]'::jsonb);

  -- fila 11 · 2026-11-08 · remito 1532
  --   PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-08', '1532', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 12 · 2026-11-09 · remito 3038
  --   POLLO (POR UNIDAD) 3 u x 67000
  perform public.registrar_venta(v_id, '2026-11-09', '3038', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 3.0, "precio": 67000.0}]'::jsonb);

  -- fila 13 · 2026-11-10 · PAGO "PAGO TRANSF(CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1570', 589410.00, null);

  -- fila 14 · 2026-11-10 · DESCUENTO (retiro) "RETIRO MATAMBRE 43.8 kg x 13000" · fecha original de la planilla: 2026-11-23
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-10', 'descuento', '8410', 569400.00, 'RETIRO MATAMBRE 43.8 kg x 13000');

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from -569400.00 then
    raise exception 'Cliente 27 (EL TANITO): el saldo dio %, la planilla dice -569400.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 10 then
    raise exception 'Cliente 27 (EL TANITO): se cargaron % movimientos y esperaba 10', v_cant;
  end if;
  raise notice 'Cliente 27 (EL TANITO): ok · 10 movimientos · saldo -569400.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 28 · MERC. MITRE   (hoja "28 MERC. MITRE")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 28) then
    raise notice 'Cliente 28 (MERC. MITRE): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (28, 'MERC. MITRE', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-14 · remito 5569
  --   SUPREMA 15 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-14', '5569', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6100.0}]'::jsonb);

  -- fila 4 · 2026-10-14 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-14', 'pago', '', 91500.00, null);

  -- fila 5 · 2026-10-17 · remito 5772
  --   ASADO 18.3 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-17', '5772', '[{"detalle": "ASADO", "kilos": 18.3, "precio": 15500.0}]'::jsonb);

  -- fila 6 · 2026-10-19 · DESCUENTO (otro) "2 LECH X 80000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-19', 'descuento', '5524', 160000.00, '2 LECH X 80000');

  -- fila 7 · 2026-10-19 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '', 123650.00, null);

  -- fila 8 · 2026-10-20 · remito 5877
  --   SUPREMA 15 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-20', '5877', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6100.0}]'::jsonb);

  -- fila 9 · 2026-10-20 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '', 91500.00, null);

  -- fila 10 · 2026-10-20 · remito 5775
  --   MOCHO 26.3 kg x 10500
  perform public.registrar_venta(v_id, '2026-10-20', '5775', '[{"detalle": "MOCHO", "kilos": 26.3, "precio": 10500.0}]'::jsonb);

  -- fila 11 · 2026-10-20 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '', 276150.00, null);

  -- fila 13 · 2026-10-26 · remito 5791
  --   PATA MUSLO 15 kg x 2900 + SUPREMA 15 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-26', '5791', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6100.0}]'::jsonb);

  -- fila 14 · 2026-10-26 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '3058', 135000.00, null);

  -- fila 15 · 2026-10-29 · remito 5796
  --   SUPREMA 15 kg x 6100
  perform public.registrar_venta(v_id, '2026-10-29', '5796', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6100.0}]'::jsonb);

  -- fila 16 · 2026-10-29 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 91500.00, null);

  -- fila 17 · 2026-10-30 · remito 1724
  --   MEDIA RES 112 kg x 9800
  perform public.registrar_venta(v_id, '2026-10-30', '1724', '[{"detalle": "MEDIA RES", "kilos": 112.0, "precio": 9800.0}]'::jsonb);

  -- fila 18 · 2026-10-31 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-31', 'pago', '', 600000.00, null);

  -- fila 20 · 2026-11-01 · remito 3060
  --   BONDIOLA 21 kg x 6800 + PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-01', '3060', '[{"detalle": "BONDIOLA", "kilos": 21.0, "precio": 6800.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 21 · 2026-11-03 · PAGO "PAGO TRANSF CIA BERNAL"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '1728', 390000.00, null);

  -- fila 22 · 2026-11-03 · PAGO "PAGO TRANSF CIA BERNAL"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '', 107600.00, null);

  -- fila 23 · 2026-11-03 · remito 5675
  --   SUPREMA 15 kg x 6100
  perform public.registrar_venta(v_id, '2026-11-03', '5675', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6100.0}]'::jsonb);

  -- fila 24 · 2026-11-07 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '3095', 275000.00, null);

  -- fila 27 · 2026-11-07 · remito 1750
  --   PATA MUSLO 15 kg x 2900 + SUPREMA 15 kg x 6200 + BIFE ANCHO 10.6 kg x 9000
  perform public.registrar_venta(v_id, '2026-11-07', '1750', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6200.0}, {"detalle": "BIFE ANCHO", "kilos": 10.6, "precio": 9000.0}]'::jsonb);

  -- fila 29 · 2026-11-11 · remito 2726
  --   PATA MUSLO 15 kg x 2900 + SIN DETALLE 15 kg x 6200
  perform public.registrar_venta(v_id, '2026-11-11', '2726', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "SIN DETALLE", "kilos": 15.0, "precio": 6200.0}]'::jsonb);

  -- fila 30 · 2026-11-13 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '2767', 136500.00, null);

  -- fila 32 · 2026-11-13 · remito 8415
  --   MOCHO 37.6 kg x 10600 + PECETO 2.2 kg x 17000
  perform public.registrar_venta(v_id, '2026-11-13', '8415', '[{"detalle": "MOCHO", "kilos": 37.6, "precio": 10600.0}, {"detalle": "PECETO", "kilos": 2.2, "precio": 17000.0}]'::jsonb);

  -- fila 33 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '1620', 435960.00, null);

  -- fila 35 · 2026-11-14 · remito 8428
  --   PATA MUSLO 15 kg x 2900 + SUPREMA 15 kg x 6200
  perform public.registrar_venta(v_id, '2026-11-14', '8428', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6200.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 371200.00 then
    raise exception 'Cliente 28 (MERC. MITRE): el saldo dio %, la planilla dice 371200.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 26 then
    raise exception 'Cliente 28 (MERC. MITRE): se cargaron % movimientos y esperaba 26', v_cant;
  end if;
  raise notice 'Cliente 28 (MERC. MITRE): ok · 26 movimientos · saldo 371200.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 29 · ALTA GRACIA   (hoja "29 ALTA GRACIA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 29) then
    raise notice 'Cliente 29 (ALTA GRACIA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (29, 'ALTA GRACIA', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-15 · remito 5572
  --   BONDIOLA 23 kg x 6900 + PARRILLERO 121.7 kg x 13800
  perform public.registrar_venta(v_id, '2026-10-15', '5572', '[{"detalle": "BONDIOLA", "kilos": 23.0, "precio": 6900.0}, {"detalle": "PARRILLERO", "kilos": 121.7, "precio": 13800.0}]'::jsonb);

  -- fila 5 · 2026-10-20 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5875', 1400000.00, null);

  -- fila 6 · 2026-10-21 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-21', 'pago', '5782', 438000.00, null);

  -- fila 8 · 2026-10-31 · remito 2679
  --   PARRILLERO 198.6 kg x 13500 + BONDIOLA 20 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-31', '2679', '[{"detalle": "PARRILLERO", "kilos": 198.6, "precio": 13500.0}, {"detalle": "BONDIOLA", "kilos": 20.0, "precio": 6900.0}]'::jsonb);

  -- fila 9 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '2838', 750000.00, null);

  -- fila 10 · 2026-11-03 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '5670', 2069100.00, null);

  -- fila 11 · 2026-11-03 · remito 6572
  --   SUPREMA 15 kg x 6300
  perform public.registrar_venta(v_id, '2026-11-03', '6572', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}]'::jsonb);

  -- fila 12 · 2026-11-05 · remito 5681
  --   ASADO 155.2 kg x 15300
  perform public.registrar_venta(v_id, '2026-11-05', '5681', '[{"detalle": "ASADO", "kilos": 155.2, "precio": 15300.0}]'::jsonb);

  -- fila 15 · 2026-11-08 · remito 1528
  --   BONDIOLA 22.56 kg x 6900 + PATA MUSLO 30 kg x 3200 + SUPREMA 30 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-08', '1528', '[{"detalle": "BONDIOLA", "kilos": 22.56, "precio": 6900.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3200.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6800.0}]'::jsonb);

  -- fila 16 · 2026-11-09 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '5695', 2924884.00, null);

  -- fila 17 · 2026-11-13 · remito 2764
  --   BONDIOLA 22.7 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-13', '2764', '[{"detalle": "BONDIOLA", "kilos": 22.7, "precio": 6900.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 156630.00 then
    raise exception 'Cliente 29 (ALTA GRACIA): el saldo dio %, la planilla dice 156630.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 11 then
    raise exception 'Cliente 29 (ALTA GRACIA): se cargaron % movimientos y esperaba 11', v_cant;
  end if;
  raise notice 'Cliente 29 (ALTA GRACIA): ok · 11 movimientos · saldo 156630.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 30 · CRISTIAN POSSE   (hoja "30 CRISTIAN POSSE")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 30) then
    raise notice 'Cliente 30 (CRISTIAN POSSE): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (30, 'CRISTIAN POSSE', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-15 · remito 5573
  --   ASADO 135.4 kg x 15000
  perform public.registrar_venta(v_id, '2026-10-15', '5573', '[{"detalle": "ASADO", "kilos": 135.4, "precio": 15000.0}]'::jsonb);

  -- fila 4 · 2026-10-16 · PAGO "PAGO (U$S 500 X $1535)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '5509', 767500.00, null);

  -- fila 5 · 2026-10-16 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '', 1000000.00, null);

  -- fila 6 · 2026-10-16 · remito 5510
  --   BONDIOLA 230 kg x 6400
  perform public.registrar_venta(v_id, '2026-10-16', '5510', '[{"detalle": "BONDIOLA", "kilos": 230.0, "precio": 6400.0}]'::jsonb);

  -- fila 7 · 2026-10-16 · PAGO "PAGO (U$S 1000 X $1535)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '5515', 1535000.00, null);

  -- fila 8 · 2026-10-22 · remito 5787
  --   ASADO 42.6 kg x 14500
  perform public.registrar_venta(v_id, '2026-10-22', '5787', '[{"detalle": "ASADO", "kilos": 42.6, "precio": 14500.0}]'::jsonb);

  -- fila 9 · 2026-10-24 · remito 4624
  --   ASADO 40.1 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-24', '4624', '[{"detalle": "ASADO", "kilos": 40.1, "precio": 15500.0}]'::jsonb);

  -- fila 10 · 2026-10-26 · remito 2666
  --   BOLA DE LOMO 85 kg x 11900
  perform public.registrar_venta(v_id, '2026-10-26', '2666', '[{"detalle": "BOLA DE LOMO", "kilos": 85.0, "precio": 11900.0}]'::jsonb);

  -- fila 11 · 2026-10-30 · PAGO "PAGO U$S1000 X 1550"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '1720', 1550000.00, null);

  -- fila 12 · 2026-11-05 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-05', 'pago', '1507', 76000.00, null);

  -- fila 14 · 2026-11-09 · remito 1557
  --   PICADA 16 kg x 10000 + CUADRADA 66.2 kg x 11900
  perform public.registrar_venta(v_id, '2026-11-09', '1557', '[{"detalle": "PICADA", "kilos": 16.0, "precio": 10000.0}, {"detalle": "CUADRADA", "kilos": 66.2, "precio": 11900.0}]'::jsonb);

  -- fila 15 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1555', 742000.00, null);

  -- fila 16 · 2026-11-12 · remito 2759
  --   NALGA 31.7 kg x 15500
  perform public.registrar_venta(v_id, '2026-11-12', '2759', '[{"detalle": "NALGA", "kilos": 31.7, "precio": 15500.0}]'::jsonb);

  -- fila 17 · 2026-11-14 · remito 1613
  --   PICADA 46.2 kg x 10000
  perform public.registrar_venta(v_id, '2026-11-14', '1613', '[{"detalle": "PICADA", "kilos": 46.2, "precio": 10000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1984380.00 then
    raise exception 'Cliente 30 (CRISTIAN POSSE): el saldo dio %, la planilla dice 1984380.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 14 then
    raise exception 'Cliente 30 (CRISTIAN POSSE): se cargaron % movimientos y esperaba 14', v_cant;
  end if;
  raise notice 'Cliente 30 (CRISTIAN POSSE): ok · 14 movimientos · saldo 1984380.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 31 · GUSTAVO MARIEL   (hoja "31 GUSTAVO MARIEL")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 31) then
    raise notice 'Cliente 31 (GUSTAVO MARIEL): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (31, 'GUSTAVO MARIEL', '', 'SARMIENTO 825', 'MAR DE AJO', '', v_autor)
  returning id into v_id;


  -- fila 5 · 2026-10-15 · remito 5576
  --   NALGA 6.9 kg x 15500 + BIFE 13.3 kg x 12500 + ASADO 13 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-15', '5576', '[{"detalle": "NALGA", "kilos": 6.9, "precio": 15500.0}, {"detalle": "BIFE", "kilos": 13.3, "precio": 12500.0}, {"detalle": "ASADO", "kilos": 13.0, "precio": 15500.0}]'::jsonb);

  -- fila 6 · 2026-10-15 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-15', 'pago', '', 300000.00, null);

  -- fila 7 · 2026-10-22 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-22', 'pago', '5540', 174700.00, null);

  -- fila 8 · 2026-10-23 · remito 5956
  --   PALETA 7.2 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-23', '5956', '[{"detalle": "PALETA", "kilos": 7.2, "precio": 13000.0}]'::jsonb);

  -- fila 9 · 2026-11-04 · DESCUENTO (descuento) "DESCUENTO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-04', 'descuento', '5989', 3600.00, 'DESCUENTO');

  -- fila 10 · 2026-11-04 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '', 90000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 31 (GUSTAVO MARIEL): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 6 then
    raise exception 'Cliente 31 (GUSTAVO MARIEL): se cargaron % movimientos y esperaba 6', v_cant;
  end if;
  raise notice 'Cliente 31 (GUSTAVO MARIEL): ok · 6 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 32 · CHINO CHASCOMUS   (hoja "32 CHINO CHASCOMUS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 32) then
    raise notice 'Cliente 32 (CHINO CHASCOMUS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (32, 'CHINO CHASCOMUS', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-15 · remito 5582
  --   BONDIOLA 23 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-15', '5582', '[{"detalle": "BONDIOLA", "kilos": 23.0, "precio": 6900.0}]'::jsonb);

  -- fila 4 · 2026-10-19 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '5588', 158700.00, null);

  -- fila 7 · 2026-10-26 · remito 2651
  --   BONDIOLA 20.1 kg x 6900 + BONDIOLA 14.6 kg x 6900 + PALETA 20.3 kg x 12000
  perform public.registrar_venta(v_id, '2026-10-26', '2651', '[{"detalle": "BONDIOLA", "kilos": 20.1, "precio": 6900.0}, {"detalle": "BONDIOLA", "kilos": 14.6, "precio": 6900.0}, {"detalle": "PALETA", "kilos": 20.3, "precio": 12000.0}]'::jsonb);

  -- fila 8 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '5983', 483000.00, null);

  -- fila 10 · 2026-11-02 · remito 3065
  --   BONDIOLA 21.15 kg x 6900 + OSOBUCO 29.5 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-02', '3065', '[{"detalle": "BONDIOLA", "kilos": 21.15, "precio": 6900.0}, {"detalle": "OSOBUCO", "kilos": 29.5, "precio": 7000.0}]'::jsonb);

  -- fila 11 · 2026-11-09 · remito 2705
  --   BONDIOLA 45 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-09', '2705', '[{"detalle": "BONDIOLA", "kilos": 45.0, "precio": 6900.0}]'::jsonb);

  -- fila 12 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '', 353000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 309965.00 then
    raise exception 'Cliente 32 (CHINO CHASCOMUS): el saldo dio %, la planilla dice 309965.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 7 then
    raise exception 'Cliente 32 (CHINO CHASCOMUS): se cargaron % movimientos y esperaba 7', v_cant;
  end if;
  raise notice 'Cliente 32 (CHINO CHASCOMUS): ok · 7 movimientos · saldo 309965.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 33 · NELDO   (hoja "33 NELDO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 33) then
    raise notice 'Cliente 33 (NELDO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (33, 'NELDO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-16 · remito 5507
  --   MEDIA RES 120.4 kg x 9800
  perform public.registrar_venta(v_id, '2026-10-16', '5507', '[{"detalle": "MEDIA RES", "kilos": 120.4, "precio": 9800.0}]'::jsonb);

  -- fila 4 · 2026-10-17 · remito 5952
  --   BONDIOLA 23 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-17', '5952', '[{"detalle": "BONDIOLA", "kilos": 23.0, "precio": 6900.0}]'::jsonb);

  -- fila 5 · 2026-10-20 · PAGO "TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '5871', 536120.00, null);

  -- fila 6 · 2026-10-20 · DESCUENTO (consumo) "COMIDA"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-20', 'descuento', '', 2500.00, 'COMIDA');

  -- fila 8 · 2026-10-23 · remito 5963
  --   OSOBUCO 30.9 kg x 6500 + ESPINAZO 19 kg x 1500
  perform public.registrar_venta(v_id, '2026-10-23', '5963', '[{"detalle": "OSOBUCO", "kilos": 30.9, "precio": 6500.0}, {"detalle": "ESPINAZO", "kilos": 19.0, "precio": 1500.0}]'::jsonb);

  -- fila 9 · 2026-10-23 · PAGO "PAGO (TCB) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '', 300000.00, null);

  -- fila 10 · 2026-10-24 · remito 5651
  --   MEDIA RES 103.6 kg x 10000
  perform public.registrar_venta(v_id, '2026-10-24', '5651', '[{"detalle": "MEDIA RES", "kilos": 103.6, "precio": 10000.0}]'::jsonb);

  -- fila 11 · 2026-10-24 · remito 1702
  --   MEDIA RES DE CERDO 131.1 kg x 4300
  perform public.registrar_venta(v_id, '2026-10-24', '1702', '[{"detalle": "MEDIA RES DE CERDO", "kilos": 131.1, "precio": 4300.0}]'::jsonb);

  -- fila 12 · 2026-10-25 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-25', 'pago', '5976', 400000.00, null);

  -- fila 14 · 2026-10-26 · remito 2657
  --   ESPINAZO 5.8 kg x 1500 + MEDIA RES DE CERDO 131.7 kg x 4300
  perform public.registrar_venta(v_id, '2026-10-26', '2657', '[{"detalle": "ESPINAZO", "kilos": 5.8, "precio": 1500.0}, {"detalle": "MEDIA RES DE CERDO", "kilos": 131.7, "precio": 4300.0}]'::jsonb);

  -- fila 15 · 2026-10-23 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '2662', 400000.00, null);

  -- fila 16 · 2026-10-28 · PAGO "PAGO TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-28', 'pago', '5591', 400000.00, null);

  -- fila 17 · 2026-10-29 · PAGO "PAGO TRANSF (CIA. BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '1713', 400000.00, null);

  -- fila 18 · 2026-10-30 · PAGO "PAGO KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '', 93008.00, null);

  -- fila 21 · 2026-10-31 · remito 2677
  --   MEDIA RES DE CERDO 87 kg x 4300 + BIFE 34 kg x 12000 + GRASA 44.1 kg x 500
  perform public.registrar_venta(v_id, '2026-10-31', '2677', '[{"detalle": "MEDIA RES DE CERDO", "kilos": 87.0, "precio": 4300.0}, {"detalle": "BIFE", "kilos": 34.0, "precio": 12000.0}, {"detalle": "GRASA", "kilos": 44.1, "precio": 500.0}]'::jsonb);

  -- fila 22 · 2026-10-31 · DESCUENTO (consumo) "COMIDA"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-31', 'descuento', '', 4800.00, 'COMIDA');

  -- fila 23 · 2026-11-02 · remito 2828
  --   MEDIA RES DE CERDO 79.7 kg x 4300
  perform public.registrar_venta(v_id, '2026-11-02', '2828', '[{"detalle": "MEDIA RES DE CERDO", "kilos": 79.7, "precio": 4300.0}]'::jsonb);

  -- fila 24 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 7600.00, null);

  -- fila 25 · 2026-11-02 · PAGO "TRANSF(LAMARCHE)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '1725', 603600.00, null);

  -- fila 28 · 2026-11-03 · remito 2841
  --   OSOBUCO 20.4 kg x 6500 + PALETA 19.2 kg x 12000 + ESPINAZO 3.5 kg x 1500
  perform public.registrar_venta(v_id, '2026-11-03', '2841', '[{"detalle": "OSOBUCO", "kilos": 20.4, "precio": 6500.0}, {"detalle": "PALETA", "kilos": 19.2, "precio": 12000.0}, {"detalle": "ESPINAZO", "kilos": 3.5, "precio": 1500.0}]'::jsonb);

  -- fila 29 · 2026-11-03 · PAGO "PAGO TRANSF (LOS NIETOS)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '', 575010.00, null);

  -- fila 30 · 2026-11-06 · remito 3003
  --   ASADO 22.6 kg x 14900
  perform public.registrar_venta(v_id, '2026-11-06', '3003', '[{"detalle": "ASADO", "kilos": 22.6, "precio": 14900.0}]'::jsonb);

  -- fila 31 · 2026-11-06 · PAGO "PAGO TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '3019', 500000.00, null);

  -- fila 32 · 2026-11-07 · remito 3028
  --   MEDIA RES 81 kg x 10200
  perform public.registrar_venta(v_id, '2026-11-07', '3028', '[{"detalle": "MEDIA RES", "kilos": 81.0, "precio": 10200.0}]'::jsonb);

  -- fila 35 · 2026-11-08 · remito 1531
  --   CARRE 10.8 kg x 6500 + BONDIOLA 22.39 kg x 6900 + OSOBUCO 13.4 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-08', '1531', '[{"detalle": "CARRE", "kilos": 10.8, "precio": 6500.0}, {"detalle": "BONDIOLA", "kilos": 22.39, "precio": 6900.0}, {"detalle": "OSOBUCO", "kilos": 13.4, "precio": 6500.0}]'::jsonb);

  -- fila 36 · 2026-11-08 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '5697', 299270.00, null);

  -- fila 37 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1565', 335110.00, null);

  -- fila 40 · 2026-11-12 · remito 2751
  --   MOCHO 42.2 kg x 10500 + ASADO 23.5 kg x 14950 + BONDIOLA 22.64 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-12', '2751', '[{"detalle": "MOCHO", "kilos": 42.2, "precio": 10500.0}, {"detalle": "ASADO", "kilos": 23.5, "precio": 14950.0}, {"detalle": "BONDIOLA", "kilos": 22.64, "precio": 6500.0}]'::jsonb);

  -- fila 41 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1541', 368250.00, null);

  -- fila 42 · 2026-11-12 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '1541', 311791.00, null);

  -- fila 43 · 2026-11-14 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '2745', 336740.00, null);

  -- fila 44 · 2026-11-15 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '2746', 426200.00, null);

  -- fila 46 · 2026-11-15 · remito 2770
  --   OSOBUCO 14.1 kg x 6500 + BONDIOLA 21.37 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-15', '2770', '[{"detalle": "OSOBUCO", "kilos": 14.1, "precio": 6500.0}, {"detalle": "BONDIOLA", "kilos": 21.37, "precio": 6500.0}]'::jsonb);

  -- fila 48 · 2026-11-15 · remito 2778
  --   GRASA 101.6 kg x 500 + ESPINAZO 21.4 kg x 1500
  perform public.registrar_venta(v_id, '2026-11-15', '2778', '[{"detalle": "GRASA", "kilos": 101.6, "precio": 500.0}, {"detalle": "ESPINAZO", "kilos": 21.4, "precio": 1500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1687592.00 then
    raise exception 'Cliente 33 (NELDO): el saldo dio %, la planilla dice 1687592.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 34 then
    raise exception 'Cliente 33 (NELDO): se cargaron % movimientos y esperaba 34', v_cant;
  end if;
  raise notice 'Cliente 33 (NELDO): ok · 34 movimientos · saldo 1687592.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 34 · DANI PAVON   (hoja "34 DANI PAVON")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 34) then
    raise notice 'Cliente 34 (DANI PAVON): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (34, 'DANI PAVON', '', '', '', 'GARITA 5', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-16 · remito 5513
  --   SUPREMA 90 kg x 6200
  perform public.registrar_venta(v_id, '2026-10-16', '5513', '[{"detalle": "SUPREMA", "kilos": 90.0, "precio": 6200.0}]'::jsonb);

  -- fila 5 · 2026-10-22 · remito 5530
  --   ASADO 68.6 kg x 14900 + DELANTERO 147.7 kg x 9700
  perform public.registrar_venta(v_id, '2026-10-22', '5530', '[{"detalle": "ASADO", "kilos": 68.6, "precio": 14900.0}, {"detalle": "DELANTERO", "kilos": 147.7, "precio": 9700.0}]'::jsonb);

  -- fila 6 · 2026-10-22 · remito 5533
  --   MEDIA RES 113 kg x 10000
  perform public.registrar_venta(v_id, '2026-10-22', '5533', '[{"detalle": "MEDIA RES", "kilos": 113.0, "precio": 10000.0}]'::jsonb);

  -- fila 7 · 2026-10-23 · PAGO "PAGO (BLANCO) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '', 558000.00, null);

  -- fila 8 · 2026-10-22 · remito 5885
  --   SUPREMA 55 kg x 6200
  perform public.registrar_venta(v_id, '2026-10-22', '5885', '[{"detalle": "SUPREMA", "kilos": 55.0, "precio": 6200.0}]'::jsonb);

  -- fila 9 · 2026-10-26 · remito 2652
  --   PECHITO 13.7 kg x 7000
  perform public.registrar_venta(v_id, '2026-10-26', '2652', '[{"detalle": "PECHITO", "kilos": 13.7, "precio": 7000.0}]'::jsonb);

  -- fila 10 · 2026-10-29 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '5896', 700000.00, null);

  -- fila 11 · 2026-10-29 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 450000.00, null);

  -- fila 12 · 2026-10-29 · PAGO "TRANSF (FRIMSA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 350000.00, null);

  -- fila 13 · 2026-11-02 · PAGO "TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '3063', 1500000.00, null);

  -- fila 14 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 1000000.00, null);

  -- fila 15 · 2026-11-07 · remito 1744
  --   POLLO (POR UNIDAD) 1 u x 67000
  perform public.registrar_venta(v_id, '2026-11-07', '1744', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}]'::jsonb);

  -- fila 16 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '2713', 67000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 21730.00 then
    raise exception 'Cliente 34 (DANI PAVON): el saldo dio %, la planilla dice 21730.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 13 then
    raise exception 'Cliente 34 (DANI PAVON): se cargaron % movimientos y esperaba 13', v_cant;
  end if;
  raise notice 'Cliente 34 (DANI PAVON): ok · 13 movimientos · saldo 21730.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 35 · LA CABAÑITA   (hoja "35 LA CABAÑITA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 35) then
    raise notice 'Cliente 35 (LA CABAÑITA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (35, 'LA CABAÑITA', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 5 · 2026-10-16 · remito 5519
  --   BIFE 10.2 kg x 15900 + ASADO 16.7 kg x 14800 + VACIO 7.2 kg x 14800
  perform public.registrar_venta(v_id, '2026-10-16', '5519', '[{"detalle": "BIFE", "kilos": 10.2, "precio": 15900.0}, {"detalle": "ASADO", "kilos": 16.7, "precio": 14800.0}, {"detalle": "VACIO", "kilos": 7.2, "precio": 14800.0}]'::jsonb);

  -- fila 8 · 2026-10-23 · remito 5958
  --   VACIO 14.4 kg x 14900 + NALGA C/T 8.5 kg x 15900 + BIFE S/L 8.9 kg x 16900
  perform public.registrar_venta(v_id, '2026-10-23', '5958', '[{"detalle": "VACIO", "kilos": 14.4, "precio": 14900.0}, {"detalle": "NALGA C/T", "kilos": 8.5, "precio": 15900.0}, {"detalle": "BIFE S/L", "kilos": 8.9, "precio": 16900.0}]'::jsonb);

  -- fila 9 · 2026-10-30 · remito 4640
  --   ASADO 23.5 kg x 15900
  perform public.registrar_venta(v_id, '2026-10-30', '4640', '[{"detalle": "ASADO", "kilos": 23.5, "precio": 15900.0}]'::jsonb);

  -- fila 12 · 2026-11-06 · remito 3009
  --   ASADO 120.9 kg x 15900 + BIFE 24.1 kg x 16900 + NALGA C/T 14.7 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-06', '3009', '[{"detalle": "ASADO", "kilos": 120.9, "precio": 15900.0}, {"detalle": "BIFE", "kilos": 24.1, "precio": 16900.0}, {"detalle": "NALGA C/T", "kilos": 14.7, "precio": 16900.0}]'::jsonb);

  -- fila 13 · 2026-11-09 · remito 1558
  --   BIFE 10.3 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-09', '1558', '[{"detalle": "BIFE", "kilos": 10.3, "precio": 16900.0}]'::jsonb);

  -- fila 14 · 2026-11-09 · remito 1562
  --   ASADO C/VACIO 23.4 kg x 15900
  perform public.registrar_venta(v_id, '2026-11-09', '1562', '[{"detalle": "ASADO C/VACIO", "kilos": 23.4, "precio": 15900.0}]'::jsonb);

  -- fila 15 · 2026-11-09 · remito 16493
  --   NALGA S/T 3.8 kg x 19500
  perform public.registrar_venta(v_id, '2026-11-09', '16493', '[{"detalle": "NALGA S/T", "kilos": 3.8, "precio": 19500.0}]'::jsonb);

  -- fila 16 · 2026-11-12 · PAGO "PAGO CH ($10.000.000,00)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '8401', 9000000.00, null);

  -- fila 17 · 2026-11-14 · remito 8431
  --   ASADO 13.3 kg x 15900
  perform public.registrar_venta(v_id, '2026-11-14', '8431', '[{"detalle": "ASADO", "kilos": 13.3, "precio": 15900.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from -4200600.00 then
    raise exception 'Cliente 35 (LA CABAÑITA): el saldo dio %, la planilla dice -4200600.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 9 then
    raise exception 'Cliente 35 (LA CABAÑITA): se cargaron % movimientos y esperaba 9', v_cant;
  end if;
  raise notice 'Cliente 35 (LA CABAÑITA): ok · 9 movimientos · saldo -4200600.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 36 · GUSTAVO REDUCCION   (hoja "36 GUSTAVO REDUCCION")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 36) then
    raise notice 'Cliente 36 (GUSTAVO REDUCCION): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (36, 'GUSTAVO REDUCCION', '', '', '', 'GUSTAVO DE LA REDUCCION', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: SALDO( DE LA REDUCCION) 186000)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 186000.00);

  -- fila 4 · 2026-10-16 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '5514', 186000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 36 (GUSTAVO REDUCCION): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 36 (GUSTAVO REDUCCION): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 36 (GUSTAVO REDUCCION): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 37 · GONZALO VAZQUEZ   (hoja "37 GONZALO VAZQUEZ")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 37) then
    raise notice 'Cliente 37 (GONZALO VAZQUEZ): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (37, 'GONZALO VAZQUEZ', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-17 · remito 4544
  --   BONDIOLA 8.7 kg x 7100
  perform public.registrar_venta(v_id, '2026-10-17', '4544', '[{"detalle": "BONDIOLA", "kilos": 8.7, "precio": 7100.0}]'::jsonb);

  -- fila 5 · 2026-10-16 · remito 5514
  --   PICADA 22.5 kg x 12500 + TAPA DE ASADO 5.7 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-16', '5514', '[{"detalle": "PICADA", "kilos": 22.5, "precio": 12500.0}, {"detalle": "TAPA DE ASADO", "kilos": 5.7, "precio": 12500.0}]'::jsonb);

  -- fila 9 · 2026-10-31 · remito 5654
  --   PECHITO 14.3 kg x 6900 + CARRE 12.2 kg x 6900 + MORCILLA 5.5 kg x 4800 + CHORIZO 12.6 kg x 6500
  perform public.registrar_venta(v_id, '2026-10-31', '5654', '[{"detalle": "PECHITO", "kilos": 14.3, "precio": 6900.0}, {"detalle": "CARRE", "kilos": 12.2, "precio": 6900.0}, {"detalle": "MORCILLA", "kilos": 5.5, "precio": 4800.0}, {"detalle": "CHORIZO", "kilos": 12.6, "precio": 6500.0}]'::jsonb);

  -- fila 11 · 2026-11-09 · remito 3043
  --   BONDIOLA 23.87 kg x 7000 + POLLO (POR UNIDAD) 1 u x 67000
  perform public.registrar_venta(v_id, '2026-11-09', '3043', '[{"detalle": "BONDIOLA", "kilos": 23.87, "precio": 7000.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 939510.00 then
    raise exception 'Cliente 37 (GONZALO VAZQUEZ): el saldo dio %, la planilla dice 939510.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 37 (GONZALO VAZQUEZ): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 37 (GONZALO VAZQUEZ): ok · 4 movimientos · saldo 939510.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 38 · MARISA AV.SAN BER   (hoja "38 MARISA AV.SAN BER")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 38) then
    raise notice 'Cliente 38 (MARISA AV.SAN BER): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (38, 'MARISA AV.SAN BER', '', '', '', 'MARISA AV SAN BERNARDO', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-26 · remito 2656
  --   ROAST BEEF 10.5 kg x 11900
  perform public.registrar_venta(v_id, '2026-10-26', '2656', '[{"detalle": "ROAST BEEF", "kilos": 10.5, "precio": 11900.0}]'::jsonb);

  -- fila 8 · 2026-10-31 · remito 2676
  --   BOLA DE LOMO 8.46 kg x 11900 + CUADRIL 13.48 kg x 12500 + ROAST BEEF 15.5 kg x 11900 + BIFE 15.2 kg x 11900 + CUADRADA 7.45 kg x 11900
  perform public.registrar_venta(v_id, '2026-10-31', '2676', '[{"detalle": "BOLA DE LOMO", "kilos": 8.46, "precio": 11900.0}, {"detalle": "CUADRIL", "kilos": 13.48, "precio": 12500.0}, {"detalle": "ROAST BEEF", "kilos": 15.5, "precio": 11900.0}, {"detalle": "BIFE", "kilos": 15.2, "precio": 11900.0}, {"detalle": "CUADRADA", "kilos": 7.45, "precio": 11900.0}]'::jsonb);

  -- fila 9 · 2026-11-02 · DESCUENTO (descuento) "descuento bife 6.1 kg x 11900"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-02', 'descuento', '5982', 72590.00, 'descuento bife 6.1 kg x 11900');

  -- fila 10 · 2026-11-02 · PAGO "PAGO · E´CHEQUE"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 775519.00, null);

  -- fila 14 · 2026-11-05 · remito 1513
  --   CUADRADA 12.9 kg x 11900 + BOLA DE LOMO 16.1 kg x 11900 + ROAST BEEF 42.1 kg x 11900 + CUADRIL 6.4 kg x 12500
  perform public.registrar_venta(v_id, '2026-11-05', '1513', '[{"detalle": "CUADRADA", "kilos": 12.9, "precio": 11900.0}, {"detalle": "BOLA DE LOMO", "kilos": 16.1, "precio": 11900.0}, {"detalle": "ROAST BEEF", "kilos": 42.1, "precio": 11900.0}, {"detalle": "CUADRIL", "kilos": 6.4, "precio": 12500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 926090.00 then
    raise exception 'Cliente 38 (MARISA AV.SAN BER): el saldo dio %, la planilla dice 926090.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 5 then
    raise exception 'Cliente 38 (MARISA AV.SAN BER): se cargaron % movimientos y esperaba 5', v_cant;
  end if;
  raise notice 'Cliente 38 (MARISA AV.SAN BER): ok · 5 movimientos · saldo 926090.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 39 · BENDITA ESQUINA   (hoja "39 BENDITA ESQUINA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 39) then
    raise notice 'Cliente 39 (BENDITA ESQUINA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (39, 'BENDITA ESQUINA', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-19 · remito 5869
  --   MATAMBRE 48.9 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-19', '5869', '[{"detalle": "MATAMBRE", "kilos": 48.9, "precio": 13000.0}]'::jsonb);

  -- fila 4 · 2026-10-23 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '5966', 634400.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1300.00 then
    raise exception 'Cliente 39 (BENDITA ESQUINA): el saldo dio %, la planilla dice 1300.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 39 (BENDITA ESQUINA): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 39 (BENDITA ESQUINA): ok · 2 movimientos · saldo 1300.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 40 · LA PERLA   (hoja "40 LA PERLA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 40) then
    raise notice 'Cliente 40 (LA PERLA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (40, 'LA PERLA', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-20 · remito 5869
  --   PECHO 19 kg x 8800
  perform public.registrar_venta(v_id, '2026-10-20', '5869', '[{"detalle": "PECHO", "kilos": 19.0, "precio": 8800.0}]'::jsonb);

  -- fila 4 · 2026-10-26 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '2669', 167200.00, null);

  -- fila 5 · 2026-10-26 · remito 2665
  --   BOLA DE LOMO/CUADRADA 15.9 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-26', '2665', '[{"detalle": "BOLA DE LOMO/CUADRADA", "kilos": 15.9, "precio": 12500.0}]'::jsonb);

  -- fila 6 · 2026-11-02 · PAGO "PAGO (LOS NIETOS) · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '', 198750.00, null);

  -- fila 7 · 2026-11-15 · remito 2775
  --   PECHO 145.7 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-15', '2775', '[{"detalle": "PECHO", "kilos": 145.7, "precio": 7000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1019900.00 then
    raise exception 'Cliente 40 (LA PERLA): el saldo dio %, la planilla dice 1019900.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 5 then
    raise exception 'Cliente 40 (LA PERLA): se cargaron % movimientos y esperaba 5', v_cant;
  end if;
  raise notice 'Cliente 40 (LA PERLA): ok · 5 movimientos · saldo 1019900.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 41 · LEO CHINO   (hoja "41LEO CHINO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 41) then
    raise notice 'Cliente 41 (LEO CHINO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (41, 'LEO CHINO', '', '', 'MAR DEL TUYU', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-20 · remito 5881
  --   PARRILLERO 35.4 kg x 15000
  perform public.registrar_venta(v_id, '2026-10-20', '5881', '[{"detalle": "PARRILLERO", "kilos": 35.4, "precio": 15000.0}]'::jsonb);

  -- fila 4 · 2026-10-31 · remito 5659
  --   PECHO 186.6 kg x 8600
  perform public.registrar_venta(v_id, '2026-10-31', '5659', '[{"detalle": "PECHO", "kilos": 186.6, "precio": 8600.0}]'::jsonb);

  -- fila 5 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '3062', 531000.00, null);

  -- fila 8 · 2026-11-04 · remito 3074
  --   PATA MUSLO 240 kg x 2900 + SUPREMA 30 kg x 6500 + BONDIOLA 44.2 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-04', '3074', '[{"detalle": "PATA MUSLO", "kilos": 240.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6500.0}, {"detalle": "BONDIOLA", "kilos": 44.2, "precio": 6900.0}]'::jsonb);

  -- fila 9 · 2026-11-04 · remito 3084
  --   CORDERO 9.3 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-04', '3084', '[{"detalle": "CORDERO", "kilos": 9.3, "precio": 13000.0}]'::jsonb);

  -- fila 10 · 2026-11-05 · remito 5685
  --   ASADO 105.7 kg x 15300
  perform public.registrar_venta(v_id, '2026-11-05', '5685', '[{"detalle": "ASADO", "kilos": 105.7, "precio": 15300.0}]'::jsonb);

  -- fila 11 · 2026-11-08 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '3098', 1604000.00, null);

  -- fila 13 · 2026-11-09 · remito 16492
  --   BONDIOLA 133.21 kg x 6900 + SUPREMA 90 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-09', '16492', '[{"detalle": "BONDIOLA", "kilos": 133.21, "precio": 6900.0}, {"detalle": "SUPREMA", "kilos": 90.0, "precio": 6500.0}]'::jsonb);

  -- fila 14 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '1610', 500000.00, null);

  -- fila 15 · 2026-11-16 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1639', 1656830.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 2282169.00 then
    raise exception 'Cliente 41 (LEO CHINO): el saldo dio %, la planilla dice 2282169.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 10 then
    raise exception 'Cliente 41 (LEO CHINO): se cargaron % movimientos y esperaba 10', v_cant;
  end if;
  raise notice 'Cliente 41 (LEO CHINO): ok · 10 movimientos · saldo 2282169.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 42 · PANCHULO   (hoja "42 PANCHULO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 42) then
    raise notice 'Cliente 42 (PANCHULO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (42, 'PANCHULO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-20 · remito 5776
  --   SUPREMA 15 kg x 6500
  perform public.registrar_venta(v_id, '2026-10-20', '5776', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}]'::jsonb);

  -- fila 4 · 2026-10-20 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-20', 'pago', '', 97500.00, null);

  -- fila 5 · 2026-10-28 · remito 5594
  --   PICADA 14 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-28', '5594', '[{"detalle": "PICADA", "kilos": 14.0, "precio": 13000.0}]'::jsonb);

  -- fila 6 · 2026-11-09 · remito 16495
  --   SUPREMA 15 kg x 7200
  perform public.registrar_venta(v_id, '2026-11-09', '16495', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 7200.0}]'::jsonb);

  -- fila 7 · 2026-11-15 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '1626', 200000.00, null);

  -- fila 8 · 2026-11-15 · remito 2768
  --   PICADA 17.3 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-15', '2768', '[{"detalle": "PICADA", "kilos": 17.3, "precio": 13000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 314900.00 then
    raise exception 'Cliente 42 (PANCHULO): el saldo dio %, la planilla dice 314900.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 6 then
    raise exception 'Cliente 42 (PANCHULO): se cargaron % movimientos y esperaba 6', v_cant;
  end if;
  raise notice 'Cliente 42 (PANCHULO): ok · 6 movimientos · saldo 314900.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 43 · MAXI   (hoja "43 MAXI")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 43) then
    raise notice 'Cliente 43 (MAXI): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (43, 'MAXI', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-22 · remito 5525
  --   ASADO 25.7 kg x 14900
  perform public.registrar_venta(v_id, '2026-10-22', '5525', '[{"detalle": "ASADO", "kilos": 25.7, "precio": 14900.0}]'::jsonb);

  -- fila 5 · 2026-11-04 · remito 3070
  --   SUPREMA 30 kg x 6300 + PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-04', '3070', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6300.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 8 · 2026-11-05 · remito 1735
  --   ASADO 70 kg x 14800 + PARRILLERO 36.2 kg x 13800 + PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-05', '1735', '[{"detalle": "ASADO", "kilos": 70.0, "precio": 14800.0}, {"detalle": "PARRILLERO", "kilos": 36.2, "precio": 13800.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 9 · 2026-11-06 · remito 3005
  --   RUEDA 30.4 kg x 10200
  perform public.registrar_venta(v_id, '2026-11-06', '3005', '[{"detalle": "RUEDA", "kilos": 30.4, "precio": 10200.0}]'::jsonb);

  -- fila 11 · 2026-11-07 · remito 3026
  --   SUPREMA 60 kg x 6400 + PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-07', '3026', '[{"detalle": "SUPREMA", "kilos": 60.0, "precio": 6400.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 12 · 2026-11-09 · remito 3050
  --   PATA MUSLO 30 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-09', '3050', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2900.0}]'::jsonb);

  -- fila 13 · 2026-11-13 · remito 8409
  --   PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-13', '8409', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 14 · 2026-11-12 · remito 2736
  --   SUPREMA 45 kg x 6300
  perform public.registrar_venta(v_id, '2026-11-12', '2736', '[{"detalle": "SUPREMA", "kilos": 45.0, "precio": 6300.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 3346070.00 then
    raise exception 'Cliente 43 (MAXI): el saldo dio %, la planilla dice 3346070.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 8 then
    raise exception 'Cliente 43 (MAXI): se cargaron % movimientos y esperaba 8', v_cant;
  end if;
  raise notice 'Cliente 43 (MAXI): ok · 8 movimientos · saldo 3346070.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 44 · SEBA 3 M   (hoja "44 SEBA 3 M")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 44) then
    raise notice 'Cliente 44 (SEBA 3 M): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (44, 'SEBA 3 M', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-22 · remito 5535
  --   ENTRAÑA 1.6 kg x 20000
  perform public.registrar_venta(v_id, '2026-10-22', '5535', '[{"detalle": "ENTRAÑA", "kilos": 1.6, "precio": 20000.0}]'::jsonb);

  -- fila 6 · 2026-10-28 · remito 4633
  --   PATA MUSLO 15 kg x 2900 + SUPREMA 15 kg x 6300 + PECHITO 4.3 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-28', '4633', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}, {"detalle": "PECHITO", "kilos": 4.3, "precio": 6900.0}]'::jsonb);

  -- fila 7 · 2026-10-31 · remito 2686
  --   ASADO 22.5 kg x 15200
  perform public.registrar_venta(v_id, '2026-10-31', '2686', '[{"detalle": "ASADO", "kilos": 22.5, "precio": 15200.0}]'::jsonb);

  -- fila 8 · 2026-10-31 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-31', 'pago', '', 20000.00, null);

  -- fila 9 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '5981', 40000.00, null);

  -- fila 11 · 2026-11-03 · remito 5669
  --   SUPREMA 15 kg x 6300 + PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-03', '5669', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6300.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 12 · 2026-11-03 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '', 400000.00, null);

  -- fila 13 · 2026-11-05 · remito 1738
  --   PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-05', '1738', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 14 · 2026-11-06 · remito 3010
  --   PARRILLERO 36 kg x 13100
  perform public.registrar_venta(v_id, '2026-11-06', '3010', '[{"detalle": "PARRILLERO", "kilos": 36.0, "precio": 13100.0}]'::jsonb);

  -- fila 16 · 2026-11-07 · remito 1746
  --   SUPREMA 30 kg x 6700 + BONDIOLA 5.5 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-07', '1746', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6700.0}, {"detalle": "BONDIOLA", "kilos": 5.5, "precio": 6800.0}]'::jsonb);

  -- fila 17 · 2026-11-07 · remito 5995
  --   PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-07', '5995', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 20 · 2026-11-08 · remito 1530
  --   CUADRADA 11 kg x 13500 + POLLO (POR UNIDAD) 1 u x 67000 + SUPREMA 30 kg x 6700
  perform public.registrar_venta(v_id, '2026-11-08', '1530', '[{"detalle": "CUADRADA", "kilos": 11.0, "precio": 13500.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6700.0}]'::jsonb);

  -- fila 22 · 2026-11-09 · remito 16486
  --   SUPREMA 30 kg x 6700 + PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-09', '16486', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6700.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 23 · 2026-11-10 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1568', 418500.00, null);

  -- fila 24 · 2026-11-10 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '', 1000000.00, null);

  -- fila 26 · 2026-11-12 · remito 2737
  --   BONDIOLA 4.6 kg x 6600 + SUPREMA 15 kg x 6700
  perform public.registrar_venta(v_id, '2026-11-12', '2737', '[{"detalle": "BONDIOLA", "kilos": 4.6, "precio": 6600.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6700.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 390030.00 then
    raise exception 'Cliente 44 (SEBA 3 M): el saldo dio %, la planilla dice 390030.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 16 then
    raise exception 'Cliente 44 (SEBA 3 M): se cargaron % movimientos y esperaba 16', v_cant;
  end if;
  raise notice 'Cliente 44 (SEBA 3 M): ok · 16 movimientos · saldo 390030.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 45 · FABIAN RAMIREZ   (hoja "45 FABIAN RAMIREZ")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 45) then
    raise notice 'Cliente 45 (FABIAN RAMIREZ): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (45, 'FABIAN RAMIREZ', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-23 · remito 5535
  --   ENTRAÑA 1.6 kg x 20000
  perform public.registrar_venta(v_id, '2026-10-23', '5535', '[{"detalle": "ENTRAÑA", "kilos": 1.6, "precio": 20000.0}]'::jsonb);

  -- fila 5 · 2026-10-23 · remito 5957
  --   OSOBUCO 30.8 kg x 8000 + ROAST BEEF 5.9 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-23', '5957', '[{"detalle": "OSOBUCO", "kilos": 30.8, "precio": 8000.0}, {"detalle": "ROAST BEEF", "kilos": 5.9, "precio": 12500.0}]'::jsonb);

  -- fila 6 · 2026-10-26 · remito 3055
  --   PATA MUSLO 45 kg x 2900
  perform public.registrar_venta(v_id, '2026-10-26', '3055', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}]'::jsonb);

  -- fila 8 · 2026-10-26 · remito 2658
  --   ROAST BEEF 5.3 kg x 12500 + CARRE 6.2 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-26', '2658', '[{"detalle": "ROAST BEEF", "kilos": 5.3, "precio": 12500.0}, {"detalle": "CARRE", "kilos": 6.2, "precio": 6900.0}]'::jsonb);

  -- fila 9 · 2026-10-30 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '1721', 560000.00, null);

  -- fila 10 · 2026-10-31 · remito 2674
  --   PALETA 8.6 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-31', '2674', '[{"detalle": "PALETA", "kilos": 8.6, "precio": 12500.0}]'::jsonb);

  -- fila 11 · 2026-11-03 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '5665', 101250.00, null);

  -- fila 14 · 2026-11-07 · remito 1747
  --   POLLO (POR UNIDAD) 1 u x 67000 + PALETA/ROAST BEEF 28.2 kg x 12500 + PARRILLERO CERDO 13.9 kg x 6000
  perform public.registrar_venta(v_id, '2026-11-07', '1747', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}, {"detalle": "PALETA/ROAST BEEF", "kilos": 28.2, "precio": 12500.0}, {"detalle": "PARRILLERO CERDO", "kilos": 13.9, "precio": 6000.0}]'::jsonb);

  -- fila 15 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1587', 540830.00, null);

  -- fila 16 · 2026-11-14 · DESCUENTO (retiro) "RETIRO LOMO 2.038 kg x 21000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-14', 'descuento', '1611', 42800.00, 'RETIRO LOMO 2.038 kg x 21000');

  -- fila 17 · 2026-11-15 · DESCUENTO (retiro) "RETIRO LOMO 13.6 kg x 22000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-15', 'descuento', '2769', 299200.00, 'RETIRO LOMO 13.6 kg x 22000');

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from -342000.00 then
    raise exception 'Cliente 45 (FABIAN RAMIREZ): el saldo dio %, la planilla dice -342000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 11 then
    raise exception 'Cliente 45 (FABIAN RAMIREZ): se cargaron % movimientos y esperaba 11', v_cant;
  end if;
  raise notice 'Cliente 45 (FABIAN RAMIREZ): ok · 11 movimientos · saldo -342000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 46 · LA GRAN FLIA   (hoja "46 LA GRAN FLIA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 46) then
    raise notice 'Cliente 46 (LA GRAN FLIA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (46, 'LA GRAN FLIA', '', '', '', 'LA GRAN FAMILIA', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-22 · remito 5887
  --   MATAMBRE 25.3 kg x 13500 + LOMO 40 kg x 22000
  perform public.registrar_venta(v_id, '2026-10-22', '5887', '[{"detalle": "MATAMBRE", "kilos": 25.3, "precio": 13500.0}, {"detalle": "LOMO", "kilos": 40.0, "precio": 22000.0}]'::jsonb);

  -- fila 5 · 2026-10-23 · PAGO "PAGO BCO PCIA N°15219180"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-23', 'pago', '5541', 1221550.00, null);

  -- fila 8 · 2026-10-26 · remito 2655
  --   ROAST BEEF 183.3 kg x 12000 + LOMO 12.2 kg x 22000 + MATAMBRE 7.7 kg x 13500
  perform public.registrar_venta(v_id, '2026-10-26', '2655', '[{"detalle": "ROAST BEEF", "kilos": 183.3, "precio": 12000.0}, {"detalle": "LOMO", "kilos": 12.2, "precio": 22000.0}, {"detalle": "MATAMBRE", "kilos": 7.7, "precio": 13500.0}]'::jsonb);

  -- fila 9 · 2026-10-26 · remito 2660
  --   BOLA DE LOMO 25.1 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-26', '2660', '[{"detalle": "BOLA DE LOMO", "kilos": 25.1, "precio": 13000.0}]'::jsonb);

  -- fila 10 · 2026-10-26 · PAGO "PAGO BCO PCIA N°15219181"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '', 2898250.00, null);

  -- fila 13 · 2026-11-03 · remito 5666
  --   BOLA DE LOMO 16.8 kg x 13000 + MATAMBRE 2.1 kg x 13500 + LOMO 21.65 kg x 22000
  perform public.registrar_venta(v_id, '2026-11-03', '5666', '[{"detalle": "BOLA DE LOMO", "kilos": 16.8, "precio": 13000.0}, {"detalle": "MATAMBRE", "kilos": 2.1, "precio": 13500.0}, {"detalle": "LOMO", "kilos": 21.65, "precio": 22000.0}]'::jsonb);

  -- fila 15 · 2026-11-09 · remito 3034
  --   MATAMBRE 26.1 kg x 13500 + BOLA DE LOMO 24.7 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-09', '3034', '[{"detalle": "MATAMBRE", "kilos": 26.1, "precio": 13500.0}, {"detalle": "BOLA DE LOMO", "kilos": 24.7, "precio": 13000.0}]'::jsonb);

  -- fila 16 · 2026-11-11 · PAGO "PAGO CH 15219187"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1596', 1396500.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 46 (LA GRAN FLIA): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 8 then
    raise exception 'Cliente 46 (LA GRAN FLIA): se cargaron % movimientos y esperaba 8', v_cant;
  end if;
  raise notice 'Cliente 46 (LA GRAN FLIA): ok · 8 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 47 · MIGUEL PABON   (hoja "47 MIGUEL PABON")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 47) then
    raise notice 'Cliente 47 (MIGUEL PABON): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (47, 'MIGUEL PABON', '', '', '', 'LO DE SOFIA', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-23 · remito 5960
  --   ASADO PLANCHA 29.5 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-23', '5960', '[{"detalle": "ASADO PLANCHA", "kilos": 29.5, "precio": 15500.0}]'::jsonb);

  -- fila 4 · 2026-10-29 · PAGO "TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '5897', 100000.00, null);

  -- fila 7 · 2026-11-05 · remito 1512
  --   ASADO 31.7 kg x 16500 + NALGA 9.7 kg x 16900 + PATA MUSLO 15 kg x 3200
  perform public.registrar_venta(v_id, '2026-11-05', '1512', '[{"detalle": "ASADO", "kilos": 31.7, "precio": 16500.0}, {"detalle": "NALGA", "kilos": 9.7, "precio": 16900.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}]'::jsonb);

  -- fila 8 · 2026-11-11 · remito 2733
  --   PICADA 8.9 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-11', '2733', '[{"detalle": "PICADA", "kilos": 8.9, "precio": 13000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1207930.00 then
    raise exception 'Cliente 47 (MIGUEL PABON): el saldo dio %, la planilla dice 1207930.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 47 (MIGUEL PABON): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 47 (MIGUEL PABON): ok · 4 movimientos · saldo 1207930.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 48 · SUPER PAVON   (hoja "48 SUPER PAVON")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 48) then
    raise notice 'Cliente 48 (SUPER PAVON): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (48, 'SUPER PAVON', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 5 · 2026-10-22 · remito 5891
  --   JAMON 11.9 kg x 5000 + BONDIOLA 7.5 kg x 6900 + CARRE 8.6 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-22', '5891', '[{"detalle": "JAMON", "kilos": 11.9, "precio": 5000.0}, {"detalle": "BONDIOLA", "kilos": 7.5, "precio": 6900.0}, {"detalle": "CARRE", "kilos": 8.6, "precio": 6900.0}]'::jsonb);

  -- fila 11 · 2026-10-26 · remito 2653
  --   PICADA 10.2 kg x 11000 + TAPA DE ASADO 5.4 kg x 12500 + PATA MUSLO 15 kg x 3200 + JAMON 10.9 kg x 5000 + PALETA 12.2 kg x 4800 + CARRE 5 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-26', '2653', '[{"detalle": "PICADA", "kilos": 10.2, "precio": 11000.0}, {"detalle": "TAPA DE ASADO", "kilos": 5.4, "precio": 12500.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}, {"detalle": "JAMON", "kilos": 10.9, "precio": 5000.0}, {"detalle": "PALETA", "kilos": 12.2, "precio": 4800.0}, {"detalle": "CARRE", "kilos": 5.0, "precio": 6900.0}]'::jsonb);

  -- fila 12 · 2026-10-26 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-26', 'pago', '2654', 48000.00, null);

  -- fila 13 · 2026-10-27 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-27', 'pago', '1709', 40000.00, null);

  -- fila 14 · 2026-10-30 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '4639', 36000.00, null);

  -- fila 15 · 2026-10-30 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '', 10000.00, null);

  -- fila 16 · 2026-11-02 · PAGO "TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '3064', 200000.00, null);

  -- fila 17 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '2697', 50000.00, null);

  -- fila 20 · 2026-11-04 · remito 3083
  --   BONDIOLA 5.5 kg x 7100 + PALETA 6.9 kg x 12500 + PATA MUSLO 30 kg x 3200
  perform public.registrar_venta(v_id, '2026-11-04', '3083', '[{"detalle": "BONDIOLA", "kilos": 5.5, "precio": 7100.0}, {"detalle": "PALETA", "kilos": 6.9, "precio": 12500.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3200.0}]'::jsonb);

  -- fila 21 · 2026-11-06 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '3012', 40000.00, null);

  -- fila 22 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '5696', 40000.00, null);

  -- fila 25 · 2026-11-10 · remito 2722
  --   PATA MUSLO 30 kg x 3200 + SUPREMA 15 kg x 7200 + POLLO (POR UNIDAD) 1 u x 67000
  perform public.registrar_venta(v_id, '2026-11-10', '2722', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3200.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 7200.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}]'::jsonb);

  -- fila 26 · 2026-11-10 · PAGO "TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1576', 50000.00, null);

  -- fila 27 · 2026-11-15 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '1628', 137000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 387150.00 then
    raise exception 'Cliente 48 (SUPER PAVON): el saldo dio %, la planilla dice 387150.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 14 then
    raise exception 'Cliente 48 (SUPER PAVON): se cargaron % movimientos y esperaba 14', v_cant;
  end if;
  raise notice 'Cliente 48 (SUPER PAVON): ok · 14 movimientos · saldo 387150.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 49 · EL GRAN CHOR   (hoja "49 EL GRAN CHOR")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 49) then
    raise notice 'Cliente 49 (EL GRAN CHOR): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (49, 'EL GRAN CHOR', '', '', '', 'EL GRAN CHORIPAN', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-23 · remito 5964
  --   ASADO 41.1 kg x 15500
  perform public.registrar_venta(v_id, '2026-10-23', '5964', '[{"detalle": "ASADO", "kilos": 41.1, "precio": 15500.0}]'::jsonb);

  -- fila 5 · 2026-10-23 · remito 5968
  --   NALGA C/T 7.7 kg x 17900 + BIFE 14.6 kg x 16900
  perform public.registrar_venta(v_id, '2026-10-23', '5968', '[{"detalle": "NALGA C/T", "kilos": 7.7, "precio": 17900.0}, {"detalle": "BIFE", "kilos": 14.6, "precio": 16900.0}]'::jsonb);

  -- fila 7 · 2026-10-31 · remito 2690
  --   CHORIZO 11.1 kg x 6900 + CARRE 14 kg x 7200
  perform public.registrar_venta(v_id, '2026-10-31', '2690', '[{"detalle": "CHORIZO", "kilos": 11.1, "precio": 6900.0}, {"detalle": "CARRE", "kilos": 14.0, "precio": 7200.0}]'::jsonb);

  -- fila 10 · 2026-11-06 · remito 3014
  --   ASADO 40.2 kg x 16900 + NALGA 14.5 kg x 17900 + BIFE 23 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-06', '3014', '[{"detalle": "ASADO", "kilos": 40.2, "precio": 16900.0}, {"detalle": "NALGA", "kilos": 14.5, "precio": 17900.0}, {"detalle": "BIFE", "kilos": 23.0, "precio": 16900.0}]'::jsonb);

  -- fila 11 · 2026-11-07 · remito 5996
  --   BIFE 2.7 kg x 17900
  perform public.registrar_venta(v_id, '2026-11-07', '5996', '[{"detalle": "BIFE", "kilos": 2.7, "precio": 17900.0}]'::jsonb);

  -- fila 12 · 2026-11-09 · remito 1563
  --   ASA/MATAMBRE 8.3 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-09', '1563', '[{"detalle": "ASA/MATAMBRE", "kilos": 8.3, "precio": 16900.0}]'::jsonb);

  -- fila 13 · 2026-11-09 · DESCUENTO (retiro) "RETIRO CHORIZO 10.9 kg x 6900"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-09', 'descuento', '1564', 75210.00, 'RETIRO CHORIZO 10.9 kg x 6900');

  -- fila 14 · 2026-11-09 · remito 16494
  --   NALGA S/T 3.9 kg x 19500
  perform public.registrar_venta(v_id, '2026-11-09', '16494', '[{"detalle": "NALGA S/T", "kilos": 3.9, "precio": 19500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 2716080.00 then
    raise exception 'Cliente 49 (EL GRAN CHOR): el saldo dio %, la planilla dice 2716080.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 8 then
    raise exception 'Cliente 49 (EL GRAN CHOR): se cargaron % movimientos y esperaba 8', v_cant;
  end if;
  raise notice 'Cliente 49 (EL GRAN CHOR): ok · 8 movimientos · saldo 2716080.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 50 · SAN JOSE   (hoja "50 SAN JOSE")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 50) then
    raise notice 'Cliente 50 (SAN JOSE): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (50, 'SAN JOSE', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-23 · remito 5969
  --   NALGA C/T 7.2 kg x 16900 + OSOBUCO 4.8 kg x 10000
  perform public.registrar_venta(v_id, '2026-10-23', '5969', '[{"detalle": "NALGA C/T", "kilos": 7.2, "precio": 16900.0}, {"detalle": "OSOBUCO", "kilos": 4.8, "precio": 10000.0}]'::jsonb);

  -- fila 9 · 2026-11-05 · remito 1511
  --   ASADO 10.1 kg x 15900 + VACIO 5.6 kg x 15900 + BIFE 9.5 kg x 16900 + ROAST BEEF 6.8 kg x 13900 + NALGA C/T 23.6 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-05', '1511', '[{"detalle": "ASADO", "kilos": 10.1, "precio": 15900.0}, {"detalle": "VACIO", "kilos": 5.6, "precio": 15900.0}, {"detalle": "BIFE", "kilos": 9.5, "precio": 16900.0}, {"detalle": "ROAST BEEF", "kilos": 6.8, "precio": 13900.0}, {"detalle": "NALGA C/T", "kilos": 23.6, "precio": 16900.0}]'::jsonb);

  -- fila 15 · 2026-11-06 · remito 3018
  --   NALGA S/T 4.9 kg x 17900 + CHORIZO 11.7 kg x 7200 + MORCILLA 7.45 kg x 7000 + CHINCHULIN 12.8 kg x 7400 + RIÑON 8.8 kg x 7600 + ASADO 10.3 kg x 15900
  perform public.registrar_venta(v_id, '2026-11-06', '3018', '[{"detalle": "NALGA S/T", "kilos": 4.9, "precio": 17900.0}, {"detalle": "CHORIZO", "kilos": 11.7, "precio": 7200.0}, {"detalle": "MORCILLA", "kilos": 7.45, "precio": 7000.0}, {"detalle": "CHINCHULIN", "kilos": 12.8, "precio": 7400.0}, {"detalle": "RIÑON", "kilos": 8.8, "precio": 7600.0}, {"detalle": "ASADO", "kilos": 10.3, "precio": 15900.0}]'::jsonb);

  -- fila 17 · 2026-11-08 · remito 1534
  --   ASADO 9.5 kg x 15900 + BIFE 9.2 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-08', '1534', '[{"detalle": "ASADO", "kilos": 9.5, "precio": 15900.0}, {"detalle": "BIFE", "kilos": 9.2, "precio": 16900.0}]'::jsonb);

  -- fila 20 · 2026-11-08 · remito 5688
  --   NALGA S/T 5.2 kg x 17900 + PECHITO 7.3 kg x 7500 + ASADO 14.3 kg x 15900
  perform public.registrar_venta(v_id, '2026-11-08', '5688', '[{"detalle": "NALGA S/T", "kilos": 5.2, "precio": 17900.0}, {"detalle": "PECHITO", "kilos": 7.3, "precio": 7500.0}, {"detalle": "ASADO", "kilos": 14.3, "precio": 15900.0}]'::jsonb);

  -- fila 22 · 2026-11-09 · remito 2702
  --   SUPREMA 1.4 kg x 7200 + BONDIOLA 2 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-09', '2702', '[{"detalle": "SUPREMA", "kilos": 1.4, "precio": 7200.0}, {"detalle": "BONDIOLA", "kilos": 2.0, "precio": 7000.0}]'::jsonb);

  -- fila 23 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '', 24080.00, null);

  -- fila 24 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '5693', 1500000.00, null);

  -- fila 25 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1597', 700000.00, null);

  -- fila 32 · 2026-11-13 · remito 8414
  --   ROAST BEEF 8.6 kg x 13900 + PECHITO 6.7 kg x 8500 + CHORIZO 4.25 kg x 9500 + MORCILLA 3.3 kg x 8000 + ASADO 9.6 kg x 15900 + VACIO 3.6 kg x 16900 + NALGA S/T 5.9 kg x 17900
  perform public.registrar_venta(v_id, '2026-11-13', '8414', '[{"detalle": "ROAST BEEF", "kilos": 8.6, "precio": 13900.0}, {"detalle": "PECHITO", "kilos": 6.7, "precio": 8500.0}, {"detalle": "CHORIZO", "kilos": 4.25, "precio": 9500.0}, {"detalle": "MORCILLA", "kilos": 3.3, "precio": 8000.0}, {"detalle": "ASADO", "kilos": 9.6, "precio": 15900.0}, {"detalle": "VACIO", "kilos": 3.6, "precio": 16900.0}, {"detalle": "NALGA S/T", "kilos": 5.9, "precio": 17900.0}]'::jsonb);

  -- fila 33 · 2026-11-13 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '', 562355.00, null);

  -- fila 34 · 2026-11-14 · remito 8422
  --   CHINCHULIN 7.2 kg x 7500
  perform public.registrar_venta(v_id, '2026-11-14', '8422', '[{"detalle": "CHINCHULIN", "kilos": 7.2, "precio": 7500.0}]'::jsonb);

  -- fila 38 · 2026-11-14 · remito 8418
  --   RIÑON 3 kg x 7500 + ASADO 10 kg x 15900 + NALGA S/T 5.9 kg x 17900 + BIFE 11.4 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-14', '8418', '[{"detalle": "RIÑON", "kilos": 3.0, "precio": 7500.0}, {"detalle": "ASADO", "kilos": 10.0, "precio": 15900.0}, {"detalle": "NALGA S/T", "kilos": 5.9, "precio": 17900.0}, {"detalle": "BIFE", "kilos": 11.4, "precio": 16900.0}]'::jsonb);

  -- fila 39 · 2026-11-14 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '', 479770.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 158420.00 then
    raise exception 'Cliente 50 (SAN JOSE): el saldo dio %, la planilla dice 158420.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 14 then
    raise exception 'Cliente 50 (SAN JOSE): se cargaron % movimientos y esperaba 14', v_cant;
  end if;
  raise notice 'Cliente 50 (SAN JOSE): ok · 14 movimientos · saldo 158420.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 51 · OVIDIO (WEBER)   (hoja "51 OVIDIO (WEBER)")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 51) then
    raise notice 'Cliente 51 (OVIDIO (WEBER)): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (51, 'OVIDIO (WEBER)', '', '', '', 'PAVON', v_autor)
  returning id into v_id;


  -- fila 6 · 2026-10-27 · remito 1711
  --   MEDIA RES DE CERDO 41 kg x 4500 + POLLO (POR UNIDAD) 1 u x 67000 + PATA MUSLO 15 kg x 3000 + PALETA 8.6 kg x 13500
  perform public.registrar_venta(v_id, '2026-10-27', '1711', '[{"detalle": "MEDIA RES DE CERDO", "kilos": 41.0, "precio": 4500.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}, {"detalle": "PALETA", "kilos": 8.6, "precio": 13500.0}]'::jsonb);

  -- fila 9 · 2026-10-31 · remito 2688
  --   ASADO 12 kg x 14900 + POLLO (POR UNIDAD) 1 u x 67000 + MORCILLA 9.4 kg x 4700
  perform public.registrar_venta(v_id, '2026-10-31', '2688', '[{"detalle": "ASADO", "kilos": 12.0, "precio": 14900.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}, {"detalle": "MORCILLA", "kilos": 9.4, "precio": 4700.0}]'::jsonb);

  -- fila 10 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '3090', 200000.00, null);

  -- fila 11 · 2026-11-05 · remito 1729
  --   PATA MUSLO 90 kg x 2850
  perform public.registrar_venta(v_id, '2026-11-05', '1729', '[{"detalle": "PATA MUSLO", "kilos": 90.0, "precio": 2850.0}]'::jsonb);

  -- fila 12 · 2026-11-06 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '5596', 200000.00, null);

  -- fila 15 · 2026-11-07 · remito 1743
  --   MORCILLA 19.4 kg x 4800 + POLLO (POR UNIDAD) 2 u x 67000 + CAPON 42.5 kg x 4300
  perform public.registrar_venta(v_id, '2026-11-07', '1743', '[{"detalle": "MORCILLA", "kilos": 19.4, "precio": 4800.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 2.0, "precio": 67000.0}, {"detalle": "CAPON", "kilos": 42.5, "precio": 4300.0}]'::jsonb);

  -- fila 16 · 2026-11-16 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1641', 250000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 718950.00 then
    raise exception 'Cliente 51 (OVIDIO (WEBER)): el saldo dio %, la planilla dice 718950.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 7 then
    raise exception 'Cliente 51 (OVIDIO (WEBER)): se cargaron % movimientos y esperaba 7', v_cant;
  end if;
  raise notice 'Cliente 51 (OVIDIO (WEBER)): ok · 7 movimientos · saldo 718950.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 52 · EL CENTRAL   (hoja "52 EL CENTRAL")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 52) then
    raise notice 'Cliente 52 (EL CENTRAL): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (52, 'EL CENTRAL', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 5 · 2026-10-27 · remito 5543
  --   BONDIOLA 24.1 kg x 7000 + PECHITO 26.5 kg x 7000 + CARRE 20.8 kg x 7000
  perform public.registrar_venta(v_id, '2026-10-27', '5543', '[{"detalle": "BONDIOLA", "kilos": 24.1, "precio": 7000.0}, {"detalle": "PECHITO", "kilos": 26.5, "precio": 7000.0}, {"detalle": "CARRE", "kilos": 20.8, "precio": 7000.0}]'::jsonb);

  -- fila 6 · 2026-11-05 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-05', 'pago', '', 499800.00, null);

  -- fila 7 · 2026-11-09 · remito 3039
  --   BONDIOLA 43.73 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-09', '3039', '[{"detalle": "BONDIOLA", "kilos": 43.73, "precio": 7000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 306110.00 then
    raise exception 'Cliente 52 (EL CENTRAL): el saldo dio %, la planilla dice 306110.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 52 (EL CENTRAL): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 52 (EL CENTRAL): ok · 3 movimientos · saldo 306110.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 53 · LA ARDILLA   (hoja "53 LA ARDILLA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 53) then
    raise notice 'Cliente 53 (LA ARDILLA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (53, 'LA ARDILLA', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 8 · 2026-10-27 · remito 5545
  --   SUPREMA 15 kg x 6500 + BONDIOLA 23.7 kg x 7000 + ASADO 14.2 kg x 14900 + BIFE 14.6 kg x 14900 + PALETA 5.9 kg x 13500 + CUADRIL 5.2 kg x 14500
  perform public.registrar_venta(v_id, '2026-10-27', '5545', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}, {"detalle": "BONDIOLA", "kilos": 23.7, "precio": 7000.0}, {"detalle": "ASADO", "kilos": 14.2, "precio": 14900.0}, {"detalle": "BIFE", "kilos": 14.6, "precio": 14900.0}, {"detalle": "PALETA", "kilos": 5.9, "precio": 13500.0}, {"detalle": "CUADRIL", "kilos": 5.2, "precio": 14500.0}]'::jsonb);

  -- fila 9 · 2026-10-28 · remito 4631
  --   PATA MUSLO 30 kg x 3300
  perform public.registrar_venta(v_id, '2026-10-28', '4631', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3300.0}]'::jsonb);

  -- fila 11 · 2026-10-29 · remito 5795
  --   SUPREMA 15 kg x 6500 + JAMON 11.2 kg x 4900
  perform public.registrar_venta(v_id, '2026-10-29', '5795', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}, {"detalle": "JAMON", "kilos": 11.2, "precio": 4900.0}]'::jsonb);

  -- fila 13 · 2026-10-31 · remito 5661
  --   PECHITO 19.4 kg x 6800 + CORDERO 10.4 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-31', '5661', '[{"detalle": "PECHITO", "kilos": 19.4, "precio": 6800.0}, {"detalle": "CORDERO", "kilos": 10.4, "precio": 12500.0}]'::jsonb);

  -- fila 14 · 2026-10-31 · remito 2840 · fecha original de la planilla: 2016-11-03
  --   JAMON 11 kg x 5000
  perform public.registrar_venta(v_id, '2026-10-31', '2840', '[{"detalle": "JAMON", "kilos": 11.0, "precio": 5000.0}]'::jsonb);

  -- fila 17 · 2026-11-03 · remito 5667
  --   BONDIOLA 22.37 kg x 7000 + SUPREMA 15 kg x 6500 + PATA MUSLO 15 kg x 3300
  perform public.registrar_venta(v_id, '2026-11-03', '5667', '[{"detalle": "BONDIOLA", "kilos": 22.37, "precio": 7000.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3300.0}]'::jsonb);

  -- fila 19 · 2026-11-05 · remito 1739
  --   ENTRAÑA 4.8 kg x 17000 + PATA MUSLO 30 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-05', '1739', '[{"detalle": "ENTRAÑA", "kilos": 4.8, "precio": 17000.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3000.0}]'::jsonb);

  -- fila 23 · 2026-11-07 · remito 3029
  --   SUPREMA 30 kg x 6500 + PATA MUSLO 15 kg x 3300 + BONDIOLA 21.37 kg x 7000 + COLITA DE CUADRIL 4.9 kg x 14900
  perform public.registrar_venta(v_id, '2026-11-07', '3029', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6500.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3300.0}, {"detalle": "BONDIOLA", "kilos": 21.37, "precio": 7000.0}, {"detalle": "COLITA DE CUADRIL", "kilos": 4.9, "precio": 14900.0}]'::jsonb);

  -- fila 24 · 2026-11-07 · remito 1526
  --   CAPON 37.4 kg x 4300
  perform public.registrar_venta(v_id, '2026-11-07', '1526', '[{"detalle": "CAPON", "kilos": 37.4, "precio": 4300.0}]'::jsonb);

  -- fila 25 · 2026-11-07 · remito 5998
  --   CORDERO 12.8 kg x 12500
  perform public.registrar_venta(v_id, '2026-11-07', '5998', '[{"detalle": "CORDERO", "kilos": 12.8, "precio": 12500.0}]'::jsonb);

  -- fila 27 · 2026-11-08 · remito 1529
  --   SUPREMA 30 kg x 6500 + PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-08', '1529', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6500.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 28 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1554', 1000000.00, null);

  -- fila 29 · 2026-11-09 · PAGO "PAGO U$S 750 X 1550"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '', 1085000.00, null);

  -- fila 30 · 2026-11-09 · remito 2708
  --   SUPREMA 45 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-09', '2708', '[{"detalle": "SUPREMA", "kilos": 45.0, "precio": 6500.0}]'::jsonb);

  -- fila 31 · 2026-11-11 · remito 2727
  --   PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-11', '2727', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 32 · 2026-11-11 · PAGO "PAGO KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '', 45000.00, null);

  -- fila 33 · 2026-11-12 · remito 2739
  --   PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-12', '2739', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 33 · 2026-11-12 · PAGO "pagado en el momento de la venta"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '', 45000.00, null);

  -- fila 34 · 2026-11-14 · remito 8427
  --   BONDIOLA 21.1 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-14', '8427', '[{"detalle": "BONDIOLA", "kilos": 21.1, "precio": 7000.0}]'::jsonb);

  -- fila 35 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '', 147000.00, null);

  -- fila 36 · 2026-11-16 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1633', 400000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 727180.00 then
    raise exception 'Cliente 53 (LA ARDILLA): el saldo dio %, la planilla dice 727180.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 21 then
    raise exception 'Cliente 53 (LA ARDILLA): se cargaron % movimientos y esperaba 21', v_cant;
  end if;
  raise notice 'Cliente 53 (LA ARDILLA): ok · 21 movimientos · saldo 727180.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 54 · PABLO   (hoja "54 PABLO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 54) then
    raise notice 'Cliente 54 (PABLO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (54, 'PABLO', '', '', '', 'MARANO', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-28 · remito 4630
  --   PATA MUSLO 195 kg x 2750
  perform public.registrar_venta(v_id, '2026-10-28', '4630', '[{"detalle": "PATA MUSLO", "kilos": 195.0, "precio": 2750.0}]'::jsonb);

  -- fila 4 · 2026-11-02 · remito 2835
  --   PATA MUSLO 150 kg x 2750
  perform public.registrar_venta(v_id, '2026-11-02', '2835', '[{"detalle": "PATA MUSLO", "kilos": 150.0, "precio": 2750.0}]'::jsonb);

  -- fila 5 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '3068', 300000.00, null);

  -- fila 6 · 2026-11-06 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '1517', 240000.00, null);

  -- fila 7 · 2026-11-07 · remito 5597
  --   POLLO 300 kg x 2750
  perform public.registrar_venta(v_id, '2026-11-07', '5597', '[{"detalle": "POLLO", "kilos": 300.0, "precio": 2750.0}]'::jsonb);

  -- fila 8 · 2026-11-13 · remito 8413
  --   PATA MUSLO 150 kg x 2750
  perform public.registrar_venta(v_id, '2026-11-13', '8413', '[{"detalle": "PATA MUSLO", "kilos": 150.0, "precio": 2750.0}]'::jsonb);

  -- fila 9 · 2026-11-13 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '1609', 410000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1236250.00 then
    raise exception 'Cliente 54 (PABLO): el saldo dio %, la planilla dice 1236250.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 7 then
    raise exception 'Cliente 54 (PABLO): se cargaron % movimientos y esperaba 7', v_cant;
  end if;
  raise notice 'Cliente 54 (PABLO): ok · 7 movimientos · saldo 1236250.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 55 · TATA DANIEL   (hoja "55 TATA DANIEL")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 55) then
    raise notice 'Cliente 55 (TATA DANIEL): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (55, 'TATA DANIEL', '', '', 'MAR DEL TUYU', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-28 · remito 4636
  --   PATA MUSLO 15 kg x 3200
  perform public.registrar_venta(v_id, '2026-10-28', '4636', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}]'::jsonb);

  -- fila 4 · 2026-10-30 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-30', 'pago', '4638', 48000.00, null);

  -- fila 5 · 2026-11-02 · remito 2837
  --   PATA MUSLO 15 kg x 3200
  perform public.registrar_venta(v_id, '2026-11-02', '2837', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}]'::jsonb);

  -- fila 6 · 2026-11-02 · remito 3067
  --   PECHO 37.8 kg x 8700
  perform public.registrar_venta(v_id, '2026-11-02', '3067', '[{"detalle": "PECHO", "kilos": 37.8, "precio": 8700.0}]'::jsonb);

  -- fila 7 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '3071', 250000.00, null);

  -- fila 11 · 2026-11-04 · remito 3089
  --   CHORIZO 9.6 kg x 6800 + MORCILLA 4 kg x 4800 + SALCHICHA PARRILERA 2.7 kg x 9000 + BONDIOLA 2.9 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-04', '3089', '[{"detalle": "CHORIZO", "kilos": 9.6, "precio": 6800.0}, {"detalle": "MORCILLA", "kilos": 4.0, "precio": 4800.0}, {"detalle": "SALCHICHA PARRILERA", "kilos": 2.7, "precio": 9000.0}, {"detalle": "BONDIOLA", "kilos": 2.9, "precio": 7000.0}]'::jsonb);

  -- fila 12 · 2026-11-04 · PAGO "PAGO (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '', 70000.00, null);

  -- fila 13 · 2026-11-05 · remito 5684
  --   ASADO 24.5 kg x 15000
  perform public.registrar_venta(v_id, '2026-11-05', '5684', '[{"detalle": "ASADO", "kilos": 24.5, "precio": 15000.0}]'::jsonb);

  -- fila 15 · 2026-11-05 · remito 1506
  --   CARRE 6.9 kg x 7000 + CUADRADA 4.5 kg x 12300
  perform public.registrar_venta(v_id, '2026-11-05', '1506', '[{"detalle": "CARRE", "kilos": 6.9, "precio": 7000.0}, {"detalle": "CUADRADA", "kilos": 4.5, "precio": 12300.0}]'::jsonb);

  -- fila 16 · 2026-11-07 · remito 1524
  --   PATA MUSLO 15 kg x 3200
  perform public.registrar_venta(v_id, '2026-11-07', '1524', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}]'::jsonb);

  -- fila 17 · 2026-11-07 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '', 200000.00, null);

  -- fila 18 · 2026-11-08 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '3097', 300000.00, null);

  -- fila 25 · 2026-11-09 · remito 16489
  --   TAPA DE NALGA 3.6 kg x 14500 + COLITA/PECETO 3 kg x 14500 + ROAST BEEF 6 kg x 13000 + POLLO (POR UNIDAD) 1 u x 67000 + BONDIOLA 9.3 kg x 7000 + PATA MUSLO 15 kg x 3200 + PECHO 25.8 kg x 8700
  perform public.registrar_venta(v_id, '2026-11-09', '16489', '[{"detalle": "TAPA DE NALGA", "kilos": 3.6, "precio": 14500.0}, {"detalle": "COLITA/PECETO", "kilos": 3.0, "precio": 14500.0}, {"detalle": "ROAST BEEF", "kilos": 6.0, "precio": 13000.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}, {"detalle": "BONDIOLA", "kilos": 9.3, "precio": 7000.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}, {"detalle": "PECHO", "kilos": 25.8, "precio": 8700.0}]'::jsonb);

  -- fila 26 · 2026-11-09 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '5598', 200000.00, null);

  -- fila 27 · 2026-11-11 · remito 2730
  --   SUPREMA 15 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-11', '2730', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6900.0}]'::jsonb);

  -- fila 28 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '', 250000.00, null);

  -- fila 30 · 2026-11-12 · remito 2753
  --   ASADO 25.3 kg x 15500 + BONDIOLA 17 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-12', '2753', '[{"detalle": "ASADO", "kilos": 25.3, "precio": 15500.0}, {"detalle": "BONDIOLA", "kilos": 17.0, "precio": 7000.0}]'::jsonb);

  -- fila 31 · 2026-11-12 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '', 200000.00, null);

  -- fila 37 · 2026-11-13 · remito 2761
  --   MOCHO 37.3 kg x 12500 + BIFE 9.2 kg x 12500 + CHORIZO 11.7 kg x 6800 + MORCILLA 4.5 kg x 4800 + SALCHICHA PARRILERA 2.6 kg x 9000 + MORCILLA VASCA 3.5 kg x 4800
  perform public.registrar_venta(v_id, '2026-11-13', '2761', '[{"detalle": "MOCHO", "kilos": 37.3, "precio": 12500.0}, {"detalle": "BIFE", "kilos": 9.2, "precio": 12500.0}, {"detalle": "CHORIZO", "kilos": 11.7, "precio": 6800.0}, {"detalle": "MORCILLA", "kilos": 4.5, "precio": 4800.0}, {"detalle": "SALCHICHA PARRILERA", "kilos": 2.6, "precio": 9000.0}, {"detalle": "MORCILLA VASCA", "kilos": 3.5, "precio": 4800.0}]'::jsonb);

  -- fila 38 · 2026-11-13 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '2762', 180000.00, null);

  -- fila 39 · 2026-11-13 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '', 120000.00, null);

  -- fila 40 · 2026-11-14 · remito 1615
  --   PICADA 22.6 kg x 9000
  perform public.registrar_venta(v_id, '2026-11-14', '1615', '[{"detalle": "PICADA", "kilos": 22.6, "precio": 9000.0}]'::jsonb);

  -- fila 41 · 2026-11-16 · DESCUENTO (descuento) "DESCUENTO (MORCILLA)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-16', 'descuento', '1640', 21600.00, 'DESCUENTO (MORCILLA)');

  -- fila 42 · 2026-11-16 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '', 230000.00, null);

  -- fila 43 · 2026-11-16 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '', 200000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 922410.00 then
    raise exception 'Cliente 55 (TATA DANIEL): el saldo dio %, la planilla dice 922410.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 25 then
    raise exception 'Cliente 55 (TATA DANIEL): se cargaron % movimientos y esperaba 25', v_cant;
  end if;
  raise notice 'Cliente 55 (TATA DANIEL): ok · 25 movimientos · saldo 922410.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 56 · LOS CHICOS   (hoja "56 LOS CHICOS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 56) then
    raise notice 'Cliente 56 (LOS CHICOS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (56, 'LOS CHICOS', '', '', 'MAR DEL TUYU', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-28 · remito 4637
  --   PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-10-28', '4637', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 4 · 2026-10-28 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-28', 'pago', '', 43500.00, null);

  -- fila 5 · 2026-10-31 · remito 2687
  --   PICADA 14 kg x 8500
  perform public.registrar_venta(v_id, '2026-10-31', '2687', '[{"detalle": "PICADA", "kilos": 14.0, "precio": 8500.0}]'::jsonb);

  -- fila 6 · 2026-11-06 · remito 3007
  --   CORDERO 11.4 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-06', '3007', '[{"detalle": "CORDERO", "kilos": 11.4, "precio": 13000.0}]'::jsonb);

  -- fila 7 · 2026-11-06 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-06', 'pago', '', 120000.00, null);

  -- fila 9 · 2026-11-08 · remito 5687
  --   PATA MUSLO 30 kg x 3000 + SUPREMA 15 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-08', '5687', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3000.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6900.0}]'::jsonb);

  -- fila 10 · 2026-11-10 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1575', 340700.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 56 (LOS CHICOS): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 7 then
    raise exception 'Cliente 56 (LOS CHICOS): se cargaron % movimientos y esperaba 7', v_cant;
  end if;
  raise notice 'Cliente 56 (LOS CHICOS): ok · 7 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 57 · FLACO V CLELIA   (hoja "57 FLACO V CLELIA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 57) then
    raise notice 'Cliente 57 (FLACO V CLELIA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (57, 'FLACO V CLELIA', '', '', 'VILLA CLELIA', 'FLACO', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-29 · remito 5793
  --   SUPREMA 15 kg x 6600
  perform public.registrar_venta(v_id, '2026-10-29', '5793', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6600.0}]'::jsonb);

  -- fila 4 · 2026-10-31 · remito 5653
  --   MOCHO 36.8 kg x 10500
  perform public.registrar_venta(v_id, '2026-10-31', '5653', '[{"detalle": "MOCHO", "kilos": 36.8, "precio": 10500.0}]'::jsonb);

  -- fila 5 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '5985', 385400.00, null);

  -- fila 7 · 2026-11-05 · remito 1741
  --   MOCHO 35.8 kg x 10200 + PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-05', '1741', '[{"detalle": "MOCHO", "kilos": 35.8, "precio": 10200.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 8 · 2026-11-06 · remito 3015
  --   PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-06', '3015', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 9 · 2026-11-09 · remito 2704
  --   PATA MUSLO 15 kg x 2900
  perform public.registrar_venta(v_id, '2026-11-09', '2704', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}]'::jsonb);

  -- fila 10 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1567', 350000.00, null);

  -- fila 11 · 2026-11-10 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '', 202000.00, null);

  -- fila 12 · 2026-11-11 · remito 2735
  --   SUPREMA 15 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-11', '2735', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6900.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 147160.00 then
    raise exception 'Cliente 57 (FLACO V CLELIA): el saldo dio %, la planilla dice 147160.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 9 then
    raise exception 'Cliente 57 (FLACO V CLELIA): se cargaron % movimientos y esperaba 9', v_cant;
  end if;
  raise notice 'Cliente 57 (FLACO V CLELIA): ok · 9 movimientos · saldo 147160.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 58 · PABLO NAHIR   (hoja "58 PABLO NAHIR")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 58) then
    raise notice 'Cliente 58 (PABLO NAHIR): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (58, 'PABLO NAHIR', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-29 · remito 5794
  --   PATA MUSLO 15 kg x 3200
  perform public.registrar_venta(v_id, '2026-10-29', '5794', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3200.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 48000.00 then
    raise exception 'Cliente 58 (PABLO NAHIR): el saldo dio %, la planilla dice 48000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 58 (PABLO NAHIR): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 58 (PABLO NAHIR): ok · 1 movimientos · saldo 48000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 59 · MERC. PEREZ   (hoja "59 MERC. PEREZ")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 59) then
    raise notice 'Cliente 59 (MERC. PEREZ): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (59, 'MERC. PEREZ', '', '', '', 'MERCADO PEREZ', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-31 · remito 5652
  --   MOCHO 184.4 kg x 10200
  perform public.registrar_venta(v_id, '2026-10-31', '5652', '[{"detalle": "MOCHO", "kilos": 184.4, "precio": 10200.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1880880.00 then
    raise exception 'Cliente 59 (MERC. PEREZ): el saldo dio %, la planilla dice 1880880.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 59 (MERC. PEREZ): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 59 (MERC. PEREZ): ok · 1 movimientos · saldo 1880880.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 60 · CRISPIN   (hoja "60 CRISPIN")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 60) then
    raise notice 'Cliente 60 (CRISPIN): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (60, 'CRISPIN', '', '', 'STA TERESITA', '', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-31 · remito 5657
  --   POLLO (POR UNIDAD) 3 u x 66000 + BONDIOLA 14.6 kg x 6800
  perform public.registrar_venta(v_id, '2026-10-31', '5657', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 3.0, "precio": 66000.0}, {"detalle": "BONDIOLA", "kilos": 14.6, "precio": 6800.0}]'::jsonb);

  -- fila 6 · 2026-11-10 · remito 2719
  --   BONDIOLA 5.2 kg x 6800 + CARRE 11.9 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-10', '2719', '[{"detalle": "BONDIOLA", "kilos": 5.2, "precio": 6800.0}, {"detalle": "CARRE", "kilos": 11.9, "precio": 6800.0}]'::jsonb);

  -- fila 7 · 2026-11-10 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '', 200000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 213560.00 then
    raise exception 'Cliente 60 (CRISPIN): el saldo dio %, la planilla dice 213560.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 60 (CRISPIN): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 60 (CRISPIN): ok · 3 movimientos · saldo 213560.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 61 · SUP.EL TATA   (hoja "61 SUP.EL TATA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 61) then
    raise notice 'Cliente 61 (SUP.EL TATA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (61, 'SUP.EL TATA', '', '', 'MAR DE AJO', 'SUP. EL TATA', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-31 · remito 5662
  --   PATA MUSLO 45 kg x 2900 + POLLO (POR UNIDAD) 7 u x 63000
  perform public.registrar_venta(v_id, '2026-10-31', '5662', '[{"detalle": "PATA MUSLO", "kilos": 45.0, "precio": 2900.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 7.0, "precio": 63000.0}]'::jsonb);

  -- fila 5 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '2694', 400000.00, null);

  -- fila 9 · 2026-11-04 · remito 3081
  --   PATA MUSLO 75 kg x 2900 + CUADRADA 4.7 kg x 12000 + NALGA 7 kg x 15000 + SUPREMA 11.2 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-04', '3081', '[{"detalle": "PATA MUSLO", "kilos": 75.0, "precio": 2900.0}, {"detalle": "CUADRADA", "kilos": 4.7, "precio": 12000.0}, {"detalle": "NALGA", "kilos": 7.0, "precio": 15000.0}, {"detalle": "SUPREMA", "kilos": 11.2, "precio": 6800.0}]'::jsonb);

  -- fila 12 · 2026-11-07 · remito 3024
  --   POLLO (POR UNIDAD) 8 u x 64000 + PATA MUSLO 15 kg x 2900 + SUPREMA 45 kg x 6600
  perform public.registrar_venta(v_id, '2026-11-07', '3024', '[{"detalle": "POLLO (POR UNIDAD)", "kilos": 8.0, "precio": 64000.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 45.0, "precio": 6600.0}]'::jsonb);

  -- fila 13 · 2026-11-07 · remito 1745
  --   CAPON 80.1 kg x 4300
  perform public.registrar_venta(v_id, '2026-11-07', '1745', '[{"detalle": "CAPON", "kilos": 80.1, "precio": 4300.0}]'::jsonb);

  -- fila 14 · 2026-11-10 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1579', 300000.00, null);

  -- fila 15 · 2026-11-10 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '', 150000.00, null);

  -- fila 16 · 2026-11-11 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1598', 200000.00, null);

  -- fila 17 · 2026-11-11 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '', 250000.00, null);

  -- fila 18 · 2026-11-13 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '1608', 400000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 523490.00 then
    raise exception 'Cliente 61 (SUP.EL TATA): el saldo dio %, la planilla dice 523490.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 10 then
    raise exception 'Cliente 61 (SUP.EL TATA): se cargaron % movimientos y esperaba 10', v_cant;
  end if;
  raise notice 'Cliente 61 (SUP.EL TATA): ok · 10 movimientos · saldo 523490.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 62 · LOS PRIMOS   (hoja "62 LOS PRIMOS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 62) then
    raise notice 'Cliente 62 (LOS PRIMOS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (62, 'LOS PRIMOS', '', '', 'MAR DE AJO', '', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-31 · remito 2673
  --   ESPINAZO 8.9 kg x 1500 + PICADA 7 kg x 11000
  perform public.registrar_venta(v_id, '2026-10-31', '2673', '[{"detalle": "ESPINAZO", "kilos": 8.9, "precio": 1500.0}, {"detalle": "PICADA", "kilos": 7.0, "precio": 11000.0}]'::jsonb);

  -- fila 5 · 2026-11-02 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-02', 'pago', '5979', 90350.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 62 (LOS PRIMOS): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 62 (LOS PRIMOS): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 62 (LOS PRIMOS): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 63 · SABORES DE CAMPO   (hoja "63 SABORES DE CAMPO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 63) then
    raise notice 'Cliente 63 (SABORES DE CAMPO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (63, 'SABORES DE CAMPO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-31 · remito 2684
  --   SUPREMA 30 kg x 6300
  perform public.registrar_venta(v_id, '2026-10-31', '2684', '[{"detalle": "SUPREMA", "kilos": 30.0, "precio": 6300.0}]'::jsonb);

  -- fila 4 · 2026-10-31 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-31', 'pago', '', 189000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 63 (SABORES DE CAMPO): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 63 (SABORES DE CAMPO): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 63 (SABORES DE CAMPO): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 64 · MERC.MODELO MARTIN   (hoja "64 MERC.MODELO MARTIN")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 64) then
    raise notice 'Cliente 64 (MERC.MODELO MARTIN): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (64, 'MERC.MODELO MARTIN', '', '', '', 'MERC. MODELO MARTIN', v_autor)
  returning id into v_id;


  -- fila 5 · 2026-11-03 · remito 5676
  --   BOLA DE LOMO 4.4 kg x 12000 + CUADRADA 4.5 kg x 12000 + PALETA 8.3 kg x 12000
  perform public.registrar_venta(v_id, '2026-11-03', '5676', '[{"detalle": "BOLA DE LOMO", "kilos": 4.4, "precio": 12000.0}, {"detalle": "CUADRADA", "kilos": 4.5, "precio": 12000.0}, {"detalle": "PALETA", "kilos": 8.3, "precio": 12000.0}]'::jsonb);

  -- fila 6 · 2026-11-03 · DESCUENTO (retiro) "LOMO RETIRO 2.67 kg x 21000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-03', 'descuento', '', 56070.00, 'LOMO RETIRO 2.67 kg x 21000');

  -- fila 7 · 2026-11-05 · remito 1731
  --   BONDIOLA 4.7 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-05', '1731', '[{"detalle": "BONDIOLA", "kilos": 4.7, "precio": 7000.0}]'::jsonb);

  -- fila 8 · 2026-11-12 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '8402', 183230.00, null);

  -- fila 15 · 2026-11-12 · remito 1602
  --   PECETO 2.3 kg x 17000 + CUADRIL 14.4 kg x 13500 + BOLA DE LOMO 9.3 kg x 13200 + CUADRADA 8.7 kg x 13200 + PALETA 8.2 kg x 13200 + PATA MUSLO 15 kg x 2900 + POLLO (POR UNIDAD) 1 u x 67000
  perform public.registrar_venta(v_id, '2026-11-12', '1602', '[{"detalle": "PECETO", "kilos": 2.3, "precio": 17000.0}, {"detalle": "CUADRIL", "kilos": 14.4, "precio": 13500.0}, {"detalle": "BOLA DE LOMO", "kilos": 9.3, "precio": 13200.0}, {"detalle": "CUADRADA", "kilos": 8.7, "precio": 13200.0}, {"detalle": "PALETA", "kilos": 8.2, "precio": 13200.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2900.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 1.0, "precio": 67000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 689840.00 then
    raise exception 'Cliente 64 (MERC.MODELO MARTIN): el saldo dio %, la planilla dice 689840.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 5 then
    raise exception 'Cliente 64 (MERC.MODELO MARTIN): se cargaron % movimientos y esperaba 5', v_cant;
  end if;
  raise notice 'Cliente 64 (MERC.MODELO MARTIN): ok · 5 movimientos · saldo 689840.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 65 · EMANUEL FERNANDO   (hoja "65 EMANUEL FERNANDO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 65) then
    raise notice 'Cliente 65 (EMANUEL FERNANDO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (65, 'EMANUEL FERNANDO', '', '', 'MAR DEL TUYU', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-04 · remito 3073
  --   SUPREMA 15 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-04', '3073', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}]'::jsonb);

  -- fila 4 · 2026-11-07 · PAGO "PAGO · TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '', 97500.00, null);

  -- fila 6 · 2026-11-09 · remito 16491
  --   BONDIOLA 22.2 kg x 6800 + SUPREMA 15 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-09', '16491', '[{"detalle": "BONDIOLA", "kilos": 22.2, "precio": 6800.0}, {"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}]'::jsonb);

  -- fila 7 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '', 148460.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 100000.00 then
    raise exception 'Cliente 65 (EMANUEL FERNANDO): el saldo dio %, la planilla dice 100000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 65 (EMANUEL FERNANDO): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 65 (EMANUEL FERNANDO): ok · 4 movimientos · saldo 100000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 66 · A B C   (hoja "66 A B C")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 66) then
    raise notice 'Cliente 66 (A B C): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (66, 'A B C', '', '', 'MAR DEL TUYU', 'ABC', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-11-04 · remito 3076
  --   PICADA 2.9 kg x 11000 + NALGA C/T 6.7 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-04', '3076', '[{"detalle": "PICADA", "kilos": 2.9, "precio": 11000.0}, {"detalle": "NALGA C/T", "kilos": 6.7, "precio": 16900.0}]'::jsonb);

  -- fila 5 · 2026-11-10 · remito 2712
  --   PICADA 8.4 kg x 11000
  perform public.registrar_venta(v_id, '2026-11-10', '2712', '[{"detalle": "PICADA", "kilos": 8.4, "precio": 11000.0}]'::jsonb);

  -- fila 6 · 2026-11-11 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1586', 137700.00, null);

  -- fila 7 · 2026-11-11 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '', 100000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from -170.00 then
    raise exception 'Cliente 66 (A B C): el saldo dio %, la planilla dice -170.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 66 (A B C): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 66 (A B C): ok · 4 movimientos · saldo -170.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 67 · MANAOS   (hoja "67 MANAOS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 67) then
    raise notice 'Cliente 67 (MANAOS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (67, 'MANAOS', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-04 · remito 3080
  --   BONDIOLA 7.5 kg x 7800
  perform public.registrar_venta(v_id, '2026-11-04', '3080', '[{"detalle": "BONDIOLA", "kilos": 7.5, "precio": 7800.0}]'::jsonb);

  -- fila 4 · 2026-11-05 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-05', 'pago', '1515', 58500.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 67 (MANAOS): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 67 (MANAOS): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 67 (MANAOS): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 68 · NICO DE PASCUAL   (hoja "68 NICO DE PASCUAL")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 68) then
    raise notice 'Cliente 68 (NICO DE PASCUAL): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (68, 'NICO DE PASCUAL', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-04 · remito 3082
  --   PATA MUSLO 30 kg x 2850
  perform public.registrar_venta(v_id, '2026-11-04', '3082', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2850.0}]'::jsonb);

  -- fila 4 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '2721', 84000.00, null);

  -- fila 5 · 2026-11-10 · remito s/n
  --   PATA MUSLO 30 kg x 2800
  perform public.registrar_venta(v_id, '2026-11-10', '', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2800.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 85500.00 then
    raise exception 'Cliente 68 (NICO DE PASCUAL): el saldo dio %, la planilla dice 85500.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 68 (NICO DE PASCUAL): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 68 (NICO DE PASCUAL): ok · 3 movimientos · saldo 85500.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 69 · HOTEL 17 NOVIEMBRE   (hoja "69 HOTEL 17 NOVIEMBRE")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 69) then
    raise notice 'Cliente 69 (HOTEL 17 NOVIEMBRE): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (69, 'HOTEL 17 NOVIEMBRE', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-04 · remito 3086
  --   PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-04', '3086', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 4 · 2026-11-04 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '', 45000.00, null);

  -- fila 8 · 2026-11-07 · remito 1520
  --   SUPREMA 15 kg x 6800 + PATA MUSLO 15 kg x 3000 + PICADA 4.6 kg x 12000 + CUADRADA 7.7 kg x 14000
  perform public.registrar_venta(v_id, '2026-11-07', '1520', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6800.0}, {"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}, {"detalle": "PICADA", "kilos": 4.6, "precio": 12000.0}, {"detalle": "CUADRADA", "kilos": 7.7, "precio": 14000.0}]'::jsonb);

  -- fila 9 · 2026-11-07 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '', 310000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 69 (HOTEL 17 NOVIEMBRE): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 69 (HOTEL 17 NOVIEMBRE): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 69 (HOTEL 17 NOVIEMBRE): ok · 4 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 70 · PIZZERIA EL MAQUINA   (hoja "70 PIZZERIA EL MAQUINA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 70) then
    raise notice 'Cliente 70 (PIZZERIA EL MAQUINA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (70, 'PIZZERIA EL MAQUINA', '', 'CALLE 38 N°1321', 'STA TERESITA', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-04 · remito 3087
  --   PATA MUSLO 15 kg x 3300
  perform public.registrar_venta(v_id, '2026-11-04', '3087', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3300.0}]'::jsonb);

  -- fila 5 · 2026-11-05 · remito 1509
  --   TORTUGUITA 4.5 kg x 13500 + CUADRADA 4.1 kg x 14900
  perform public.registrar_venta(v_id, '2026-11-05', '1509', '[{"detalle": "TORTUGUITA", "kilos": 4.5, "precio": 13500.0}, {"detalle": "CUADRADA", "kilos": 4.1, "precio": 14900.0}]'::jsonb);

  -- fila 8 · 2026-11-07 · remito 1525
  --   PICADA 15 kg x 13500 + MATAMBRE 3.7 kg x 16500 + ROAST BEEF 5.6 kg x 13500
  perform public.registrar_venta(v_id, '2026-11-07', '1525', '[{"detalle": "PICADA", "kilos": 15.0, "precio": 13500.0}, {"detalle": "MATAMBRE", "kilos": 3.7, "precio": 16500.0}, {"detalle": "ROAST BEEF", "kilos": 5.6, "precio": 13500.0}]'::jsonb);

  -- fila 9 · 2026-11-08 · PAGO "PAGO (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-08', 'pago', '5600', 30000.00, null);

  -- fila 10 · 2026-11-09 · PAGO "PAGO (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '5691', 30000.00, null);

  -- fila 11 · 2026-11-10 · remito 2718
  --   CARRE 10.4 kg x 8200
  perform public.registrar_venta(v_id, '2026-11-10', '2718', '[{"detalle": "CARRE", "kilos": 10.4, "precio": 8200.0}]'::jsonb);

  -- fila 12 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '', 30000.00, null);

  -- fila 13 · 2026-11-12 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-12', 'pago', '2757', 39000.00, null);

  -- fila 14 · 2026-11-13 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-13', 'pago', '1542', 30000.00, null);

  -- fila 15 · 2026-11-14 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-14', 'pago', '2744', 21000.00, null);

  -- fila 16 · 2026-11-15 · PAGO "PAGO TRANSF KOKI"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '2747', 60000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 355770.00 then
    raise exception 'Cliente 70 (PIZZERIA EL MAQUINA): el saldo dio %, la planilla dice 355770.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 11 then
    raise exception 'Cliente 70 (PIZZERIA EL MAQUINA): se cargaron % movimientos y esperaba 11', v_cant;
  end if;
  raise notice 'Cliente 70 (PIZZERIA EL MAQUINA): ok · 11 movimientos · saldo 355770.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 71 · HUEVO DE ORO STA   (hoja "71HUEVO DE ORO STA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 71) then
    raise notice 'Cliente 71 (HUEVO DE ORO STA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (71, 'HUEVO DE ORO STA', '', 'CALLE 41', 'STA TERESITA', 'HUEVO DE ORO', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-11-04 · remito 3088
  --   BONDIOLA 16.6 kg x 6500 + PATA MUSLO 120 kg x 2800
  perform public.registrar_venta(v_id, '2026-11-04', '3088', '[{"detalle": "BONDIOLA", "kilos": 16.6, "precio": 6500.0}, {"detalle": "PATA MUSLO", "kilos": 120.0, "precio": 2800.0}]'::jsonb);

  -- fila 5 · 2026-11-10 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '2724', 444000.00, null);

  -- fila 8 · 2026-11-10 · remito 2724
  --   SUPREMA 240 kg x 6700 + POLLO (POR UNIDAD) 8 u x 62000 + PATA MUSLO 75 kg x 2800
  perform public.registrar_venta(v_id, '2026-11-10', '2724', '[{"detalle": "SUPREMA", "kilos": 240.0, "precio": 6700.0}, {"detalle": "POLLO (POR UNIDAD)", "kilos": 8.0, "precio": 62000.0}, {"detalle": "PATA MUSLO", "kilos": 75.0, "precio": 2800.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 2313900.00 then
    raise exception 'Cliente 71 (HUEVO DE ORO STA): el saldo dio %, la planilla dice 2313900.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 71 (HUEVO DE ORO STA): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 71 (HUEVO DE ORO STA): ok · 3 movimientos · saldo 2313900.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 72 · C PACCINI LA PAZ   (hoja "72 C PACCINI LA PAZ")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 72) then
    raise notice 'Cliente 72 (C PACCINI LA PAZ): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (72, 'C PACCINI LA PAZ', '', '', '', 'C. PACCINI · MERC.LA PAZ', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-03 · remito 5663
  --   SUPREMA 15 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-03', '5663', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 6500.0}]'::jsonb);

  -- fila 4 · 2026-11-03 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-03', 'pago', '', 97500.00, null);

  -- fila 5 · 2026-11-03 · remito 5677
  --   PALETA 7 kg x 12500
  perform public.registrar_venta(v_id, '2026-11-03', '5677', '[{"detalle": "PALETA", "kilos": 7.0, "precio": 12500.0}]'::jsonb);

  -- fila 6 · 2026-11-09 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-09', 'pago', '1553', 87500.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 72 (C PACCINI LA PAZ): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 72 (C PACCINI LA PAZ): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 72 (C PACCINI LA PAZ): ok · 4 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 73 · MIGUEL 32   (hoja "73 MIGUEL 32")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 73) then
    raise notice 'Cliente 73 (MIGUEL 32): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (73, 'MIGUEL 32', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-05 · remito 5683
  --   ASADO 130.6 kg x 15100
  perform public.registrar_venta(v_id, '2026-11-05', '5683', '[{"detalle": "ASADO", "kilos": 130.6, "precio": 15100.0}]'::jsonb);

  -- fila 4 · 2026-11-10 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-10', 'pago', '1571', 1972060.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 73 (MIGUEL 32): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 73 (MIGUEL 32): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 73 (MIGUEL 32): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 74 · OVIDIO N ATLANTIS   (hoja "74 OVIDIO N ATLANTIS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 74) then
    raise notice 'Cliente 74 (OVIDIO N ATLANTIS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (74, 'OVIDIO N ATLANTIS', '', '', '', 'OVIDIO · N ATLANTIS', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-05 · remito 1730
  --   PATA MUSLO 90 kg x 2850
  perform public.registrar_venta(v_id, '2026-11-05', '1730', '[{"detalle": "PATA MUSLO", "kilos": 90.0, "precio": 2850.0}]'::jsonb);

  -- fila 4 · 2026-11-05 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-05', 'pago', '', 256500.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 74 (OVIDIO N ATLANTIS): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 74 (OVIDIO N ATLANTIS): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 74 (OVIDIO N ATLANTIS): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 75 · 3 SOLES   (hoja "75 3 SOLES")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 75) then
    raise notice 'Cliente 75 (3 SOLES): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (75, '3 SOLES', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-05 · remito 2843
  --   PATA MUSLO 30 kg x 2850
  perform public.registrar_venta(v_id, '2026-11-05', '2843', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2850.0}]'::jsonb);

  -- fila 4 · 2026-11-05 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-05', 'pago', '', 85500.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 75 (3 SOLES): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 75 (3 SOLES): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 75 (3 SOLES): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 76 · HECTOR CACERES   (hoja "76 HECTOR CACERES")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 76) then
    raise notice 'Cliente 76 (HECTOR CACERES): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (76, 'HECTOR CACERES', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 6 · 2026-11-05 · remito 5994
  --   TAPA DE ASADO 68.8 kg x 13500 + PALETA 60 kg x 13500 + CUADRIL 60 kg x 16900 + VACIO 20 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-05', '5994', '[{"detalle": "TAPA DE ASADO", "kilos": 68.8, "precio": 13500.0}, {"detalle": "PALETA", "kilos": 60.0, "precio": 13500.0}, {"detalle": "CUADRIL", "kilos": 60.0, "precio": 16900.0}, {"detalle": "VACIO", "kilos": 20.0, "precio": 16900.0}]'::jsonb);

  -- fila 7 · 2026-11-05 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-05', 'pago', '', 3090800.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 76 (HECTOR CACERES): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 76 (HECTOR CACERES): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 76 (HECTOR CACERES): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 77 · LO DE NICO   (hoja "77 LO DE NICO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 77) then
    raise notice 'Cliente 77 (LO DE NICO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (77, 'LO DE NICO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 5 · 2026-11-07 · remito 1521
  --   PICADA 10.5 kg x 10700 + ROAST BEEF 6 kg x 13000 + CUADRADA 3.3 kg x 12500
  perform public.registrar_venta(v_id, '2026-11-07', '1521', '[{"detalle": "PICADA", "kilos": 10.5, "precio": 10700.0}, {"detalle": "ROAST BEEF", "kilos": 6.0, "precio": 13000.0}, {"detalle": "CUADRADA", "kilos": 3.3, "precio": 12500.0}]'::jsonb);

  -- fila 6 · 2026-11-11 · remito 2732
  --   PICADA 15 kg x 10700
  perform public.registrar_venta(v_id, '2026-11-11', '2732', '[{"detalle": "PICADA", "kilos": 15.0, "precio": 10700.0}]'::jsonb);

  -- fila 7 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1591', 386000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 6100.00 then
    raise exception 'Cliente 77 (LO DE NICO): el saldo dio %, la planilla dice 6100.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 77 (LO DE NICO): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 77 (LO DE NICO): ok · 3 movimientos · saldo 6100.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 78 · PASTA MARISA DE LA R   (hoja "78 PASTA MARISA DE LA R")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 78) then
    raise notice 'Cliente 78 (PASTA MARISA DE LA R): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (78, 'PASTA MARISA DE LA R', '', '', '', 'PASTA MARISA · DE LA REDUCCION', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-07 · remito 1748
  --   BONDIOLA 22.3 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-07', '1748', '[{"detalle": "BONDIOLA", "kilos": 22.3, "precio": 7000.0}]'::jsonb);

  -- fila 4 · 2026-11-07 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-07', 'pago', '3094', 156100.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 78 (PASTA MARISA DE LA R): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 78 (PASTA MARISA DE LA R): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 78 (PASTA MARISA DE LA R): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 79 · LOLO   (hoja "79 LOLO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 79) then
    raise notice 'Cliente 79 (LOLO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (79, 'LOLO', '', '', '', 'ESQ. LA GRAN FLIA', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-07 · remito 1749
  --   SUPREMA 15 kg x 7200
  perform public.registrar_venta(v_id, '2026-11-07', '1749', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 7200.0}]'::jsonb);

  -- fila 4 · 2026-11-11 · PAGO "PAGO TRANSF RENZO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1595', 108000.00, null);

  -- fila 6 · 2026-11-12 · remito 1604
  --   PECETO 8.5 kg x 19500 + MATAMBRE 7.3 kg x 16900
  perform public.registrar_venta(v_id, '2026-11-12', '1604', '[{"detalle": "PECETO", "kilos": 8.5, "precio": 19500.0}, {"detalle": "MATAMBRE", "kilos": 7.3, "precio": 16900.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 289120.00 then
    raise exception 'Cliente 79 (LOLO): el saldo dio %, la planilla dice 289120.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 79 (LOLO): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 79 (LOLO): ok · 3 movimientos · saldo 289120.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 80 · TOP   (hoja "80 TOP")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 80) then
    raise notice 'Cliente 80 (TOP): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (80, 'TOP', '', '', '', 'CATALANO', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-09 · remito 1561
  --   BIFE DE CHORIZO 5.8 kg x 24000
  perform public.registrar_venta(v_id, '2026-11-09', '1561', '[{"detalle": "BIFE DE CHORIZO", "kilos": 5.8, "precio": 24000.0}]'::jsonb);

  -- fila 4 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '5700', 139200.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 80 (TOP): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 80 (TOP): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 80 (TOP): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 81 · LOS HERMANOS   (hoja "81 LOS HERMANOS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 81) then
    raise notice 'Cliente 81 (LOS HERMANOS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (81, 'LOS HERMANOS', '', '', '', 'NEWBERY Y BELGRANO', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-11-09 · remito 3046
  --   CAPON 96 kg x 4300 + BONDIOLA 11.4 kg x 6800
  perform public.registrar_venta(v_id, '2026-11-09', '3046', '[{"detalle": "CAPON", "kilos": 96.0, "precio": 4300.0}, {"detalle": "BONDIOLA", "kilos": 11.4, "precio": 6800.0}]'::jsonb);

  -- fila 5 · 2026-11-11 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-11', 'pago', '1600', 490320.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 81 (LOS HERMANOS): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 81 (LOS HERMANOS): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 81 (LOS HERMANOS): ok · 2 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 82 · MAVERICK   (hoja "82 MAVERICK")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 82) then
    raise notice 'Cliente 82 (MAVERICK): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (82, 'MAVERICK', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-09 · remito 2707
  --   SUPREMA 15 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-09', '2707', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 7000.0}]'::jsonb);

  -- fila 4 · 2026-11-10 · remito 2715
  --   BONDIOLA 21.91 kg x 7000
  perform public.registrar_venta(v_id, '2026-11-10', '2715', '[{"detalle": "BONDIOLA", "kilos": 21.91, "precio": 7000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 258370.00 then
    raise exception 'Cliente 82 (MAVERICK): el saldo dio %, la planilla dice 258370.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 82 (MAVERICK): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 82 (MAVERICK): ok · 2 movimientos · saldo 258370.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 83 · DANELA   (hoja "83 DANELA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 83) then
    raise notice 'Cliente 83 (DANELA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (83, 'DANELA', '', '', '', 'Número suelto en la hoja: 2257412920', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-11-09 · remito 2706
  --   PATA MUSLO 30 kg x 2800 + SUPREMA 30 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-09', '2706', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 2800.0}, {"detalle": "SUPREMA", "kilos": 30.0, "precio": 6900.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 291000.00 then
    raise exception 'Cliente 83 (DANELA): el saldo dio %, la planilla dice 291000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 83 (DANELA): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 83 (DANELA): ok · 1 movimientos · saldo 291000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 84 · VENDETTA   (hoja "84 VENDETTA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 84) then
    raise notice 'Cliente 84 (VENDETTA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (84, 'VENDETTA', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-11-09 · remito 2709
  --   SUPREMA 15 kg x 7200 + PATA MUSLO 30 kg x 6900
  perform public.registrar_venta(v_id, '2026-11-09', '2709', '[{"detalle": "SUPREMA", "kilos": 15.0, "precio": 7200.0}, {"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 6900.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 315000.00 then
    raise exception 'Cliente 84 (VENDETTA): el saldo dio %, la planilla dice 315000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 84 (VENDETTA): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 84 (VENDETTA): ok · 1 movimientos · saldo 315000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 85 · CARN PARAGUAY   (hoja "85 CARN PARAGUAY")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 85) then
    raise notice 'Cliente 85 (CARN PARAGUAY): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (85, 'CARN PARAGUAY', '', 'CALLE 41 N°1366', '', 'CARN. PARAGUAY', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-11-10 · remito 2716
  --   PATA MUSLO 150 kg x 2900 + SUPREMA 60 kg x 6700
  perform public.registrar_venta(v_id, '2026-11-10', '2716', '[{"detalle": "PATA MUSLO", "kilos": 150.0, "precio": 2900.0}, {"detalle": "SUPREMA", "kilos": 60.0, "precio": 6700.0}]'::jsonb);

  -- fila 5 · 2026-10-14 · PAGO "PAGO TRANSF"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-14', 'pago', '1616', 350000.00, null);

  -- fila 6 · 2026-11-15 · remito 2774
  --   PATA MUSLO 15 kg x 2800
  perform public.registrar_venta(v_id, '2026-11-15', '2774', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 2800.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 529000.00 then
    raise exception 'Cliente 85 (CARN PARAGUAY): el saldo dio %, la planilla dice 529000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 85 (CARN PARAGUAY): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 85 (CARN PARAGUAY): ok · 3 movimientos · saldo 529000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 86 · CHICHO   (hoja "86 CHICHO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 86) then
    raise notice 'Cliente 86 (CHICHO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (86, 'CHICHO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-10 · remito 2720
  --   SUPREMA 45 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-10', '2720', '[{"detalle": "SUPREMA", "kilos": 45.0, "precio": 6500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 292500.00 then
    raise exception 'Cliente 86 (CHICHO): el saldo dio %, la planilla dice 292500.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 86 (CHICHO): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 86 (CHICHO): ok · 1 movimientos · saldo 292500.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 87 · SUPER YANG   (hoja "87SUPER YANG")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 87) then
    raise notice 'Cliente 87 (SUPER YANG): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (87, 'SUPER YANG', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-12 · remito 2754
  --   ASADO BIFE 233 kg x 13900
  perform public.registrar_venta(v_id, '2026-11-12', '2754', '[{"detalle": "ASADO BIFE", "kilos": 233.0, "precio": 13900.0}]'::jsonb);

  -- fila 4 · 2026-11-16 · PAGO "PAGO TRANSF (CIA BERNAL)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-16', 'pago', '1636', 3145500.00, null);

  -- fila 5 · 2026-11-16 · DESCUENTO (descuento) "DESCUENTO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-11-16', 'descuento', '', 93200.00, 'DESCUENTO');

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 0.00 then
    raise exception 'Cliente 87 (SUPER YANG): el saldo dio %, la planilla dice 0.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 3 then
    raise exception 'Cliente 87 (SUPER YANG): se cargaron % movimientos y esperaba 3', v_cant;
  end if;
  raise notice 'Cliente 87 (SUPER YANG): ok · 3 movimientos · saldo 0.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 88 · DÑA LUCIA   (hoja "88 DÑA LUCIA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 88) then
    raise notice 'Cliente 88 (DÑA LUCIA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (88, 'DÑA LUCIA', '', '', '', 'DOÑA LUCIA', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-12 · remito 2760
  --   PICADA 4.8 kg x 13500
  perform public.registrar_venta(v_id, '2026-11-12', '2760', '[{"detalle": "PICADA", "kilos": 4.8, "precio": 13500.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 64800.00 then
    raise exception 'Cliente 88 (DÑA LUCIA): el saldo dio %, la planilla dice 64800.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 88 (DÑA LUCIA): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 88 (DÑA LUCIA): ok · 1 movimientos · saldo 64800.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 89 · CORVELA   (hoja "89 CORVELA")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 89) then
    raise notice 'Cliente 89 (CORVELA): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (89, 'CORVELA', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-15 · remito 2771
  --   PATA MUSLO 30 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-15', '2771', '[{"detalle": "PATA MUSLO", "kilos": 30.0, "precio": 3000.0}]'::jsonb);

  -- fila 4 · 2026-11-15 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-15', 'pago', '', 45000.00, null);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 45000.00 then
    raise exception 'Cliente 89 (CORVELA): el saldo dio %, la planilla dice 45000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 2 then
    raise exception 'Cliente 89 (CORVELA): se cargaron % movimientos y esperaba 2', v_cant;
  end if;
  raise notice 'Cliente 89 (CORVELA): ok · 2 movimientos · saldo 45000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 90 · AZOPARDO   (hoja "90 AZOPARDO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 90) then
    raise notice 'Cliente 90 (AZOPARDO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (90, 'AZOPARDO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-11-13 · remito 2740
  --   LOMO 15.5 kg x 24000
  perform public.registrar_venta(v_id, '2026-11-13', '2740', '[{"detalle": "LOMO", "kilos": 15.5, "precio": 24000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 372000.00 then
    raise exception 'Cliente 90 (AZOPARDO): el saldo dio %, la planilla dice 372000.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 90 (AZOPARDO): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 90 (AZOPARDO): ok · 1 movimientos · saldo 372000.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 91 · AMERICO   (hoja "AMERICO")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 91) then
    raise notice 'Cliente 91 (AMERICO): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (91, 'AMERICO', '', '', '', '', v_autor)
  returning id into v_id;


  -- fila 3 · 2026-10-30 · DESCUENTO (otro) "2 CERDOS 171 kg x 4000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-30', 'descuento', '1723', 684000.00, '2 CERDOS 171 kg x 4000');

  -- fila 4 · 2026-10-30 · remito VENTA
  --   BONDIOLA 87.67 kg x 6500
  perform public.registrar_venta(v_id, '2026-10-30', 'VENTA', '[{"detalle": "BONDIOLA", "kilos": 87.67, "precio": 6500.0}]'::jsonb);

  -- fila 5 · 2026-11-03 · remito VENTA
  --   BONDIOLA 24.5 kg x 6500
  perform public.registrar_venta(v_id, '2026-11-03', 'VENTA', '[{"detalle": "BONDIOLA", "kilos": 24.5, "precio": 6500.0}]'::jsonb);

  -- fila 10 · 2026-11-09 · remito 1559
  --   PICADA 51.3 kg x 9000 + CUADRIL 9 kg x 13000 + PALETA 10.3 kg x 12000 + BIFE 52.9 kg x 12000 + CORDERO 46.4 kg x 13000
  perform public.registrar_venta(v_id, '2026-11-09', '1559', '[{"detalle": "PICADA", "kilos": 51.3, "precio": 9000.0}, {"detalle": "CUADRIL", "kilos": 9.0, "precio": 13000.0}, {"detalle": "PALETA", "kilos": 10.3, "precio": 12000.0}, {"detalle": "BIFE", "kilos": 52.9, "precio": 12000.0}, {"detalle": "CORDERO", "kilos": 46.4, "precio": 13000.0}]'::jsonb);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1985405.00 then
    raise exception 'Cliente 91 (AMERICO): el saldo dio %, la planilla dice 1985405.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 4 then
    raise exception 'Cliente 91 (AMERICO): se cargaron % movimientos y esperaba 4', v_cant;
  end if;
  raise notice 'Cliente 91 (AMERICO): ok · 4 movimientos · saldo 1985405.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 92 · DAVID R   (hoja "DAVID R")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 92) then
    raise notice 'Cliente 92 (DAVID R): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (92, 'DAVID R', '', '', '', 'DAVID ROSALES', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: CORDEROS CHURRUPIT 1.6224e+06 + SALDO MELLI 7.72465e+06)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-19', 'saldo_inicial', 9347051.00);

  -- fila 5 · 2026-10-16 · DESCUENTO (otro) "ASADO 24.7 kg x 12900 + MORCILLA 5.7 kg x 4000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-16', 'descuento', '5503', 341430.00, 'ASADO 24.7 kg x 12900 + MORCILLA 5.7 kg x 4000');

  -- fila 6 · 2026-10-16 · DESCUENTO (retiro) "ASADO RETIRO PASSINI 12.3 kg x 14000"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-16', 'descuento', '', 172200.00, 'ASADO RETIRO PASSINI 12.3 kg x 14000');

  -- fila 7 · 2026-10-16 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '', 232315.00, null);

  -- fila 8 · 2026-10-17 · PAGO "PAGO EFVO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-17', 'pago', '5522', 400000.00, null);

  -- fila 9 · 2026-10-17 · CARGO "PRESTAMO" (suma al saldo, no es una venta de productos)
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-17', 'cargo', '', 1200000.00, 'PRESTAMO');

  -- fila 10 · 2026-10-17 · CARGO "FABIAN" (suma al saldo, no es una venta de productos)
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-17', 'cargo', '', 87500.00, 'FABIAN');

  -- fila 11 · 2026-10-19 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '', 1763955.00, null);

  -- fila 13 · 2026-10-19 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-19', 'pago', '5589', 124651.00, null);

  -- fila 14 · 2026-10-19 · DESCUENTO (otro) "1/2 R (CANALE) 83 kg x 10500" · fecha original de la planilla: 2025-10-20
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-19', 'descuento', '5880', 871500.00, '1/2 R (CANALE) 83 kg x 10500');

  -- fila 15 · 2026-10-19 · CARGO "BENITEZ ERROR TRNSF" (suma al saldo, no es una venta de productos) · fecha original de la planilla: 2025-10-20
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-19', 'cargo', '', 145000.00, 'BENITEZ ERROR TRNSF');

  -- fila 16 · 2026-10-26 · DESCUENTO (otro) "1/2 R (CANALE) 91 kg x 9800"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-26', 'descuento', '', 891800.00, '1/2 R (CANALE) 91 kg x 9800');

  -- fila 17 · 2026-10-26 · CARGO "DARIO LEDEZMA" (suma al saldo, no es una venta de productos)
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-26', 'cargo', '', 200000.00, 'DARIO LEDEZMA');

  -- fila 18 · 2026-10-26 · CARGO "DANI PAVON" (suma al saldo, no es una venta de productos)
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-26', 'cargo', '', 140000.00, 'DANI PAVON');

  -- fila 19 · 2026-10-29 · DESCUENTO (retiro) "COMPRA BOLSAS"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, nota) values (v_id, '2026-10-29', 'descuento', '151870', 476370.00, 'COMPRA BOLSAS');

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 5845330.00 then
    raise exception 'Cliente 92 (DAVID R): el saldo dio %, la planilla dice 5845330.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 15 then
    raise exception 'Cliente 92 (DAVID R): se cargaron % movimientos y esperaba 15', v_cant;
  end if;
  raise notice 'Cliente 92 (DAVID R): ok · 15 movimientos · saldo 5845330.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 93 · KOKI   (hoja "KOKI")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 93) then
    raise notice 'Cliente 93 (KOKI): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (93, 'KOKI', '', '', '', '', v_autor)
  returning id into v_id;

  -- Saldo anterior (fila de la hoja: AMS SALDO 1.54225e+06)
  insert into public.movimientos (cliente_id, fecha, tipo, importe) values (v_id, '2026-10-15', 'saldo_inicial', 1542250.00);

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 1542250.00 then
    raise exception 'Cliente 93 (KOKI): el saldo dio %, la planilla dice 1542250.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 1 then
    raise exception 'Cliente 93 (KOKI): se cargaron % movimientos y esperaba 1', v_cant;
  end if;
  raise notice 'Cliente 93 (KOKI): ok · 1 movimientos · saldo 1542250.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- CLIENTE 94 · VARIOS   (hoja "VARIOS")
-- ══════════════════════════════════════════════════════════════════════════
begin;
do $carga$
declare
  v_id    uuid;
  v_saldo numeric;
  v_cant  integer;
  v_autor constant text := 'renzo_rosales@hotmail.es';
begin
  if exists (select 1 from public.clientes where numero = 94) then
    raise notice 'Cliente 94 (VARIOS): ya estaba cargado, se saltea.';
    return;
  end if;

  insert into public.clientes (numero, nombre_fantasia, titular, direccion, localidad, observaciones, creado_por)
  values (94, 'VARIOS', '', '', '', 'CLIENTES VARIOS', v_autor)
  returning id into v_id;


  -- fila 4 · 2026-10-15 · remito 5583
  --   BONDIOLA 11.3 kg x 7500 + SUPREMA 5.1 kg x 6500
  perform public.registrar_venta(v_id, '2026-10-15', '5583', '[{"detalle": "BONDIOLA", "kilos": 11.3, "precio": 7500.0}, {"detalle": "SUPREMA", "kilos": 5.1, "precio": 6500.0}]'::jsonb);

  -- fila 5 · 2026-10-15 · PAGO "PAGO TRANSF (KOKI)"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-15', 'pago', '', 117900.00, null);

  -- fila 6 · 2026-10-16 · remito 5517
  --   BIFE 7 kg x 12500
  perform public.registrar_venta(v_id, '2026-10-16', '5517', '[{"detalle": "BIFE", "kilos": 7.0, "precio": 12500.0}]'::jsonb);

  -- fila 6 · 2026-10-16 · PAGO "pagado en el momento de la venta"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-16', 'pago', '', 87500.00, null);

  -- fila 7 · 2026-10-16 · remito s/n
  --   SIN DETALLE 11.2 kg x 13500
  perform public.registrar_venta(v_id, '2026-10-16', '', '[{"detalle": "SIN DETALLE", "kilos": 11.2, "precio": 13500.0}]'::jsonb);

  -- fila 8 · 2026-10-17 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-17', 'pago', '', 151200.00, null);

  -- fila 10 · 2026-10-18 · remito s/n
  --   BONDIOLA 2.4 kg x 6900
  perform public.registrar_venta(v_id, '2026-10-18', '', '[{"detalle": "BONDIOLA", "kilos": 2.4, "precio": 6900.0}]'::jsonb);

  -- fila 12 · 2026-10-24 · remito 5972
  --   OSOBUCO 1.9 kg x 9000 + PICADA 1.1 kg x 13000
  perform public.registrar_venta(v_id, '2026-10-24', '5972', '[{"detalle": "OSOBUCO", "kilos": 1.9, "precio": 9000.0}, {"detalle": "PICADA", "kilos": 1.1, "precio": 13000.0}]'::jsonb);

  -- fila 13 · 2026-10-25 · remito 5974
  --   PECETO 3.5 kg x 18000
  perform public.registrar_venta(v_id, '2026-10-25', '5974', '[{"detalle": "PECETO", "kilos": 3.5, "precio": 18000.0}]'::jsonb);

  -- fila 16 · 2026-10-29 · remito 5895
  --   LECHON 12.3 kg x 15500 + CHORIZO 4 kg x 7500 + ASADO 24 kg x 14500
  perform public.registrar_venta(v_id, '2026-10-29', '5895', '[{"detalle": "LECHON", "kilos": 12.3, "precio": 15500.0}, {"detalle": "CHORIZO", "kilos": 4.0, "precio": 7500.0}, {"detalle": "ASADO", "kilos": 24.0, "precio": 14500.0}]'::jsonb);

  -- fila 17 · 2026-10-29 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-10-29', 'pago', '', 568650.00, null);

  -- fila 18 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '2698', 63000.00, null);

  -- fila 19 · 2026-11-04 · remito s/n
  --   PATA MUSLO 15 kg x 3000
  perform public.registrar_venta(v_id, '2026-11-04', '', '[{"detalle": "PATA MUSLO", "kilos": 15.0, "precio": 3000.0}]'::jsonb);

  -- fila 20 · 2026-11-04 · PAGO "PAGO"
  insert into public.movimientos (cliente_id, fecha, tipo, comprobante, importe, medio_pago) values (v_id, '2026-11-04', 'pago', '', 45000.00, null);

  -- fila 21 · 2026-11-12 · remito 139
  --   VACIO 13 kg x 16000
  perform public.registrar_venta(v_id, '2026-11-12', '139', '[{"detalle": "VACIO", "kilos": 13.0, "precio": 16000.0}]'::jsonb);

  -- fila 9 · "MATAMBRE": La planilla NO suma esta línea (2 kg de matambre a ROSALES, $ 26.000) al total del remito: el DEBE dice $ 16.560. Se deja afuera para que el saldo coincida con la planilla y con SALDOS; si corresponde cobrarla, se carga a mano.. No se carga.

  -- fila 22 · "PAGO": pago sin importe en la planilla (no suma al saldo). No se carga.

  -- Todo lo de este cliente figura a nombre de quien hace la carga.
  update public.movimientos set creado_por = v_autor where cliente_id = v_id;

  -- Control contra la planilla: saldo final de la hoja y cantidad de movimientos.
  select saldo into v_saldo from public.saldos_clientes where cliente_id = v_id;
  if v_saldo is distinct from 255960.00 then
    raise exception 'Cliente 94 (VARIOS): el saldo dio %, la planilla dice 255960.00', v_saldo;
  end if;
  select count(*) into v_cant from public.movimientos where cliente_id = v_id;
  if v_cant <> 15 then
    raise exception 'Cliente 94 (VARIOS): se cargaron % movimientos y esperaba 15', v_cant;
  end if;
  raise notice 'Cliente 94 (VARIOS): ok · 15 movimientos · saldo 255960.00';
end
$carga$;
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- Rubro de los productos que no están en la lista de precios
-- ══════════════════════════════════════════════════════════════════════════
begin;
update public.productos p
set categoria = r.categoria
from (values
    ('Vacuno', 'ASADO'),
    ('Vacuno', 'BIFE'),
    ('Vacuno', 'PICADA'),
    ('Vacuno', 'LOMO'),
    ('Vacuno', 'NALGA'),
    ('Vacuno', 'DELANTERO'),
    ('Vacuno', 'MEDIA RES'),
    ('Vacuno', 'CHINCHULIN'),
    ('Vacuno', 'RIÑON'),
    ('Vacuno', 'TAPA DE ASADO'),
    ('Vacuno', 'TAPA DE NALGA'),
    ('Vacuno', 'COLITA DE CUADRIL'),
    ('Vacuno', 'BIFE DE CHORIZO'),
    ('Vacuno', 'BOLA DE LOMO'),
    ('Vacuno', 'CUADRADA'),
    ('Vacuno', 'ENTRAÑA'),
    ('Vacuno', 'VACIO'),
    ('Vacuno', 'ROAST BEEF'),
    ('Vacuno', 'PECHO'),
    ('Vacuno', 'MATAMBRE'),
    ('Vacuno', 'PECETO'),
    ('Vacuno', 'CUADRIL'),
    ('Vacuno', 'MOCHO'),
    ('Vacuno', 'PARRILLERO'),
    ('Vacuno', 'RUEDA'),
    ('Vacuno', 'OSOBUCO'),
    ('Vacuno', 'FALDA'),
    ('Vacuno', 'ESPINAZO'),
    ('Vacuno', 'ASADO BIFE'),
    ('Vacuno', 'ASADO C/VACIO'),
    ('Vacuno', 'ASA/MATAMBRE'),
    ('Vacuno', 'ASA/RUEDA'),
    ('Vacuno', 'BIFE S/L'),
    ('Vacuno', 'BOLA DE LOMO/CUADRADA'),
    ('Vacuno', 'BOLA DE LOMO/TAPA'),
    ('Vacuno', 'CUAD/BOLA DE LOMO'),
    ('Vacuno', 'COLITA/PECETO'),
    ('Vacuno', 'PALETA/ROAST BEEF'),
    ('Vacuno', 'PALETA'),
    ('Cerdo', 'MEDIA RES DE CERDO'),
    ('Cerdo', 'CERDO'),
    ('Cerdo', 'CAPON'),
    ('Cerdo', 'PECHITO'),
    ('Cerdo', 'CARRE'),
    ('Cerdo', 'JAMON'),
    ('Cerdo', 'BONDIOLA'),
    ('Cerdo', 'PALETA DE CERDO'),
    ('Cerdo', 'PARRILLERO CERDO'),
    ('Cerdo', 'JAMON Y PALETA'),
    ('Pollo', 'SUPREMA'),
    ('Pollo', 'PATA MUSLO'),
    ('Pollo', 'POLLO'),
    ('Pollo', 'POLLO (POR UNIDAD)'),
    ('Pollo', 'PATA MUSLO (POR UNIDAD)'),
    ('Embutidos y chacinados', 'CHORIZO'),
    ('Embutidos y chacinados', 'MORCILLA'),
    ('Embutidos y chacinados', 'MORCILLA VASCA'),
    ('Embutidos y chacinados', 'SALCHICHA PARRILERA'),
    ('Cordero', 'CORDERO')
) as r (categoria, nombre)
where lower(p.nombre) = lower(r.nombre) and p.categoria = '';
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- renzo_rosales@hotmail.es como administrador
-- Si todavía no se registró en la app, queda invitado como administrador: cuando se registre con ese
-- mismo email entra directo con todos los permisos. Si ya se había registrado, se lo habilita acá.
-- ══════════════════════════════════════════════════════════════════════════
begin;
insert into public.invitaciones (email, rol)
select 'renzo_rosales@hotmail.es', 'admin'
where not exists (select 1 from public.perfiles where lower(email) = 'renzo_rosales@hotmail.es')
on conflict do nothing;
update public.perfiles set rol = 'admin', activo = true where lower(email) = 'renzo_rosales@hotmail.es';
commit;

-- ══════════════════════════════════════════════════════════════════════════
-- Numeración: los clientes se cargaron con su número fijo (1 a 94). Se avanza el contador para que el
-- próximo cliente que se cree desde la app reciba el 95 y no choque con uno existente.
-- ════════════════════════════════════════════════════════════════════════════
select setval(pg_get_serial_sequence('public.clientes', 'numero'), (select max(numero) from public.clientes));

-- ════════════════════════════════════════════════════════════════════════════
-- Resumen final: tienen que ser 94 clientes y un saldo total de 59312648.00.
-- ══════════════════════════════════════════════════════════════════════════
select count(*) as clientes, sum(saldo) as saldo_total from public.saldos_clientes;
-- Para ver cliente por cliente:
-- select numero, nombre_fantasia, saldo from public.saldos_clientes order by numero;
