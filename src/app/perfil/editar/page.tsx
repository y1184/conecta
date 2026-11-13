"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

const MAX_FOTOS = 5;

export default function EditarPerfil() {
  const [nombre, setNombre] = useState("");
  const [oficio, setOficio] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pais, setPais] = useState("Uruguay"); // 👈 NUEVO: Estado para el país
  
  // Estados para el portafolio
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);
  const [videoExistente, setVideoExistente] = useState<string | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);

  // Estados para Foto de perfil y CV
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [cvUrlExistente, setCvUrlExistente] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: perfilesData } = await supabase
        .from("trabajadores")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("id", { ascending: false })
        .limit(1);

      const perfil = perfilesData?.[0];

      if (perfil) {
        setNombre(perfil.nombre || "");
        setOficio(perfil.oficio || "");
        setCiudad(perfil.ciudad || "");
        setTarifa(perfil.tarifa || "");
        setDescripcion(perfil.descripcion || "");
        setWhatsapp(perfil.whatsapp || "");
        setPais(perfil.pais || "Uruguay"); // 👈 NUEVO
        
        setFotosExistentes(perfil.portafolio_fotos || []);
        setVideoExistente(perfil.portafolio_video || null);

        setPreviewFoto(perfil.foto_url || null);
        setCvUrlExistente(perfil.cv_url || null);
      }

      setLoading(false);
    };
    cargarDatos();
  }, [router]);

  const manejarSeleccionFotos = (e: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files || []);
    const combinadas = [...fotos, ...archivos].slice(0, MAX_FOTOS - fotosExistentes.length);
    setFotos(combinadas);
    setPreviews(combinadas.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const quitarFotoNueva = (index: number) => {
    const nuevas = fotos.filter((_, i) => i !== index);
    setFotos(nuevas);
    setPreviews(nuevas.map((f) => URL.createObjectURL(f)));
  };

  const quitarFotoExistente = (index: number) => {
    setFotosExistentes(fotosExistentes.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setError("");
    setExito(false);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setError("No estás logeado");
      setGuardando(false);
      return;
    }

    // Subir Foto de Perfil
    let urlFotoFinal = previewFoto;
    if (fotoPerfil) {
      const extension = fotoPerfil.name.split('.').pop();
      const nombreArchivo = `${userData.user.id}/avatar-${Date.now()}.${extension}`;
      
      const { error: errSubidaFoto } = await supabase.storage
        .from("avatares")
        .upload(nombreArchivo, fotoPerfil, { upsert: true });

      if (!errSubidaFoto) {
        const { data } = supabase.storage.from("avatares").getPublicUrl(nombreArchivo);
        urlFotoFinal = data.publicUrl;
      }
    }

    // Subir CV
    let urlCvFinal = cvUrlExistente;
    if (cv) {
      const nombreArchivo = `${userData.user.id}/cv-${Date.now()}.pdf`;
      
      const { error: errSubidaCv } = await supabase.storage
        .from("cvs")
        .upload(nombreArchivo, cv, { upsert: true });

      if (!errSubidaCv) {
        const { data } = supabase.storage.from("cvs").getPublicUrl(nombreArchivo);
        urlCvFinal = data.publicUrl;
      }
    }

    // Subir fotos nuevas del portafolio
    const urlsFotosNuevas: string[] = [];
    for (const foto of fotos) {
      const nombreArchivo = `${userData.user.id}/portafolio-${Date.now()}-${foto.name}`;
      const { error: errSubida } = await supabase.storage.from("trabajos").upload(nombreArchivo, foto);
      if (!errSubida) {
        const { data } = supabase.storage.from("trabajos").getPublicUrl(nombreArchivo);
        urlsFotosNuevas.push(data.publicUrl);
      }
    }

    const fotosFinales = [...fotosExistentes, ...urlsFotosNuevas];

    // Subir video nuevo del portafolio
    let urlVideoFinal = videoExistente;
    if (video) {
      const nombreVideo = `${userData.user.id}/portafolio-${Date.now()}-${video.name}`;
      const { error: errVideo } = await supabase.storage.from("trabajos").upload(nombreVideo, video);
      if (!errVideo) {
        const { data } = supabase.storage.from("trabajos").getPublicUrl(nombreVideo);
        urlVideoFinal = data.publicUrl;
      }
    }

    // Guardamos todo en la base de datos
    const { error: updateError } = await supabase
      .from("trabajadores")
      .update({
        nombre: nombre,
        oficio: oficio,
        ciudad: ciudad || "Sin especificar",
        tarifa: tarifa || "A convenir",
        descripcion: descripcion || "",
        whatsapp: whatsapp || null,
        pais: pais, // 👈 NUEVO: Guardamos el país
        portafolio_fotos: fotosFinales,
        portafolio_video: urlVideoFinal,
        foto_url: urlFotoFinal,
        cv_url: urlCvFinal,
      })
      .eq("user_id", userData.user.id);

    if (updateError) {
      setError(updateError.message);
      setGuardando(false);
      return;
    }

    setExito(true);
    setTimeout(() => {
      router.push("/perfil");
    }, 1500);
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
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Editar mis datos</h1>
        <p className="text-slate-600 mb-8">
          Actualizá tu información para que otros te encuentren mejor.
        </p>

        <div className="space-y-6">
          
          {/* SECCIÓN DE FOTO DE PERFIL Y CV */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            {/* Foto */}
            <div className="text-center">
              {previewFoto ? (
                <img src={previewFoto} alt="Perfil" className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-sky-50 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 border-4 border-slate-50 shadow-sm text-slate-400 text-3xl">
                  👤
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                <span>📸 Subir foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFotoPerfil(file);
                      setPreviewFoto(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* CV */}
            <div className="flex-1 text-center md:text-left">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Currículum Vitae (PDF)</label>
              {cvUrlExistente && !cv && (
                <a href={cvUrlExistente} target="_blank" rel="noopener noreferrer" className="block text-sm text-sky-600 hover:underline mb-3">
                  📄 Ver CV actual
                </a>
              )}
              {cv && (
                <p className="text-sm text-green-600 font-medium mb-3">
                  ✅ Nuevo CV seleccionado: {cv.name}
                </p>
              )}
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                <span>📄 Subir CV (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setCv(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre completo</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Oficio</label>
              <input type="text" value={oficio} onChange={(e) => setOficio(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors" />
            </div>

            {/* 👈 NUEVO: SELECTOR DE PAÍS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">País</label>
                <select 
                  value={pais} 
                  onChange={(e) => setPais(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors bg-white"
                >
                  <option value="Uruguay">&#127482;&#127486; Uruguay</option>
                  <option value="Argentina">&#127462;&#127479; Argentina</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ciudad</label>
                <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tarifa por hora (opcional)</label>
              <input type="text" value={tarifa} onChange={(e) => setTarifa(e.target.value)} placeholder="Ej: $500/hora" className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp (opcional)</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 59891234567" className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción personal</label>
              <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Contá algo sobre vos, tu experiencia, tus servicios" className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors" />
            </div>
          </div>

          {/* SECCIÓN DE PORTAFOLIO */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-2 text-slate-800">Trabajos realizados (Portafolio)</h2>
            <p className="text-sm text-slate-500 mb-6">Mostrale a los empleadores lo que sabés hacer.</p>

            {/* Fotos del portafolio */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fotos de tus trabajos (hasta {MAX_FOTOS})
              </label>

              {(fotosExistentes.length > 0 || previews.length > 0) && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {fotosExistentes.map((url, i) => (
                    <div key={`existente-${i}`} className="relative">
                      <img src={url} alt={`Trabajo ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                      <button type="button" onClick={() => quitarFotoExistente(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700">✕</button>
                    </div>
                  ))}
                  {previews.map((src, i) => (
                    <div key={`nueva-${i}`} className="relative">
                      <img src={src} alt={`Nueva ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                      <button type="button" onClick={() => quitarFotoNueva(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {fotosExistentes.length + fotos.length < MAX_FOTOS && (
                <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                  <span>📸 Agregar fotos</span>
                  <input type="file" accept="image/*" multiple onChange={manejarSeleccionFotos} className="hidden" />
                </label>
              )}
            </div>

            {/* Video del portafolio */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Video de presentación (opcional)</label>
              {(videoExistente || video) && (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                  <p className="text-sm text-slate-700 truncate">
                    {video ? video.name : "Video guardado anteriormente"}
                  </p>
                  <button type="button" onClick={() => { if (video) setVideo(null); else setVideoExistente(null); }} className="text-red-600 text-sm font-medium hover:underline ml-4">Quitar</button>
                </div>
              )}
              {!videoExistente && !video && (
                <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                  <span>🎥 Elegir video</span>
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setVideo(e.target.files?.[0] || null)} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
          {exito && <p className="text-green-600 text-sm font-medium">¡Datos actualizados! Redirigiendo...</p>}

          <button onClick={handleGuardar} disabled={guardando} className="w-full bg-sky-600 text-white font-medium py-3 rounded-xl hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm text-lg mt-4">
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>

          <Link href="/perfil" className="inline-block mt-4 text-sky-600 hover:underline font-medium">
            ← Volver a mi perfil
          </Link>
        </div>
      </main>
    </div>
  );
}
