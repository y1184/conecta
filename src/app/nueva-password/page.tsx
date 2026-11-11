"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function NuevaPassword() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [tieneSession, setTieneSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setTieneSession(true);
      }
    };

    verificar();
  }, []);

  const handleCambiar = async () => {
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setExito(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 2500);
  };

  if (!tieneSession) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-2xl font-bold text-sky-600">
              Conecta
            </Link>
          </div>
        </header>
        <main className="max-w-md mx-auto px-6 py-12 text-center">
          <p className="text-gray-600 mb-4">
            Este link no es válido o ya expiró.
          </p>
          <Link
            href="/recuperar"
            className="text-sky-600 hover:underline"
          >
            Pedir un link nuevo
          </Link>
        </main>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold mb-2">Nueva contraseña</h1>
        <p className="text-gray-600 mb-8">
          Elegí una contraseña nueva para tu cuenta.
        </p>

        {exito ? (
          <div className="border border-green-200 bg-green-50 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-medium mb-2">
              ✅ ¡Contraseña actualizada!
            </p>
            <p className="text-sm text-green-600">
              Redirigiendo al login...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repetí la contraseña"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleCambiar}
              disabled={loading}
              className="w-full bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Cambiar contraseña"}
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
