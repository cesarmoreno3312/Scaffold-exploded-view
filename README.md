# CONSTRUYEQUIPOS S.A.S. — Despieces Ring Lock · MVP 0.2.0

Aplicación web estática y local para elaborar **despieces comerciales preliminares** de una torre central de una bahía y módulos de extensión adyacentes encadenados. Inventario real de 67 referencias del archivo `PIEZAS CONSTRUYEQUIPOS.xlsx`.

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
- Una bahía central: **1,40×1,40; 2,072×1,40 (y rotada); 2,072×2,072; 3×3 m**.
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
6. No incluye multibahías centrales, anclajes a paredes ni la configuración tipo gato de 0,75×1,40 para H≥4 m. Las dimensiones centrales siguen limitadas a cuatro familias.
7. Los despieces de torres grandes son **estimaciones comerciales parciales**, no listados completos de materiales para ejecutar una obra.

## Estructura

```text
index.html                  Interfaz responsiva
src/app.mjs                 Interacción, gráfico de planta y exportaciones
src/engine.mjs              Motor de geometría e inventario
src/styles.css              Estilos visuales
data/catalogo.json          67 referencias del inventario
examples/                   Casos de salida orientativos
tests/engine.test.mjs       11 pruebas + matriz 245 combinaciones
.github/workflows/         Verificación y publicación en GitHub Pages
server.mjs                  Servidor estático sin dependencias
```

Los cambios en `main` disparan automáticamente las pruebas y la publicación mediante GitHub Actions.