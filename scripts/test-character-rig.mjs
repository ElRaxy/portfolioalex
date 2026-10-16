import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const builderSource = await readFile(new URL('../public/experimental/character-rig.js', import.meta.url), 'utf8');
const controllerSource = await readFile(new URL('../public/experimental/portrait-motion.js', import.meta.url), 'utf8');
const flush = async () => { for(let count=0;count<8;count++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes,no)=>{resolve=yes;reject=no;}); return {promise,resolve,reject}; };
function events(target = {}) {
  const listeners = new Map();
  return Object.assign(target, {listeners,addEventListener:(name,callback)=>listeners.set(name,[...(listeners.get(name)||[]),callback]),emit:(name,event={})=>(listeners.get(name)||[]).forEach(callback=>callback(event))});
}
const classes = () => { const values=new Set(); return {add:name=>values.add(name),remove:name=>values.delete(name),contains:name=>values.has(name),values}; };

function mountHarness() {
  const raster = deferred();
  const nodes = Array.from({length:5},()=>events({attributes:{},setAttribute(name,value){this.attributes[name]=value;}}));
  const parts = Object.fromEntries(['head','hand','gaze'].map(name=>[`.character-${name}`,{style:{}}]));
  const eyes = [{},{}];
  const svg = {removed:false,querySelectorAll:selector=>selector==='image'?nodes:eyes,querySelector:selector=>parts[selector],remove(){this.removed=true;}};
  const host = {children:[],classList:classes(),append(node){this.children.push(node);}};
  const image = {currentSrc:'https://portfolio.example/experimental/assets/avatar.png',src:'https://portfolio.example/fallback.png',decode:()=>raster.promise};
  const context = {window:{},document:{createElement:()=>({set innerHTML(value){this.markup=value;},content:{firstElementChild:svg}})}};
  vm.runInNewContext(builderSource,context);
  return {api:context.window.PortfolioCharacterRig,raster,nodes,svg,host,image,parts};
}

test('Canonical SVG separates only head and hand, with eyes inside the same moving head',()=>{
  const {api}=mountHarness();
  const svg=api.markup('canonical');
  assert.equal(api.SIZE,1254);
  assert.match(svg,/viewBox="0 0 1254 1254"/);
  assert.equal((svg.match(/data-character-layer=/g)||[]).length,5);
  const head=svg.indexOf('<g class="character-head"'),gaze=svg.indexOf('<g class="character-gaze"'),collar=svg.indexOf('data-character-layer="collar"');
  assert.ok(head<gaze&&gaze<collar,'Eyes must be nested with the raster head before the stationary collar');
  assert.match(svg,/transform-origin:720px 484px/);
  assert.match(svg,/transform-origin:733px 754px/);
  assert.doesNotMatch(svg,/data-character-layer="forearm"/,'Sleeve/chair remain on the fixed base instead of dragging a raster patch');
  assert.doesNotMatch(svg,/data:image/,'Runtime SVG must reuse the existing image URL');
});

test('Every SVG layer and the original raster must be ready before the fallback is replaced',async()=>{
  const host=mountHarness();
  const first=host.api.mount(host.host,host.image);
  assert.equal(host.api.mount(host.host,host.image),first,'Mounting twice must reuse one readiness transaction');
  assert.equal(host.host.children.length,1);
  assert.ok(host.nodes.every(node=>node.attributes.href===host.image.currentSrc),'All layers resolve the same absolute currentSrc');
  host.raster.resolve();host.nodes.slice(0,4).forEach(node=>node.emit('load'));
  await flush();
  assert.equal(host.host.classList.contains('is-articulated'),false,'PNG decode alone cannot expose unloaded SVG layers');
  host.nodes[4].emit('load');
  const rig=await first;
  assert.equal(host.host.classList.contains('is-articulated'),true);
  assert.equal(rig.head,host.parts['.character-head']);
  assert.equal(rig.gaze,host.parts['.character-gaze']);
});

test('SVG errors and late cancellation leave the complete raster fallback intact',async()=>{
  const failed=mountHarness();const result=failed.api.mount(failed.host,failed.image);
  failed.raster.resolve();failed.nodes[0].emit('error');
  assert.equal(await result,null);
  assert.equal(failed.svg.removed,true);
  assert.equal(failed.host.classList.contains('is-articulated'),false);
  const late=mountHarness();let active=true;
  const pending=late.api.mount(late.host,late.image,{active:()=>active});
  active=false;late.raster.resolve();late.nodes.forEach(node=>node.emit('load'));
  assert.equal(await pending,null);
  assert.equal(late.host.classList.contains('is-articulated'),false);
  assert.equal(late.svg.removed,true);
});

function actingHarness({intro=false,rigError=false,story=false,imageFailure=false}={}) {
  const animations=[],timers=new Map(),observers=[];
  let nextTimer=1,now=0,focused=true;
  const makePart=label=>({style:{},getBoundingClientRect:()=>({width:100,height:100}),animate(frames,options){const completion=deferred();const motion={label,frames,options,finished:completion.promise,cancelled:false,cancel(){this.cancelled=true;completion.resolve();},finish:completion.resolve};animations.push(motion);return motion;}});
  const rig={head:makePart('head'),hand:makePart('hand'),gaze:makePart('gaze'),eyes:[makePart('eye-1'),makePart('eye-2')]};
  const image={decode:()=>imageFailure?Promise.reject(new Error('Image failed')):Promise.resolve(),getBoundingClientRect:()=>({left:0,top:0,width:280,height:280})};
  const host={classList:classes(),dataset:{},style:{},querySelector:()=>image};
  const hero=events({contains:target=>[hero,portrait,image].includes(target)});
  const portrait=events({querySelector:()=>host,closest:()=>hero});
  const storyHost={classList:classes(),style:{setProperty(name,value){this[name]=value;}},querySelector:()=>image};
  const media={reduce:events({matches:false}),fine:events({matches:true})};
  const root={classList:classes()};
  const document=events({hidden:false,documentElement:root,hasFocus:()=>focused,querySelector:selector=>selector==='.personal-portrait'?portrait:selector==='.story-character'&&story?storyHost:selector==='.intro-story'?{getAnimations:()=>[{animationName:'storyExit',currentTime:850}]}:null});
  class Observer{constructor(callback){this.callback=callback;observers.push(this);}observe(){}}
  const window=events({portfolioEntry:{active:intro},IntersectionObserver:Observer,PortfolioCharacterRig:{mount:()=>Promise.resolve(rigError?null:rig)}});
  const context={window,document,getComputedStyle:element=>({transform:element.computedTransform||element.style.transform||'none'}),location:{hash:''},performance:{now:()=>now},IntersectionObserver:Observer,matchMedia:query=>query.includes('reduced')?media.reduce:media.fine,setTimeout:(callback,delay)=>{const id=nextTimer++;timers.set(id,{callback,delay});return id;},clearTimeout:id=>timers.delete(id),Math:Object.assign(Object.create(Math),{random:()=>.5}),Promise};
  vm.runInNewContext(controllerSource,context);
  return {context,window,document,host,portrait,hero,image,rig,storyHost,media,timers,animations,root,
    visible:value=>observers[0].callback([{isIntersecting:value,intersectionRatio:value?1:0}]),
    focus:value=>{focused=value;},time:value=>{now=value;},
    fireTimer:predicate=>{const [id,timer]=[...timers.entries()].find(([,value])=>!predicate||predicate(value));timers.delete(id);timer.callback();}};
}

test('One controller waits through the shared intro, then schedules finite acting after a rest',async()=>{
  const host=actingHarness({intro:true});await flush();host.visible(true);
  assert.equal(host.window.portfolioCharacterController.ready,true);
  assert.equal(host.timers.size,0);
  assert.equal(host.window.portfolioCharacterController.act('type'),false);
  const before=[...host.document.listeners.values()].reduce((sum,list)=>sum+list.length,0);
  vm.runInNewContext(controllerSource,host.context);
  assert.equal([...host.document.listeners.values()].reduce((sum,list)=>sum+list.length,0),before,'Executing twice must not install a second gaze/blink controller');
  host.window.portfolioEntry.active=false;host.window.emit('portfolio:entryend');
  assert.equal(host.animations.length,0,'Ending or interrupting the intro must not immediately replay an acting gesture');
  assert.equal(host.timers.size,2,'Idle action and independent blink each own one coarse timer');
  host.fireTimer(timer=>timer.delay===6000);
  assert.equal(host.window.portfolioCharacterController.activity,'type');
  assert.deepEqual(host.animations.map(animation=>animation.label),['gaze','head','hand']);
  host.animations.forEach(animation=>animation.finish());await flush();
  assert.equal(host.window.portfolioCharacterController.activity,'rest');
  assert.equal(host.timers.size,2,'Completed acting returns to independent rest/blink timers, not a frame loop');
});

test('Head and gaze react together while body/chair remain untouched; blur and offscreen cancel all acting',async()=>{
  const host=actingHarness();await flush();host.visible(true);
  host.document.emit('pointermove',{pointerType:'mouse',pointerId:1,clientX:270,clientY:100,buttons:0,target:host.hero});
  assert.match(host.rig.head.style.transform,/rotate\(/);
  assert.match(host.rig.gaze.style.transform,/translate\(/);
  assert.equal(host.host.style.transform,undefined,'The body wrapper must never move with the pointer');
  assert.equal(host.timers.size,1,'Pointer tracking keeps independent blinking while suppressing idle body gestures');
  host.window.portfolioCharacterController.act('type');
  host.focus(false);host.window.emit('blur');await flush();
  assert.ok(host.animations.every(animation=>animation.cancelled));
  assert.equal(host.window.portfolioCharacterController.activeMotions,0);
  assert.equal(host.timers.size,0);
  assert.equal(host.rig.head.style.transform,'');
  assert.equal(host.rig.gaze.style.transform,'');
  host.focus(true);host.visible(true);host.window.portfolioCharacterController.act('glance');host.visible(false);await flush();
  assert.equal(host.window.portfolioCharacterController.activeMotions,0);
  assert.equal(host.timers.size,0);
});

test('Touch gestures never steal scroll and only a short stationary tap triggers acting',async()=>{
  const host=actingHarness();await flush();host.visible(true);
  const touch={pointerType:'touch',pointerId:7,isPrimary:true,clientX:100,clientY:100,preventDefault:()=>assert.fail('Touch must retain native scrolling')};
  host.portrait.emit('pointerdown',touch);host.document.emit('pointermove',{...touch,clientY:125});host.time(100);host.portrait.emit('pointerup',touch);
  assert.equal(host.animations.length,0);
  host.portrait.emit('pointerdown',touch);host.window.emit('scroll');host.portrait.emit('pointerup',touch);
  assert.equal(host.animations.length,0);
  host.portrait.emit('pointerdown',touch);host.time(200);host.portrait.emit('pointerup',touch);
  assert.equal(host.window.portfolioCharacterController.activity,'ack');
  host.portrait.emit('pointercancel');await flush();
  assert.equal(host.window.portfolioCharacterController.activeMotions,0);
});

test('Reduced motion and keyboard suppress acting; failed enhancement remains static',async()=>{
  const host=actingHarness();await flush();host.visible(true);
  host.media.reduce.matches=true;host.media.reduce.emit('change');
  assert.equal(host.window.portfolioCharacterController.act('type'),false);
  assert.equal(host.timers.size,0);
  host.media.reduce.matches=false;host.document.emit('keydown',{key:'Tab'});
  assert.equal(host.window.portfolioCharacterController.act('glance'),false);
  const failed=actingHarness({rigError:true});await flush();failed.visible(true);
  assert.equal(failed.window.portfolioCharacterController.ready,false);
  assert.equal(failed.timers.size,0);
  assert.equal(failed.window.portfolioCharacterController.act('type'),false);
});

test('A late intro enhancement seeks to the existing CSS playhead instead of starting another film',async()=>{
  const host=actingHarness({intro:true,story:true});await flush();
  assert.equal(host.storyHost.style['--character-story-delay'],'-850ms');
  assert.equal(host.storyHost.classList.contains('character-acting'),true);
  const cancelled=actingHarness({intro:true,story:true});cancelled.window.portfolioEntry.active=false;await flush();
  assert.equal(cancelled.storyHost.classList.contains('character-acting'),false);
  assert.equal(cancelled.storyHost.style['--character-story-delay'],undefined);
});


test('The no-JS fallback keeps complete SVG eyes; JS loading or failure hides only that fallback face',async()=>{
  const css=await readFile(new URL('../public/experimental/portada-personal.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/\.portrait-rig>\.portrait-face\s*\{[^}]*visibility:hidden/,'Without JS no loading class exists, so eyes must remain visible');
  assert.match(css,/\.portrait-rig\.is-image-loading>\.portrait-face,\.portrait-rig\.is-image-failed>\.portrait-face\{visibility:hidden\}/);
  const host=actingHarness({rigError:true,imageFailure:true});
  assert.equal(host.host.classList.contains('is-image-loading'),true);
  await flush();
  assert.equal(host.host.classList.contains('is-image-loading'),false);
  assert.equal(host.host.classList.contains('is-image-failed'),true);
  assert.equal(host.window.portfolioCharacterController.ready,false);
});

test('Only a normally completed intro schedules the short acknowledgement follow-through',async()=>{
  const host=actingHarness({intro:true});await flush();host.visible(true);
  host.window.portfolioEntry.active=false;host.window.portfolioEntry.completed=true;
  host.window.emit('portfolio:entryend');
  assert.equal([...host.timers.values()][0].delay,700);
  host.fireTimer();
  assert.equal(host.window.portfolioCharacterController.activity,'ack');
  assert.deepEqual(host.animations.map(animation=>animation.label),['gaze','head','eye-1','eye-2']);
  const cancelled=actingHarness({intro:true});await flush();cancelled.visible(true);
  cancelled.window.portfolioEntry.active=false;cancelled.window.emit('portfolio:entryend');
  assert.ok([...cancelled.timers.values()][0].delay>=4500,'Interrupted entries keep the ordinary rest instead of replaying a gesture');
});


test('A pointer retarget captures the current animated head pose before cancelling its action',async()=>{
  const host=actingHarness();await flush();host.visible(true);host.window.portfolioCharacterController.act('type');
  const writes=[];
  const headStyle={};Object.defineProperty(headStyle,'transform',{get:()=>writes.at(-1),set:value=>writes.push(value)});host.rig.head.style=headStyle;
  host.rig.head.computedTransform='matrix(0.9976,0.0698,-0.0698,0.9976,0,0)';
  host.rig.gaze.computedTransform='matrix(1,0,0,1,-10,16)';
  host.document.emit('pointermove',{pointerType:'mouse',pointerId:1,clientX:270,clientY:100,buttons:0,target:host.hero});
  assert.equal(writes[0],host.rig.head.computedTransform,'Interrupting a head gesture must preserve its current angle before retargeting');
  assert.match(writes.at(-1),/rotate\(/);
  assert.equal(host.window.portfolioCharacterController.activity,'pointer');
  assert.equal(host.host.classList.contains('character-paused'),false);
});


test('The character blinks while the mouse rests in the hero without neutralising its head or gaze',async()=>{
  const host=actingHarness();await flush();host.visible(true);
  host.document.emit('pointermove',{pointerType:'mouse',pointerId:1,clientX:270,clientY:100,buttons:0,target:host.hero});
  const head=host.rig.head.style.transform,gaze=host.rig.gaze.style.transform;
  assert.equal(host.window.portfolioCharacterController.pendingTimers.idle,false);
  assert.equal(host.window.portfolioCharacterController.pendingTimers.blink,true);
  host.fireTimer(timer=>timer.delay===5500);
  assert.equal(host.window.portfolioCharacterController.activity,'pointer');
  assert.equal(host.rig.head.style.transform,head);
  assert.equal(host.rig.gaze.style.transform,gaze);
  assert.deepEqual(host.animations.map(animation=>animation.label),['eye-1','eye-2']);
  const count=host.animations.length;
  host.window.portfolioCharacterController.act('blink');
  assert.equal(host.animations.length,count,'A second blink request must reuse the current eye action');
  host.animations.forEach(animation=>animation.finish());await flush();
  assert.equal(host.timers.size,1);
  assert.equal(host.window.portfolioCharacterController.pendingTimers.blink,true);
  assert.equal(host.window.portfolioCharacterController.activity,'pointer');
});

test('Hard pauses cancel both cadence timers and eye motions; late finishes cannot resurrect scheduling',async()=>{
  const host=actingHarness();await flush();host.visible(true);
  assert.equal(host.timers.size,2);
  host.window.portfolioCharacterController.act('ack');
  assert.ok(host.animations.some(animation=>animation.label==='eye-1'));
  host.focus(false);host.window.emit('blur');
  assert.equal(host.timers.size,0);
  assert.equal(host.window.portfolioCharacterController.activeMotions,0);
  await flush();
  assert.equal(host.timers.size,0,'Cancelled animation promises must not restart either cadence timer');
  assert.ok(host.animations.every(animation=>animation.cancelled));
  assert.equal(host.rig.head.style.transform,'');
  assert.equal(host.rig.gaze.style.transform,'');
  host.focus(true);host.window.emit('focus');
  assert.equal(host.timers.size,2,'Focus resumes one controlled timer for each cadence');
  host.document.hidden=true;host.document.emit('visibilitychange');await flush();
  assert.equal(host.timers.size,0);
});

test('Pointer departure settles softly and reentry seeks its current pose instead of snapping to neutral',async()=>{
  const host=actingHarness();await flush();host.visible(true);
  host.document.emit('pointermove',{pointerType:'mouse',pointerId:1,clientX:270,clientY:100,buttons:0,target:host.hero});
  host.rig.head.computedTransform='matrix(0.9986,0.0523,-0.0523,0.9986,0,0)';
  host.rig.gaze.computedTransform='matrix(1,0,0,1,18,4)';
  host.hero.emit('pointerleave',{pointerType:'mouse',pointerId:1});
  assert.equal(host.window.portfolioCharacterController.activity,'settle');
  const headReturn=host.animations.find(animation=>animation.label==='head');
  const eyeReturn=host.animations.find(animation=>animation.label==='gaze');
  assert.equal(headReturn.options.duration,300);
  assert.equal(eyeReturn.options.duration,150);
  assert.equal(headReturn.frames[0].transform,host.rig.head.computedTransform);
  assert.equal(eyeReturn.frames[0].transform,host.rig.gaze.computedTransform);
  host.rig.head.computedTransform='matrix(0.9998,0.0175,-0.0175,0.9998,0,0)';
  const writes=[];const style={};Object.defineProperty(style,'transform',{get:()=>writes.at(-1),set:value=>writes.push(value)});host.rig.head.style=style;
  host.document.emit('pointermove',{pointerType:'mouse',pointerId:1,clientX:10,clientY:60,buttons:0,target:host.hero});
  assert.equal(writes[0],host.rig.head.computedTransform);
  assert.equal(headReturn.cancelled,true);
  assert.equal(eyeReturn.cancelled,true);
  await flush();
  assert.equal(host.window.portfolioCharacterController.activity,'pointer');
  assert.equal(host.window.portfolioCharacterController.pendingTimers.idle,false,'A late return completion cannot schedule a gesture over active pointer tracking');
  host.focus(false);host.window.emit('blur');
  assert.equal(writes.at(-1),'','Hard blur still restores a stable neutral pose immediately');
});

test('Typing uses uneven finger beats and the eyes lead the head rather than moving as a robot',async()=>{
  const host=actingHarness();await flush();host.visible(true);host.window.portfolioCharacterController.act('type');
  const hand=host.animations.find(animation=>animation.label==='hand');
  const differences=hand.frames.slice(1).map((frame,index)=>Number((frame.offset-hand.frames[index].offset).toFixed(2)));
  assert.ok(new Set(differences).size>3,'Finger beats include short clusters and a longer pause');
  const eyes=host.animations.find(animation=>animation.label==='gaze'),head=host.animations.find(animation=>animation.label==='head');
  assert.ok(eyes.frames[1].offset<head.frames[2].offset);
  assert.equal(head.frames[1].transform,'rotate(0deg)','Head anticipation starts after eye motion');
  assert.equal(hand.frames.at(-1).transform,'rotate(0deg)');
});

test('Touch leave after a completed tap preserves acknowledgement, but leave before release cancels the tap',async()=>{
  const host=actingHarness();await flush();host.visible(true);
  const touch={pointerType:'touch',pointerId:7,isPrimary:true,clientX:100,clientY:100};
  host.portrait.emit('pointerdown',touch);host.time(100);host.portrait.emit('pointerup',touch);
  assert.equal(host.window.portfolioCharacterController.activity,'ack');
  const count=host.window.portfolioCharacterController.activeMotions;
  host.hero.emit('pointerleave',touch);host.portrait.emit('pointerleave',touch);
  assert.equal(host.window.portfolioCharacterController.activity,'ack');
  assert.equal(host.window.portfolioCharacterController.activeMotions,count);
  host.portrait.emit('pointercancel');
  host.portrait.emit('pointerdown',touch);host.portrait.emit('pointerleave',touch);host.time(200);host.portrait.emit('pointerup',touch);
  assert.equal(host.window.portfolioCharacterController.activity,'rest');
  assert.equal(host.window.portfolioCharacterController.activeMotions,0);
});


test('Explicit acting beats use a linear effect clock and curve each interval so their offsets stay real',async()=>{
  const curves={head:'cubic-bezier(.32,.72,0,1)',gaze:'cubic-bezier(.23,1,.32,1)',hand:'cubic-bezier(.23,1,.32,1)'};
  for(const kind of ['type','glance','ack']) {
    const host=actingHarness();await flush();host.visible(true);host.window.portfolioCharacterController.act(kind);
    const acting=host.animations.filter(motion=>['head','gaze','hand'].includes(motion.label));
    assert.ok(acting.length>=2);
    for(const motion of acting) {
      assert.equal(motion.options.easing,'linear','The effect clock must not compress late finger or gaze beats');
      assert.ok(motion.frames.every(frame=>frame.easing===curves[motion.label]),'Every beat interval retains its explicit approved curve');
      assert.ok(motion.frames.every(frame=>Number.isFinite(frame.offset)));
    }
    if(kind==='type') {
      const hand=acting.find(motion=>motion.label==='hand');
      assert.ok(Math.abs(hand.frames.at(-2).offset*hand.options.duration-782.1)<1e-9,'The last finger release now occurs at its real 79% time');
      const gaze=acting.find(motion=>motion.label==='gaze'),head=acting.find(motion=>motion.label==='head');
      assert.ok(Math.abs(gaze.frames[1].offset*gaze.options.duration-86.4)<1e-9);
      assert.equal(head.frames[2].offset*head.options.duration,324);
    }
  }
});


test('Blink keeps its real 200 ms beat clock and the acknowledgement delay instead of compressing closed frames',async()=>{
  for(const kind of ['blink','ack']) {
    const host=actingHarness();await flush();host.visible(true);host.window.portfolioCharacterController.act(kind);
    const eyes=host.animations.filter(motion=>motion.label.startsWith('eye-'));
    assert.equal(eyes.length,2);
    for(const motion of eyes) {
      assert.equal(motion.options.duration,200);
      assert.equal(motion.options.easing,'linear');
      assert.equal(motion.options.delay,kind==='ack'?120:0);
      assert.deepEqual(Array.from(motion.frames,frame=>frame.offset),[0,.32,.46,1]);
      assert.ok(motion.frames.every(frame=>frame.easing==='cubic-bezier(.23,1,.32,1)'));
      assert.equal(motion.frames[1].transform,'scaleY(.1)');
      assert.equal(motion.frames[2].transform,'scaleY(.1)');
    }
  }
});
