# Carnes Rosales — Cuentas corrientes

Clientes, ventas (remitos), pagos y saldo de cada cliente. Next.js + Supabase.

## Correr en local

```bash
npm install
npm run dev
```

Sin `.env.local` la app corre en **modo demo**: el login acepta cualquier email y los datos son de
ejemplo, en memoria (se pierden al reiniciar).

## Conectar Supabase

1. **Crear el proyecto** en [supabase.com](https://supabase.com) (región São Paulo queda cerca).
2. **Crear las tablas:** en el proyecto, *SQL Editor > New query*, pegar entero
   `supabase/migrations/0001_esquema.sql` y darle *Run*.
3. **Cargar los datos de la planilla:** otra query nueva con `supabase/seed/0002_datos_planilla.sql`
   y *Run*. Termina con un control contra los totales de la planilla: si un número no coincide, no
   carga nada. Sólo corre con la base vacía (no duplica si se ejecuta dos veces).
4. **Crear el usuario para entrar:** *Authentication > Users > Add user > Create new user*, con email,
   contraseña y *Auto Confirm User* tildado. No hay registro público: los usuarios se crean acá.
5. **Desactivar el registro público:** *Authentication > Sign In / Providers* y apagar
   *Allow new users to sign up*. Así nadie puede crearse una cuenta por su cuenta.
6. **Variables de entorno:** copiar `.env.local.example` como `.env.local` y completar
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (*Project Settings > API*; la clave es
   la "anon" / "publishable", nunca la "service_role" / "secret"). Reiniciar `npm run dev`.
7. **Vercel:** cargar las mismas dos variables en *Settings > Environment Variables* y volver a
   desplegar. Sin ellas el deploy corta con un error (a propósito: no se abre sin login).

## Cómo está armado

- `supabase/migrations/0001_esquema.sql`: tablas `clientes`, `productos`, `movimientos` y
  `movimiento_items`, las vistas `movimientos_importes` y `saldos_clientes`, la función
  `registrar_venta` y la seguridad (RLS: sólo usuarios con sesión).
- `lib/repo/`: acceso a los datos. `supabase.ts` es el real; `memoria.ts` es el modo demo.
- `app/acciones.ts`: altas y bajas (cliente, venta, pago, eliminar movimiento).
- `proxy.ts` + `lib/auth/session.ts`: exigen sesión en todas las páginas.
- El saldo nunca se guarda: siempre se calcula sumando los movimientos.
