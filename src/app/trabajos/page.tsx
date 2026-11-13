"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  pais: string | null; // 👈 NUEVO
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
  const router = useRouter();
  
  const buscar = searchParams.get("buscar") || "";
  const ubicacionParam = searchParams.get("ubicacion") || "";
  const paisParam = searchParams.get("pais") || ""; // 👈 NUEVO

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
        
        // 👈 NUEVO: Filtro por país
        if (paisParam) {
          query = query.eq("pais", paisParam);
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
  }, [buscar, ubicacionParam, paisParam]); // 👈 Agregamos paisParam a las dependencias

  // 👈 NUEVO: Función para cambiar el filtro de país
  const handleCambiarPais = (nuevoPais: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nuevoPais) {
      params.set("pais", nuevoPais);
    } else {
      params.delete("pais");
    }
    router.push(`/trabajos?${params.toString()}`);
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando...</p>
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

      <main className="max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-4xl font-bold mb-2 text-slate-800">Trabajos disponibles</h1>
        <p className="text-slate-600 mb-8">
          Estas son las demandas publicadas por empleadores.
        </p>

        {/* 👈 NUEVO: BARRA DE FILTROS DE PAÍS */}
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm w-max">
          <button 
            onClick={() => handleCambiarPais("")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${!paisParam ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => handleCambiarPais("Uruguay")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${paisParam === 'Uruguay' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🇺🇾 Uruguay
          </button>
          <button 
            onClick={() => handleCambiarPais("Argentina")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${paisParam === 'Argentina' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🇦🇷 Argentina
          </button>
        </div>

        {(buscar || ubicacionParam) && (
          <div className="mb-6 p-4 bg-sky-50 text-sky-800 rounded-xl flex justify-between items-center border border-sky-100">
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
                <div key={trabajo.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-sky-100 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-block bg-sky-100 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">
                        {trabajo.categoria}
                      </span>
                      <span className={`inline-block border text-xs font-medium px-3 py-1 rounded-full ${urgenciaInfo.clase}`}>
                        {urgenciaInfo.emoji} {urgenciaInfo.texto}
                      </span>
                      {/* 👈 NUEVO: Etiqueta de País en la tarjeta */}
                      <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-1 rounded-full">
                        {trabajo.pais === "Argentina" ? "🇦🇷 Argentina" : "🇺🇾 Uruguay"}
                      </span>
                      {esMia && (
                        <span className="inline-block bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium px-3 py-1 rounded-full">
                          Tu publicación
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold mb-2 text-slate-800">{trabajo.titulo}</h2>
                    <p className="text-slate-700 text-sm mb-4 line-clamp-3">{trabajo.descripcion}</p>

                    {/* FOTOS */}
                    {trabajo.fotos_url && trabajo.fotos_url.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {trabajo.fotos_url.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-20 object-cover rounded-lg hover:opacity-80 transition-opacity" />
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

                    <div className="space-y-1 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl">
                      <p>📍 {trabajo.ubicacion}</p>
                      {trabajo.presupuesto && <p>💰 Presupuesto: {trabajo.presupuesto}</p>}
                      <p className="text-slate-500">Publicado por: <strong>{nombreEmpleador}</strong></p>
                    </div>
                  </div>

                  {/* BOTONES */}
                  <div>
                    {esMia ? (
                      <div className="space-y-2 mt-4">
                        <Link
                          href={`/trabajos/editar/${trabajo.id}`}
                          className="block w-full text-center bg-slate-100 text-slate-800 font-medium py-2.5 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          ✏️ Editar publicación
                        </Link>
                        <button
                          onClick={() => handleCerrar(trabajo.id)}
                          disabled={cerrando === trabajo.id}
                          className="block w-full text-center bg-green-500 text-white font-medium py-2.5 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {cerrando === trabajo.id ? "Cerrando..." : "✅ Marcar como resuelta"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        <Link
                          href={`/chat/${trabajo.user_id}`}
                          className="block w-full text-center bg-slate-800 text-white font-medium py-2.5 rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
                        >
                          💬 Contactar a {nombreEmpleador}
                        </Link>

                        {empleador?.whatsapp && (
                          <a
                            href={`https://wa.me/${empleador.whatsapp}?text=Hola ${nombreEmpleador}, te contacto desde Conecta por tu demanda de ${trabajo.titulo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-green-500 text-white font-medium py-2.5 rounded-xl hover:bg-green-600 transition-colors shadow-sm"
                          >
                            📱 WhatsApp
                          </a>
                        )}

                        {empleador?.email && (
                          <a
                            href={getEmailLink(empleador.email, nombreEmpleador, trabajo.titulo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-sky-100 text-sky-700 font-medium py-2.5 rounded-xl hover:bg-sky-200 transition-colors"
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
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
            {buscar || ubicacionParam || paisParam ? (
              <>
                <p className="text-slate-500 mb-4">No encontramos demandas que coincidan con tu búsqueda. 😢</p>
                <Link href="/trabajos" className="inline-block text-sky-600 hover:underline font-medium">
                  Ver todos los trabajos
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-500">Todavía no hay demandas publicadas.</p>
                <Link href="/publicar" className="inline-block mt-4 text-sky-600 hover:underline">
                  Publicar la primera demanda
                </Link>
              </>
            )}
          </div>
        )}

        <Link href="/" className="inline-block mt-12 text-sky-600 hover:underline font-medium">
          ← Volver al inicio
        </Link>
      </main>
    </div>
  );
}

export default function Trabajos() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando buscador...</p>
      </div>
    }>
      <TrabajosContenido />
    </Suspense>
  );
}
