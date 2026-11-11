"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [noLeidos, setNoLeidos] = useState(0);
  
  // Estados para el buscador
  const [busqueda, setBusqueda] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    let canal: ReturnType<typeof supabase.channel> | null = null;
    const nombreCanal = `mensajes-home-${Date.now()}`;

    const chequearUsuario = async () => {
      const { data } = await supabase.auth.getUser();
      setUsuario(data.user);

      if (data.user) {
        const actualizarContador = async () => {
          const { count } = await supabase
            .from("mensajes")
            .select("*", { count: "exact", head: true })
            .eq("receptor_id", data.user.id)
            .eq("visto", false);

          setNoLeidos(count || 0);
        };

        await actualizarContador();

        canal = supabase
          .channel(nombreCanal)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "mensajes" },
            () => { actualizarContador(); }
          )
          .subscribe();
      }
    };

    chequearUsuario();

    return () => {
      if (canal) supabase.removeChannel(canal);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    router.push("/");
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busqueda.trim()) params.append("buscar", busqueda.trim());
    if (ubicacion.trim()) params.append("ubicacion", ubicacion.trim());
    router.push(`/trabajos?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/trabajos" className="hover:text-sky-600 transition-colors">Buscar trabajo</Link>
            <Link href="/trabajadores" className="hover:text-sky-600 transition-colors">Buscar trabajadores</Link>
            <Link href="/formalizate" className="hover:text-sky-600 transition-colors">Formalizate</Link>
            <Link href="/publicar" className="hover:text-sky-600 transition-colors">Publicar demanda</Link>
            <Link href="/mensajes" className="hover:text-sky-600 transition-colors relative">
              Mensajes
              {noLeidos > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {noLeidos}
                </span>
              )}
            </Link>
          </nav>
          <div className="flex gap-3 items-center">
            {usuario ? (
              <>
                <Link href="/perfil" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                  Mi cuenta
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-sky-600 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-sky-700 transition-colors shadow-sm"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                  Ingresar
                </Link>
                <Link href="/registro" className="bg-sky-600 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-sky-700 transition-colors shadow-sm">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center flex-1 w-full">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-800">
          Conectamos <span className="text-sky-600">Trabajadores</span> con <span className="text-sky-600">Empleos</span>
        </h2>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Publicá lo que necesitás o lo que ofrecés. Encontramos la persona justa para el trabajo justo.
        </p>

        {/* BUSCADOR FLOTANTE */}
        <div className="max-w-4xl mx-auto mt-10 px-4 relative z-10">
          <form 
            onSubmit={handleBuscar}
            className="bg-white rounded-full shadow-2xl shadow-slate-300/50 p-2 flex flex-col md:flex-row items-center gap-2 border border-slate-200"
          >
            <input
              type="text"
              placeholder="¿Qué buscás? (ej: plomero)"
              className="flex-1 w-full px-6 py-4 outline-none rounded-full text-slate-700 placeholder-slate-400 bg-transparent hover:bg-slate-50 focus:bg-slate-50 transition-colors"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>

            <input
              type="text"
              placeholder="¿Dónde?"
              className="md:w-48 w-full px-6 py-4 outline-none rounded-full text-slate-700 placeholder-slate-400 bg-transparent hover:bg-slate-50 focus:bg-slate-50 transition-colors"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
            
            <button 
              type="submit"
              className="bg-sky-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-sky-700 transition-all w-full md:w-auto shadow-md shadow-sky-200"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* DOS OPCIONES PRINCIPALES */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-6 w-full">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 cursor-pointer group">
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform origin-left">🔍</div>
          <h3 className="text-2xl font-bold mb-3 text-slate-800">Busco contratar</h3>
          <p className="text-slate-600 mb-6">
            Necesitás un electricista, un plomero, alguien para limpieza. Publicá tu pedido y recibí propuestas.
          </p>
          <Link href="/publicar" className="text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1">
            Publicar demanda <span>→</span>
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 cursor-pointer group">
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform origin-left">💼</div>
          <h3 className="text-2xl font-bold mb-3 text-slate-800">Busco trabajo</h3>
          <p className="text-slate-600 mb-6">
            Ofrecé tus servicios, tus horas disponibles y tu tarifa. Que los empleadores te encuentren a vos.
          </p>
          <Link href="/trabajadores" className="text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1">
            Publicar disponibilidad <span>→</span>
          </Link>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 w-full">
          <h3 className="text-3xl font-bold text-center mb-12 text-slate-800">¿Cómo funciona?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            
            <Link href="/publicar" className="text-center group cursor-pointer">
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                1
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-sky-600 transition-colors">Publicá</h4>
              <p className="text-slate-600">Contá qué necesitás o qué ofrecés, en dos minutos.</p>
            </Link>

            <Link href="/trabajos" className="text-center group cursor-pointer">
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                2
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-sky-600 transition-colors">Conectá</h4>
              <p className="text-slate-600">Recibí propuestas o postulate. Hablá por el chat interno.</p>
            </Link>

            <Link href="/trabajadores" className="text-center group cursor-pointer">
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                3
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-sky-600 transition-colors">Calificá</h4>
              <p className="text-slate-600">Después del trabajo, puntuá y ayudá a que otros elijan mejor.</p>
            </Link>

          </div>
        </div>
      </section>

      {/* BANNER UNIPERSONAL */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="bg-sky-600 text-white rounded-3xl p-12 text-center shadow-2xl shadow-sky-200 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-4">¿Trabajás por tu cuenta?</h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Te ayudamos a formalizarte como unipersonal: alta en DGI, BPS, facturación electrónica y todo lo que necesitás.
            </p>
            <Link href="/formalizate" className="inline-block bg-white text-sky-600 px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-colors shadow-lg">
              Ver la guía paso a paso
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-10 text-center text-sm text-slate-500 mt-auto">
        <p>© 2026 Conecta — Conectando trabajadores con empleos en Uruguay y Argentina.</p>
      </footer>
    </div>
  );
}
