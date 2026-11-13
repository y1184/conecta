"use client";

import { useState, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

const CATEGORIAS = [
  "Electricidad",
  "Plomería",
  "Limpieza",
  "Diseño",
  "Construcción",
  "Jardinería",
  "Fotografía",
  "Clases particulares",
  "Otro",
];

const MAX_FOTOS = 5;

export default function Publicar() {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Electricidad");
  const [categoriaOtra, setCategoriaOtra] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [urgencia, setUrgencia] = useState("Sin apuro");
  const [pais, setPais] = useState("Uruguay"); // 👈 NUEVO
  
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const router = useRouter();

  const manejarSeleccionFotos = (e: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files || []);
    const combinadas = [...fotos, ...archivos].slice(0, MAX_FOTOS);
    setFotos(combinadas);
    setPreviews(combinadas.map((f) => URL.createObjectURL(f)));
    e.target.value = ""; 
  };

  const quitarFoto = (index: number) => {
    const nuevas = fotos.filter((_, i) => i !== index);
    setFotos(nuevas);
    setPreviews(nuevas.map((f) => URL.createObjectURL(f)));
  };

  const handlePublicar = async () => {
    setLoading(true);
    setError("");

    if (!titulo || !descripcion) {
      setError("Completá al menos el título y la descripción");
      setLoading(false);
      return;
    }

    if (categoria === "Otro" && !categoriaOtra.trim()) {
      setError("Escribí la categoría personalizada");
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setError("Tenés que iniciar sesión para publicar una demanda");
      setLoading(false);
      return;
    }

    const categoriaFinal = categoria === "Otro" ? categoriaOtra.trim() : categoria;

    // Subir fotos
    const urlsFotos: string[] = [];
    for (const foto of fotos) {
      const nombreArchivo = `${userData.user.id}/${Date.now()}-${foto.name}`;
      const { error: errSubida } = await supabase.storage
        .from("trabajos")
        .upload(nombreArchivo, foto);

      if (errSubida) {
        setError("Error al subir una foto: " + errSubida.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("trabajos")
        .getPublicUrl(nombreArchivo);
      urlsFotos.push(data.publicUrl);
    }

    // Subir video
    let urlVideo: string | null = null;
    if (video) {
      const nombreVideo = `${userData.user.id}/${Date.now()}-${video.name}`;
      const { error: errVideo } = await supabase.storage
        .from("trabajos")
        .upload(nombreVideo, video);

      if (errVideo) {
        setError("Error al subir el video: " + errVideo.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("trabajos")
        .getPublicUrl(nombreVideo);
      urlVideo = data.publicUrl;
    }

    // Insertar en la base de datos
    const { error: insertError } = await supabase.from("trabajos").insert({
      user_id: userData.user.id,
      titulo: titulo,
      categoria: categoriaFinal,
      descripcion: descripcion,
      presupuesto: presupuesto || null,
      ubicacion: ubicacion || "Sin especificar",
      urgencia: urgencia,
      pais: pais, // 👈 NUEVO: Guardamos el país
      fotos_url: urlsFotos,
      video_url: urlVideo,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setExito(true);
    setTimeout(() => {
      router.push("/trabajos");
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-4xl font-bold mb-2 text-slate-800">Publicar una demanda</h1>
        <p className="text-slate-600 mb-8">
          Contá qué necesitás y recibí propuestas de trabajadores.
        </p>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ¿Qué necesitás? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Electricista para instalación"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors bg-white"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {categoria === "Otro" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Escribí la categoría
              </label>
              <input
                type="text"
                value={categoriaOtra}
                onChange={(e) => setCategoriaOtra(e.target.value)}
                placeholder="Ej: Reparación de bicicletas"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Urgencia</label>
            <select
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors bg-white"
            >
              <option value="Urgente">🔴 Urgente (lo antes posible)</option>
              <option value="Esta semana">🟡 Esta semana</option>
              <option value="Este mes">🟢 Este mes</option>
              <option value="Sin apuro">⚪ Sin apuro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Contá más detalles de lo que necesitás..."
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Presupuesto (opcional)</label>
              <input
                type="text"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                placeholder="Ej: $2000"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            
            {/* 👈 NUEVO: Fila con País y Ubicación */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">País</label>
                <select
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors bg-white"
                >
                  <option value="Uruguay">Uruguay</option>
                  <option value="Argentina">Argentina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ciudad</label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej: Montevideo"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN DE FOTOS */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fotos (opcional, hasta {MAX_FOTOS})
            </label>
            
            <label className={`cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors ${fotos.length >= MAX_FOTOS ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span>📸 Elegir fotos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={manejarSeleccionFotos}
                disabled={fotos.length >= MAX_FOTOS}
                className="hidden" 
              />
            </label>
            
            <p className="text-xs text-slate-500 mt-2">
              {fotos.length}/{MAX_FOTOS} fotos elegidas
            </p>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => quitarFoto(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN DE VIDEO */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Video (opcional, máx 20 MB)
            </label>
            
            <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              <span>🎥 Elegir video</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => setVideo(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            {video && (
              <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700 truncate">{video.name}</p>
                <button
                  type="button"
                  onClick={() => setVideo(null)}
                  className="text-red-600 text-sm font-medium hover:underline ml-4"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

          {exito && (
            <p className="text-green-600 text-sm font-medium">
              ✅ ¡Demanda publicada! Redirigiendo...
            </p>
          )}

          <button
            onClick={handlePublicar}
            disabled={loading}
            className="w-full bg-sky-600 text-white font-medium py-3 rounded-xl hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm text-lg"
          >
            {loading ? "Publicando..." : "Publicar demanda"}
          </button>
        </div>

        <Link
          href="/"
          className="inline-block mt-8 text-sky-600 hover:underline font-medium"
        >
          ← Volver al inicio
        </Link>
      </main>
    </div>
  );
}
