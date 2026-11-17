import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate} from '../src/engine.mjs';

const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalogo.json',import.meta.url)));
const qty=(r,code)=>r.items.find(i=>i.codigo===code)?.cantidad??0;
function check(r) {
  assert.equal(r.items.reduce((s,x)=>s+x.cantidad,0),r.totals.listed);
  assert.ok(r.items.every(x=>x.reasons.reduce((s,p)=>s+p.quantity,0)===x.cantidad));
  assert.equal(r.input.extensionX,0);
  assert.equal(r.input.extensionY,0);
  assert.deepEqual(r.input.extensionModulesX,[]);
  assert.deepEqual(r.input.extensionModulesY,[]);
  assert.equal(r.geometry.envelopeX,r.input.spanX);
  assert.equal(r.geometry.envelopeY,r.input.spanY);
  assert.equal(r.input.clientRequestedNoExtensions,true);
  assert.ok(r.pending.some(p=>p.concepto.includes('estabilización externa')));
  assert.ok(r.warnings.some(w=>w.includes('SOLICITUD DEL CLIENTE')));
  assert.ok(r.status.includes('ESTABILIDAD NO VERIFICADA'));
  assert.ok(r.warnings.some(w=>w.includes('NO ES PLAN DE MONTAJE')));
  assert.equal(qty(r,'AMD.ARR.48.3X600'),0); // no inventar número de anclajes
}

test('H10, 1,40×1,40: genera despiece por solicitud de cliente SIN extensiones aunque incumple 4,3:1',()=>{
  const sinCasilla=calculate({height:10,spanX:1400,spanY:1400,extensionX:'0',extensionY:'0'},catalog);
  check(sinCasilla);
  assert.equal(sinCasilla.geometry.meetsCommercialFootprint,false);
  const r=calculate({height:10,spanX:1400,spanY:1400,clientRequestedNoExtensions:true},catalog);
  check(r);
  assert.equal(r.geometry.meetsCommercialFootprint,false);
  assert.equal(r.geometry.supports,4);
  assert.equal(qty(r,'AMD.BCLL.0,25'),4);
  assert.equal(qty(r,'AMD.TN.0,60'),4);
  assert.equal(qty(r,'AMD.RDA.800'),4);
  assert.equal(qty(r,'AMD.ESC.2200'),5);
  assert.equal(qty(r,'AMD.PLT ES.1400'),5);
  assert.equal(qty(r,'AMD.PLT.1400'),11);
  assert.ok(r.warnings.some(w=>w.includes('NO CUMPLE EL FILTRO')));
});

test('Modo automático sin solicitud sigue seleccionando las extensiones cuando hacen falta',()=>{
  const r=calculate({height:10,spanX:1400,spanY:1400},catalog);
  assert.ok(r.input.extensionModulesX.length>0);
  assert.ok(r.input.extensionModulesY.length>0);
  assert.equal(r.input.clientRequestedNoExtensions,false);
  assert.equal(r.geometry.meetsCommercialFootprint,true);
  assert.ok(!r.pending.some(p=>p.concepto.includes('estabilización externa')));
});

test('H12, 0,75×3,00: modo sin extensiones conserva escaleras, escotillas y dos plataformas iniciales',()=>{
  const r=calculate({height:12,baysX:[750],baysY:[3000],clientRequestedNoExtensions:true,
    extensionX:'0',extensionY:'0'},catalog);
  check(r);
  assert.equal(r.access.mode,'estrecho');
  assert.equal(r.access.hatches,6);
  assert.equal(r.access.ladders,6);
  assert.equal(qty(r,'AMD.PLT ES.3000'),6);
  assert.equal(qty(r,'AMD.PLT.3000'),2);
  assert.equal(r.geometry.supports,4);
  assert.equal(r.geometry.meetsCommercialFootprint,false);
});

test('H50, 3×3: despiece de torre sin extensiones, con advertencias y solo apoyo plano',()=>{
  const r=calculate({height:50,spanX:3000,spanY:3000,clientRequestedNoExtensions:true},catalog);
  check(r);
  assert.equal(r.geometry.supports,4);
  assert.equal(r.geometry.meetsCommercialFootprint,false);
  assert.equal(qty(r,'AMD.RDA.800'),0);
  assert.equal(qty(r,'AMD.TN.0,60'),4);
  assert.equal(r.access.hatches,25);
  assert.ok(r.warnings.some(w=>w.includes('ALTURA ELEVADA')));
});

test('H6, 1,40×1,40: despiece sin bases extensibles y filtro geométrico cumplido',()=>{
  const r=calculate({height:6,spanX:1400,spanY:1400,clientRequestedNoExtensions:true},catalog);
  check(r);
  assert.equal(r.geometry.meetsCommercialFootprint,true);
  assert.ok(!r.warnings.some(w=>w.includes('NO CUMPLE EL FILTRO')));
  assert.equal(qty(r,'AMD.HZ.1400'),40);
});

test('La modalidad especial no mezcla módulos de extensión pedidos manualmente',()=>{
  assert.throws(()=>calculate({height:10,spanX:1400,spanY:1400,clientRequestedNoExtensions:true,
    extensionX:'1400',extensionY:'0'},catalog),/elimina las extensiones manuales/);
});

test('Selector Sin extensión en X e Y funciona sin casilla especial para altura alta y base pequeña',()=>{
 for(const height of [8,10,12,17,50]){
   const r=calculate({height,spanX:1400,spanY:1400,extensionX:'0',extensionY:'0'},catalog);
   check(r);
   assert.equal(r.geometry.supports,4);
   assert.equal(r.geometry.meetsCommercialFootprint,false);
   assert.ok(r.items.length>0);
 }
});

test('Sin extensión solo en X y automática Y: devuelve despiece parcial con advertencia y sin inventar anclajes',()=>{
 const r=calculate({height:10,spanX:2072,spanY:1400,extensionX:'0',extensionY:'auto'},catalog);
 assert.equal(r.input.extensionX,0);
 assert.ok(r.input.extensionY>0);
 assert.equal(r.geometry.meetsCommercialFootprint,false);
 assert.equal(r.input.clientRequestedNoExtensions,false);
 assert.ok(r.totals.listed>0);
 assert.ok(r.pending.some(p=>p.concepto.includes('estabilización externa')));
 assert.ok(r.status.includes('ESTABILIDAD NO VERIFICADA'));
 assert.equal(qty(r,'AMD.ARR.48.3X600'),0);
});

test('La selección automática sigue añadiendo extensiones y no exige la casilla',()=>{
 const r=calculate({height:10,spanX:1400,spanY:1400,extensionX:'auto',extensionY:'auto'},catalog);
 assert.equal(r.input.clientRequestedNoExtensions,false);
 assert.ok(r.input.extensionX>0 && r.input.extensionY>0);
 assert.equal(r.geometry.meetsCommercialFootprint,true);
});

test('Sin extensión elegida directamente y filtro ya cumplido conserva despiece normal H6',()=>{
 const r=calculate({height:6,spanX:1400,spanY:1400,extensionX:'0',extensionY:'0'},catalog);
 assert.equal(r.input.extensionX,0);
 assert.equal(r.input.extensionY,0);
 assert.equal(r.geometry.meetsCommercialFootprint,true);
 assert.equal(r.input.clientRequestedNoExtensions,false);
 assert.equal(r.pending.length,0);
});
