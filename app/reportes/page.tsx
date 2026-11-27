"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { deleteLote, getLotes } from "@/lib/recepcion/almacen";
import { calcularKPIs, enRango, filaReporte, type FilaReporte } from "@/lib/recepcion/reporte";
import {
  aplicarImportacion,
  analizarRespaldo,
  descargarRespaldo,
  planificarImportacion,
  type PlanImportacion,
  type Respaldo,
} from "@/lib/recepcion/respaldo";
import type { EstadoLote, LoteAlmacenado } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { useEsCliente } from "@/lib/use-es-cliente";
import { Aviso } from "@/components/recepcion/WizardUI";
import { EstadoBadge, ESTILO_ESTADO } from "@/components/lote/EstadoBadge";
import { fechaCorta } from "@/components/lote/InformeLote";

const ESTADOS: EstadoLote[] = ["LIBERADO", "RETENIDO", "RECHAZADO"];
const PLURAL: Record<EstadoLote, string> = { LIBERADO: "Liberados", RETENIDO: "Retenidos", RECHAZADO: "Rechazados" };

// ─────────────────────────────────────────
// KPI
// ─────────────────────────────────────────
const KPI_COLORES = {
  emerald: { icon: "bg-emerald-100 border-emerald-200 text-emerald-600", value: "text-emerald-700" },
  amber: { icon: "bg-amber-100 border-amber-200 text-amber-600", value: "text-amber-700" },
  red: { icon: "bg-red-100 border-red-200 text-red-600", value: "text-red-700" },
  marine: { icon: "bg-marine-light/10 border-marine-light/20 text-marine", value: "text-marine" },
  gold: { icon: "bg-gold/10 border-gold/20 text-gold-dark", value: "text-marine" },
};

function KPICard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  color,
  activo,
  onClick,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  icon: React.ElementType;
  color: keyof typeof KPI_COLORES;
  activo?: boolean;
  onClick?: () => void;
}) {
  const c = KPI_COLORES[color];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": activo } : {})}
      className={`text-left rounded-2xl border bg-white p-4 sm:p-5 flex flex-col gap-3 shadow-sm transition-shadow ${
        activo ? "border-marine ring-2 ring-marine/20" : "border-slate-200"
      } ${onClick ? "hover:shadow-md" : ""}`}
    >
      <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${c.icon}`}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className={`text-3xl font-black font-mono ${c.value}`}>{value}</span>
          {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
        </div>
        {sub && <p className="text-xs font-medium text-slate-500 mt-1">{sub}</p>}
      </div>
    </Comp>
  );
}

// ─────────────────────────────────────────
// Gráfico de distribución por estado
// ─────────────────────────────────────────
function DistribucionEstados({
  conteo,
  total,
  filtro,
  onFiltro,
}: {
  conteo: Record<EstadoLote, number>;
  total: number;
  filtro: EstadoLote | "todos";
  onFiltro: (f: EstadoLote | "todos") => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-200">
          <BarChart3 className="w-5 h-5 text-marine" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-marine">Distribución por estado</h3>
          <p className="text-xs font-medium text-slate-500">{total} lotes registrados en este dispositivo</p>
        </div>
      </div>
      {total === 0 ? (
        <p className="text-sm font-medium text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
          Sin datos aún. Registre el primer lote en{" "}
          <Link href="/recepcion" className="text-gold-dark hover:underline font-bold">
            Recepción
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="flex h-8 rounded-xl overflow-hidden gap-0.5 shadow-inner bg-slate-100" aria-hidden>
            {ESTADOS.map((e) => {
              const pct = (conteo[e] / total) * 100;
              return pct > 0 ? (
                <div
                  key={e}
                  className={`${ESTILO_ESTADO[e].barra} flex items-center justify-center`}
                  style={{ width: `${pct}%` }}
                  title={`${PLURAL[e]}: ${conteo[e]} (${pct.toFixed(1)}%)`}
                >
                  {pct > 10 && <span className="text-xs font-bold text-white drop-shadow-sm">{pct.toFixed(0)}%</span>}
                </div>
              ) : null;
            })}
          </div>
          <div className="flex flex-col gap-3">
            {ESTADOS.map((e) => {
              const pct = (conteo[e] / total) * 100;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => onFiltro(filtro === e ? "todos" : e)}
                  aria-pressed={filtro === e}
                  className={`flex items-center gap-3 rounded-lg p-1 -m-1 text-left ${filtro === e ? "bg-slate-100" : "hover:bg-slate-50"}`}
                >
                  <span className="w-28 flex-shrink-0">
                    <EstadoBadge estado={e} />
                  </span>
                  <span className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <span className={`block h-full ${ESTILO_ESTADO[e].barra} rounded-full`} style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-right flex-shrink-0 w-20">
                    <span className="text-sm font-black text-marine font-mono">{conteo[e]}</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">({pct.toFixed(1)}%)</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Tabla (escritorio) y tarjetas (móvil)
// ─────────────────────────────────────────
type Orden = "fecha" | "proveedor" | "estado" | "brix" | "ph" | "acidez" | "pesoNeto";

function celdaMedida(f: FilaReporte, medida: "brix" | "ph" | "acidez") {
  const dec = medida === "brix" ? DECIMALES.brix : medida === "ph" ? DECIMALES.ph : DECIMALES.acidez;
  if (medida === "acidez" && f.acidezPendiente) return <span className="text-amber-700 font-sans text-xs font-bold">Pendiente</span>;
  const ok = enRango(medida, f);
  const color = ok === null ? "text-slate-600" : ok ? "text-emerald-600" : "text-red-600";
  return <span className={color}>{formatear(f[medida], dec)}</span>;
}

function EtiquetaEstado({ f }: { f: FilaReporte }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <EstadoBadge estado={f.estado} />
      {f.legacy && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
          formato anterior
        </span>
      )}
      {f.liberadoConObservaciones && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
          con obs.
        </span>
      )}
    </span>
  );
}

function TablaLotes({
  filas,
  total,
  onEliminar,
}: {
  filas: FilaReporte[];
  total: number;
  onEliminar: (f: FilaReporte) => void;
}) {
  const [orden, setOrden] = useState<{ k: Orden; dir: 1 | -1 }>({ k: "fecha", dir: -1 });
  const ordenadas = [...filas].sort((a, b) => {
    const val = (f: FilaReporte): string | number => {
      switch (orden.k) {
        case "fecha":
          return f.orden;
        case "proveedor":
          return f.proveedor.toLowerCase();
        case "estado":
          return ESTADOS.indexOf(f.estado);
        default:
          return f[orden.k] ?? -Infinity;
      }
    };
    const va = val(a);
    const vb = val(b);
    const c = typeof va === "string" && typeof vb === "string" ? va.localeCompare(vb) : (va as number) - (vb as number);
    return c * orden.dir;
  });

  function alternar(k: Orden) {
    setOrden((o) => (o.k === k ? { k, dir: o.dir === 1 ? -1 : 1 } : { k, dir: k === "fecha" ? -1 : 1 }));
  }

  const columnas: { k: string; label: string; orden?: Orden; der?: boolean }[] = [
    { k: "lote", label: "Lote" },
    { k: "proveedor", label: "Proveedor", orden: "proveedor" },
    { k: "origen", label: "Origen" },
    { k: "variedad", label: "Variedad" },
    { k: "fecha", label: "Fecha", orden: "fecha" },
    { k: "jabas", label: "Jabas", der: true },
    { k: "peso", label: "Peso neto kg", orden: "pesoNeto", der: true },
    { k: "brix", label: "°Brix", orden: "brix", der: true },
    { k: "ph", label: "pH", orden: "ph", der: true },
    { k: "acidez", label: "Acidez g/L", orden: "acidez", der: true },
    { k: "estado", label: "Estado", orden: "estado" },
    { k: "acc", label: "" },
  ];

  if (ordenadas.length === 0) {
    return (
      <div className="py-16 text-center bg-slate-50">
        <p className="text-slate-500 text-sm font-medium">
          {total === 0 ? "Aún no hay lotes registrados en este dispositivo." : "No hay lotes para el filtro seleccionado."}
        </p>
        {total === 0 && (
          <Link href="/recepcion" className="text-sm font-bold text-gold-dark hover:underline mt-3 inline-block">
            → Registrar primer lote
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Móvil: tarjetas */}
      <ul className="md:hidden divide-y divide-slate-100">
        {ordenadas.map((f) => (
          <li key={f.id}>
            <Link href={`/reportes/${encodeURIComponent(f.id)}`} className="flex items-start gap-3 px-4 py-3.5 active:bg-slate-50">
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-marine truncate">{f.codigoLote}</span>
                  <span className="text-xs font-mono text-slate-500 flex-shrink-0">{fechaCorta(f.fecha)}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 truncate">
                  {f.proveedor} · {f.origen || "—"} · {f.variedad}
                </p>
                <p className="text-xs font-mono text-slate-600 flex flex-wrap gap-x-3">
                  <span>{f.numJabas ?? "—"} jabas</span>
                  <span>
                    {formatear(f.pesoNeto, DECIMALES.kg)} kg{f.pesoParcial ? "*" : ""}
                  </span>
                  <span>°Bx {celdaMedida(f, "brix")}</span>
                  <span>pH {celdaMedida(f, "ph")}</span>
                  <span>Ac. {celdaMedida(f, "acidez")}</span>
                </p>
                <EtiquetaEstado f={f} />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" />
            </Link>
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {columnas.map((c) => (
                <th
                  key={c.k}
                  className={`px-3 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50/50 ${
                    c.der ? "text-right" : "text-left"
                  }`}
                >
                  {c.orden ? (
                    <button type="button" onClick={() => alternar(c.orden as Orden)} className="inline-flex items-center gap-0.5 hover:text-marine uppercase">
                      {c.label}
                      {orden.k === c.orden ? (
                        orden.dir === 1 ? (
                          <ChevronUp className="w-3 h-3 text-gold-dark" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gold-dark" />
                        )
                      ) : (
                        <span className="text-slate-300 ml-0.5">↕</span>
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ordenadas.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href={`/reportes/${encodeURIComponent(f.id)}`} className="font-mono text-xs font-bold text-marine hover:text-gold-dark hover:underline">
                    {f.codigoLote}
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-700 font-medium max-w-[140px] truncate">{f.proveedor}</td>
                <td className="px-3 py-3 text-slate-500 font-medium max-w-[120px] truncate">{f.origen || "—"}</td>
                <td className="px-3 py-3 text-slate-500 font-medium whitespace-nowrap">{f.variedad}</td>
                <td className="px-3 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{fechaCorta(f.fecha)}</td>
                <td className="px-3 py-3 text-right font-mono text-slate-600">{f.numJabas ?? "—"}</td>
                <td className="px-3 py-3 text-right font-mono font-bold text-marine whitespace-nowrap">
                  {formatear(f.pesoNeto, DECIMALES.kg)}
                  {f.pesoParcial && <span className="text-amber-600" title="Total parcial: hay taras pendientes">*</span>}
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold">{celdaMedida(f, "brix")}</td>
                <td className="px-3 py-3 text-right font-mono font-bold">{celdaMedida(f, "ph")}</td>
                <td className="px-3 py-3 text-right font-mono font-bold">{celdaMedida(f, "acidez")}</td>
                <td className="px-3 py-3">
                  <EtiquetaEstado f={f} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/reportes/${encodeURIComponent(f.id)}`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-marine hover:bg-slate-100 border border-slate-200"
                    >
                      Ver detalle
                    </Link>
                    <button
                      type="button"
                      onClick={() => onEliminar(f)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                      aria-label={`Eliminar el lote ${f.codigoLote}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────
// Respaldo (exportar / importar)
// ─────────────────────────────────────────
function PanelRespaldo({ actuales, onImportado }: { actuales: LoteAlmacenado[]; onImportado: () => void }) {
  const archivo = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState<"exportar" | "importar" | null>(null);
  const [mensaje, setMensaje] = useState<{ tono: "ok" | "error" | "alerta"; texto: string } | null>(null);
  const [pendiente, setPendiente] = useState<{ plan: PlanImportacion; respaldo: Respaldo; nombre: string } | null>(null);

  async function exportar() {
    setOcupado("exportar");
    setMensaje(null);
    try {
      const r = await descargarRespaldo();
      setMensaje({
        tono: r.fotosFaltantes ? "alerta" : "ok",
        texto: `Respaldo descargado: ${r.lotes} lote(s) y ${r.fotos} foto(s).${
          r.fotosFaltantes ? ` ${r.fotosFaltantes} foto(s) no se encontraron en este dispositivo.` : ""
        }`,
      });
    } catch {
      setMensaje({ tono: "error", texto: "No se pudo generar el respaldo." });
    } finally {
      setOcupado(null);
    }
  }

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setMensaje(null);
    setPendiente(null);
    try {
      const respaldo = analizarRespaldo(await f.text());
      setPendiente({ plan: planificarImportacion(actuales, respaldo.lotes), respaldo, nombre: f.name });
    } catch (err) {
      setMensaje({ tono: "error", texto: err instanceof Error ? err.message : "No se pudo leer el archivo." });
    }
  }

  async function confirmarImportacion() {
    if (!pendiente) return;
    setOcupado("importar");
    try {
      const r = await aplicarImportacion(pendiente.plan, pendiente.respaldo);
      if (r.ok) {
        setMensaje({
          tono: "ok",
          texto: `Importación completa: ${pendiente.plan.nuevos.length} nuevo(s), ${pendiente.plan.actualizados.length} actualizado(s), ${r.fotosRestauradas ?? 0} foto(s) restaurada(s).`,
        });
        onImportado();
      } else {
        setMensaje({ tono: "error", texto: r.error });
      }
    } finally {
      setPendiente(null);
      setOcupado(null);
    }
  }

  const sinCambiosReales = pendiente && pendiente.plan.nuevos.length + pendiente.plan.actualizados.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportar}
          disabled={ocupado !== null}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50 shadow-sm disabled:opacity-50"
        >
          {ocupado === "exportar" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar respaldo (JSON)
        </button>
        <button
          type="button"
          onClick={() => archivo.current?.click()}
          disabled={ocupado !== null}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50 shadow-sm disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Importar respaldo
        </button>
        <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={alElegir} />
      </div>

      {pendiente && (
        <Aviso tono="info" titulo={`Importar «${pendiente.nombre}»`}>
          <div className="flex flex-col gap-2">
            <span>
              {pendiente.respaldo.lotes.length} lote(s) en el archivo: <strong>{pendiente.plan.nuevos.length} nuevo(s)</strong>,{" "}
              <strong>{pendiente.plan.actualizados.length} actualizado(s)</strong> (versión más reciente) y{" "}
              {pendiente.plan.sinCambios} sin cambios. Los lotes que solo están en este dispositivo se conservan.
            </span>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={confirmarImportacion}
                disabled={ocupado !== null || !!sinCambiosReales}
                className="px-4 py-2 rounded-lg bg-marine text-white text-sm font-bold disabled:opacity-50"
              >
                {ocupado === "importar" ? "Importando…" : sinCambiosReales ? "Nada que importar" : "Importar"}
              </button>
              <button type="button" onClick={() => setPendiente(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-600">
                Cancelar
              </button>
            </div>
          </div>
        </Aviso>
      )}
      {mensaje && <Aviso tono={mensaje.tono} titulo={mensaje.texto} />}
    </div>
  );
}

// ─────────────────────────────────────────
// Página
// ─────────────────────────────────────────
export default function ReportesPage() {
  const esCliente = useEsCliente();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Link href="/inicio" className="flex items-center gap-1.5 text-slate-500 hover:text-marine font-medium transition-colors text-sm" aria-label="Volver al inicio">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-marine truncate">Dashboard de Reportes</span>
          </div>
          <Link
            href="/recepcion"
            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-marine hover:bg-marine-light text-sm font-bold text-white shadow-sm"
          >
            + <span className="hidden sm:inline">Nuevo lote</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        </div>
      </header>
      {esCliente ? (
        <Contenido />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-marine">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-sm font-bold">Cargando lotes…</span>
        </div>
      )}
    </div>
  );
}

function Contenido() {
  // Solo en el navegador (ver useEsCliente): lee localStorage al iniciar.
  const [lotes, setLotes] = useState<LoteAlmacenado[]>(() => getLotes());
  const [filtro, setFiltro] = useState<EstadoLote | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recargar = () => setLotes(getLotes());
  const filas = lotes.map(filaReporte);
  const kpis = calcularKPIs(filas);
  const conteo = { LIBERADO: kpis.liberados, RETENIDO: kpis.retenidos, RECHAZADO: kpis.rechazados };
  const q = busqueda.trim().toLowerCase();
  const visibles = filas.filter(
    (f) =>
      (filtro === "todos" || f.estado === filtro) &&
      (!q || [f.codigoLote, f.proveedor, f.origen, f.variedad].some((t) => t.toLowerCase().includes(q))),
  );
  const legacy = filas.filter((f) => f.legacy).length;

  function eliminar(f: FilaReporte) {
    if (!confirm(`¿Eliminar el lote ${f.codigoLote}? Se borrarán también sus fotos. Esta acción no se puede deshacer.`)) return;
    const r = deleteLote(f.id);
    if (r.ok) {
      setError(null);
      recargar();
    } else setError(r.error);
  }

  const alternarFiltro = (e: EstadoLote) => setFiltro((f) => (f === e ? "todos" : e));

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-marine">Reporte de lotes</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Lotes guardados en este dispositivo</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <button
            type="button"
            onClick={recargar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-marine shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <PanelRespaldo actuales={lotes} onImportado={recargar} />
        </div>
      </div>

      {error && <Aviso tono="error" titulo={error} />}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard
          label="Total de lotes"
          value={kpis.total}
          icon={Package}
          color="marine"
          sub={legacy ? `${legacy} en formato anterior` : "Registrados"}
          activo={filtro === "todos"}
          onClick={() => setFiltro("todos")}
        />
        <KPICard
          label="Liberados"
          value={kpis.liberados}
          icon={ESTILO_ESTADO.LIBERADO.Icon}
          color="emerald"
          sub={kpis.total ? `${kpis.tasaLiberacion}% del total` : "Sin datos"}
          activo={filtro === "LIBERADO"}
          onClick={() => alternarFiltro("LIBERADO")}
        />
        <KPICard label="Retenidos" value={kpis.retenidos} icon={ESTILO_ESTADO.RETENIDO.Icon} color="amber" activo={filtro === "RETENIDO"} onClick={() => alternarFiltro("RETENIDO")} />
        <KPICard label="Rechazados" value={kpis.rechazados} icon={ESTILO_ESTADO.RECHAZADO.Icon} color="red" activo={filtro === "RECHAZADO"} onClick={() => alternarFiltro("RECHAZADO")} />
        <div className="col-span-2 lg:col-span-1">
          <KPICard label="Volumen total" value={formatear(kpis.totalKg / 1000, 1)} unit="ton" icon={TrendingUp} color="gold" />
        </div>
      </div>

      <DistribucionEstados conteo={conteo} total={kpis.total} filtro={filtro} onFiltro={setFiltro} />

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-marine">
              Historial de lotes
              <span className="ml-2 text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {visibles.length} de {filas.length}
              </span>
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
              {(["todos", ...ESTADOS] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  aria-pressed={filtro === f}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-bold whitespace-nowrap transition-colors ${
                    filtro === f
                      ? f === "todos"
                        ? "bg-marine text-white border-marine"
                        : ESTILO_ESTADO[f].chip
                      : "bg-white border-slate-200 text-slate-500 hover:text-marine"
                  }`}
                >
                  {f === "todos" ? "Todos" : PLURAL[f]}
                </button>
              ))}
            </div>
            <label className="relative flex-1 sm:max-w-xs sm:ml-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar lote, proveedor, origen…"
                aria-label="Buscar lotes"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-marine placeholder:text-slate-400 focus:outline-none focus:border-marine"
              />
            </label>
          </div>
        </div>
        <TablaLotes filas={visibles} total={filas.length} onEliminar={eliminar} />
        {filas.some((f) => f.pesoParcial) && (
          <p className="px-4 sm:px-6 py-3 text-xs font-medium text-slate-500 border-t border-slate-100">
            * Peso neto parcial: hay taras pendientes.
          </p>
        )}
      </div>
    </main>
  );
}
