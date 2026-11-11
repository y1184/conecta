"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MONOTRIBUTO,
  BPS_MENSUAL_APROX,
  ULTIMA_ACTUALIZACION,
  calcularCategoria,
} from "./valores";

type Tarea = {
  id: string;
  texto: string;
};

const TAREAS: Tarea[] = [
  { id: "rut", texto: "Obtuve mi RUT en DGI" },
  { id: "regimen", texto: "Elegí mi régimen (Monotributo / General)" },
  { id: "bps", texto: "Me dí de alta en BPS" },
  { id: "factura", texto: "Configuré facturación electrónica" },
  { id: "primera", texto: "Emití mi primera factura" },
];

export default function Formalizate() {
  const [tareasHechas, setTareasHechas] = useState<string[]>([]);
  const [cargado, setCargado] = useState(false);
  const [facturacion, setFacturacion] = useState("");

  useEffect(() => {
    const guardado = localStorage.getItem("formalizate_progreso");
    if (guardado) {
      try {
        setTareasHechas(JSON.parse(guardado));
      } catch {
        setTareasHechas([]);
      }
    }
    setCargado(true);
  }, []);

  const toggleTarea = (id: string) => {
    const nuevas = tareasHechas.includes(id)
      ? tareasHechas.filter((t) => t !== id)
      : [...tareasHechas, id];

    setTareasHechas(nuevas);
    localStorage.setItem("formalizate_progreso", JSON.stringify(nuevas));
  };

  const categoriaCalculada = () => {
    const monto = Number(facturacion.replace(/[^\d]/g, ""));
    if (!monto || monto <= 0) return null;
    return calcularCategoria(monto);
  };

  const catInfo = categoriaCalculada();

  const progreso = Math.round((tareasHechas.length / TAREAS.length) * 100);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            Conecta
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* HERO */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Formalizate como unipersonal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Si trabajás por tu cuenta, formalizarte te da respaldo legal,
            aportes jubilatorios y obra social. Acá te contamos los pasos.
          </p>
        </section>

        {/* QUE ES */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">¿Qué es ser unipersonal?</h2>
          <p className="text-gray-700 mb-3">
            Unipersonal es la forma más simple de trabajar por tu cuenta de
            manera formal. No necesitás socios, ni escribir una sociedad
            anónima, ni contratar a nadie. Vos sola/o trabajás, emitís
            facturas y aportás al sistema.
          </p>
          <p className="text-gray-700">
            Es ideal para electricistas, plomeros, diseñadores, programadores,
            limpiadores, docentes particulares y cualquier persona que brinde
            un servicio de forma independiente.
          </p>
        </section>

        {/* PASOS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">
            Los 5 pasos para formalizarte
          </h2>

          <div className="mb-8 border-l-4 border-blue-600 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold">Alta en DGI (RUT)</h3>
            </div>
            <p className="text-gray-700 mb-3">
              Lo primero es obtener tu <strong>RUT</strong> (Registro Único
              Tributario) en la Dirección General Impositiva.
            </p>
            <p className="text-gray-700 mb-3">
              Podés hacerlo <strong>100% online</strong> desde el sitio de DGI,
              con tu cédula de identidad y una contraseña que generás vos misma.
            </p>
            <a
              href="https://www.gub.uy/direccion-general-impositiva/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-medium"
            >
              → Ir al sitio de DGI
            </a>
          </div>

          <div className="mb-8 border-l-4 border-blue-600 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold">
                Elegir Monotributo o Régimen General
              </h3>
            </div>
            <p className="text-gray-700 mb-4">
              Hay dos formas de tributar. La mayoría de los trabajadores
              independientes eligen <strong>Monotributo</strong> por ser más
              simple.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                <p className="font-bold text-blue-800 mb-2">✅ Monotributo</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Un solo pago mensual</li>
                  <li>• Incluye IVA, IRPF y otros tributos</li>
                  <li>• Facturación hasta cierto tope</li>
                  <li>• Ideal si estás empezando</li>
                </ul>
              </div>

              <div className="border border-gray-200 bg-gray-50 rounded-xl p-4">
                <p className="font-bold text-gray-800 mb-2">
                  📋 Régimen General
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Múltiples impuestos por separado</li>
                  <li>• IVA + IRPF + otros</li>
                  <li>• Facturación sin tope</li>
                  <li>• Requiere contador</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8 border-l-4 border-blue-600 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold">Alta en BPS</h3>
            </div>
            <p className="text-gray-700 mb-3">
              El Banco de Previsión Social es el que te da:
            </p>
            <ul className="text-gray-700 space-y-1 mb-3">
              <li>• <strong>Aporte jubilatorio</strong> (tu futuro)</li>
              <li>• <strong>Obra social</strong> (para vos y tu familia)</li>
              <li>• <strong>Cobertura por enfermedad</strong></li>
            </ul>
            <p className="text-gray-700 mb-3">
              Si tenés menos de 30 años, tenés{" "}
              <strong>descuentos importantes</strong> los primeros años.
            </p>
            <a
              href="https://www.bps.gub.uy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-medium"
            >
              → Ir al sitio de BPS
            </a>
          </div>

          <div className="mb-8 border-l-4 border-blue-600 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold">Facturación electrónica</h3>
            </div>
            <p className="text-gray-700 mb-3">
              Cuando cobrás por un servicio, tenés que emitir una factura
              electrónica. Hay varias formas:
            </p>
            <ul className="text-gray-700 space-y-1 mb-3">
              <li>• <strong>Facturas gratuitas de DGI</strong> (hasta cierto tope)</li>
              <li>• <strong>Sistemas pagos</strong> (más cómodos, mensuales)</li>
              <li>• <strong>Contador</strong> que te las emite</li>
            </ul>
            <p className="text-gray-700">
              Para empezar, las gratuitas de DGI alcanzan perfecto.
            </p>
          </div>

          <div className="mb-8 border-l-4 border-blue-600 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                5
              </div>
              <h3 className="text-xl font-bold">Empezar a facturar</h3>
            </div>
            <p className="text-gray-700">
              Listo. Ya podés trabajar formalmente, emitir facturas, aportar a
              tu jubilación y tener obra social. Cada mes vas a pagar tu
              Monotributo y tu BPS según tu categoría.
            </p>
          </div>
        </section>

        {/* CHECKLIST */}
        <section className="mb-10 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-2">Mi progreso</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Marcá cada paso a medida que lo vas completando. Se guarda
            automáticamente en tu navegador.
          </p>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Progreso: {tareasHechas.length} de {TAREAS.length}
              </span>
              <span className="font-medium">{progreso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-sky-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            {TAREAS.map((tarea) => {
              const hecha = tareasHechas.includes(tarea.id);
              return (
                <button
                  key={tarea.id}
                  onClick={() => toggleTarea(tarea.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                    hecha
                      ? "bg-green-50 border border-green-200"
                      : "bg-white border border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      hecha
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {hecha && "✓"}
                  </div>
                  <span
                    className={
                      hecha ? "text-green-800 line-through" : "text-gray-700"
                    }
                  >
                    {tarea.texto}
                  </span>
                </button>
              );
            })}
          </div>

          {progreso === 100 && (
            <div className="mt-6 bg-green-100 border border-green-300 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">
                🎉 ¡Felicitaciones! Completaste todos los pasos.
              </p>
              <p className="text-sm text-green-700 mt-1">
                Ya sos unipersonal formalizado.
              </p>
            </div>
          )}
        </section>

        {/* CALCULADORA */}
        <section className="mb-10 bg-green-50 border border-green-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-2">
            🧮 Calculadora de aportes
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Ingresá cuánto pensás facturar por mes y te calculamos
            aproximadamente qué categoría te corresponde y cuánto pagarías.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Facturación mensual estimada (en pesos uruguayos)
            </label>
            <input
              type="text"
              value={facturacion}
              onChange={(e) => setFacturacion(e.target.value)}
              placeholder="Ej: 30000"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-green-600 bg-white"
            />
          </div>

          {catInfo ? (
            <div className="bg-white rounded-xl border border-green-200 p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-700">
                  Categoría de Monotributo:
                </span>
                <span className="font-bold text-lg text-green-700">
                  {catInfo.categoria}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Monotributo:</span>
                <span className="font-medium">
                  $ {catInfo.montoMensual.toLocaleString("es-UY")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">BPS (aprox):</span>
                <span className="font-medium">
                  $ {BPS_MENSUAL_APROX.toLocaleString("es-UY")}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900">Total mensual:</span>
                <span className="font-bold text-xl text-green-700">
                  ${" "}
                  {(
                    catInfo.montoMensual + BPS_MENSUAL_APROX
                  ).toLocaleString("es-UY")}
                </span>
              </div>
            </div>
          ) : facturacion ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                Si facturás eso por mes, superás el tope de Monotributo.
                Deberías consultar por el <strong>Régimen General</strong>.
              </p>
            </div>
          ) : null}

          <p className="text-xs text-gray-500 mt-4 italic">
            ⚠️ Valores aproximados. Última actualización:{" "}
            {ULTIMA_ACTUALIZACION}. Verificá los valores reales en{" "}
            <a
              href="https://www.gub.uy/direccion-general-impositiva/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline"
            >
              DGI
            </a>{" "}
            y{" "}
            <a
              href="https://www.bps.gub.uy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline"
            >
              BPS
            </a>
            .
          </p>
        </section>

        {/* PLANTILLAS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Plantillas descargables</h2>
          <p className="text-gray-700 mb-5">
            Modelos listos para adaptar a tu trabajo. Descargalos, editálos
            y usálos cuando los necesites.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/plantillas/modelo-factura.txt"
              download
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition text-center"
            >
              <div className="text-3xl mb-3">📄</div>
              <p className="font-medium mb-1">Modelo de factura</p>
              <p className="text-xs text-gray-500">Descargar</p>
            </a>

            <a
              href="/plantillas/contrato-servicios.txt"
              download
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition text-center"
            >
              <div className="text-3xl mb-3">📝</div>
              <p className="font-medium mb-1">Contrato de servicios</p>
              <p className="text-xs text-gray-500">Descargar</p>
            </a>

            <a
              href="/plantillas/recibo-pago.txt"
              download
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition text-center"
            >
              <div className="text-3xl mb-3">💰</div>
              <p className="font-medium mb-1">Recibo de pago</p>
              <p className="text-xs text-gray-500">Descargar</p>
            </a>
          </div>
        </section>

        {/* CUANTO SE PAGA */}
        <section className="mb-10 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-3">
            💰 ¿Cuánto se paga por mes?
          </h2>
          <p className="text-gray-700 mb-3">
            El monto depende de tu <strong>categoría de Monotributo</strong>{" "}
            (que se calcula según lo que facturás por año) y del{" "}
            <strong>BPS</strong>.
          </p>
          <p className="text-gray-700 mb-3">
            <strong>Ojo:</strong> los montos cambian todos los años. Antes de
            tomar decisiones, verificá los valores actuales en los sitios de
            DGI y BPS.
          </p>
          <p className="text-sm text-gray-600 italic">
            💡 Tip: si estás empezando y facturás poco, la categoría más baja
            suele ser muy accesible.
          </p>
        </section>

        {/* CONSEJOS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Consejos prácticos</h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              ✅ <strong>Asesorate con un contador.</strong> Aunque sea una
              consulta puntual, te va a ahorrar errores y plata.
            </li>
            <li>
              ✅ <strong>Llevá registro de tus facturas.</strong> Un Excel o un
              cuaderno alcanza al principio.
            </li>
            <li>
              ✅ <strong>Guardá plata para los aportes.</strong> Cada mes vas a
              tener que pagar Monotributo + BPS.
            </li>
            <li>
              ✅ <strong>Podés deducir gastos.</strong> Si comprás herramientas,
              materiales o servicios necesarios, algunos se pueden deducir.
            </li>
            <li>
              ✅ <strong>Si dejás de facturar, podés dar de baja</strong> o
              cambiar de categoría.
            </li>
          </ul>
        </section>

        {/* LINKS OFICIALES */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Links oficiales útiles</h2>
          <div className="space-y-2">
            <a
              href="https://www.gub.uy/direccion-general-impositiva/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sky-600 hover:underline"
            >
              → DGI (Dirección General Impositiva)
            </a>
            <a
              href="https://www.bps.gub.uy/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sky-600 hover:underline"
            >
              → BPS (Banco de Previsión Social)
            </a>
            <a
              href="https://www.gub.uy/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sky-600 hover:underline"
            >
              → Portal del Estado Uruguayo
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sky-600 text-white rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">¿Ya estás formalizado?</h3>
          <p className="mb-5 opacity-90">
            Actualizá tu perfil en Conecta y mostrá que trabajás de forma
            legal. Da más confianza a tus clientes.
          </p>
          <Link
            href="/perfil/editar"
            className="inline-block bg-white text-sky-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100"
          >
            Editar mi perfil
          </Link>
        </section>

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
