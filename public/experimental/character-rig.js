// The chair and body stay on the raster base; only the neck/head and working hand articulate.
(() => {
  const SIZE = 1254;
  const HEAD = 'M360 0H900V435L797 456L777 474Q765 510 719 513Q673 513 657 482L648 464L580 468L488 427L420 347Z';
  const PALM = 'M582 726Q610 700 650 702Q691 710 727 728L735 741L735 779L710 793L653 780L625 784L589 778Z';
  function markup(id, source = '') {
    const href = source ? ` href="${source.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"` : '';
    const raster = (layer, attributes = '') => `<image data-character-layer="${layer}" width="${SIZE}" height="${SIZE}"${href} ${attributes}/>`;
    return `<svg class="character-art" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-character-id="${id}">
<defs>
 <mask id="${id}-base" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254"><rect width="1254" height="1254" fill="white"/><path d="${HEAD}" fill="black"/><path d="${PALM}" fill="black"/></mask>
 <clipPath id="${id}-palm-underlay" clipPathUnits="userSpaceOnUse"><path d="${PALM}"/></clipPath>
 <clipPath id="${id}-head" clipPathUnits="userSpaceOnUse"><path d="${HEAD}"/></clipPath>
 <clipPath id="${id}-cuff" clipPathUnits="userSpaceOnUse"><path d="M724 724Q743 713 758 732Q772 752 760 782L750 791L729 782Q740 760 729 740Z"/></clipPath>
 <clipPath id="${id}-collar" clipPathUnits="userSpaceOnUse"><path d="M646 474Q651 520 705 532Q756 547 783 511Q791 493 791 469L778 461Q769 495 730 506Q689 519 667 483L665 471Z"/></clipPath>
 <clipPath id="${id}-laptop" clipPathUnits="userSpaceOnUse"><path d="M313 596L552 603L595 766L742 784L740 801L380 795L313 675Z"/></clipPath>
 <linearGradient id="${id}-skin" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#ffd6a5"/><stop offset="1" stop-color="#ffc58b"/></linearGradient>
</defs>
${raster('base', `mask="url(#${id}-base)"`)}
<path class="character-neck-bridge" fill="url(#${id}-skin)" d="M649 439L772 438L788 480Q762 522 718 520Q677 517 654 485Z"/>
<g class="character-head" style="transform-origin:720px 484px;transform-box:view-box">
 ${raster('head', `clip-path="url(#${id}-head)"`)}
 <g class="character-gaze"><g transform="translate(582 336) rotate(-12)"><ellipse class="character-eye" rx="15" ry="24"/></g><g transform="translate(698 306.5) rotate(-12)"><ellipse class="character-eye" rx="16" ry="25"/></g></g>
</g>
${raster('collar', `clip-path="url(#${id}-collar)"`)}
<path fill="#fafaf7" d="${PALM}"/>
<path fill="#2449f5" clip-path="url(#${id}-palm-underlay)" d="M570 765H750V810H570Z"/>
 <g class="character-hand" style="transform-origin:733px 754px;transform-box:view-box">
  <path fill="url(#${id}-skin)" stroke="#131412" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M730 739C705 728 678 711 652 712C628 711 607 726 596 747C589 760 593 772 605 775C616 779 627 768 637 762C650 771 666 769 678 775C694 783 716 783 730 769Z"/>
  <path fill="none" stroke="#131412" stroke-width="8" stroke-linecap="round" d="M605 769Q618 749 638 741"/>
 </g>
${raster('cuff', `clip-path="url(#${id}-cuff)"`)}
${raster('laptop', `clip-path="url(#${id}-laptop)"`)}
</svg>`;
  }
  const mounted = new WeakMap();
  function mount(host, image, { active = () => true } = {}) {
    if (mounted.has(host)) return mounted.get(host);
    const pending = (async () => {
      const template = document.createElement('template');
      template.innerHTML = markup(`character-${mount.nextId++}`);
      const svg = template.content.firstElementChild;
      host.append(svg);
      const images = [...svg.querySelectorAll('image')];
      const loaded = images.map(node => new Promise((resolve, reject) => {
        node.addEventListener('load', resolve, { once: true });
        node.addEventListener('error', reject, { once: true });
        node.setAttribute('href', image.currentSrc || image.src);
      }));
      try {
        await Promise.all([image.decode(), ...loaded]);
        if (!active()) { svg.remove(); return null; }
        host.classList.add('is-articulated');
        return { svg, head: svg.querySelector('.character-head'), hand: svg.querySelector('.character-hand'), gaze: svg.querySelector('.character-gaze'), eyes: [...svg.querySelectorAll('.character-eye')] };
      } catch {
        svg.remove();
        return null;
      }
    })();
    mounted.set(host, pending);
    return pending;
  }
  mount.nextId = 1;
  window.PortfolioCharacterRig = { SIZE, markup, mount };
})();
