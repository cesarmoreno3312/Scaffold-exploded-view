# CONSTRUYEQUIPOS S.A.S. · Despieces Ring Lock (MVP)

Aplicación web local y estática para generar **despieces comerciales preliminares** de una torre central Ring Lock y hasta dos extensiones adosadas en forma de L, con trazabilidad de cada referencia de inventario.

> **No es una calculadora de estabilidad ni un plano de montaje.** Las extensiones en L pueden no ofrecer estabilidad al volcamiento en todas las direcciones. No utilizar los resultados para autorizar montaje, diseñar arriostramientos ni definir cargas sin revisión de profesional competente.

## Ejecutar

Necesitas **Node.js 20+**. No requiere instalar dependencias ni conexión a servicios externos.

```bash
npm run dev
```

Abre **http://localhost:4173**.

## Probar

```bash
npm test
```

Las pruebas se ejecutan también automáticamente con GitHub Actions al subir el repositorio.

## Alcance de la primera versión

- Una única bahía central en las combinaciones **1.40×1.40, 2.072×1.40 (o rotada), 2.072×2.072 o 3.00×3.00 m**.
- Alturas de trabajo **pares de 2 a 12 m**.
- Hasta dos extensiones adosadas en **lados +X y +Y**, formando una L, seleccionadas automática o manualmente.
- Extensiones comerciales de **0.75, 1.40, 2.072 y 3.00 m**.
- Cálculo de horizontales únicas por coordenadas/elevación; todas las barandas en niveles de 2 m.
- Diagonales por caras centrales y caras expuestas de extensiones, sin doble diagonal en caras compartidas.
- Verticales centrales y de extensiones, pines por empalme, Base Collars y dos alternativas de apoyos.
- Acceso tipo caracol para **1.40 × 1.40 m**: dos plataformas junto a cada escotilla más plataforma de arranque, sin cierres interiores de 0.75 m.
- Acceso por escotillas para otras secciones, con cerramientos intermedios provisionales.
- Referencias verificadas en las **67 entradas del archivo original `PIEZAS CONSTRUYEQUIPOS.xlsx`**; en `data/catalogo.json` están los nombres/códigos exactos.
- Tabla de inventario, explicación por SKU, búsqueda, exportación CSV/JSON.
- Totales: con ambas alternativas de base relacionadas y total utilizando una alternativa de base.

## Pendientes expresos (NO se inventan SKU)

1. Los **dos diagonalados de unión por extensión** se muestran como conjuntos **sin referencia comercial resuelta**, separados de los totales del inventario. Hay que definir las piezas exactas (diagonal, abrazaderas, fijaciones, etc.).
2. Las **alturas automáticas de las extensiones** son hipótesis comerciales: `2 × round((H − 4 × dimensiónCentralEnElEje) / 2)` acotadas entre 2 m y H. Se pueden sobrescribir. Pendiente validación del criterio.
3. La selección de **vertical terminal con/sin espigo** y fijación de los cerramientos interiores requiere validación con el manual del sistema.
4. Se cuentan **dos barandas perimetrales a +0.50 y +1.00 m** para cada plataforma con escotilla de la torre central. La posición de los niveles debe validarse según el uso.
5. El criterio `H / 4` se utiliza **solo para elegir un tamaño comercial de extensión**, y el rectángulo exterior es una **envolvente**, no una validación de estabilidad.
6. No se incluyen cálculos de esfuerzos, momentos de vuelco, capacidad de carga, viento, suelo, anclajes, contrapesos, configuración de arriostramientos especiales, ni certificados.

## Fuera de alcance del MVP

- Torres impares: plataformas de 0/0.50/1 m, escotillas desde 3 m y montaje de tramos de 1 m.
- Torres con acceso tipo gato (0.75 × 1.40 m, H≥4 m).
- Varios vanos, plataformas de varios módulos, anclajes a pared, más de 12 m o extensiones en más de dos direcciones.
- Selección automática entre otros tipos de escotilla, rodapié o plataforma especial.
- Diseños para ejecución, estabilidades certificadas o documentación de ingeniería.

## Estructura

```text
index.html           Interfaz responsiva
src/app.mjs          Presentación, diagrama y exportaciones
src/engine.mjs       Motor puro y testeable de geometría + inventario
src/styles.css       Diseño visual
data/catalogo.json   67 referencias obtenidas del Excel original
tests/               Pruebas unitarias y casos de regresión
.github/workflows/   Integración continua
server.mjs           Servidor estático sin dependencias
```

## Github

1. Crea un repositorio privado llamado `construyequipos-despieces` en tu cuenta.
2. Descomprime los archivos de este paquete en la carpeta del repositorio.
3. En esa carpeta ejecuta:

```bash
git init
git branch -M main
git add .
git commit -m "feat: MVP calculadora Ring Lock con inventario y pruebas"
git remote add origin https://github.com/cesarmoreno3312/construyequipos-despieces.git
git push -u origin main
```

Si el repositorio fue creado con README inicial, conviene clonar primero y copiar allí estos archivos para evitar conflictos de historial.

## Fuente del inventario

Extraído de `PIEZAS CONSTRUYEQUIPOS.xlsx`, 67 filas de materiales. Las dimensiones se tratan como valores nominales en milímetros (2072 ≠ 2070), no como medidas redondeadas. No se modificó el original.