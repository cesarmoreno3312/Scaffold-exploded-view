import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculate } from '../src/engine.mjs';
const catalog = JSON.parse(fs.readFileSync(new URL('../data/catalogo.json', import.meta.url)));
const q = (r, code) => r.items.find(x => x.codigo === code)?.cantidad ?? 0;

function verifyMath(r) {
  assert.equal(r.items.reduce((s,i)=>s+i.cantidad,0),r.totals.listed);
  assert.equal(r.totals.listed-r.geometry.supports,r.totals.oneBaseOption);
  assert.ok(r.items.every(i=>i.cantidad>0));
  assert.equal(new Set(r.items.map(i=>i.codigo)).size,r.items.length);
  assert.ok(r.items.every(i=>catalog.some(c=>c.codigo===i.codigo)));
}

test('8 m 1,40×1,40, dos extensiones en L de 0,75 m: sin cerramiento interior', () => {
  const r = calculate({height:8,spanX:1400,spanY:1400}, catalog);
  assert.deepEqual([r.input.extensionX,r.input.extensionY,r.input.extensionHeightX,r.input.extensionHeightY],[750,750,2,2]);
  assert.equal(r.geometry.supports,8);
  assert.equal(r.access.hatches,4);
  assert.equal(r.access.metalPlatforms,9);
  assert.equal(r.access.intermediateClosures,0);
  assert.equal(q(r,'AMD.HZ.750'),8);
  assert.equal(q(r,'AMD.HZ.1400'),56);
  assert.equal(q(r,'AMD.DIG.750'),4);
  assert.equal(q(r,'AMD.DIG.1400'),18); // 16 caras central + 2 caras exteriores
  assert.equal(q(r,'AMD.PPS.0,25'),16);
  assert.equal(q(r,'AMD.PLT.1400'),9);
  assert.equal(q(r,'AMD.VT.SE.1000'),4);
  assert.equal(r.totals.unmapped,4);
  verifyMath(r);
});

test('10 m 2,072×1,40, extensiones 0,75 y 1,40: niveles y cierres', () => {
  const r = calculate({height:10,spanX:2072,spanY:1400}, catalog);
  assert.deepEqual([r.input.extensionX,r.input.extensionY,r.input.extensionHeightX,r.input.extensionHeightY],[750,1400,2,4]);
  assert.equal(r.geometry.supports,8);
  assert.equal(q(r,'AMD.HZ.750'),20);
  assert.equal(q(r,'AMD.HZ.1400'),40);
  assert.equal(q(r,'AMD.HZ.2072'),51);
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

test('10 m 3×3 sin extensiones no requiere diagonalados pendientes', () => {
  const r = calculate({height:10,spanX:3000,spanY:3000},catalog);
  assert.equal(r.geometry.supports,4);
  assert.equal(r.pending.length,0);
  assert.equal(q(r,'AMD.HZ.750'),16);
  assert.equal(q(r,'AMD.HZ.3000'),80);
  assert.equal(q(r,'AMD.PLT.3000'),8);
  verifyMath(r);
});

test('selección manual y validación de errores', () => {
  assert.throws(()=>calculate({height:17,spanX:3000,spanY:3000},catalog), /alturas pares/);
  assert.throws(()=>calculate({height:10,spanX:2072,spanY:1400,extensionX:0},catalog), /criterio comercial/);
  assert.throws(()=>calculate({height:8,spanX:1400,spanY:1400,extensionHeightX:3},catalog), /altura.*par/);
  const r=calculate({height:8,spanX:1400,spanY:1400,extensionX:1400,extensionY:1400,extensionHeightX:4,extensionHeightY:4},catalog);
  assert.equal(r.geometry.supports,8);
  assert.equal(r.input.extensionX,1400);
  verifyMath(r);
});

test('estructura de trazabilidad suma por código exactamente la cantidad emitida',()=>{
 const r=calculate({height:10,spanX:2072,spanY:1400},catalog);
 for(const row of r.items) assert.equal(row.reasons.reduce((s,item)=>s+item.quantity,0),row.cantidad);
 verifyMath(r);
});

test('no inventa configuraciones de piso no parametrizadas',()=>{
 assert.throws(()=>calculate({height:8,spanX:3000,spanY:1400},catalog),/combinación/);
 assert.throws(()=>calculate({height:8,spanX:2072,spanY:3000},catalog),/combinación/);
});

test('matriz de regresión para las 5 bases admitidas y 6 alturas',()=>{
 const bases=[[1400,1400],[1400,2072],[2072,1400],[2072,2072],[3000,3000]];
 for(const [spanX,spanY] of bases)for(const height of [2,4,6,8,10,12]){
  const r=calculate({height,spanX,spanY},catalog);
  assert.ok(r.geometry.envelopeX>=height*250 && r.geometry.envelopeY>=height*250);
  assert.equal(r.access.hatches,height/2);
  assert.equal(r.totals.unmapped,2*Number(r.input.extensionX>0)+2*Number(r.input.extensionY>0));
  assert.equal(r.geometry.supports,4+2*Number(r.input.extensionX>0)+2*Number(r.input.extensionY>0));
  verifyMath(r);
 }
});