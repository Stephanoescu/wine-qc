# Prompt para Claude Code — Rediseño del módulo "Recepción y Evaluación de Uva"

Trabajas en el proyecto **wine-qc** (Next.js, desplegado en https://wine-qc.vercel.app). Es una app de control de calidad para la bodega *Viña D' Los Campos* (Cañete, Perú). Hay que rediseñar el asistente de `/recepcion` y ajustar `/reportes`, según los requerimientos de abajo.

## Antes de escribir código

1. Explora el repositorio: estructura de `app/`, componentes del asistente de recepción, cómo se guardan los lotes (qué base de datos o servicio usa, esquema, variables de entorno) y cómo `/reportes` lee esos datos.
2. Muéstrame un **plan breve**: archivos a tocar, nuevo modelo de datos y cómo migrarás el esquema. Espera mi OK antes de implementar.
3. Mantén el estilo visual actual (colores azul marino/dorado, tarjetas, barra de pasos, iconos). Todo el texto de la interfaz va en español.

## Reglas generales

- Todos los rangos y umbrales deben ir en **un solo archivo de configuración** (p. ej. `lib/config/recepcion.ts`), no en el código de los componentes.
- Las listas de verificación ("check list") son ítems marcables. El botón **Siguiente** solo se habilita cuando todos los ítems del paso están marcados y los campos obligatorios son válidos.
- Validación de entradas numéricas: no aceptar negativos, vacíos ni valores físicamente imposibles. Límites sugeridos: °Brix 0–40, pH 0–14, temperatura −5–50 °C, pesos > 0, N° de jabas entero ≥ 1.
- El estado del asistente debe conservarse al ir con **Atrás/Siguiente**.
- La barra de pasos ahora tiene 9 pasos: debe verse bien en móvil (scroll horizontal o versión compacta "Paso X/9").
- Debe funcionar en celular, porque se usa en la zona de recepción.

---

## Paso 1 — Identificación del lote

Cambios sobre el formulario actual:

- **Variedad de uva**: preseleccionar **"Borgoña Blanca"** por defecto. El usuario puede cambiarla en el desplegable, pero siempre arranca en Borgoña Blanca.
- **Eliminar** el campo "Procedencia (Cuartel / Sector)" y **agregar** el campo **"Origen"** (texto, obligatorio).
- **Eliminar** "Peso neto del lote (kg)". El peso ahora se calcula en el paso 3.
- **Agregar** "Número de jabas" (entero ≥ 1, obligatorio). De este valor dependen los pasos 3 y 4.
- Se mantienen: Proveedor / Viña, Fecha de ingreso, Hora de ingreso y Código de lote (autogenerado).

## Paso 2 — Instrumentos, equipos y materiales

Título: **"Instrumentos, equipos y materiales"**. Lista de verificación con estos ítems, que deben estar todos marcados para continuar:

1. Mesa de inspección y bandejas
2. Recipientes para "materia extraña" y "uva dañada"
3. Ficha del lote, etiquetas y bolsas con cierre
4. Balanza
5. Termómetro de sonda, funda y estuche
6. Colador, gotero y vasos de trabajo
7. Refractómetro
8. Medidor de pH con electrodo, tapa y soporte
9. Agua destilada, papel suave y solución de conservación
10. Productos y útiles de limpieza

## Paso 3 — Inspección de carga / peso

### Sección A: "Inspección de carga" (lista de verificación)

1. "Identifique todas las jabas (carga recepcionada) con el mismo código de lote. Para distinguirlas, asigne un número diferente a cada caja (rotule las jabas) y déjelo visible por fuera."
2. "Observe las cajas, los racimos y cualquier líquido que esté en contacto con la uva. Busque vidrio, metal, excrementos, rastros de combustible, aceite u otros productos químicos."
   - Al lado de este ítem va un control **"¿Hay observaciones?" (Sí/No)**.
   - Si es **Sí**, se habilita un registro de observaciones con **N° de jaba** (validar que esté entre 1 y el número de jabas) y **Descripción de lo observado**. Debe permitir agregar varias filas y tener un atajo para escribir «líquido de origen desconocido».
   - Si hay al menos una observación, mostrar debajo un aviso de recomendación: **"Inspeccionar carga: revise las jabas observadas antes de continuar con la descarga."**

### Sección B: "Pesado" (misma página)

Lista de verificación:

1. Con la balanza vacía, compruebe que la pantalla marque cero.
2. Ponga una caja llena en la balanza. Anote su número y el peso que indica la pantalla. Repita con cada caja.
3. Para cada caja, use el peso vacío de esa misma caja, registrado antes del llenado. Si aún no dispone de él, anote el peso lleno y complete la tara cuando la descarga esté autorizada.
4. Reste el peso vacío al peso lleno y sume los netos de las cajas. Si usó la función TARA para descontar esa caja vacía, la lectura ya corresponde al neto.

Debajo va una fila por jaba, generada según el "Número de jabas" del paso 1:

- Jaba N° | Peso lleno (kg) | Tara (kg) | Neto (kg, calculado = lleno − tara)
- Un interruptor general **"Usé la función TARA de la balanza"**: si está activo, se oculta la columna de tara y el peso ingresado es directamente el neto.
- La tara puede quedar **pendiente**: la jaba se marca como "tara pendiente" y se muestra un aviso.
- Validar que la tara sea menor que el peso lleno.
- Al final, en grande: **PESO NETO TOTAL (kg)**, la suma de los netos. Si hay taras pendientes, indicar que el total es parcial.
- Si son muchas jabas, la lista debe ser cómoda en móvil: inputs compactos y que el teclado numérico avance a la siguiente jaba.

## Paso 4 — Muestreo y temperatura

### Tamaño de muestra

Calcular automáticamente cuántas jabas inspeccionar según el número total de jabas:

| Total de jabas | Jabas a inspeccionar (mínimo) |
|---|---|
| 1 a 5 | todas |
| 6 a 100 | 5 |
| 101 a 300 | 7 |
| 301 a 500 | 9 |
| 501 a 1 000 | 10 |
| Más de 1 000 | 15 |

Mostrar: **"Seleccione al azar N jabas que debe inspeccionar (realice la toma desde distintas zonas y niveles de la carga)."**

Además, sugerir N números de jaba aleatorios sin repetir, con un botón "Generar otra selección". El usuario puede editarlos. Estas son las **jabas seleccionadas** que se usan en los pasos 4 y 5.

### Lista de verificación: preparación

1. De las cajas seleccionadas de diferentes sectores de la carga, colóquela sobre la mesa limpia de inspección.
2. Mire la caja desde arriba y ubique su centro. Ese es el punto por donde entrará la sonda hasta quedar entre las uvas.

### Lista de verificación: medición de temperatura

1. Retire la funda de la sonda y déjela en la bandeja de utensilios limpios.
2. Introduzca la sonda por el centro de la caja hasta quedar entre las uvas. Verifique que toda la parte sensible indicada en el manual toque la fruta. Evite apoyar la punta de la sonda en el fondo o las paredes.
3. Mantenga quieta la sonda hasta que el equipo indique que la lectura está estable. Lea los °C, anote el valor junto al número de caja y saque la sonda.
4. Antes de medir la siguiente caja, lave la parte de la sonda que tocó la uva y enjuáguela con agua potable. Deje escurrir y secar al aire antes de medir otra caja. Al finalizar, coloque la funda en la sonda limpia y seca y guarde el termómetro en su estuche.

### Registro de temperaturas

- Un campo de temperatura (°C) por cada jaba seleccionada, con su número de jaba.
- Regla por lectura: si la temperatura es **> 20 °C**, mostrar **"Conforme"**. Si no, mostrar **"No conforme — Avise a Enología"**.
- El umbral de 20 °C va en el archivo de configuración.

### Lista de verificación: muestra de bayas

1. Después de medir la temperatura, rotule una bolsa limpia con cierre. Escriba el mismo código del lote, la fecha y la hora.
2. Elija 20 racimos en total, repartidos entre las cajas seleccionadas. Tome racimos de distintas posiciones, sin escogerlos por su aspecto.
3. Retire cinco bayas de cada racimo. Tome dos de arriba, una del centro y dos de abajo, alternando los lados. Ponga las bayas sin lavar en la bolsa. Deje el resto de cada racimo en su caja.
4. Cierre la bolsa y pésela con las bayas. Reserve la bolsa cerrada e identificada para preparar el jugo.

Debajo va el campo **"Peso de la bolsa con bayas (g)"**, obligatorio.

## Paso 5 — Inspección de las cajas

Instrucciones visibles:

1. Revise una jaba seleccionada a la vez. Coloque la jaba sobre la mesa de inspección. Saque los racimos uno a uno sobre la mesa limpia y gírelos para ver ambos lados. Mire también el fondo de la caja. Registre el hallazgo. Adjunte una foto si corresponde.
2. Busque hojas sueltas, tierra, piedras, plástico o madera. Observe la uva para detectar piel rota, arrugamiento, manchas marrones, moho o descomposición. Si percibe olor a vinagre o fermentación, registre el hallazgo.

### Parámetros

Se mantienen las tarjetas actuales con imagen y descripción, pero **se quitan los campos en kg y los límites en %**. Parámetros:

- Podredumbre / Moho
- Bayas dañadas
- Deshidratación
- Bayas verdes
- Materia extraña
- Olor a vinagre / fermentación (nuevo)

Cada tarjeta tiene un control **"Se observa" / "No se observa"**. Es obligatorio elegir uno.

Si se elige **"Se observa"**:

- Se habilita **adjuntar o tomar una foto** (`<input type="file" accept="image/*" capture="environment">`). Comprimir la imagen en el cliente y guardarla con el almacenamiento que ya use el proyecto. Si no hay ninguno, propónmelo en el plan.
- Se habilita un campo opcional **N° de jaba / comentario**.

Si hay al menos un parámetro observado, mostrar un aviso destacado:

> **Identifique y aísle el lote, y avise a Calidad. Registre la decisión de Enología.**

Debajo del aviso va un campo de texto **"Decisión de Enología"**, que es obligatorio solo en ese caso.

### Separación de hallazgos

Instrucción: "Para los hallazgos, use dos recipientes limpios. Ponga las impurezas en el recipiente rotulado «Materia extraña» y las bayas dañadas en el recipiente rotulado «Uva dañada»."

Campos:

- **Peso de materia extraña (kg)**. Al lado se calcula y muestra la fórmula:
  `Materia extraña (%) = kg de materia extraña ÷ kg de contenido inspeccionado × 100`
- **Peso de uva dañada (kg)**. Al lado se calcula y muestra:
  `Uva dañada (%) = kg de uva dañada ÷ kg de contenido inspeccionado × 100`
- **kg de contenido inspeccionado** = suma de los pesos netos (del paso 3) de las **jabas seleccionadas**. Mostrar este valor. Si falta la tara de alguna, avisar.
- Validar que los kg separados no superen el contenido inspeccionado.

## Paso 6 — Muestreo de jugo y °Brix

Lista de verificación:

1. Cierre la bolsa previamente pesada y presione las bayas suavemente desde afuera hasta obtener jugo, sin triturar las semillas.
2. Mezcle el jugo dentro de la bolsa. Abra la bolsa y vierta el jugo a través de un colador limpio colocado sobre un vaso limpio identificado con el código del lote.
3. Use ese vaso como fuente del jugo. Reserve tres porciones para °Brix, dos para pH y una porción para entregar al laboratorio para el análisis de acidez.
4. Mezcle el jugo del vaso identificado. Con el gotero limpio coloque jugo suficiente para cubrir el prisma del refractómetro. Lea los °Brix que muestra y anote el primer valor como B1.
5. Retire el jugo del prisma, límpielo y séquelo. Aplique una porción nueva del mismo jugo y anote la segunda lectura como B2. Repita la limpieza, el secado y la carga con otra porción para obtener B3.

Campos **B1, B2, B3**, con el **promedio** calculado. Rango de referencia: **18 a 24 °Brix**.

- Si el promedio está dentro del rango, mostrar **"Conforme"**.
- Si está fuera de rango (1.ª ronda), mostrar el aviso: **"Laboratorio: revise el control del refractómetro y repita las tres lecturas con jugo nuevo."** y habilitar una **2.ª ronda** de tres campos nuevos (B1', B2', B3') con su promedio.
  - Si la 2.ª ronda está en rango, mostrar **"Conforme"**.
  - Si vuelve a estar fuera de rango, mostrar **"No conforme — Retenga el lote para Enología"**. Esto marca el lote como RETENIDO.
- Guardar ambas rondas.

## Paso 7 — pH y acidez titulable

Lista de verificación:

1. Mezcle el jugo del vaso del lote sin agregar agua. Repártalo en dos vasos limpios identificados con el lote y los números 1 y 2. Use suficiente jugo para cubrir la zona sensible del electrodo.
2. Retire la tapa y enjuague el electrodo con agua destilada. Introdúzcalo en el vaso 1. Sumerja el bulbo (la punta de vidrio) y la unión de referencia (la zona próxima a la punta) hasta la profundidad indicada por el fabricante. Evite tocar las paredes y el fondo.
3. Espere la señal de estabilidad y lea el pH. Regístrelo como pH1. Si el medidor muestra la temperatura, léala con el sensor aún en el jugo y anótela en °C. Enjuague el electrodo, retire el exceso de agua sin frotar y repita la medición de pH en el vaso 2 para obtener pH2.
4. Calcule el promedio y la diferencia entre la lectura mayor y la menor. Mantenga el jugo de los dos vasos separado del vaso original.

Campos: **pH1**, **pH2** y **Temperatura del jugo (°C, opcional)**. Calcular y mostrar el **promedio** y la **diferencia (mayor − menor)**. Rango de referencia: **pH 3,0 a 3,5**.

Se aplica la misma lógica que en °Brix:

- Dentro del rango: **"Conforme"**.
- Fuera de rango: **"Pida al laboratorio que revise el control del medidor y repita con dos porciones nuevas."** y habilitar una 2.ª ronda (pH1', pH2').
- Si la 2.ª ronda también queda fuera de rango: **"Se confirma — Retenga el lote para Enología"** (lote RETENIDO).

Lista de verificación final de la misma página (cuidado del electrodo):

1. Retire el electrodo del vaso de jugo y enjuáguelo con agua destilada. Tome la tapa y la solución de conservación que el fabricante indica para ese electrodo.
2. Ponga en la tapa suficiente solución de conservación para que, al colocarla, el bulbo y la unión queden húmedos. Coloque la tapa protegiendo la punta.
3. Sujete el electrodo en su soporte. Guarde el medidor limpio y seco en la zona de instrumentos.

## Paso 8 — Registrar la acidez informada por el laboratorio

Lista de verificación:

1. Entregue al laboratorio jugo suficiente para dos ensayos de 10,0 mL. Use un vaso limpio identificado con el código del lote y tome el jugo.
2. Al recibir el resultado, coteje el código de lote. Compruebe que el informe indique el método, el punto final y el valor en g/L como ácido tartárico.

Campos:

- **Método** (texto)
- **Punto final** (texto)
- **Valor (g/L como ácido tartárico)** (número)

Rango de referencia: **6 a 10 g/L**.

- Dentro del rango: **"Conforme"**.
- Fuera de rango: **"Solicite al laboratorio que confirme el resultado."** y un control **"¿El laboratorio confirmó el valor?"**. Si se confirma, se mantiene el lote RETENIDO para evaluación.
- El resultado de laboratorio puede tardar. Hay que permitir **guardar el lote con la acidez pendiente**: estado RETENIDO con motivo "Acidez pendiente". Después se debe poder completar ese dato desde el detalle del lote en `/reportes`.

## Paso 9 — Decisión del lote y parámetros de evaluación

Este paso reemplaza la clasificación A/B/C por **tres estados**:

- **LIBERADO**: no hay ninguna observación ni ningún parámetro fuera de rango. Requiere una **disposición firmada que autorice el destino**, con los campos "Autorizado por" (nombre) y "Destino" (código o tanque), ambos obligatorios.
- **RETENIDO**: hay sospecha de contaminación o deterioro, o la evaluación sigue pendiente. Cubre cualquier observación en el paso 3 o 5, temperatura no conforme, °Brix/pH/acidez fuera de rango, tara pendiente o acidez pendiente.
- **RECHAZADO**: el lote ya fue evaluado y el resultado no cambia (la re-medición o la confirmación sigue fuera de rango). Requiere que **Enología confirme y documente el motivo y el destino**, con los campos "Confirmado por (Enología)", "Motivo" y "Destino", todos obligatorios.

Comportamiento:

- El sistema **sugiere** el estado de forma automática y muestra la lista de motivos, es decir, cada parámetro no conforme y en qué paso ocurrió.
- El usuario puede pasar de RETENIDO a RECHAZADO completando los campos de Enología.
- No se puede elegir LIBERADO si existe cualquier no conformidad.

Antes de guardar y generar el informe, mostrar una lista de verificación final que debe completarse:

1. Compruebe que el destino esté limpio, que su código coincida con el lote y que la autorización corresponda a ese destino.
2. Limpie el colador, las bandejas y los vasos con el material autorizado. Guarde el termómetro limpio, seco y protegido, el refractómetro con el prisma limpio y el electrodo como se indicó.

Luego se activa **"Guardar lote y generar informe"**.

## Informe final del lote (después de guardar)

Página o vista tipo **dashboard** del lote recién guardado, con lo más importante de pruebas e inspecciones:

- Encabezado: código de lote, proveedor, origen, variedad, fecha y hora, N° de jabas, **peso neto total**, y el **estado** en grande con su color (verde LIBERADO, ámbar RETENIDO, rojo RECHAZADO).
- Tarjetas de resultados con su etiqueta Conforme/No conforme:
  - Temperatura: mínimo, máximo y por jaba.
  - Promedio de °Brix, con las rondas si las hubo.
  - Promedio de pH y diferencia.
  - Acidez titulable.
  - % de materia extraña.
  - % de uva dañada.
- Lista de observaciones de carga (N° de jaba y descripción) y parámetros visuales observados, con miniaturas de fotos.
- Decisión de Enología, autorización y destino.
- Botón para imprimir o exportar a PDF (puede usar `window.print()` con estilos de impresión).

## Ajustes en `/reportes`

- Cambiar los indicadores Cat. A/B/C por **Liberados / Retenidos / Rechazados**, con sus filtros y gráfico.
- La tabla debe mostrar: lote, proveedor, origen, variedad, fecha, N° de jabas, peso neto, °Brix, pH, acidez, estado.
- Agregar acceso al **detalle del lote**, que muestra el mismo informe final. Desde ese detalle se debe poder completar la acidez pendiente o la tara pendiente, y actualizar el estado (de RETENIDO a LIBERADO o RECHAZADO), siguiendo las mismas reglas de firma.
- En móvil, el enlace "Ver reportes" del encabezado de `/inicio` debe quedar visible, porque hoy desaparece.

## Datos y compatibilidad

- Actualiza el modelo o esquema del lote con todos los campos nuevos (jabas con pesos, selección de muestra, temperaturas, observaciones con fotos, rondas de °Brix y pH, acidez, estado, firmas, motivos y destino).
- Si hay lotes antiguos con el formato A/B/C, no los rompas: muéstralos con una etiqueta "formato anterior" o mapea su categoría de forma razonable, y dime qué elegiste.

## Al terminar

1. Ejecuta lint, type-check y build sin errores.
2. Prueba el flujo completo en tres escenarios y dime el resultado de cada uno:
   - **(a)** Lote limpio que debe quedar LIBERADO.
   - **(b)** Lote con °Brix fuera de rango en dos rondas, que debe quedar RETENIDO.
   - **(c)** Lote con observación de carga más la decisión de Enología de rechazar, que debe quedar RECHAZADO.
   Incluye 100 jabas para verificar que pide 5 jabas de muestra, y valores inválidos (negativos, pH 20, tara mayor que el peso lleno) para verificar que se bloquean.
3. Revisa la vista móvil (≈390 px de ancho).
4. Resume los cambios y lista cualquier supuesto que hayas tomado.
