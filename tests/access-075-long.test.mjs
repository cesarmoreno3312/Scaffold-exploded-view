import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate} from '../src/engine.mjs';

const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalogo.json',import.meta.url)));
const q=(r,code)=>r.items.find(i=>i.codigo===code)?.cantidad??0;
function verify(r){
  assert.equal(r.items.reduce((s,i)=>s+i.cantidad,0),r.totals.listed);
  assert.ok(r.items.every(i=>i.cantidad===i.reasons.reduce((s,d)=>s+d.quantity,0)));
  assert.ok(r.warnings.some(w=>w.includes('NO ES PLAN DE MONTAJE')));
}

test('0,75 × 2,072 / 3,00, también giradas: escaleras, escotillas y dos plataformas longitudinales',()=>{
  for(const length of [2072,3000])
    for(const [spanX,spanY] of [[750,length],[length,750]])
      for(const height of [2,4,6,10]){
        const r=calculate({height,spanX,spanY},catalog);
        assert.equal(r.access.mode,'estrecho');
        assert.equal(r.access.hatches,height/2);
        assert.equal(r.access.ladders,height/2);
        assert.deepEqual(r.access.hatchLevels,Array.from({length:height/2},(_,i)=>(i+1)*2));
        assert.deepEqual(r.access.guardedLevels,r.access.hatchLevels);
        assert.equal(r.access.intermediateClosures,0);
        assert.equal(q(r,`AMD.PLT ES.${length}`),height/2);
        assert.equal(q(r,'AMD.ESC.2200'),height/2);
        assert.equal(q(r,`AMD.PLT.${length}`),2);
        assert.equal(r.items.find(i=>i.codigo===`AMD.PLT.${length}`).reasons
          .find(x=>x.reason.includes('apoyo de primera escalera'))?.quantity,2);
        const reason='Barandas perimetrales de acceso longitudinal estrecho';
        for(const dim of [750,length]){
          const intermediate=r.items.find(i=>i.codigo===`AMD.HZ.${dim}`)?.reasons
            .reduce((n,x)=>n+(x.reason===reason?x.quantity:0),0)||0;
          assert.equal(intermediate,4*(height/2-1));
        }
        assert.ok(!r.pending.some(p=>p.concepto.includes('Acceso vertical')));
        verify(r);
      }
});

test('0,75 × 2,072 / 3,00 H impar: primera escotilla a 3 m; arranque escalonado provisional',()=>{
  for(const length of [2072,3000]){
    const r=calculate({height:5,baysX:[750],baysY:[length]},catalog);
    assert.equal(r.access.mode,'estrecho');
    assert.deepEqual(r.access.hatchLevels,[3,5]);
    assert.deepEqual(r.access.guardedLevels,[1,3,5]);
    assert.equal(q(r,`AMD.PLT ES.${length}`),2);
    assert.equal(q(r,'AMD.ESC.2200'),2);
    assert.equal(q(r,`AMD.PLT.${length}`),3);
    assert.ok(r.pending.some(p=>p.concepto.includes('arranque escalonado')));
    verify(r);
  }
});

test('0,75 × 1,40 H≥4: solo tipo gato, sin escotilla ni escalera apilada; H2 conserva excepción previa',()=>{
  for(const [spanX,spanY] of [[750,1400],[1400,750]])
    for(const height of [4,6,10]){
      const r=calculate({height,spanX,spanY},catalog);
      assert.equal(r.access.mode,'gato');
      assert.equal(q(r,'AMD.ESC.2200'),0);
      assert.equal(q(r,'AMD.PLT ES.1400'),0);
      verify(r);
    }
  const h2=calculate({height:2,spanX:750,spanY:1400},catalog);
  assert.equal(h2.access.hatches,1);
  assert.equal(h2.access.ladders,1);
  verify(h2);
});

test('malla de bahías estrechas sin módulo ancho: seleccionar acceso longitudinal válido',()=>{
  const r=calculate({height:6,baysX:[750],baysY:[1400,2072]},catalog);
  assert.equal(r.access.mode,'estrecho');
  assert.equal(r.access.hatchCell.row,2);
  assert.equal(q(r,'AMD.PLT ES.2072'),3);
  assert.equal(q(r,'AMD.PLT.2072'),2);
  verify(r);
});
