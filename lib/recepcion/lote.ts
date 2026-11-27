// ============================================================
// Lote guardado (formato v2): construcción desde el borrador,
// motivos de no conformidad, estado sugerido, decisión del paso 9
// y acciones del detalle (completar pendientes, cambiar estado).
// Funciones puras: la fecha y el id los pasa quien llama.
// ============================================================
import { DECIMALES, DESCUENTOS_PESO_DISPONIBLE, LIMITES_ENTRADA, RANGOS } from "@/lib/config/recepcion";
import { ROL_ENOLOGIA, type Rol } from "@/lib/config/roles";
import { CHECK_FINAL, PARAMETROS_VISUALES } from "@/lib/config/recepcion-textos";
import { listaCorta, porcentajeSobre, temperaturaConforme, validarTaraJaba } from "./evaluacion";
import {
  estadoPaso3,
  estadoPaso4,
  estadoPaso5,
  estadoPaso6,
  estadoPaso7,
  estadoPaso8,
  numJabasValido,
  type EstadoPaso,
} from "./pasos";
import type {
  BorradorLote,
  CambioBitacora,
  EstadoLote,
  JabaPesada,
  LoteV2,
  Motivo,
  PesoDisponible,
  Ronda,
} from "./tipos";
import { formatear, redondear, validarNumero } from "./validacion";

export const NOMBRE_ESTADO: Record<EstadoLote, string> = {
  LIBERADO: "Liberado",
  RETENIDO: "Retenido",
  RECHAZADO: "Rechazado",
};

const NOMBRE_PARAMETRO = Object.fromEntries(PARAMETROS_VISUALES.map((p) => [p.clave, p.nombre])) as Record<
  string,
  string
>;

// ─────────────────────────────────────────
// Construcción desde el borrador
// ─────────────────────────────────────────
function aRonda(r: { valores: (number | null)[]; promedio: number | null; conforme: boolean | null; diferencia: number | null }, conDiferencia: boolean): Ronda {
  return {
    lecturas: r.valores.map((v) => v ?? 0),
    promedio: r.promedio ?? 0,
    conforme: r.conforme === true,
    ...(conDiferencia && r.diferencia !== null ? { diferencia: r.diferencia } : {}),
  };
}

/**
 * Lote con los datos del asistente y los campos derivados calculados.
 * El estado queda igual al sugerido; la decisión del paso 9 se aplica con `aplicarDecision`.
 */
export function construirLote(b: BorradorLote, id: string, ahora: string): LoteV2 {
  const ident = b.identificacion;
  const numJabas = numJabasValido(ident);
  const e3 = estadoPaso3(b);
  const e4 = estadoPaso4(b);
  const e5 = estadoPaso5(b);
  const e6 = estadoPaso6(b);
  const e7 = estadoPaso7(b);
  const e8 = estadoPaso8(b);
  const usoTara = b.pesado.usoFuncionTara;

  const jabas: JabaPesada[] = e3.pesado.filas.map((f) => ({
    numero: f.numero,
    pesoLleno: f.lleno ?? 0,
    tara: usoTara || f.taraPendiente || f.lleno === null || f.neto === null ? null : redondear(f.lleno - f.neto),
    neto: f.neto,
    taraPendiente: f.taraPendiente,
  }));

  const observados = PARAMETROS_VISUALES.filter((p) => b.cajas.parametros[p.clave].observado === true);
  const a = b.acidez;

  const base: LoteV2 = {
    version: 2,
    id,
    codigoLote: ident.codigoLote.trim(),
    proveedor: ident.proveedor.trim(),
    origen: ident.origen.trim(),
    variedad: ident.variedad,
    fecha: ident.fecha,
    hora: ident.hora,
    numJabas,
    carga: {
      hayObservaciones: b.carga.hayObservaciones === true,
      observaciones:
        b.carga.hayObservaciones === true
          ? b.carga.observaciones
              .filter((o) => o.descripcion.trim() !== "")
              .map((o) => ({
                jaba: validarNumero(o.jaba, { min: 1, entero: true }).valor ?? 0,
                descripcion: o.descripcion.trim(),
                fotoIds: o.fotoIds ?? [],
              }))
          : [],
    },
    pesado: { usoFuncionTara: usoTara, jabas, pesoNetoTotal: 0, parcial: false },
    muestreo: {
      jabasSeleccionadas: e4.seleccion,
      temperaturas: e4.filas
        .filter((f) => f.jaba !== null && f.temperatura !== null)
        .map((f) => ({ jaba: f.jaba as number, temperatura: f.temperatura as number, conforme: f.conforme === true })),
      pesoBolsaBayasG: validarNumero(b.muestreo.pesoBolsaG, LIMITES_ENTRADA.pesoBolsaBayasG).valor ?? 0,
    },
    cajas: {
      parametros: PARAMETROS_VISUALES.map((p) => {
        const v = b.cajas.parametros[p.clave];
        const observado = v.observado === true;
        return {
          clave: p.clave,
          observado,
          fotoIds: observado ? v.fotoIds : [],
          ...(observado && v.comentario.trim() ? { comentario: v.comentario.trim() } : {}),
        };
      }),
      ...(observados.length ? { decisionEnologia: b.cajas.decisionEnologia.trim() } : {}),
      materiaExtranaKg: e5.materiaExtranaKg ?? 0,
      uvaDaniadaKg: e5.uvaDaniadaKg ?? 0,
      contenidoInspeccionadoKg: 0,
      contenidoProvisional: false,
      materiaExtranaPct: null,
      uvaDaniadaPct: null,
    },
    brix: {
      rondas: e6.rondas.rondas.slice(0, e6.rondas.rondasUsadas).map((r) => aRonda(r, false)),
      conforme: e6.rondas.resultado === "conforme",
    },
    ph: {
      rondas: e7.rondas.rondas.slice(0, e7.rondas.rondasUsadas).map((r) => aRonda(r, true)),
      conforme: e7.rondas.resultado === "conforme",
    },
    acidez: a.pendiente
      ? { metodo: "", puntoFinal: "", valor: null, pendiente: true, conforme: null }
      : {
          metodo: a.metodo.trim(),
          puntoFinal: a.puntoFinal.trim(),
          valor: e8.acidez.valor,
          pendiente: false,
          ...(e8.acidez.requiereConfirmacion ? { confirmadoPorLab: a.confirmado === true } : {}),
          conforme: e8.acidez.conforme,
        },
    estado: "RETENIDO",
    estadoSugerido: "RETENIDO",
    motivos: [],
    historial: [],
    bitacora: [],
    pesoDisponible: { kg: 0, provisional: false, descuentos: { materiaExtranaKg: 0, uvaDaniadaKg: 0, bolsaMuestraKg: 0 } },
    pesoNeto: 0,
    brixPromedio: null,
    phPromedio: null,
    acidezValor: null,
    savedAt: ahora,
  };
  const lote = recalcularLote(base);
  return { ...lote, estado: lote.estadoSugerido };
}

// ─────────────────────────────────────────
// Campos derivados y motivos
// ─────────────────────────────────────────
/** Recalcula totales, contenido inspeccionado, %, conformidad de acidez, motivos y estado sugerido. */
export function recalcularLote(l: LoteV2): LoteV2 {
  const netos = l.pesado.jabas.map((j) => j.neto);
  const pesoNetoTotal = redondear(netos.reduce<number>((s, n) => s + (n ?? 0), 0));
  const parcial = netos.some((n) => n === null) || l.pesado.jabas.length < l.numJabas;

  let contenido = 0;
  let provisional = false;
  for (const j of l.muestreo.jabasSeleccionadas) {
    const neto = l.pesado.jabas[j - 1]?.neto ?? null;
    if (neto === null) provisional = true;
    else contenido += neto;
  }
  contenido = redondear(contenido);

  const acidez = { ...l.acidez };
  if (!acidez.pendiente && acidez.valor !== null) {
    acidez.conforme = acidez.valor >= RANGOS.acidez.min && acidez.valor <= RANGOS.acidez.max;
    if (acidez.conforme) delete acidez.confirmadoPorLab;
  }

  const ultima = <T,>(arr: T[]): T | undefined => arr[arr.length - 1];
  const sinMotivos: LoteV2 = {
    ...l,
    pesado: { ...l.pesado, pesoNetoTotal, parcial },
    pesoDisponible: calcularPesoDisponible(
      pesoNetoTotal,
      parcial,
      l.cajas.materiaExtranaKg,
      l.cajas.uvaDaniadaKg,
      l.muestreo.pesoBolsaBayasG,
    ),
    bitacora: l.bitacora ?? [],
    cajas: {
      ...l.cajas,
      contenidoInspeccionadoKg: contenido,
      contenidoProvisional: provisional,
      materiaExtranaPct: porcentajeSobre(l.cajas.materiaExtranaKg, contenido),
      uvaDaniadaPct: porcentajeSobre(l.cajas.uvaDaniadaKg, contenido),
    },
    acidez,
    pesoNeto: pesoNetoTotal,
    brixPromedio: ultima(l.brix.rondas)?.promedio ?? null,
    phPromedio: ultima(l.ph.rondas)?.promedio ?? null,
    acidezValor: acidez.pendiente ? null : acidez.valor,
  };
  const motivos = calcularMotivos(sinMotivos);
  return { ...sinMotivos, motivos, estadoSugerido: sugerirEstado(motivos) };
}

/**
 * Peso disponible = neto total − materia extraña − uva dañada − bolsa de muestra (g ÷ 1000),
 * con los descuentos activados en la configuración. Es provisional si hay taras pendientes.
 */
export function calcularPesoDisponible(
  netoTotal: number,
  parcial: boolean,
  materiaExtranaKg: number,
  uvaDaniadaKg: number,
  bolsaG: number,
): PesoDisponible {
  const d = DESCUENTOS_PESO_DISPONIBLE;
  const descuentos = {
    materiaExtranaKg: d.materiaExtrana ? redondear(materiaExtranaKg) : 0,
    uvaDaniadaKg: d.uvaDaniada ? redondear(uvaDaniadaKg) : 0,
    bolsaMuestraKg: d.bolsaMuestra ? redondear(bolsaG / 1000) : 0,
  };
  const kg = redondear(netoTotal - descuentos.materiaExtranaKg - descuentos.uvaDaniadaKg - descuentos.bolsaMuestraKg);
  return { kg: Math.max(0, kg), provisional: parcial, descuentos };
}

/** Lotes v2 guardados antes de estos campos: los completa al leerlos. */
export function normalizarLoteV2(l: LoteV2): LoteV2 {
  if (l.pesoDisponible && l.bitacora) return l;
  return {
    ...l,
    bitacora: l.bitacora ?? [],
    pesoDisponible:
      l.pesoDisponible ??
      calcularPesoDisponible(
        l.pesado.pesoNetoTotal,
        l.pesado.parcial,
        l.cajas.materiaExtranaKg,
        l.cajas.uvaDaniadaKg,
        l.muestreo.pesoBolsaBayasG,
      ),
  };
}

export function textoPesoDisponible(p: PesoDisponible | undefined): string {
  if (!p) return "—";
  return `${formatear(p.kg, DECIMALES.kg)} kg${p.provisional ? " (provisional)" : ""}`;
}

function textoRango(r: { min: number; max: number }, dec: number, unidad = ""): string {
  return `${formatear(r.min, dec)}–${formatear(r.max, dec)}${unidad}`;
}

/** Cada no conformidad del lote, con el paso donde ocurrió. */
export function calcularMotivos(l: LoteV2): Motivo[] {
  const m: Motivo[] = [];

  // Edición posterior de un lote LIBERADO: queda hasta una nueva decisión firmada.
  if (l.retenidoPorEdicion) {
    const r = l.retenidoPorEdicion;
    m.push({ paso: 9, parametro: "Edición posterior", detalle: `${r.motivo} (${r.por}, ${r.rol})`, tipo: "observacion" });
  }

  // Paso 3
  for (const o of l.carga.observaciones) {
    m.push({ paso: 3, parametro: "Observación de carga", detalle: `Jaba N° ${o.jaba}: ${o.descripcion}`, tipo: "observacion" });
  }
  const pendientes = l.pesado.jabas.filter((j) => j.taraPendiente).map((j) => j.numero);
  if (pendientes.length) {
    m.push({
      paso: 3,
      parametro: "Tara pendiente",
      detalle: `Jaba${pendientes.length > 1 ? "s" : ""} N° ${listaCorta(pendientes, 10)}: peso neto total parcial`,
      tipo: "pendiente",
    });
  }

  // Paso 4
  for (const t of l.muestreo.temperaturas) {
    if (!temperaturaConforme(t.temperatura)) {
      m.push({
        paso: 4,
        parametro: "Temperatura",
        detalle: `Jaba N° ${t.jaba}: ${formatear(t.temperatura, DECIMALES.temperatura)} °C (conforme ≤ ${RANGOS.temperatura.maxConforme} °C)`,
        tipo: "fuera_rango",
      });
    }
  }

  // Paso 5
  for (const p of l.cajas.parametros) {
    if (p.observado) {
      m.push({
        paso: 5,
        parametro: NOMBRE_PARAMETRO[p.clave] ?? p.clave,
        detalle: p.comentario ? `Se observa: ${p.comentario}` : "Se observa",
        tipo: "observacion",
      });
    }
  }

  // Pasos 6 y 7: no conforme solo si la 2.ª ronda también queda fuera de rango.
  const medidas = [
    { paso: 6, nombre: "°Brix", datos: l.brix, rango: RANGOS.brix, dec: DECIMALES.brix, rangoDec: 0 },
    { paso: 7, nombre: "pH", datos: l.ph, rango: RANGOS.ph, dec: DECIMALES.ph, rangoDec: 1 },
  ];
  for (const x of medidas) {
    if (x.datos.rondas.length > 0 && !x.datos.conforme) {
      const proms = x.datos.rondas.map((r, i) => `${i + 1}.ª ronda ${formatear(r.promedio, x.dec)}`).join(", ");
      m.push({
        paso: x.paso,
        parametro: x.nombre,
        detalle: `Fuera de rango en ${x.datos.rondas.length} rondas (${proms}; rango ${textoRango(x.rango, x.rangoDec)})`,
        tipo: "fuera_rango",
      });
    }
  }

  // Paso 8
  const a = l.acidez;
  if (a.pendiente) {
    m.push({ paso: 8, parametro: "Acidez pendiente", detalle: "Falta el resultado del laboratorio", tipo: "pendiente" });
  } else if (a.conforme === false && a.valor !== null) {
    const base = `${formatear(a.valor, DECIMALES.acidez)} g/L (rango ${textoRango(RANGOS.acidez, 0, " g/L")})`;
    if (a.confirmadoPorLab) {
      m.push({ paso: 8, parametro: "Acidez", detalle: `${base}, confirmada por el laboratorio`, tipo: "fuera_rango" });
    } else {
      m.push({ paso: 8, parametro: "Acidez", detalle: `${base}; confirmación del laboratorio pendiente`, tipo: "pendiente" });
    }
  }
  return m;
}

/** El sistema solo sugiere LIBERADO o RETENIDO; RECHAZADO lo decide Enología. */
export function sugerirEstado(motivos: Motivo[]): EstadoLote {
  return motivos.length === 0 ? "LIBERADO" : "RETENIDO";
}

// ─────────────────────────────────────────
// Paso 9: decisión
// ─────────────────────────────────────────
export type Decision = BorradorLote["decision"];

export interface EstadoPaso9 extends EstadoPaso {
  motivos: Motivo[];
  sugerido: EstadoLote;
  /** Estado que se guardará (el elegido si está permitido; si no, el sugerido). */
  elegido: EstadoLote;
  permitidos: Record<EstadoLote, boolean>;
  errores: { nombre?: string; rol?: string; destino?: string; motivo?: string };
  /** Peso disponible que se entregará a Trituración (vista previa). */
  pesoDisponible: PesoDisponible;
  pesoNetoTotal: number;
}

export function estadosPermitidos(motivos: Motivo[]): Record<EstadoLote, boolean> {
  const hay = motivos.length > 0;
  // LIBERADO no se puede elegir con cualquier no conformidad; RECHAZADO requiere algo que evaluar.
  return { LIBERADO: !hay, RETENIDO: true, RECHAZADO: hay };
}

/** Errores de los campos de firma según el estado. */
export function validarFirma(
  estado: EstadoLote,
  d: Pick<Decision, "nombre" | "destino" | "motivo"> & { rol?: Rol | "" },
): EstadoPaso9["errores"] {
  const e: EstadoPaso9["errores"] = {};
  const req = "Obligatorio";
  if (estado === "LIBERADO") {
    if (!d.nombre.trim()) e.nombre = req;
    if (!d.rol) e.rol = req;
    if (!d.destino.trim()) e.destino = req;
  } else if (estado === "RECHAZADO") {
    if (!d.nombre.trim()) e.nombre = req;
    if (!d.motivo.trim()) e.motivo = req;
    if (!d.destino.trim()) e.destino = req;
  }
  return e;
}

export function estadoPaso9(b: BorradorLote, opciones: { codigoDuplicado: boolean }): EstadoPaso9 {
  const previo = construirLote(b, "vista-previa", "");
  const motivos = previo.motivos;
  const sugerido = previo.estadoSugerido;
  const permitidos = estadosPermitidos(motivos);
  const elegido = b.decision.estado && permitidos[b.decision.estado] ? b.decision.estado : sugerido;
  const errores = validarFirma(elegido, b.decision);
  const faltantes: string[] = [];

  if (opciones.codigoDuplicado) {
    faltantes.push(`El código de lote «${b.identificacion.codigoLote.trim()}» ya existe: cámbielo en el paso 1`);
  }
  if (elegido === "LIBERADO" && Object.keys(errores).length) {
    faltantes.push("Complete la disposición: Autorizado por, Rol y Destino");
  }
  if (elegido === "RECHAZADO" && Object.keys(errores).length) {
    faltantes.push("Complete los datos de Enología: Confirmado por, Motivo y Destino");
  }
  const marcados = CHECK_FINAL.filter((i) => b.checks[i.id]).length;
  if (marcados < CHECK_FINAL.length) {
    faltantes.push(`Marque todos los ítems de la lista de verificación final (${marcados} de ${CHECK_FINAL.length})`);
  }
  return {
    valido: faltantes.length === 0,
    faltantes,
    motivos,
    sugerido,
    elegido,
    permitidos,
    errores,
    pesoDisponible: previo.pesoDisponible,
    pesoNetoTotal: previo.pesoNeto,
  };
}

/** Aplica la decisión del paso 9 a un lote recién construido. */
export function aplicarDecision(lote: LoteV2, estado: EstadoLote, d: Decision, ahora: string): LoteV2 {
  const nombre = d.nombre.trim();
  const destino = d.destino.trim();
  const motivo = d.motivo.trim();
  const out: LoteV2 = { ...lote, estado };
  const rol: Rol | undefined = estado === "RECHAZADO" ? ROL_ENOLOGIA : d.rol ? d.rol : undefined;
  if (estado === "LIBERADO") out.disposicion = { nombre, rol, destino, fecha: ahora };
  if (estado === "RECHAZADO") out.enologia = { nombre, rol, destino, motivo, fecha: ahora };
  if (estado === "RETENIDO" && nombre) {
    out.responsable = nombre;
    if (rol) out.responsableRol = rol;
  }
  out.historial = [
    {
      estado,
      fecha: ahora,
      por: nombre || "Recepción",
      ...(rol ? { rol } : {}),
      nota: estado === "RECHAZADO" ? `Registro inicial. Motivo: ${motivo}` : "Registro inicial",
    },
  ];
  return out;
}

// ─────────────────────────────────────────
// Detalle: completar pendientes y cambiar estado
// ─────────────────────────────────────────
/** Valida la tara de una jaba con tara pendiente (mismas reglas que el paso 3, incluido el neto máximo). */
export function validarTara(texto: string, pesoLleno: number) {
  const t = validarTaraJaba(texto, pesoLleno);
  return { valor: t.neto === null ? null : t.tara, error: t.error, vacio: t.vacio };
}

/** Quien registra una acción rápida (completar pendientes). */
export interface FirmaAccion {
  nombre: string;
  rol: Rol;
}

const kgTxt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${formatear(n, DECIMALES.kg)} kg`);

/** Completa la tara de las jabas indicadas (N° → kg). Queda en el historial y en la bitácora. */
export function completarTaras(l: LoteV2, taras: Record<number, number>, firma: FirmaAccion, ahora: string): LoteV2 {
  const numeros = Object.keys(taras)
    .map(Number)
    .sort((a, b) => a - b);
  const jabas = l.pesado.jabas.map((j) => {
    const t = taras[j.numero];
    if (t === undefined || !j.taraPendiente) return j;
    return { ...j, tara: t, neto: redondear(j.pesoLleno - t), taraPendiente: false };
  });
  const nuevo = recalcularLote({ ...l, pesado: { ...l.pesado, jabas } });
  const cambios: CambioSinFirma[] = numeros.map((n) => ({ campo: `Jaba N° ${n} · tara`, anterior: "Pendiente", nuevo: kgTxt(taras[n]) }));
  const antes = textoPesoDisponible(l.pesoDisponible);
  const despues = textoPesoDisponible(nuevo.pesoDisponible);
  if (antes !== despues) cambios.push({ campo: "Peso disponible", anterior: antes, nuevo: despues });
  const nota = `Tara completada: jaba${numeros.length > 1 ? "s" : ""} N° ${listaCorta(numeros, 10)}`;
  return conBitacora(conHistorial(nuevo, firma, ahora, nota), cambios, firma, "Completar tara pendiente", ahora);
}

export interface DatosAcidez {
  metodo: string;
  puntoFinal: string;
  valor: number;
  /** Solo si el valor está fuera de rango. */
  confirmadoPorLab?: boolean;
}

export function completarAcidez(l: LoteV2, d: DatosAcidez, firma: FirmaAccion, ahora: string): LoteV2 {
  const conforme = d.valor >= RANGOS.acidez.min && d.valor <= RANGOS.acidez.max;
  const nuevo = recalcularLote({
    ...l,
    acidez: {
      metodo: d.metodo.trim(),
      puntoFinal: d.puntoFinal.trim(),
      valor: d.valor,
      pendiente: false,
      conforme,
      ...(conforme ? {} : { confirmadoPorLab: d.confirmadoPorLab === true }),
    },
  });
  const a = l.acidez;
  const acTxt = (v: number | null) => (v === null ? "—" : `${formatear(v, DECIMALES.acidez)} g/L`);
  const cambios: CambioSinFirma[] = [
    { campo: "Acidez · valor", anterior: a.pendiente ? "Pendiente" : acTxt(a.valor), nuevo: acTxt(d.valor) },
    { campo: "Acidez · método", anterior: a.metodo || "—", nuevo: d.metodo.trim() },
    { campo: "Acidez · punto final", anterior: a.puntoFinal || "—", nuevo: d.puntoFinal.trim() },
  ];
  if (!conforme) {
    cambios.push({
      campo: "Acidez · confirmada por el laboratorio",
      anterior: a.confirmadoPorLab ? "Sí" : "No",
      nuevo: d.confirmadoPorLab ? "Sí" : "No",
    });
  }
  return conBitacora(
    conHistorial(nuevo, firma, ahora, `Acidez registrada: ${acTxt(d.valor)}`),
    cambios.filter((c) => c.anterior !== c.nuevo),
    firma,
    a.pendiente ? "Completar acidez pendiente" : "Confirmación de acidez del laboratorio",
    ahora,
  );
}

export type AccionEstado = "liberar" | "liberarConObservaciones" | "rechazar";

/** Qué cambios de estado admite el lote desde el detalle. */
export function accionesDisponibles(l: LoteV2): Record<AccionEstado, { permitido: boolean; razon?: string }> {
  if (l.estado !== "RETENIDO") {
    const r = `El lote ya está ${NOMBRE_ESTADO[l.estado].toLowerCase()}`;
    return {
      liberar: { permitido: false, razon: r },
      liberarConObservaciones: { permitido: false, razon: r },
      rechazar: { permitido: false, razon: r },
    };
  }
  const hayMotivos = l.motivos.length > 0;
  const hayPendientes = l.motivos.some((m) => m.tipo === "pendiente");
  return {
    liberar: hayMotivos
      ? { permitido: false, razon: "Hay no conformidades: solo puede liberarse con firma de Enología" }
      : { permitido: true },
    liberarConObservaciones: !hayMotivos
      ? { permitido: false, razon: "No hay observaciones: use la liberación normal" }
      : hayPendientes
        ? { permitido: false, razon: "Complete primero los datos pendientes (tara o acidez)" }
        : { permitido: true },
    rechazar: { permitido: true },
  };
}

export function cambiarEstado(
  l: LoteV2,
  accion: AccionEstado,
  d: Pick<Decision, "nombre" | "destino" | "motivo"> & { rol?: Rol | "" },
  ahora: string,
): LoteV2 {
  const disp = accionesDisponibles(l)[accion];
  if (!disp.permitido) throw new Error(disp.razon ?? "Acción no permitida");
  const rol: Rol = accion === "liberar" ? d.rol || "Producción" : ROL_ENOLOGIA;
  const firma = { nombre: d.nombre.trim(), rol, destino: d.destino.trim(), fecha: ahora };
  const motivo = d.motivo.trim();
  // La nueva decisión firmada cierra la retención por edición posterior.
  if (l.retenidoPorEdicion) l = recalcularLote({ ...l, retenidoPorEdicion: undefined });
  let out: LoteV2;
  let nota: string;
  if (accion === "liberar") {
    out = { ...l, estado: "LIBERADO", disposicion: firma };
    nota = `Liberado. Destino: ${firma.destino}`;
  } else if (accion === "liberarConObservaciones") {
    out = { ...l, estado: "LIBERADO", liberadoConObservaciones: true, disposicion: firma, enologia: { ...firma, motivo } };
    nota = `Liberado con observaciones por Enología. Motivo: ${motivo}. Destino: ${firma.destino}`;
  } else {
    out = { ...l, estado: "RECHAZADO", enologia: { ...firma, motivo } };
    nota = `Rechazado por Enología. Motivo: ${motivo}. Destino: ${firma.destino}`;
  }
  return conHistorial(out, firma, ahora, nota);
}

/** Validación de la firma de una acción del detalle. */
export function validarFirmaAccion(
  accion: AccionEstado,
  d: Pick<Decision, "nombre" | "destino" | "motivo"> & { rol?: Rol | "" },
) {
  return validarFirma(accion === "liberar" ? "LIBERADO" : "RECHAZADO", d);
}

export function conHistorial(l: LoteV2, firma: { nombre: string; rol?: Rol }, ahora: string, nota: string): LoteV2 {
  return {
    ...l,
    updatedAt: ahora,
    historial: [
      ...l.historial,
      { estado: l.estado, fecha: ahora, por: firma.nombre.trim() || "—", ...(firma.rol ? { rol: firma.rol } : {}), nota },
    ],
  };
}

export type CambioSinFirma = Omit<CambioBitacora, "por" | "rol" | "motivo" | "fecha">;

/** Agrega cambios a la bitácora con la firma y el motivo. La bitácora solo crece. */
export function conBitacora(l: LoteV2, cambios: CambioSinFirma[], firma: FirmaAccion, motivo: string, ahora: string): LoteV2 {
  if (cambios.length === 0) return l;
  const entradas: CambioBitacora[] = cambios.map((c) => ({
    ...c,
    por: firma.nombre.trim(),
    rol: firma.rol,
    motivo: motivo.trim(),
    fecha: ahora,
  }));
  return { ...l, bitacora: [...(l.bitacora ?? []), ...entradas] };
}
