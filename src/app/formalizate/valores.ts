// ==========================================================
// VALORES DE MONOTRIBUTO Y BPS
// ==========================================================
//
// ⚠️ IMPORTANTE: estos son valores aproximados de referencia.
// Actualizalos cuando cambien (generalmente cada año).
//
// Los valores reales están en:
// - Monotributo: https://www.gub.uy/direccion-general-impositiva/
// - BPS: https://www.bps.gub.uy/
//
// Fecha de última actualización:
// ==========================================================

export const ULTIMA_ACTUALIZACION = "Octubre 2026";

// ==========================================================
// MONOTRIBUTO
// ==========================================================
// Cada categoría tiene un monto mensual fijo.
// El topeAnual es el máximo que podés facturar por año
// para estar en esa categoría.

export const MONOTRIBUTO = [
  { categoria: 1, topeAnual: 208_000, montoMensual: 2_500 },
  { categoria: 2, topeAnual: 312_000, montoMensual: 3_600 },
  { categoria: 3, topeAnual: 416_000, montoMensual: 5_000 },
  { categoria: 4, topeAnual: 624_000, montoMensual: 8_300 },
  { categoria: 5, topeAnual: 832_000, montoMensual: 11_600 },
  { categoria: 6, topeAnual: 1_040_000, montoMensual: 15_500 },
  { categoria: 7, topeAnual: 1_248_000, montoMensual: 19_900 },
  { categoria: 8, topeAnual: 1_560_000, montoMensual: 25_400 },
];

// ==========================================================
// BPS (aporte mensual aproximado)
// ==========================================================
// El monto varía según la edad y la situación familiar.
// Este es un valor promedio para simplificar.

export const BPS_MENSUAL_APROX = 3_000;

// ==========================================================
// FUNCIONES AUXILIARES
// ==========================================================

// Dada una facturación mensual, devuelve la categoría
// de Monotributo que le corresponde.
export function calcularCategoria(facturacionMensual: number) {
  const facturacionAnual = facturacionMensual * 12;

  for (const cat of MONOTRIBUTO) {
    if (facturacionAnual <= cat.topeAnual) {
      return cat;
    }
  }

  // Si supera todas las categorías, no califica para Monotributo
  return null;
}
