# Carnes Rosales — Cuentas corrientes

Clientes, ventas (remitos), pagos y usuarios con roles. Next.js + Supabase.

Esta rama (`main`) es la **primera etapa**. Stock y Proveedores están en la rama `etapa-2`; Avisos,
Empleados y Gastos, en `etapa-3`. La base ya queda preparada para la segunda etapa (las tablas de
stock y proveedores se crean con `0003`), así que sumarla después no requiere tocar la base.

## Correr en local

```bash
npm install
npm run dev
```

Sin `.env.local` la app corre en **modo demo**: el login acepta cualquier email y los datos son de
ejemplo, en memoria (se pierden al reiniciar).

## Conectar Supabase

1. **Crear el proyecto** en [supabase.com](https://supabase.com) (región São Paulo queda cerca).
2. **Correr los SQL, en este orden**, cada uno en *SQL Editor > New query > pegar todo > Run*:
   1. `supabase/migrations/0001_esquema.sql` — clientes, productos, movimientos.
   2. `supabase/migrations/0003_stock_usuarios_roles.sql` — stock, proveedores, lista de precios,
      quién cargó cada cosa y usuarios con roles.
   3. `supabase/seed/0004_cortes.sql` — catálogo de productos con rubro y precio, tomado de la hoja
      LISTA DE PRECIOS de la planilla.
   4. `supabase/seed/0005_clientes_y_ventas.sql` — los 94 clientes de la planilla (una hoja cada
      uno: las numeradas 1 a 90, más AMERICO, DAVID R, KOKI y VARIOS), cada uno con su saldo anterior, sus ventas y sus pagos, **a nombre de
      `renzo_rosales@hotmail.es`** (columna *Cargó*). Carga un cliente por vez y después de cada uno
      verifica que el saldo dé exactamente el de su hoja; si no da, frena y avisa cuál. Se puede
      volver a correr: los que ya están cargados se saltean. Los descuentos, retiros y comida de la
      planilla van como "descuento" (restan del saldo pero no cuentan como cobrado). Deja a Renzo como administrador (ver
      paso 4). Los 94 saldos coinciden con la hoja SALDOS (total $ 59.312.648).
3. **Variables de entorno:** copiar `.env.local.example` como `.env.local` y completar
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (*Project Settings > API*; la clave es
   la "anon" / "publishable", nunca la "service_role" / "secret"). Reiniciar `npm run dev`.
4. **Crear el usuario administrador:** entrar a la app, tocar *"Creá tu cuenta"* y registrarse.
   **La primera cuenta que se registra es el administrador.** El `0005` ya deja invitado como
   administrador a `renzo_rosales@hotmail.es`: si se registra con ese email, entra con todos los
   permisos aunque ya exista otra cuenta. (Si ya había usuarios creados desde el panel de Supabase
   antes de correr el 0003, esos quedan como administradores.)
5. **Links de los mails:** en *Authentication > URL Configuration* poner en *Site URL* la dirección
   de la app y agregarla en *Redirect URLs* (por ejemplo `https://tu-app.vercel.app/**` y
   `http://localhost:3000/**`). Sin esto no funcionan confirmar el email ni recuperar la contraseña.
6. **Vercel:** cargar las dos variables del paso 3 (y `NEXT_PUBLIC_SITE_URL` con la dirección de la
   app) en *Settings > Environment Variables* y volver a desplegar. Sin ellas el deploy corta con un
   error a propósito: no se abre sin login.

## Usuarios y roles

- **Administrador:** hace todo, incluido borrar y administrar usuarios, y es el único que cambia el rubro y el
  precio de lista de los productos (menú *Productos*).
- **Vendedor:** carga y corrige clientes, ventas, pagos, compras y stock. No borra. Ve la lista de precios pero no la edita.
- **Solo lectura:** consulta.

Para sumar a alguien: *Usuarios > Invitar usuario* (email y rol) y avisarle que se registre con ese
mismo email desde *"Creá tu cuenta"*. La invitación no manda un mail. Quien se registra sin
invitación queda **sin acceso** hasta que un administrador lo active desde *Usuarios*.

Las mismas reglas están en la base (RLS), no sólo en las pantallas.

## Cómo está armado

- `supabase/`: esquema, carga inicial y permisos. El saldo y el stock nunca se guardan: se calculan.
  - Saldo del cliente = saldo anterior + ventas − pagos.
  - Stock de un corte = compras + ajustes por conteo − kilos vendidos.
  - Deuda con un proveedor = compras con costo cargado − pagos al proveedor.
- `lib/repo/`: acceso a los datos. `supabase.ts` es el real; `memoria.ts` es el modo demo.
- `app/acciones.ts`: altas, correcciones y bajas, con control de rol.
- `proxy.ts` + `lib/auth/`: sesión, roles y protección de todas las páginas.
- `lib/pdf/resumenCuenta.tsx`: resumen de cuenta en PDF para enviarle al cliente.
- `lib/pdf/remito.tsx` + `components/remitos/`: remitos (cada venta) con vista previa, impresión y PDF. Los datos de la empresa
  que salen en el encabezado están en `lib/empresa.ts`: lo que está vacío no se imprime.
