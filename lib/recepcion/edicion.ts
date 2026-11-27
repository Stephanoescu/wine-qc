// ============================================================
// Edición de un lote guardado (A6): el asistente se reabre con los
// datos del lote, se calculan las diferencias para la bitácora y se
// aplican las reglas de estado. Funciones puras.
// ============================================================
import { DECIMALES, LECTURAS_POR_RONDA } from "@/lib/config/recepcion";
import {
  CHECK_ACIDEZ,
  CHECK_BRIX,
  CHECK_CARGA,
  CHECK_ELECTRODO,
  CHECK_FINAL,
  CHECK_INSTRUMENTOS,
  CHECK_MUESTRA_BAYAS,
  CHECK_PESADO,
  CHECK_PH,
  CHECK_PREPARACION_MUESTRA,
  CHECK_TEMPERATURA,
  ETIQUETAS_BRIX,
  ETIQUETAS_PH,
  PARAMETROS_VISUALES,
} from "@/lib/config/recepcion-textos";
import type { Rol } from "@/lib/config/roles";
import { fotosDelLote } from "./almacen";
import { nuevoId } from "./borrador";
import {
  conBitacora,
  conHistorial,
  construirLote,
  recalcularLote,
  textoPesoDisponible,
  type CambioSinFirma,
} from "./lote";
import { BORRADOR_ESQUEMA, type BorradorLote, type ClaveParametroVisual, type LoteV2, type ParamVisualBorrador } from "./tipos";
import { formatear } from "./validacion";

/** Número como lo escribiría el usuario (coma decimal). */
function txt(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n).replace(".", ",");
}

const TODAS_LAS_LISTAS = [
  CHECK_INSTRUMENTOS,
  CHECK_CARGA,
  CHECK_PESADO,
  CHECK_PREPARACION_MUESTRA,
  CHECK_TEMPERATURA,
  CHECK_MUESTRA_BAYAS,
  CHECK_BRIX,
  CHECK_PH,
  CHECK_ELECTRODO,
  CHECK_ACIDEZ,
  CHECK_FINAL,
];

function rondasTexto(rondas: { lecturas: number[] }[], lecturas: number): string[][] {
  return [0, 1].map((r) => Array.from({ length: lecturas }, (_, i) => txt(rondas[r]?.lecturas[i])));
}

/** Borrador del asistente con los datos de un lote guardado (para editarlo). */
export function loteABorrador(l: LoteV2): BorradorLote {
  const checks: Record<string, boolean> = {};
  // Las listas ya se completaron al registrar el lote.
  for (const lista of TODAS_LAS_LISTAS) for (const i of lista) checks[i.id] = true;

  const temps = new Map(l.muestreo.temperaturas.map((t) => [t.jaba, t.temperatura]));
  const parametros = Object.fromEntries(
    PARAMETROS_VISUALES.map((p) => {
      const v = l.cajas.parametros.find((x) => x.clave === p.clave);
      const valor: ParamVisualBorrador = {
        observado: v ? v.observado : false,
        fotoIds: v?.fotoIds ?? [],
        comentario: v?.comentario ?? "",
      };
      return [p.clave, valor];
    }),
  ) as Record<ClaveParametroVisual, ParamVisualBorrador>;

  // Firma vigente según el estado (se corrige en el paso 9 de la edición).
  const firma =
    l.estado === "RECHAZADO" || l.liberadoConObservaciones
      ? l.enologia
      : l.estado === "LIBERADO"
        ? l.disposicion
        : undefined;

  return {
    esquema: BORRADOR_ESQUEMA,
    paso: 1,
    checks,
    identificacion: {
      proveedor: l.proveedor,
      origen: l.origen,
      fecha: l.fecha,
      hora: l.hora,
      variedad: l.variedad,
      numJabas: String(l.numJabas),
      codigoLote: l.codigoLote,
    },
    carga: {
      hayObservaciones: l.carga.hayObservaciones,
      observaciones: l.carga.observaciones.map((o) => ({
        id: nuevoId(),
        jaba: String(o.jaba),
        descripcion: o.descripcion,
        fotoIds: o.fotoIds ?? [],
      })),
    },
    pesado: {
      usoFuncionTara: l.pesado.usoFuncionTara,
      jabas: l.pesado.jabas.map((j) => ({
        pesoLleno: txt(j.pesoLleno),
        tara: j.taraPendiente || l.pesado.usoFuncionTara ? "" : txt(j.tara),
        taraPendiente: j.taraPendiente,
      })),
    },
    muestreo: {
      filas: l.muestreo.jabasSeleccionadas.map((j) => ({ id: nuevoId(), jaba: String(j), temperatura: txt(temps.get(j)) })),
      pesoBolsaG: txt(l.muestreo.pesoBolsaBayasG),
    },
    cajas: {
      parametros,
      decisionEnologia: l.cajas.decisionEnologia ?? "",
      materiaExtranaKg: txt(l.cajas.materiaExtranaKg),
      uvaDaniadaKg: txt(l.cajas.uvaDaniadaKg),
    },
    brix: { rondas: rondasTexto(l.brix.rondas, LECTURAS_POR_RONDA.brix) },
    ph: { rondas: rondasTexto(l.ph.rondas, LECTURAS_POR_RONDA.ph) },
    acidez: {
      pendiente: l.acidez.pendiente,
      metodo: l.acidez.metodo,
      puntoFinal: l.acidez.puntoFinal,
      valor: txt(l.acidez.valor),
      confirmado: l.acidez.confirmadoPorLab === undefined ? null : l.acidez.confirmadoPorLab,
    },
    decision: {
      estado: l.estado,
      nombre: firma?.nombre ?? l.responsable ?? "",
      rol: firma?.rol ?? l.responsableRol ?? "",
      destino: firma?.destino ?? "",
      motivo: firma?.motivo ?? "",
    },
    edicion: { por: "", rol: "", motivo: "", trituracionInformada: false },
  };
}

// ─────────────────────────────────────────
// Diferencias para la bitácora
// ─────────────────────────────────────────
const kg = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${formatear(n, DECIMALES.kg)} kg`);
const siNo = (b: boolean | undefined) => (b ? "Sí" : "No");

/** Lista plana «campo → valor legible» de los datos editables (no de los derivados). */
function campos(l: LoteV2): Map<string, string> {
  const m = new Map<string, string>();
  const put = (k: string, v: string | number | null | undefined) => m.set(k, v === null || v === undefined || v === "" ? "—" : String(v));

  put("Código de lote", l.codigoLote);
  put("Proveedor / Viña", l.proveedor);
  put("Origen", l.origen);
  put("Variedad", l.variedad);
  put("Fecha de ingreso", l.fecha);
  put("Hora de ingreso", l.hora);
  put("Número de jabas", l.numJabas);

  put("Carga · ¿hay observaciones?", siNo(l.carga.hayObservaciones));
  l.carga.observaciones.forEach((o, i) => {
    put(`Observación de carga ${i + 1}`, `Jaba N° ${o.jaba}: ${o.descripcion}`);
    put(`Observación de carga ${i + 1} · fotos`, (o.fotoIds ?? []).length);
  });

  put("Pesado · función TARA", siNo(l.pesado.usoFuncionTara));
  for (const j of l.pesado.jabas) {
    put(`Jaba N° ${j.numero} · ${l.pesado.usoFuncionTara ? "peso neto" : "peso lleno"}`, kg(j.pesoLleno));
    if (!l.pesado.usoFuncionTara) put(`Jaba N° ${j.numero} · tara`, j.taraPendiente ? "Pendiente" : kg(j.tara));
  }

  put("Muestreo · jabas seleccionadas", l.muestreo.jabasSeleccionadas.join(", "));
  for (const t of l.muestreo.temperaturas) {
    put(`Temperatura · jaba N° ${t.jaba}`, `${formatear(t.temperatura, DECIMALES.temperatura)} °C`);
  }
  put("Peso de la bolsa con bayas", `${formatear(l.muestreo.pesoBolsaBayasG, 2, 0)} g`);

  for (const p of l.cajas.parametros) {
    const nombre = PARAMETROS_VISUALES.find((d) => d.clave === p.clave)?.nombre ?? p.clave;
    put(`${nombre} · resultado`, p.observado ? "Se observa" : "No se observa");
    if (p.observado) {
      put(`${nombre} · comentario`, p.comentario);
      put(`${nombre} · fotos`, p.fotoIds.length);
    }
  }
  put("Decisión de Enología (inspección)", l.cajas.decisionEnologia);
  put("Materia extraña", kg(l.cajas.materiaExtranaKg));
  put("Uva dañada", kg(l.cajas.uvaDaniadaKg));

  const lecturas = (nombre: string, etiquetas: readonly (readonly string[])[], rondas: LoteV2["brix"]["rondas"], dec: number) => {
    rondas.forEach((r, ri) =>
      r.lecturas.forEach((v, i) => put(`${nombre} · ${ri + 1}.ª ronda · ${etiquetas[ri]?.[i] ?? i + 1}`, formatear(v, dec))),
    );
    if (rondas.length < 2) put(`${nombre} · 2.ª ronda`, "No aplica");
  };
  lecturas("°Brix", ETIQUETAS_BRIX, l.brix.rondas, DECIMALES.brix);
  lecturas("pH", ETIQUETAS_PH, l.ph.rondas, DECIMALES.ph);

  put("Acidez · pendiente", siNo(l.acidez.pendiente));
  if (!l.acidez.pendiente) {
    put("Acidez · método", l.acidez.metodo);
    put("Acidez · punto final", l.acidez.puntoFinal);
    put("Acidez · valor", l.acidez.valor === null ? null : `${formatear(l.acidez.valor, DECIMALES.acidez)} g/L`);
    if (l.acidez.confirmadoPorLab !== undefined) put("Acidez · confirmada por el laboratorio", siNo(l.acidez.confirmadoPorLab));
  }

  if (l.disposicion) {
    put("Disposición · autorizado por", l.disposicion.nombre);
    put("Disposición · rol", l.disposicion.rol);
    put("Disposición · destino", l.disposicion.destino);
  }
  if (l.enologia) {
    put("Enología · confirmado por", l.enologia.nombre);
    put("Enología · motivo", l.enologia.motivo);
    put("Enología · destino", l.enologia.destino);
  }
  if (l.responsable) {
    put("Responsable del registro", l.responsable);
    put("Responsable del registro · rol", l.responsableRol);
  }

  // Derivados que interesan a otros (se registran si cambian)
  put("Peso disponible", textoPesoDisponible(l.pesoDisponible));
  put("Estado", l.estado);
  return m;
}

/** Cambios entre dos versiones del lote, campo por campo. */
export function diffLote(antes: LoteV2, despues: LoteV2): CambioSinFirma[] {
  const a = campos(antes);
  const d = campos(despues);
  const claves = [...new Set([...a.keys(), ...d.keys()])];
  const out: CambioSinFirma[] = [];
  for (const k of claves) {
    const va = a.get(k) ?? "—";
    const vd = d.get(k) ?? "—";
    if (va !== vd) out.push({ campo: k, anterior: va, nuevo: vd });
  }
  return out;
}

// ─────────────────────────────────────────
// Aplicar la edición
// ─────────────────────────────────────────
export interface FirmaEdicion {
  por: string;
  rol: Rol;
  motivo: string;
}

export interface ResultadoEdicion {
  lote: LoteV2;
  cambios: CambioSinFirma[];
  /** Pasa de LIBERADO a RETENIDO por la edición. */
  retenidoPorEdicion: boolean;
  /** El peso disponible cambió (hay que informar a Trituración si está vinculada). */
  cambiaPesoDisponible: boolean;
  /** Fotos del lote original que ya no se usan (se borran al guardar). */
  fotosQuitadas: string[];
}

const claveMotivo = (m: { paso: number; parametro: string; detalle: string }) => `${m.paso}|${m.parametro}|${m.detalle}`;

/**
 * Lote resultante de la edición (sin guardar). Reglas:
 * - Se recalculan todos los derivados.
 * - LIBERADO + una no conformidad nueva → RETENIDO con el motivo «Edición posterior».
 * - RETENIDO sigue RETENIDO (si ya no hay motivos, el detalle ofrece liberar con firma).
 * - RECHAZADO sigue RECHAZADO.
 * - Se corrigen las firmas vigentes con los datos del paso 9.
 */
export function previsualizarEdicion(antes: LoteV2, b: BorradorLote, firma: FirmaEdicion, ahora: string): ResultadoEdicion {
  const reconstruido = construirLote(b, antes.id, antes.savedAt);
  const d = b.decision;
  const nombre = d.nombre.trim();
  const rolDecision = d.rol || undefined;

  let lote: LoteV2 = {
    ...reconstruido,
    estado: antes.estado,
    historial: antes.historial,
    bitacora: antes.bitacora ?? [],
    savedAt: antes.savedAt,
    updatedAt: antes.updatedAt,
    liberadoConObservaciones: antes.liberadoConObservaciones,
    disposicion: antes.disposicion,
    enologia: antes.enologia,
    responsable: antes.responsable,
    responsableRol: antes.responsableRol,
    retenidoPorEdicion: antes.retenidoPorEdicion,
  };

  // Firmas corregidas en el paso 9 (sin cambiar quién/cuándo decidió el estado).
  if (antes.estado === "LIBERADO" && lote.disposicion) {
    // Liberado con observaciones: la firma que se corrige es la de Enología (abajo); aquí solo el destino.
    lote.disposicion = antes.liberadoConObservaciones
      ? { ...lote.disposicion, destino: d.destino.trim() }
      : { ...lote.disposicion, nombre, rol: rolDecision, destino: d.destino.trim() };
  }
  if ((antes.estado === "RECHAZADO" || antes.liberadoConObservaciones) && lote.enologia) {
    lote.enologia = { ...lote.enologia, nombre, destino: d.destino.trim(), motivo: d.motivo.trim() };
  }
  if (antes.estado === "RETENIDO") {
    lote.responsable = nombre || undefined;
    lote.responsableRol = nombre ? rolDecision : undefined;
  }

  // Motivos de datos (sin la retención por edición) antes y después.
  const sinEdicion = (l: LoteV2) => l.motivos.filter((m) => m.parametro !== "Edición posterior");
  const antesClaves = new Set(sinEdicion(antes).map(claveMotivo));
  const nuevosMotivos = sinEdicion(reconstruido).filter((m) => !antesClaves.has(claveMotivo(m)));

  let retenido = false;
  if (antes.estado === "LIBERADO" && nuevosMotivos.length > 0) {
    retenido = true;
    lote = {
      ...lote,
      estado: "RETENIDO",
      liberadoConObservaciones: undefined,
      disposicion: undefined,
      enologia: undefined,
      retenidoPorEdicion: { fecha: ahora, por: firma.por.trim(), rol: firma.rol, motivo: firma.motivo.trim() },
    };
  } else if (lote.retenidoPorEdicion && sinEdicion(reconstruido).length === 0) {
    // Una edición posterior eliminó todas las no conformidades: se puede liberar con firma.
    lote = { ...lote, retenidoPorEdicion: undefined };
  }

  // Recalcular motivos y sugerido con la marca de edición actualizada (el estado no cambia).
  const final = recalcularLote(lote);
  const cambios = diffLote(antes, final);
  const antesFotos = new Set(fotosDelLote(antes));
  const despuesFotos = new Set(fotosDelLote(final));
  return {
    lote: final,
    cambios,
    retenidoPorEdicion: retenido,
    cambiaPesoDisponible: textoPesoDisponible(antes.pesoDisponible) !== textoPesoDisponible(final.pesoDisponible),
    fotosQuitadas: [...antesFotos].filter((f) => !despuesFotos.has(f)),
  };
}

/**
 * Aplica la edición: agrega la bitácora (con la firma de quien edita),
 * una entrada en el historial y, si corresponde, el aviso a Trituración.
 */
export function aplicarEdicion(
  antes: LoteV2,
  b: BorradorLote,
  firma: FirmaEdicion,
  opciones: { trituracionVinculada: boolean; trituracionInformada: boolean },
  ahora: string,
): ResultadoEdicion {
  const r = previsualizarEdicion(antes, b, firma, ahora);
  if (r.cambios.length === 0) throw new Error("No hay cambios que guardar.");
  if (opciones.trituracionVinculada && r.cambiaPesoDisponible && !opciones.trituracionInformada) {
    throw new Error("Confirme que Trituración fue informada del cambio del peso disponible.");
  }
  const cambios = [...r.cambios];
  if (opciones.trituracionVinculada && r.cambiaPesoDisponible) {
    cambios.push({ campo: "Aviso a Trituración", anterior: "—", nuevo: "Trituración fue informada del cambio del peso disponible" });
  }
  const f = { nombre: firma.por, rol: firma.rol };
  let lote = conHistorial(
    r.lote,
    f,
    ahora,
    r.retenidoPorEdicion ? `Informe editado; pasa a RETENIDO por edición posterior. Motivo: ${firma.motivo.trim()}` : `Informe editado. Motivo: ${firma.motivo.trim()}`,
  );
  lote = conBitacora(lote, cambios, f, firma.motivo, ahora);
  return { ...r, lote, cambios };
}

/** Qué falta para guardar la edición (paso 9 en modo edición). */
export function faltantesEdicion(
  antes: LoteV2,
  b: BorradorLote,
  vista: ResultadoEdicion,
  opciones: { trituracionVinculada: boolean; codigoDuplicado: boolean },
): string[] {
  const f: string[] = [];
  const e = b.edicion;
  if (opciones.codigoDuplicado) {
    f.push(`El código de lote «${b.identificacion.codigoLote.trim()}» ya existe: cámbielo en el paso 1`);
  }
  if (vista.cambios.length === 0) f.push("No hay cambios que guardar");
  if (!e || !e.por.trim() || !e.rol || !e.motivo.trim()) f.push("Complete Editado por, Rol y Motivo de la edición");
  if (!vista.retenidoPorEdicion) {
    const d = b.decision;
    if (antes.estado === "LIBERADO" && !antes.liberadoConObservaciones && (!d.nombre.trim() || !d.rol || !d.destino.trim())) {
      f.push("Complete la disposición: Autorizado por, Rol y Destino");
    }
    if ((antes.estado === "RECHAZADO" || antes.liberadoConObservaciones) && (!d.nombre.trim() || !d.destino.trim() || !d.motivo.trim())) {
      f.push("Complete los datos de Enología: Confirmado por, Motivo y Destino");
    }
  }
  if (opciones.trituracionVinculada && vista.cambiaPesoDisponible && !e?.trituracionInformada) {
    f.push("Confirme que Trituración fue informada del cambio del peso disponible");
  }
  return f;
}
