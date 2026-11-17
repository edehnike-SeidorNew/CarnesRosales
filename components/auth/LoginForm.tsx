"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Modo = "login" | "signup" | "recover";

// Ingreso oscuro: las etiquetas van en claro y los campos son blancos con el texto en negro (se lee bien).
const etiqueta = "block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70";
const campo =
  "login-campo mt-1.5 w-full rounded-md border border-white/20 bg-white px-3 py-2.5 text-[15px] text-slate-900 shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50";

export function LoginForm({ mock, initialError = null }: { mock: boolean; initialError?: string | null }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signup = modo === "signup";
  const recover = modo === "recover";

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const endpoint = recover ? "/api/auth/recover" : mock ? "/api/auth/mock-login" : signup ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recover ? { email } : { email, password, fullName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar la operación");
        return;
      }

      if (recover) {
        setInfo("Si ese email tiene una cuenta, te enviamos un enlace para elegir una nueva contraseña. Revisá también el correo no deseado.");
        return;
      }
      if (signup && data.needsConfirmation) {
        setInfo("Te enviamos un email para confirmar tu cuenta. Confirmala y después iniciá sesión.");
        setModo("login");
        setPassword("");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const textoBoton = recover
    ? loading
      ? "Enviando..."
      : "Enviar enlace"
    : signup
      ? loading
        ? "Creando cuenta..."
        : "Crear cuenta"
      : loading
        ? "Ingresando..."
        : "Iniciar sesión";

  const pestana = (activa: boolean) =>
    `relative pb-2 text-[19px] transition-colors ${
      activa
        ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded after:bg-brand-accent after:shadow-[0_0_12px_rgba(170,180,247,0.6)]"
        : "text-white/55 hover:text-white"
    }`;

  return (
    <div>
      {/* Pestañas (en modo demo sólo hay ingreso) */}
      {recover ? (
        <p className="mb-6 text-center text-[19px] text-white">Recuperar contraseña</p>
      ) : (
        <div className="mb-6 flex justify-center gap-6">
          <button type="button" onClick={() => cambiarModo("login")} className={pestana(modo === "login")} aria-current={modo === "login" ? "page" : undefined}>
            Iniciar sesión
          </button>
          {!mock && (
            <button type="button" onClick={() => cambiarModo("signup")} className={pestana(signup)} aria-current={signup ? "page" : undefined}>
              Crear cuenta
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {signup && (
          <div>
            <label htmlFor="fullName" className={etiqueta}>
              Nombre y apellido
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={campo}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className={etiqueta}>
            Email
          </label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
        </div>
        {!recover && (
          <div>
            <label htmlFor="password" className={etiqueta}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={signup ? 8 : undefined}
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={campo}
            />
            {signup && <p className="mt-1 text-xs text-white/50">Mínimo 8 caracteres.</p>}
            {!signup && !mock && (
              <button type="button" onClick={() => cambiarModo("recover")} className="mt-2 block w-full text-right text-xs text-white/60 hover:text-white">
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="text-sm text-emerald-400">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border border-white/75 bg-transparent px-4 py-3 text-xs uppercase tracking-[0.3em] text-white transition-colors hover:border-brand-hover hover:bg-brand-hover disabled:opacity-60"
        >
          {textoBoton}
        </button>
      </form>

      {recover && (
        <p className="mt-4 text-center text-sm text-white/60">
          ¿Ya tenés cuenta?{" "}
          <button type="button" onClick={() => cambiarModo("login")} className="font-semibold text-white hover:underline">
            Iniciá sesión
          </button>
        </p>
      )}
    </div>
  );
}
