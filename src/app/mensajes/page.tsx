"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

type Mensaje = {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  created_at: string;
};

type Conversacion = {
  otroUsuarioId: string;
  otroNombre: string;
  ultimoMensaje: string;
  fecha: string;
  tipo: "enviado" | "recibido";
};

export default function Mensajes() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "enviados" | "recibidos">("todos");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarMensajes = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: mensajesData } = await supabase
        .from("mensajes")
        .select("*")
        .or(`emisor_id.eq."${userData.user.id}",receptor_id.eq."${userData.user.id}"`)
        .order("created_at", { ascending: false });

      if (!mensajesData || mensajesData.length === 0) {
        setLoading(false);
        return;
      }

      const conversacionesMap = new Map<
        string,
        { ultimoMensaje: string; fecha: string; tipo: "enviado" | "recibido" }
      >();

      mensajesData.forEach((msg: Mensaje) => {
        const esMio = msg.emisor_id === userData.user!.id;
        const otroId = esMio ? msg.receptor_id : msg.emisor_id;

        if (!conversacionesMap.has(otroId)) {
          conversacionesMap.set(otroId, {
            ultimoMensaje: msg.contenido,
            fecha: msg.created_at,
            tipo: esMio ? "enviado" : "recibido",
          });
        }
      });

      const otrosIds = Array.from(conversacionesMap.keys());

      const { data: usuariosData } = await supabase
        .from("trabajadores")
        .select("user_id, nombre")
        .in("user_id", otrosIds);

      const nombresMap = new Map<string, string>();
      usuariosData?.forEach((u) => {
        if (u.user_id) nombresMap.set(u.user_id, u.nombre);
      });

      const conversacionesFinales: Conversacion[] = otrosIds.map((otroId) => {
        const conv = conversacionesMap.get(otroId)!;
        return {
          otroUsuarioId: otroId,
          otroNombre: nombresMap.get(otroId) || "Usuario desconocido",
          ultimoMensaje: conv.ultimoMensaje,
          fecha: conv.fecha,
          tipo: conv.tipo,
        };
      });

      setConversaciones(conversacionesFinales);
      setLoading(false);
    };

    cargarMensajes();
  }, [router]);

  const conversacionesFiltradas = conversaciones.filter((conv) => {
    if (filtro === "todos") return true;
    if (filtro === "enviados") return conv.tipo === "enviado";
    if (filtro === "recibidos") return conv.tipo === "recibido";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Mis mensajes</h1>
        <p className="text-gray-600 mb-6">
          Estas son tus conversaciones.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFiltro("todos")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtro === "todos"
                ? "bg-sky-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro("enviados")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtro === "enviados"
                ? "bg-sky-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Enviados
          </button>
          <button
            onClick={() => setFiltro("recibidos")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtro === "recibidos"
                ? "bg-sky-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Recibidos
          </button>
        </div>

        {conversacionesFiltradas.length > 0 ? (
          <div className="space-y-3">
            {conversacionesFiltradas.map((conv) => (
              <Link
                key={conv.otroUsuarioId}
                href={`/chat/${conv.otroUsuarioId}`}
                className="block border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-gray-900">
                    {conv.otroNombre}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      conv.tipo === "enviado"
                        ? "bg-blue-100 text-sky-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {conv.tipo === "enviado" ? "Enviado" : "Recibido"}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-1 truncate">
                  {conv.ultimoMensaje}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(conv.fecha).toLocaleString("es-UY")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <p className="text-gray-500 mb-4">
              {filtro === "todos"
                ? "Todavía no tenés mensajes."
                : filtro === "enviados"
                ? "No enviaste mensajes todavía."
                : "No recibiste mensajes todavía."}
            </p>
            <Link
              href="/trabajadores"
              className="inline-block bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Buscar trabajadores
            </Link>
          </div>
        )}

        <Link
          href="/"
          className="inline-block mt-8 text-sky-600 hover:underline"
        >
          ← Volver al inicio
        </Link>
      </main>
    </div>
  );
}
