"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";

export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const handleRecuperar = async () => {
    setLoading(true);
    setError("");
    setEnviado(false);

    if (!email.trim()) {
      setError("Escribí tu email");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        // 👈 CAMBIO CLAVE: Ahora apunta al callback intermedio
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setEnviado(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Recuperar contraseña</h1>
        <p className="text-slate-600 mb-8">
          Escribí tu email y te mandamos un link para crear una nueva.
        </p>

        {enviado ? (
          <div className="border border-green-200 bg-green-50 rounded-3xl p-6 text-center shadow-sm">
            <p className="text-green-700 font-bold mb-2 text-lg">
              ✅ Revisá tu email
            </p>
            <p className="text-sm text-green-600">
              Te mandamos un link a <strong>{email}</strong> para que cambies
              tu contraseña.
            </p>
            <p className="text-xs text-green-700/70 mt-4">
              Si no te llega en unos minutos, revisá la carpeta de spam.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

            <button
              onClick={handleRecuperar}
              disabled={loading}
              className="w-full bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>
          </div>
        )}

        <p className="text-sm text-slate-600 mt-6 text-center">
          <Link href="/login" className="text-sky-600 hover:underline font-medium">
            ← Volver al login
          </Link>
        </p>
      </main>
    </div>
  );
}
