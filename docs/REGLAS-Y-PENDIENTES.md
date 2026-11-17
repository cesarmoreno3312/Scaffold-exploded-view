# Registro de reglas de parametrización — MVP 0.1.1

**Objeto:** despieces comerciales preliminares de una bahía central Ring Lock y extensiones adyacentes en L. Fuente del catálogo: `PIEZAS CONSTRUYEQUIPOS.xlsx` (67 referencias). **No es una validación estructural.**

| ID | Regla / criterio | Estado de parametrización |
|---|---|---|
| GEO-01 | `H` es altura de plataforma de trabajo; protección superior a `H + 1 m`. | Implementada |
| GEO-02 | Módulos comerciales base 0.75, 1.40, 2.072, 3.00 m. | Implementada |
| GEO-03 | Extensiones hasta dos lados adyacentes +X y +Y; nodos compartidos únicos. | Implementada |
| GEO-04 | `H/4,3` como dimensión mínima geométrica comercial por eje (redondeo hacia arriba al milímetro); si la base central cumple, las extensiones son cero. | Implementada, **no es evaluación de estabilidad** |
| GEO-05 | Altura tentativa de extensión por fórmula `H - 4×dimensión eje`, al múltiplo par de 2 más próximo, mínimo 2 m. | **Provisional, editable** |
| EST-01 | Horizontales estructurales pares: `0,2,4,…,H`. | Implementada |
| EST-02 | Dos barandas por nivel de acceso a `+0.50` y `+1.00 m`, alrededor del perímetro central. | Implementada como hipótesis de protección |
| EST-03 | No contar horizontales iguales en mismos extremos y elevación. | Implementada por deduplicación geométrica |
| EST-04 | Una diagonal por cara y tramo de 2 m, torre central completa. | Implementada |
| EST-05 | Extensiones diagonales en tres caras expuestas; no duplicar la cara compartida. | Implementada |
| EST-06 | Dos diagonalados de unión adicionales por extensión. | **Pendiente SKU real y detalle constructivo** |
| EST-07 | Una Base Collar por apoyo único; pin por empalme vertical real. | Implementada |
| EST-08 | Verticales centrales de 2 m, 1 m terminal para baranda; nuevas líneas de extensión. | Implementada; selección con/sin espigo **provisional** |
| ACC-01 | Torres 1.40×1.40: escotilla cada 2 m, dos plataformas metálicas de 1.40 junto a cada escotilla, una de arranque. | Implementada |
| ACC-02 | Torres 1.40×1.40: no agregar horizontales interiores de 0.75 m para escotillas. | Implementada |
| ACC-03 | Torres no 1.40×1.40: cierres intermedios con 2 verticales 1 m, 4 horizontales 0.75, 4 de longitud de escotilla. | Implementada por conjuntos; ubicación física **pendiente** |
| ACC-04 | H par: escaleras y escotillas a 2,4,…,H. | Implementada |
| ACC-05 | H impar: plataformas iniciales a 0,0.50,1 m, **sin escotilla a 1 m**, escotillas desde 3 m cada 2 m. | **Pendiente siguiente versión** |
| ACC-06 | Torre 0.75×1.40 H≥4: acceso tipo gato, sin diagonales en cara de acceso. | **Pendiente siguiente versión** |
| PLA-01 | Nivel superior completo: para 1.40×1.40 dos plataformas junto a escotilla; 2.072×2.072 cuatro; 3×3 siete. | Implementada |
| PLA-02 | Rodapiés perimetrales solamente en plataforma de trabajo superior del MVP. | Implementada |
| BAS-01 | H≤12 m: ambas alternativas de base en tabla, excluyentes en montaje. | Implementada |
| BAS-02 | H>12 m: solo tornillo nivelador plano. | **Pendiente versión con alturas altas** |
| CAT-01 | Resolver cada pieza por código exacto del inventario. | Implementada; 67 códigos |
| QA-01 | Total SKU por suma de filas; prueba de integridad de cada origen. | Implementada |

## Criterios de bloqueo de salida técnica

1. Si el diámetro, longitud, uso o referencia de una pieza no está confirmado, se registra como **pendiente fuera del total SKU**.
2. Si una base no cumple `H/4,3` en cualquier eje, la selección de la aplicación se rechaza; ello **no garantiza que una base que sí lo cumpla sea estable**.
3. El usuario debe ver siempre la leyenda **NO APTO COMO PLAN DE MONTAJE**.
4. Una extensión en L requiere revisión de estabilidad en todos los sentidos, especialmente hacia los costados no extendidos.
5. Antes de habilitar exportaciones de montaje o emitir certificados se necesitarán verificación estructural y aprobación de ingeniería.

## Casos de regresión

- **6 m, 1.40×1.40:** `6/1,40 = 4,286 ≤ 4,3`; sin extensiones en ambos ejes, 4 apoyos, 3 escotillas, 3 escaleras, 7 plataformas metálicas y 0 diagonalados de unión pendientes.
- **8 m, 1.40×1.40:** `8/1,40 = 5,714 > 4,3`; sigue requiriendo extensiones.

- 8 m, 1.40×1.40, dos extensiones de 0.75 m de 2 m; 4 escotillas, 9 plataformas y 0 cierres interiores; 56 horizontales 1.40, 8 horizontales 0.75; 18 diagonales 1.40, 4 diagonales 0.75.
- 10 m, 2.072×1.40, extensiones 0.75 m/H2 y 1.40 m/H4; 5 escotillas, 3 plataformas; 51 horizontales 2.072, 40 horizontales 1.40, 20 horizontales 0.75; 12 diagonales 2.072, 15 diagonales 1.40, 2 diagonales 0.75.
- 10 m, 3×3 sin extensiones; 8 plataformas metálicas (1 arranque +7 piso superior); 4 puntos de apoyo.

**Atención:** las cifras de regresión verifican la lógica comercial acordada, no cargas ni resistencia física.