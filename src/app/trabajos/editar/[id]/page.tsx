"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

const CATEGORIAS = [
  "Electricidad", "Plomería", "Limpieza", "Diseño", "Construcción",
  "Jardinería", "Fotografía", "Clases particulares", "Otro",
];
const MAX_FOTOS = 5;

export default function EditarTrabajo() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Electricidad");
  const [categoriaOtra, setCategoriaOtra] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [urgencia, setUrgencia] = useState("Sin apuro");
  
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);
  const [videoExistente, setVideoExistente] = useState<string | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      const { data, error } = await supabase
        .from("trabajos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("No encontramos esta publicación.");
        setLoading(false);
        return;
      }

      setTitulo(data.titulo || "");
      setCategoria(CATEGORIAS.includes(data.categoria) ? data.categoria : "Otro");
      if (!CATEGORIAS.includes(data.categoria)) setCategoriaOtra(data.categoria);
      setDescripcion(data.descripcion || "");
      setPresupuesto(data.presupuesto || "");
      setUbicacion(data.ubicacion || "");
      setUrgencia(data.urgencia || "Sin apuro");
      setFotosExistentes(data.fotos_url || []);
      setVideoExistente(data.video_url || null);
      
      setLoading(false);
    };
    cargarDatos();
  }, [id]);

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

    if (!titulo || !descripcion) {
      setError("Completá al menos el título y la descripción");
      setGuardando(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Subir fotos nuevas
    const urlsFotosNuevas: string[] = [];
    for (const foto of fotos) {
      const nombreArchivo = `${userData.user.id}/${Date.now()}-${foto.name}`;
      const { error: errSubida } = await supabase.storage.from("trabajos").upload(nombreArchivo, foto);
      if (!errSubida) {
        const { data } = supabase.storage.from("trabajos").getPublicUrl(nombreArchivo);
        urlsFotosNuevas.push(data.publicUrl);
      }
    }

    const fotosFinales = [...fotosExistentes, ...urlsFotosNuevas];

    // Subir video nuevo
    let urlVideoFinal = videoExistente;
    if (video) {
      const nombreVideo = `${userData.user.id}/${Date.now()}-${video.name}`;
      const { error: errVideo } = await supabase.storage.from("trabajos").upload(nombreVideo, video);
      if (!errVideo) {
        const { data } = supabase.storage.from("trabajos").getPublicUrl(nombreVideo);
        urlVideoFinal = data.publicUrl;
      }
    }

    const categoriaFinal = categoria === "Otro" ? categoriaOtra.trim() : categoria;

    const { error: updateError } = await supabase
      .from("trabajos")
      .update({
        titulo,
        categoria: categoriaFinal,
        descripcion,
        presupuesto: presupuesto || null,
        ubicacion: ubicacion || "Sin especificar",
        urgencia,
        fotos_url: fotosFinales,
        video_url: urlVideoFinal,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setGuardando(false);
      return;
    }

    router.push("/trabajos");
  };

  if (loading) return <div className="p-12 text-center">Cargando publicación...</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">Conecta</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Editar publicación</h1>
        <p className="text-gray-600 mb-8">Modificá los detalles de tu demanda.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">¿Qué necesitás?</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500">
              {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {categoria === "Otro" && (
            <div>
              <label className="block text-sm font-medium mb-2">Escribí la categoría</label>
              <input type="text" value={categoriaOtra} onChange={(e) => setCategoriaOtra(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Urgencia</label>
            <select value={urgencia} onChange={(e) => setUrgencia(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500">
              <option value="Urgente">🔴 Urgente (lo antes posible)</option>
              <option value="Esta semana">🟡 Esta semana</option>
              <option value="Este mes">🟢 Este mes</option>
              <option value="Sin apuro">⚪ Sin apuro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Presupuesto (opcional)</label>
              <input type="text" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ubicación</label>
              <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-sky-500" />
            </div>
          </div>

          {/* FOTOS */}
          <div>
            <label className="block text-sm font-medium mb-2">Fotos (hasta {MAX_FOTOS})</label>
            {(fotosExistentes.length > 0 || previews.length > 0) && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {fotosExistentes.map((url, i) => (
                  <div key={`ext-${i}`} className="relative">
                    <img src={url} className="w-full h-24 object-cover rounded-lg border" />
                    <button type="button" onClick={() => quitarFotoExistente(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs">✕</button>
                  </div>
                ))}
                {previews.map((src, i) => (
                  <div key={`new-${i}`} className="relative">
                    <img src={src} className="w-full h-24 object-cover rounded-lg border" />
                    <button type="button" onClick={() => quitarFotoNueva(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
            {fotosExistentes.length + fotos.length < MAX_FOTOS && (
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <span>📸 Agregar fotos</span>
                <input type="file" accept="image/*" multiple onChange={manejarSeleccionFotos} className="hidden" />
              </label>
            )}
          </div>

          {/* VIDEO */}
          <div>
            <label className="block text-sm font-medium mb-2">Video (opcional)</label>
            {(videoExistente || video) && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border mb-3">
                <p className="text-sm text-gray-700 truncate">{video ? video.name : "Video guardado"}</p>
                <button type="button" onClick={() => { if (video) setVideo(null); else setVideoExistente(null); }} className="text-red-600 text-sm font-medium hover:underline">Quitar</button>
              </div>
            )}
            {!videoExistente && !video && (
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <span>🎥 Elegir video</span>
                <input type="file" accept="video/mp4,video/webm" onChange={(e) => setVideo(e.target.files?.[0] || null)} className="hidden" />
              </label>
            )}
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

          <button onClick={handleGuardar} disabled={guardando} className="w-full bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {guardando ? "Guardando cambios..." : "Guardar cambios"}
          </button>
          
          <Link href="/trabajos" className="inline-block text-sky-600 hover:underline">← Volver a trabajos</Link>
        </div>
      </main>
    </div>
  );
}
