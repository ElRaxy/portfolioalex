/* One scroll position owns one pose; separate paper, illustration and media planes. */
(() => {
  if (!document.body.classList.contains('personal-world') || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const progress = document.querySelector('.reading-progress');
  const entries = [], near = new Set();
  let frame = 0, suspended = false;
  // Pure geometry: independent of frame rate, direction and time spent at a position.
  const clamp = value => Math.max(0, Math.min(1, value));
  const amplitude = (width, mobile, tablet, desktop) => width <= 820
    ? mobile + (tablet - mobile) * clamp((width - 390) / 430)
    : tablet + (desktop - tablet) * clamp((width - 820) / 620);
  const arrival = (top, height) => {
    const p = clamp((.92 * height - top) / (.30 * height));
    return p >= 1 - 1e-9 ? 1 : p * p * (3 - 2 * p);
  };
  const depthProgress = (top, size, height) => clamp((height - top) / Math.max(1, height + size));
  const depthPose = (kind, position, width, neutral = false) => {
    const p = neutral ? (kind.startsWith('hero-') ? 0 : .5) : position;
    const d = 1 - 2 * p;
    if (kind === 'hero-portrait') return `translate3d(0,${-amplitude(width,34,64,112) * p}px,0)`;
    if (kind === 'hero-paper') return `translate3d(0,${amplitude(width,16,28,48) * p}px,0) rotate(${-4 + 2 * p}deg)`;
    if (kind === 'hero-doodle') return `translate3d(0,${amplitude(width,10,20,32) * p}px,0)`;
    if (kind === 'media') return `translate3d(0,${amplitude(width,16,24,36) * d}px,0)`;
    if (kind === 'paper') return `translate3d(0,${-amplitude(width,12,20,28) * d}px,0) rotate(${-6 - 2 * d}deg)`;
    const y = kind === 'talk' ? amplitude(width,20,30,44) : amplitude(width,16,26,36);
    return `translate3d(${amplitude(width,4,8,12) * d}px,${y * d}px,0) rotate(${-3 * d}deg)`;
  };
  const heightWeight = height => Math.max(.3, clamp((height - 260) / 440));
  // Clamp the end to reachable scroll, rather than resetting the whole scene at page bottom.
  const sceneArrival = (top, height, scroll, travel, start = .96, end = .64) => {
    const docTop = top + scroll, from = docTop - start * height;
    const to = Math.min(docTop - end * height, Math.max(0, travel));
    if (to <= from) return 1;
    if (start === .92 && end === .62 && to === docTop - end * height) return arrival(top,height);
    const p = clamp((scroll - from) / (to - from));
    return p >= 1 - 1e-9 ? 1 : p * p * (3 - 2 * p);
  };
  const journeyPose = (kind, depth, width, quiet = false, presented = 1, height = 700, size = 0) => {
    const weight = heightWeight(height), remaining = quiet ? 0 : 1 - presented;
    if (kind === 'heading') return `translate3d(0,${amplitude(width,22,32,48) * weight * remaining}px,0)`;
    const base = depthPose(kind, depth, width, quiet);
    if (quiet) return base;
    if (kind === 'hero-portrait') return `${base} scale(${1 - amplitude(width,.015,.025,.035) * weight * depth})`;
    if (kind === 'media' && remaining > 0) return `perspective(${Math.max(1000,4 * size)}px) ${base} rotateX(${amplitude(width,4,7,10) * weight * remaining}deg) scale(${1 - amplitude(width,.045,.075,.10) * weight * remaining})`;
    return base;
  };
  const storyLayout = (width, height, header) => {
    const mobile = width < 760, usable = height - header;
    const stage = mobile ? Math.min(210,Math.max(140,usable * .30)) : Math.min(520,usable - 40);
    return {viable:height >= 600 && usable >= 480, mobile, stage,
      step:mobile ? Math.max(240,(usable - stage - 24) * .65) : Math.max(360,usable * .70),
      inset:header + (mobile ? 12 : 20)};
  };
  // Derive two transitions from the real reading steps; reserve holds inside the actual sticky interval.
  const storyPosition = (centers, scroll, readingLine, height, pinStart, pinEnd) => {
    if (centers.length !== 3 || pinEnd <= pinStart) return 0;
    const range = pinEnd - pinStart, span = Math.min(height * .24,range * .12), hold = Math.min(height * .28,range * .20);
    const bound = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
    const first = bound((centers[0] + centers[1]) / 2 - readingLine,pinStart + hold + span / 2,pinEnd - 2 * hold - 1.5 * span);
    const second = bound((centers[1] + centers[2]) / 2 - readingLine,first + span + hold,pinEnd - hold - span / 2);
    return [first,second].reduce((sum,point) => {
      const p = clamp((scroll - point + span / 2) / span);
      return sum + p * p * (3 - 2 * p);
    },0);
  };
  const storyFramePose = (index, position, mobile) => {
    const distance = Math.max(-1,Math.min(1,index - position)), amount = Math.abs(distance);
    const x = (distance < 0 ? (mobile ? 8 : 12) : (mobile ? 8 : 14)) * distance;
    return {transform:`translate3d(${x}%,${(distance < 0 ? 3 : 4) * distance}%,0) rotate(${(mobile ? 2 : 4) * distance}deg) scale(${1 - .04 * amount})`, opacity:1 - amount};
  };
  const workStoryRow = (rectangles, line) => {
    if (!rectangles.length) return {indices:[],progress:0};
    let first = 0;
    rectangles.forEach((rect,index) => { if (rect.top <= line && rect.top > rectangles[first].top + 2) first = index; });
    const top = rectangles[first].top, indices = [];
    rectangles.forEach((rect,index) => { if (Math.abs(rect.top - top) <= 2) indices.push(index); });
    const bottom = Math.max(...indices.map(index => rectangles[index].bottom));
    return {indices,progress:clamp((line - top) / Math.max(1,bottom - top))};
  };
  // End pure geometry.
  const rail = document.querySelector('.story-rail'), stage = rail?.querySelector('.story-stage');
  const steps = rail ? [...rail.querySelectorAll('[data-story-step]')] : [];
  const workMarker = document.querySelector('.work-story-marker');
  const projects = workMarker ? [...document.querySelectorAll('.project-archive > .project')] : [];
  const storyFrames = [], storyLabels = [];
  let storyMounted = false, storyEnhanced = false, storySizing = null, storySizeKey = '', storyLabel = null, lastAct = -1;
  const measureStoryLayout = () => storyLayout(window.innerWidth,window.innerHeight,
    document.querySelector('.index-bar')?.getBoundingClientRect().height || 65);
  const sizeStory = () => {
    if (!storyMounted) return;
    const next = measureStoryLayout();
    if (!next.viable) {
      storyEnhanced = false; storySizeKey = '';
      rail.classList.remove('story-enhanced','story-neutral');
      root.classList.remove('story-work-enhanced','story-work-quiet');
      return;
    }
    if (!storyEnhanced && (reduced.matches || root.classList.contains('keyboard'))) return;
    storyEnhanced = true; rail.classList.add('story-enhanced');
    if (workMarker && projects.length) root.classList.add('story-work-enhanced');
    const key = `${window.innerWidth}:${window.innerHeight}:${next.inset}`;
    if (storySizeKey === key) return;
    storySizeKey = key; storySizing = next;
    rail.style.setProperty('--story-stage-height',`${next.stage}px`);
    rail.style.setProperty('--story-step-height',`${next.step}px`);
  };
  const mountStory = () => {
    if (storyMounted || !stage || steps.length !== 3 || reduced.matches || root.classList.contains('keyboard') || !measureStoryLayout().viable) return;
    const sources = ['#strev .journey-media','#sereno .journey-media','#social-scout .social-editorial-paper'].map(selector => document.querySelector(selector));
    if (sources.some(source => !source || source.querySelector('a,button,input,select,textarea,summary,[tabindex]'))) return;
    sources.forEach((source,index) => {
      const copy = source.cloneNode(true), frameNode = document.createElement('div');
      [copy,...copy.querySelectorAll('*')].forEach(node => {
        [...node.attributes].forEach(attribute => {
          if (attribute.name === 'id' || attribute.name === 'style' || attribute.name.startsWith('data-parallax-')) node.removeAttribute(attribute.name);
        });
      });
      if (copy.tagName === 'IMG') { copy.className = 'story-capture'; copy.alt = ''; copy.loading = 'lazy'; }
      frameNode.dataset.storyFrame = steps[index].dataset.storyStep;
      frameNode.append(copy); stage.append(frameNode); storyFrames.push(frameNode);
      storyLabels.push(steps[index].querySelector('dt > span').textContent.trim());
    });
    storyLabel = document.createElement('span'); storyLabel.className = 'story-stage-label'; stage.append(storyLabel);
    storyMounted = true; sizeStory();
  };
  mountStory(); // Before app.js performs its one native initial-hash alignment.
  const quietStory = quiet => {
    if (!storyEnhanced) return;
    rail.classList.toggle('story-neutral',quiet);
    root.classList.toggle('story-work-quiet',quiet);
    if (quiet) storyFrames.forEach(node => { node.style.transform = 'none'; node.style.opacity = '1'; });
  };
  const readStory = view => {
    if (!storyEnhanced) return null;
    const railRect = rail.getBoundingClientRect(), stepRects = steps.map(step => step.getBoundingClientRect());
    const layout = storyLayout(view.width,view.height,view.header);
    const stageHeight = storySizing.stage, inset = view.header + (layout.mobile ? 12 : 20);
    const readingLine = layout.mobile ? inset + stageHeight + (view.height - inset - stageHeight) * .25 : view.height * .52;
    const centers = stepRects.map(rect => rect.top + view.scroll + rect.height / 2);
    const position = storyPosition(centers,view.scroll,readingLine,view.height,
      railRect.top + view.scroll - inset,railRect.bottom + view.scroll - inset - stageHeight);
    const row = workStoryRow(projects.map(project => project.getBoundingClientRect()),view.header + 44 + 24);
    return {position, mobile:layout.mobile, quiet:neutral() || !layout.viable, row};
  };
  const drawStory = state => {
    if (!state) return;
    quietStory(state.quiet);
    if (!state.quiet) storyFrames.forEach((node,index) => {
      const pose = storyFramePose(index,state.position,state.mobile);
      node.style.transform = pose.transform; node.style.opacity = String(pose.opacity);
      node.style.zIndex = String(index + 1);
    });
    const act = Math.round(state.position);
    if (act !== lastAct) { lastAct = act; stage.dataset.storyAct = String(act); storyLabel.textContent = `${String(act + 1).padStart(2,'0')} / ${storyLabels[act]}`; }
    if (workMarker && state.row.indices.length) {
      const row = state.row.indices.map(index => projects[index]), ids = row.map(project => project.id).join(' ');
      if (workMarker.dataset.projects !== ids) {
        workMarker.dataset.project = row[0].id; workMarker.dataset.projects = ids;
        const numbers = row.map(project => project.querySelector('.project-number').textContent.trim());
        const names = row.map(project => project.querySelector('h3').textContent.trim().replace(/\s+/g,' '));
        workMarker.querySelector('.work-story-label').textContent = `${numbers.join('–')} / ${names.join(' · ')}`;
      }
      workMarker.querySelector('.work-story-track i').style.transform = `scaleX(${state.row.progress})`;
    }
  };
  const add = (wrapper, kind, targets) => {
    if (wrapper && targets.length) entries.push({wrapper, kind, targets, order:Number(targets[0].dataset?.journeyOrder) || 0, project:wrapper.closest('.project'), last:null});
  };
  document.querySelectorAll('[data-parallax-scene]').forEach(wrapper => {
    wrapper.querySelectorAll('[data-parallax-layer]').forEach(target => {
      if (target.closest('[data-parallax-scene]') !== wrapper) return;
      const kind = target.dataset.parallaxLayer;
      add(wrapper, kind === 'sketch' && wrapper.closest('#contacto') ? 'talk' : kind, [target]);
    });
  });
  document.querySelectorAll('.journey-accent').forEach(target => add(target.parentElement, 'accent', [target]));
  document.querySelectorAll('section:not(.hero-personal) [data-world-scene]').forEach(wrapper => {
    const strokes = [...wrapper.querySelectorAll('[pathLength="1"]')];
    strokes.forEach((target, index) => {
      add(wrapper, 'drawing', [target]);
      entries[entries.length - 1].order = index / Math.max(1, strokes.length - 1);
    });
  });
  const paused = () => suspended || document.hidden || !document.hasFocus();
  const neutral = () => reduced.matches || root.classList.contains('keyboard');
  const apply = (entry, value, width, quiet = false, presented = 1, height = 700, size = 0) => {
    const key = `${value}:${width}:${quiet}:${presented}:${height}:${size}`;
    if (entry.last === key) return;
    entry.last = key;
    entry.targets.forEach(target => {
      if (entry.kind === 'accent') target.style.transform = `scaleX(${quiet ? 1 : .2 + .8 * value})`;
      else if (entry.kind === 'drawing') target.style.strokeDashoffset = String(quiet ? 0 : 1 - value);
      else target.style.transform = journeyPose(entry.kind, value, width, quiet, presented, height, size);
    });
  };
  const pause = () => { cancelAnimationFrame(frame); frame = 0; };
  const settle = () => {
    pause(); entries.forEach(entry => apply(entry, 1, window.innerWidth, true)); quietStory(true);
  };
  const frameGeometry = () => ({height:window.innerHeight, width:window.innerWidth, scroll:window.scrollY,
    travel:Math.max(0, root.scrollHeight - window.innerHeight),
    header:parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 0});
  const poseFor = (entry, rect, view) => {
    const {height, width, scroll, travel, header} = view;
    const quiet = neutral() || !rect.width || !rect.height || (entry.kind.startsWith('hero-') && window.portfolioEntry?.active);
    const secondColumn = width >= 1000 && entry.project?.id !== 'strev' && !entry.project?.open && rect.left > width / 2;
    const presented = entry.kind === 'media' ? sceneArrival(rect.top,height,scroll,travel,secondColumn ? .945 : .98,.60)
      : sceneArrival(rect.top,height,scroll,travel,.96 - .035 * entry.order,.64);
    const p = entry.kind.startsWith('hero-') ? clamp((header - rect.top) / (Math.max(height,rect.height) * .85))
      : entry.kind === 'drawing' ? sceneArrival(rect.top,height,scroll,travel,.96 - .04 * entry.order,.64)
      : entry.kind === 'accent' ? sceneArrival(rect.top,height,scroll,travel,.92,.62) : depthProgress(rect.top,rect.height,height);
    return [entry,p,width,quiet,presented,height,rect.height];
  };
  const render = () => {
    frame = 0;
    if (paused()) return;
    const view = frameGeometry(), {travel, width} = view;
    const disabled = neutral();
    // Read each fixed wrapper once, even when it carries several independent visual planes.
    const rectangles = new Map();
    near.forEach(entry => { if (!rectangles.has(entry.wrapper)) rectangles.set(entry.wrapper, entry.wrapper.getBoundingClientRect()); });
    const poses = [...near].map(entry => poseFor(entry, rectangles.get(entry.wrapper), view));
    const storyState = readStory(view);
    if (progress) progress.style.transform = `scaleX(${travel > 0 ? clamp(window.scrollY / travel) : 0})`;
    if (disabled) entries.forEach(entry => apply(entry, 1, width, true));
    else poses.forEach(pose => apply(...pose));
    drawStory(storyState);
  };
  const refresh = () => {
    if (paused()) return;
    if (!frame) frame = requestAnimationFrame(render);
  };
  const byWrapper = new Map();
  entries.forEach(entry => {
    if (!byWrapper.has(entry.wrapper)) byWrapper.set(entry.wrapper, []);
    byWrapper.get(entry.wrapper).push(entry);
  });
  const observer = new IntersectionObserver(changes => {
    const view = frameGeometry();
    changes.forEach(({target, isIntersecting, boundingClientRect}) => {
      byWrapper.get(target).forEach(entry => {
        if (isIntersecting) near.add(entry);
        else {
          near.delete(entry);
          if (!paused()) apply(...poseFor(entry, boundingClientRect, view));
        }
      });
    });
    refresh();
  }, {rootMargin:'180px', threshold:0});
  byWrapper.forEach((_, wrapper) => observer.observe(wrapper));
  window.portfolioJourney = Object.freeze({refresh, settle});
  window.addEventListener('scroll', refresh, {passive:true});
  window.addEventListener('resize', () => { mountStory(); sizeStory(); refresh(); }, {passive:true});
  window.addEventListener('load', () => { mountStory(); sizeStory(); refresh(); });
  window.addEventListener('portfolio:entryend', refresh);
  window.addEventListener('hashchange', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('blur', pause);
  document.addEventListener('toggle', refresh, true);
  document.addEventListener('focusin', refresh);
  document.addEventListener('focusout', refresh);
  document.addEventListener('keydown', event => {
    if (['Tab','Enter','Escape',' ','ArrowDown','ArrowUp','Home','End','PageDown','PageUp'].includes(event.key)) settle();
  });
  document.addEventListener('pointerdown', () => queueMicrotask(refresh));
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : refresh());
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); else { mountStory(); sizeStory(); refresh(); } });
  window.addEventListener('pagehide', () => { suspended = true; pause(); observer.disconnect(); near.clear(); });
  window.addEventListener('pageshow', () => { suspended = false; mountStory(); sizeStory(); byWrapper.forEach((_, wrapper) => observer.observe(wrapper)); refresh(); });
  document.fonts?.ready.then(() => { sizeStory(); refresh(); });
  refresh();
})();
