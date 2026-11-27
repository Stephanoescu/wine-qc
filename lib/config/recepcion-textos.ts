// ============================================================
// Textos del asistente de Recepción (listas de verificación y avisos)
// ------------------------------------------------------------
// Los `id` de cada ítem deben ser únicos en todo el asistente:
// el estado de las casillas se guarda por id en el borrador.
// ============================================================

import type { ClaveParametroVisual } from "@/lib/recepcion/tipos";

export interface ItemChecklist {
  id: string;
  texto: string;
}

/** Nombres cortos para la barra de pasos (9 pasos). */
export const PASOS_ASISTENTE = [
  "Identificación",
  "Instrumentos",
  "Carga y pesado",
  "Muestreo",
  "Inspección",
  "°Brix",
  "pH",
  "Acidez",
  "Decisión",
] as const;

// ── Paso 2 ────────────────────────────────────────────────
export const CHECK_INSTRUMENTOS: ItemChecklist[] = [
  { id: "p2.1", texto: "Mesa de inspección y bandejas" },
  { id: "p2.2", texto: "Recipientes para “materia extraña” y “uva dañada”" },
  { id: "p2.3", texto: "Ficha del lote, etiquetas y bolsas con cierre" },
  { id: "p2.4", texto: "Balanza" },
  { id: "p2.5", texto: "Termómetro de sonda, funda y estuche" },
  { id: "p2.6", texto: "Colador, gotero y vasos de trabajo" },
  { id: "p2.7", texto: "Refractómetro" },
  { id: "p2.8", texto: "Medidor de pH con electrodo, tapa y soporte" },
  { id: "p2.9", texto: "Agua destilada, papel suave y solución de conservación" },
  { id: "p2.10", texto: "Productos y útiles de limpieza" },
];

// ── Paso 3 ────────────────────────────────────────────────
export const CHECK_CARGA: ItemChecklist[] = [
  {
    id: "p3a.1",
    texto:
      "Identifique todas las jabas (carga recepcionada) con el mismo código de lote. Para distinguirlas, asigne un número diferente a cada caja (rotule las jabas) y déjelo visible por fuera.",
  },
  {
    id: "p3a.2",
    texto:
      "Observe las cajas, los racimos y cualquier líquido que esté en contacto con la uva. Busque vidrio, metal, excrementos, rastros de combustible, aceite u otros productos químicos.",
  },
];

/** Id del ítem de carga junto al que va el control "¿Hay observaciones?". */
export const ID_CHECK_CARGA_OBSERVACIONES = "p3a.2";

export const ATAJO_LIQUIDO_DESCONOCIDO = "Líquido de origen desconocido";

export const AVISO_INSPECCIONAR_CARGA =
  "Inspeccionar carga: revise las jabas observadas antes de continuar con la descarga.";

export const CHECK_PESADO: ItemChecklist[] = [
  { id: "p3b.1", texto: "Con la balanza vacía, compruebe que la pantalla marque cero." },
  {
    id: "p3b.2",
    texto:
      "Ponga una caja llena en la balanza. Anote su número y el peso que indica la pantalla. Repita con cada caja.",
  },
  {
    id: "p3b.3",
    texto:
      "Para cada caja, use el peso vacío de esa misma caja, registrado antes del llenado. Si aún no dispone de él, anote el peso lleno y complete la tara cuando la descarga esté autorizada.",
  },
  {
    id: "p3b.4",
    texto:
      "Reste el peso vacío al peso lleno y sume los netos de las cajas. Si usó la función TARA para descontar esa caja vacía, la lectura ya corresponde al neto.",
  },
];

// ── Paso 4 ────────────────────────────────────────────────
export function textoTamanoMuestra(n: number): string {
  return `Seleccione al azar ${n} jabas que debe inspeccionar (realice la toma desde distintas zonas y niveles de la carga).`;
}

export const TEMPERATURA_CONFORME = "Conforme";
export const TEMPERATURA_NO_CONFORME = "No conforme — Avise a Enología";

export const CHECK_PREPARACION_MUESTRA: ItemChecklist[] = [
  {
    id: "p4a.1",
    texto:
      "De las cajas seleccionadas de diferentes sectores de la carga, colóquela sobre la mesa limpia de inspección.",
  },
  {
    id: "p4a.2",
    texto:
      "Mire la caja desde arriba y ubique su centro. Ese es el punto por donde entrará la sonda hasta quedar entre las uvas.",
  },
];

export const CHECK_TEMPERATURA: ItemChecklist[] = [
  { id: "p4b.1", texto: "Retire la funda de la sonda y déjela en la bandeja de utensilios limpios." },
  {
    id: "p4b.2",
    texto:
      "Introduzca la sonda por el centro de la caja hasta quedar entre las uvas. Verifique que toda la parte sensible indicada en el manual toque la fruta. Evite apoyar la punta de la sonda en el fondo o las paredes.",
  },
  {
    id: "p4b.3",
    texto:
      "Mantenga quieta la sonda hasta que el equipo indique que la lectura está estable. Lea los °C, anote el valor junto al número de caja y saque la sonda.",
  },
  {
    id: "p4b.4",
    texto:
      "Antes de medir la siguiente caja, lave la parte de la sonda que tocó la uva y enjuáguela con agua potable. Deje escurrir y secar al aire antes de medir otra caja. Al finalizar, coloque la funda en la sonda limpia y seca y guarde el termómetro en su estuche.",
  },
];

export const CHECK_MUESTRA_BAYAS: ItemChecklist[] = [
  {
    id: "p4c.1",
    texto:
      "Después de medir la temperatura, rotule una bolsa limpia con cierre. Escriba el mismo código del lote, la fecha y la hora.",
  },
  {
    id: "p4c.2",
    texto:
      "Elija 20 racimos en total, repartidos entre las cajas seleccionadas. Tome racimos de distintas posiciones, sin escogerlos por su aspecto.",
  },
  {
    id: "p4c.3",
    texto:
      "Retire cinco bayas de cada racimo. Tome dos de arriba, una del centro y dos de abajo, alternando los lados. Ponga las bayas sin lavar en la bolsa. Deje el resto de cada racimo en su caja.",
  },
  {
    id: "p4c.4",
    texto: "Cierre la bolsa y pésela con las bayas. Reserve la bolsa cerrada e identificada para preparar el jugo.",
  },
];

// ── Paso 5 ────────────────────────────────────────────────
export const INSTRUCCIONES_INSPECCION_CAJAS: string[] = [
  "Revise una jaba seleccionada a la vez. Coloque la jaba sobre la mesa de inspección. Saque los racimos uno a uno sobre la mesa limpia y gírelos para ver ambos lados. Mire también el fondo de la caja. Registre el hallazgo. Adjunte una foto si corresponde.",
  "Busque hojas sueltas, tierra, piedras, plástico o madera. Observe la uva para detectar piel rota, arrugamiento, manchas marrones, moho o descomposición. Si percibe olor a vinagre o fermentación, registre el hallazgo.",
];

export interface DefinicionParametroVisual {
  clave: ClaveParametroVisual;
  nombre: string;
  descripcion: string;
  /** Imagen de referencia en /public; null si no hay. */
  imagen: string | null;
}

/** Tarjetas del paso 5, en el orden en que se muestran. */
export const PARAMETROS_VISUALES: DefinicionParametroVisual[] = [
  {
    clave: "podredumbre",
    nombre: "Podredumbre / Moho",
    descripcion:
      "Bayas con crecimiento fúngico visible, descomposición, tejido blando o presencia de olores anormales.",
    imagen: "/images/moho.jpeg",
  },
  {
    clave: "bayasDaniadas",
    nombre: "Bayas dañadas",
    descripcion: "Bayas con ruptura de piel, pérdida de jugo, aplastamiento o daño mecánico evidente.",
    imagen: "/images/daniadas.png",
  },
  {
    clave: "deshidratacion",
    nombre: "Deshidratación",
    descripcion: "Bayas con arrugamiento marcado, pérdida de turgencia o signos evidentes de deshidratación.",
    imagen: "/images/deshidratacion.png",
  },
  {
    clave: "bayasVerdes",
    nombre: "Bayas verdes",
    descripcion:
      "Bayas con desarrollo insuficiente de color, textura o condición aparente respecto del resto del lote.",
    imagen: "/images/verdes.jpeg",
  },
  {
    clave: "materiaExtrana",
    nombre: "Materia extraña",
    descripcion: "Hojas, tallos en exceso, tierra, piedras, plástico, madera, insectos u otros materiales ajenos a la uva.",
    imagen: "/images/extrana.png",
  },
  {
    clave: "olorVinagre",
    nombre: "Olor a vinagre / fermentación",
    descripcion:
      "Olor agrio, a vinagre o a fermentación al abrir la caja o al manipular los racimos. Puede indicar bayas rotas que ya empezaron a fermentar.",
    imagen: null,
  },
];

export const AVISO_PARAMETRO_OBSERVADO =
  "Identifique y aísle el lote, y avise a Calidad. Registre la decisión de Enología.";

export const INSTRUCCION_SEPARACION =
  "Para los hallazgos, use dos recipientes limpios. Ponga las impurezas en el recipiente rotulado «Materia extraña» y las bayas dañadas en el recipiente rotulado «Uva dañada».";

// ── Paso 6 ────────────────────────────────────────────────
export const CHECK_BRIX: ItemChecklist[] = [
  {
    id: "p6.1",
    texto:
      "Cierre la bolsa previamente pesada y presione las bayas suavemente desde afuera hasta obtener jugo, sin triturar las semillas.",
  },
  {
    id: "p6.2",
    texto:
      "Mezcle el jugo dentro de la bolsa. Abra la bolsa y vierta el jugo a través de un colador limpio colocado sobre un vaso limpio identificado con el código del lote.",
  },
  {
    id: "p6.3",
    texto:
      "Use ese vaso como fuente del jugo. Reserve tres porciones para °Brix, dos para pH y una porción para entregar al laboratorio para el análisis de acidez.",
  },
  {
    id: "p6.4",
    texto:
      "Mezcle el jugo del vaso identificado. Con el gotero limpio coloque jugo suficiente para cubrir el prisma del refractómetro. Lea los °Brix que muestra y anote el primer valor como B1.",
  },
  {
    id: "p6.5",
    texto:
      "Retire el jugo del prisma, límpielo y séquelo. Aplique una porción nueva del mismo jugo y anote la segunda lectura como B2. Repita la limpieza, el secado y la carga con otra porción para obtener B3.",
  },
];

export const AVISO_BRIX_RONDA1 =
  "Laboratorio: revise el control del refractómetro y repita las tres lecturas con jugo nuevo.";
export const AVISO_BRIX_RONDA2 = "No conforme — Retenga el lote para Enología";

// ── Paso 7 ────────────────────────────────────────────────
export const CHECK_PH: ItemChecklist[] = [
  {
    id: "p7a.1",
    texto:
      "Mezcle el jugo del vaso del lote sin agregar agua. Repártalo en dos vasos limpios identificados con el lote y los números 1 y 2. Use suficiente jugo para cubrir la zona sensible del electrodo.",
  },
  {
    id: "p7a.2",
    texto:
      "Retire la tapa y enjuague el electrodo con agua destilada. Introdúzcalo en el vaso 1. Sumerja el bulbo (la punta de vidrio) y la unión de referencia (la zona próxima a la punta) hasta la profundidad indicada por el fabricante. Evite tocar las paredes y el fondo.",
  },
  {
    id: "p7a.3",
    texto:
      "Espere la señal de estabilidad y lea el pH. Regístrelo como pH1. Si el medidor muestra la temperatura, léala con el sensor aún en el jugo y anótela en °C. Enjuague el electrodo, retire el exceso de agua sin frotar y repita la medición de pH en el vaso 2 para obtener pH2.",
  },
  {
    id: "p7a.4",
    texto:
      "Calcule el promedio y la diferencia entre la lectura mayor y la menor. Mantenga el jugo de los dos vasos separado del vaso original.",
  },
];

export const AVISO_PH_RONDA1 =
  "Pida al laboratorio que revise el control del medidor y repita con dos porciones nuevas.";
export const AVISO_PH_RONDA2 = "Se confirma — Retenga el lote para Enología";

export const CHECK_ELECTRODO: ItemChecklist[] = [
  {
    id: "p7b.1",
    texto:
      "Retire el electrodo del vaso de jugo y enjuáguelo con agua destilada. Tome la tapa y la solución de conservación que el fabricante indica para ese electrodo.",
  },
  {
    id: "p7b.2",
    texto:
      "Ponga en la tapa suficiente solución de conservación para que, al colocarla, el bulbo y la unión queden húmedos. Coloque la tapa protegiendo la punta.",
  },
  {
    id: "p7b.3",
    texto: "Sujete el electrodo en su soporte. Guarde el medidor limpio y seco en la zona de instrumentos.",
  },
];

// ── Paso 8 ────────────────────────────────────────────────
export const CHECK_ACIDEZ: ItemChecklist[] = [
  {
    id: "p8.1",
    texto:
      "Entregue al laboratorio jugo suficiente para dos ensayos de 10,0 mL. Use un vaso limpio identificado con el código del lote y tome el jugo.",
  },
  {
    id: "p8.2",
    texto:
      "Al recibir el resultado, coteje el código de lote. Compruebe que el informe indique el método, el punto final y el valor en g/L como ácido tartárico.",
  },
];

export const AVISO_ACIDEZ_FUERA = "Solicite al laboratorio que confirme el resultado.";

// ── Paso 9 ────────────────────────────────────────────────
export const CHECK_FINAL: ItemChecklist[] = [
  {
    id: "p9.1",
    texto:
      "Compruebe que el destino esté limpio, que su código coincida con el lote y que la autorización corresponda a ese destino.",
  },
  {
    id: "p9.2",
    texto:
      "Limpie el colador, las bandejas y los vasos con el material autorizado. Guarde el termómetro limpio, seco y protegido, el refractómetro con el prisma limpio y el electrodo como se indicó.",
  },
];
