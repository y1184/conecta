"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MONOTRIBUTO,
  BPS_MENSUAL_APROX,
  ULTIMA_ACTUALIZACION,
  calcularCategoria,
} from "./valores";

export default function Formalizate() {
  const [pais, setPais] = useState<"Uruguay" | "Argentina">("Uruguay"); // 👈 NUEVO
  const [tareasHechas, setTareasHechas] = useState<string[]>([]);
  const [cargado, setCargado] = useState(false);
  const [facturacion, setFacturacion] = useState("");

  // Definimos las tareas según el país
  const TAREAS = pais === "Uruguay" ? [
    { id: "rut", texto: "Obtuve mi RUT en DGI" },
    { id: "regimen", texto: "Elegí mi régimen (Monotributo / General)" },
    { id: "bps", texto: "Me dí de alta en BPS" },
    { id: "factura", texto: "Configuré facturación electrónica" },
    { id: "primera", texto: "Emití mi primera factura" },
  ] : [
    { id: "cuit", texto: "Obtuve mi CUIT en ARCA (ex AFIP)" },
    { id: "clave", texto: "Generé mi Clave Fiscal" },
    { id: "monotributo", texto: "Me inscribí en el Monotributo" },
    { id: "obra_social", texto: "Elegí mi Obra Social" },
    { id: "factura", texto: "Configuré facturación electrónica" },
  ];

  useEffect(() => {
    // Cargamos el progreso del país seleccionado
    const guardado = localStorage.getItem(`formalizate_progreso_${pais}`);
    if (guardado) {
      try {
        setTareasHechas(JSON.parse(guardado));
      } catch {
        setTareasHechas([]);
      }
    } else {
      setTareasHechas([]);
    }
    setCargado(true);
  }, [pais]);

  const toggleTarea = (id: string) => {
    const nuevas = tareasHechas.includes(id)
      ? tareasHechas.filter((t) => t !== id)
      : [...tareasHechas, id];

    setTareasHechas(nuevas);
    localStorage.setItem(`formalizate_progreso_${pais}`, JSON.stringify(nuevas));
  };

  const categoriaCalculada = () => {
    const monto = Number(facturacion.replace(/[^\d]/g, ""));
    if (!monto || monto <= 0) return null;
    return calcularCategoria(monto);
  };

  const catInfo = categoriaCalculada();
  const progreso = Math.round((tareasHechas.length / TAREAS.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        
        {/* 👈 NUEVO: SELECTOR DE PAÍS */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex gap-2">
            <button
              onClick={() => setPais("Uruguay")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${pais === "Uruguay" ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              🇺🇾 Soy de Uruguay
            </button>
            <button
              onClick={() => setPais("Argentina")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${pais === "Argentina" ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              🇦🇷 Soy de Argentina
            </button>
          </div>
        </div>

        {/* HERO */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-slate-800">
            Formalizate como unipersonal en {pais}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Si trabajás por tu cuenta, formalizarte te da respaldo legal,
            aportes jubilatorios y obra social. Acá te contamos los pasos.
          </p>
        </section>

        {/* QUE ES */}
        <section className="mb-10 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">¿Qué es ser unipersonal?</h2>
          <p className="text-slate-700 mb-3">
            Unipersonal es la forma más simple de trabajar por tu cuenta de
            manera formal. No necesitás socios, ni escribir una sociedad
            anónima, ni contratar a nadie. Vos sola/o trabajás, emitís
            facturas y aportás al sistema.
          </p>
          <p className="text-slate-700">
            Es ideal para electricistas, plomeros, diseñadores, programadores,
            limpiadores, docentes particulares y cualquier persona que brinde
            un servicio de forma independiente.
          </p>
        </section>

        {/* PASOS ADAPTADOS AL PAÍS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">
            Los pasos para formalizarte en {pais}
          </h2>

          {pais === "Uruguay" ? (
            // --- GUÍA URUGUAY ---
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="text-xl font-bold text-slate-800">Alta en DGI (RUT)</h3>
                </div>
                <p className="text-slate-700 mb-3">Lo primero es obtener tu <strong>RUT</strong> en la Dirección General Impositiva. Podés hacerlo 100% online.</p>
                <a href="https://www.gub.uy/direccion-general-impositiva/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-medium">→ Ir al sitio de DGI</a>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="text-xl font-bold text-slate-800">Monotributo o Régimen General</h3>
                </div>
                <p className="text-slate-700">La mayoría elige <strong>Monotributo</strong> (un solo pago mensual). Si facturás mucho, necesitás Régimen General.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <h3 className="text-xl font-bold text-slate-800">Alta en BPS</h3>
                </div>
                <p className="text-slate-700 mb-3">El Banco de Previsión Social te da aporte jubilatorio y obra social. Si tenés menos de 30 años, hay descuentos.</p>
                <a href="https://www.bps.gub.uy/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-medium">→ Ir al sitio de BPS</a>
              </div>
            </div>
          ) : (
            // --- GUÍA ARGENTINA ---
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="text-xl font-bold text-slate-800">Obtener el CUIT en ARCA</h3>
                </div>
                <p className="text-slate-700 mb-3">Antes llamado AFIP. Es el registro único donde vas a declarar tu actividad. Podés iniciarlo online con tu Clave Fiscal.</p>
                <a href="https://www.afip.gob.ar/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-medium">→ Ir al sitio de ARCA</a>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="text-xl font-bold text-slate-800">Inscribirse en el Monotributo</h3>
                </div>
                <p className="text-slate-700">En Argentina, el Monotributo unifica impuestos y jubilación en una sola cuota mensual. Es ideal para empezar.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <h3 className="text-xl font-bold text-slate-800">Elegir Obra Social</h3>
                </div>
                <p className="text-slate-700">Al inscribirte en el Monotributo, podés elegir una Obra Social para vos y tu familia.</p>
              </div>
            </div>
          )}
        </section>

        {/* CHECKLIST ADAPTADO */}
        <section className="mb-10 bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Mi progreso en {pais}</h2>
          <p className="text-slate-500 mb-6 text-sm">Marcá cada paso a medida que lo vas completando.</p>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2 font-medium">
              <span>Progreso: {tareasHechas.length} de {TAREAS.length}</span>
              <span className="text-sky-600">{progreso}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-sky-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }}></div>
            </div>
          </div>

          <div className="space-y-3">
            {TAREAS.map((tarea) => {
              const hecha = tareasHechas.includes(tarea.id);
              return (
                <button
                  key={tarea.id}
                  onClick={() => toggleTarea(tarea.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition border ${hecha ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200 hover:border-sky-300"}`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${hecha ? "bg-green-500 border-green-500 text-white" : "border-slate-300 bg-white"}`}>
                    {hecha && "✓"}
                  </div>
                  <span className={hecha ? "text-green-800 line-through font-medium" : "text-slate-700 font-medium"}>
                    {tarea.texto}
                  </span>
                </button>
              );
            })}
          </div>

          {progreso === 100 && (
            <div className="mt-6 bg-green-100 border border-green-300 rounded-xl p-4 text-center">
              <p className="text-green-800 font-bold text-lg">🎉 ¡Felicitaciones!</p>
              <p className="text-sm text-green-700 mt-1">Completaste todos los pasos para formalizarte en {pais}.</p>
            </div>
          )}
        </section>

        {/* CALCULADORA (Solo Uruguay por ahora) */}
        {pais === "Uruguay" && (
          <section className="mb-10 bg-green-50 border border-green-200 shadow-sm rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-2 text-green-900">🧮 Calculadora de aportes (Uruguay)</h2>
            <p className="text-green-800 mb-6 text-sm">Ingresá cuánto pensás facturar por mes y te calculamos qué categoría te corresponde.</p>

            <div className="mb-4">
              <input
                type="text"
                value={facturacion}
                onChange={(e) => setFacturacion(e.target.value)}
                placeholder="Facturación mensual en pesos uruguayos (ej: 30000)"
                className="w-full border border-green-300 rounded-xl px-4 py-3 outline-none focus:border-green-600 bg-white"
              />
            </div>

            {catInfo ? (
              <div className="bg-white rounded-xl border border-green-200 p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-700">Categoría de Monotributo:</span>
                  <span className="font-bold text-lg text-green-700">{catInfo.categoria}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Monotributo:</span>
                  <span className="font-medium">$ {catInfo.montoMensual.toLocaleString("es-UY")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">BPS (aprox):</span>
                  <span className="font-medium">$ {BPS_MENSUAL_APROX.toLocaleString("es-UY")}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="font-bold text-slate-900">Total mensual:</span>
                  <span className="font-bold text-xl text-green-700">$ {(catInfo.montoMensual + BPS_MENSUAL_APROX).toLocaleString("es-UY")}</span>
                </div>
              </div>
            ) : facturacion ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">Si facturás eso, superás el tope de Monotributo. Consultá por el <strong>Régimen General</strong>.</p>
              </div>
            ) : null}
            <p className="text-xs text-slate-500 mt-4 italic">⚠️ Valores aproximados. Última actualización: {ULTIMA_ACTUALIZACION}.</p>
          </section>
        )}

        {/* PLANTILLAS */}
        <section className="mb-10 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">Plantillas descargables</h2>
          <p className="text-slate-600 mb-5">Modelos listos para adaptar a tu trabajo.</p>

          <div className="grid md:grid-cols-3 gap-4">
            <a href="/plantillas/modelo-factura.txt" download className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-sky-300 transition text-center bg-slate-50">
              <div className="text-3xl mb-3">📄</div>
              <p className="font-medium text-slate-800 mb-1">Modelo de factura</p>
              <p className="text-xs text-slate-500">Descargar</p>
            </a>
            <a href="/plantillas/contrato-servicios.txt" download className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-sky-300 transition text-center bg-slate-50">
              <div className="text-3xl mb-3">📝</div>
              <p className="font-medium text-slate-800 mb-1">Contrato de servicios</p>
              <p className="text-xs text-slate-500">Descargar</p>
            </a>
            <a href="/plantillas/recibo-pago.txt" download className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-sky-300 transition text-center bg-slate-50">
              <div className="text-3xl mb-3">💰</div>
              <p className="font-medium text-slate-800 mb-1">Recibo de pago</p>
              <p className="text-xs text-slate-500">Descargar</p>
            </a>
          </div>
        </section>

        {/* CONSEJOS */}
        <section className="mb-10 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">Consejos prácticos</h2>
          <ul className="space-y-3 text-slate-700">
            <li>✅ <strong>Asesorate con un contador.</strong> Te va a ahorrar errores y plata.</li>
            <li>✅ <strong>Llevá registro de tus facturas.</strong> Un Excel alcanza al principio.</li>
            <li>✅ <strong>Guardá plata para los aportes.</strong> Cada mes vas a tener que pagar.</li>
            <li>✅ <strong>Si dejás de facturar, podés dar de baja</strong> o cambiar de categoría.</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-sky-600 text-white rounded-3xl p-8 text-center shadow-lg shadow-sky-200">
          <h3 className="text-2xl font-bold mb-3">¿Ya estás formalizado?</h3>
          <p className="mb-5 opacity-90">Actualizá tu perfil en Conecta y mostrá que trabajás de forma legal. Da más confianza a tus clientes.</p>
          <Link href="/perfil/editar" className="inline-block bg-white text-sky-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
            Editar mi perfil
          </Link>
        </section>

        <Link href="/" className="inline-block mt-8 text-sky-600 hover:underline font-medium">← Volver al inicio</Link>
      </main>
    </div>
  );
}
