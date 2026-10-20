import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
const app = await readFile(new URL('../public/experimental/app.js',import.meta.url),'utf8');
const journey = await readFile(new URL('../public/experimental/recorrido-personal.js',import.meta.url),'utf8');
const html = await readFile(new URL('../public/experimental/index.html',import.meta.url),'utf8');
const css = await readFile(new URL('../public/experimental/recorrido-personal.css',import.meta.url),'utf8');
const geometry = journey.slice(journey.indexOf('  const clamp ='),journey.indexOf('  // End pure geometry.'));
const {arrival,depthProgress,depthPose,amplitude,sceneArrival,journeyPose,heightWeight} = vm.runInNewContext(`${geometry};({arrival,depthProgress,depthPose,amplitude,sceneArrival,journeyPose,heightWeight})`);
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
test('The personal route cannot clone hidden archive media or run legacy competing scenes',()=>{
  for(const fn of ['updateScenes','settleScenes','measureMorph','measureHeadingInk']) {
    assert.ok(app.includes(`function ${fn}() {\n  if (personalWorld) return;`));
  }
  assert.doesNotMatch(app,/function initArchive\(/);
  assert.equal((html.match(/class="journey-accent"/g)||[]).length,3);
  assert.doesNotMatch(journey,/setTimeout|setInterval|\.animate\(/,'The journey has no timed replay or perpetual animation');
});


test('Depth keeps moving through the reading band, forward and backward, on all device sizes',()=>{
  for(const [width,height] of [[390,844],[820,1180],[1440,900]]) {
    const points=[.9,.62,.4,.15,-.1].map(fraction=>depthProgress(height*fraction,300,height));
    const down=points.map(p=>depthPose('sketch',p,width));
    const up=points.toReversed().map(p=>depthPose('sketch',p,width)).reverse();
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
  for(const kind of ['hero-portrait','hero-paper','hero-doodle','sketch','talk','paper']) {
    const expected=depthPose(kind,.37,820);
    for(let frame=0;frame<120;frame++) assert.equal(depthPose(kind,.37,820),expected);
    assert.equal(depthPose(kind,0,820,true),depthPose(kind,1,820,true));
  }
  assert.equal(depthPose('hero-portrait',1,1440),'translate3d(0,-112px,0)');
  assert.equal(depthPose('hero-paper',1,1440),'translate3d(0,48px,0) rotate(-2deg)');
});
function journeyHarness(kind = 'sketch') {
  const events=new Map(),frames=new Map(),style={};
  let nextFrame=0,focused=true,insideFocus=false,top=1700;
  const keyboard=new Set();
  const media={matches:false,addEventListener:(name,fn)=>events.set('media:'+name,fn)};
  const on=(name,fn)=>events.set(name,[...(Array.isArray(events.get(name))?events.get(name):[]),fn]);
  const wrapper={getBoundingClientRect:()=>({top:top-window.scrollY,width:500,height:100}),closest:selector=>selector==='#contacto'?null:({contains:()=>insideFocus}),
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
  assert.equal(host.style.transform,depthPose('sketch',depthProgress(600,100,900),1440));
  assert.notEqual(host.style.transform,depthPose('sketch',1,1440,true));
});
test('Reduced motion settles immediately; resuming and resizing recompute the same geometric position',()=>{
  const host=journeyHarness();host.window.scrollY=900;host.flush();
  host.media.matches=true;host.emit('media:change');
  assert.equal(host.style.transform,depthPose('sketch',0,1440,true));
  host.media.matches=false;host.emit('media:change');host.flush();
  assert.equal(host.style.transform,journeyPose('sketch',depthProgress(800,100,900),1440,false,sceneArrival(800,900,900,1100),900));
  host.window.innerWidth=390;host.emit('resize');host.flush();
  assert.equal(host.style.transform,journeyPose('sketch',depthProgress(800,100,900),390,false,sceneArrival(800,900,900,1100),900));
});


test('Pointer focus inside a decorative scene preserves depth while keyboard focus remains neutral',()=>{
  const host=journeyHarness();host.window.scrollY=1000;host.flush();
  const pose=host.style.transform;
  host.setInsideFocus(true);host.document.activeElement={};host.emit('focusin');host.flush();
  assert.equal(host.style.transform,pose,'Focusing a scene with a pointer cannot snap its art to neutral');
  host.keyboard.add('keyboard');host.emit('focusin');host.flush();
  assert.equal(host.style.transform,depthPose('sketch',0,1440,true));
  host.keyboard.delete('keyboard');host.emit('pointerdown');host.flush();
  assert.equal(host.style.transform,pose,'Returning to pointer modality restores the geometric pose');
});


test('Headings finish before reading while decorative depth remains reversible',()=>{
  for(const [width,height] of [[320,568],[390,844],[651,900],[759,900],[760,900],[820,1180],[844,390],[1440,1000]]) {
    const docTop=2000, travel=6000;
    for(const order of [0,1]) {
      const start=.96-.035*order;
      assert.equal(sceneArrival(start*height,height,docTop-start*height,travel,start,.64),0);
      assert.equal(sceneArrival(.64*height,height,docTop-.64*height,travel,start,.64),1);
    }
    const topValues=[.98,.9,.8,.7,.6,.4,.1].map(v=>v*height);
    const samples=topValues.map(top=>journeyPose('sketch',depthProgress(top,500,height),width,false,sceneArrival(top,height,docTop-top,travel),height));
    assert.notEqual(samples[4],samples[5],'Decorative depth continues through the reading band');
    const reverse=topValues.toReversed().map(top=>journeyPose('sketch',depthProgress(top,500,height),width,false,sceneArrival(top,height,docTop-top,travel),height)).reverse();
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
  assert.notEqual(depthPose('sketch',depthProgress(600,100,height),1440),depthPose('sketch',0,1440,true));
});
test('New gestures are viewport-safe and neutral for keyboard/reduced motion, including landscape',()=>{
  assert.equal(heightWeight(390),.3);
  assert.equal(heightWeight(1000),1);
  for(const width of [320,390,650,651,759,760,820,1024,1440]) {
    for(const kind of ['heading','sketch','hero-portrait']) {
      assert.equal(journeyPose(kind,0,width,true,0,390),journeyPose(kind,1,width,true,1,1180));
    }

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


test('The intro owner and character script order are preserved',()=>{
  const entry=html.indexOf('window.portfolioEntry ='),scene=html.indexOf('src="recorrido-personal.js'),appIndex=html.indexOf('src="app.js');
  assert.ok(entry>=0 && entry<scene && scene<appIndex);
  assert.ok(appIndex<html.indexOf('src="character-rig.js') && html.indexOf('src="character-rig.js')<html.indexOf('src="portrait-motion.js'));
});

const document = new JSDOM(html).window.document;
const about = document.querySelector('section#sobre-mi');
const work = document.querySelector('section#trabajo');
const text = node => {
  const copy=node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach(child=>child.remove());
  return copy.textContent.replace(/\s+/g,' ').trim();
};
const visibleWithoutInteraction = node => {
  assert.ok(node,'Required content exists in the parsed HTML');
  assert.equal(node.closest('details,[hidden],[aria-hidden="true"]'),null,'Content is visible without opening a disclosure or running JavaScript');
};

test('AC1: retired story, project disclosures and their controllers are absent',()=>{
  assert.equal(document.querySelector('.story-rail,.story-stage,[data-story-step],ol.about-milestones,.work-story-marker,nav.case-index,details.project'),null);
  new vm.Script(journey,{filename:'recorrido-personal.js'});
  new vm.Script(app,{filename:'app.js'});
  assert.doesNotMatch(journey,/\b(?:storyLayout|storyPosition|storyFramePose|workStoryRow|mountStory|sizeStory|readStory|drawStory)\b/);
  assert.doesNotMatch(app,/\bopenHashProject\b|\.case-next\b|nav\.case-index\b/);
});

test('AC2: About contains the literal bio, four facts, three methods and four visible history entries',()=>{
  assert.ok(about.querySelector('h2#about-title'));
  assert.deepEqual([...about.querySelectorAll('.about-relato > p')].map(text),[
    'Soy Alex Micó, desarrollador full stack de Villena. Me formé en sistemas y redes y en desarrollo web. Hoy compagino mi trabajo con productos propios y herramientas para desarrollo con IA.',
    'Trabajo de extremo a extremo: interfaz, API, automatización, despliegue y diagnóstico de incidencias. Antes de cerrar una entrega, pruebo los flujos frágiles y compruebo el resultado en el entorno real.',
  ]);
  const facts=about.querySelector('dl.about-facts');
  assert.ok(facts);
  assert.deepEqual([...facts.querySelectorAll('dt')].map(text),['Dónde','Disponible','Stack','Idiomas']);
  assert.deepEqual([...facts.querySelectorAll('dd')].map(text),[
    'Villena, Alicante. Trabajo en remoto.',
    'Abierto a puestos Full Stack en España y la UE',
    'React, Node, Express, MongoDB, Python y testing',
    'Castellano y valenciano nativos; inglés técnico en lectura, conversación básica',
  ]);
  const methods=[...about.querySelectorAll('.about-method-grid > article')];
  assert.equal(methods.length,3);
  assert.deepEqual(methods.map(node=>text(node.querySelector('h4'))),['Producto web','Herramientas','Automatización con IA']);
  assert.deepEqual(methods.map(node=>text(node.querySelector('p'))),[
    'Interfaz en React y API en Node. En Strev, el análisis de vídeo va en una cola y los datos de salud se cifran campo a campo.',
    'Sereno es un solo archivo de Python, sin dependencias, que sigue desde un panel las sesiones de cinco CLI de agentes.',
    'Atalaya reúne ofertas de varios portales de empleo y puntúa cada una según un perfil.',
  ]);
  assert.deepEqual(methods.map(node=>node.querySelector('a').getAttribute('href')),['/proyectos/strev/','/proyectos/sereno/','/proyectos/atalaya/']);
  assert.deepEqual(methods.map(node=>text(node.querySelector('a'))),['Caso Strev','Caso Sereno','Caso Atalaya']);
  const history=[...about.querySelectorAll('.history-list > article')];
  assert.equal(history.length,4);
  assert.ok([...about.querySelectorAll('h3')].some(node=>text(node)==='Mi recorrido'));
  assert.deepEqual(history.map(node=>[text(node.querySelector('.history-date')),text(node.querySelector('h4')),text(node.querySelector('p'))].join(' ')),[
    '2026 — Hoy Desarrollador Full Stack Anuubis Solutions · Remoto',
    '2024 · Prácticas Técnico de Soporte IT Impulso Sistemas · Villena',
    '2024 — 2026 Desarrollo de Aplicaciones Web Grado Superior · IES Hermanos Amorós',
    '2022 — 2024 Sistemas Microinformáticos y Redes Ciclo Medio · IES Hermanos Amorós',
  ]);
  [...methods,...history,facts,...about.querySelectorAll('.about-relato > p')].forEach(visibleWithoutInteraction);
  assert.equal(about.querySelector('details'),null);
});

test('AC3: Work orders one featured project, three case articles and the four compact entries',()=>{
  assert.ok(work.querySelector('h2#work-title'));
  assert.deepEqual([...work.querySelectorAll('article[id]')].map(node=>node.id),['strev','sereno','savemymoneynow','atalaya']);
  assert.ok(work.querySelector('article.work-featured#strev'));
  assert.deepEqual([...work.querySelectorAll('.work-cases > article')].map(node=>node.id),['sereno','savemymoneynow','atalaya']);
  const more=work.querySelector('ul.work-more-list');
  assert.ok(more);
  assert.deepEqual([...more.children].map(node=>[node.tagName,node.id]),[
    ['LI','marky'],['LI','smarty'],['LI','roguepatch-lab'],['LI','social-scout'],
  ]);
  assert.equal(more.querySelector('img'),null);
  [...work.querySelectorAll('article[id]'),...more.children].forEach(node=>{
    assert.ok(node.querySelector('h3'));
    visibleWithoutInteraction(node);
  });
  assert.equal(document.querySelectorAll('h1').length,1);
  assert.ok(document.querySelector('#inicio h1'));
});

test('AC4: Each case article exposes its role, exact stack, result and unique accessible case link',()=>{
  const projects=[
    ['strev','Strev','React · Node · Express · MongoDB · Redis · Stripe · Gemini'],
    ['sereno','Sereno','Python · curses · tmux'],
    ['savemymoneynow','SaveMyMoneyNow','React · Node · Express · MongoDB'],
    ['atalaya','Atalaya','Python · Typer · SQLite'],
  ];
  const names=[];
  for (const [slug,name,stack] of projects) {
    const article=work.querySelector(`article#${slug}`),facts=article.querySelector('dl');
    visibleWithoutInteraction(facts);
    assert.deepEqual([...facts.querySelectorAll('dt')].map(text),['Rol','Stack','Resultado']);
    const descriptions=[...facts.querySelectorAll('dd')];
    assert.equal(descriptions.length,3);
    assert.equal(text(descriptions[0]),slug==='strev'?'Proyecto propio. Lo diseño, lo desarrollo y opero la beta.':'Proyecto propio, código abierto.');
    assert.equal(text(descriptions[1]),stack);
    assert.ok(text(descriptions[2]).length>0);
    const links=article.querySelectorAll(`a[href="/proyectos/${slug}/"]`);
    assert.equal(links.length,1);
    const link=links[0];
    assert.equal(link.getAttribute('aria-label'),`Leer el caso de ${name}`);
    assert.equal(text(link),'Leer el caso');
    visibleWithoutInteraction(link);
    names.push(link.getAttribute('aria-label'));
  }
  assert.equal(new Set(names).size,4);
  assert.ok(work.querySelector('#strev a[href="https://strev.app"]'));
  for (const [slug,url] of [
    ['sereno','https://github.com/ElRaxy/sereno'],
    ['savemymoneynow','https://github.com/ElRaxy/SaveMyMoneyNow'],
    ['atalaya','https://github.com/ElRaxy/atalaya-cli'],
    ['roguepatch-lab','https://github.com/ElRaxy/roguepatch-lab'],
  ]) assert.ok(work.querySelector(`#${slug} a[href="${url}"]`));
});

test('AC5: The ten metrics measured on 2026-10-20 use named spans and Spanish number formatting',()=>{
  const expected={
    'strev-endpoints':'121','strev-tests-api':'1.398','strev-tests-ui':'2.793',
    'sereno-prs':'101','sereno-tests':'81','smmn-endpoints':'21','smmn-tests':'113',
    'atalaya-comandos':'13','atalaya-tests':'174','roguepatch-tests':'366',
  };
  const metrics=[...document.querySelectorAll('[data-metric]')];
  assert.deepEqual([...new Set(metrics.map(node=>node.dataset.metric))].sort(),Object.keys(expected).sort());
  assert.equal(metrics.length,10,'Each metric appears once');
  for (const node of metrics) {
    assert.equal(node.tagName,'SPAN');
    assert.equal(text(node),expected[node.dataset.metric]);
    visibleWithoutInteraction(node);
  }
  for (const slug of ['strev','sereno','savemymoneynow','atalaya']) {
    const result=[...work.querySelectorAll(`#${slug} dl dd`)].at(-1).cloneNode(true);
    result.querySelectorAll('[data-metric]').forEach(node=>node.remove());
    assert.doesNotMatch(text(result),/[1-9]\d*/,'Every provisional result count is marked, except the literal zero dependencies');
  }
  assert.doesNotMatch(about.textContent+work.textContent,/\{N_[A-Z_]+\}/);
});

test('AC6: Sereno demo keeps its exact markup and connected controls inside a closed Work disclosure',()=>{
  const demo=work.querySelector('section.sereno-demo');
  assert.ok(demo);
  assert.equal(about.querySelector('.sereno-demo'),null);
  const disclosure=demo.closest('details');
  assert.ok(disclosure && work.contains(disclosure));
  assert.equal(disclosure.hasAttribute('open'),false);
  assert.equal(text(disclosure.querySelector('summary')),'Probar la demo de Sereno');
  assert.equal(createHash('sha256').update(demo.outerHTML).digest('hex'),'eed5376e44dcf86ff5cd4db3c4c2c68c9349e8562f5c1ab9f0a41295fff8a7c5','The existing demo subtree must survive relocation byte-for-byte after HTML parsing');
  assert.equal(demo.getAttribute('aria-labelledby'),'sereno-demo-title');
  assert.ok(demo.querySelector('#sereno-demo-title'));
  for (const state of ['working','waiting','unknown']) {
    const control=demo.querySelector(`#sereno-demo-${state}`);
    assert.ok(control);
    assert.equal(control.type,'radio');
    assert.equal(control.name,'sereno-demo-state');
    assert.equal(control.getAttribute('aria-controls'),`sereno-demo-panel-${state}`);
    assert.ok(demo.querySelector(`#${control.getAttribute('aria-controls')}`));
    assert.equal(control.checked,state==='waiting');
  }
});

test('AC7: New project images retain their complete intrinsic dimensions and approved alternatives',()=>{
  for (const [slug,src,width,height,alt] of [
    ['savemymoneynow','assets/savemymoneynow-detection.png','914','911','SaveMyMoneyNow localizando la fila de cabecera de un extracto bancario'],
    ['atalaya','assets/atalaya-health.svg','1200','675','Resumen de salud de las fuentes de empleo de Atalaya'],
  ]) {
    const image=work.querySelector(`article#${slug} img`);
    assert.ok(image);
    assert.equal(image.getAttribute('src'),src);
    assert.equal(image.getAttribute('width'),width);
    assert.equal(image.getAttribute('height'),height);
    assert.equal(image.getAttribute('alt'),alt);
  }
});

test('Group labels in About and Work never sit at the same heading level as their children',()=>{
  for(const [group,label] of [['.about-methods','Cómo trabajo'],['.about-history','Mi recorrido']]){
    const node=about.querySelector(group);
    assert.equal(text(node.querySelector(':scope > h3')),label);
    assert.equal(node.querySelectorAll('article h3').length,0);
    assert.ok(node.querySelectorAll('article h4').length>=3);
  }
  assert.deepEqual([...work.querySelectorAll('.work-level')].map(node=>node.tagName),['P','P','P']);
  assert.equal(work.querySelector('ul.work-more-list').getAttribute('aria-labelledby'),'work-more-title');
  assert.equal(text(work.querySelector('#work-more-title')),'Más trabajo');
  assert.equal(document.querySelectorAll('#sobre-mi h3 > a[href^="#"], #trabajo h3 > a[href^="#"]').length,0);
});

test('Every labelled link in About and Work starts its accessible name with its visible text',()=>{
  const links=[...document.querySelectorAll('#sobre-mi a[aria-label], #trabajo a[aria-label]')];
  assert.ok(links.length>=8);
  for(const link of links){
    const visible=text(link);
    assert.ok(link.getAttribute('aria-label').startsWith(visible),`${link.getAttribute('aria-label')} / ${visible}`);
  }
});
