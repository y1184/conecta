"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  rating: number;
  tiene_unipersonal: boolean;
  descripcion: string;
  foto_url: string;
  cv_url: string;
};

type Reseña = {
  estrellas: number;
  comentario: string;
  fecha: string;
};

type Trabajo = {
  id: number;
  titulo: string;
  categoria: string;
  created_at: string;
  activo: boolean;
};

export default function Perfil() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Trabajador | null>(null);
  const [promedio, setPromedio] = useState<{ promedio: string; cantidad: number } | null>(null);
  const [resenas, setResenas] = useState<Reseña[]>([]);
  const [misTrabajos, setMisTrabajos] = useState<Trabajo[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [subiendoCV, setSubiendoCV] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      setUsuario(userData.user);

      // 1. Cargar datos del perfil
      const { data: perfilesData } = await supabase
        .from("trabajadores")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("id", { ascending: false })
        .limit(1);

      setPerfil(perfilesData?.[0] || null);

      // 2. Cargar las publicaciones del usuario
      const { data: trabajosData } = await supabase
        .from("trabajos")
        .select("id, titulo, categoria, created_at, activo")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (trabajosData) {
        setMisTrabajos(trabajosData);
      }

      // 3. Cargar calificaciones
      const { data: calificaciones } = await supabase
        .from("calificaciones")
        .select("estrellas, comentario, created_at")
        .eq("evaluado_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (calificaciones && calificaciones.length > 0) {
        const suma = calificaciones.reduce((acc, c) => acc + c.estrellas, 0);
        setPromedio({
          promedio: (suma / calificaciones.length).toFixed(1),
          cantidad: calificaciones.length,
        });
      }

      setResenas(
        calificaciones
          ?.filter((c) => c.comentario && c.comentario.trim() !== "")
          .map((c) => ({
            estrellas: c.estrellas,
            comentario: c.comentario,
            fecha: c.created_at,
          })) || []
      );

      setLoading(false);
    };

    cargarPerfil();
  }, [router]);

  const handleSubirFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo || !usuario) return;

    setSubiendo(true);
    const extension = archivo.name.split(".").pop();
    const nombreArchivo = `${usuario.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatares")
      .upload(nombreArchivo, archivo, { upsert: true });

    if (uploadError) {
      alert("Error al subir la foto: " + uploadError.message);
      setSubiendo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatares").getPublicUrl(nombreArchivo);
    const nuevaUrl = urlData.publicUrl;

    await supabase
      .from("trabajadores")
      .update({ foto_url: nuevaUrl })
      .eq("user_id", usuario.id);

    setPerfil((prev) => prev ? { ...prev, foto_url: nuevaUrl } : null);
    setSubiendo(false);
  };

  const handleSubirCV = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo || !usuario) return;

    setSubiendoCV(true);
    const nombreArchivo = `${usuario.id}/cv-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(nombreArchivo, archivo, { upsert: true });

    if (uploadError) {
      alert("Error al subir el CV: " + uploadError.message);
      setSubiendoCV(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(nombreArchivo);
    const nuevaUrl = urlData.publicUrl;

    await supabase
      .from("trabajadores")
      .update({ cv_url: nuevaUrl })
      .eq("user_id", usuario.id);

    setPerfil((prev) => prev ? { ...prev, cv_url: nuevaUrl } : null);
    setSubiendoCV(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Cargando...</p>
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

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Mi cuenta</h1>
        <p className="text-slate-600 mb-8">Estos son tus datos en Conecta.</p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/perfil/editar"
            className="bg-sky-600 text-white text-sm px-5 py-2 rounded-full font-medium hover:bg-sky-700 transition-colors shadow-sm"
          >
            Editar mis datos
          </Link>
          <Link
            href="/perfil/guardados"
            className="bg-rose-500 text-white text-sm px-5 py-2 rounded-full font-medium hover:bg-rose-600 transition-colors shadow-sm flex items-center gap-1"
          >
            ❤️ Mis guardados
          </Link>
          <Link
            href="/mensajes"
            className="bg-slate-800 text-white text-sm px-5 py-2 rounded-full font-medium hover:bg-slate-900 transition-colors shadow-sm"
          >
            Ver mis mensajes
          </Link>
        </div>

        {perfil ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8 space-y-4">
            
            <div className="text-center">
              {perfil.foto_url ? (
                <img
                  src={perfil.foto_url}
                  alt="Foto de perfil"
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-sky-100 shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border-4 border-slate-50 shadow-sm text-5xl">
                  👤
                </div>
              )}
              <h2 className="text-2xl font-bold text-slate-800">{perfil.nombre}</h2>
              <p className="text-sky-600 font-medium">{perfil.oficio}</p>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-slate-700 text-sm">
              <p><span className="font-semibold text-slate-900">Email:</span> {perfil.email}</p>
              <p><span className="font-semibold text-slate-900">Ciudad:</span> {perfil.ciudad}</p>
              <p><span className="font-semibold text-slate-900">Tarifa:</span> {perfil.tarifa}</p>
              {perfil.descripcion && (
                <p><span className="font-semibold text-slate-900">Descripción:</span> {perfil.descripcion}</p>
              )}
              
              <div className="pt-2">
                <span className="font-semibold text-slate-900">Calificación: </span>
                {promedio ? (
                  <span className="inline-flex items-center gap-1">
                    ⭐ {promedio.promedio} / 5
                    <span className="text-slate-400 text-xs">({promedio.cantidad} {promedio.cantidad === 1 ? "calificación" : "calificaciones"})</span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Sin calificaciones todavía</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Foto de perfil</label>
                <input type="file" accept="image/*" onChange={handleSubirFoto} disabled={subiendo} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
                {subiendo && <p className="text-sky-600 text-xs mt-1">Subiendo foto...</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Currículum Vitae</label>
                <input type="file" accept=".pdf,application/pdf" onChange={handleSubirCV} disabled={subiendoCV} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100" />
                {subiendoCV && <p className="text-sky-600 text-xs mt-1">Subiendo CV...</p>}
                {perfil.cv_url && (
                  <a href={perfil.cv_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-sky-600 font-medium hover:underline">
                    📄 Ver mi CV actual
                  </a>
                )}
              </div>
            </div>

            {resenas.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <p className="font-semibold text-slate-800 mb-3">Comentarios de otros usuarios</p>
                <div className="space-y-3">
                  {resenas.map((r, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(r.estrellas)}
                          <span className="text-slate-300">{"★".repeat(5 - r.estrellas)}</span>
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(r.fecha).toLocaleDateString("es-UY")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 italic">&quot;{r.comentario}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-600 bg-white p-6 rounded-2xl border border-slate-200 text-center mb-8">
            No encontramos tu perfil. Probá registrarte de nuevo o completá tus datos.
          </p>
        )}

        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Mis Publicaciones</h2>
            <Link 
              href="/publicar" 
              className="text-sm bg-sky-100 text-sky-700 px-4 py-2 rounded-full font-semibold hover:bg-sky-200 transition-colors"
            >
              + Nueva demanda
            </Link>
          </div>
          
          {misTrabajos.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
              <p className="text-slate-500 mb-2">Todavía no publicaste ninguna demanda.</p>
              <Link href="/publicar" className="text-sky-600 font-medium hover:underline">
                Publicar mi primera demanda
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {misTrabajos.map((trabajo) => (
                <div key={trabajo.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-800">{trabajo.titulo}</h3>
                      {!trabajo.activo && (
                        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">Resuelta</span>
                      )}
                    </div>
                    <div className="flex gap-2 text-sm text-slate-500">
                      <span className="font-medium text-sky-600">{trabajo.categoria}</span>
                      <span>•</span>
                      <span>{new Date(trabajo.created_at).toLocaleDateString('es-UY')}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link 
                      href={`/trabajos/editar/${trabajo.id}`}
                      className="flex-1 sm:flex-none text-center px-5 py-2.5 text-sm font-semibold text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
                    >
                      Editar
                    </Link>
                    <Link 
                      href={`/trabajos`} 
                      className="flex-1 sm:flex-none text-center px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Ver todas
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-sky-600 hover:underline font-medium">
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
