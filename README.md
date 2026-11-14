# Carnes Rosales — Cuentas corrientes

Clientes, ventas (remitos), pagos, stock, proveedores y usuarios con roles. Next.js + Supabase.

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
   2. `supabase/seed/0002_datos_planilla.sql` — datos de la planilla. Termina con un control contra
      los totales de la planilla: si un número no coincide, no carga nada. Sólo corre con la base vacía.
   3. `supabase/migrations/0003_stock_usuarios_roles.sql` — stock, proveedores, lista de precios,
      quién cargó cada cosa y usuarios con roles.
   4. `supabase/seed/0004_cortes.sql` — catálogo de cortes (opcional). **Revisar la lista antes de
      correrlo:** no sale de la planilla.
3. **Variables de entorno:** copiar `.env.local.example` como `.env.local` y completar
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (*Project Settings > API*; la clave es
   la "anon" / "publishable", nunca la "service_role" / "secret"). Reiniciar `npm run dev`.
4. **Crear tu usuario (queda como administrador):** entrar a la app, tocar *"Creá tu cuenta"* y
   registrarte. **La primera cuenta que se registra es el administrador**, así que hacelo apenas
   termines el paso 2. (Si ya habías creado usuarios desde el panel de Supabase antes de correr el
   0003, esos quedan como administradores.)
5. **Links de los mails:** en *Authentication > URL Configuration* poner en *Site URL* la dirección
   de la app y agregarla en *Redirect URLs* (por ejemplo `https://tu-app.vercel.app/**` y
   `http://localhost:3000/**`). Sin esto no funcionan confirmar el email ni recuperar la contraseña.
6. **Vercel:** cargar las dos variables del paso 3 (y `NEXT_PUBLIC_SITE_URL` con la dirección de la
   app) en *Settings > Environment Variables* y volver a desplegar. Sin ellas el deploy corta con un
   error a propósito: no se abre sin login.

## Usuarios y roles

- **Administrador:** hace todo, incluido borrar y administrar usuarios.
- **Vendedor:** carga y corrige clientes, ventas, pagos, compras y stock. No borra.
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
