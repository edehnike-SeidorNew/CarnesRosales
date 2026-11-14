"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Modo = "login" | "signup" | "recover";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/50";

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

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {signup && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-slate-900">
              Nombre y apellido
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
            Email
          </label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        {!recover && (
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
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
              className={inputClass}
            />
            {signup && <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres.</p>}
            {!signup && !mock && (
              <button type="button" onClick={() => cambiarModo("recover")} className="mt-2 text-xs font-semibold text-brand hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="text-sm text-emerald-700">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-hover disabled:opacity-60"
        >
          {textoBoton}
        </button>
      </form>

      {!mock && (
        <p className="mt-3 text-center text-sm text-slate-600">
          {modo === "login" ? "¿Te invitaron?" : "¿Ya tenés cuenta?"}{" "}
          <button type="button" onClick={() => cambiarModo(modo === "login" ? "signup" : "login")} className="font-semibold text-brand hover:underline">
            {modo === "login" ? "Creá tu cuenta" : "Iniciá sesión"}
          </button>
        </p>
      )}
    </div>
  );
}
