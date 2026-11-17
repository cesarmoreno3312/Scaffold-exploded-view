import {calculate,formatDimension} from './engine.mjs';
let catalog=[];
let lastResult=null;
const $=id=>document.getElementById(id);
const number=n=>new Intl.NumberFormat('es-CO').format(n);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bayState={X:[2072],Y:[1400]};
const formatArea=m2=>new Intl.NumberFormat('es-CO',{minimumFractionDigits:2,maximumFractionDigits:3}).format(m2);
const options=[750,1400,2072,3000];
const configuration=()=>({
  height:Number($('height').value),baysX:[...bayState.X],baysY:[...bayState.Y],
  clientRequestedNoExtensions:$('client-no-extensions').checked,
  extensionX:$('client-no-extensions').checked?'0':$('extensionX').value,
  extensionY:$('client-no-extensions').checked?'0':$('extensionY').value,
  extensionHeightX:$('client-no-extensions').checked?'auto':$('extensionHeightX').value,
  extensionHeightY:$('client-no-extensions').checked?'auto':$('extensionHeightY').value,
});
function renderBayRows(axis){
  const rows=$(`bays${axis}Rows`);
  rows.innerHTML=bayState[axis].map((value,index)=>`<div class="bay-row">
    <span class="bay-number">${index+1}.</span>
    <select data-axis="${axis}" data-index="${index}" aria-label="Módulo ${axis} ${index+1}">
      ${options.map(length=>`<option value="${length}" ${length===value?'selected':''}>${formatDimension(length)} m</option>`).join('')}
    </select>
    <button type="button" class="bay-remove" data-remove="${axis}" data-index="${index}" ${bayState[axis].length===1?'disabled':''} aria-label="Quitar módulo ${axis} ${index+1}" title="Quitar módulo">×</button>
  </div>`).join('');
  rows.querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{
    bayState[axis][Number(el.dataset.index)]=Number(el.value);
    updateAreaPreview();recalc();
  }));
  rows.querySelectorAll('[data-remove]').forEach(button=>button.addEventListener('click',()=>{
    if(bayState[axis].length===1)return;
    bayState[axis].splice(Number(button.dataset.index),1);
    renderBayRows(axis);updateAreaPreview();recalc();
  }));
}
function updateAreaPreview(){
  const x=bayState.X.reduce((a,b)=>a+b,0),y=bayState.Y.reduce((a,b)=>a+b,0);
  $('area-preview').textContent=`Área central: ${formatDimension(x)} × ${formatDimension(y)} m = ${formatArea(x*y/1e6)} m² · ${bayState.X.length*bayState.Y.length} bahía(s)`;
}
for(const axis of ['X','Y']){
  renderBayRows(axis);
  $(`addBay${axis}`).addEventListener('click',()=>{
    if(bayState[axis].length>=10){toast('Máximo 10 módulos por dirección en esta versión');return;}
    bayState[axis].push(1400);renderBayRows(axis);updateAreaPreview();recalc();
  });
}
updateAreaPreview();
function toast(text){const e=$('toast');e.textContent=text;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2300);}
function statLine(label,value,accent=false){return `<div class="geo-row"><span>${escapeHtml(label)}</span><strong class="${accent?'accent':''}">${escapeHtml(value)}</strong></div>`;}
function renderDiagram(geo){
 const {main}=geo;
 const extensions=[...(geo.extensionsX||[]).map(m=>({...m,axis:'X'})),...(geo.extensionsY||[]).map(m=>({...m,axis:'Y'}))];
 const polygons=[{points:main,color:'#bde4da',stroke:'#168a7e'},
  ...extensions.map((m,i)=>({points:m.polygon,color:i%2?'#d3e5e8':'#dfe8ea',stroke:'#668a92'}))];
 const maxX=geo.envelopeX,maxY=geo.envelopeY;
 const factor=Math.min(350/maxX,225/maxY);
 const offX=(420-maxX*factor)/2,offY=(260-maxY*factor)/2;
 const pt=([x,y])=>[offX+x*factor, 260-offY-y*factor];
 const grid=[...Array(13)].map((_,i)=>`<line x1="${20+i*31.4}" y1="9" x2="${20+i*31.4}" y2="268" stroke="#f1f5f4"/>`).join('')+
   [...Array(9)].map((_,i)=>`<line y1="${13+i*31}" x1="17" y2="${13+i*31}" x2="400" stroke="#f1f5f4"/>`).join('');
 const fills=polygons.map(p=>`<polygon points="${p.points.map(a=>pt(a).join(',')).join(' ')}" fill="${p.color}" fill-opacity="0.82" stroke="${p.stroke}" stroke-width="2.6" stroke-linejoin="round"/>`).join('');
 const centralGrid=(geo.gridCells||[]).map(c=>{
   const [a,b]=[pt([c.x0,c.y0]),pt([c.x1,c.y1])];
   return `<rect x="${a[0]}" y="${b[1]}" width="${b[0]-a[0]}" height="${a[1]-b[1]}" fill="none" stroke="#168a7e" stroke-width="1.45"/>`;
 }).join('');
 const supports=new Set((geo.xs||[0,geo.main[1][0]]).flatMap(x=>(geo.ys||[0,geo.main[2][1]]).map(y=>`${x},${y}`)));
 for(const m of (geo.extensionsX||[]))for(const y of (geo.ys||[0,geo.main[2][1]]))supports.add(`${m.polygon[1][0]},${y}`);
 for(const m of (geo.extensionsY||[]))for(const x of (geo.xs||[0,geo.main[1][0]]))supports.add(`${x},${m.polygon[2][1]}`);
 const circles=[...supports].map(v=>{const [x,y]=pt(v.split(',').map(Number));return `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff" stroke="#11786e" stroke-width="2.8"/>`;}).join('');
 const center=pt([geo.main[1][0]/2,geo.main[2][1]/2]);
 const label=`<text x="${center[0]}" y="${center[1]-6}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#146f67" font-weight="800">TORRE CENTRAL</text><text x="${center[0]}" y="${center[1]+10}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#487d7a">${formatDimension(geo.main[1][0])} × ${formatDimension(geo.main[2][1])}</text>`;
 const extTags=extensions.map(m=>{const mid=[m.polygon.reduce((a,p)=>a+p[0],0)/4,m.polygon.reduce((a,p)=>a+p[1],0)/4];return {p:pt(mid),text:`+${m.axis}${m.index}`};})
  .map(t=>`<text x="${t.p[0]}" y="${t.p[1]}" text-anchor="middle" font-weight="800" font-size="12" fill="#496a70">${t.text}</text>`).join('');
 $('footprint').innerHTML=`${grid}${fills}${centralGrid}${circles}${label}${extTags}`;
}
const describeModules=modules=>modules.length?
  `${modules.length} módulo(s): ${modules.map(m=>`${formatDimension(m.length)} m / H ${m.height} m`).join(' + ')}`:'No requerida';

function render(r){
 lastResult=r;
 $('metric-total').textContent=number(r.totals.listed);
 $('metric-onebase').textContent=number(r.totals.oneBaseOption);
 $('metric-supports').textContent=number(r.totals.baseNodes);
 $('metric-pending').textContent=number(r.totals.pendingConcepts ?? r.pending.length);
 $('footer-total').textContent=r.input.clientRequestedNoExtensions?
   `Despiece preliminar: ${number(r.totals.listed)} piezas · anclajes no incluidos`:
   `Total: ${number(r.totals.listed)} piezas`;
 $('access-mode').textContent=({caracol:'Tipo caracol',gato:'Tipo gato',estrecho:'Escaleras, escotillas y barandas',pendiente:'Pendiente de definir'})[r.access.mode] || 'Escaleras y escotillas';
 $('base-options').textContent=r.input.height<=12?'Planos + ruedas *':'Solo tornillos planos';
 $('base-footnote').textContent=r.input.height<=12?'* Ambas opciones de base se relacionan; en montaje se utiliza una sola.':'Para alturas superiores a 12 m solo se relacionan tornillos niveladores de base plana.';
 $('onebase-label').textContent=r.input.height<=12?'Una opción de base':'Piezas con base plana';
 renderDiagram(r.geometry);
 const m= formatDimension;
 $('geometry-stats').innerHTML=[
   statLine('Área de torre',`${m(r.input.spanX)} × ${m(r.input.spanY)} m · ${formatArea(r.input.areaM2)} m²`),
   statLine('Módulos de torre',`${r.input.baysX.length} X × ${r.input.baysY.length} Y = ${r.input.baysX.length*r.input.baysY.length} bahías`),
   statLine('Huella exterior',`${m(r.geometry.envelopeX)} × ${m(r.geometry.envelopeY)} m`,true),
   statLine('Extensiones +X',describeModules(r.input.extensionModulesX)),
   statLine('Extensiones +Y',describeModules(r.input.extensionModulesY)),
   statLine('Criterio comercial 4,3:1',`H / 4,3 ≈ ${m(r.geometry.target)} m (mínimo)`),
   statLine('Modalidad',r.input.clientRequestedNoExtensions?
     'Solicitud del cliente: SIN bases extensibles (anclajes por definir)':
     'Configuración con extensiones según selección'),
   statLine('Filtro geométrico H/4,3',r.geometry.meetsCommercialFootprint?
     'Cumple filtro comercial; NO certifica estabilidad':
     'NO CUMPLE · requiere diseño de estabilización externa'),
   statLine('Relación envolvente',`${r.geometry.ratioX.toFixed(2)} : 1 / ${r.geometry.ratioY.toFixed(2)} : 1`),
   statLine('Acceso',`${r.access.hatches} escotillas · ${r.access.ladders} escaleras${r.access.hatchCell?` · celda X${r.access.hatchCell.column}/Y${r.access.hatchCell.row}`:''}`),
   statLine('Barandas de perímetro',r.access.guardedLevels.length===1?`Solo piso de trabajo superior: ${r.input.height} m`:`${r.access.guardedLevels.length} niveles de acceso con barandas (revisión técnica)`),
   statLine('Altura de trabajo',`${r.input.height} m${r.input.height>12?' · ingeniería obligatoria':''}`),
   statLine('Plataformas metálicas',`${r.access.metalPlatforms} unidades`),
 ].join('');
 $('pending-list').innerHTML=r.pending.length?r.pending.map(i=>`<div class="pending-item"><strong>⚠ ${escapeHtml(i.concepto)} — ${i.cantidad}</strong>${escapeHtml(i.motivo)}</div>`).join(''):'<div class="no-pending">No hay conceptos sin referencia comercial en este cálculo.</div>';
 $('warning-list').innerHTML=r.warnings.map((w,i)=>`<div class="warning-item">${i===0?'<strong>Limitación de seguridad y alcance</strong>':''}${escapeHtml(w)}</div>`).join('');
 renderTable();
}
function groupedBreakdown(reasons){
 const groups=new Map();
 for(const reason of reasons)groups.set(reason.reason,(groups.get(reason.reason)||0)+reason.quantity);
 return [...groups.entries()].map(([name,quantity])=>`<div><strong>${number(quantity)}×</strong> ${escapeHtml(name)}</div>`).join('');
}
function renderTable(){
 if(!lastResult)return;
 const term=$('filter').value.trim().toLowerCase();
 const rows=lastResult.items.filter(row=>[row.codigo,row.descripcion].some(a=>a.toLowerCase().includes(term)));
 $('record-count').textContent=`${rows.length} de ${lastResult.items.length} referencias`;
 $('bom-body').innerHTML=rows.length?rows.map(row=>`<tr><td>${escapeHtml(row.codigo)}</td><td>${escapeHtml(row.descripcion)}</td><td><details class="details"><summary>Ver cálculo</summary><div class="breakdown">${groupedBreakdown(row.reasons)}</div></details></td><td class="right">${number(row.cantidad)}</td></tr>`).join(''):'<tr><td colspan="4">No hay referencias que coincidan con la búsqueda.</td></tr>';
}
function recalc(){
 try{const r=calculate(configuration(),catalog);render(r);}catch(err){
   $('bom-body').innerHTML=`<tr><td colspan="4"><div class="error-message">${escapeHtml(err.message)}</div></td></tr>`;
   $('pending-list').innerHTML=`<div class="error-message">${escapeHtml(err.message)}</div>`;
   toast('Corrige los parámetros de entrada');
   lastResult=null;
   for(const id of ['metric-total','metric-onebase','metric-supports','metric-pending']) $(id).textContent='—';
   $('footer-total').textContent='No hay despiece válido';
 }
}
function save(name,contents,type){const blob=new Blob([contents],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Archivo generado');}
function downloadCSV(){
 if(!lastResult)return;
 const csv='\ufeff' + [
  ['Código','Descripción','Cantidad relacionada','Desglose de origen'],
  ...lastResult.items.map(i=>[i.codigo,i.descripcion,i.cantidad,i.reasons.map(x=>`${x.reason}: ${x.quantity}`).join(' | ')]),
  ['TOTAL','Piezas de inventario relacionadas',lastResult.totals.listed,''],
  ['TOTAL UNA OPCIÓN','Una alternativa de apoyos (ruedas o planos si H≤12)',lastResult.totals.oneBaseOption,''],
  ...lastResult.pending.map(p=>['PENDIENTE',p.concepto,p.cantidad,p.motivo]),
  ['ADVERTENCIA','PRELIMINAR: NO ES PLAN DE MONTAJE', '',lastResult.warnings.join(' | ')],
 ].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');
 save('despiece-ringlock.csv',csv,'text/csv;charset=utf-8');
}
function downloadJSON(){if(!lastResult)return;save('despiece-ringlock.json',JSON.stringify(lastResult,null,2),'application/json;charset=utf-8');}
// Todos los metros enteros del alcance actual, incluyendo alturas impares.
const heightSelect=$('height');
heightSelect.innerHTML=Array.from({length:49},(_,i)=>{const h=i+2;return `<option value="${h}" ${h===10?'selected':''}>${h},00 m</option>`;}).join('');
function updateHeightOptions(){
 const H=Number(heightSelect.value);
 for(const id of ['extensionHeightX','extensionHeightY']) {
  const el=$(id),previous=el.value;
  el.innerHTML='<option value="auto">Automática</option>'+
   Array.from({length:H},(_,i)=>i+1).filter(v=>v>=(H%2?1:2) && v%2===H%2)
    .map(v=>`<option value="${v}">${v} m</option>`).join('');
  el.value=[...el.options].some(o=>o.value===previous)?previous:'auto';
 }
}
updateHeightOptions();
function updateClientRequestMode(){
 const selected=$('client-no-extensions').checked;
 for(const id of ['extensionX','extensionY','extensionHeightX','extensionHeightY'])
   $(id).disabled=selected;
 recalc();
}
$('client-no-extensions').addEventListener('change',updateClientRequestMode);
$('tower-form').addEventListener('submit',ev=>{ev.preventDefault();recalc();});
$('tower-form').querySelectorAll('select:not([data-axis])').forEach(el=>el.addEventListener('change',()=>{
 if(el.id==='height')updateHeightOptions();
 recalc();
}));
$('filter').addEventListener('input',renderTable);
$('download-csv').addEventListener('click',downloadCSV);
$('download-json').addEventListener('click',downloadJSON);
try{
 const response=await fetch('./data/catalogo.json');
 if(!response.ok)throw new Error('No se pudo cargar el catálogo comercial.');
 catalog=await response.json();
 recalc();
}catch(e){$('bom-body').innerHTML=`<tr><td colspan="4"><div class="error-message">${escapeHtml(e.message)}. Inicia el servidor con npm run dev.</div></td></tr>`;}