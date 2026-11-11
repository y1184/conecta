"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

type Mensaje = {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  created_at: string;
  visto: boolean;
};

export default function Chat() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [otroNombre, setOtroNombre] = useState("Usuario");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // Estados para calificar
  const [mostrarCalificar, setMostrarCalificar] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [calificando, setCalificando] = useState(false);
  const [calificado, setCalificado] = useState(false);

  const router = useRouter();
  const params = useParams();
  const otroUsuarioId = params.id as string;
  const finMensajes = useRef<HTMLDivElement>(null);

  // 1. Carga inicial del chat y marcado como visto
  useEffect(() => {
    const cargarChat = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      setUsuario(userData.user);

      // Obtener nombre del otro usuario
      const { data: otroData } = await supabase
        .from("trabajadores")
        .select("nombre")
        .eq("user_id", otroUsuarioId)
        .order("id", { ascending: false })
        .limit(1);

      if (otroData?.[0]) {
        setOtroNombre(otroData[0].nombre);
      }

      // Obtener mensajes
      const { data: mensajesData } = await supabase
        .from("mensajes")
        .select("*")
        .or(
          `and(emisor_id.eq."${userData.user.id}",receptor_id.eq."${otroUsuarioId}"),and(emisor_id.eq."${otroUsuarioId}",receptor_id.eq."${userData.user.id}")`
        )
        .order("created_at", { ascending: true });

      // Marcar como vistos los mensajes del otro usuario
      await supabase
        .from("mensajes")
        .update({ visto: true })
        .match({
          emisor_id: otroUsuarioId,
          receptor_id: userData.user.id,
          visto: false,
        });

      // Actualizar estado local para pintar los ticks azules
      const mensajesActualizados = mensajesData?.map((m) => {
        if (m.emisor_id === otroUsuarioId) {
          return { ...m, visto: true };
        }
        return m;
      });

      setMensajes(mensajesActualizados || []);
      setLoading(false);
    };

    cargarChat();
  }, [otroUsuarioId, router]);

  // 2. TIEMPO REAL: Escuchar mensajes nuevos
  useEffect(() => {
    if (!usuario) return;

    const nombreCanal = `chat-${otroUsuarioId}-${Date.now()}`;
    
    const canal = supabase
      .channel(nombreCanal)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
        },
        (payload) => {
          const nuevo = payload.new as Mensaje;

          // Verificar que el mensaje sea de esta conversación
          if (
            (nuevo.emisor_id === usuario.id && nuevo.receptor_id === otroUsuarioId) ||
            (nuevo.emisor_id === otroUsuarioId && nuevo.receptor_id === usuario.id)
          ) {
            setMensajes((prev) => {
              // Evitar duplicados
              if (prev.find((m) => m.id === nuevo.id)) return prev;
              return [...prev, nuevo];
            });

            // Si el mensaje es del otro, marcarlo como visto inmediatamente
            if (nuevo.emisor_id === otroUsuarioId) {
              supabase
                .from("mensajes")
                .update({ visto: true })
                .eq("id", nuevo.id)
                .then();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario, otroUsuarioId]);

  // 3. Auto-scroll al último mensaje
  useEffect(() => {
    finMensajes.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleEnviar = async () => {
    if (!nuevoMensaje.trim() || !usuario) return;

    setEnviando(true);
    const textoAEnviar = nuevoMensaje.trim();
    setNuevoMensaje(""); // Limpiamos el input rápido para que se sienta fluido

    const { data, error } = await supabase
      .from("mensajes")
      .insert({
        emisor_id: usuario.id,
        receptor_id: otroUsuarioId,
        contenido: textoAEnviar,
        visto: false,
      })
      .select()
      .single();

    if (error) {
      alert("Error al enviar: " + error.message);
      setNuevoMensaje(textoAEnviar); // Devolvemos el texto si falló
    } else if (data) {
      // Lo agregamos a la pantalla al instante
      setMensajes((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
    setEnviando(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleCalificar = async () => {
    if (estrellas === 0 || !usuario) {
      alert("Elegí al menos 1 estrella");
      return;
    }

    setCalificando(true);

    const { error } = await supabase.from("calificaciones").insert({
      evaluador_id: usuario.id,
      evaluado_id: otroUsuarioId,
      estrellas: estrellas,
      comentario: comentario.trim() || null,
    });

    if (error) {
      alert("Error al calificar: " + error.message);
      setCalificando(false);
      return;
    }

    setCalificado(true);
    setCalificando(false);
    setTimeout(() => {
      setMostrarCalificar(false);
      setEstrellas(0);
      setComentario("");
      setCalificado(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-sky-600">
              Conecta
            </Link>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-800">
              Chat con {otroNombre}
            </span>
          </div>
          
          <div className="flex gap-4 items-center">
            {otroUsuarioId !== usuario?.id && (
              <button
                onClick={() => setMostrarCalificar(!mostrarCalificar)}
                className="text-sm text-yellow-600 hover:underline font-medium"
              >
                ⭐ Calificar
              </button>
            )}
            <Link href="/mensajes" className="text-sm text-sky-600 hover:underline">
              ← Mis mensajes
            </Link>
          </div>
        </div>
      </header>

      {/* FORMULARIO DE CALIFICACIÓN */}
      {mostrarCalificar && (
        <div className="bg-yellow-50 border-b border-yellow-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            {calificado ? (
              <p className="text-green-700 font-medium text-center py-2">
                ✅ ¡Gracias por tu calificación!
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-800 mb-2">
                  ¿Cómo fue tu experiencia con {otroNombre}?
                </p>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setEstrellas(n)}
                      className={`text-3xl transition-transform ${
                        n <= estrellas ? "text-yellow-400" : "text-gray-300"
                      } hover:scale-110`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentario (opcional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 mb-3"
                />
                <button
                  onClick={handleCalificar}
                  disabled={calificando || estrellas === 0}
                  className="bg-yellow-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                >
                  {calificando ? "Enviando..." : "Enviar calificación"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ÁREA DE MENSAJES (Con scroll) */}
      <main className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-6 py-6 flex flex-col space-y-4">
        {mensajes.length > 0 ? (
          mensajes.map((msg) => {
            const esMio = msg.emisor_id === usuario?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${esMio ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
                    esMio
                      ? "bg-sky-600 text-white rounded-br-none shadow-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                  <div
                    className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                      esMio ? "text-sky-100" : "text-slate-400"
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString("es-UY", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {esMio && (
                      <span className={msg.visto ? "text-white" : "text-sky-300"}>
                        {msg.visto ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500 text-center">
              Todavía no hay mensajes. <br />
              ¡Escribí el primero! 👇
            </p>
          </div>
        )}
        {/* Este div invisible sirve para saber hasta dónde hacer scroll */}
        <div ref={finMensajes} />
      </main>

      {/* ÁREA DE INPUT (Fija abajo) */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje..."
            className="flex-1 border border-slate-300 rounded-full px-5 py-3 outline-none focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors"
          />
          <button
            onClick={handleEnviar}
            disabled={enviando || !nuevoMensaje.trim()}
            className="bg-sky-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 shadow-md shadow-sky-200"
          >
            {enviando ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
