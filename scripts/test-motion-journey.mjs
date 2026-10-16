import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const app = await readFile(new URL('../public/experimental/app.js',import.meta.url),'utf8');
const journey = await readFile(new URL('../public/experimental/recorrido-personal.js',import.meta.url),'utf8');
const html = await readFile(new URL('../public/experimental/index.html',import.meta.url),'utf8');
const css = await readFile(new URL('../public/experimental/recorrido-personal.css',import.meta.url),'utf8');
const arrival = vm.runInNewContext(journey.match(/const arrival = ([\s\S]*?);\n {2}const apply/)[1]);
test('The reading band is settled, and reversing position exactly retraces the reveal at every viewport',()=>{
  for(const height of [390,568,844,900,1180]) {
    assert.equal(arrival(height*.92,height),0);
    assert.equal(arrival(height*.62,height),1);
    assert.equal(arrival(0,height),1);
    assert.equal(arrival(height,height),0);
    const positions=[.92,.85,.77,.7,.62].map(fraction=>fraction*height);
    const down=positions.map(top=>arrival(top,height));
    const up=positions.toReversed().map(top=>arrival(top,height)).reverse();
    assert.deepEqual(down,up);
    assert.ok(Math.abs(down[2]-.5)<1e-12);
  }
});
function navigation() {
  const calls=[];
  const panels=['strev','marky'].map(id=>({id,open:false,
    querySelector:()=>({focus:()=>calls.push('focus:'+id)}),
    getBoundingClientRect:()=>{calls.push('measure:'+id);return {top:300};},
    scrollIntoView:()=>calls.push('scroll:'+id)}));
  const context={projectPanels:panels,window:{location:{hash:'#marky'}},caseNextFocus:null,
    document:{documentElement:{classList:{add:()=>calls.push('settle'),remove:()=>calls.push('unsettle')}}},
    getComputedStyle:()=>({scrollMarginTop:'6px',scrollPaddingTop:'82px'}),parseFloat,
    cancelSummaryAnchor:()=>calls.push('cancel-anchor'),cancelNativeScroll:()=>calls.push('cancel-scroll'),
    cancelPanelProgress:()=>{},markSection:()=>{},updateCaseIndex:()=>{},queueProgress:()=>{}};
  const code=app.slice(app.indexOf('function openHashProject('),app.indexOf('function cancelPanelProgress('));
  vm.createContext(context);vm.runInContext(code,context);
  return {calls,panels,open:context.openHashProject,context};
}
test('Preparing a native project target opens exclusivity and commits geometry without cancelling or moving scroll',()=>{
  const host=navigation();host.panels[0].open=true;
  assert.equal(host.open({hash:'#marky',align:false}),true);
  assert.equal(host.panels[0].open,false);assert.equal(host.panels[1].open,true);
  assert.ok(host.calls.indexOf('measure:marky')<host.calls.indexOf('unsettle'));
  assert.ok(!host.calls.includes('cancel-scroll'));
  assert.ok(!host.calls.some(call=>call.startsWith('scroll:')));
});
test('Direct project hashes align once and preserve focus transfer from a closing case',()=>{
  const host=navigation();host.context.caseNextFocus='#marky';host.open();
  assert.deepEqual(host.calls.filter(call=>call.startsWith('scroll:')),['scroll:marky']);
  assert.ok(host.calls.includes('cancel-scroll'));assert.ok(host.calls.includes('focus:marky'));
  assert.equal(host.context.caseNextFocus,null);
});
test('Unknown fragments cannot mutate disclosures or cancel the native navigation',()=>{
  const host=navigation();assert.equal(host.open({hash:'#contacto'}),false);assert.deepEqual(host.calls,[]);
});
test('The personal route cannot clone hidden archive media or run legacy competing scenes',()=>{
  for(const fn of ['initArchive','updateScenes','settleScenes','measureMorph','measureHeadingInk']) {
    assert.ok(app.includes(`function ${fn}() {\n  if (personalWorld) return;`));
  }
  assert.equal((html.match(/class="journey-window"/g)||[]).length,5);
  assert.equal((html.match(/class="journey-accent"/g)||[]).length,3);
  assert.doesNotMatch(css,/hover[^}]*journey-media/,'Hover cannot override the scroll-owned image transform');
  assert.doesNotMatch(journey,/setTimeout|setInterval|\.animate\(/,'The journey has no timed replay or perpetual animation');
});
