"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

type Trabajador = {
  id: number;
  user_id: string;
  nombre: string;
  oficio: string;
  ciudad: string;
  tarifa: string;
  descripcion: string;
  foto_url: string;
};

export default function MisGuardados() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [guardados, setGuardados] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarGuardados = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }
      setUsuario(userData.user);
      console.log("🔍 ESPÍA 1 - Usuario logueado actualmente:", userData.user.id);

      // 1. Buscamos los IDs de los trabajadores que guardó este usuario
      const { data: favoritosData, error: errorFavs } = await supabase
        .from("favoritos")
        .select("trabajador_id")
        .eq("user_id", userData.user.id);

      console.log("🔍 ESPÍA 2 - Lo que devolvió la tabla favoritos:", favoritosData);
      if (errorFavs) console.error("❌ ERROR en favoritos:", errorFavs);

      if (!favoritosData || favoritosData.length === 0) {
        console.log("⚠️ La tabla favoritos está vacía para este usuario.");
        setLoading(false);
        return;
      }

      const idsGuardados = favoritosData
      .map((f) => f.trabajador_id)
      .filter((id): id is string => typeof id === 'string' && id.trim() !== '' );

      console.log("ESPIA 3 - IDs de los trabajadores a buscar (filtrados):", idsGuardados);

      if(idsGuardados.length === 0) {
        console.log("no se encontraron IDs de trabajadores validos en los favoritos.");
        setLoading(false);
        return;
      }

      // 2. Buscamos los perfiles de esos trabajadores
      const { data: perfilesData, error: errorPerfiles } = await supabase
        .from("trabajadores")
        .select("*")
        .in("user_id", idsGuardados);

      console.log("🔍 ESPÍA 4 - Perfiles encontrados en trabajadores:", perfilesData);
      if (errorPerfiles) console.error("❌ ERROR en perfiles:", errorPerfiles);

      if (perfilesData) {
        setGuardados(perfilesData);
      }
      
      setLoading(false);
    };

    cargarGuardados();
  }, [router]);

  const quitarGuardado = async (trabajadorId: string) => {
    if (!usuario) return;
    setGuardados(guardados.filter((t) => t.user_id !== trabajadorId));
    await supabase
      .from("favoritos")
      .delete()
      .match({ user_id: usuario.id, trabajador_id: trabajadorId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando tus guardados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2 text-slate-800">Mis guardados</h1>
        <p className="text-slate-600 mb-8">
          Estos son los trabajadores que guardaste para contactar más adelante.
        </p>

        {guardados.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <p className="text-slate-500 mb-4 text-lg">Todavía no guardaste a ningún trabajador.</p>
            <Link
              href="/trabajadores"
              className="inline-block bg-sky-600 text-white font-medium px-6 py-3 rounded-full hover:bg-sky-700 transition-colors shadow-sm"
            >
              Explorar trabajadores
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {guardados.map((trabajador) => (
              <div
                key={trabajador.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 relative hover:shadow-xl hover:shadow-sky-100 transition-all duration-300"
              >
                <button
                  onClick={() => quitarGuardado(trabajador.user_id)}
                  className="absolute top-6 right-6 text-2xl hover:scale-110 transition-transform"
                  title="Quitar de guardados"
                >
                  ❤️
                </button>

                {trabajador.foto_url ? (
                  <img
                    src={trabajador.foto_url}
                    alt={trabajador.nombre}
                    className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-rose-50"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4 border-4 border-slate-50 text-3xl">
                    👤
                  </div>
                )}

                <Link
                  href={`/trabajador/${trabajador.user_id}`}
                  className="text-2xl font-bold mb-1 hover:text-sky-600 transition-colors inline-block text-slate-800 pr-10"
                >
                  {trabajador.nombre}
                </Link>

                <p className="text-sky-600 font-medium mb-3">{trabajador.oficio}</p>

                <div className="space-y-1 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl">
                  <p>📍 {trabajador.ciudad}</p>
                  <p>💵 {trabajador.tarifa}</p>
                </div>

                {trabajador.descripcion && (
                  <p className="text-sm text-slate-700 italic mb-4 line-clamp-2">
                    &quot;{trabajador.descripcion}&quot;
                  </p>
                )}

                <div className="space-y-2 mt-4">
                  <Link
                    href={`/chat/${trabajador.user_id}`}
                    className="block w-full text-center bg-slate-800 text-white font-medium py-2.5 rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    💬 Enviar mensaje
                  </Link>
                  <Link
                    href={`/trabajador/${trabajador.user_id}`}
                    className="block w-full text-center bg-sky-100 text-sky-700 font-medium py-2.5 rounded-xl hover:bg-sky-200 transition-colors"
                  >
                    Ver perfil completo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/perfil" className="inline-block mt-12 text-sky-600 hover:underline font-medium">
          ← Volver a mi cuenta
        </Link>
      </main>
    </div>
  );
}
