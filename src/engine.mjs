/**
 * CONSTRUYEQUIPOS S.A.S. | Motor preliminar de despieces Ring Lock v0.2
 * Geometría expresada en milímetros. NO equivale a diseño estructural,
 * certificado de autoestabilidad, plano de montaje ni listado completo de fijaciones.
 * Una bahía central y cadenas de extensiones comerciales adyacentes (+X y +Y).
 */
export const SPANS = [750, 1400, 2072, 3000];
export const CENTRAL_SPANS = [1400, 2072, 3000];
export const HATCH_SPANS = [1400, 2072, 3000];
export const GEOMETRIC_RATIO_LIMIT = 4.3;
export const MIN_HEIGHT = 2;
export const MAX_HEIGHT = 50;

export const CODES = Object.freeze({
  collar: 'AMD.BCLL.0,25', pin: 'AMD.PPS.0,25', ladder: 'AMD.ESC.2200',
  flat: 'AMD.TN.0,60', caster: 'AMD.RDA.800',
  v1Spigot: 'AMD.VT.CE.1000', v1Terminal: 'AMD.VT.SE.1000',
  v2Spigot: 'AMD.VT.CE.2000', v2Terminal: 'AMD.VT.SE.2000',
});

const horizontalCode = length => `AMD.HZ.${length}`;
const diagonalCode = length => `AMD.DIG.${length}`;
const metalCode = length => `AMD.PLT.${length}`;
const hatchCode = length => `AMD.PLT ES.${length}`;
const toeCode = length => `AMD.RDP.${length}`;
const meters = mm => (mm / 1000).toLocaleString('es-CO', {minimumFractionDigits:2, maximumFractionDigits:3});
const invariant = (condition, text) => {if (!condition) throw new Error(text);};
const sum = xs => xs.reduce((a,b)=>a+b,0);

/** Devuelve niveles estructurales a 0,2,4…H o 0,1,3,…H. */
export function structuralLevels(heightM) {
  const levels=[0];
  for(let z=heightM%2?1:2; z<=heightM; z+=2) levels.push(z*1000);
  return levels;
}

/** Los niveles de plataforma accesibles empiezan a 1 m si H es impar. */
export function accessLevels(heightM) {
  const levels=[];
  for(let m=heightM%2?1:2;m<=heightM;m+=2) levels.push(m);
  return levels;
}

// Optimización lexicográfica: mínimo número de módulos, después mínimo exceso
// sobre la dimensión geométrica; los tramos mayores quedan junto a la torre.
function chooseModules(baseMm, targetMm, requested) {
  if(requested!==undefined && requested!==null && requested!=='auto') {
    const value=Number(requested);
    invariant([0,...SPANS].includes(value), 'La extensión debe ser de 0; 0,75; 1,40; 2,072 o 3,00 m.');
    invariant(baseMm+value>=targetMm,
      `La extensión seleccionada no alcanza el criterio comercial de ${meters(targetMm)} m. Utiliza «Automática» para permitir varios módulos sucesivos.`);
    return value?[value]:[];
  }
  const need=Math.max(0,targetMm-baseMm);
  if(!need)return [];
  for(let count=1;count<=12;count++) {
    let best=null, bestExcess=Infinity;
    function choose(first, remaining, total, items) {
      if(remaining===0) {
        const excess=total-need;
        if(excess>=0 && excess<bestExcess) {bestExcess=excess;best=[...items];}
        return;
      }
      // Poda: con el máximo módulo comercial no alcanzaría el mínimo.
      if(total+remaining*SPANS[SPANS.length-1]<need) return;
      for(let i=first;i<SPANS.length;i++) choose(i,remaining-1,total+SPANS[i],[...items,SPANS[i]]);
    }
    choose(0,count,0,[]);
    if(best) return best.sort((a,b)=>b-a);
  }
  throw new Error('Esta dimensión requiere más módulos que los admitidos en el modelo.');
}

function defaultExtensionHeight(heightM, insideWidthMm) {
  const raw=heightM-4*insideWidthMm/1000; // hipótesis previa, independiente del criterio H/4,3
  const rounded=heightM%2?1+2*Math.round((raw-1)/2):2*Math.round(raw/2);
  return Math.max(heightM%2?1:2, Math.min(heightM,rounded));
}

function resolveModules(baseMm,targetMm,H,requested,requestedHeight,axis) {
  const lengths=chooseModules(baseMm,targetMm,requested);
  if(!lengths.length)return [];
  const manualHeight=!(requestedHeight===undefined || requestedHeight===null || requestedHeight==='auto');
  invariant(!manualHeight || lengths.length===1,
    `La altura manual de ${axis} corresponde a un único módulo. Para extensiones encadenadas utiliza «Automática».`);
  const result=[];
  let cumulative=0;
  for(const length of lengths) {
    const height=manualHeight?Number(requestedHeight):defaultExtensionHeight(H,baseMm+cumulative);
    invariant(Number.isInteger(height) && height>=1 && height<=H && height%2===H%2,
      `La altura de una extensión debe ser ${H%2?'impar':'par'}, desde ${H%2?'1':'2'} m hasta la altura de la torre.`);
    result.push({length,height,from:baseMm+cumulative,to:baseMm+cumulative+length});
    cumulative+=length;
  }
  return result;
}

const pointKey = p => p.join(',');
const segmentKey = (a,b,z,code) => `${code}@${z}|${[pointKey(a),pointKey(b)].sort().join('|')}`;
function centralEdges(x,y) {
  return [
    {a:[0,0],b:[x,0],length:x},
    {a:[x,0],b:[x,y],length:y},
    {a:[x,y],b:[0,y],length:x},
    {a:[0,y],b:[0,0],length:y},
  ];
}
function extensionGeometry(axis,baseX,baseY,modules) {
  let offset=axis==='X'?baseX:baseY;
  return modules.map((m,index)=>{
    const start=offset,end=offset+m.length;
    let polygon,edges;
    if(axis==='X') {
      polygon=[[start,0],[end,0],[end,baseY],[start,baseY]];
      edges=[
        {a:[start,0],b:[end,0],length:m.length},
        {a:[end,0],b:[end,baseY],length:baseY},
        {a:[end,baseY],b:[start,baseY],length:m.length},
      ];
    } else {
      polygon=[[0,start],[baseX,start],[baseX,end],[0,end]];
      edges=[
        {a:[0,start],b:[0,end],length:m.length},
        {a:[0,end],b:[baseX,end],length:baseX},
        {a:[baseX,end],b:[baseX,start],length:m.length},
      ];
    }
    offset=end;
    return {...m,axis,index:index+1,polygon,edges};
  });
}

/**
 * @param {{height:number,spanX:number,spanY:number,extensionX?:number|'auto',extensionY?:number|'auto',extensionHeightX?:number|'auto',extensionHeightY?:number|'auto'}} config
 * @param {{codigo:string,descripcion:string}[]} catalog
 */
export function calculate(config,catalog) {
  invariant(Array.isArray(catalog)&&catalog.length>0,'Debes cargar el catálogo comercial.');
  const catalogByCode=new Map(catalog.map(c=>[c.codigo,c.descripcion]));
  invariant(catalogByCode.size===catalog.length,'Hay códigos repetidos en el catálogo.');
  const H=Number(config.height),x=Number(config.spanX),y=Number(config.spanY);
  invariant(Number.isInteger(H)&&H>=MIN_HEIGHT&&H<=MAX_HEIGHT,
    'Altura permitida: de 2 a 50 m, en metros enteros.');
  invariant((x===1400&&y===1400)||(x===2072&&y===1400)||(x===1400&&y===2072)||
            (x===2072&&y===2072)||(x===3000&&y===3000),
    'Esta combinación de dimensiones aún no está parametrizada. Opciones: 1,40×1,40; 2,072×1,40; 2,072×2,072 o 3×3 m.');

  // 4,3 = 43/10 exacto. Altura en m -> dimensión mm mínima = ceil(H*10000/43).
  const target=Math.ceil(H*10000/43);
  const modulesX=resolveModules(x,target,H,config.extensionX,config.extensionHeightX,'X');
  const modulesY=resolveModules(y,target,H,config.extensionY,config.extensionHeightY,'Y');
  const extensionX=extensionGeometry('X',x,y,modulesX);
  const extensionY=extensionGeometry('Y',x,y,modulesY);
  const allExtensionModules=[...extensionX,...extensionY];
  const extraX=sum(modulesX.map(m=>m.length)), extraY=sum(modulesY.map(m=>m.length));
  const supports=4+2*allExtensionModules.length;
  const even=H%2===0;
  const spiral=x===1400&&y===1400;
  const hatchLength=Math.max(x,y);
  const numHatches=Math.floor(H/2);
  const closures=spiral?0:Math.max(0,numHatches-1);
  const lines=new Map(),uniqueHorizontals=new Set(),trace=[];
  const warnings=[
    'DESPIECE COMERCIAL PRELIMINAR. NO ES PLAN DE MONTAJE NI CERTIFICACIÓN DE AUTOESTABILIDAD.',
    'H/base ≤ 4,3 es solo un filtro geométrico comercial: no equivale a un factor de seguridad estructural ni evalúa vuelco, viento, suelo o cargas.',
    'Validar la selección con/sin espigo, anclajes, fijaciones y cerramientos según manual del fabricante.',
  ];
  const pending=[];
  if(allExtensionModules.length) {
    warnings.push('Las extensiones en lados adyacentes forman una huella en L asimétrica; el rectángulo envolvente NO define una base estable ni verifica vuelco.');
    warnings.push('La altura escalonada de las extensiones es una hipótesis comercial independiente del criterio 4,3 y está pendiente de validación.');
    pending.push({concepto:'Diagonalados de unión de las extensiones',cantidad:2*allExtensionModules.length,
      unidad:'elementos o conjuntos por especificar',motivo:'No existe referencia comercial inequívoca. No se incluye en los totales de SKU.'});
  }
  if(allExtensionModules.some(m=>m.height%2!==0))
    warnings.push('Extensiones de altura impar: los tramos de 1 m requieren definir físicamente sus arriostramientos; no se inventaron diagonales de 1 m.');
  if(!even) {
    warnings.push('Arranque de altura impar: plataformas a 0, 0,50 y 1 m. Los apoyos específicos de esos escalones no están completamente parametrizados.');
    pending.push({concepto:'Apoyos y fijaciones del arranque escalonado',cantidad:'por definir',
      unidad:'componentes sin cuantificar',motivo:'Determinar soportes físicos de plataformas a 0,50 y 1 m; excluidos del total SKU.'});
  }
  if(H>12) {
    warnings.push(`ALTURA ELEVADA (${H} m): estudio y aprobación de ingeniería, sistema de arriostramiento, estabilidad, viento, capacidad de suelo y rescate antes de diseñar o autorizar el montaje.`);
    warnings.push('Para alturas superiores a 12 m se relacionan únicamente tornillos niveladores de base plana; no se agregan ruedas.');
  }
  if(H>26 || allExtensionModules.length>2) {
    warnings.push('Extensiones comerciales encadenadas en uno o ambos ejes: la geometría y sus conexiones deben definirse y aprobarse específicamente. Este despiece NO es completo para ejecución.');
  }
  if(closures)warnings.push('Los cerramientos interiores se cuentan por componentes; ubicación y fijación físicas aún pendientes.');

  function add(code,quantity,reason,details='') {
    invariant(Number.isInteger(quantity)&&quantity>=0,`Cantidad inválida: ${code}`);
    if(!quantity)return;
    invariant(catalogByCode.has(code),`El código ${code} no aparece en el inventario.`);
    if(!lines.has(code))lines.set(code,{codigo:code,descripcion:catalogByCode.get(code),cantidad:0,reasons:[]});
    const item=lines.get(code);
    item.cantidad+=quantity;
    item.reasons.push({reason,quantity,details});
    trace.push({codigo:code,cantidad:quantity,reason,details});
  }
  function horizontal(edge,z,reason) {
    const code=horizontalCode(edge.length),key=segmentKey(edge.a,edge.b,z,code);
    if(!uniqueHorizontals.has(key)) {
      uniqueHorizontals.add(key);
      add(code,1,reason,`Nivel ${(z/1000).toFixed(2)} m; ${pointKey(edge.a)} → ${pointKey(edge.b)}`);
    }
  }

  const mainEdges=centralEdges(x,y);
  const mainLevels=structuralLevels(H);
  for(const z of mainLevels) for(const edge of mainEdges) horizontal(edge,z,'Horizontales de torre central');
  for(const m of allExtensionModules) for(const z of structuralLevels(m.height))
    for(const edge of m.edges)horizontal(edge,z,`Horizontales de extensión ${m.axis}${m.index}`);
  for(const level of accessLevels(H)) for(const offset of [500,1000]) for(const edge of mainEdges)
    horizontal(edge,level*1000+offset,'Barandas perimetrales de nivel accesible');

  for(const edge of mainEdges) add(diagonalCode(edge.length),Math.floor(H/2),'Diagonales de torre central');
  for(const m of allExtensionModules)for(const edge of m.edges)
    add(diagonalCode(edge.length),Math.floor(m.height/2),`Diagonales de caras expuestas de extensión ${m.axis}${m.index}`);

  // Cada línea central: H/2 módulos de 2 m + 1 m superior si H par.
  // Para H impar: 1 m inferior con espigo, floor(H/2) módulos de 2 m, 1 m superior sin espigo.
  add(CODES.v2Spigot,4*Math.floor(H/2),'Verticales centrales de 2 m');
  if(!even)add(CODES.v1Spigot,4,'Tramos verticales de 1 m de arranque impar');
  add(CODES.v1Terminal,4,'Remates superiores de barandas (1 m)');
  add(CODES.pin,4*(even?H/2:Math.floor(H/2)+1),'Uniones verticales centrales');

  for(const m of allExtensionModules) {
    const n2=Math.floor(m.height/2),odd=m.height%2===1;
    if(odd) {
      add(CODES.v2Spigot,2*n2,`Tramos de 2 m de extensión ${m.axis}${m.index}`);
      add(CODES.v1Terminal,2,`Remate impar de 1 m de extensión ${m.axis}${m.index}`);
      add(CODES.pin,2*n2,`Uniones verticales de extensión ${m.axis}${m.index}`);
    } else {
      add(CODES.v2Spigot,2*Math.max(0,n2-1),`Tramos inferiores de extensión ${m.axis}${m.index}`);
      add(CODES.v2Terminal,2,`Tramos terminales de extensión ${m.axis}${m.index}`);
      add(CODES.pin,2*Math.max(0,n2-1),`Uniones verticales de extensión ${m.axis}${m.index}`);
    }
  }
  add(CODES.collar,supports,'Puntos de apoyo únicos');
  add(CODES.flat,supports,'Tornillos niveladores de base plana');
  if(H<=12)add(CODES.caster,supports,'Alternativa de apoyo: ruedas niveladoras');

  add(CODES.ladder,numHatches,even?'Escaleras: 0→2→…→H':'Escaleras: 1→3→…→H');
  add(hatchCode(hatchLength),numHatches,even?'Escotillas en 2,4,…,H':'Escotillas en 3,5,…,H; no escotilla a 1 m');

  let metalCount=0;
  if(spiral) {
    const start=even?1:3;
    metalCount=start+2*numHatches;
    add(metalCode(1400),start,'Plataformas de acceso y arranque');
    add(metalCode(1400),2*numHatches,'Dos plataformas junto a cada escotilla tipo caracol');
  } else {
    const fullDeck=x===3000&&y===3000?7:x===2072&&y===2072?4:2;
    const start=even?1:3;
    metalCount=start+fullDeck;
    add(metalCode(hatchLength),start,'Plataformas metálicas de arranque');
    add(metalCode(hatchLength),fullDeck,'Plataformas metálicas de cubierta superior');
    add(horizontalCode(750),4*closures,'Horizontales de 0,75 para cierres de escotillas intermedias');
    add(horizontalCode(hatchLength),4*closures,'Horizontales largas de cierres de escotillas intermedias');
    add(CODES.v1Terminal,2*closures,'Verticales de cerramientos intermedios');
  }
  add(toeCode(x),2,'Rodapiés perimetrales del nivel superior (caras X)');
  add(toeCode(y),2,'Rodapiés perimetrales del nivel superior (caras Y)');

  const items=[...lines.values()].sort((a,b)=>a.descripcion.localeCompare(b.descripcion,'es'));
  const listed=sum(items.map(row=>row.cantidad));
  const oneBaseOption=listed-(H<=12?supports:0);
  invariant(items.every(row=>row.cantidad>0)&&new Set(items.map(row=>row.codigo)).size===items.length,
    'Error de consolidación de inventario.');
  const horizontalQuantities=sum(items.filter(row=>row.codigo.startsWith('AMD.HZ.')).map(row=>row.cantidad));
  invariant(horizontalQuantities===uniqueHorizontals.size+8*closures,
    'Inconsistencia entre horizontales físicas y conjuntos de cerramientos.');
  const footprint={main:[[0,0],[x,0],[x,y],[0,y]],
    extensionX:extensionX[0]?.polygon||null,extensionY:extensionY[0]?.polygon||null,
    extensionsX:extensionX.map(m=>({polygon:m.polygon,length:m.length,height:m.height,index:m.index})),
    extensionsY:extensionY.map(m=>({polygon:m.polygon,length:m.length,height:m.height,index:m.index}))};
  return {
    version:'0.2.0',status:'PRELIMINAR — NO APTO COMO PLAN DE MONTAJE',
    input:{height:H,spanX:x,spanY:y,extensionX:extraX,extensionY:extraY,
      extensionHeightX:modulesX[0]?.height||0,extensionHeightY:modulesY[0]?.height||0,
      extensionModulesX:modulesX.map(m=>({length:m.length,height:m.height})),
      extensionModulesY:modulesY.map(m=>({length:m.length,height:m.height}))},
    geometry:{target,ratioLimit:GEOMETRIC_RATIO_LIMIT,envelopeX:x+extraX,envelopeY:y+extraY,
      ratioX:H*1000/(x+extraX),ratioY:H*1000/(y+extraY),supports,...footprint,
      note:'Envolvente exterior; no representa la capacidad resistente ni un polígono de estabilidad verificado'},
    access:{mode:spiral?'caracol':'escalera con escotillas y cerramientos interiores',hatches:numHatches,
      ladders:numHatches,metalPlatforms:metalCount,intermediateClosures:closures,
      hatchLevels:accessLevels(H).filter(level=>even||level>=3),
      startPlatforms:even?[0]:[0,0.5,1]},
    items,totals:{listed,oneBaseOption,baseNodes:supports,
      unmapped:sum(pending.filter(p=>Number.isInteger(p.cantidad)).map(p=>p.cantidad)),
      pendingConcepts:pending.length},pending,warnings,trace,
  };
}

export function formatDimension(mm) {return meters(mm);}