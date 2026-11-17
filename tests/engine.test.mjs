import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate, structuralLevels, accessLevels} from '../src/engine.mjs';

const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalogo.json',import.meta.url)));
const q=(r,code)=>r.items.find(i=>i.codigo===code)?.cantidad??0;
const materialTotal=r=>r.items.reduce((s,i)=>s+i.cantidad,0);
function verifyMath(r) {
  assert.equal(materialTotal(r),r.totals.listed);
  assert.equal(r.totals.oneBaseOption,r.totals.listed-(r.input.height<=12?r.geometry.supports:0));
  assert.equal(r.geometry.supports,(r.input.baysX.length+1)*(r.input.baysY.length+1)+(r.input.baysY.length+1)*r.input.extensionModulesX.length+(r.input.baysX.length+1)*r.input.extensionModulesY.length);
  assert.ok(r.items.every(i=>i.cantidad>0 && i.reasons.reduce((s,d)=>s+d.quantity,0)===i.cantidad));
  assert.equal(new Set(r.items.map(i=>i.codigo)).size,r.items.length);
  assert.ok(r.items.every(i=>catalog.some(c=>c.codigo===i.codigo)));
  assert.ok(r.geometry.envelopeX*43>=r.input.height*10000);
  assert.ok(r.geometry.envelopeY*43>=r.input.height*10000);
  assert.ok(r.warnings.some(w=>w.includes('NO ES PLAN DE MONTAJE')));
}

test('6 m, 1,40×1,40 sin extensiones cumple relación comercial 4,3:1',()=>{
  for(const opts of [{},{extensionX:0,extensionY:0}]) {
    const r=calculate({height:6,spanX:1400,spanY:1400,...opts},catalog);
    assert.equal(r.geometry.target,1396);
    assert.equal(r.geometry.supports,4);
    assert.equal(r.access.hatches,3);
    assert.equal(r.access.ladders,3);
    assert.equal(r.access.metalPlatforms,7);
    assert.equal(q(r,'AMD.HZ.750'),0);
    assert.equal(q(r,'AMD.HZ.1400'),40);
    assert.equal(q(r,'AMD.DIG.1400'),12);
    assert.equal(r.pending.length,0);
    assert.deepEqual(r.input.extensionModulesX,[]);
    assert.deepEqual(r.input.extensionModulesY,[]);
    assert.equal(q(r,'AMD.RDA.800'),4);
    assert.equal(q(r,'AMD.TN.0,60'),4);
    verifyMath(r);
  }
});

test('8 m 1,40×1,40 conserva extensiones y acceso caracol',()=>{
  const r=calculate({height:8,spanX:1400,spanY:1400},catalog);
  assert.deepEqual(r.input.extensionModulesX,[{length:750,height:2}]);
  assert.deepEqual(r.input.extensionModulesY,[{length:750,height:2}]);
  assert.equal(r.geometry.supports,8);
  assert.equal(r.access.hatches,4);
  assert.equal(r.access.metalPlatforms,9);
  assert.equal(r.access.intermediateClosures,0);
  assert.equal(q(r,'AMD.HZ.750'),8);
  assert.equal(q(r,'AMD.HZ.1400'),56);
  assert.equal(q(r,'AMD.DIG.750'),4);
  assert.equal(q(r,'AMD.DIG.1400'),18);
  assert.equal(q(r,'AMD.PPS.0,25'),16);
  assert.equal(q(r,'AMD.VT.SE.1000'),4);
  assert.equal(r.totals.unmapped,4);
  verifyMath(r);
});

test('10 m 2,072×1,40 mantiene regresiones del MVP',()=>{
  const r=calculate({height:10,spanX:2072,spanY:1400},catalog);
  assert.deepEqual(r.input.extensionModulesX,[{length:750,height:2}]);
  assert.deepEqual(r.input.extensionModulesY,[{length:1400,height:4}]);
  assert.equal(q(r,'AMD.HZ.750'),20);
  assert.equal(q(r,'AMD.HZ.1400'),24);
  assert.equal(q(r,'AMD.HZ.2072'),35);
  assert.equal(q(r,'AMD.DIG.750'),2);
  assert.equal(q(r,'AMD.DIG.1400'),15);
  assert.equal(q(r,'AMD.DIG.2072'),12);
  assert.equal(q(r,'AMD.PPS.0,25'),22);
  assert.equal(q(r,'AMD.VT.SE.1000'),12);
  assert.equal(q(r,'AMD.PLT ES.2072'),5);
  assert.equal(q(r,'AMD.PLT.2072'),3);
  assert.equal(r.access.intermediateClosures,4);
  verifyMath(r);
});

test('10 m 3×3: horizontales 3000 mm son 24 estructurales + 8 barandas superiores + 16 cierres = 48',()=>{
 const r=calculate({height:10,spanX:3000,spanY:3000},catalog);
 assert.equal(r.geometry.supports,4);
 assert.equal(r.pending.length,0);
 assert.equal(q(r,'AMD.HZ.750'),16);
 assert.equal(q(r,'AMD.HZ.3000'),48);
 assert.equal(q(r,'AMD.PLT.3000'),8);
 const row=r.items.find(i=>i.codigo==='AMD.HZ.3000');
 const subtotals=new Map();
 for(const line of row.reasons)subtotals.set(line.reason,(subtotals.get(line.reason)||0)+line.quantity);
 assert.equal(subtotals.get('Horizontales de torre central'),24);
 assert.equal(subtotals.get('Barandas perimetrales de plataforma de trabajo superior'),8);
 assert.equal(subtotals.get('Horizontales largas de cierres de escotillas intermedias'),16);
 assert.equal([...subtotals.values()].reduce((a,b)=>a+b,0),48);
 assert.deepEqual(r.access.guardedLevels,[10]);
 const guardTraces=r.trace.filter(t=>t.reason==='Barandas perimetrales de plataforma de trabajo superior' && t.codigo==='AMD.HZ.3000');
 assert.equal(guardTraces.length,8);
 assert.ok(guardTraces.every(t=>/Nivel 10[.]50 m|Nivel 11[.]00 m/.test(t.details)));
 verifyMath(r);
});

test('altura impar 17 m: sin escotilla a 1 m, tramos terminales y bases planas',()=>{
 const r=calculate({height:17,spanX:3000,spanY:3000},catalog);
 assert.deepEqual(r.access.hatchLevels,[3,5,7,9,11,13,15,17]);
 assert.deepEqual(r.access.startPlatforms,[0,0.5,1]);
 assert.deepEqual(r.input.extensionModulesX,[{length:1400,height:5}]);
 assert.equal(r.access.hatches,8);
 assert.equal(r.access.ladders,8);
 assert.equal(r.access.metalPlatforms,10);
 assert.equal(r.geometry.supports,8);
 assert.equal(q(r,'AMD.HZ.750'),28);
 assert.equal(q(r,'AMD.VT.CE.1000'),4);
 assert.equal(q(r,'AMD.PPS.0,25'),44);
 assert.equal(q(r,'AMD.RDA.800'),0);
 assert.equal(q(r,'AMD.TN.0,60'),8);
 assert.equal(r.totals.listed,r.totals.oneBaseOption);
 assert.ok(r.pending.some(x=>x.concepto.includes('arranque escalonado')));
 verifyMath(r);
});

test('50 m base 3×3: cadenas de extensión +X/+Y, solo tornillo plano',()=>{
 const r=calculate({height:50,spanX:3000,spanY:3000},catalog);
 assert.deepEqual(r.input.extensionModulesX,[{length:3000,height:38},{length:3000,height:26},{length:3000,height:14}]);
 assert.deepEqual(r.input.extensionModulesY,r.input.extensionModulesX);
 assert.equal(r.geometry.envelopeX,12000);
 assert.equal(r.geometry.envelopeY,12000);
 assert.equal(r.geometry.supports,16);
 assert.equal(q(r,'AMD.TN.0,60'),16);
 assert.equal(q(r,'AMD.RDA.800'),0);
 assert.equal(r.access.hatches,25);
 assert.equal(r.access.ladders,25);
 assert.equal(r.totals.unmapped,12);
 assert.ok(r.warnings.some(w=>w.includes('ALTURA ELEVADA')));
 assert.ok(r.warnings.some(w=>w.includes('NO es completo') || w.includes('NO es completo'.toUpperCase())));
 verifyMath(r);
});

test('50 m base 1,40×1,40: varias extensiones comerciales sin error',()=>{
 const r=calculate({height:50,spanX:1400,spanY:1400},catalog);
 assert.equal(r.input.extensionModulesX.length,4);
 assert.equal(r.input.extensionModulesY.length,4);
 assert.equal(r.geometry.supports,20);
 assert.equal(r.access.metalPlatforms,51);
 assert.equal(r.access.intermediateClosures,0);
 assert.equal(q(r,'AMD.HZ.750'),0);
 assert.equal(q(r,'AMD.RDA.800'),0);
 verifyMath(r);
});

test('49 m impar alto: 24 escotillas desde 3 m y apoyo escalonado pendiente',()=>{
 const r=calculate({height:49,spanX:3000,spanY:3000},catalog);
 assert.equal(r.access.hatches,24);
 assert.equal(r.access.hatchLevels[0],3);
 assert.equal(r.access.hatchLevels.at(-1),49);
 assert.equal(r.access.metalPlatforms,10);
 assert.equal(q(r,'AMD.TN.0,60'),16);
 assert.equal(q(r,'AMD.RDA.800'),0);
 verifyMath(r);
});

test('reglas de selección manual, paridad y límites',()=>{
 assert.throws(()=>calculate({height:51,spanX:3000,spanY:3000},catalog),/2 a 50 m/);
 assert.throws(()=>calculate({height:1,spanX:1400,spanY:1400},catalog),/2 a 50 m/);
 assert.throws(()=>calculate({height:10.5,spanX:3000,spanY:3000},catalog),/metros enteros/);
 assert.throws(()=>calculate({height:10,spanX:2072,spanY:1400,extensionX:0},catalog),/criterio comercial/);
 assert.throws(()=>calculate({height:8,spanX:1400,spanY:1400,extensionHeightX:3},catalog),/altura.*par/);
 assert.throws(()=>calculate({height:50,spanX:3000,spanY:3000,extensionX:3000},catalog),/varios módulos sucesivos/);
 assert.throws(()=>calculate({height:50,spanX:3000,spanY:3000,extensionHeightX:8},catalog),/único módulo/);
 assert.ok(calculate({height:8,spanX:3000,spanY:1400},catalog).totals.listed>0);
 const r=calculate({height:8,spanX:1400,spanY:1400,extensionX:1400,extensionY:1400,extensionHeightX:4,extensionHeightY:4},catalog);
 assert.equal(r.geometry.supports,8);verifyMath(r);
});

test('niveles estructurales pares e impares',()=>{
 assert.deepEqual(structuralLevels(8),[0,2000,4000,6000,8000]);
 assert.deepEqual(structuralLevels(17),[0,1000,3000,5000,7000,9000,11000,13000,15000,17000]);
 assert.deepEqual(accessLevels(6),[2,4,6]);
 assert.deepEqual(accessLevels(17),[1,3,5,7,9,11,13,15,17]);
});

test('matriz completa de 5 bases × alturas 2 a 50: sumas y envolventes',()=>{
 const bases=[[1400,1400],[1400,2072],[2072,1400],[2072,2072],[3000,3000]];
 for(const [spanX,spanY] of bases) for(let height=2;height<=50;height++) {
   const r=calculate({height,spanX,spanY},catalog);
   assert.equal(r.input.height,height);
   assert.equal(r.access.hatches,Math.floor(height/2));
   assert.equal(q(r,'AMD.RDA.800'),height<=12?r.geometry.supports:0);
   assert.equal(q(r,'AMD.TN.0,60'),r.geometry.supports);
   verifyMath(r);
 }
});


test('16 combinaciones básicas de las cuatro medidas en X e Y',()=>{
 const measures=[750,1400,2072,3000];
 for(const x of measures)for(const y of measures) {
   const r=calculate({height:6,baysX:[x],baysY:[y]},catalog);
   assert.equal(r.input.spanX,x);
   assert.equal(r.input.spanY,y);
   assert.deepEqual(r.input.baysX,[x]);
   assert.deepEqual(r.input.baysY,[y]);
   assert.equal(r.input.areaM2,x*y/1000000);
   assert.equal(r.geometry.gridCells.length,1);
   verifyMath(r);
 }
});

test('malla de 2×2 combinada 0,75 + 1,40 por 2,072 + 3,00: nodos y bahías compartidas',()=>{
 const r=calculate({height:6,baysX:[750,1400],baysY:[2072,3000]},catalog);
 assert.equal(r.geometry.supports,9);
 assert.equal(r.geometry.gridCells.length,4);
 assert.equal(r.geometry.xs.at(-1),2150);
 assert.equal(r.geometry.ys.at(-1),5072);
 assert.equal(r.input.areaM2,2150*5072/1000000);
 assert.equal(r.access.hatches,3);
 assert.equal(r.access.hatchCell.column,2);
 assert.equal(r.access.hatchCell.row,1);
 assert.equal(q(r,'AMD.PLT ES.2072'),3);
 assert.equal(q(r,'AMD.PLT.2072'),5); // 2 paño 0,75 + 2 paño 1,40 + 1 arranque
 assert.equal(q(r,'AMD.PLT.3000'),6);
 assert.equal(q(r,'AMD.BCLL.0,25'),9);
 assert.equal(r.input.extensionModulesX.length,0);
 assert.equal(r.input.extensionModulesY.length,0);
 // 12 tramos compartidos × 4 niveles estructurales + 8 exteriores × 2 barandas del piso superior.
 // Además, 2 cerramientos internos de 8 horizontales.
 const horizontalTotal=r.items.filter(i=>i.codigo.startsWith('AMD.HZ.')).reduce((a,b)=>a+b.cantidad,0);
 assert.equal(horizontalTotal,80);
 verifyMath(r);
});

test('malla de 2×1 con dos módulos de X, una extensión en Y usa 3 verticales nuevas',()=>{
 const r=calculate({height:12,baysX:[750,1400],baysY:[1400]},catalog);
 assert.equal(r.input.spanX,2150);
 assert.equal(r.input.spanY,1400);
 assert.equal(r.input.extensionModulesX.length,1); // 2150 < 12/4,3
 assert.equal(r.input.extensionModulesY.length,1);
 assert.equal(r.geometry.supports,6+2+3);
 assert.equal(q(r,'AMD.BCLL.0,25'),11);
 verifyMath(r);
});

test('el módulo 0,75×1,40 tiene caso gato en H≥4, sin escotilla ni escalera',()=>{
 const r=calculate({height:4,baysX:[750],baysY:[1400]},catalog);
 assert.equal(r.access.mode,'gato');
 assert.equal(r.access.hatches,0);
 assert.equal(r.access.ladders,0);
 assert.equal(q(r,'AMD.DIG.750'),4); // 2 centrales + 2 en extensión comercial
 assert.equal(q(r,'AMD.DIG.1400'),5); // 4 centrales + 1 en extensión
 assert.equal(q(r,'AMD.HZ.750'),20); // estructura + extensión + peldaños gato
 verifyMath(r);
});

test('la bahía 0,75×0,75 tiene geometría válida sin inventar una escotilla inexistente',()=>{
 const r=calculate({height:6,baysX:[750],baysY:[750]},catalog);
 assert.equal(r.access.mode,'pendiente');
 assert.equal(r.access.hatches,0);
 assert.equal(r.access.ladders,0);
 assert.ok(r.pending.some(x=>x.concepto.includes('Acceso vertical')));
 assert.equal(q(r,'AMD.PLT ES.1400'),0);
 assert.equal(q(r,'AMD.PLT.750'),2);
 verifyMath(r);
});

test('área modular extensa conserva cálculo H50, apoya en nodos y no inventa códigos de horizontales',()=>{
 const r=calculate({height:50,baysX:[750,1400,2072],baysY:[1400,3000]},catalog);
 assert.equal(r.input.spanX,4222);
 assert.equal(r.input.spanY,4400);
 assert.equal(r.geometry.gridCells.length,6);
 assert.equal(q(r,'AMD.RDA.800'),0);
 assert.ok(r.items.filter(i=>i.codigo.startsWith('AMD.HZ.')).every(i=>[750,1400,2072,3000].some(x=>i.codigo.endsWith(String(x)))));
 assert.equal(r.geometry.supports,12+3*r.input.extensionModulesX.length+4*r.input.extensionModulesY.length);
 verifyMath(r);
});

test('no acepta módulo ajeno al catálogo ni más de 10 por eje',()=>{
 assert.throws(()=>calculate({height:6,baysX:[850],baysY:[1400]},catalog),/Cada módulo/);
 assert.throws(()=>calculate({height:6,baysX:Array(11).fill(750),baysY:[1400]},catalog),/entre 1 y 10/);
 assert.throws(()=>calculate({height:6,baysX:[],baysY:[1400]},catalog),/entre 1 y 10/);
});