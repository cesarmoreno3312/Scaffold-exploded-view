import {calculate,formatDimension} from './engine.mjs';
let catalog=[];
let lastResult=null;
const $=id=>document.getElementById(id);
const number=n=>new Intl.NumberFormat('es-CO').format(n);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const configuration=()=>({
  height:Number($('height').value), spanX:Number($('spanX').value),spanY:Number($('spanY').value),
  extensionX:$('extensionX').value, extensionY:$('extensionY').value,
  extensionHeightX:$('extensionHeightX').value,extensionHeightY:$('extensionHeightY').value,
});
function toast(text){const e=$('toast');e.textContent=text;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2300);}
function statLine(label,value,accent=false){return `<div class="geo-row"><span>${escapeHtml(label)}</span><strong class="${accent?'accent':''}">${escapeHtml(value)}</strong></div>`;}
function renderDiagram(geo){
 const {main,extensionX,extensionY}=geo;
 const polygons=[{points:main,color:'#bde4da',stroke:'#168a7e'},...(extensionX?[{points:extensionX,color:'#dfe8ea',stroke:'#668a92'}]:[]),...(extensionY?[{points:extensionY,color:'#dfe8ea',stroke:'#668a92'}]:[])];
 const maxX=geo.envelopeX,maxY=geo.envelopeY;
 const factor=Math.min(300/maxX,212/maxY);
 const offX=(420-maxX*factor)/2,offY=(260-maxY*factor)/2;
 const pt=([x,y])=>[offX+x*factor, 260-offY-y*factor];
 const grid=[...Array(13)].map((_,i)=>`<line x1="${20+i*31.4}" y1="9" x2="${20+i*31.4}" y2="268" stroke="#f1f5f4"/>`).join('')+
   [...Array(9)].map((_,i)=>`<line y1="${13+i*31}" x1="17" y2="${13+i*31}" x2="400" stroke="#f1f5f4"/>`).join('');
 const fills=polygons.map(p=>`<polygon points="${p.points.map(a=>pt(a).join(',')).join(' ')}" fill="${p.color}" fill-opacity="0.82" stroke="${p.stroke}" stroke-width="2.6" stroke-linejoin="round"/>`).join('');
 const supports=new Set(polygons.flatMap(p=>p.points.map(a=>a.join(','))));
 const circles=[...supports].map(s=>{const [x,y]=pt(s.split(',').map(Number));return `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff" stroke="#11786e" stroke-width="2.8"/>`;}).join('');
 const center=pt([geo.main[1][0]/2,geo.main[2][1]/2]);
 const label=`<text x="${center[0]}" y="${center[1]-6}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#146f67" font-weight="800">TORRE CENTRAL</text><text x="${center[0]}" y="${center[1]+10}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#487d7a">${formatDimension(geo.main[1][0])} × ${formatDimension(geo.main[2][1])}</text>`;
 const extTags=[extensionX && {p:pt([(extensionX[0][0]+extensionX[1][0])/2,(extensionX[0][1]+extensionX[2][1])/2]),text:'+X'},extensionY && {p:pt([(extensionY[0][0]+extensionY[2][0])/2,(extensionY[0][1]+extensionY[2][1])/2]),text:'+Y'}].filter(Boolean).map(t=>`<text x="${t.p[0]}" y="${t.p[1]}" text-anchor="middle" font-weight="800" font-size="12" fill="#496a70">${t.text}</text>`).join('');
 $('footprint').innerHTML=`${grid}${fills}${circles}${label}${extTags}`;
}
function render(r){
 lastResult=r;
 $('metric-total').textContent=number(r.totals.listed);
 $('metric-onebase').textContent=number(r.totals.oneBaseOption);
 $('metric-supports').textContent=number(r.totals.baseNodes);
 $('metric-pending').textContent=number(r.totals.unmapped);
 $('footer-total').textContent=`Total: ${number(r.totals.listed)} piezas`;
 $('access-mode').textContent=r.access.mode==='caracol'?'Tipo caracol':'Escaleras y escotillas';
 renderDiagram(r.geometry);
 const m= formatDimension;
 $('geometry-stats').innerHTML=[
   statLine('Base central',`${m(r.input.spanX)} × ${m(r.input.spanY)} m`),
   statLine('Huella exterior',`${m(r.geometry.envelopeX)} × ${m(r.geometry.envelopeY)} m`,true),
   statLine('Extensión +X',r.input.extensionX?`${m(r.input.extensionX)} m · H ${r.input.extensionHeightX} m`:'No requerida'),
   statLine('Extensión +Y',r.input.extensionY?`${m(r.input.extensionY)} m · H ${r.input.extensionHeightY} m`:'No requerida'),
   statLine('Criterio comercial 4,3:1',`H / 4,3 ≈ ${m(r.geometry.target)} m (mínimo)`),
   statLine('Relación envolvente',`${r.geometry.ratioX.toFixed(2)} : 1 / ${r.geometry.ratioY.toFixed(2)} : 1`),
   statLine('Acceso',`${r.access.hatches} escotillas · ${r.access.ladders} escaleras`),
   statLine('Plataformas metálicas',`${r.access.metalPlatforms} unidades`),
 ].join('');
 $('pending-list').innerHTML=r.pending.length?r.pending.map(i=>`<div class="pending-item"><strong>⚠ ${escapeHtml(i.concepto)} — ${i.cantidad}</strong>${escapeHtml(i.motivo)}</div>`).join(''):'<div class="no-pending">No hay conceptos sin referencia comercial en este cálculo.</div>';
 $('warning-list').innerHTML=r.warnings.map((w,i)=>`<div class="warning-item">${i===0?'<strong>Limitación de seguridad y alcance</strong>':''}${escapeHtml(w)}</div>`).join('');
 renderTable();
}
function renderTable(){
 if(!lastResult)return;
 const term=$('filter').value.trim().toLowerCase();
 const rows=lastResult.items.filter(row=>[row.codigo,row.descripcion].some(a=>a.toLowerCase().includes(term)));
 $('record-count').textContent=`${rows.length} de ${lastResult.items.length} referencias`;
 $('bom-body').innerHTML=rows.length?rows.map(row=>`<tr><td>${escapeHtml(row.codigo)}</td><td>${escapeHtml(row.descripcion)}</td><td><details class="details"><summary>Ver cálculo</summary><div class="breakdown">${row.reasons.map(v=>`<div><strong>${number(v.quantity)}×</strong> ${escapeHtml(v.reason)}</div>`).join('')}</div></details></td><td class="right">${number(row.cantidad)}</td></tr>`).join(''):'<tr><td colspan="4">No hay referencias que coincidan con la búsqueda.</td></tr>';
}
function recalc(){
 try{const r=calculate(configuration(),catalog);render(r);}catch(err){
   $('bom-body').innerHTML=`<tr><td colspan="4"><div class="error-message">${escapeHtml(err.message)}</div></td></tr>`;
   $('pending-list').innerHTML=`<div class="error-message">${escapeHtml(err.message)}</div>`;
   toast('Corrige los parámetros de entrada');
   lastResult=null;
 }
}
function save(name,contents,type){const blob=new Blob([contents],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Archivo generado');}
function downloadCSV(){
 if(!lastResult)return;
 const csv='\ufeff' + [
  ['Código','Descripción','Cantidad relacionada','Desglose de origen'],
  ...lastResult.items.map(i=>[i.codigo,i.descripcion,i.cantidad,i.reasons.map(x=>`${x.reason}: ${x.quantity}`).join(' | ')]),
  ['TOTAL','Incluye alternativas de ruedas y tornillos niveladores',lastResult.totals.listed,''],
  ['MONTAJE CON UNA BASE','Alternativa de apoyo excluyente',lastResult.totals.oneBaseOption,''],
 ].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');
 save('despiece-ringlock.csv',csv,'text/csv;charset=utf-8');
}
function downloadJSON(){if(!lastResult)return;save('despiece-ringlock.json',JSON.stringify(lastResult,null,2),'application/json;charset=utf-8');}
$('tower-form').addEventListener('submit',ev=>{ev.preventDefault();recalc();});
$('tower-form').querySelectorAll('select').forEach(el=>el.addEventListener('change',recalc));
$('filter').addEventListener('input',renderTable);
$('download-csv').addEventListener('click',downloadCSV);
$('download-json').addEventListener('click',downloadJSON);
try{
 const response=await fetch('./data/catalogo.json');
 if(!response.ok)throw new Error('No se pudo cargar el catálogo comercial.');
 catalog=await response.json();
 recalc();
}catch(e){$('bom-body').innerHTML=`<tr><td colspan="4"><div class="error-message">${escapeHtml(e.message)}. Inicia el servidor con npm run dev.</div></td></tr>`;}