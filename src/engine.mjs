/**
 * CONSTRUYEQUIPOS S.A.S. | Motor de despiece comercial (MVP v0.1)
 * Unidades internas: milímetros enteros. No constituye diseño estructural.
 * Alcance: torre central de una bahía, H par 2..12m, hasta dos extensiones en L.
 */
export const SPANS = [750, 1400, 2072, 3000];
// Criterio comercial H/base <= 4,3. No equivale a un factor de seguridad estructural.
export const GEOMETRIC_RATIO_LIMIT = 4.3;
export const CENTRAL_SPANS = [1400, 2072, 3000];
export const HATCH_SPANS = [1400, 2072, 3000];

export const CODES = Object.freeze({
  collar: 'AMD.BCLL.0,25', pin: 'AMD.PPS.0,25', ladder: 'AMD.ESC.2200',
  flat: 'AMD.TN.0,60', caster: 'AMD.RDA.800',
  v2Spigot: 'AMD.VT.CE.2000', v2Terminal: 'AMD.VT.SE.2000', v1Terminal: 'AMD.VT.SE.1000',
});

const horizontalCode = (length) => `AMD.HZ.${length}`;
const diagonalCode = (length) => `AMD.DIG.${length}`;
const metalCode = (length) => `AMD.PLT.${length}`;
const hatchCode = (length) => `AMD.PLT ES.${length}`;
const toeCode = (length) => `AMD.RDP.${length}`;
const meters = (mm) => (mm / 1000).toLocaleString('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 3});
const invariant = (condition, text) => { if (!condition) throw new Error(text); };

function evenSteps(endMeters) {
  const result = [];
  for (let m = 0; m <= endMeters; m += 2) result.push(m * 1000);
  return result;
}

function heightOfExtension(heightMeters, centralSpanMm) {
  const raw = heightMeters - 4 * centralSpanMm / 1000;
  return Math.min(heightMeters, Math.max(2, 2 * Math.round(raw / 2)));
}

function chooseExtension(baseMm, targetMm, requested) {
  if (requested === undefined || requested === null || requested === 'auto') {
    return [0, ...SPANS].find((extra) => baseMm + extra >= targetMm);
  }
  const parsed = Number(requested);
  invariant([0, ...SPANS].includes(parsed), 'La extensión debe ser de 0; 0,75; 1,40; 2,072 o 3,00 m.');
  invariant(baseMm + parsed >= targetMm, `La extensión escogida no alcanza el criterio comercial de ${meters(targetMm)} m.`);
  return parsed;
}

function pointKey(p) { return `${p[0]},${p[1]}`; }
function segmentKey(start, end, z, code) {
  const vertices = [pointKey(start), pointKey(end)].sort();
  return `${code}@${z}|${vertices.join('|')}`;
}

function addEdgesForRect(x, y) {
  return [
    { a: [0, 0], b: [x, 0], length: x },
    { a: [x, 0], b: [x, y], length: y },
    { a: [x, y], b: [0, y], length: x },
    { a: [0, y], b: [0, 0], length: y },
  ];
}

/**
 * @param {{height:number,spanX:number,spanY:number,extensionX?:number|'auto',extensionY?:number|'auto',extensionHeightX?:number|'auto',extensionHeightY?:number|'auto'}} config
 * @param {{codigo:string, descripcion:string}[]} catalog
 */
export function calculate(config, catalog) {
  invariant(Array.isArray(catalog) && catalog.length > 0, 'Debes cargar el catálogo comercial.');
  const catalogByCode = new Map(catalog.map((row) => [row.codigo, row.descripcion]));
  invariant(catalogByCode.size === catalog.length, 'Hay códigos repetidos en el catálogo.');
  const H = Number(config.height);
  const x = Number(config.spanX);
  const y = Number(config.spanY);
  invariant(Number.isInteger(H) && H >= 2 && H <= 12 && H % 2 === 0, 'MVP: solo alturas pares entre 2 y 12 m.');
  invariant(CENTRAL_SPANS.includes(x) && CENTRAL_SPANS.includes(y), 'MVP: dimensión central no admitida.');
  invariant((x === 1400 && y === 1400) || (x === 2072 && y === 1400) || (x === 1400 && y === 2072) || (x === 2072 && y === 2072) || (x === 3000 && y === 3000),
    'Esta combinación de dimensiones aún no está parametrizada. Opciones: 1,40×1,40; 2,072×1,40; 2,072×2,072 o 3×3 m.');
  invariant([x, y].some((s) => HATCH_SPANS.includes(s)), 'No se encontró longitud comercial de escotilla.');
  // H/4,3, redondeado hacia arriba al milímetro. 4,3 = 43/10 exacto.
  // Ejemplo: 6 m -> 1.396 mm requeridos; base de 1.400 mm sin extensiones.
  const target = Math.ceil(H * 10000 / 43);
  const ex = chooseExtension(x, target, config.extensionX);
  const ey = chooseExtension(y, target, config.extensionY);
  invariant(ex !== undefined && ey !== undefined, 'No existe una extensión comercial suficiente en este modelo.');

  function extHeight(span, extension, requested) {
    if (!extension) return 0;
    const height = requested === undefined || requested === null || requested === 'auto'
      ? heightOfExtension(H, span) : Number(requested);
    invariant(Number.isInteger(height) && height >= 2 && height <= H && height % 2 === 0,
      'La altura de una extensión debe ser par, desde 2 m hasta la altura de la torre.');
    return height;
  }
  const hx = extHeight(x, ex, config.extensionHeightX);
  const hy = extHeight(y, ey, config.extensionHeightY);
  const hatchLength = Math.max(x, y);
  const spiral = x === 1400 && y === 1400;
  const numHatches = H / 2;
  const supports = 4 + (ex ? 2 : 0) + (ey ? 2 : 0);
  const lines = new Map();
  const uniqueHorizontals = new Set();
  const trace = [];
  const warnings = [
    'Despiece comercial preliminar. La relación H/base no certifica autoestabilidad ni autoriza montaje.',
    ...(ex || ey ? ['Las extensiones adosadas pueden generar una huella asimétrica; revisar vuelco, cargas, apoyos y arriostramientos.',
    'Las alturas de extensión calculadas automáticamente son hipótesis comerciales ajustables, no criterios de ingeniería aprobados.'] : []),
    'Seleccionar verticales terminales con/sin espigo y el montaje de los cerramientos según especificación técnica del fabricante.',
  ];
  const pending = [];
  const tagMap = new Map();

  function add(code, quantity, reason, details = '') {
    invariant(Number.isInteger(quantity) && quantity >= 0, `Cantidad inválida: ${code}`);
    if (!quantity) return;
    invariant(catalogByCode.has(code), `El código ${code} no aparece en el inventario.`);
    if (!lines.has(code)) lines.set(code, { codigo: code, descripcion: catalogByCode.get(code), cantidad: 0, reasons: [] });
    const line = lines.get(code);
    line.cantidad += quantity;
    line.reasons.push({ reason, quantity, details });
    trace.push({ codigo: code, cantidad: quantity, reason, details });
    tagMap.set(reason, (tagMap.get(reason) || 0) + quantity);
  }

  function horizontal(edge, z, reason) {
    const code = horizontalCode(edge.length);
    const key = segmentKey(edge.a, edge.b, z, code);
    if (!uniqueHorizontals.has(key)) {
      uniqueHorizontals.add(key);
      add(code, 1, reason, `Nivel ${(z / 1000).toFixed(2)} m; ${pointKey(edge.a)} → ${pointKey(edge.b)}`);
    }
  }

  const mainEdges = addEdgesForRect(x, y);
  const extXEdges = ex ? [
    {a:[x,0], b:[x+ex,0],length:ex},
    {a:[x+ex,0], b:[x+ex,y],length:y},
    {a:[x+ex,y], b:[x,y],length:ex},
  ] : [];
  const extYEdges = ey ? [
    {a:[0,y], b:[0,y+ey],length:ey},
    {a:[0,y+ey], b:[x,y+ey],length:x},
    {a:[x,y+ey], b:[x,y],length:ey},
  ] : [];

  for (const z of evenSteps(H)) for (const edge of mainEdges) horizontal(edge, z, 'Horizontales de la torre central');
  for (const z of evenSteps(hx)) for (const edge of extXEdges) horizontal(edge, z, 'Horizontales extensión eje X');
  for (const z of evenSteps(hy)) for (const edge of extYEdges) horizontal(edge, z, 'Horizontales extensión eje Y');
  for (let level = 2; level <= H; level += 2) {
    for (const offset of [500, 1000]) for (const edge of mainEdges)
      horizontal(edge, level * 1000 + offset, 'Barandas perimetrales de cada nivel');
  }

  // Diagonales: torre central conserva todas sus caras. Extensiones solo en sus 3 caras expuestas.
  const diagonalSegments = [
    ...mainEdges.map((edge) => ({length:edge.length, levels:H / 2, reason:'Diagonales torre central'})),
    ...extXEdges.map((edge) => ({length:edge.length, levels:hx / 2, reason:'Diagonales extensión eje X'})),
    ...extYEdges.map((edge) => ({length:edge.length, levels:hy / 2, reason:'Diagonales extensión eje Y'})),
  ];
  for (const d of diagonalSegments) add(diagonalCode(d.length), d.levels, d.reason);

  // Tramos verticales apilados: 4 soportes centrales, 2 soportes exteriores nuevos por extensión.
  add(CODES.v2Spigot, 4 * (H / 2), 'Verticales centrales de 2 m');
  add(CODES.v1Terminal, 4, 'Remates superiores de baranda de 1 m');
  add(CODES.pin, 4 * (H / 2), 'Uniones verticales de la torre central');
  for (const [axis, eh] of [['X',hx], ['Y',hy]]) {
    if (!eh) continue;
    const segments = eh / 2;
    add(CODES.v2Spigot, 2 * (segments - 1), `Verticales inferiores de extensión ${axis}`);
    add(CODES.v2Terminal, 2, `Verticales terminales de extensión ${axis}`);
    add(CODES.pin, 2 * (segments - 1), `Uniones verticales de extensión ${axis}`);
  }
  add(CODES.collar, supports, 'Apoyos únicos de torre y extensiones');
  add(CODES.flat, supports, 'Alternativa: tornillos niveladores planos');
  add(CODES.caster, supports, 'Alternativa: ruedas niveladoras');

  add(CODES.ladder, numHatches, 'Escaleras de acceso cada 2 m');
  add(hatchCode(hatchLength), numHatches, 'Escotillas a 2, 4, ..., H');

  let metalCount = 0;
  if (spiral) {
    metalCount = 1 + 2 * numHatches;
    add(metalCode(1400), metalCount, 'Acceso tipo caracol: 1 de arranque y 2 junto a cada escotilla');
  } else {
    const topFullDeck = x === 3000 && y === 3000 ? 7 : x === 2072 && y === 2072 ? 4 : 2;
    metalCount = 1 + topFullDeck;
    add(metalCode(hatchLength), 1, 'Plataforma metálica de arranque en 0 m');
    add(metalCode(hatchLength), topFullDeck, 'Plataformas metálicas de la cubierta superior');
    // El cerramiento interior solo se utiliza cuando no aplica la regla específica de 1,40×1,40.
    const closures = numHatches - 1;
    add(horizontalCode(750), 4 * closures, 'Horizontales cortas de cerramientos intermedios');
    add(horizontalCode(hatchLength), 4 * closures, 'Horizontales largas de cerramientos intermedios');
    add(CODES.v1Terminal, 2 * closures, 'Verticales de cerramientos intermedios');
    if (closures) warnings.push('El esquema interior de cerramientos se contabiliza por conjuntos; deben validarse sus posiciones y fijaciones físicas.');
  }

  add(toeCode(x), 2, 'Rodapiés del nivel superior - caras X');
  add(toeCode(y), 2, 'Rodapiés del nivel superior - caras Y');

  const extCount = Number(ex > 0) + Number(ey > 0);
  if (extCount) {
    pending.push({
      concepto:'Diagonalados de unión de las extensiones', cantidad: 2 * extCount, unidad:'elementos o conjuntos (a especificar)',
      motivo:'No existe referencia comercial inequívoca en las 67 referencias del inventario; no se suma al total SKU.',
    });
  }

  const items = Array.from(lines.values()).sort((a,b) => a.descripcion.localeCompare(b.descripcion, 'es'));
  const catalogTotal = items.reduce((sum, row) => sum + row.cantidad, 0);
  const actualByBase = catalogTotal - supports;
  invariant(items.every((row) => row.cantidad > 0), 'La tabla incluye cantidades no positivas.');
  invariant(new Set(items.map((row) => row.codigo)).size === items.length, 'Hay SKU repetidos.');
  invariant(uniqueHorizontals.size === items.filter((row)=>row.codigo.startsWith('AMD.HZ.')).reduce((a,b)=>a+b.cantidad,0) - (spiral ? 0 : (numHatches - 1) * 8), 'Inconsistencia en horizontales físicas.');

  return {
    version:'0.1.1', status:'PRELIMINAR — NO APTO COMO PLAN DE MONTAJE',
    input:{height:H,spanX:x,spanY:y,extensionX:ex,extensionY:ey,extensionHeightX:hx,extensionHeightY:hy},
    geometry:{target:target, ratioLimit:GEOMETRIC_RATIO_LIMIT, envelopeX:x+ex,envelopeY:y+ey, ratioX:(H*1000)/(x+ex),ratioY:(H*1000)/(y+ey),supports,
      main:[[0,0],[x,0],[x,y],[0,y]],extensionX:ex?[[x,0],[x+ex,0],[x+ex,y],[x,y]]:null,
      extensionY:ey?[[0,y],[x,y],[x,y+ey],[0,y+ey]]:null,
      note:'Envolvente exterior, no polígono de apoyo ni prueba de estabilidad'},
    access:{mode:spiral?'caracol':'escalera con escotillas y cerramientos interiores',hatches:numHatches,ladders:numHatches,metalPlatforms:metalCount,intermediateClosures:spiral?0:numHatches-1},
    items, totals:{listed:catalogTotal,oneBaseOption:actualByBase,baseNodes:supports,unmapped:pending.reduce((s,p)=>s+p.cantidad,0)},
    pending,warnings,trace,
  };
}

export function formatDimension(mm) { return meters(mm); }