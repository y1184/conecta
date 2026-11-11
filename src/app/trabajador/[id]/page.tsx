import Link from "next/link";
import { supabase } from "@/utils/supabase/client";

type Trabajador = {
  id: number;
  user_id: string;
  nombre: string;
  oficio: string;
  email: string;
  ciudad: string;
  tarifa: string;
  descripcion: string;
  foto_url: string;
  cv_url: string;
  whatsapp: string;
  portafolio_fotos: string[] | null;
  portafolio_video: string | null;
};

export default async function PerfilPublico({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 👈 NUEVO: Le preguntamos a Supabase quién está mirando la página
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: perfilesData } = await supabase
    .from("trabajadores")
    .select("*")
    .eq("user_id", id)
    .order("id", { ascending: false })
    .limit(1);

  const trabajador: Trabajador | null = perfilesData?.[0] || null;

  // 👈 NUEVO: Verificamos si el que mira es el dueño del perfil
  const esMiPerfil = user?.id === trabajador?.user_id;

  const { data: calificaciones } = await supabase
    .from("calificaciones")
    .select("estrellas, comentario, created_at")
    .eq("evaluado_id", id)
    .order("created_at", { ascending: false });

  const promedio =
    calificaciones && calificaciones.length > 0
      ? {
          valor:
            calificaciones.reduce((acc, c) => acc + c.estrellas, 0) /
            calificaciones.length,
          cantidad: calificaciones.length,
        }
      : null;

  const resenas =
    calificaciones?.filter(
      (c) => c.comentario && c.comentario.trim() !== ""
    ) || [];

  const getEmailLink = (email: string, nombre: string, oficio: string) => {
    const asunto = encodeURIComponent("Consulta desde Conecta");
    const cuerpo = encodeURIComponent(
      `Hola ${nombre}, te contacto por tu servicio de ${oficio}`
    );

    if (email.endsWith("@gmail.com")) {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${asunto}&body=${cuerpo}`;
    }
    if (
      email.endsWith("@outlook.com") ||
      email.endsWith("@hotmail.com") ||
      email.endsWith("@live.com")
    ) {
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${asunto}&body=${cuerpo}`;
    }
    if (email.endsWith("@yahoo.com")) {
      return `https://compose.mail.yahoo.com/?to=${email}&subject=${asunto}&body=${cuerpo}`;
    }

    return `mailto:${email}?subject=${asunto}&body=${cuerpo}`;
  };

  if (!trabajador) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link href="/" className="text-2xl font-bold text-sky-600">
              Conecta
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-gray-600">No encontramos este perfil.</p>
          <Link
            href="/trabajadores"
            className="inline-block mt-4 text-sky-600 hover:underline"
          >
            ← Volver a trabajadores
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
          {/* 👈 NUEVO: Botón de editar en el header si es mi perfil */}
          {esMiPerfil && (
            <Link 
              href="/perfil" 
              className="text-sm text-sky-600 font-medium hover:underline"
            >
              Ir a mi panel
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="border border-gray-200 rounded-2xl p-8 relative">
          
          {/* 👈 NUEVO: Botón de editar grande y visible si es mi perfil */}
          {esMiPerfil && (
            <div className="absolute top-6 right-6">
              <Link
                href="/perfil/editar"
                className="bg-blue-100 text-sky-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors text-sm"
              >
                ✏️ Editar mi perfil
              </Link>
            </div>
          )}

          {trabajador.foto_url && (
            <img
              src={trabajador.foto_url}
              alt={trabajador.nombre}
              className="w-32 h-32 rounded-full object-cover mb-6 border-4 border-blue-100 mx-auto"
            />
          )}

          <h1 className="text-3xl font-bold mb-2 text-center">{trabajador.nombre}</h1>
          <p className="text-sky-600 font-medium text-lg mb-4 text-center">
            {trabajador.oficio}
          </p>

          <div className="space-y-2 text-gray-700 mb-6 justify-center flex flex-col items-center">
            <p>📍 {trabajador.ciudad}</p>
            <p>💰 {trabajador.tarifa}</p>
            
            {promedio ? (
              <div className="flex items-center gap-2">
                <span>⭐ {promedio.valor} / 5</span>
                <span className="text-gray-500 text-sm">
                  ({promedio.cantidad} {promedio.cantidad === 1 ? "calificación" : "calificaciones"})
                </span>
              </div>
            ) : (
              <span className="text-gray-400">Sin calificaciones todavía</span>
            )}
          </div>

          {trabajador.descripcion && (
            <div className="mb-6 text-center">
              <p className="text-sm font-medium mb-2">Sobre mí</p>
              <p className="text-gray-700">{trabajador.descripcion}</p>
            </div>
          )}

          {trabajador.cv_url && (
            <div className="text-center mb-6">
              <a
                href={trabajador.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sky-600 hover:underline"
              >
                📄 Ver CV
              </a>
            </div>
          )}

          <div className="space-y-2 pt-6 border-t border-gray-200">
            <Link
              href={`/chat/${trabajador.user_id}`}
              className="block w-full text-center bg-gray-800 text-white font-medium py-3 rounded-lg hover:bg-gray-900 transition-colors"
            >
              💬 Enviar mensaje
            </Link>

            {trabajador.whatsapp && (
              <a
                href={`https://wa.me/${trabajador.whatsapp}?text=Hola ${trabajador.nombre}, te contacto desde Conecta`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                📱 WhatsApp
              </a>
            )}

            {trabajador.email && (
              <a
                href={getEmailLink(
                  trabajador.email,
                  trabajador.nombre,
                  trabajador.oficio
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✉️ Email
              </a>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-xl mb-4 text-center">Trabajos realizados</h3>
            
            {(!trabajador.portafolio_fotos || trabajador.portafolio_fotos.length === 0) && !trabajador.portafolio_video && (
              <p className="text-gray-500 text-sm text-center">
                Este trabajador todavía no subió fotos de sus trabajos.
              </p>
            )}

            {trabajador.portafolio_fotos && trabajador.portafolio_fotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {trabajador.portafolio_fotos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-square"
                  >
                    <img
                      src={url}
                      alt={`Trabajo realizado ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            )}

            {trabajador.portafolio_video && (
              <div className="mt-4">
                <video
                  src={trabajador.portafolio_video}
                  controls
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          {resenas.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="font-medium mb-4 text-center">Comentarios de otros usuarios</p>
              <div className="space-y-3">
                {resenas.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-500">
                        {"★".repeat(r.estrellas)}
                        <span className="text-gray-300">
                          {"★".repeat(5 - r.estrellas)}
                        </span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString("es-UY")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic">
                      &quot;{r.comentario}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link
              href="/trabajadores"
              className="inline-block text-sky-600 hover:underline"
            >
              ← Volver a trabajadores
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
