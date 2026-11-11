"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

type Trabajo = {
  id: number;
  user_id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  presupuesto: string;
  ubicacion: string;
  urgencia: string;
  activo: boolean;
  created_at: string;
  fotos_url: string[] | null;
  video_url: string | null;
};

type Empleador = {
  user_id: string;
  nombre: string;
  email: string;
  whatsapp: string | null;
};

function TrabajosContenido() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [empleadores, setEmpleadores] = useState<Map<string, Empleador>>(new Map());
  const [usuario, setUsuario] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const buscar = searchParams.get("buscar") || "";
  const ubicacionParam = searchParams.get("ubicacion") || "";

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        setUsuario(userData.user);

        let query = supabase
          .from("trabajos")
          .select("*")
          .eq("activo", true)
          .order("created_at", { ascending: false });

        if (buscar) {
          query = query.or(`titulo.ilike."%${buscar}%",categoria.ilike."%${buscar}%",descripcion.ilike."%${buscar}%"`);
        }

        if (ubicacionParam) {
          query = query.ilike("ubicacion", `%${ubicacionParam}%`);
        }

        const { data: trabajosData, error } = await query;

        if (error) {
          console.error("Error de Supabase:", error);
          setTrabajos([]);
          return;
        }

        const lista = trabajosData || [];
        setTrabajos(lista);

        const userIds = lista.map((t) => t.user_id).filter(Boolean);

        if (userIds.length > 0) {
          const { data: empleadoresData } = await supabase
            .from("trabajadores")
            .select("user_id, nombre, email, whatsapp")
            .in("user_id", userIds);

          const mapa = new Map<string, Empleador>();
          empleadoresData?.forEach((e) => {
            if (e.user_id) mapa.set(e.user_id, e);
          });
          setEmpleadores(mapa);
        }
      } catch (err) {
        console.error("Se rompió algo:", err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [buscar, ubicacionParam]);

  const handleCerrar = async (trabajoId: number) => {
    if (!confirm("¿Marcar esta demanda como resuelta? Ya no aparecerá en la lista.")) {
      return;
    }

    setCerrando(trabajoId);

    const { error } = await supabase
      .from("trabajos")
      .update({ activo: false })
      .eq("id", trabajoId);

    if (error) {
      alert("Error al cerrar: " + error.message);
      setCerrando(null);
      return;
    }

    setTrabajos(trabajos.filter((t) => t.id !== trabajoId));
    setCerrando(null);
  };

  const getUrgenciaEstilo = (urgencia: string) => {
    switch (urgencia) {
      case "Urgente":
        return { clase: "bg-red-100 text-red-700 border-red-200", emoji: "🔴", texto: "Urgente" };
      case "Esta semana":
        return { clase: "bg-yellow-100 text-yellow-700 border-yellow-200", emoji: "🟡", texto: "Esta semana" };
      case "Este mes":
        return { clase: "bg-green-100 text-green-700 border-green-200", emoji: "🟢", texto: "Este mes" };
      default:
        return { clase: "bg-gray-100 text-gray-600 border-gray-200", emoji: "⚪", texto: "Sin apuro" };
    }
  };

  const getEmailLink = (email: string, nombre: string, oficio: string) => {
    const asunto = encodeURIComponent("Consulta desde Conecta");
    const cuerpo = encodeURIComponent(`Hola ${nombre}, te contacto por tu demanda de ${oficio}`);

    if (email.endsWith("@gmail.com")) {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${asunto}&body=${cuerpo}`;
    }
    if (email.endsWith("@outlook.com") || email.endsWith("@hotmail.com") || email.endsWith("@live.com")) {
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${asunto}&body=${cuerpo}`;
    }
    if (email.endsWith("@yahoo.com")) {
      return `https://compose.mail.yahoo.com/?to=${email}&subject=${asunto}&body=${cuerpo}`;
    }
    return `mailto:${email}?subject=${asunto}&body=${cuerpo}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Trabajos disponibles</h1>
        <p className="text-gray-600 mb-8">
          Estas son las demandas publicadas por empleadores.
        </p>

        {(buscar || ubicacionParam) && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl flex justify-between items-center">
            <p>
              Mostrando resultados para: <strong>{buscar || "Todo"}</strong> 
              {ubicacionParam && ` en ${ubicacionParam}`}
            </p>
            <Link href="/trabajos" className="text-sm underline font-medium">
              Limpiar búsqueda
            </Link>
          </div>
        )}

        {trabajos.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {trabajos.map((trabajo) => {
              const empleador = empleadores.get(trabajo.user_id);
              const nombreEmpleador = empleador?.nombre || "Empleador";
              const urgenciaInfo = getUrgenciaEstilo(trabajo.urgencia);
              const esMia = usuario?.id === trabajo.user_id;

              return (
                <div key={trabajo.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-block bg-blue-100 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">
                        {trabajo.categoria}
                      </span>
                      <span className={`inline-block border text-xs font-medium px-3 py-1 rounded-full ${urgenciaInfo.clase}`}>
                        {urgenciaInfo.emoji} {urgenciaInfo.texto}
                      </span>
                      {esMia && (
                        <span className="inline-block bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium px-3 py-1 rounded-full">
                          Tu publicación
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold mb-2">{trabajo.titulo}</h2>
                    <p className="text-gray-700 text-sm mb-4">{trabajo.descripcion}</p>

                    {/* FOTOS */}
                    {trabajo.fotos_url && trabajo.fotos_url.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {trabajo.fotos_url.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-20 object-cover rounded-lg hover:opacity-80" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* VIDEO */}
                    {trabajo.video_url && (
                      <div className="mb-4">
                        <video src={trabajo.video_url} controls className="w-full rounded-lg" />
                      </div>
                    )}

                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>📍 {trabajo.ubicacion}</p>
                      {trabajo.presupuesto && <p>💰 Presupuesto: {trabajo.presupuesto}</p>}
                      <p className="text-gray-500">Publicado por: <strong>{nombreEmpleador}</strong></p>
                    </div>
                  </div>

                  {/* BOTONES */}
                  <div>
                    {esMia ? (
                      <div className="space-y-2 mt-4"> {/* 👈 NUEVO: Envoltorio para los botones */}
                        <Link
                          href={`/trabajos/editar/${trabajo.id}`}
                          className="block w-full text-center bg-gray-100 text-gray-800 font-medium py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          ✏️ Editar publicación
                        </Link>
                        <button
                          onClick={() => handleCerrar(trabajo.id)}
                          disabled={cerrando === trabajo.id}
                          className="block w-full text-center bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {cerrando === trabajo.id ? "Cerrando..." : "✅ Marcar como resuelta"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <Link
                          href={`/chat/${trabajo.user_id}`}
                          className="block w-full text-center bg-gray-800 text-white font-medium py-2 rounded-lg hover:bg-gray-900 mb-2"
                        >
                          💬 Contactar a {nombreEmpleador}
                        </Link>

                        {empleador?.whatsapp && (
                          <a
                            href={`https://wa.me/${empleador.whatsapp}?text=Hola ${nombreEmpleador}, te contacto desde Conecta por tu demanda de ${trabajo.titulo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 mb-2"
                          >
                            📱 WhatsApp
                          </a>
                        )}

                        {empleador?.email && (
                          <a
                            href={getEmailLink(empleador.email, nombreEmpleador, trabajo.titulo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-sky-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
                          >
                            ✉️ Email
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            {buscar || ubicacionParam ? (
              <>
                <p className="text-gray-500 mb-4">No encontramos demandas que coincidan con tu búsqueda. 😢</p>
                <Link href="/trabajos" className="inline-block text-sky-600 hover:underline font-medium">
                  Ver todos los trabajos
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-500">Todavía no hay demandas publicadas.</p>
                <Link href="/publicar" className="inline-block mt-4 text-sky-600 hover:underline">
                  Publicar la primera demanda
                </Link>
              </>
            )}
          </div>
        )}

        <Link href="/" className="inline-block mt-8 text-sky-600 hover:underline">
          ← Volver al inicio
        </Link>
      </main>
    </div>
  );
}

export default function Trabajos() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Cargando buscador...</p>
      </div>
    }>
      <TrabajosContenido />
    </Suspense>
  );
}
