# Matriz de reglas comerciales — MVP 0.2.0

**No constituye ingeniería estructural ni autorización de montaje.** Las reglas son comerciales preliminares y las excepciones específicas tienen prioridad.

| ID | Regla | Estado |
| --- | --- | --- |
| GEO-01 | H es la altura de plataforma de trabajo. Remate superior H+1 m. | Implementada |
| GEO-02 | H entero de 2 a 50 m. | Implementada |
| GEO-03 | Una bahía central permitida; longitudes 1400, 2072 y 3000 mm. | Implementada |
| GEO-04 | Dimensionamiento geométrico mínimo `H/4,3` por cada eje, redondeo arriba al milímetro. **No es prueba de estabilidad.** | Implementada |
| GEO-05 | Mínimo número de extensiones comerciales 750,1400,2072 y 3000 mm; varios módulos encadenados si la longitud exige. | Implementada en +X y +Y |
| GEO-06 | Base envolvente puede quedar en L; su área no es un polígono de estabilización certificado. | Advertencia explícita |
| GEO-07 | Altura de cada módulo escalonada aproximadamente `H−4×(ancho central + módulos internos)`, con paridad de H. | **Provisional** |
| EST-01 | H par: horizontales estructurales a 0,2,…H. | Implementada |
| EST-02 | H impar: horizontales estructurales a 0,1,3,…H. | Implementada |
| EST-03 | Dos alturas de baranda (+0,50 y +1 m) en cada nivel de acceso de la torre central. | Hipótesis comercial |
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