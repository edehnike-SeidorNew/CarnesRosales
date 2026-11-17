-- Carnes Rosales — stock (compras y ajustes), proveedores, lista de precios,
-- registro de quién cargó cada cosa y usuarios con roles.
-- Correr DESPUÉS de 0001_esquema.sql (y ANTES de la carga de clientes, 0005_clientes_y_ventas.sql).
-- SQL Editor > New query > pegar todo > Run. Va en una transacción.

begin;

-- Avisos claros: este script va DESPUÉS de 0001 y se corre una sola vez.
do $$
begin
  if to_regclass('public.productos') is null then
    raise exception 'Falta correr antes 0001_esquema.sql.';
  end if;
  if exists (select 1 from pg_type where typname = 'rol_usuario') then
    raise exception 'Este script ya se corrió (o quedó a medias). Corré primero 0000_limpiar.sql, después 0001 y recién este.';
  end if;
end $$;

-- ===========================================================================
-- USUARIOS Y ROLES
-- ===========================================================================
create type public.rol_usuario as enum ('admin', 'vendedor', 'lectura');

-- Una fila por cuenta. La crea sola la base cuando alguien se registra (trigger de abajo).
create table public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  nombre     text not null default '',
  rol        public.rol_usuario not null default 'lectura',
  -- false = la cuenta existe pero no entra a la app (sin invitación, o desactivada).
  activo     boolean not null default false,
  created_at timestamptz not null default now()
);

-- Invitaciones pendientes: quien se registre con ese email entra con ese rol.
create table public.invitaciones (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (btrim(email) <> ''),
  rol        public.rol_usuario not null,
  created_at timestamptz not null default now()
);

create unique index invitaciones_email_unico on public.invitaciones (lower(email));

-- Rol del usuario que consulta (null si no tiene acceso). "security definer" para poder
-- usarla dentro de las políticas sin que se llamen a sí mismas.
create function public.mi_rol() returns public.rol_usuario
language sql stable security definer set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid() and activo;
$$;

-- Al registrarse una cuenta:
--   * si es la primera de todas, queda como administrador;
--   * si tenía una invitación con ese email, entra con el rol invitado;
--   * si no, queda sin acceso hasta que un administrador la active.
create function public.al_crear_usuario() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_invitacion public.invitaciones;
  v_nombre     text := coalesce(new.raw_user_meta_data ->> 'full_name', '');
begin
  if not exists (select 1 from perfiles) then
    insert into perfiles (id, email, nombre, rol, activo) values (new.id, new.email, v_nombre, 'admin', true);
    return new;
  end if;

  select * into v_invitacion from invitaciones where lower(email) = lower(new.email);
  if found then
    insert into perfiles (id, email, nombre, rol, activo) values (new.id, new.email, v_nombre, v_invitacion.rol, true);
    delete from invitaciones where id = v_invitacion.id;
  else
    insert into perfiles (id, email, nombre, rol, activo) values (new.id, new.email, v_nombre, 'lectura', false);
  end if;
  return new;
end;
$$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.al_crear_usuario();

-- Cuentas que ya existían antes de esta migración (creadas a mano desde el panel): administradores.
insert into public.perfiles (id, email, nombre, rol, activo)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', ''), 'admin', true
from auth.users u
where u.email is not null
on conflict (id) do nothing;

alter table public.perfiles enable row level security;
alter table public.invitaciones enable row level security;

-- Cada uno ve su perfil; los administradores ven todos.
create policy "ver perfiles" on public.perfiles for select to authenticated
  using (id = auth.uid() or public.mi_rol() = 'admin');
-- Sólo un administrador cambia rol o estado, y nunca el suyo (para no quedarse afuera).
create policy "administrar perfiles" on public.perfiles for update to authenticated
  using (public.mi_rol() = 'admin' and id <> auth.uid())
  with check (public.mi_rol() = 'admin' and id <> auth.uid());

create policy "administrar invitaciones" on public.invitaciones for all to authenticated
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

revoke all on public.perfiles, public.invitaciones from anon;
-- Un administrador sólo puede tocar el rol y el estado, no el email ni el id.
revoke insert, update, delete on public.perfiles from authenticated;
grant update (rol, activo) on public.perfiles to authenticated;
revoke all on function public.mi_rol() from public, anon;
grant execute on function public.mi_rol() to authenticated;
revoke all on function public.al_crear_usuario() from public, anon, authenticated;

-- ===========================================================================
-- STOCK
-- El stock nunca se guarda: es compras + ajustes - kilos vendidos, por producto.
-- Arranca en cero: un producto empieza a llevar stock el día de su primera carga (compra o
-- ajuste) y sólo descuentan las ventas de ese día en adelante.
-- ===========================================================================
create type public.tipo_stock as enum ('compra', 'ajuste');

-- Proveedores: a quién se le compra la mercadería.
create table public.proveedores (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (btrim(nombre) <> ''),
  contacto   text not null default '',
  created_at timestamptz not null default now()
);

create unique index proveedores_nombre_unico on public.proveedores (lower(nombre));

create table public.stock_movimientos (
  id          uuid primary key default gen_random_uuid(),
  orden       bigint generated always as identity unique,
  fecha       date not null,
  tipo        public.tipo_stock not null,
  producto_id uuid not null references public.productos (id) on delete restrict,
  -- Compra: kilos que entran (> 0). Ajuste: diferencia contra el conteo real (+ o -).
  kilos       numeric(10, 3) not null,
  -- Costo por kilo, sólo en compras (puede quedar vacío).
  costo       numeric(12, 2),
  -- Sólo en compras (puede quedar vacío).
  proveedor_id uuid references public.proveedores (id) on delete restrict,
  comprobante text not null default '',
  nota        text not null default '',
  created_at  timestamptz not null default now(),

  constraint stock_kilos_segun_tipo check (
    (tipo = 'compra' and kilos > 0 and (costo is null or costo >= 0))
    or (tipo = 'ajuste' and kilos <> 0 and costo is null and proveedor_id is null)
  )
);

create index stock_por_proveedor on public.stock_movimientos (proveedor_id);

-- Pagos hechos a proveedores (cuentas a pagar).
create table public.pagos_proveedores (
  id           uuid primary key default gen_random_uuid(),
  orden        bigint generated always as identity unique,
  proveedor_id uuid not null references public.proveedores (id) on delete restrict,
  fecha        date not null,
  importe      numeric(14, 2) not null check (importe > 0),
  medio_pago   public.medio_pago,
  comprobante  text not null default '',
  created_at   timestamptz not null default now()
);

create index pagos_proveedores_por_proveedor on public.pagos_proveedores (proveedor_id, fecha, orden);

-- Lo que se le debe a cada proveedor: compras con costo cargado menos pagos.
create view public.saldos_proveedores with (security_invoker = true) as
select
  p.id as proveedor_id,
  p.nombre,
  coalesce(c.comprado, 0)::numeric(14, 2) as comprado,
  coalesce(g.pagado, 0)::numeric(14, 2) as pagado,
  (coalesce(c.comprado, 0) - coalesce(g.pagado, 0))::numeric(14, 2) as saldo
from public.proveedores p
left join (
  select proveedor_id, sum(round(kilos * costo, 2)) as comprado
  from public.stock_movimientos where tipo = 'compra' and costo is not null group by proveedor_id
) c on c.proveedor_id = p.id
left join (
  select proveedor_id, sum(importe) as pagado from public.pagos_proveedores group by proveedor_id
) g on g.proveedor_id = p.id;

create index stock_por_producto on public.stock_movimientos (producto_id, fecha, orden);

-- Stock actual de cada producto.
create view public.stock_productos with (security_invoker = true) as
select
  p.id as producto_id,
  p.nombre,
  coalesce(e.comprado, 0)::numeric(12, 3) as comprado,
  coalesce(e.ajustes, 0)::numeric(12, 3) as ajustes,
  coalesce(v.vendido, 0)::numeric(12, 3) as vendido,
  (coalesce(e.comprado, 0) + coalesce(e.ajustes, 0) - coalesce(v.vendido, 0))::numeric(12, 3) as stock
from public.productos p
left join (
  select producto_id,
         sum(kilos) filter (where tipo = 'compra') as comprado,
         sum(kilos) filter (where tipo = 'ajuste') as ajustes
  from public.stock_movimientos group by producto_id
) e on e.producto_id = p.id
left join (
  -- Sólo las ventas desde la primera carga de stock de ese producto.
  select i.producto_id, sum(i.kilos) as vendido
  from public.movimiento_items i
  join public.movimientos m on m.id = i.movimiento_id
  join (
    select producto_id, min(fecha) as desde from public.stock_movimientos group by producto_id
  ) c on c.producto_id = i.producto_id
  where m.fecha >= c.desde
  group by i.producto_id
) v on v.producto_id = p.id;

-- Busca un producto por nombre (sin distinguir mayúsculas) o lo crea.
create function public.producto_por_nombre(p_nombre text) returns uuid
language plpgsql set search_path = public
as $$
declare
  v_nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_id     uuid;
begin
  if v_nombre = '' then
    raise exception 'Falta el nombre del producto';
  end if;
  select id into v_id from productos where lower(nombre) = lower(v_nombre);
  if v_id is null then
    insert into productos (nombre) values (v_nombre) returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Busca un proveedor por nombre o lo crea. Devuelve null si el nombre viene vacío.
create function public.proveedor_por_nombre(p_nombre text) returns uuid
language plpgsql set search_path = public
as $$
declare
  v_nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_id     uuid;
begin
  if v_nombre = '' then
    return null;
  end if;
  select id into v_id from proveedores where lower(nombre) = lower(v_nombre);
  if v_id is null then
    insert into proveedores (nombre) values (v_nombre) returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Compra completa (uno o más productos) en una sola operación.
-- p_items: [{"producto": "Picada", "kilos": 50, "costo": 9500}, ...]  (costo puede faltar)
create function public.registrar_compra(
  p_fecha       date,
  p_proveedor   text,
  p_comprobante text,
  p_items       jsonb
) returns void
language plpgsql set search_path = public
as $$
declare
  v_item      jsonb;
  v_proveedor uuid := proveedor_por_nombre(p_proveedor);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra necesita al menos un producto';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into stock_movimientos (fecha, tipo, producto_id, kilos, costo, proveedor_id, comprobante)
    values (
      p_fecha, 'compra', producto_por_nombre(v_item ->> 'producto'),
      (v_item ->> 'kilos')::numeric, nullif(v_item ->> 'costo', '')::numeric,
      v_proveedor, coalesce(btrim(p_comprobante), '')
    );
  end loop;
end;
$$;

-- Corrige una venta ya cargada: cambia fecha y comprobante y reemplaza sus productos, todo junto.
create function public.actualizar_venta(
  p_movimiento_id uuid,
  p_fecha         date,
  p_comprobante   text,
  p_items         jsonb
) returns void
-- "security definer": reemplazar los productos implica borrar los anteriores, y el borrado directo
-- es sólo para administradores. Por eso el permiso se controla acá adentro.
language plpgsql security definer set search_path = public
as $$
declare
  v_item     jsonb;
  v_posicion smallint := 0;
begin
  if coalesce(mi_rol() not in ('admin', 'vendedor'), true) then
    raise exception 'Tu rol no permite corregir ventas';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta necesita al menos un producto';
  end if;

  update movimientos set fecha = p_fecha, comprobante = coalesce(btrim(p_comprobante), '')
  where id = p_movimiento_id and tipo = 'venta';
  if not found then
    raise exception 'No se encontró la venta';
  end if;

  delete from movimiento_items where movimiento_id = p_movimiento_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_posicion := v_posicion + 1;
    insert into movimiento_items (movimiento_id, orden, producto_id, kilos, precio)
    values (p_movimiento_id, v_posicion, producto_por_nombre(v_item ->> 'detalle'),
            (v_item ->> 'kilos')::numeric, (v_item ->> 'precio')::numeric);
  end loop;
end;
$$;

-- ===========================================================================
-- LISTA DE PRECIOS y QUIÉN CARGÓ CADA COSA
-- ===========================================================================
-- Precio de venta por kilo de cada corte (para completar el precio solo al vender). Puede quedar vacío.
alter table public.productos add column precio numeric(12, 2) check (precio is null or precio > 0);

-- Rubro del producto (Vacuno, Cerdo, Pollo, Embutidos y chacinados), para agruparlos en el Inicio.
alter table public.productos add column categoria text not null default '';

-- Email del usuario que cargó la fila. Lo completa la base; lo cargado desde el SQL Editor queda vacío.
alter table public.clientes          add column creado_por text not null default coalesce(auth.jwt() ->> 'email', '');
alter table public.movimientos       add column creado_por text not null default coalesce(auth.jwt() ->> 'email', '');
alter table public.stock_movimientos add column creado_por text not null default coalesce(auth.jwt() ->> 'email', '');
alter table public.pagos_proveedores add column creado_por text not null default coalesce(auth.jwt() ->> 'email', '');

alter table public.stock_movimientos enable row level security;
alter table public.proveedores enable row level security;
alter table public.pagos_proveedores enable row level security;
revoke all on public.stock_movimientos, public.proveedores, public.pagos_proveedores from anon;
revoke all on public.stock_productos, public.saldos_proveedores from anon;
revoke all on function public.producto_por_nombre(text) from public, anon;
revoke all on function public.proveedor_por_nombre(text) from public, anon;
revoke all on function public.registrar_compra(date, text, text, jsonb) from public, anon;
revoke all on function public.actualizar_venta(uuid, date, text, jsonb) from public, anon;
grant execute on function public.producto_por_nombre(text) to authenticated;
grant execute on function public.proveedor_por_nombre(text) to authenticated;
grant execute on function public.registrar_compra(date, text, text, jsonb) to authenticated;
grant execute on function public.actualizar_venta(uuid, date, text, jsonb) to authenticated;

-- ===========================================================================
-- PERMISOS POR ROL (reemplazan la regla "cualquier usuario con sesión" de 0001)
--   admin:    ve, carga y borra todo; administra usuarios.
--   vendedor: ve, carga y corrige (clientes, ventas, pagos, compras, ajustes). No borra.
--   lectura:  sólo ve.
-- ===========================================================================
drop policy "usuarios con sesion" on public.clientes;
drop policy "usuarios con sesion" on public.productos;
drop policy "usuarios con sesion" on public.movimientos;
drop policy "usuarios con sesion" on public.movimiento_items;

do $$
declare
  t text;
begin
  foreach t in array array['clientes', 'productos', 'movimientos', 'movimiento_items', 'stock_movimientos', 'proveedores', 'pagos_proveedores'] loop
    execute format('create policy "ver" on public.%I for select to authenticated using (public.mi_rol() is not null)', t);
    execute format('create policy "cargar" on public.%I for insert to authenticated with check (public.mi_rol() in (''admin'', ''vendedor''))', t);
    execute format('create policy "modificar" on public.%I for update to authenticated using (public.mi_rol() in (''admin'', ''vendedor'')) with check (public.mi_rol() in (''admin'', ''vendedor''))', t);
    execute format('create policy "borrar" on public.%I for delete to authenticated using (public.mi_rol() = ''admin'')', t);
  end loop;
end $$;

-- Sólo el administrador cambia el rubro y el precio de los productos (vendedor y lectura los usan, pero no los editan).
drop policy "modificar" on public.productos;
create policy "modificar" on public.productos for update to authenticated
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

commit;
