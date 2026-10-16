import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const app = await readFile(new URL('../public/experimental/app.js',import.meta.url),'utf8');
const journey = await readFile(new URL('../public/experimental/recorrido-personal.js',import.meta.url),'utf8');
const html = await readFile(new URL('../public/experimental/index.html',import.meta.url),'utf8');
const css = await readFile(new URL('../public/experimental/recorrido-personal.css',import.meta.url),'utf8');
const geometry = journey.slice(journey.indexOf('  const clamp ='),journey.indexOf('  // End pure geometry.'));
const {arrival,depthProgress,depthPose,amplitude,sceneArrival,journeyPose,heightWeight,storyLayout,storyPosition,storyFramePose,workStoryRow} = vm.runInNewContext(`${geometry};({arrival,depthProgress,depthPose,amplitude,sceneArrival,journeyPose,heightWeight,storyLayout,storyPosition,storyFramePose,workStoryRow})`);
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
function journeyHarness(kind = 'media') {
  const events=new Map(),frames=new Map(),style={};
  let nextFrame=0,focused=true,insideFocus=false,top=1700;
  const keyboard=new Set();
  const media={matches:false,addEventListener:(name,fn)=>events.set('media:'+name,fn)};
  const on=(name,fn)=>events.set(name,[...(Array.isArray(events.get(name))?events.get(name):[]),fn]);
  const wrapper={getBoundingClientRect:()=>({top:top-window.scrollY,width:500,height:100}),closest:()=>({contains:()=>insideFocus}),
    querySelectorAll:()=>[target]};
  const target={dataset:{parallaxLayer:kind},style,closest:()=>wrapper};
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
  assert.equal(host.style.transform,journeyPose('media',depthProgress(800,100,900),1440,false,sceneArrival(800,900,900,1100,.98,.60),900,100));
  host.window.innerWidth=390;host.emit('resize');host.flush();
  assert.equal(host.style.transform,journeyPose('media',depthProgress(800,100,900),390,false,sceneArrival(800,900,900,1100,.98,.60),900,100));
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


test('Headings finish before reading; media presentation settles while geometric depth continues',()=>{
  for(const [width,height] of [[320,568],[390,844],[651,900],[759,900],[760,900],[820,1180],[844,390],[1440,1000]]) {
    const docTop=2000, travel=6000;
    for(const order of [0,1]) {
      const start=.96-.035*order;
      assert.equal(sceneArrival(start*height,height,docTop-start*height,travel,start,.64),0);
      assert.equal(sceneArrival(.64*height,height,docTop-.64*height,travel,start,.64),1);
    }
    const topValues=[.98,.9,.8,.7,.6,.4,.1].map(v=>v*height);
    const samples=topValues.map(top=>journeyPose('media',depthProgress(top,500,height),width,false,sceneArrival(top,height,docTop-top,travel,.98,.6),height,500));
    assert.match(samples[0],/rotateX\([1-9.]/);
    assert.match(samples[0],/scale\(0\./);
    assert.doesNotMatch(samples[4],/rotateX|scale/,'Reading-band capture is flat and full size');
    assert.notEqual(samples[4],samples[5],'Depth continues after presentation is complete');
    const reverse=topValues.toReversed().map(top=>journeyPose('media',depthProgress(top,500,height),width,false,sceneArrival(top,height,docTop-top,travel,.98,.6),height,500)).reverse();
    assert.deepEqual(samples,reverse);
    assert.equal(journeyPose('heading',.5,width,false,1,height),'translate3d(0,0px,0)');
  }
});
test('Unreachable reading bands settle continuously at page bottom without resetting depth',()=>{
  const height=900, docTop=1700, travel=1100;
  const positions=[850,950,1050,1099,1100];
  const arrivals=positions.map(scroll=>sceneArrival(docTop-scroll,height,scroll,travel));
  assert.ok(arrivals[1]>arrivals[0] && arrivals[2]>arrivals[1]);
  assert.ok(arrivals[3]>.999 && arrivals[3]<1);
  assert.equal(arrivals[4],1);
  assert.equal(sceneArrival(400,height,0,0),1,'Non-scrollable page cannot leave titles displaced');
  assert.notEqual(depthPose('media',depthProgress(600,100,height),1440),depthPose('media',0,1440,true));
});
test('New gestures are viewport-safe and neutral for keyboard/reduced motion, including landscape',()=>{
  assert.equal(heightWeight(390),.3);
  assert.equal(heightWeight(1000),1);
  for(const width of [320,390,650,651,759,760,820,1024,1440]) {
    for(const kind of ['heading','media','hero-portrait']) {
      assert.equal(journeyPose(kind,0,width,true,0,390,800),journeyPose(kind,1,width,true,1,1180,100));
    }
    const size=800, perspective=3200;
    const pose=journeyPose('media',.5,width,false,0,1000,size);
    const scale=Number(pose.match(/scale\(([^)]+)\)/)[1]);
    const radians=Number(pose.match(/rotateX\(([^)]+)deg\)/)[1])*Math.PI/180;
    assert.ok(scale/(1-size/2*Math.sin(radians)/perspective)<1,'Perspective must fit inside the full-size image footprint');
  }
  assert.ok(Math.abs(heightWeight(699.99)-heightWeight(700.01))<.001);
  assert.equal((html.match(/class="journey-heading-line"/g)||[]).length,5);
  assert.match(html,/id="contact-title"[^>]*><span><span class="journey-heading-line"/,'Animated child must be inside the stable CSS-reset span');
  assert.doesNotMatch(css,/journey-heading-line[^}]*opacity:0/,'No-JS text cannot be hidden');
});

test('Actual heading controller delivers settled reading poses and retraces a partial entrance',()=>{
  const host=journeyHarness('heading');host.setTop(1700);
  host.window.scrollY=900;host.flush();const partial=host.style.transform;
  assert.notEqual(partial,'translate3d(0,0px,0)');
  host.window.scrollY=1100;host.emit('scroll');host.flush();
  assert.equal(host.style.transform,'translate3d(0,0px,0)','Reachable page bottom settles heading even above planned reading band');
  host.window.scrollY=900;host.emit('scroll');host.flush();assert.equal(host.style.transform,partial);
  host.media.matches=true;host.emit('media:change');assert.equal(host.style.transform,'translate3d(0,0px,0)');
});


test('All three story acts have readable holds within the actual sticky interval, reversible on every device',()=>{
  for(const [width,height] of [[320,640],[390,844],[651,900],[759,900],[760,900],[820,1180],[1440,1000]]) {
    const layout=storyLayout(width,height,65), top=1800;
    const flowOffset=layout.mobile?layout.stage:0;
    const centers=[.5,1.5,2.5].map(i=>top+flowOffset+i*layout.step);
    const start=top-layout.inset,end=top+flowOffset+3*layout.step-layout.inset-layout.stage;
    const line=layout.mobile?layout.inset+layout.stage+(height-layout.inset-layout.stage)*.25:height*.52;
    const positions=Array.from({length:301},(_,i)=>start+(end-start)*i/300);
    const down=positions.map(scroll=>storyPosition(centers,scroll,line,height,start,end));
    assert.deepEqual(down,positions.toReversed().map(scroll=>storyPosition(centers,scroll,line,height,start,end)).reverse());
    for(const act of [0,1,2]) {
      const hold=down.filter(position=>Math.abs(position-act)<1e-9).length*(end-start)/300;
      assert.ok(hold>=Math.min(height*.20,(end-start)*.16),`Act ${act} at ${width} needs a readable hold inside pin, got ${hold}`);
      assert.equal(storyFramePose(act,act,layout.mobile).opacity,1);
    }
    assert.ok(down.some(position=>position>0 && position<1));
    assert.ok(down.some(position=>position>1 && position<2));
    for(const position of down) {
      const alpha=[0,1,2].reduce((sum,i)=>sum+storyFramePose(i,position,layout.mobile).opacity,0);
      assert.ok(Math.abs(alpha-1)<1e-9,'No empty or doubled decorative composition during handover');
    }
  }
  assert.equal(storyLayout(844,390,65).viable,false);
  assert.equal(storyLayout(390,599,65).viable,false);
  assert.ok(storyLayout(390,844,65).stage<=(844-65)*.3);
});
test('The work marker describes a real row, and an expanded project owns its entire body',()=>{
  const row=[{top:-800,bottom:-300},{top:-250,bottom:200},{top:-249,bottom:300},{top:400,bottom:1200}];
  assert.deepEqual(Array.from(workStoryRow(row,100).indices),[1,2]);
  assert.ok(Math.abs(workStoryRow(row,100).progress-350/550)<1e-9);
  const open=[{top:-1500,bottom:-1100},{top:-1000,bottom:500},{top:550,bottom:1000}];
  assert.deepEqual(Array.from(workStoryRow(open,100).indices),[1]);
  assert.deepEqual(Array.from(workStoryRow(open,600).indices),[2]);
});
function storyLifecycle({height=844,reducedInitially=false}={}) {
  const classes=()=>{const values=new Set();return {contains:n=>values.has(n),add:(...names)=>names.forEach(n=>values.add(n)),remove:(...names)=>names.forEach(n=>values.delete(n)),toggle:(n,yes)=>yes?values.add(n):values.delete(n)}};
  const node=(tag='DIV',attrs={})=>({tagName:tag,dataset:{},children:[],classList:classes(),style:{setProperty(k,v){this[k]=v;}},
    get attributes(){return Object.entries(attrs).map(([name,value])=>({name,value}));},removeAttribute:n=>delete attrs[n],
    querySelector:()=>null,querySelectorAll:()=>[],append(...children){this.children.push(...children);},cloneNode:()=>node(tag,{...attrs})});
  const stage=node(),rail=node(),marker=node(),root=node();
  const steps=['Web','Automatización','IA aplicada'].map((label,index)=>({dataset:{storyStep:String(index)},querySelector:()=>({textContent:label})}));
  rail.querySelector=()=>stage;rail.querySelectorAll=()=>steps;
  const sources=[node('IMG',{id:'unsafe',style:'transform:rotate(90deg)','data-parallax-layer':'media',width:'2400',height:'1652'}),node('IMG'),node('SPAN')];
  const sourceSelectors=['#strev .journey-media','#sereno .journey-media','#social-scout .social-editorial-paper'];
  const document={querySelector:selector=>selector==='.story-rail'?rail:selector==='.work-story-marker'?marker:selector==='.index-bar'?{getBoundingClientRect:()=>({height:65})}:sources[sourceSelectors.indexOf(selector)],querySelectorAll:()=>[node()],createElement:tag=>node(tag.toUpperCase())};
  const window={innerWidth:390,innerHeight:height},reduced={matches:reducedInitially};
  const setup=journey.slice(journey.indexOf('  const rail ='),journey.indexOf('  const add ='));
  const api=vm.runInNewContext(`${geometry};${setup};({mountStory,sizeStory,quietStory})`,{document,window,reduced,root});
  return {stage,rail,root,reduced,window,...api};
}
test('Story enhancement is idempotent and keeps layout on modality changes but compacts on short resize',()=>{
  const host=storyLifecycle();assert.equal(host.stage.children.length,4);
  const height=host.rail.style['--story-step-height'];
  const copy=host.stage.children[0].children[0];
  assert.ok(!copy.attributes.some(a=>['id','style','data-parallax-layer'].includes(a.name)));
  assert.ok(copy.attributes.some(a=>a.name==='width'),'Intrinsic dimensions survive cloning');
  assert.equal(copy.alt,'');assert.equal(copy.className,'story-capture');
  host.quietStory(true);assert.equal(host.rail.style['--story-step-height'],height);
  assert.equal(host.rail.classList.contains('story-enhanced'),true);
  assert.equal(host.rail.classList.contains('story-neutral'),true);
  host.window.innerHeight=390;host.sizeStory();assert.equal(host.rail.classList.contains('story-enhanced'),false);
  host.window.innerHeight=844;host.mountStory();host.sizeStory();
  assert.equal(host.rail.classList.contains('story-enhanced'),true);assert.equal(host.stage.children.length,4);
  const reducedHost=storyLifecycle({reducedInitially:true});assert.equal(reducedHost.stage.children.length,0);
  reducedHost.reduced.matches=false;reducedHost.mountStory();reducedHost.sizeStory();assert.equal(reducedHost.stage.children.length,4);
  const landscape=storyLifecycle({height:390});assert.equal(landscape.stage.children.length,0);
  landscape.window.innerHeight=844;landscape.mountStory();landscape.sizeStory();assert.equal(landscape.stage.children.length,4);
});
test('Mount precedes initial hash alignment while the intro owner and character script order are preserved',()=>{
  const entry=html.indexOf('window.portfolioEntry ='),scene=html.indexOf('src="recorrido-personal.js'),appIndex=html.indexOf('src="app.js');
  assert.ok(entry>=0 && entry<scene && scene<appIndex);
  assert.ok(appIndex<html.indexOf('src="character-rig.js') && html.indexOf('src="character-rig.js')<html.indexOf('src="portrait-motion.js'));
  assert.match(html,/<div class="story-stage" aria-hidden="true"><\/div>/,'No-JS keeps the original list without a decorative layout box');
  assert.equal((html.match(/data-story-step=/g)||[]).length,3);
  assert.match(css,/#trabajo \.project\{scroll-margin-top:50px\}/,'Compensation selector must outrank the existing ID-based reset');
});
