// ============================================================
// Textos del módulo «Despalillado, clasificación y trituración».
// Salen del procedimiento fuente docs/sw-trituracion.md (SW Trituración).
// Los `id` de cada ítem deben ser únicos dentro de su lista de casillas.
// ============================================================
import type { ItemChecklist } from "./recepcion-textos";
import type { Grupo } from "./trituracion";

export const TITULO_MODULO = "Despalillado, clasificación y trituración";

/** Pasos del asistente (6). */
export const PASOS_TRITURACION = [
  "Recibir lote",
  "Despalillar",
  "Salida del despalillado",
  "Clasificación",
  "Trituración",
  "Entrega y cierre",
] as const;

// ── Grupos y cribas (sección 4.2) ─────────────────────────
export const DEFINICION_GRUPOS: Record<Grupo, { nombre: string; recipiente: string; identificacion: string }> = {
  G: {
    nombre: "Grande",
    recipiente: "GRANDES G",
    identificacion: "Se recoge de la criba superior de 20 mm y se coloca en GRANDES G.",
  },
  M: {
    nombre: "Mediana",
    recipiente: "MEDIANAS M",
    identificacion: "Pasa por 20 mm; se recoge de la criba de 18 mm y se coloca en MEDIANAS M.",
  },
  P: {
    nombre: "Pequeña",
    recipiente: "PEQUEÑAS P",
    identificacion: "Pasa por ambas cribas y cae al recipiente inferior PEQUEÑAS P.",
  },
};

export const TEXTO_POKA_YOKE_CRIBAS =
  "El lugar donde queda la uva indica su grupo: grande en la criba de 20 mm; mediana en la de 18 mm; pequeña debajo de ambas. No es necesario medir cada baya.";

export const NOTA_TABLA_GAPS =
  "Los valores de G, M y P se establecen y comprueban en las primeras visitas según el manual del equipo y el resultado de trituración. Después quedan como estándar de la bodega para la operación habitual. Las fuentes consultadas no proporcionan una tabla universal que convierta las cribas de 20 y 18 mm en gaps de trituración; no se asignan milímetros por suposición.";

export const AVISO_GAP_NO_ESTABLECIDO =
  "Gap no establecido: Producción y Mantenimiento deben fijarlo mediante la comprobación antes de procesar con ese ajuste.";

export const NOTA_CAMPO_VACIO = "Un campo vacío no autoriza un ajuste numérico supuesto.";

// ── Condición general (sección 3) y puesto ────────────────
export const CHECK_CONDICION_GENERAL: ItemChecklist[] = [
  {
    id: "t0.1",
    texto:
      "Las máquinas cuentan con mantenimiento y evaluación previa, y los materiales e instrumentos están verificados y limpios sobre la mesa.",
  },
  {
    id: "t0.2",
    texto: "Compruebe que la mesa esté disponible y que los materiales e instrumentos de la sección estén listos en el puesto.",
  },
  { id: "t0.3", texto: "Ubique las bandejas de utensilios limpios y usados. Manténgalas separadas." },
];

// ── Actividad 1: recibir el lote liberado ─────────────────
export const CHECK_ACT1: ItemChecklist[] = [
  {
    id: "t1.1",
    texto: "Consulte la ficha de recepción y compruebe el código, el estado LIBERADO y la disposición firmada.",
  },
  { id: "t1.2", texto: "Compare el código con las cajas o recipientes entregados y con el destino autorizado." },
  {
    id: "t1.3",
    texto:
      "Consulte el peso disponible que ya informa recepción, después de sus descuentos. Use ese dato como entrada sin volver a calcularlo, pesarlo o descontar los mismos retiros.",
  },
  { id: "t1.4", texto: "Mantenga el código original y continúe con el despalillado." },
];

export const NOTA_PESO_ENTRADA =
  "Use este dato como entrada sin volver a calcularlo, pesarlo ni descontar los mismos retiros.";
export const AVISO_ACLARAR_ENTREGA = "Aclare la entrega con Recepción y Producción antes de alimentar.";

// ── Actividad 2: introducir los racimos ───────────────────
/** El procedimiento numera 1, 2, 4 y 5 (no tiene ítem 3); se muestran en orden. */
export const CHECK_ACT2: ItemChecklist[] = [
  {
    id: "t2.1",
    texto:
      "Tome una caja identificada del lote liberado y lleve los racimos a la tolva de entrada de la despalilladora. Introduzca los racimos gradualmente, sin empujarlos con las manos dentro de la tolva.",
  },
  {
    id: "t2.2",
    texto:
      "Deje que la máquina separe las bayas de los tallos. Los tallos salen hacia el recipiente TALLOS; las bayas caen al depósito de UVA DESPALILLADA.",
  },
  {
    id: "t2.4",
    texto:
      "Antes de que el depósito alcance su capacidad, deje de introducir nuevos racimos y permita terminar el paso de los que ya están dentro del equipo.",
  },
  {
    id: "t2.5",
    texto:
      "Pase las bayas del depósito a las cribas siguiendo la actividad 4. Continúe por porciones, sin esperar a despalillar todo el lote.",
  },
];

export const PREGUNTA_ANOMALIA = "¿Atasco, ruido o vibración anormal?";
export const AVISO_ANOMALIA = "Pare el equipo y solicite la intervención de Mantenimiento. No toque partes móviles.";
export const AVISO_DEPOSITO =
  "Si el depósito no puede recibir más bayas, detenga la alimentación; no deje rebalsar ni mezcle con los tallos.";

// ── Actividad 3: salida del despalillado ──────────────────
export const CHECK_ACT3: ItemChecklist[] = [
  {
    id: "t3.1",
    texto:
      "Recoja una porción de las bayas del depósito UVA DESPALILLADA desde el acceso habilitado, fuera del alcance de partes móviles, y colóquela en la bandeja de trabajo.",
  },
  {
    id: "t3.2",
    texto: "Observe que las bayas estén sueltas y mayormente enteras y que no salga el tallo principal con ellas.",
  },
];

export const CRITERIO_ACT3 =
  "Es un control del resultado de la máquina. Debe existir salida de bayas enteras antes de las cribas para que la clasificación por paso sea aplicable.";
export const AVISO_FRUTA_ROTA =
  "Mantenga separada e identificada esa fracción como FRUTA ROTA; no la fuerce por las cribas. Su disposición corresponde a Calidad o Enología.";
export const AVISO_DETENER_SALIDA =
  "Si persisten tallos o trituración antes de clasificar, detenga la alimentación y solicite la revisión del equipo. Compruebe nuevamente la salida después de la corrección.";

// ── Actividad 4: pasar las bayas a las cribas ─────────────
export const CHECK_ACT4: ItemChecklist[] = [
  { id: "t4.1", texto: "Tome el recipiente pequeño de trasvase que está junto al depósito UVA DESPALILLADA." },
  {
    id: "t4.2",
    texto: "Recoja con él una porción de bayas del depósito y llévela hasta la criba superior de 20 mm.",
  },
  {
    id: "t4.3",
    texto:
      "Vierta suavemente las bayas sobre la criba de 20 mm. Ponga solo la cantidad que pueda quedar en una capa, sin montarlas unas sobre otras.",
  },
  {
    id: "t4.4",
    texto:
      "Deje pasar por los orificios de la criba de 20 mm las bayas que caben por esa abertura. Estas llegan a la criba inferior de 18 mm. No empuje las bayas por los orificios.",
  },
  {
    id: "t4.5",
    texto:
      "Espere a que termine el paso de esa porción y recoja las tres fracciones como indica la actividad 5. Después pase otra porción del mismo depósito.",
  },
];

export const AVISO_ACT4 =
  "Si se forma una segunda capa o se atasca una abertura, deje de añadir uva. No aplaste una baya para hacerla pasar.";

// ── Actividad 5: recoger en tres recipientes ──────────────
export const CHECK_ACT5: ItemChecklist[] = [
  {
    id: "t5.1",
    texto:
      "Con las cribas detenidas y desde el acceso habilitado, ponga las bayas que quedaron sobre la criba de 20 mm. Póngalas en GRANDES G.",
  },
  {
    id: "t5.2",
    texto:
      "Recoja del mismo modo las bayas que pasaron por 20 mm y quedaron sobre la criba de 18 mm. Póngalas en MEDIANAS M.",
  },
  {
    id: "t5.3",
    texto:
      "Las bayas que atraviesan también la criba de 18 mm caen al recipiente PEQUEÑAS P, situado debajo. Mantenga esa salida dirigida a P.",
  },
  {
    id: "t5.4",
    texto: "Mantenga cada recipiente en su posición y conserve sus rótulos. No junte G, M y P en un mismo recipiente.",
  },
  {
    id: "t5.5",
    texto:
      "Una vez recogido lo retenido en las dos cribas, continúe con otra porción del depósito. Si algún recipiente está por llenarse, suspenda la alimentación y cierre esa tanda según la actividad 6.",
  },
];

export const EJEMPLO_ACT5 =
  "Una baya retenida en 20 mm va a GRANDES G. Una que pasa 20 mm y queda en 18 mm va a MEDIANAS M. Una que pasa las dos va a PEQUEÑAS P.";

// ── Actividad 6: identificar recipientes y cerrar la tanda ─
export const CHECK_ACT6: ItemChecklist[] = [
  { id: "t6.1", texto: "Identifique cada recipiente con lote, grupo G/M/P y correlativo." },
  {
    id: "t6.2",
    texto:
      "Antes de alcanzar su capacidad, deje de alimentar. Si necesita un recipiente adicional, utilice otro identificado del mismo grupo.",
  },
  { id: "t6.3", texto: "Pese cada recipiente y reste su tara una sola vez. Anote kg y hora de clasificación." },
  {
    id: "t6.4",
    texto:
      "Mantenga los recipientes cerrados e identificados, fuera del piso, durante la transferencia a trituración. No reúna grupos distintos.",
  },
  {
    id: "t6.5",
    texto:
      "Procese los grupos de esa tanda y continúe después con la siguiente; no acumule todo el lote sin clasificar ni mezcle tandas sin conservar su identificación.",
  },
];

export const CRITERIO_ACT6 =
  "Cada fracción conserva el mismo lote. Si un grupo no aparece, registre 0 kg y omítalo. El pesaje de grupos corresponde a una fracción nueva; no repite el peso de entrada de recepción.";
export const REGLA_MERMA = "Una diferencia no se completa como merma supuesta.";
export const AVISO_NUEVA_TANDA =
  "Procese los grupos de esa tanda y continúe después con la siguiente; no acumule todo el lote sin clasificar.";

// ── Actividad 7: aplicar el gap estándar ──────────────────
export const CHECK_ACT7: ItemChecklist[] = [
  {
    id: "t7.1",
    texto:
      "Lea la etiqueta del recipiente y busque su grupo en la tabla estándar. Compruebe que la tabla corresponda al equipo y a su versión vigente.",
  },
  {
    id: "t7.2",
    texto: "Mantenimiento aplique el gap registrado para ese grupo, con el equipo aislado y según el manual.",
  },
  {
    id: "t7.3",
    texto: "Retire galgas y herramientas y deje las protecciones en su sitio antes del arranque autorizado.",
  },
];

export const CRITERIO_ACT7 =
  "El operario no calcula el gap a partir de una baya ni utiliza el de otro grupo. No reajuste rodillos con el equipo en marcha.";
export const AVISO_GAP_DISTINTO = "El operario no decide otro gap. Use la configuración vigente.";
export const AVISO_NO_REAJUSTAR = "No reajuste rodillos con el equipo en marcha.";

// ── Actividad 8: triturar las uvas de cada grupo ──────────
export const CHECK_ACT8: ItemChecklist[] = [
  {
    id: "t8.1",
    texto:
      "Vierta gradualmente las uvas de los recipientes de un mismo grupo en la tolva de entrada de la trituradora. Mantenga una alimentación regular, sin amontonamientos ni presión manual dentro de la tolva.",
  },
  { id: "t8.2", texto: "Recoja la salida identificada. El producto pasa una sola vez por los rodillos." },
  { id: "t8.3", texto: "Complete el grupo sin intercalar otro. Al terminar, deje de alimentar." },
  {
    id: "t8.4",
    texto:
      "Cambie la identificación de entrada y salida y aplique la actividad 7 para el siguiente grupo. La secuencia de trabajo del proyecto es P, M y G.",
  },
];

export const AVISO_UNA_PASADA =
  "El producto pasa una sola vez por los rodillos. No añada agua, azúcar, ácidos, enzimas ni otros productos.";
export const INCIDENCIA_PERDIDA_ID = "Entró otro grupo o se perdió la identificación";
export const AVISO_PERDIDA_ID = "Deje de alimentar e identifique la salida afectada para su evaluación.";

// ── Actividad 9: apertura de piel e integridad de semillas ─
export const INSTRUCCIONES_ACT9: string[] = [
  "Al inicio de cada grupo, después de una parada o ajuste y al finalizarlo, tome producto con una bandeja limpia por el acceso seguro de salida.",
  "Con las pinzas, revise las semillas de esa porción, incluidas las piezas partidas o aplastadas.",
  "Si el resultado no cumple, deje de alimentar, pare y mantenga identificado el material generado desde el último control conforme, o desde el inicio si no existe uno.",
  "Solicite la corrección del ajuste, repita el control y continúe solo con la conformidad de Producción y la disposición de Calidad o Enología para el material retenido.",
];

export const NOTA_CRITERIOS_ACT9 =
  "Referencias internas a confirmar en las primeras visitas. Son criterios internos, no valores numéricos de la OIV.";
export const NOTA_RESULTADO_CERO =
  "El resultado 0 observado no demuestra ausencia total de daño ni equivale a un porcentaje de semillas.";
export const TEXTO_NO_EVALUABLE = "No evaluable: la fragmentación impide reconocer las bayas";

// ── Actividad 10: entregar y cerrar ───────────────────────
export const CHECK_ACT10: ItemChecklist[] = [
  {
    id: "t10.1",
    texto: "Entregue solo la salida autorizada, con lote, grupo, cantidad, hora y destino identificados.",
  },
  {
    id: "t10.2",
    texto:
      "Después de retirar el producto, solicite el aislamiento de los equipos y aplique el procedimiento de limpieza final de la bodega.",
  },
  {
    id: "t10.3",
    texto:
      "Devuelva los útiles a su lugar y cierre el registro de limpieza. Antes de otro lote no deben quedar restos identificables del anterior en la línea.",
  },
];

export const CHECK_LIMPIEZA: ItemChecklist[] = [
  { id: "tl.1", texto: "Solicite el aislamiento de los equipos." },
  { id: "tl.2", texto: "Aplique el procedimiento de limpieza final de la bodega." },
  { id: "tl.3", texto: "Devuelva los útiles a su lugar." },
];

export const NOTA_LIMPIEZA = "Antes de otro lote no deben quedar restos identificables del anterior en la línea.";
export const NOTA_DISPOSICION_PORCIONES =
  "Calidad o Enología define el destino de las porciones examinadas y de las pruebas iniciales.";

// ── Anexo B: comprobaciones en las primeras visitas ───────
export const INTRO_ANEXO_B =
  "Estas comprobaciones establecen la configuración que después utilizará la operación habitual. Se documentan en el Registro D; no se repiten completas con cada caja ni con cada lote.";

export const CHECK_ANEXO_B1: ItemChecklist[] = [
  { id: "b1.1", texto: "Identificar la despalilladora, su depósito de salida, las dos cribas y la trituradora." },
  {
    id: "b1.2",
    texto:
      "Comprobar el acceso seguro al depósito, el recipiente de trasvase y las posiciones de los tres recipientes G/M/P.",
  },
  { id: "b1.3", texto: "Verificar que se pueda recoger lo retenido en ambos niveles con el conjunto detenido." },
];
export const RESULTADO_ANEXO_B1 =
  "Equipo y manual, acceso de toma, límite de tanda y capacidad de los recipientes compatibles con el flujo. Producción y Mantenimiento documentan la ruta y la forma de intervención. No improvisar salidas quitando protecciones.";

export const CHECK_ANEXO_B2: ItemChecklist[] = [
  {
    id: "b2.1",
    texto:
      "Comprobar la disposición de las cribas de 20 y 18 mm y que cada salida llegue a su recipiente G/M/P sin mezclarse.",
  },
  { id: "b2.2", texto: "Revisar que el paso no genere aplastamiento persistente." },
  { id: "b2.3", texto: "Integrar la verificación del montaje al procedimiento previo del equipo." },
];
export const RESULTADO_ANEXO_B2 =
  "Identificación estable de las salidas. Las aberturas son nominales; no se exige medir cada baya durante la rutina. Si el montaje no separa como se prevé, corregirlo y comprobarlo antes de fijar la configuración por grupos.";

export const INSTRUCCION_ANEXO_B3 =
  "Tomar un grupo identificado. Mantenimiento selecciona una posición inicial permitida por el manual, aísla el equipo y comprueba el gap con su método autorizado. Pesar una porción del grupo y realizar una sola pasada. Se conserva como referencia interna inicial una porción de 5,0 kg, cuya suficiencia debe confirmarse para el modelo.";
export const NOTA_ANEXO_B3 =
  "No deducir el gap de los 20 o 18 mm de las cribas. Si el manual no permite definir la posición o la masa no logra trabajo estable, documentar la corrección necesaria antes de continuar.";

export const INSTRUCCION_ANEXO_B4 =
  "Aplicar el conteo de apertura y la inspección de semillas de la actividad 9. Si hay demasiadas bayas enteras, revisar alimentación y estudiar un cierre permitido. Si hay semillas dañadas, no seguir cerrando: revisar el equipo y estudiar una apertura permitida. Cambiar una sola condición y comprobar de nuevo con otra porción del mismo grupo.";
export const NOTA_ANEXO_B4 =
  "Resultado que debe quedar definido: gap que abre la piel sin daño observado de semillas, dentro de la capacidad del equipo. Confirmar con Producción y Calidad el método y las referencias internas de salida. La magnitud del ajuste la determina el manual y el personal autorizado.";

export const INSTRUCCION_ANEXO_B5 =
  "Repetir la comprobación para los grupos presentes. Completar gap G, gap M y gap P en la tabla, vinculados al equipo y a la posición comprobada. Documentar la revisión y aprobación de la configuración.";
export const NOTA_ANEXO_B5 =
  "Si un grupo no se presenta, anotar NO APLICA para esa comprobación; no copiarle otro gap. Un campo vacío no autoriza un ajuste numérico supuesto.";
