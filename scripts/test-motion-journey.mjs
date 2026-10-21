import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
const app = await readFile(new URL('../public/experimental/app.js',import.meta.url),'utf8');
const movement = await readFile(new URL('../public/experimental/movimiento.js',import.meta.url),'utf8');
const html = await readFile(new URL('../public/experimental/index.html',import.meta.url),'utf8');
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
  new vm.Script(movement,{filename:'movimiento.js'});
  new vm.Script(app,{filename:'app.js'});
  assert.doesNotMatch(movement,/\b(?:storyLayout|storyPosition|storyFramePose|workStoryRow|mountStory|sizeStory|readStory|drawStory)\b/);
  assert.doesNotMatch(app,/\bopenHashProject\b|\.case-next\b|nav\.case-index\b/);
});

test('AC2: About contains the literal bio, four facts, three methods and four visible history entries',()=>{
  assert.ok(about.querySelector('h2#about-title'));
  assert.deepEqual([...about.querySelectorAll('.about-relato > p')].map(text),[
    'Uso Claude Code y Codex a diario, reparto tareas, reviso lo que sale y lo pruebo. Para ver qué hace cada sesión de agente hice Sereno, un panel de terminal en un solo fichero de Python y sin dependencias, donde bajé una orden de 33 segundos a 0,3. También he creado Flota, un plugin para Claude Code CLI que lleva ese seguimiento a la propia terminal, con una banda de ejecuciones Codex y avisos de sesiones que esperan respuesta (sin dependencias npm).',
    'Soy desarrollador full stack de Alicante, trabajo presencialmente en Anuubis Solutions y me gusta todo el recorrido, desde el backend hasta la interfaz, el diseño y el producto. Con Strev, mi app para entrenadores personales en beta abierta, ahora he aparcado la landing para arreglar primero el interior.',
  ]);
  const facts=about.querySelector('dl.about-facts');
  assert.ok(facts);
  assert.deepEqual([...facts.querySelectorAll('dt')].map(text),['Dónde','Disponible','Stack','Idiomas']);
  assert.deepEqual([...facts.querySelectorAll('dd')].map(text),[
    'Alicante.',
    'Abierto a puestos Full Stack en España y la UE',
    'React, Node, Express, MongoDB, Python y testing',
    'Castellano y valenciano nativos; inglés técnico en lectura, conversación básica',
  ]);
  const methods=[...about.querySelectorAll('.about-method-grid > article')];
  assert.equal(methods.length,3);
  assert.deepEqual(methods.map(node=>text(node.querySelector('h4'))),['Producto web','Herramientas','Decisiones que se pueden comprobar']);
  assert.deepEqual(methods.map(node=>text(node.querySelector('p'))),[
    'Interfaz en React y API en Node. En Strev, el análisis de vídeo va en una cola y los datos de salud se cifran campo a campo.',
    'Sereno es un solo archivo de Python, sin dependencias, que sigue desde un panel las sesiones de cinco CLI de agentes.',
    'Smarty y Marky comparten un motor en Python sin dependencias que guarda cada decisión para poder reproducirla. Por ahora los probamos en simulación porque siguen en desarrollo.',
  ]);
  assert.deepEqual(methods.map(node=>node.querySelector('a').getAttribute('href')),['/proyectos/strev/','/proyectos/sereno/','#smarty']);
  assert.deepEqual(methods.map(node=>text(node.querySelector('a'))),['Caso Strev','Caso Sereno','Ver Smarty']);
  const history=[...about.querySelectorAll('.history-list > article')];
  assert.equal(history.length,4);
  assert.ok([...about.querySelectorAll('h3')].some(node=>text(node)==='Mi recorrido'));
  assert.deepEqual(history.map(node=>[text(node.querySelector('.history-date')),text(node.querySelector('h4')),text(node.querySelector('p'))].join(' ')),[
    '2026 — Hoy Desarrollador Full Stack Anuubis Solutions · Presencial',
    '2024 · Prácticas Técnico de Soporte IT Impulso Sistemas · Alicante',
    '2024 — 2026 Desarrollo de Aplicaciones Web Grado Superior · IES Hermanos Amorós',
    '2022 — 2024 Sistemas Microinformáticos y Redes Ciclo Medio · IES Hermanos Amorós',
  ]);
  [...methods,...history,facts,...about.querySelectorAll('.about-relato > p')].forEach(visibleWithoutInteraction);
  assert.equal(about.querySelector('details'),null);
});

test('AC3: Work orders four equal sibling projects, the demo and two compact entries',()=>{
  assert.ok(work.querySelector('h2#work-title'));
  const projects=[...work.querySelectorAll('article[id]')];
  assert.deepEqual(projects.map(node=>node.id),['strev','marky','smarty','sereno']);
  assert.deepEqual(projects.map(node=>node.className),Array(4).fill('work-project'));
  for (const [index,article] of projects.entries()) {
    assert.equal(article.parentElement,work);
    if(index<3) assert.equal(article.nextElementSibling,projects[index+1]);
    assert.deepEqual([...article.children].map(node=>node.className),['work-project-heading','work-image','work-project-copy']);
    assert.ok(article.querySelector('.work-project-heading > h3'));
    assert.ok(article.querySelector('.work-project-heading > p.work-one-line'));
  }
  const demo=projects.at(-1).nextElementSibling;
  assert.equal(demo.tagName,'DETAILS');
  const label=demo.nextElementSibling;
  assert.equal(label.tagName,'P');
  assert.equal(label.id,'work-more-title');
  const more=work.querySelector('ul.work-more-list');
  assert.equal(label.nextElementSibling,more);
  assert.deepEqual([...more.children].map(node=>[node.tagName,node.id]),[
    ['LI','roguepatch-lab'],['LI','social-scout'],
  ]);
  assert.equal(more.querySelector('img'),null);
  assert.equal(work.querySelector('#savemymoneynow,#atalaya,.work-cases,.work-case,.work-featured'),null);
  assert.doesNotMatch(work.textContent,/Destacado|Con caso/);
  [...projects,...more.children].forEach(node=>{
    assert.ok(node.querySelector('h3'));
    visibleWithoutInteraction(node);
  });
  assert.equal(document.querySelectorAll('h1').length,1);
  assert.ok(document.querySelector('#inicio h1'));
});

test('AC4: Each main article exposes its literal copy and facts, with only the approved links',()=>{
  const projects=[
    ['strev','Strev','Preparar rutinas y seguir a cada atleta.','Una aplicación web propia para preparar rutinas, organizar clientes y seguir a cada atleta. El análisis de vídeo se procesa en segundo plano para que la interfaz siga disponible.','Proyecto propio. Lo diseño, lo desarrollo y opero la beta.','React · Node · Express · MongoDB · Redis · Stripe · Gemini','121 endpoints, 1.398 tests de API y 2.793 de interfaz.'],
    ['marky','Marky','Seguir el mercado en directo a partir de zonas de precio marcadas a mano.','Usa el mismo motor que Smarty. Evalúa en directo las zonas que se marcan en el gráfico, avisa por Telegram o Discord y registra cada decisión. Por ahora trabaja en simulación porque seguimos desarrollándolo.','Diseño y desarrollo del motor, el panel y la verificación. La estrategia se definió en colaboración.','Python 3.12 · FastAPI · React · TypeScript · klinecharts','4.736 tests, panel de gráfico con dibujo de zonas y gestos táctiles, y datos de cTrader en simulación.'],
    ['smarty','Smarty','Comprobar si una regla de trading aguanta antes de fiarse de ella.','Es el laboratorio del motor que comparte con Marky. Reproduce el mercado barra a barra con costes y deslizamiento. Separa los datos de ajuste de una regla de los de prueba y aplica controles contra el sobreajuste a cada estrategia.','Diseño y desarrollo del motor y la verificación. La estrategia se definió en colaboración.','Python 3.12 sin dependencias en el motor · FastAPI · React · TypeScript','3.684 tests, controles SPA, PBO y DSR escritos en Python puro y validación walk-forward en 37 ventanas.'],
    ['sereno','Sereno','Saber qué agente trabaja y cuál necesita una respuesta.',null,'Proyecto propio, código abierto.','Python · curses · tmux','101 PRs, 81 tests, 0 dependencias.'],
  ];
  const names=[];
  for (const [slug,name,line,synthesis,role,stack,result] of projects) {
    const article=work.querySelector(`article#${slug}`),facts=article.querySelector('dl');
    assert.equal(text(article.querySelector('h3')),name);
    assert.equal(text(article.querySelector('p.work-one-line')),line);
    if(synthesis) assert.equal(text(article.querySelector('.case-synthesis')),synthesis);
    else assert.equal(article.querySelector('.case-synthesis'),null,'Sereno has no approved synthesis to add');
    visibleWithoutInteraction(facts);
    assert.deepEqual([...facts.querySelectorAll('dt')].map(text),['Rol','Stack','Resultado']);
    assert.deepEqual([...facts.querySelectorAll('dd')].map(text),[role,stack,result]);
    if(['marky','smarty'].includes(slug)) {
      assert.equal(article.querySelectorAll('a').length,0);
      continue;
    }
    const links=article.querySelectorAll(`a[href="/proyectos/${slug}/"]`);
    assert.equal(links.length,1);
    const link=links[0];
    assert.equal(link.getAttribute('aria-label'),`Leer el caso de ${name}`);
    assert.equal(text(link),'Leer el caso');
    visibleWithoutInteraction(link);
    names.push(link.getAttribute('aria-label'));
  }
  assert.equal(new Set(names).size,2);
  for (const [slug,url,label] of [
    ['strev','https://strev.app','Abrir Strev'],
    ['sereno','https://github.com/ElRaxy/sereno','Ver código'],
    ['roguepatch-lab','https://github.com/ElRaxy/roguepatch-lab','Ver código'],
  ]) {
    const link=work.querySelector(`#${slug} a[href="${url}"]`);
    assert.ok(link);
    assert.equal(text(link),label);
    assert.equal(link.target,'_blank');
    assert.equal(link.rel,'noopener noreferrer');
  }
});

test('AC5: The nine metrics measured on 2026-10-20 use named spans and Spanish number formatting',()=>{
  const expected={
    'strev-endpoints':'121','strev-tests-api':'1.398','strev-tests-ui':'2.793',
    'sereno-prs':'101','sereno-tests':'81','marky-tests':'4.736',
    'smarty-tests':'3.684','smarty-ventanas':'37','roguepatch-tests':'366',
  };
  const metrics=[...document.querySelectorAll('[data-metric]')];
  assert.deepEqual([...new Set(metrics.map(node=>node.dataset.metric))].sort(),Object.keys(expected).sort());
  assert.equal(metrics.length,9,'Each metric appears once');
  for (const node of metrics) {
    assert.equal(node.tagName,'SPAN');
    assert.equal(text(node),expected[node.dataset.metric]);
    visibleWithoutInteraction(node);
  }
  for (const slug of ['strev','marky','smarty','sereno']) {
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
    ['strev','assets/strev-plan-retina.png','2400','1652','Strev: cliente de demostración con sus rutinas asignadas'],
    ['marky','assets/marky-interface.png','1440','900','Marky: gráfico de velas de XAUUSD con la barra de dibujo y el borrador de zonas'],
    ['smarty','assets/smarty-session.png','2880','1800','Smarty: panel de control de una sesión en simulación con el precio, las roturas de estructura y el riesgo'],
    ['sereno','assets/sereno-native-retina.png','2880','1536','Salida real de Sereno en modo demo con sesiones y estados de agentes'],
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
  assert.deepEqual([...work.querySelectorAll('.work-level')].map(node=>node.tagName),['P']);
  assert.equal(work.querySelector('ul.work-more-list').getAttribute('aria-labelledby'),'work-more-title');
  assert.equal(text(work.querySelector('#work-more-title')),'Más trabajo');
  assert.equal(document.querySelectorAll('#sobre-mi h3 > a[href^="#"], #trabajo h3 > a[href^="#"]').length,0);
});

test('Every labelled link in the hero index, About and Work starts its accessible name with its visible text',()=>{
  const links=[...document.querySelectorAll('#inicio .work-index a[aria-label], #sobre-mi a[aria-label], #trabajo a[aria-label]')];
  assert.deepEqual(links.map(link=>link.getAttribute('aria-label')),[
    'Ver caso de Strev','Ver caso de Sereno','Leer el caso de Strev','Leer el caso de Sereno','Ver código de Sereno','Ver código de RoguePatch Lab',
  ]);
  for(const link of links){
    const visible=text(link);
    assert.ok(link.getAttribute('aria-label').startsWith(visible),`${link.getAttribute('aria-label')} / ${visible}`);
  }
});

test('Secuencia AC1–AC2: Contacto serves the 34 accessible steps with only its endpoints loaded',async()=>{
  const intro=document.querySelector('#contacto .contact-intro');
  const boxes=intro.querySelectorAll('div.secuencia[data-secuencia]');
  assert.equal(boxes.length,1);
  assert.equal(intro.querySelector('svg.drawing-talk'),null);
  const sequence=boxes[0],frames=[...sequence.children];
  assert.equal(sequence.getAttribute('role'),'img');
  assert.equal(sequence.getAttribute('aria-label'),'Ilustración de Alex a línea continua en cobalto. Conforme bajas deja de teclear en el portátil, te ve, te saluda, se levanta, camina hacia ti y te tiende la mano.');
  const numbers=Array.from({length:34},(_,index)=>index===9||index===11?8:index+1);
  const expected=numbers.map(number=>`assets/contacto/s${String(number).padStart(2,'0')}.svg`);
  assert.equal(frames.length,34);
  assert.deepEqual(frames.map(frame=>frame.getAttribute('src')||frame.getAttribute('data-src')),expected);
  for (const [index,frame] of frames.entries()) {
    assert.equal(frame.tagName,'IMG');
    assert.equal(frame.getAttribute('alt'),'');
    assert.equal(frame.getAttribute('aria-hidden'),'true');
    assert.equal(frame.getAttribute('width'),'640');
    assert.equal(frame.getAttribute('height'),'640');
    assert.equal(frame.getAttribute('decoding'),'async');
    assert.equal(frame.hasAttribute('data-trans'),false);
    const endpoint=index===0||index===33;
    assert.equal(frame.hasAttribute('src'),endpoint);
    assert.equal(frame.hasAttribute('data-src'),!endpoint);
    assert.equal(frame.classList.contains('sec-f'),true);
    assert.equal(frame.classList.contains('es-primero'),index===0);
    assert.equal(frame.classList.contains('es-final'),index===33);
    assert.ok((await readFile(new URL(`../public/experimental/${expected[index]}`,import.meta.url))).length>0);
  }
  const files=await readdir(new URL('../public/experimental/assets/contacto/',import.meta.url));
  assert.deepEqual(files.filter(file=>file.endsWith('.svg')).sort(),[...new Set(expected.map(file=>file.split('/').at(-1)))].sort());
});

test('Secuencia AC8: responsive Contacto layout keeps the drawing after the email and Work intact',async()=>{
  const css=await readFile(new URL('../public/experimental/styles.css',import.meta.url),'utf8');
  const style=document.createElement('style');
  style.textContent=css;
  document.head.append(style);
  try {
    const rules=[...style.sheet.cssRules];
    const sequenceRule=rules.find(rule=>rule.selectorText==='.contact-intro>.secuencia');
    assert.ok(sequenceRule);
    assert.equal(sequenceRule.style.getPropertyValue('height'),'var(--sec-alto,300px)');
    assert.equal(sequenceRule.style.getPropertyValue('justify-self'),'start');
    assert.equal(sequenceRule.style.getPropertyValue('aspect-ratio'),'1');
    for (const [width,height] of [[759,232],[500,196],[380,176]]) {
      const media=rules.find(rule=>rule.media?.mediaText===`(max-width:${width}px)`);
      const drawing=[...media.cssRules].find(rule=>rule.selectorText==='.contact-intro>.secuencia');
      assert.equal(drawing.style.getPropertyValue('--sec-alto'),`${height}px`);
      if(width===759) {
        assert.equal(drawing.style.getPropertyValue('order'),'1');
        const placement=[...media.cssRules].find(rule=>rule.selectorText==='.contact-intro>.secuencia,#contact-title,.contact-actions');
        assert.equal(placement.style.getPropertyValue('grid-row'),'auto');
        assert.equal(placement.style.getPropertyValue('grid-column'),'1');
      }
    }
    assert.equal(document.querySelectorAll('#contacto .contact-actions .contact-address').length,1);
    assert.doesNotMatch(css,/\.contact-intro\s*>\s*\.world-drawing|\.drawing-talk\b/);
    assert.ok(rules.some(rule=>rule.selectorText==='.world-drawing'));
    assert.ok(work.querySelector('svg.world-drawing.drawing-work'));
  } finally { style.remove(); }
});
