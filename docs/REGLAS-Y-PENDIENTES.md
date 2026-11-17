# Matriz de reglas comerciales — MVP 0.3.3

**No constituye ingeniería estructural ni autorización de montaje.** Las reglas son comerciales preliminares y las excepciones específicas tienen prioridad.

| ID | Regla | Estado |
| --- | --- | --- |
| GEO-01 | H es la altura de plataforma de trabajo. Remate superior H+1 m. | Implementada |
| GEO-02 | H entero de 2 a 50 m. | Implementada |
| GEO-03 | Malla de bahías centrales con tramos 750, 1400, 2072, 3000 mm en ambos ejes; hasta 10 tramos por eje. | Implementada |
| GEO-04 | Dimensionamiento geométrico mínimo `H/4,3` por cada eje, redondeo arriba al milímetro. **No es prueba de estabilidad.** | Implementada |
| GEO-05 | Mínimo número de extensiones comerciales 750,1400,2072 y 3000 mm; varios módulos encadenados si la longitud exige. | Implementada en +X y +Y |
| GEO-06 | Base envolvente puede quedar en L; su área no es un polígono de estabilización certificado. | Advertencia explícita |
| GEO-07 | Altura de cada módulo escalonada aproximadamente `H−4×(ancho central + módulos internos)`, con paridad de H. | **Provisional** |
| EST-01 | H par: horizontales estructurales a 0,2,…H. | Implementada |
| EST-02 | H impar: horizontales estructurales a 0,1,3,…H. | Implementada |
| EST-03 | Dos alturas de baranda (+0,50 y +1 m) sobre la plataforma superior de trabajo. La bahía 1400×1400 con acceso caracol conserva barandas en niveles intermedios con plataformas de tránsito; los otros niveles intermedios se tratan como accesos con escotilla, no pisos completos. | Regla comercial implementada; validar protección física |
| EST-04 | Deducción de horizontales físicas repetidas por coordenadas, SKU y elevación. | Implementada |
| EST-05 | Diagonal en cada cara central por cada tramo de 2 m; en extensiones, en caras expuestas. | Implementada por tramos completos |
| EST-06 | Diagonal de 1 m en tramo incompleto de extensión. | **No calculada** |
| EST-07 | Dos diagonalados de unión por extensión. | Pendiente SKU / detalle / conexión |
| EST-08 | Base Collar uno por nodo de apoyo; un pin por empalme real. | Implementada en módulos representados |
| EST-09 | Verticales centrales de 2 m, remate de 1 m y tramo inferior de 1 m cuando H es impar. | Implementada; validar espigos |
| ACC-01 | H par: escotillas y escaleras a 2,4,…H. | Implementada |
| ACC-02 | H impar: tres plataformas de arranque (0,0,50,1 m); primera escotilla a 3 m y siguientes cada 2 m. | Implementada parcialmente; soportes pendientes |
| ACC-03 | H impar: no instalar escotilla a 1 m. | Implementada |
| ACC-04 | 1400×1400 mm: dos plataformas de 320×1400 por escotilla, incluida intermedia. | Implementada |
| ACC-05 | 1400×1400 mm: cierre perimetral completo; cero horizontales 750 mm de cierre interior. | Implementada |
| ACC-06 | Otras medidas: cierres de escotilla con 2×vertical de 1m, 4×horizontal 750 y 4×horizontal de longitud de escotilla. | Cantidad provisional; geometría física pendiente |
| ACC-07 | 750×1400, H≥4, acceso tipo gato. | **Fuera de alcance** |
| PLA-01 | Cubierta superior según central: 2 para 1400×1400, 4 para 2072×2072, 7 para 3000×3000 más escotilla. | Implementada |
| BAS-01 | H ≤12: tornillos planos y ruedas alternativamente, ambos en tabla comercial. | Implementada |
| BAS-02 | H >12: solo tornillos niveladores planos. | Implementada |
| QA-01 | Total por SKU exacto, suma de orígenes, unicidad de referencias. | Implementada |
| QA-02 | Pruebas de regresión 6,8,10,17,49,50 m y combinatoria 5 bases×49 alturas. | Implementada |

## Riesgos y límites pendientes de validación

- Los 4,3:1 se aplican **solo como filtro geométrico comercial**. La estabilidad debe calcularse conforme a condiciones reales y normativa aplicable.
- En especial a 50 m, la planta representada con prolongaciones en L puede resultar totalmente inadecuada para estabilidad: no se debe interpretar como un diseño aprobado.
- Los módulos encadenados representan un **esquema geométrico**, no un detalle estructural completo de conexiones y estabilizadores.
- La suma de SKU excluye diagonalados sin referencia real, anclajes y fijaciones de accesos en alturas impares.
- Los rodapiés y niveles de protección se calculan con el criterio comercial preliminar; requiere conciliación con manual del sistema.
- Ampliar alturas no supone incorporar soportes a pared, varias bahías centrales, ni cargas admisibles.

## Casos mínimos automatizados

- 6 m / 1400×1400: sin extensiones, 4 apoyos, 3 escotillas, 7 plataformas metálicas.
- 8 m / 1400×1400: extensiones 750 mm H2 por eje, 8 apoyos, acceso caracol.
- 10 m / 2072×1400: extensiones 750 mm H2 y 1400 mm H4.
- 17 m / 3000×3000: 8 escotillas desde 3 m, alturas de extensión 5 m, tornillo plano únicamente.
- 49 m / 3000×3000: alturas impares, 24 escotillas, arranque escalonado pendiente de apoyos.
- 50 m / 3000×3000: tres módulos de 3000 mm encadenados por eje (+X y +Y), alturas comerciales estimadas 38,26,14 m; 16 apoyos planos y 25 escotillas; **no es un plan de montaje**.
- 50 m / 1400×1400: cuatro módulos por eje, sin interiores de 750 mm de escotilla.

## Versión 0.3 — Área modular libre

- El largo central X y el ancho central Y se componen de arreglos ordenados de tramos elegidos entre **750, 1400, 2072, 3000 mm**. Existen **16 combinaciones de una sola bahía**, más secuencias de 2 a 10 bahías por dirección.
- Las dimensiones totales son `X=sum(baysX)`, `Y=sum(baysY)` y el área en m² `X*Y/1_000_000`; no se inventan horizontales de longitud total: se usan **solo las cuatro referencias comerciales** de horizontales.
- Nodos centrales únicos `(nX+1)*(nY+1)`. Cada nueva tira de extensión +X añade `nY+1` apoyos; cada tira +Y añade `nX+1`.
- Las horizontales se generan en las aristas de la cuadrícula a las cotas estructurales, barandas en el perímetro exterior y diagonales sobre los tramos de caras compartidas una sola vez.
- En cubierta superior se calcula cada **paño modular** mediante las pistas de 320 mm de la plataforma comercial; las piezas de longitud 750 mm existen en el inventario. La selección de cubierta continua, soportes y tránsito requiere revisión técnica.
- Se elige **una sola bahía de acceso** que tenga dos dimensiones ≥1,40 m, priorizando 1,40×1,40 para su acceso tipo caracol. En el resto de paños no se agregan escotillas ficticias.
- Caso único 0,75×1,40 m de H=2: escotilla superior y dos plataformas de arranque. H≥4: acceso gato preliminar, sin escotillas ni escaleras y con la cara estrecha de acceso sin diagonales.
- Cuando ninguna bahía tiene acceso establecido (p.ej. **0,75×0,75** o **0,75×2,072** aisladas), la app **muestra un despiece estructural parcial**, con concepto de acceso pendiente; no inventa referencia de escotilla.
- La estimación de plataformas, bases extensibles y estabilidad de torres de varios módulos **no es un plano, certificación ni aprobación de montaje**. Debe validarse la selección de bay de acceso, continuidad de piso, plataformas de paso, diagonales y apoyos compartidos.
## Corrección 0.3.1 — Horizontales de 3000 mm para H=10 m y base 3×3 m

- Estructura: 6 niveles (0,2,4,6,8,10 m) × 4 lados = **24** horizontales de 3000 mm.
- Dos barandas sobre la plataforma de trabajo superior: 2 alturas (10,50 y 11 m) × 4 lados = **8** horizontales de 3000 mm.
- Cerramientos interiores de cuatro escotillas de acceso intermedias: 4 cierres × 4 horizontales largos = **16** horizontales de 3000 mm.
- **TOTAL AMD.HZ.3000 = 48**, frente a los 80 que contabilizaba erróneamente la versión anterior al suponer barandas exteriores para todos los niveles de tránsito.
- Los niveles intermedios con escotilla no se consideran pisos completos de trabajo por defecto. Si hay pisos intermedios completos, hacen falta plataformas, barandas y rodapiés adicionales; la aplicación aún no permite configurarlos de manera diferenciada.
- La protección efectiva contra caídas de cada acceso y las conexiones físicas de cerramientos requieren revisión según el manual del sistema y la normativa aplicable. Este conteo es comercial preliminar, no autorización de montaje.

## Corrección 0.3.2 — Acceso longitudinal en bahías de 0,75 m

- **0,75 × 2,072** y **0,75 × 3,00 m** (rotadas incluidas): escaleras y escotillas longitudinales cada 2 m, con cerramientos perimetrales de dos barandas (+0,50/+1,00 m) en cada nivel de acceso.
- **Plataforma inicial para H par:** dos plataformas longitudinales de 2,072 o 3,00 m, donde apoya la primera escalera. H impar mantiene tres plataformas escalonadas; falta validar apoyos específicos.
- **No duplicar los cierres interiores** de escotilla en estas dos geometrías: los cierres se representan con barandas de perímetro y se debe comprobar físicamente la protección y la apertura.
- **Excepción:** bahía única **0,75 × 1,40 m con H≥4 m** sin escaleras ni escotillas, por bloqueo físico entre escalera superior y escotilla inferior; acceso tipo gato provisional. **H=2 m** conserva el caso previo de una escotilla y una escalera.
- **0,75 × 0,75 m:** acceso todavía sin resolver; no inventar escotillas.
- Se deben revisar **separación de barandas, dimensiones útiles de escotilla, interferencia de escaleras y protecciones contra caídas** antes de utilizar la lista para ingeniería o montaje.

## Regla GEO-08 / Versión 0.3.3 — Presupuesto solicitado sin bases extensibles

- Modo optativo **«Sin bases extensibles por solicitud del cliente»**. Mantiene todas las bahías de la torre, calcula sus piezas, no crea extensiones en X/Y y permite que el caso no cumpla H/base ≤ 4,3; **no cambia la selección automática de la modalidad normal**.
- Se conserva el cociente real en ambos ejes y se indica `meetsCommercialFootprint=false` si no cumple el filtro geométrico. Esto **no equivale a certificar estabilidad de ninguna configuración**.
- Es obligatorio registrar **sistema de estabilización externa y anclajes pendientes de diseño** fuera del total SKU. No inferir cantidad, ubicación, SKU ni conexión de estos elementos. Las condiciones de carga, resistencia, soporte, cargas de viento, anclajes y programa de montaje requieren proyecto y aprobación técnica.
- Los totales comerciales incluyen únicamente elementos Ring Lock parametrizados para la torre central y los apoyos disponibles, **sin accesorios de estabilización externos**. El estado del cálculo debe señalar `ESTABILIDAD NO VERIFICADA` y `NO APTO COMO PLAN DE MONTAJE`.
- La casilla de la interfaz exige una selección explícita, para que pedir una torre sin extensiones no se confunda con el dimensionamiento automático.
- Se documentan pruebas para H10 de 1,40×1,40 (no cumple H/4,3, 4 apoyos), H12 de 0,75×3,00, H50 de 3×3 y H6 de 1,40×1,40.
