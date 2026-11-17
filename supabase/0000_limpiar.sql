-- Carnes Rosales — LIMPIAR lo que dejaron scripts anteriores (si alguno falló a mitad de camino).
-- Se corre ANTES de 0001, y sólo hace falta si un script dio error o se corrió dos veces.
--
-- Borra ÚNICAMENTE las tablas, vistas, funciones y tipos que crean los scripts de Carnes Rosales
-- (0001, 0003, 0004 y 0005). No toca las cuentas de usuario (Authentication) ni nada de otra aplicación.
--
-- FRENO: si ya hay clientes o movimientos cargados, NO borra nada y avisa.
-- Después de limpiar, se corren de nuevo, en orden y una sola vez cada uno: 0001, 0003, 0004 y 0005.

do $$
begin
  if to_regclass('public.movimientos') is not null and exists (select 1 from public.movimientos) then
    raise exception 'Ya hay movimientos cargados: no se borra nada. Consultá antes de seguir.';
  end if;
  if to_regclass('public.clientes') is not null and exists (select 1 from public.clientes) then
    raise exception 'Ya hay clientes cargados: no se borra nada. Consultá antes de seguir.';
  end if;
end $$;

drop trigger if exists al_crear_usuario on auth.users;

drop view if exists public.saldos_proveedores cascade;
drop view if exists public.stock_productos cascade;
drop view if exists public.saldos_clientes cascade;
drop view if exists public.movimientos_importes cascade;

drop table if exists public.pagos_proveedores cascade;
drop table if exists public.stock_movimientos cascade;
drop table if exists public.movimiento_items cascade;
drop table if exists public.movimientos cascade;
drop table if exists public.proveedores cascade;
drop table if exists public.productos cascade;
drop table if exists public.clientes cascade;
drop table if exists public.invitaciones cascade;
drop table if exists public.perfiles cascade;

drop function if exists public.registrar_venta(uuid, date, text, jsonb) cascade;
drop function if exists public.registrar_compra(date, text, text, jsonb) cascade;
drop function if exists public.actualizar_venta(uuid, date, text, jsonb) cascade;
drop function if exists public.producto_por_nombre(text) cascade;
drop function if exists public.proveedor_por_nombre(text) cascade;
drop function if exists public.al_crear_usuario() cascade;
drop function if exists public.mi_rol() cascade;

drop type if exists public.tipo_movimiento cascade;
drop type if exists public.medio_pago cascade;
drop type if exists public.tipo_stock cascade;
drop type if exists public.rol_usuario cascade;
