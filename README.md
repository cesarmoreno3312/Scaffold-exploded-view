# CONSTRUYEQUIPOS S.A.S. — Despieces Ring Lock · MVP 0.3.1

Aplicación web estática y local para elaborar **despieces comerciales preliminares** de una torre central de bahías modulares y módulos de extensión adyacentes encadenados. Inventario real de 67 referencias del archivo `PIEZAS CONSTRUYEQUIPOS.xlsx`.

> **ATENCIÓN: NO ES UN DISEÑO ESTRUCTURAL, UN PLANO DE MONTAJE, NI UNA AUTORIZACIÓN PARA ARMAR UNA TORRE.** Las torres altas, especialmente de 13–50 m, necesitan ingeniería específica y pueden requerir anclajes, contrapesos, estabilizaciones y diseños que este MVP no calcula. **La relación geométrica comercial 4,3:1 NO ES UN FACTOR DE SEGURIDAD CERTIFICADO.** Las cantidades excluyen componentes no parametrizados que se marcan como pendientes.

## Abrir en línea

- App web: https://cesarmoreno3312.github.io/Scaffold-exploded-view/
- Código: https://github.com/cesarmoreno3312/Scaffold-exploded-view
- Pruebas y despliegue: https://github.com/cesarmoreno3312/Scaffold-exploded-view/actions

## Ejecutar localmente

Se requiere Node.js 20 o superior; no hay dependencias externas.

```sh
npm run dev
# Abre http://localhost:4173
```

Ejecutar pruebas:

```sh
npm test
```

## Alcance de v0.2

- Alturas de plataforma de trabajo **enteras desde 2 hasta 50 m**, pares e impares.
- Área central configurable mediante tramos de **0,75; 1,40; 2,072 y 3,00 m** en ambos ejes, combinables y repetibles hasta 10 bahías por sentido (incluye las 16 combinaciones de una bahía).
- Selección automática por ejes +X y +Y, conforme a una dimensión geométrica mínima `ceil(H×10000/43)` en milímetros. Si hacen falta, se agregan varios módulos sucesivos de 0,75, 1,40, 2,072 y 3,00 m, minimizando primero el número de módulos y luego el exceso de longitud. Se mantiene la entrada manual de un módulo cuando alcance el criterio.
- La **altura de cada extensión se estima** usando `H−4×ancho acumulado`, redondeando a la paridad de H, con un mínimo de 1 m (impar) o 2 m (par). **Es una hipótesis comercial, NO un criterio de diseño aprobado**.
- Para **alturas pares**: escaleras y escotillas a 2, 4, 6… H y plataforma inicial a 0 m.
- Para **alturas impares**: arranque escalonado a 0, 0,50 y 1 m; **no hay escotilla a 1 m**; escotillas a 3, 5… H y escaleras desde 1 a 3 m en adelante.
- Torres **1,40×1,40**: acceso tipo caracol, dos plataformas metálicas junto a cada escotilla, sin cierres interiores de 0,75 m.
- Otros tamaños: cierres intermedios agregados como conjuntos de componentes; sus conexiones quedan pendientes.
- Horizontales estructurales, protección perimetral, diagonales en caras expuestas, verticales, pines, escotillas, escaleras, plataformas, rodapiés y apoyos.
- **H ≤12 m:** relaciona tornillos niveladores planos y ruedas como alternativas; el total de montaje usa solo una. **H >12 m:** relaciona solo tornillos planos.
- Gráfico de la planta que representa todos los módulos encadenados, trazabilidad por inventario, CSV y JSON con advertencias.

## Limitaciones explícitas

1. La selección de módulos +X y +Y produce una envolvente rectangular, **no un polígono resistente completo**; no equivale a verificar el vuelco en todas las direcciones.
2. **Los diagonalados de unión** no cuentan con referencia comercial inequívoca y aparecen como pendientes fuera de los totales.
3. En alturas impares **los apoyos específicos del arranque de 0,50 y 1 m** quedan pendientes; su cantidad no se inventa.
4. Las **diagonales de tramos incompletos de 1 m**, los terminales con/sin espigo, las fijaciones interiores, los sistemas de amarre y los arreglos de extensiones altas requieren especificaciones adicionales.
5. No calcula cargas, peso propio, capacidad de suelo, esfuerzos, viento, estabilidad, anclajes, resistencia de conexiones, arriostramientos estructurales certificados, evacuación ni requisitos normativos aplicables.
6. No incluye anclajes a paredes ni ingeniería de montaje. La malla de varias bahías y el acceso tipo gato de 0,75×1,40 para H≥4 m se calculan como **propuestas comerciales preliminares** con validaciones físicas pendientes; algunos módulos 0,75 requieren definir el acceso.
7. Los despieces de torres grandes son **estimaciones comerciales parciales**, no listados completos de materiales para ejecutar una obra.

## Estructura

```text
index.html                  Interfaz responsiva
src/app.mjs                 Interacción, gráfico de planta y exportaciones
src/engine.mjs              Motor de geometría e inventario
src/styles.css              Estilos visuales
data/catalogo.json          67 referencias del inventario
examples/                   Casos de salida orientativos
tests/engine.test.mjs       18 pruebas + matriz de 245 configuraciones previas y 16 combinaciones unitarias
.github/workflows/         Verificación y publicación en GitHub Pages
server.mjs                  Servidor estático sin dependencias
```

Los cambios en `main` disparan automáticamente las pruebas y la publicación mediante GitHub Actions.

## Configurador de área (v0.3)

El área central se define agregando tramos de 0,75 / 1,40 / 2,072 / 3,00 m en el sentido X (largo) y Y (ancho). Por ejemplo, `X=[750,1400]` y `Y=[2072,3000]` produce una planta de **2,15 × 5,072 m**, cuatro paños, y nueve puntos de apoyo centrales compartidos. La aplicación cuenta horizontales y diagonales de cada módulo en lugar de inventar una pieza de largo total.

Se dispone de las **16 parejas** básicas y hasta diez módulos por sentido. Si no hay una bahía con acceso comercial conocido (por ejemplo 0,75×0,75), se genera únicamente despiece parcial, con acceso pendiente y sin escotillas ficticias. Las plataformas de la cubierta múltiple son estimaciones comerciales por paño; **no autorizar montaje** con esos resultados sin validar compatibilidad y resistencia.
## Revisión de barandas y horizontales (v0.3.1)

Las escotillas intermedias no son plataformas completas de trabajo por defecto. Por eso las barandas perimetrales de 0,50 y 1,00 m se contabilizan en la plataforma de trabajo superior, mientras que los niveles de acceso intermedios no-caracol conservan sus cerramientos internos provisionales. Para acceso caracol de 1,40×1,40 se mantiene la protección de cada plataforma de tránsito.

**Caso de regresión verificado: 10 m × planta 3×3 m, AMD.HZ.3000 = 24 horizontales de estructura + 8 barandas superiores + 16 cierres de escotillas = 48 (antes 80).** Ahora «Ver cálculo» agrupa los materiales por concepto con subtotales. Si se pretende utilizar pisos intermedios como áreas de trabajo, deben definirse protecciones, rodapiés y plataformas adicionales; no está automatizado en esta versión y no sustituye diseño ni autorización de montaje.
