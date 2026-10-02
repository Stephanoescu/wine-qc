// ============================================================
// MOCK DATA — Wine Tank Transfer Quality Control Application
// ============================================================

export interface Step {
  id: number;
  title: string;
  description: string;
  detail?: string;
  icon: "pipe" | "check" | "valve" | "pump" | "measure" | "sample" | "inspect" | "log";
  requiresInput?: boolean;
  inputLabel?: string;
  inputUnit?: string;
  inputMin?: number;
  inputMax?: number;
}

export interface Alert {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  timestamp: string;
  severity: "warning" | "critical";
  recommendations: string[];
}

export interface KPIMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color: "emerald" | "amber" | "red" | "blue" | "zinc";
}

export interface ChartDataPoint {
  label: string;
  value: number;
  baseline: number;
}

// ─────────────────────────────────────────
// WIZARD STEPS — Trasiego entre tanques
// ─────────────────────────────────────────
export const TRANSFER_STEPS: Step[] = [
  {
    id: 1,
    title: "Verificación de origen",
    description: "Confirme que el tanque de origen es el TANQUE A-04.",
    detail: "Verifique la etiqueta física del tanque y compárela con la orden de trabajo N° 2024-087 antes de continuar.",
    icon: "inspect",
  },
  {
    id: 2,
    title: "Verificación de destino",
    description: "Confirme que el tanque de destino es el TANQUE B-12.",
    detail: "El tanque destino debe estar limpio, desinfectado y con gas inerte (N₂) en su interior.",
    icon: "inspect",
  },
  {
    id: 3,
    title: "Conexión de manguera — Lado destino",
    description: "La manguera de trasiego debe estar conectada al tanque de destino por el lado derecho.",
    detail: "Asegúrese de que el acoplamiento esté firme y sin fugas. Use llave de apriete si es necesario.",
    icon: "pipe",
  },
  {
    id: 4,
    title: "Conexión de manguera — Lado origen",
    description: "Conecte el otro extremo de la manguera al tanque de origen A-04 en el puerto inferior.",
    detail: "El puerto inferior minimiza la incorporación de oxígeno y sedimentos al trasiego.",
    icon: "pipe",
  },
  {
    id: 5,
    title: "Apertura de válvula de origen",
    description: "Abra la válvula de salida del tanque A-04 a 1/4 de vuelta.",
    detail: "Una apertura gradual permite purgar el aire de la manguera antes del trasiego completo.",
    icon: "valve",
  },
  {
    id: 6,
    title: "Medición de pH — Punto inicial",
    description: "Tome una muestra del vino e ingrese la lectura del pH.",
    detail: "El rango aceptable para esta etapa es de 5.0 a 10.0. Si la lectura está fuera de rango, el sistema generará una alerta.",
    icon: "measure",
    requiresInput: true,
    inputLabel: "pH medido",
    inputUnit: "pH",
    inputMin: 5.0,
    inputMax: 10.0,
  },
  {
    id: 7,
    title: "Inicio de la bomba de trasiego",
    description: "Active la bomba peristáltica P-03 al 60% de su capacidad.",
    detail: "Confirme que el caudal en el flujómetro sea de 2.5 a 3.0 L/min antes de continuar.",
    icon: "pump",
  },
  {
    id: 8,
    title: "Toma de muestra intermedia",
    description: "A los 15 minutos de iniciado el trasiego, tome una muestra en el punto de muestreo M-2.",
    detail: "Registre el volumen trasegado en el panel de control y rotule la muestra con hora y fecha.",
    icon: "sample",
  },
  {
    id: 9,
    title: "Cierre de válvulas y parada de bomba",
    description: "Detenga la bomba P-03 y cierre la válvula del tanque A-04.",
    detail: "Primero pare la bomba, luego cierre la válvula de origen y finalmente la de destino. Nunca a la inversa.",
    icon: "valve",
  },
  {
    id: 10,
    title: "Registro y cierre del procedimiento",
    description: "Registre el volumen final trasegado y firme digitalmente la orden de trabajo.",
    detail: "El procedimiento quedará archivado automáticamente en el sistema. Informe cualquier anomalía al supervisor.",
    icon: "log",
  },
];

// ─────────────────────────────────────────
// ALERT — Simulated out-of-range detection
// ─────────────────────────────────────────
export const MOCK_ALERT: Alert = {
  id: "ALT-2024-042",
  parameter: "pH",
  value: 11.0,
  unit: "pH",
  min: 5.0,
  max: 10.0,
  timestamp: "2024-11-15 09:42:17",
  severity: "critical",
  recommendations: [
    "Detengan el trasiego inmediatamente y cierren la válvula de origen.",
    "Verifique la calibración del pHímetro con soluciones tampón conocidas (pH 4, 7, 10).",
    "Si el instrumento es correcto, evalúe la condición microbiológica del vino antes de continuar.",
    "Notifique al enólogo responsable y al supervisor de turno.",
    "No reinicie el procedimiento sin autorización escrita del enólogo.",
    "Registre la incidencia en el libro de novedades del área.",
  ],
};

// ─────────────────────────────────────────
// DASHBOARD — KPIs y datos del turno
// ─────────────────────────────────────────
export const DASHBOARD_KPIS: KPIMetric[] = [
  {
    id: "completed",
    label: "Procedimientos completados hoy",
    value: 30,
    unit: "trasiegos",
    trend: "up",
    trendValue: "+12% vs. ayer",
    color: "emerald",
  },
  {
    id: "alerts",
    label: "Alertas detectadas",
    value: 2,
    unit: "alertas",
    trend: "down",
    trendValue: "-1 vs. ayer",
    color: "amber",
  },
  {
    id: "volume",
    label: "Volumen trasegado",
    value: "18,450",
    unit: "litros",
    trend: "up",
    trendValue: "+8% vs. ayer",
    color: "blue",
  },
  {
    id: "uptime",
    label: "Tiempo operativo",
    value: "7h 22m",
    trend: "stable",
    trendValue: "Turno activo",
    color: "zinc",
  },
];

export const CHART_DATA: ChartDataPoint[] = [
  { label: "06:00", value: 6.8, baseline: 7.0 },
  { label: "07:00", value: 7.1, baseline: 7.0 },
  { label: "08:00", value: 6.9, baseline: 7.0 },
  { label: "09:00", value: 11.0, baseline: 7.0 }, // ← out-of-range point
  { label: "10:00", value: 6.7, baseline: 7.0 },
  { label: "11:00", value: 7.2, baseline: 7.0 },
  { label: "12:00", value: 7.0, baseline: 7.0 },
  { label: "13:00", value: 6.8, baseline: 7.0 },
  { label: "14:00", value: 7.1, baseline: 7.0 },
  { label: "15:00", value: 6.9, baseline: 7.0 },
];

export interface RecentAlert {
  id: string;
  parameter: string;
  value: string;
  time: string;
  tank: string;
  resolved: boolean;
}

export const RECENT_ALERTS: RecentAlert[] = [
  {
    id: "ALT-2024-041",
    parameter: "Temperatura",
    value: "22.4 °C",
    time: "07:15",
    tank: "A-04",
    resolved: true,
  },
  {
    id: "ALT-2024-042",
    parameter: "pH",
    value: "11.0 pH",
    time: "09:42",
    tank: "A-04",
    resolved: false,
  },
];
