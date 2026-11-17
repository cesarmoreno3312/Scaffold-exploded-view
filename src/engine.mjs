/**
 * CONSTRUYEQUIPOS S.A.S. | Motor preliminar de despieces Ring Lock v0.3.4
 * Geometría expresada en milímetros. NO equivale a diseño estructural,
 * certificado de autoestabilidad, plano de montaje ni listado completo de fijaciones.
 * Malla de bahías modulares y extensiones comerciales adyacentes (+X y +Y).
 */
export const SPANS = [750, 1400, 2072, 3000];
export const CENTRAL_SPANS = SPANS;
export const MAX_BAYS_PER_AXIS = 10;
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
    // «Sin extensión» es una solicitud comercial válida aun cuando no
    // alcance H/4,3. El déficit se advierte, nunca bloquea el inventario.
    if(value===0)return [];
    invariant(baseMm+value>=targetMm,
      `La extensión seleccionada no alcanza el criterio comercial de ${meters(targetMm)} m. Utiliza «Automática» para permitir varios módulos sucesivos.`);
    return [value];
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

/** Interpreta dimensiones antiguas de una bahía y nuevos arreglos de módulos. */
function parseBays(config, axis) {
  const raw=config[`bays${axis}`] ?? [config[`span${axis}`]];
  invariant(Array.isArray(raw) && raw.length>=1 && raw.length<=MAX_BAYS_PER_AXIS,
    `En ${axis} debes definir entre 1 y ${MAX_BAYS_PER_AXIS} módulos.`);
  const modules=raw.map(Number);
  invariant(modules.every(m=>SPANS.includes(m)),
    `Cada módulo de ${axis} debe ser 0,75; 1,40; 2,072 o 3,00 m.`);
  return modules;
}
function gridCoordinates(modules) {
  const result=[0];
  for(const m of modules) result.push(result.at(-1)+m);
  return result;
}
function gridEdges(xs,ys) {
  const edges=[];
  // Todos los tramos horizontales de la planta, incluido el entramado interior.
  for(const y of ys) for(let i=0;i<xs.length-1;i++) edges.push({a:[xs[i],y],b:[xs[i+1],y],length:xs[i+1]-xs[i]});
  for(const x of xs) for(let j=0;j<ys.length-1;j++) edges.push({a:[x,ys[j]],b:[x,ys[j+1]],length:ys[j+1]-ys[j]});
  return edges;
}
function perimeterEdges(xs,ys) {
  const xMax=xs.at(-1),yMax=ys.at(-1);
  return gridEdges(xs,ys).filter(e=>{
    const {a,b}=e;
    return (a[1]===0&&b[1]===0)||(a[1]===yMax&&b[1]===yMax)||
      (a[0]===0&&b[0]===0)||(a[0]===xMax&&b[0]===xMax);
  });
}
function extensionEdgesForGrid(m, xs, ys) {
  if(m.axis==='X') {
    const ext=[];
    // Anchos de los módulos centrales: cada unión de bahía es un plano físico.
    for(const y of ys) ext.push({a:[m.from,y],b:[m.to,y],length:m.length});
    for(let j=0;j<ys.length-1;j++)ext.push({a:[m.to,ys[j]],b:[m.to,ys[j+1]],length:ys[j+1]-ys[j]});
    return ext;
  }
  const ext=[];
  for(const x of xs)ext.push({a:[x,m.from],b:[x,m.to],length:m.length});
  for(let i=0;i<xs.length-1;i++)ext.push({a:[xs[i],m.to],b:[xs[i+1],m.to],length:xs[i+1]-xs[i]});
  return ext;
}
function deckPlatforms(cell,withHatch) {
  const width=Math.min(cell.x,cell.y),length=Math.max(cell.x,cell.y);
  // Una escotilla comercial de 610 mm sustituye dos pistas de 320 mm.
  const tracks=Math.floor(width/320);
  return {length,quantity:Math.max(0,tracks-(withHatch?2:0))};
}

/**
 * @param {{height:number,spanX:number,spanY:number,extensionX?:number|'auto',extensionY?:number|'auto',extensionHeightX?:number|'auto',extensionHeightY?:number|'auto'}} config
 * @param {{codigo:string,descripcion:string}[]} catalog
 */
export function calculate(config,catalog) {
  invariant(Array.isArray(catalog)&&catalog.length>0,'Debes cargar el catálogo comercial.');
  const catalogByCode=new Map(catalog.map(c=>[c.codigo,c.descripcion]));
  invariant(catalogByCode.size===catalog.length,'Hay códigos repetidos en el catálogo.');
  const H=Number(config.height);
  const baysX=parseBays(config,'X'), baysY=parseBays(config,'Y');
  const xs=gridCoordinates(baysX),ys=gridCoordinates(baysY);
  const x=xs.at(-1),y=ys.at(-1);
  const mainNodes=xs.length*ys.length;
  const cells=baysX.flatMap((lengthX,i)=>baysY.map((lengthY,j)=>({i,j,x:lengthX,y:lengthY})));
  invariant(Number.isInteger(H)&&H>=MIN_HEIGHT&&H<=MAX_HEIGHT,
    'Altura permitida: de 2 a 50 m, en metros enteros.');
  // Todas las combinaciones de bahías de 0,75 / 1,40 / 2,072 / 3,00 m
  // son geometrías válidas. El acceso puede quedar pendiente cuando no hay
  // una escotilla comercial compatible con la configuración elegida.

  // El cliente puede solicitar SOLO el inventario de una torre sin extensiones.
  // Es un modo independiente del dimensionamiento comercial automático: no equivale
  // a autorizar la torre ni determina los anclajes/arriostramientos necesarios.
  // Ambos selectores en «Sin extensión» equivalen al modo del cliente:
  // NO hace falta marcar una segunda casilla para obtener el despiece.
  const explicitlyZero=value=>value===0||value==='0';
  const bothSelectorsWithoutExtensions=explicitlyZero(config.extensionX)&&explicitlyZero(config.extensionY);
  // Un par de ceros que YA cumple H/base no necesita aviso de déficit;
  // el aviso reforzado se reserva para una solicitud fuera del filtro.
  const wouldFallOutsideFilter=x*43<H*10000||y*43<H*10000;
  const clientRequestedNoExtensions=config.clientRequestedNoExtensions===true||
    (bothSelectorsWithoutExtensions&&wouldFallOutsideFilter);
  if(config.clientRequestedNoExtensions===true)for(const axis of ['X','Y']) {
    const requested=config[`extension${axis}`];
    invariant(requested===undefined||requested===null||requested==='auto'||Number(requested)===0,
      'Modalidad sin bases extensibles: elimina las extensiones manuales en X e Y.');
  }
  // 4,3 = 43/10 exacto. Altura en m -> dimensión mm mínima = ceil(H*10000/43).
  const target=Math.ceil(H*10000/43);
  const modulesX=clientRequestedNoExtensions?[]:
    resolveModules(x,target,H,config.extensionX,config.extensionHeightX,'X');
  const modulesY=clientRequestedNoExtensions?[]:
    resolveModules(y,target,H,config.extensionY,config.extensionHeightY,'Y');
  const extensionX=extensionGeometry('X',x,y,modulesX);
  const extensionY=extensionGeometry('Y',x,y,modulesY);
  const allExtensionModules=[...extensionX,...extensionY];
  const extraX=sum(modulesX.map(m=>m.length)), extraY=sum(modulesY.map(m=>m.length));
  const meetsCommercialFootprint=(x+extraX>=target&&y+extraY>=target);
  const supports=mainNodes+extensionX.length*ys.length+extensionY.length*xs.length;
  const even=H%2===0;
  // La escotilla se asigna a una sola bahía central apta para tránsito.
  // Priorizar 1,40×1,40 (acceso caracol conocido) cuando exista.
  const regularCells=cells.filter(c=>c.x>=1400&&c.y>=1400);
  const special750Cell=cells.find(c=>Math.min(c.x,c.y)===750&&Math.max(c.x,c.y)===1400);
  // Las escotillas comerciales longitudinales también corresponden a bahías
  // de 0,75×2,072 y 0,75×3,00, en cualquiera de sus orientaciones.
  const narrowLongCells=cells.filter(c=>Math.min(c.x,c.y)===750&&[2072,3000].includes(Math.max(c.x,c.y)));
  const hatchCell=regularCells.find(c=>c.x===1400&&c.y===1400) ||
    regularCells[0] || narrowLongCells[0] || (H===2&&cells.length===1?special750Cell:null);
  const spiral=Boolean(hatchCell&&hatchCell.x===1400&&hatchCell.y===1400);
  const narrowLongAccess=Boolean(hatchCell&&Math.min(hatchCell.x,hatchCell.y)===750&&
    [2072,3000].includes(Math.max(hatchCell.x,hatchCell.y)));
  const gato=cells.length===1&&Math.min(cells[0].x,cells[0].y)===750&&
    Math.max(cells[0].x,cells[0].y)===1400&&H>=4;
  const hatchLength=hatchCell?Math.max(hatchCell.x,hatchCell.y):0;
  const accessResolved=Boolean(hatchCell||gato);
  const numHatches=hatchCell?Math.floor(H/2):0;
  // Las bahías estrechas largas se protegen mediante barandas perimetrales;
  // no sumar también conjuntos de cerramiento interior para los mismos niveles.
  const closures=spiral||gato||narrowLongAccess||!hatchCell?0:Math.max(0,numHatches-1);
  const lines=new Map(),uniqueHorizontals=new Set(),trace=[];
  const warnings=[
    'DESPIECE COMERCIAL PRELIMINAR. NO ES PLAN DE MONTAJE NI CERTIFICACIÓN DE AUTOESTABILIDAD.',
    'H/base ≤ 4,3 es solo un filtro geométrico comercial: no equivale a un factor de seguridad estructural ni evalúa vuelco, viento, suelo o cargas.',
    'Validar la selección con/sin espigo, anclajes, fijaciones y cerramientos según manual del fabricante.',
  ];
  const pending=[];
  if(clientRequestedNoExtensions||!meetsCommercialFootprint) {
    if(clientRequestedNoExtensions)
      warnings.unshift('SOLICITUD DEL CLIENTE: cálculo de piezas de la torre SIN BASES EXTENSIBLES. LA ESTABILIDAD NO ESTÁ VERIFICADA Y NO SE AUTORIZA EL MONTAJE.');
    if(!meetsCommercialFootprint)
      warnings.push('NO CUMPLE EL FILTRO GEOMÉTRICO COMERCIAL H/base ≤ 4,3 en uno o ambos ejes. El despiece se calcula para presupuestar, pero debe diseñarse una estabilización adecuada antes de cualquier montaje.');
    pending.push({
      concepto:'Diseño de estabilización externa, anclajes y amarres',
      cantidad:'por definir',unidad:'sistema según ingeniería',
      motivo:'La configuración se ha solicitado sin extensiones o sin cumplir H/base ≤ 4,3. No se calculan ni se suman anclajes, amarres, uniones o resistencias: se requiere ingeniería según el emplazamiento.'
    });
  }
  if(!accessResolved) {
    warnings.push('NO HAY SISTEMA DE ACCESO CONFIRMADO: esta combinación geométrica carece de bahía para una escotilla comercial o regla de acceso validada.');
    pending.push({concepto:'Acceso vertical y plataformas de tránsito',cantidad:'por definir',unidad:'componentes',
      motivo:'Se entrega únicamente estructura geométrica; no se inventan escotillas ni escaleras.'});
  }
  if(cells.length>1)warnings.push('La plataforma continua de varios módulos es una estimación por paños; revisar apoyos, interferencias y recorrido de acceso.');
  if(gato)warnings.push('Acceso tipo gato por cara de 0,75 m parametrizado provisionalmente; validar escalones, continuidad de horizontales y protección contra caídas.');
  if(narrowLongAccess)warnings.push('Acceso longitudinal en bahía de 0,75 m: escaleras, escotillas de 2,072/3,00 m y barandas perimetrales por nivel. Validar la apertura útil de las escotillas, las interferencias entre escaleras, las conexiones y la protección física con el fabricante.');
  if(baysX.includes(750)||baysY.includes(750))warnings.push('Los módulos de 0,75 m requieren verificar ancho útil, tipo de plataforma y recorrido de acceso.');
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
  if(closures)warnings.push('Los niveles intermedios se tratan como pasos con escotilla y cerramiento interior; no como pisos completos de trabajo. La protección real de cada acceso debe verificarse técnicamente.');
  if(spiral&&cells.length>1)warnings.push('La protección de niveles intermedios caracol en plantas de varios paños es preliminar; validar perímetros reales de plataformas y barandas antes de utilizar el despiece.');

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

  const mainEdges=gridEdges(xs,ys);
  const mainPerimeter=perimeterEdges(xs,ys);
  for(const m of allExtensionModules) m.edges=extensionEdgesForGrid(m,xs,ys);
  const mainLevels=structuralLevels(H);
  for(const z of mainLevels) for(const edge of mainEdges) horizontal(edge,z,'Horizontales de torre central');
  for(const m of allExtensionModules) for(const z of structuralLevels(m.height))
    for(const edge of m.edges)horizontal(edge,z,`Horizontales de extensión ${m.axis}${m.index}`);
  // Las escotillas intermedias no representan plataformas completas de trabajo.
  // Solo el último piso recibe barandas de perímetro, salvo acceso caracol
  // de 1,40×1,40, que tiene plataformas de paso en niveles intermedios.
  const guardedLevels=spiral||narrowLongAccess?accessLevels(H):[H];
  for(const level of guardedLevels)for(const offset of [500,1000])for(const edge of mainPerimeter)
    horizontal(edge,level*1000+offset,
      level===H?'Barandas perimetrales de plataforma de trabajo superior':
      narrowLongAccess?'Barandas perimetrales de acceso longitudinal estrecho':'Barandas perimetrales de plataforma de acceso caracol');

  // Acceso gato: una cara estrecha se reserva libre de diagonales.
  const gatoFace=gato?mainPerimeter.find(e=>e.length===750):null;
  for(const edge of mainEdges) {
    if(gatoFace&&segmentKey(edge.a,edge.b,0,'gato')===segmentKey(gatoFace.a,gatoFace.b,0,'gato'))continue;
    add(diagonalCode(edge.length),Math.floor(H/2),'Diagonales de entramado central');
  }
  for(const m of allExtensionModules)for(const edge of m.edges)
    add(diagonalCode(edge.length),Math.floor(m.height/2),`Diagonales de caras expuestas de extensión ${m.axis}${m.index}`);

  // Cada línea central: H/2 módulos de 2 m + 1 m superior si H par.
  // Para H impar: 1 m inferior con espigo, floor(H/2) módulos de 2 m, 1 m superior sin espigo.
  add(CODES.v2Spigot,mainNodes*Math.floor(H/2),'Verticales centrales de 2 m');
  if(!even)add(CODES.v1Spigot,mainNodes,'Tramos verticales de 1 m de arranque impar');
  add(CODES.v1Terminal,mainNodes,'Remates superiores de barandas (1 m)');
  add(CODES.pin,mainNodes*(even?H/2:Math.floor(H/2)+1),'Uniones verticales centrales');

  for(const m of allExtensionModules) {
    const lineCount=m.axis==='X'?ys.length:xs.length;
    const n2=Math.floor(m.height/2),odd=m.height%2===1;
    if(odd) {
      add(CODES.v2Spigot,lineCount*n2,`Tramos de 2 m de extensión ${m.axis}${m.index}`);
      add(CODES.v1Terminal,lineCount,`Remate impar de 1 m de extensión ${m.axis}${m.index}`);
      add(CODES.pin,lineCount*n2,`Uniones verticales de extensión ${m.axis}${m.index}`);
    } else {
      add(CODES.v2Spigot,lineCount*Math.max(0,n2-1),`Tramos inferiores de extensión ${m.axis}${m.index}`);
      add(CODES.v2Terminal,lineCount,`Tramos terminales de extensión ${m.axis}${m.index}`);
      add(CODES.pin,lineCount*Math.max(0,n2-1),`Uniones verticales de extensión ${m.axis}${m.index}`);
    }
  }
  add(CODES.collar,supports,'Puntos de apoyo únicos');
  add(CODES.flat,supports,'Tornillos niveladores de base plana');
  if(H<=12)add(CODES.caster,supports,'Alternativa de apoyo: ruedas niveladoras');

  if(numHatches){
    add(CODES.ladder,numHatches,even?'Escaleras: 0→2→…→H':'Escaleras: 1→3→…→H');
    add(hatchCode(hatchLength),numHatches,even?'Escotillas a 2,4,…,H':'Escotillas a 3,5,…,H; no escotilla a 1 m');
  }

  let metalCount=0;
  if(hatchCell){
    const start=even?(Math.min(hatchCell.x,hatchCell.y)===750?2:1):3;
    metalCount+=start;
    add(metalCode(hatchLength),start,narrowLongAccess?'Plataformas longitudinales de arranque para apoyo de primera escalera':'Plataformas metálicas de arranque');
    if(spiral){
      metalCount+=2*numHatches;
      add(metalCode(1400),2*numHatches,'Dos plataformas junto a cada escotilla tipo caracol');
    }
    if(!spiral&&closures){
      add(horizontalCode(750),4*closures,'Horizontales de 0,75 para cierres de escotillas intermedias');
      add(horizontalCode(hatchLength),4*closures,'Horizontales largas de cierres de escotillas intermedias');
      add(CODES.v1Terminal,2*closures,'Verticales de cerramientos intermedios');
    }
  }
  // Cada paño de cubierta superior se cuantifica por separado, sin añadir
  // una escotilla más que la única destinada al acceso de la torre.
  for(const cell of cells){
    const isAccess=cell===hatchCell;
    // Para 1,40×1,40 la regla caracol ya agregó las dos plataformas por escotilla.
    if(isAccess&&spiral)continue;
    const deck=deckPlatforms(cell,isAccess);
    if(deck.quantity){
      add(metalCode(deck.length),deck.quantity,`Cubierta superior, paño X${cell.i+1}/Y${cell.j+1}`);
      metalCount+=deck.quantity;
    }
  }
  // Caso tipo gato: dos plataformas longitudinales en la cubierta superior.
  // Ya contabilizadas por la cuadrícula, sin agregar hatch ni escalera.
  if(gato){
    const shortEdge=mainPerimeter.find(e=>e.length===750);
    // Escalones sobre la cara de 0,75 m en las rosetas intermedias.
    if(shortEdge)for(let z=500;z<H*1000;z+=500)horizontal(shortEdge,z,'Horizontales de acceso tipo gato');
  }
  for(const length of baysX){add(toeCode(length),2,'Rodapiés del perímetro superior, lados X');}
  for(const length of baysY){add(toeCode(length),2,'Rodapiés del perímetro superior, lados Y');}

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
    version:'0.3.4',status:clientRequestedNoExtensions?
      'DESPIECE SOLICITADO SIN EXTENSIONES — ESTABILIDAD NO VERIFICADA — NO APTO COMO PLAN DE MONTAJE':
      !meetsCommercialFootprint?
      'DESPIECE DE CONFIGURACIÓN FUERA DEL FILTRO GEOMÉTRICO — ESTABILIDAD NO VERIFICADA — NO APTO COMO PLAN DE MONTAJE':
      'PRELIMINAR — NO APTO COMO PLAN DE MONTAJE',
    input:{height:H,spanX:x,spanY:y,baysX,baysY,areaM2:x*y/1000000,clientRequestedNoExtensions,extensionX:extraX,extensionY:extraY,
      extensionHeightX:modulesX[0]?.height||0,extensionHeightY:modulesY[0]?.height||0,
      extensionModulesX:modulesX.map(m=>({length:m.length,height:m.height})),
      extensionModulesY:modulesY.map(m=>({length:m.length,height:m.height}))},
    geometry:{target,ratioLimit:GEOMETRIC_RATIO_LIMIT,meetsCommercialFootprint,envelopeX:x+extraX,envelopeY:y+extraY,
      ratioX:H*1000/(x+extraX),ratioY:H*1000/(y+extraY),supports,
      xs,ys,gridCells:cells.map(c=>({x0:xs[c.i],x1:xs[c.i+1],y0:ys[c.j],y1:ys[c.j+1],i:c.i,j:c.j})),
      ...footprint,
      note:'Envolvente exterior; no representa la capacidad resistente ni un polígono de estabilidad verificado'},
    access:{mode:gato?'gato':!accessResolved?'pendiente':spiral?'caracol':narrowLongAccess?'estrecho':'escalera con escotillas y cerramientos interiores',hatches:numHatches,
      ladders:numHatches,metalPlatforms:metalCount,intermediateClosures:closures,guardedLevels,
      hatchLevels:hatchCell?accessLevels(H).filter(level=>even||level>=3):[],
      hatchCell:hatchCell?{row:hatchCell.j+1,column:hatchCell.i+1,width:hatchCell.x,length:hatchCell.y}:null,
      startPlatforms:gato||!hatchCell?[]:(even?[0]:[0,0.5,1])},
    items,totals:{listed,oneBaseOption,baseNodes:supports,
      unmapped:sum(pending.filter(p=>Number.isInteger(p.cantidad)).map(p=>p.cantidad)),
      pendingConcepts:pending.length},pending,warnings,trace,
  };
}

export function formatDimension(mm) {return meters(mm);}