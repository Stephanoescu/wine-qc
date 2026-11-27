# Requerimientos v2 — Ajustes de Recepción + Módulo de Despalillado, Clasificación y Trituración

Proyecto: **wine-qc** (Next.js, https://wine-qc.vercel.app). El módulo de Recepción ya está en producción (`docs/mejoras-recepcion.md`).

Este documento pide dos cosas:

- **Parte A:** correcciones al módulo de Recepción.
- **Parte B:** un módulo nuevo de Despalillado, Clasificación y Trituración.

El procedimiento fuente completo del módulo nuevo está en **`docs/sw-trituracion.md`**. Es el documento "SW Trituración" de la bodega y tiene las actividades 1 a 10 y los Anexos A y B. **Léelo entero**: los textos de las listas de verificación, los criterios y los registros deben salir de ahí, no inventarse.

## Reglas generales (iguales que en la versión anterior)

- **Antes de implementar:** explora el código actual y muéstrame un plan. Espera mi OK.
- **Por fases:** trabaja por fases. Al terminar cada una, ejecuta lint, type-check, build y pruebas de la lógica, y avísame para revisar.
- **Configuración:** rangos, umbrales y textos van en archivos de configuración (`lib/config/...`), no en los componentes.
- **Listas de verificación:** marcables. "Siguiente" solo se habilita con todo marcado y los campos válidos, y debajo se explica qué falta.
- **Formato:** decimales con coma, interfaz en español y pensada para celular (≈390 px).
- **Autosalvado:** al ir Atrás/Siguiente no se pierden datos, y se puede reanudar el registro.
- **Almacenamiento:** se mantiene el actual: localStorage para los datos e IndexedDB para las fotos, con la capa `lib/recepcion/almacen.ts` o una equivalente. Todo el acceso a datos del módulo nuevo debe ir por una capa de almacenamiento, para poder migrar después a una base de datos compartida sin tocar los componentes. **Recepción y Trituración se hacen en el mismo dispositivo**, o se pasan los lotes con el respaldo JSON.
- **Firmas y decisiones:** guardan nombre, **rol** y fecha y hora. Los roles del procedimiento son Operario/a, Producción, Mantenimiento, Calidad o Enología, y Recepción.

---

# PARTE A — Correcciones al módulo de Recepción

## A1. Quitar el texto de ayuda del paso 1
Eliminar el texto bajo "Número de jabas": *"Define el pesado por jaba (paso 3) y el muestreo (paso 4)."*

## A2. Fotos en las observaciones de carga (paso 3)
Cuando "¿Hay observaciones?" = **Sí**, cada fila de observación (N° de jaba + descripción) debe permitir **"Tomar foto"** y **"Adjuntar foto"**, igual que en el paso 5: hasta 3 fotos por observación, comprimidas, en IndexedDB y con miniaturas que se amplían. Las fotos aparecen en el informe y se incluyen en el respaldo JSON.

## A3. Quitar "Temperatura del jugo (°C)" del paso 7 (pH)
Eliminar el campo del asistente y del informe. Los lotes ya guardados que lo tengan no deben romperse; simplemente no se muestra.

## A4. Peso máximo por jaba: 25 kg
El **peso neto de uva por jaba** no puede superar **25 kg**:
- con la función TARA, el valor ingresado es el neto;
- sin TARA, se valida el neto = lleno − tara.

Mensaje: "El peso neto por jaba no puede superar 25 kg". El valor va en la configuración (`PESO_MAX_JABA_KG = 25`). Si la tara está pendiente, el peso lleno no puede superar 25 kg más una tara máxima configurable (por defecto 5 kg).

## A5. Peso disponible (nuevo, lo necesita Trituración)
Trituración no vuelve a pesar el lote: usa el **peso disponible** que entrega Recepción "después de sus descuentos" (ejemplo del procedimiento: "La ficha informa 1 494,75 kg disponibles"). Agregar al lote:

```
Peso disponible (kg) = Peso neto total − kg materia extraña − kg uva dañada − peso de la bolsa de muestra (g ÷ 1000)
```

- Se muestra en el paso 9 y en el informe, con el desglose de cada descuento.
- Si hay taras pendientes, el peso disponible queda **"provisional"**, y Trituración no puede usar ese lote hasta completarlo.
- Los descuentos y la fórmula van en la configuración, porque la bodega puede ajustarla.
- Los lotes antiguos (v2 sin este campo) lo calculan al leerse. Los de "formato anterior" no tienen peso disponible y no se pueden enviar a Trituración.

## A6. El informe del lote se puede editar
"Al final el reporte se pueda editar por si hay que reemplazar información." Reemplaza la regla anterior de "solo completar pendientes".

- En `/reportes/[id]`, botón **"Editar informe"**. Permite corregir cualquier dato registrado:
  - identificación,
  - pesos por jaba,
  - observaciones de carga y sus fotos,
  - temperaturas,
  - peso de la bolsa,
  - parámetros visuales y sus fotos,
  - kg separados,
  - lecturas de °Brix y pH de cada ronda,
  - acidez,
  - firmas y destino.
- Cada guardado de edición exige **"Editado por"**, **rol** y **motivo** (obligatorios). Se registra en una **bitácora de cambios** del lote con: campo, valor anterior, valor nuevo, quién, rol, motivo, fecha y hora. La bitácora se muestra en el informe y no se puede editar ni borrar.
- Al editar, se **recalculan** todos los derivados: netos, totales, peso disponible, %, promedios, conformidades, motivos y estado sugerido.
  - Si el lote estaba LIBERADO y la edición genera una no conformidad, pasa a **RETENIDO** automáticamente, con el motivo "Edición posterior", y requiere una nueva decisión con firma.
  - Si estaba RETENIDO y la edición elimina todos los motivos, se ofrece liberar con disposición firmada (no se libera solo).
- Si el lote **ya tiene un registro de Trituración vinculado**, avisar antes de editar. Además, editar el peso disponible exige confirmar que Trituración fue informada; queda en la bitácora.
- Los lotes de "formato anterior" siguen siendo de solo lectura.
- **Se mantiene** "Completar tara/acidez pendiente" como acción rápida, que también queda en la bitácora.

## A7. Pruebas de la Parte A
- 26 kg neto en una jaba → bloqueado.
- Foto en una observación de carga → aparece en el informe → sobrevive a exportar e importar el respaldo.
- Editar un pH de un lote LIBERADO a un valor fuera de rango → pasa a RETENIDO, la bitácora muestra el cambio y el informe se actualiza.
- El peso disponible cuadra con la fórmula.

---

# PARTE B — Módulo "Despalillado, clasificación y trituración"

Fuente: `docs/sw-trituracion.md`. Uva Borgoña Blanca, ajuste de rodillos por grupo.

- **Objetivo:** despalillar, clasificar por cribas en tres grupos (G, M, P) y triturar cada grupo con su gap, abriendo la piel sin dañar semillas ni tallos.
- **Alcance:** desde la entrega del lote LIBERADO con su peso disponible hasta la entrega del producto triturado. No incluye maceración, dosificaciones ni controles de otras etapas.

## B0. Navegación
- En `/inicio`, la tarjeta "Proceso de Trituración" pasa a ser funcional: **"Despalillado, clasificación y trituración"**, con ruta `/trituracion`.
- `/trituracion` muestra:
  - "Nuevo registro", que pide elegir un lote;
  - la lista de registros en curso y cerrados, con buscador;
  - el acceso a **Configuración de gaps**.
- Desde el detalle del lote en Recepción: botón "Enviar a Trituración / Ver trituración".
- Las otras tarjetas que aún no existen (Trasiego, Dosificación, Maceración) muestran **"Próximamente"** en vez de "Iniciar" y no son clicables.

## B1. Configuración: tabla estándar de gaps (Sección 4.2 y Anexo B)
Ruta `/configuracion/trituracion`.

### Tabla estándar vigente
Una fila por grupo:

| Grupo | Identificación en las cribas | Gap estándar (mm) | Posición o marca |
|---|---|---|---|
| G — Grande | Se recoge de la criba superior de 20 mm y se coloca en GRANDES G | número o "NO APLICA" | texto |
| M — Mediana | Pasa por 20 mm; se recoge de la criba de 18 mm y se coloca en MEDIANAS M | número o "NO APLICA" | texto |
| P — Pequeña | Pasa por ambas cribas y cae al recipiente inferior PEQUEÑAS P | número o "NO APLICA" | texto |

Más los campos: **Equipo y modelo**, **Configuración y versión**, **Responsable de comprobación**, **Fecha y aprobación** (nombre y rol de quien aprueba).

### Reglas
- La tabla tiene **versiones**. Al aprobar una nueva, la anterior queda en el historial, y cada trituración guarda **qué versión usó**.
- **Un gap vacío no autoriza un ajuste supuesto:** si el grupo no tiene gap aprobado, ese grupo **no se puede triturar** y aparece el aviso "Gap no establecido: Producción y Mantenimiento deben fijarlo mediante la comprobación antes de procesar con ese ajuste" (actividad 7).
- No se ofrece ningún valor por defecto en mm. Mostrar la nota del documento: los valores se establecen en las primeras visitas según el manual del equipo y el resultado de trituración; no hay una tabla universal que convierta las cribas de 20 y 18 mm en gaps.

### Comprobaciones iniciales (Anexo B, "Registro D")
Sección para registrar las comprobaciones de las primeras visitas, que sirven para fijar la tabla:
1. **Equipo y recorrido:** lista de verificación de lo descrito en el Anexo B (1).
2. **Clasificación por paso:** lista de verificación del Anexo B (2).
3. **Gap inicial del grupo:** grupo, gap real, posición de referencia, masa de la porción (por defecto **5,0 kg**, editable), alimentación estable (Sí/No), responsable de Mantenimiento.
4. **Resultado y corrección:** el mismo control de la actividad 9 (abiertas, enteras, semillas revisadas, semillas dañadas o fragmentos), más condición anterior, condición nueva y disposición de las porciones. Se puede repetir cambiando una sola condición.
5. **Tabla estándar:** botón para pasar el gap comprobado de cada grupo a una nueva versión de la tabla, con aprobación.

## B2. Flujo del registro de trituración (asistente)
Pasos de la barra: **1 Recibir lote · 2 Despalillar · 3 Salida del despalillado · 4 Clasificación · 5 Trituración · 6 Entrega y cierre**. En el celular se muestra "Paso X/6".

Mostrar el **diagrama del recorrido** (ver `docs/sw-trituracion.md`, sección 4), hecho como SVG o componente propio, no como imagen externa:

> DESPALILLADORA → TALLOS / UVA DESPALILLADA → criba 20 mm → GRANDES G · criba 18 mm → MEDIANAS M · PEQUEÑAS P

Se ve en el paso 4 y en un botón "Ver recorrido" en cualquier paso.

### Paso 1 — Recibir el lote liberado (actividad 1, Registro A)
- **Condición general (sección 3):** un solo ítem de verificación por registro: "Las máquinas cuentan con mantenimiento y evaluación previa, y los materiales e instrumentos están verificados y limpios sobre la mesa". Más los dos ítems del PDF de la bodega:
  - "Compruebe que la mesa esté disponible y que los materiales e instrumentos de la sección estén listos en el puesto."
  - "Ubique las bandejas de utensilios limpios y usados. Manténgalas separadas."
- **Elegir lote:** lista o búsqueda por código de los lotes de Recepción. Solo se pueden elegir los que estén **LIBERADO** (incluido "Liberado con observaciones") con **disposición firmada** y **peso disponible no provisional**. Los demás aparecen deshabilitados con su motivo, por ejemplo: "RETENIDO", "Sin disposición firmada" o "Peso disponible provisional (tara pendiente)". El aviso dice: "Aclare la entrega con Recepción y Producción antes de alimentar".
- **Ficha vinculada (solo lectura):**
  - código, estado, variedad, proveedor, origen,
  - disposición (autorizado por, destino),
  - **peso disponible** en grande, con la nota "Use este dato como entrada sin volver a calcularlo, pesarlo ni descontar los mismos retiros".
  - Se mantiene el **código original** del lote. Un lote solo puede tener **un** registro de trituración; si ya existe, se reanuda.
- **Lista de la actividad 1:** ítems 1 a 4 del documento.
- **Registro A:** hora de entrega (por defecto la actual), responsable que recibe (nombre y rol) y entregado por (Recepción).

### Paso 2 — Introducir los racimos y recoger las bayas (actividad 2)
- Lista de verificación con los ítems de la actividad 2 del documento.
- Control **"¿Atasco, ruido o vibración anormal?" (Sí/No)**. Si es Sí, aparece el aviso "Pare el equipo y solicite la intervención de Mantenimiento. No toque partes móviles", junto con un registro de incidencia (hora, descripción, Mantenimiento interviene: nombre). Se pueden registrar varias incidencias.
- Aviso fijo: "Si el depósito no puede recibir más bayas, detenga la alimentación; no deje rebalsar ni mezcle con los tallos."

### Paso 3 — Comprobar la salida del despalillado (actividad 3)
- Lista de verificación con los ítems 1 y 2 de la actividad 3.
- Resultado de la salida con dos botones: **"Fruta conforme"** / **"Fruta rota"**.
  - **Fruta rota:** aviso "Mantenga separada e identificada esa fracción como FRUTA ROTA; no la fuerce por las cribas. Su disposición corresponde a Calidad o Enología", más un campo de comentario sobre cómo se separó. Los kg de FRUTA ROTA se registran en el paso 4.
- **Tallos observados (Sí/No)** y **daño generado en el despalillado** (texto). Se puede adjuntar una foto.
- Si **persisten tallos o trituración antes de clasificar**, se usa el botón "Detener y solicitar revisión del equipo". Luego se registra la corrección y se **repite el control**; solo se avanza con un control con fruta conforme.
- "Producción verifica la salida tras la intervención": nombre de Producción, obligatorio si hubo intervención.
- Se guarda el historial de controles de salida con su hora.

### Paso 4 — Clasificar por cribas e identificar los grupos (actividades 4, 5 y 6)
- **Información Poka-Yoke físico:** primero se muestra el bloque "Poka-Yoke físico: CRIBAS" con:
  - el texto "El lugar donde queda la uva indica su grupo: grande en la criba de 20 mm; mediana en la de 18 mm; pequeña debajo de ambas. No es necesario medir cada baya";
  - la tabla G/M/P con su identificación;
  - **al costado, la imagen de las cribas.** Usar `public/img/cribas.jpg` si existe. Si no existe, mostrar un marcador con el texto "Agregar foto de las cribas de la bodega en public/img/cribas.jpg" y el diagrama SVG.
- **Listas de verificación:** actividad 4 (ítems 1 a 5) y actividad 5 (ítems 1 a 5), con sus avisos: "Si se forma una segunda capa o se atasca una abertura, deje de añadir uva. No aplaste una baya para hacerla pasar".
- **Tandas (actividad 6):** se trabaja por tandas. Botón "Nueva tanda" (Tanda 1, 2, …). En cada tanda:
  - Lista de verificación de la actividad 6.
  - Para cada grupo **G, M y P** se registran uno o varios recipientes (puede haber "un recipiente adicional identificado del mismo grupo"). Cada recipiente tiene: identificador (por defecto "G-T1-1"), **peso bruto (kg)**, **tara (kg)** (se descuenta una sola vez), **neto calculado** y **hora de clasificación**.
  - Opción **"No apareció (0 kg)"** por grupo: registra 0 kg y omite el grupo en la trituración de esa tanda.
  - **Fracciones separadas de la tanda:** FRUTA ROTA (kg), TALLOS (kg, opcional), PRUEBA (kg) y remanentes medidos (kg), cada una con recipiente y hora.
  - Total de la tanda por grupo.
  - Regla: "Una diferencia no se completa como merma supuesta". No se calcula ni se rellena merma.
  - Cerrar la tanda la bloquea para clasificación y la deja **lista para triturar**. El documento pide procesar los grupos de una tanda antes de seguir acumulando otra, así que si hay una tanda cerrada sin triturar, se avisa antes de abrir la siguiente.

### Paso 5 — Triturar con la configuración correspondiente (actividades 7, 8 y 9)
Por cada tanda cerrada, se trituran los grupos en la **secuencia P → M → G**, omitiendo los grupos con 0 kg. No se puede intercalar otro grupo. Para cada grupo:

1. **Aplicar el gap estándar (actividad 7)**
   - Mostrar el **gap del grupo según la tabla vigente**, con su versión, equipo y posición o marca. Sin gap aprobado → bloqueado (ver B1).
   - Lista de verificación de los ítems 1 a 3 de la actividad 7.
   - Campos: "Mantenimiento que aplicó el gap" (nombre) y **gap aplicado (mm)**, que se precarga con el estándar. Si difiere del estándar, se bloquea con el aviso "El operario no decide otro gap. Use la configuración vigente".
   - Aviso fijo: "No reajuste rodillos con el equipo en marcha."
2. **Triturar (actividad 8)**
   - Lista de verificación de los ítems 1 a 4 de la actividad 8.
   - **kg triturados** del grupo y hora de inicio y fin.
   - Aviso fijo: "El producto pasa una sola vez por los rodillos. No añada agua, azúcar, ácidos, enzimas ni otros productos."
   - Incidencia **"Entró otro grupo o se perdió la identificación"**: "Deje de alimentar e identifique la salida afectada para su evaluación". La salida afectada se registra como retenida.
3. **Comprobar la apertura de piel y la integridad de las semillas (actividad 9)**
   - Controles obligatorios **al inicio** y **al final** de cada grupo. También se agregan **después de una parada o ajuste**. El momento queda registrado: Inicio, Tras parada/ajuste o Final.
   - Campos del control:
     - bayas revisadas (por defecto 100),
     - **bayas abiertas**,
     - **bayas enteras**,
     - semillas revisadas (por defecto 100),
     - **semillas dañadas o fragmentos**,
     - hora,
     - recipientes afectados,
     - opción **"No evaluable: la fragmentación impide reconocer las bayas"**.
   - Criterios en la configuración, como "referencias internas a confirmar en las primeras visitas":
     - **≥ 90 de 100 bayas abiertas**,
     - **≤ 10 enteras**,
     - **0 semillas dañadas o fragmentos**,
     - **≥ 100 semillas revisadas**.
     - Si se revisan más o menos de 100 bayas, los criterios se escalan.
   - Resultado automático: **Conforme / No conforme / No evaluable**. Nota fija: "El resultado 0 observado no demuestra ausencia total de daño ni equivale a un porcentaje de semillas."
   - Si es **No conforme o No evaluable**, aparecen los botones de acción del PDF: **"Revisión" / "Ajustar gap" / "Detener"**. Además:
     - Se marca como **RETENIDO** el material generado **desde el último control conforme**, o desde el inicio si no hay uno. Se registran los kg y recipientes retenidos.
     - Se pide registrar la corrección. Si fue un ajuste de gap, lo registra Mantenimiento y queda como desviación respecto de la tabla.
     - Se **repite el control**.
     - Solo se continúa con la **conformidad de Producción** (nombre) y la **disposición de Calidad o Enología** para el material retenido (texto y nombre).

Un grupo queda **completo** cuando tiene gap aplicado, kg triturados, control de inicio, control final y, si hubo retenciones, sus disposiciones.

### Paso 6 — Entregar el producto y cerrar la operación (actividad 10)
- Lista de verificación de los ítems 1 a 3 de la actividad 10.
- **Entrega por grupo y tanda:** lote, grupo, cantidad (kg), hora y **destino**. Solo se entrega la salida autorizada; lo retenido sin disposición no se puede entregar.
- **Retenidos y remanentes:** resumen, con la disposición de Calidad o Enología, que **define el destino de las porciones examinadas y de las pruebas iniciales**.
- **Cierre de limpieza:** se solicita el aislamiento de los equipos, se aplica la limpieza final de la bodega y se devuelven los útiles. Lista de verificación, más responsable y hora. Nota: "Antes de otro lote no deben quedar restos identificables del anterior en la línea".
- **Cerrar operación:** pide nombre y rol (Producción). El registro queda **CERRADO**, o **CERRADO CON RETENIDOS** si hay material retenido.

## B3. Informe de trituración (dashboard)
Al cerrar, y desde la lista, `/trituracion/[id]`. Incluye **Imprimir / PDF** y es **editable con bitácora**, con la misma regla que A6 (editado por, rol, motivo y recálculo).

El informe muestra:
- **Encabezado:** código de lote (con enlace a la ficha de Recepción), variedad, peso disponible de entrada, estado del registro y fechas.
- **Balance de masa:**
  - kg de entrada (peso disponible),
  - kg clasificados en G, M y P (total y %),
  - FRUTA ROTA, TALLOS, PRUEBA, remanentes,
  - kg triturados por grupo,
  - kg retenidos,
  - kg entregados,
  - **"Diferencia no asignada"**, solo informativa y con la nota "No se completa como merma supuesta".
- **Gaps:** versión de la tabla usada, gap estándar y gap aplicado por grupo, y desviaciones.
- **Controles:** línea de tiempo de los controles de salida del despalillado y de la actividad 9, con su resultado y hora.
- **Incidencias:** atascos, intervenciones, pérdida de identificación y fotos.
- **Firmas y responsables:** cada firma con su rol, y la bitácora de cambios.
- **Gráficos simples:** distribución G/M/P y resultados de los controles.

## B4. Reportes, respaldo y vínculo
- En el informe del lote de Recepción, mostrar el estado de su trituración (Sin iniciar / En curso / Cerrado / Cerrado con retenidos) con un enlace.
- El **respaldo JSON** (exportar e importar) incluye los registros de trituración, las fotos, la configuración de gaps con sus versiones y las comprobaciones del Anexo B. Se mantiene la fusión sin duplicados y la compatibilidad con los respaldos anteriores.
- Eliminar un registro de trituración usa el mismo diálogo de confirmación (código y motivo) y la bitácora de eliminaciones.
- No se puede eliminar un lote de Recepción que tenga trituración vinculada sin eliminar antes la trituración. Avisar.

## B5. Pruebas de la Parte B
1. Intentar triturar un lote RETENIDO o con peso provisional → no se puede elegir y muestra el motivo.
2. Sin gaps aprobados → la trituración se bloquea. Aprobar la tabla (G = 4, M = 3,5, P = 3, solo como dato de prueba) → se habilita.
3. Lote LIBERADO de 1 494,75 kg disponibles → 2 tandas, con P en 0 kg en una de ellas → secuencia P → M → G respetada y P omitido donde corresponde.
4. Gap aplicado distinto del estándar → bloqueado.
5. Control con 85 abiertas → No conforme → se retiene desde el último conforme → acción "Ajustar gap" → nuevo control conforme → continuar solo con las firmas de Producción y Calidad.
6. Fruta rota en la salida del despalillado → aviso y registro en la tanda.
7. Cerrar con retenidos → estado "CERRADO CON RETENIDOS". El informe muestra el balance y la diferencia no asignada.
8. Exportar el respaldo, borrar los datos del sitio, importar → vuelven los lotes, las trituraciones, las fotos y la configuración.
9. Editar un dato del informe de trituración → queda en la bitácora y se recalcula.
10. Vista móvil a ≈390 px de todo el flujo y del informe impreso.

---

## Fases sugeridas
1. **Fase 1 — Parte A completa** (A1 a A7).
2. **Fase 2 — Base del módulo:** modelo de datos, capa de almacenamiento, navegación (B0), configuración de gaps con versiones y Anexo B (B1).
3. **Fase 3 — Pasos 1 a 4 del asistente** (recibir, despalillar, salida, clasificación y tandas).
4. **Fase 4 — Paso 5** (gap, trituración, controles de la actividad 9 con retenciones).
5. **Fase 5 — Paso 6, informe (B3), reportes, respaldo y vínculo (B4)**, y pruebas B5.

## Supuestos (confirmar con la bodega; todos van en la configuración)
- Peso disponible = neto − materia extraña − uva dañada − bolsa de muestra.
- 25 kg es el peso **neto** máximo por jaba.
- Los criterios de la actividad 9 (90 / 10 / 0 / 100) son referencias internas que se pueden cambiar.
- La porción de la comprobación inicial es de 5,0 kg.
- No existe ningún gap por defecto.
