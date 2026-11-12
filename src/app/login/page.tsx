"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }
    
    // 👈 ACÁ ESTÁ LA MAGIA: Ahora te manda a tu perfil
    router.push("/perfil");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Iniciar sesión</h1>
        <p className="text-slate-600 mb-8">
          Entrá a tu cuenta para ver y editar tu perfil.
        </p>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>

        <p className="text-sm text-center mt-6">
          <Link href="/recuperar" className="text-sky-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="text-sm text-gray-600 mt-4 text-center">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-sky-600 font-medium hover:underline">
            Registrate
          </Link>
        </p>
      </main>
    </div>
  );
}
