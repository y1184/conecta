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
        redirectTo: "http://localhost:3000/nueva-password",
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
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Recuperar contraseña</h1>
        <p className="text-gray-600 mb-8">
          Escribí tu email y te mandamos un link para crear una nueva.
        </p>

        {enviado ? (
          <div className="border border-green-200 bg-green-50 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-medium mb-2">
              ✅ Revisá tu email
            </p>
            <p className="text-sm text-green-600">
              Te mandamos un link a <strong>{email}</strong> para que cambies
              tu contraseña.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Si no te llega en unos minutos, revisá la carpeta de spam.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleRecuperar}
              disabled={loading}
              className="w-full bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>
          </div>
        )}

        <p className="text-sm text-gray-600 mt-6 text-center">
          <Link href="/login" className="text-sky-600 hover:underline">
            ← Volver al login
          </Link>
        </p>
      </main>
    </div>
  );
}
