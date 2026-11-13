"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

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
};

type Calificacion = {
  evaluado_id: string;
  estrellas: number;
};

export default function Trabajadores() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [promedios, setPromedios] = useState<Map<string, { suma: number; cantidad: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  const [usuario, setUsuario] = useState<User | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>([]);

  const [busquedaOficio, setBusquedaOficio] = useState("");
  const [busquedaCiudad, setBusquedaCiudad] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);

      // 1. Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();
      setUsuario(userData.user);

      // 2. Cargar favoritos del usuario
      if (userData.user) {
        const { data: favsData } = await supabase
          .from("favoritos")
          .select("trabajador_id")
          .eq("user_id", userData.user.id);
        
        if (favsData) {
          setFavoritos(favsData.map((f) => f.trabajador_id));
        }
      }

      // 3. Cargar trabajadores con filtros de búsqueda
      let query = supabase.from("trabajadores").select("*");

      if (busquedaOficio.trim()) {
        query = query.ilike("oficio", `%${busquedaOficio.trim()}%`);
      }
      if (busquedaCiudad.trim()) {
        query = query.ilike("ciudad", `%${busquedaCiudad.trim()}%`);
      }

      const { data: trabajadoresData } = await query;
      setTrabajadores(trabajadoresData || []);

      // 4. Cargar calificaciones para calcular promedios
      const { data: calificacionesData } = await supabase
        .from("calificaciones")
        .select("evaluado_id, estrellas");

      const mapaPromedios = new Map<string, { suma: number; cantidad: number }>();
      
      calificacionesData?.forEach((cal: Calificacion) => {
        const actual = mapaPromedios.get(cal.evaluado_id) || { suma: 0, cantidad: 0 };
        mapaPromedios.set(cal.evaluado_id, {
          suma: actual.suma + cal.estrellas,
          cantidad: actual.cantidad + 1,
        });
      });

      setPromedios(mapaPromedios);
      setLoading(false);
    };

    // Debounce para no saturar la base de datos a cada letra
    const timer = setTimeout(() => {
      cargarDatos();
    }, 300); 

    return () => clearTimeout(timer);
  }, [busquedaOficio, busquedaCiudad]);

  // Función para guardar/quitar de favoritos
  const toggleFavorito = async (trabajadorId: string) => {
    if (!usuario) {
      alert("Tenés que iniciar sesión para guardar en favoritos.");
      return;
    }

    const yaEsFavorito = favoritos.includes(trabajadorId);

    if (yaEsFavorito) {
      // Quitar de favoritos (actualización visual rápida)
      setFavoritos(favoritos.filter(id => id !== trabajadorId));
      await supabase
        .from("favoritos")
        .delete()
        .match({ user_id: usuario.id, trabajador_id: trabajadorId });
    } else {
      // Agregar a favoritos (actualización visual rápida)
      setFavoritos([...favoritos, trabajadorId]);
      await supabase
        .from("favoritos")
        .insert({ user_id: usuario.id, trabajador_id: trabajadorId });
    }
  };

  const getPromedio = (userId: string | null) => {
    if (!userId) return null;
    const datos = promedios.get(userId);
    if (!datos || datos.cantidad === 0) return null;
    return {
      promedio: (datos.suma / datos.cantidad).toFixed(1),
      cantidad: datos.cantidad,
    };
  };

  const getEmailLink = (email: string, nombre: string, oficio: string) => {
    const asunto = encodeURIComponent("Consulta desde Conecta");
    const cuerpo = encodeURIComponent(`Hola ${nombre}, te contacto por tu servicio de ${oficio}`);
    if (email.endsWith("@gmail.com")) return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${asunto}&body=${cuerpo}`;
    if (email.endsWith("@outlook.com") || email.endsWith("@hotmail.com") || email.endsWith("@live.com")) return `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${asunto}&body=${cuerpo}`;
    if (email.endsWith("@yahoo.com")) return `https://compose.mail.yahoo.com/?to=${email}&subject=${asunto}&body=${cuerpo}`;
    return `mailto:${email}?subject=${asunto}&body=${cuerpo}`;
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
          {usuario && (
            <Link href="/perfil/guardados" className="text-sm font-medium text-slate-600 hover:text-sky-600 flex items-center gap-1">
              ❤️ Mis guardados
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-4xl font-bold mb-2 text-slate-800">Trabajadores disponibles</h1>
        <p className="text-slate-600 mb-8">
          Estas son las personas que ofrecen sus servicios en Conecta.
        </p>

        {/* BARRA DE FILTROS */}
        <div className="bg-white rounded-full shadow-lg shadow-slate-200/50 p-2 flex flex-col md:flex-row items-center gap-2 border border-slate-100 mb-10 max-w-3xl">
          <div className="flex-1 w-full flex items-center px-4">
            <span className="text-slate-400 mr-2">🔍</span>
            <input 
              type="text" 
              placeholder="¿Qué oficio buscás? (ej: plomero)" 
              value={busquedaOficio} 
              onChange={(e) => setBusquedaOficio(e.target.value)} 
              className="w-full py-3 outline-none bg-transparent text-slate-700 placeholder-slate-400" 
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-slate-200"></div>
          <div className="flex-1 w-full flex items-center px-4">
            <span className="text-slate-400 mr-2">📍</span>
            <input 
              type="text" 
              placeholder="¿En qué ciudad?" 
              value={busquedaCiudad} 
              onChange={(e) => setBusquedaCiudad(e.target.value)} 
              className="w-full py-3 outline-none bg-transparent text-slate-700 placeholder-slate-400" 
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 animate-pulse">Buscando trabajadores...</p>
          </div>
        ) : trabajadores.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
            <p className="text-slate-500 mb-4">No encontramos trabajadores con esos filtros. 😢</p>
            <button 
              onClick={() => { setBusquedaOficio(""); setBusquedaCiudad(""); }} 
              className="text-sky-600 hover:underline font-medium"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {trabajadores.map((trabajador) => {
              const rating = getPromedio(trabajador.user_id);
              const esFavorito = favoritos.includes(trabajador.user_id);

              return (
                <div key={trabajador.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-sky-100 transition-all duration-300 relative">
                  
                  {/* BOTÓN DE FAVORITOS */}
                  <button 
                    onClick={() => toggleFavorito(trabajador.user_id)}
                    className="absolute top-6 right-6 text-2xl hover:scale-110 transition-transform focus:outline-none"
                    title={esFavorito ? "Quitar de guardados" : "Guardar perfil"}
                  >
                    {esFavorito ? "❤️" : "🤍"}
                  </button>

                  {trabajador.foto_url ? (
                    <img 
                      src={trabajador.foto_url} 
                      alt={trabajador.nombre} 
                      className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-sky-50" 
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
                    {rating ? (
                      <p>
                        ⭐ {rating.promedio} / 5 <span className="text-slate-400">({rating.cantidad} {rating.cantidad === 1 ? "calificación" : "calificaciones"})</span>
                      </p>
                    ) : (
                      <p className="text-slate-400">Sin calificaciones</p>
                    )}
                  </div>

                  {/* DESCRIPCIÓN CON COMILLAS CORREGIDAS */}
                  {trabajador.descripcion && (
                    <p className="text-sm text-slate-700 italic mb-4 line-clamp-2">
                      &quot;{trabajador.descripcion}&quot;
                    </p>
                  )}

                  {trabajador.cv_url && (
                    <a 
                      href={trabajador.cv_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-block mb-3 text-sky-600 text-sm font-medium hover:underline"
                    >
                      📄 Ver CV
                    </a>
                  )}

                  <div className="space-y-2 mt-4">
                    <Link 
                      href={`/chat/${trabajador.user_id}`} 
                      className="block w-full text-center bg-slate-800 text-white font-medium py-2.5 rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
                    >
                      💬 Enviar mensaje
                    </Link>
                    {trabajador.whatsapp && (
                      <a 
                        href={`https://wa.me/${trabajador.whatsapp}?text=Hola ${trabajador.nombre}, te contacto desde Conecta por tu servicio de ${trabajador.oficio}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block w-full text-center bg-green-500 text-white font-medium py-2.5 rounded-xl hover:bg-green-600 transition-colors shadow-sm"
                      >
                        📱 WhatsApp
                      </a>
                    )}
                    <a 
                      href={getEmailLink(trabajador.email, trabajador.nombre, trabajador.oficio)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block w-full text-center bg-sky-100 text-sky-700 font-medium py-2.5 rounded-xl hover:bg-sky-200 transition-colors"
                    >
                      ✉️ Email
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Link href="/" className="inline-block mt-12 text-sky-600 hover:underline font-medium">← Volver al inicio</Link>
      </main>
    </div>
  );
}
