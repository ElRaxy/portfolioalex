import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const app = await readFile(new URL('../public/experimental/app.js',import.meta.url),'utf8');
const journey = await readFile(new URL('../public/experimental/recorrido-personal.js',import.meta.url),'utf8');
const html = await readFile(new URL('../public/experimental/index.html',import.meta.url),'utf8');
const css = await readFile(new URL('../public/experimental/recorrido-personal.css',import.meta.url),'utf8');
const geometry = journey.slice(journey.indexOf('  const clamp ='),journey.indexOf('  // End pure geometry.'));
const {arrival,depthProgress,depthPose,amplitude} = vm.runInNewContext(`${geometry};({arrival,depthProgress,depthPose,amplitude})`);
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


test('Depth keeps moving through the reading band, forward and backward, on all device sizes',()=>{
  for(const [width,height] of [[390,844],[820,1180],[1440,900]]) {
    const points=[.9,.62,.4,.15,-.1].map(fraction=>depthProgress(height*fraction,300,height));
    const down=points.map(p=>depthPose('media',p,width));
    const up=points.toReversed().map(p=>depthPose('media',p,width)).reverse();
    assert.deepEqual(down,up);
    assert.equal(new Set(down).size,points.length,'Reading-band positions must still have different depth poses');
  }
});
test('Depth bounds and responsive amplitudes interpolate continuously at tablet and clamp at outer widths',()=>{
  assert.equal(amplitude(390,34,64,112),34);
  assert.equal(amplitude(820,34,64,112),64);
  assert.equal(amplitude(1440,34,64,112),112);
  assert.equal(amplitude(320,34,64,112),34);
  assert.equal(amplitude(2560,34,64,112),112);
  assert.ok(Math.abs(amplitude(819.99,34,64,112)-amplitude(820.01,34,64,112))<.01);
  assert.equal(depthProgress(2000,300,900),0);
  assert.equal(depthProgress(-400,300,900),1);
});
test('Frame cadence cannot alter a pose and reduced/keyboard neutralizes every decorative plane',()=>{
  for(const kind of ['hero-portrait','hero-paper','hero-doodle','media','sketch','talk','paper']) {
    const expected=depthPose(kind,.37,820);
    for(let frame=0;frame<120;frame++) assert.equal(depthPose(kind,.37,820),expected);
    assert.equal(depthPose(kind,0,820,true),depthPose(kind,1,820,true));
  }
  assert.equal(depthPose('hero-portrait',1,1440),'translate3d(0,-112px,0)');
  assert.equal(depthPose('hero-paper',1,1440),'translate3d(0,48px,0) rotate(-2deg)');
});
function journeyHarness() {
  const events=new Map(),frames=new Map(),style={};
  let nextFrame=0,focused=true,insideFocus=false,top=1700;
  const keyboard=new Set();
  const media={matches:false,addEventListener:(name,fn)=>events.set('media:'+name,fn)};
  const on=(name,fn)=>events.set(name,[...(Array.isArray(events.get(name))?events.get(name):[]),fn]);
  const wrapper={getBoundingClientRect:()=>({top:top-window.scrollY,width:500,height:100}),closest:()=>({contains:()=>insideFocus}),
    querySelectorAll:()=>[target]};
  const target={dataset:{parallaxLayer:'media'},style,closest:()=>wrapper};
  const root={scrollHeight:2000,classList:{contains:token=>keyboard.has(token)}};
  const document={body:{classList:{contains:()=>true}},documentElement:root,hidden:false,activeElement:null,
    hasFocus:()=>focused,querySelector:()=>null,querySelectorAll:selector=>selector==='[data-parallax-scene]'?[wrapper]:[],addEventListener:on};
  const window={innerHeight:900,innerWidth:1440,scrollY:0,addEventListener:on,portfolioEntry:{active:false}};
  const context={document,window,matchMedia:()=>media,IntersectionObserver:class {
    constructor(callback){this.callback=callback;} observe(node){this.callback([{target:node,isIntersecting:true,boundingClientRect:node.getBoundingClientRect()}]);} disconnect(){}
  },getComputedStyle:()=>({getPropertyValue:()=> '65px'}),parseFloat,queueMicrotask:fn=>fn(),
    requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id)};
  window.IntersectionObserver=context.IntersectionObserver;
  vm.runInNewContext(journey,context);
  const flush=()=>{const scheduled=[...frames.values()];frames.clear();scheduled.forEach(fn=>fn());};
  const emit=name=>{const handlers=events.get(name);(Array.isArray(handlers)?handlers:[handlers]).filter(Boolean).forEach(fn=>fn({key:'Tab'}));};
  return {window,document,style,frames,media,keyboard,flush,emit,setFocus:value=>{focused=value;},setInsideFocus:value=>{insideFocus=value;},setTop:value=>{top=value;}};
}
test('Blur preserves the current pose and cancels scheduled frames rather than snapping the page',()=>{
  const host=journeyHarness();host.window.scrollY=1000;host.flush();
  const pose=host.style.transform;
  host.emit('scroll');assert.equal(host.frames.size,1);
  host.setFocus(false);host.emit('blur');assert.equal(host.frames.size,0);assert.equal(host.style.transform,pose);
  host.emit('scroll');assert.equal(host.frames.size,0);assert.equal(host.style.transform,pose);
  host.setFocus(true);host.emit('focus');host.flush();assert.equal(host.style.transform,pose);
  assert.equal(host.frames.size,0,'A settled frame must not schedule itself');
});
test('The page bottom keeps its actual geometric depth instead of resetting every layer to neutral',()=>{
  const host=journeyHarness();host.window.scrollY=1100;host.flush();
  assert.equal(host.style.transform,depthPose('media',depthProgress(600,100,900),1440));
  assert.notEqual(host.style.transform,depthPose('media',1,1440,true));
});
test('Reduced motion settles immediately; resuming and resizing recompute the same geometric position',()=>{
  const host=journeyHarness();host.window.scrollY=900;host.flush();
  host.media.matches=true;host.emit('media:change');
  assert.equal(host.style.transform,depthPose('media',0,1440,true));
  host.media.matches=false;host.emit('media:change');host.flush();
  assert.equal(host.style.transform,depthPose('media',depthProgress(800,100,900),1440));
  host.window.innerWidth=390;host.emit('resize');host.flush();
  assert.equal(host.style.transform,depthPose('media',depthProgress(800,100,900),390));
});


test('Pointer focus inside a project preserves depth while keyboard focus remains neutral',()=>{
  const host=journeyHarness();host.window.scrollY=1000;host.flush();
  const pose=host.style.transform;
  host.setInsideFocus(true);host.document.activeElement={};host.emit('focusin');host.flush();
  assert.equal(host.style.transform,pose,'Focusing a summary with a pointer cannot snap its art to neutral');
  host.keyboard.add('keyboard');host.emit('focusin');host.flush();
  assert.equal(host.style.transform,depthPose('media',0,1440,true));
  host.keyboard.delete('keyboard');host.emit('pointerdown');host.flush();
  assert.equal(host.style.transform,pose,'Returning to pointer modality restores the geometric pose');
});
