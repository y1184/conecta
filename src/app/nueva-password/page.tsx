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
  
  // Estados para manejar la carga y la sesión
  const [tieneSession, setTieneSession] = useState(false);
  const [verificando, setVerificando] = useState(true); // 👈 NUEVO: para no mostrar error antes de tiempo
  const router = useRouter();

  useEffect(() => {
    // 1. Escuchamos el evento mágico de Supabase para recuperar contraseña
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setTieneSession(true);
        setVerificando(false);
      }
    });

    // 2. Verificamos si ya había una sesión iniciada
    const verificar = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setTieneSession(true);
      }
      // Le damos un segundito de margen a Supabase para procesar el link del mail
      setTimeout(() => setVerificando(false), 1000); 
    };
    verificar();

    return () => {
      authListener.subscription.unsubscribe();
    };
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

  // Mientras verificamos, mostramos un cartel de "Cargando" para que no salte el error
  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Verificando link...</p>
      </div>
    );
  }

  if (!tieneSession) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-2xl font-bold text-sky-600">Conecta</Link>
          </div>
        </header>
        <main className="max-w-md mx-auto px-6 py-12 text-center">
          <p className="text-gray-600 mb-4">Este link no es válido o ya expiró.</p>
          <Link href="/recuperar" className="text-sky-600 hover:underline">
            Pedir un link nuevo
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">Conecta</Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Nueva contraseña</h1>
        <p className="text-gray-600 mb-8">Elegí una contraseña nueva para tu cuenta.</p>

        {exito ? (
          <div className="border border-green-200 bg-green-50 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-medium mb-2">✅ ¡Contraseña actualizada!</p>
            <p className="text-sm text-green-600">Redirigiendo al login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repetí la contraseña"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 bg-white"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleCambiar}
              disabled={loading}
              className="w-full bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </button>

            <p className="text-sm text-gray-600 mt-6 text-center">
              <Link href="/login" className="text-sky-600 hover:underline">
                ← Volver al login
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
