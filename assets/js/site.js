/* =====================================================================
   BE YOU — site behaviour
   Core interactions work without the animation libraries; GSAP,
   ScrollTrigger and Lenis add the motion layer when they are available.
   ===================================================================== */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap, ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;
  const D = window.BY_DATA;
  let lenis = null;

  /* ---------- catalogue helpers ---------- */
  const catById = Object.fromEntries(D.cats.map(c => [c.id, c]));
  const bySku = Object.fromEntries(D.products.map(p => [p.sku, p]));
  const inCat = id => D.products.filter(p => p.cat === id);
  // the piece that represents each category in previews and thumbnails
  const REP = { backpacks: 'BP05', duffles: 'DB03', handbags: 'HB01', gifts: 'GS01', laptop: 'LB01', luggage: 'LGB02',
    messenger: 'MSB02', wallets: 'MW03', passport: 'PO01', pouches: 'MP02', toolkits: 'TK01', documents: 'DH04' };
  const SIGNATURE = ['LB01', 'DB03', 'GS01', 'BP05', 'MSB02', 'HB01', 'LGB01', 'MW03', 'PO01', 'DH04', 'TK01'];
  const photo = (p, alt = p.name, extra = '') =>
    `<img src="${p.photo}" alt="${esc(alt)}"${p.cover ? ' class="cover"' : ''} loading="lazy" decoding="async"${extra}>`;

  /* ---------- personalised link: ?brand=Acme ---------- */
  const params = new URLSearchParams(location.search);
  const clean = (v, n) => (v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
  const brand = clean(params.get('brand'), 22);
  if (brand) {
    const f = $('#plFor'), b = document.createElement('span');
    f.textContent = 'Prepared for ';
    b.className = 'for'; b.textContent = brand; f.appendChild(b);
    document.title = `BE YOU × ${brand} — Premium bags, made for you`;
  }

  /* =========================================================
     Render data-driven content
     ========================================================= */
  const mq = D.cats.map((c, i) => `<span${i % 2 ? ' class="o"' : ''}>${esc(c.name)}</span><i></i>`).join('');
  $('#marqueeTrack').innerHTML = mq + mq;

  $('#indexList').innerHTML = D.cats.map((c, i) => `
    <li class="idx-row" data-cat="${c.id}" tabindex="0" role="button" aria-label="${esc(c.name)}: view ${inCat(c.id).length} styles">
      <span class="idx-no">${pad(i + 1)}</span>
      <span class="idx-thumb">${photo(bySku[REP[c.id]], '')}</span>
      <h3 class="idx-name">${esc(c.name)}</h3>
      <span class="idx-meta">${pad(inCat(c.id).length)} Styles</span>
      <span class="idx-arrow">→</span>
    </li>`).join('');
  $('#idxPreview').innerHTML = `<div class="pv-tilt">${D.cats.map(c => photo(bySku[REP[c.id]], '')).join('')}</div>`;

  $('#sampleTrack').innerHTML = SIGNATURE.map(s => {
    const p = bySku[s];
    return `<button type="button" class="sample-item" data-sku="${s}">
      <span class="ph">${photo(p, p.name, ' draggable="false"')}<span class="no">${p.sku}</span></span>
      <span class="cap">${esc(p.name)}</span><span class="tag">${esc(catById[p.cat].name)}</span>
    </button>`;
  }).join('');

  // client logos in their own brand colours: [file, width, height] of the trimmed artwork.
  // Sized by aspect so wide and tall marks carry equal weight.
  const LOGO = {
    google: ['google.svg', 270, 89], youtube: ['youtube.svg', 389, 84], facebook: ['facebook.svg', 886, 158],
    twitter: ['twitter.svg', 341, 63], gartner: ['gartner.svg', 1059, 241], aws: ['aws.svg', 301, 180],
    nvidia: ['nvidia.svg', 162, 30], wipro: ['wipro.svg', 377, 297], icici: ['icici.webp', 600, 120],
    asianpaints: ['asianpaints.webp', 600, 110], mac: ['mac.webp', 600, 65], clinique: ['clinique.svg', 720, 202],
    bigbazaar: ['bigbazaar.webp', 600, 132] };
  // single-colour silhouettes for brands without colour artwork yet
  const LOGO_MASK = { esbeda: [219, 134], metro: [232, 116], janeshilton: [352, 71], baggit: [171, 146],
    zouk: [233, 62], lavie: [216, 95], vril: [210, 76], bithalniketan: [283, 126] };
  // optical corrections for marks that read heavier or lighter than their box
  const LOGO_TUNE = { google: 1.08, facebook: .95, gartner: .95, wipro: 1.22, asianpaints: 1.16, mac: .9, clinique: 1.05,
    bigbazaar: .9, metro: .78, bithalniketan: 1.3, janeshilton: 1.08, baggit: .95 };
  $('#logoGrid').innerHTML = D.logos.map(([f, n]) => {
    const [file, w, h] = LOGO[f] || [null, ...(LOGO_MASK[f] || [300, 100])];
    const src = file ? `assets/img/clients/${file}` : `assets/img/logos/${f}.png`;
    const em = 3.4 / Math.sqrt(w / h) * (LOGO_TUNE[f] || 1);
    return `<div class="logo-cell"><img src="${src}"${file ? '' : ' class="mono"'} alt="${esc(n)}" width="${w}" height="${h}" style="--h:${em.toFixed(3)}" loading="lazy" decoding="async"></div>`;
  }).join('');


  /* =========================================================
     Core behaviour — works with or without the animation libs
     ========================================================= */
  const ui = { menu: false, panel: false, pm: false };
  const syncLock = () => {
    const on = ui.menu || ui.panel || ui.pm;
    root.classList.toggle('lock', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  };

  /* ---------- nav state + scroll progress ---------- */
  const nav = $('#siteNav'), progress = $('#scrollProgress');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 60);
    if (!ui.menu && Math.abs(y - lastY) > 4) {
      nav.classList.toggle('hide', y > lastY && y > innerHeight * .7);
      lastY = y;
    }
    const max = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* current section in the nav */
  const navLinks = $$('.nav-link');
  const watched = [$('#top'), ...navLinks.map(a => $(a.getAttribute('href')))].filter(Boolean);
  const secIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  watched.forEach(s => secIO.observe(s));

  /* ---------- mobile menu ---------- */
  const hamburger = $('#hamburger'), links = $('#primaryLinks');
  const setMenu = on => {
    ui.menu = on;
    links.classList.toggle('open', on);
    root.classList.toggle('menu-open', on);
    hamburger.setAttribute('aria-expanded', on);
    syncLock();
  };
  hamburger.addEventListener('click', () => setMenu(!ui.menu));
  matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches && ui.menu) setMenu(false); });

  /* ---------- in-page links ---------- */
  const scrollToEl = (el, opts = {}) => {
    const offset = opts.offset || 0;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.6, immediate: !!opts.immediate, force: true, easing: t => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce || opts.immediate ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 || a.closest('.panel')) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    if (ui.menu) setMenu(false);
    scrollToEl(target);
  }));

  /* =========================================================
     Collection panel — one category at a time
     ========================================================= */
  const panel = $('#panel'), pnGrid = $('#pnGrid');
  let pnCat = null, pnReturn = null;

  const fillPanel = id => {
    const c = catById[id], i = D.cats.indexOf(c), list = inCat(id);
    pnCat = id;
    $('#pnKicker').textContent = `Category ${pad(i + 1)} / ${pad(D.cats.length)}`;
    $('#pnTitle').textContent = c.name;
    $('#pnCrumb').textContent = c.name;
    $('#pnLine').textContent = c.line;
    $('#pnFeats').innerHTML = c.feats.map(f => `<li>${esc(f)}</li>`).join('');
    $('#pnCount').textContent = `(${pad(list.length)}) Styles`;
    pnGrid.innerHTML = list.map(p => `
      <button type="button" class="pc" data-sku="${p.sku}">
        <span class="ph">${photo(p)}<span class="no">${p.sku}</span></span>
        <span class="cap">${esc(p.name)}</span><span class="tag">${esc(p.tag.replace(/\.$/, ''))}</span>
      </button>`).join('');
    const prev = D.cats[(i - 1 + D.cats.length) % D.cats.length], next = D.cats[(i + 1) % D.cats.length];
    $('#pnPrev strong').textContent = prev.name; $('#pnPrev').dataset.cat = prev.id;
    $('#pnNext strong').textContent = next.name; $('#pnNext').dataset.cat = next.id;
  };
  const introPanel = (delay = 0) => {
    if (!motion) return;
    G.fromTo($$('.pn-intro > *, #pnCount', panel), { y: 46, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: .06, delay, overwrite: true });
    G.fromTo($$('.pc', pnGrid), { y: 80, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', stagger: .07, delay: delay + .15, overwrite: true });
  };
  const openPanel = id => {
    fillPanel(id);
    pnReturn = document.activeElement;
    panel.scrollTop = 0;
    panel.setAttribute('aria-hidden', 'false');
    ui.panel = true; syncLock();
    if (motion) {
      G.killTweensOf(panel);
      G.set(panel, { visibility: 'visible' });
      G.fromTo(panel, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.inOut' });
      introPanel(.5);
    } else panel.classList.add('open');
    setTimeout(() => $('#pnClose').focus({ preventScroll: true }), 60);
  };
  const closePanel = () => {
    if (!ui.panel) return;
    ui.panel = false;
    panel.setAttribute('aria-hidden', 'true');
    if (motion) {
      G.killTweensOf(panel);
      G.to(panel, { clipPath: 'inset(0% 0% 100% 0%)', duration: .9, ease: 'expo.inOut', onComplete: () => G.set(panel, { visibility: 'hidden' }) });
    } else panel.classList.remove('open');
    syncLock();
    if (pnReturn && pnReturn.focus) pnReturn.focus({ preventScroll: true });
  };
  const swapPanel = id => {
    if (!motion) { fillPanel(id); panel.scrollTop = 0; return; }
    G.to('#pnBody', {
      autoAlpha: 0, y: -24, duration: .35, ease: 'power2.in', overwrite: true,
      onComplete: () => { fillPanel(id); panel.scrollTop = 0; G.set('#pnBody', { autoAlpha: 1, y: 0 }); introPanel(); }
    });
  };
  $('#pnClose').addEventListener('click', closePanel);
  $('#pnPrev').addEventListener('click', e => swapPanel(e.currentTarget.dataset.cat));
  $('#pnNext').addEventListener('click', e => swapPanel(e.currentTarget.dataset.cat));
  pnGrid.addEventListener('click', e => {
    const b = e.target.closest('.pc');
    if (b) openPM(b.dataset.sku, inCat(pnCat).map(p => p.sku));
  });
  $('#pnCta').addEventListener('click', e => {
    e.preventDefault();
    closePanel();
    scrollToEl($('#contact'), { immediate: true });
  });
  $$('.idx-row').forEach(row => {
    row.addEventListener('click', () => openPanel(row.dataset.cat));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(row.dataset.cat); } });
  });

  /* =========================================================
     Product view
     ========================================================= */
  const pm = $('#pm'), pmImg = $('#pmImg');
  let pmList = [], pmIdx = 0, pmViews = [], pmReturn = null, pmToken = 0;
  let hideCursor = () => {};   // set by the rail cursor (fine pointers only)

  const pmSetImg = v => {
    const token = ++pmToken;
    pmImg.classList.add('fade');
    const pre = new Image();
    pre.onload = pre.onerror = () => {
      if (token !== pmToken) return;
      setTimeout(() => {
        pmImg.src = v.src;
        pmImg.classList.toggle('cover', !!v.cover);
        requestAnimationFrame(() => pmImg.classList.remove('fade'));
      }, motion ? 160 : 0);
    };
    pre.src = v.src;
  };
  const pmRender = () => {
    const p = bySku[pmList[pmIdx]], c = catById[p.cat];
    // clean studio shot only — the catalogue's lifestyle photos are too low-resolution to show this large
    pmViews = [{ src: p.photo, cover: !!p.cover }];
    pmSetImg(pmViews[0]);
    pmImg.alt = p.name;
    $('#pmCode').textContent = p.sku;
    $('#pmCat').textContent = c.name;
    $('#pmName').textContent = p.name;
    $('#pmTag').textContent = p.tag;
    $('#pmDesc').textContent = p.desc;
    $('#pmFeats').innerHTML = c.feats.map((f, i) => `<li><span>${pad(i + 1)}</span>${esc(f)}</li>`).join('');
    $('#pmThumbs').innerHTML = pmViews.length > 1
      ? pmViews.map((v, i) => `<button type="button" class="${i ? '' : 'on'}" data-i="${i}" aria-label="${i ? 'Shown in use' : 'Product view'}"><img src="${v.src}" alt=""${v.cover ? ' class="cover"' : ''}></button>`).join('')
      : '';
    const multi = pmList.length > 1;
    $('#pmCount').textContent = multi ? `${pad(pmIdx + 1)} / ${pad(pmList.length)}` : '';
    $('#pmPrev').hidden = !multi;
    $('#pmNext').hidden = !multi;
    $('.pm-info').scrollTop = 0;
  };
  const pmIntro = (delay = 0) => {
    if (motion) G.fromTo($$('.pm-info > *'), { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, ease: 'expo.out', stagger: .045, delay, overwrite: true });
  };
  const openPM = (sku, list) => {
    pmList = list && list.length ? list : [sku];
    pmIdx = Math.max(0, pmList.indexOf(sku));
    pmRender();
    pmReturn = document.activeElement;
    hideCursor();
    pm.classList.add('open');
    pm.setAttribute('aria-hidden', 'false');
    ui.pm = true; syncLock();
    pmIntro(.12);
    setTimeout(() => $('#pmClose').focus({ preventScroll: true }), 60);
  };
  const closePM = () => {
    if (!ui.pm) return;
    ui.pm = false;
    pm.classList.remove('open');
    pm.setAttribute('aria-hidden', 'true');
    syncLock();
    if (pmReturn && pmReturn.focus) pmReturn.focus({ preventScroll: true });
  };
  const stepPM = d => { pmIdx = (pmIdx + d + pmList.length) % pmList.length; pmRender(); pmIntro(); };
  $('#pmClose').addEventListener('click', closePM);
  $('#pmPrev').addEventListener('click', () => stepPM(-1));
  $('#pmNext').addEventListener('click', () => stepPM(1));
  pm.addEventListener('click', e => { if (e.target === pm) closePM(); });
  $('#pmThumbs').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const i = +b.dataset.i;
    pmSetImg(pmViews[i]);
    $$('#pmThumbs button').forEach((x, k) => x.classList.toggle('on', k === i));
  });
  $('#pmEnquire').addEventListener('click', () => {
    const p = bySku[pmList[pmIdx]];
    setPicked({ kind: 'Selected style', label: `${p.sku} — ${p.name}`, img: p.photo, cover: p.cover });
    setCat(p.cat, true);
    goStep(1, { quiet: true });
    const fromPanel = ui.panel;
    closePM();
    if (fromPanel) { closePanel(); scrollToEl($('#contact'), { immediate: true }); }
    else scrollToEl($('#contact'));
  });

  document.addEventListener('keydown', e => {
    if (ui.pm) {
      if (e.key === 'Escape') closePM();
      else if (e.key === 'ArrowRight' && pmList.length > 1) stepPM(1);
      else if (e.key === 'ArrowLeft' && pmList.length > 1) stepPM(-1);
      return;
    }
    if (e.key !== 'Escape') return;
    if (ui.panel) closePanel();
    else if (ui.menu) setMenu(false);
  });

  /* ---------- signature styles rail: drag, buttons, progress ---------- */
  const rail = $('#sampleRail'), railBar = $('#railProgress');
  const railStep = () => { const it = rail.querySelector('.sample-item'); return it ? it.offsetWidth + 28 : 300; };
  const railUpdate = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const vis = Math.min(1, rail.clientWidth / rail.scrollWidth);
    const p = max > 0 ? rail.scrollLeft / max : 0;
    railBar.style.width = (vis * 100) + '%';
    railBar.style.transform = `translateX(${vis < 1 ? p * (1 / vis - 1) * 100 : 0}%)`;
  };
  let drag = null, dragged = false;
  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (motion) G.killTweensOf(rail);
    drag = { x: e.clientX, lx: e.clientX, v: 0, left: rail.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; rail.classList.add('dragging'); }
    if (drag.moved) { rail.scrollLeft = drag.left - dx; drag.v = e.clientX - drag.lx; drag.lx = e.clientX; }
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    if (drag.moved) {
      dragged = true; setTimeout(() => { dragged = false; }, 80);
      if (motion) G.to(rail, { scrollLeft: rail.scrollLeft - drag.v * 14, duration: 1.1, ease: 'expo.out' });
    }
    rail.classList.remove('dragging');
    drag = null;
  });
  rail.addEventListener('click', e => {
    if (dragged) { e.preventDefault(); return; }
    const it = e.target.closest('.sample-item');
    if (it) openPM(it.dataset.sku, SIGNATURE);
  });
  rail.addEventListener('scroll', railUpdate, { passive: true });
  window.addEventListener('resize', railUpdate);
  railUpdate();
  $('#railPrev').addEventListener('click', () => rail.scrollBy({ left: -railStep(), behavior: 'smooth' }));
  $('#railNext').addEventListener('click', () => rail.scrollBy({ left: railStep(), behavior: 'smooth' }));

  /* ---------- process: step counter (native scroll on small screens) ---------- */
  const pView = $('#processViewport'), pFill = $('#processFill'), stepCur = $('#stepCur');
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const setStep = p => {
    pFill.style.transform = `scaleX(${p})`;
    stepCur.textContent = roman[Math.min(5, Math.floor(p * 6))];
  };
  pView.addEventListener('scroll', () => {
    if (pView.classList.contains('pinned')) return;
    const max = pView.scrollWidth - pView.clientWidth;
    setStep(max > 0 ? pView.scrollLeft / max : 0);
  }, { passive: true });

  /* ---------- materials: image wipe per material ---------- */
  const matRows = $$('.mat-row'), matImgs = $$('#matVisual img'), matName = $('#matName'), matCount = $('#matCount');
  let matActive = -1, matZ = 1;
  const setMat = i => {
    if (i === matActive) return;
    const prev = matImgs[matActive], next = matImgs[i];
    matImgs.forEach(im => { if (im !== prev && im !== next) im.classList.remove('on', 'was'); });
    if (prev) { prev.classList.remove('on'); prev.classList.add('was'); }
    next.style.transition = 'none';
    next.classList.remove('on', 'was');
    void next.offsetWidth;
    next.style.transition = '';
    if (++matZ > 900) { matImgs.forEach(im => { im.style.zIndex = 1; }); if (prev) prev.style.zIndex = 2; matZ = 3; }
    next.style.zIndex = matZ;
    next.classList.add('on');
    matRows.forEach((r, k) => r.classList.toggle('active', k === i));
    matName.textContent = matRows[i].querySelector('h4').textContent;
    matCount.textContent = `${pad(i + 1)} / ${pad(matRows.length)}`;
    matActive = i;
  };
  matRows.forEach((r, i) => r.addEventListener('mouseenter', () => setMat(i)));
  setMat(0);

  /* =========================================================
     Enquiry — three short steps: product → details → contact
     ========================================================= */
  let picked = null;
  function setPicked(item) {
    picked = item;
    const box = $('#picked');
    if (!item) { box.classList.remove('show'); return; }
    $('#pkKind').textContent = item.kind;
    $('#pkName').textContent = item.label;
    $('#pkImg').innerHTML = item.img ? `<img src="${item.img}" alt=""${item.cover ? ' class="cover"' : ''}>` : '';
    box.classList.add('show');
  }
  $('#pkClear').addEventListener('click', () => setPicked(null));

  const qForm = $('#quoteForm'), qSteps = $$('.q-step', qForm), qProg = $$('.q-progress li', qForm);
  const qNext = $('#qNext'), qBack = $('#qBack'), qErr = $('#qErr');
  const q = { step: 0, cats: new Set(), qty: '', brand: new Set(), when: '' };
  const val = id => ($('#' + id).value || '').trim();

  $('#qCats').innerHTML = D.cats.map(c => `
    <button type="button" class="q-cat" data-cat="${c.id}" aria-pressed="false">
      <span class="q-cat-ph">${photo(bySku[REP[c.id]], '')}<span class="tick" aria-hidden="true">✓</span></span>
      <span class="q-cat-name">${esc(c.name)}</span>
    </button>`).join('');

  const setCat = (id, on) => {
    on = on === undefined ? !q.cats.has(id) : on;
    on ? q.cats.add(id) : q.cats.delete(id);
    $$(`[data-cat="${id}"]`, qForm).forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  };
  const setChip = (chip, on) => {
    const grp = chip.parentElement, name = grp.dataset.name, text = chip.textContent.trim();
    if (grp.hasAttribute('data-single')) {
      $$('.q-chip', grp).forEach(c => { const m = on && c === chip; c.classList.toggle('on', m); c.setAttribute('aria-pressed', m); });
      q[name] = on ? text : '';
      return;
    }
    if (on && (chip.hasAttribute('data-alone') || grp.querySelector('[data-alone].on'))) {
      // "Not sure yet" never sits alongside a specific choice
      $$('.q-chip', grp).forEach(c => { if (c !== chip) { c.classList.remove('on'); c.setAttribute('aria-pressed', false); } });
      q[name].clear();
    }
    chip.classList.toggle('on', on);
    chip.setAttribute('aria-pressed', on);
    on ? q[name].add(text) : q[name].delete(text);
  };
  qForm.addEventListener('click', e => {
    const cat = e.target.closest('[data-cat]');
    if (cat) { setCat(cat.dataset.cat); qErr.textContent = ''; return; }
    const chip = e.target.closest('.q-chips[data-name] .q-chip');
    if (chip) setChip(chip, !chip.classList.contains('on'));
  });

  function goStep(n, opts = {}) {
    const prev = q.step, box = $('.q-steps', qForm), h0 = box.offsetHeight;
    q.step = n;
    qSteps.forEach((st, i) => { const on = i === n; st.classList.toggle('on', on); st.inert = !on; });
    const h1 = box.offsetHeight;
    if (motion && h0 && h0 !== h1 && n !== prev) {
      box.classList.add('sizing');
      G.fromTo(box, { height: h0 }, { height: h1, duration: .7, ease: 'expo.inOut', overwrite: true,
        onComplete: () => { box.classList.remove('sizing'); G.set(box, { clearProps: 'height' }); } });
    }
    qProg.forEach((li, i) => { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); });
    $('#qBar').style.transform = `scaleX(${Math.min(1, (n + 1) / 3)})`;
    qBack.style.visibility = n > 0 && n < 3 ? 'visible' : 'hidden';
    $('.lbl', qNext).textContent = n === 2 ? 'Send enquiry' : 'Continue';
    qForm.classList.toggle('is-done', n === 3);
    qErr.textContent = '';
    if (n === prev && !opts.force) return;
    if (motion) G.fromTo(qSteps[n].children, { y: n >= prev ? 26 : -26, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: .75, ease: 'expo.out', stagger: .045, overwrite: true });
    if (opts.quiet) return;
    // a long step can hand over to a short one: keep the top of the card in view
    if (qForm.getBoundingClientRect().top < 70) scrollToEl(qForm, { offset: -100 });
    const t = $('.q-title', qSteps[n]);
    if (t) t.focus({ preventScroll: true });
  }

  const problem = () => {
    if (q.step === 0 && !q.cats.size) return 'Choose at least one product — or “Something custom”.';
    if (q.step === 2) {
      if (!val('name')) { $('#name').focus(); return 'Please add your name.'; }
      if (!val('email') && !val('phone')) { $('#email').focus(); return 'Add an email or a phone number so we can reply.'; }
      if (val('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) { $('#email').focus(); return 'That email doesn’t look quite right.'; }
    }
    return '';
  };
  const catNames = () => [...q.cats].map(id => id === 'custom' ? 'Custom design' : catById[id].name);
  const compose = () => {
    const lines = ['Hello BE YOU, I would like a quote.'];
    if (picked) lines.push(`${picked.kind}: ${picked.label}`);
    if (q.cats.size) lines.push(`Products: ${catNames().join(', ')}`);
    if (q.qty) lines.push(`Quantity: ${q.qty}`);
    if (q.brand.size) lines.push(`Branding: ${[...q.brand].join(', ')}`);
    if (q.when) lines.push(`Needed by: ${q.when}`);
    [['name', 'Name'], ['company', 'Company'], ['email', 'Email'], ['phone', 'Phone']]
      .forEach(([id, label]) => { if (val(id)) lines.push(`${label}: ${val(id)}`); });
    if (val('notes')) lines.push('', val('notes'));
    return 'https://wa.me/919594441593?text=' + encodeURIComponent(lines.join('\n'));
  };
  const finish = () => {
    const first = val('name').split(/\s+/)[0];
    $('#qName').textContent = first ? `, ${first}` : '';
    const rows = [];
    if (picked) rows.push([picked.kind === 'Selected style' ? 'Style' : 'Design', picked.label]);
    rows.push(['Products', catNames().join(', ')]);
    if (q.qty) rows.push(['Quantity', q.qty]);
    if (q.brand.size) rows.push(['Branding', [...q.brand].join(', ')]);
    if (q.when) rows.push(['Needed by', q.when]);
    rows.push(['Reply to', [val('email'), val('phone')].filter(Boolean).join(' · ')]);
    $('#qSummary').innerHTML = rows.map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join('');
    $('#qWa').href = compose();
    goStep(3);
  };
  qForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = problem();
    qErr.textContent = msg;
    if (msg) { if (motion) G.fromTo(qErr, { x: -8 }, { x: 0, duration: .6, ease: 'elastic.out(1, .35)' }); return; }
    if (q.step < 2) goStep(q.step + 1); else finish();
  });
  qBack.addEventListener('click', () => { if (q.step > 0 && q.step < 3) goStep(q.step - 1); });
  qForm.addEventListener('input', () => { qErr.textContent = ''; });

  const attach = $('#qAttach'), attachName = $('#fileName'), attachHint = attachName.textContent;
  const resetAttach = () => { $('#ref').value = ''; attach.classList.remove('has-file'); attachName.textContent = attachHint; };
  $('#ref').addEventListener('change', e => {
    const f = e.target.files[0];
    attach.classList.toggle('has-file', !!f);
    attachName.textContent = f ? f.name : attachHint;
  });
  $('#qRestart').addEventListener('click', () => {
    [...q.cats].forEach(id => setCat(id, false));
    $$('.q-chips[data-name] .q-chip.on', qForm).forEach(c => setChip(c, false));
    ['notes', 'name', 'company', 'email', 'phone'].forEach(id => { $('#' + id).value = ''; });
    resetAttach();
    setPicked(null);
    goStep(0);
  });
  goStep(0, { quiet: true, force: true });

  /* =========================================================
     Personalisation preview
     ========================================================= */
  const stage = $('#stage');
  const studio = stage && window.BYStudio && window.BYStudio.create({
    canvas: $('#studioCanvas'), stage,
    onState: s => {
      $('#specLine').textContent = `${s.finishName} · ${s.leatherName}`;
      $('#leatherName').textContent = s.leatherName;
      $$('#optFinish button').forEach(b => b.classList.toggle('on', b.dataset.v === s.finish));
      $$('#optLeather button').forEach(b => b.classList.toggle('on', b.dataset.v === s.leather));
    },
  });
  if (studio) {
    if (!fine) $('#stageHint').textContent = 'Drag across the leather to catch the light';
    const mkText = $('#mkText');
    if (brand) mkText.value = brand;
    studio.apply({ text: mkText.value.trim() || 'YOUR BRAND', finish: params.get('finish'), leather: params.get('leather'), font: 'classic', object: 'folio' });
    mkText.addEventListener('input', () => studio.set('text', mkText.value.trim() || 'YOUR BRAND'));
    $$('#optFinish button').forEach(b => b.addEventListener('click', () => studio.set('finish', b.dataset.v)));
    $$('#optLeather button').forEach(b => b.addEventListener('click', () => studio.set('leather', b.dataset.v)));

    const fileIn = $('#mkFile'), drop = $('#logoDrop'), logoName = $('#logoName'), hint = logoName.textContent;
    fileIn.addEventListener('change', () => {
      const f = fileIn.files[0];
      if (!f) return;
      if (f.size > 8 * 1024 * 1024) { logoName.textContent = 'That file is over 8 MB — try a smaller PNG or SVG'; return; }
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          if (studio.setLogo(im, f.name)) { drop.classList.add('has-file'); logoName.textContent = f.name; }
          else logoName.textContent = 'We couldn’t read a mark from that image — try a PNG with a transparent background';
        };
        im.onerror = () => { logoName.textContent = 'That file couldn’t be opened as an image'; };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
      fileIn.value = '';
    });
    $('#mkClear').addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      studio.setLogo(null);
      drop.classList.remove('has-file');
      logoName.textContent = hint;
    });
    $('#dlMock').addEventListener('click', () => {
      const s = studio.state, card = studio.exportCard();
      const name = `BE-YOU-preview-${(s.logo ? 'logo' : s.text || 'brand').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
      card.toBlob(b => {
        if (!b) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, 'image/png');
    });
    $('#mkEnquire').addEventListener('click', e => {
      e.preventDefault();
      const s = studio.state;
      let img = '';
      try { img = studio.thumb(200).toDataURL('image/jpeg', .86); } catch (err) {}
      setPicked({ kind: 'Personalisation preview', label: `${s.logo ? 'Your logo' : s.text} — ${s.finishName}, ${s.leatherName} leather`, img, cover: true });
      setCat('documents', true);
      const want = ['gold', 'silver', 'rose'].includes(s.finish) ? 'Foil stamping' : 'Deboss / emboss';
      const chip = $$('.q-chips[data-name="brand"] .q-chip', qForm).find(c => c.textContent.trim() === want);
      if (chip && !chip.classList.contains('on')) setChip(chip, true);
      const notes = $('#notes');
      if (!notes.value.trim()) notes.value = `${s.finishName} on ${s.leatherName.toLowerCase()} leather`;
      goStep(1, { quiet: true });
      scrollToEl($('#contact'));
    });
    // press the mark in the first time the stage comes into view
    const pressIO = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      studio.boot.then(() => studio.press(0));
      pressIO.disconnect();
    }, { threshold: .35 });
    pressIO.observe(stage);
  }

  if (!motion) { root.classList.add('pl-done'); return; }

  /* =========================================================
     Motion layer — GSAP + ScrollTrigger + Lenis
     ========================================================= */
  G.registerPlugin(ST);
  root.classList.add('gsap');

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (window.Lenis) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- split helpers ---------- */
  const splitWords = el => {
    const words = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'), wi = document.createElement('span');
            w.className = 'w'; wi.className = 'wi'; wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w); words.push(wi);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return words;
  };
  const splitChars = el => {
    const chars = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach(ch => {
            if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(' ')); return; }
            const c = document.createElement('span'), ci = document.createElement('span');
            c.className = 'c'; ci.className = 'ci'; ci.textContent = ch;
            c.appendChild(ci); frag.appendChild(c); chars.push(ci);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return chars;
  };

  /* ---------- preloader → hero intro ---------- */
  const plChars = splitChars($('#plWord'));
  const plCount = $('#plCount'), plFill = $('#plFill');
  const heroWords = splitWords($('.hero-title'));
  const heroFade = ['.hero-kicker', '.hero .sub', '.hero-ctas', '.hero-foot'];
  G.set(heroWords, { yPercent: 115 });
  G.set('.hero-media', { clipPath: 'inset(0% 0% 100% 0%)' });
  G.set('.hero-media img', { scale: 1.3 });
  G.set(heroFade, { autoAlpha: 0, y: 30 });
  G.set(nav, { yPercent: -100, autoAlpha: 0 });

  const counter = { v: 0 };
  const loaded = new Promise(res => document.readyState === 'complete' ? res() : window.addEventListener('load', res, { once: true }));
  const pl = G.timeline();
  pl.from(plChars, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .05 })
    .to(counter, {
      v: 100, duration: 1.7, ease: 'power2.inOut',
      onUpdate: () => {
        plCount.textContent = String(Math.round(counter.v)).padStart(3, '0');
        plFill.style.transform = `scaleX(${counter.v / 100})`;
      }
    }, .1);

  Promise.all([pl.then(), Promise.race([loaded, new Promise(r => setTimeout(r, 2600))])]).then(() => {
    G.timeline({ onComplete: () => { root.classList.add('pl-done'); ST.refresh(); } })
      .to(plChars, { yPercent: -110, duration: .7, ease: 'expo.in', stagger: .03 })
      .to('#preloader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=.25')
      .add(() => { syncLock(); }, '-=.3')
      .to('.hero-media', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' }, '-=.75')
      .to('.hero-media img', { scale: 1, duration: 2.2, ease: 'expo.out' }, '<.25')
      .to(heroWords, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .08 }, '<.1')
      .to(heroFade, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }, '<.35')
      .to(nav, { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, '<');
  });

  /* ---------- hero scroll parallax ---------- */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  G.to('.hero-media .px', { yPercent: 14, ease: 'none', scrollTrigger: heroST });
  G.to('.hero-inner', { yPercent: -16, autoAlpha: .15, ease: 'none', scrollTrigger: { ...heroST } });

  /* ---------- process: pinned horizontal scroll (desktop) ---------- */
  G.matchMedia().add('(min-width: 901px) and (min-height: 600px)', () => {
    const sec = $('#process'), track = $('#processTrack');
    pView.classList.add('pinned');
    pView.scrollLeft = 0;
    const dist = () => Math.max(0, track.scrollWidth - pView.clientWidth);
    const tween = G.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1,
        invalidateOnRefresh: true, anticipatePin: 1, onUpdate: self => setStep(self.progress)
      }
    });
    $$('.p-card', track).forEach(card => {
      const img = card.querySelector('.p-media img'), big = card.querySelector('.p-big');
      const inView = { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true };
      if (img) G.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: inView });
      if (big) G.fromTo(big, { xPercent: 45 }, { xPercent: -45, ease: 'none', scrollTrigger: { ...inView } });
    });
    return () => pView.classList.remove('pinned');
  });

  /* ---------- marquee: follows scroll direction, speeds up with velocity ---------- */
  $$('.marquee-track').forEach(track => {
    const tw = G.to(track, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
    tw.totalTime(60 * 60);
    ST.create({
      trigger: track.parentElement, start: 'top bottom', end: 'bottom top',
      onUpdate: self => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 6);
        G.to(tw, { timeScale: boost * self.direction, duration: .2, overwrite: true });
        G.to(tw, { timeScale: self.direction, duration: 1.2, delay: .25 });
      }
    });
  });

  /* ---------- scroll reveals ---------- */
  const reveal = (targets, trigger, vars = {}) => G.from(targets, {
    y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity,visibility',
    scrollTrigger: { trigger, start: 'top 88%' }, ...vars
  });
  $$('main [data-split]').forEach(el => {
    G.from(splitWords(el), { yPercent: 115, duration: 1.25, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('main section:not(.hero) .kicker').forEach(k => reveal(k, k, { y: 16 }));
  $$('main [data-reveal]').forEach(el => reveal(el, el));
  $$('main [data-stagger]').forEach(g => reveal(g.children, g, { y: 30, stagger: .06, duration: 1 }));
  $$('.sample-item').forEach((el, i) => reveal(el, rail, { y: 60, delay: Math.min(i, 5) * .08, duration: 1.3 }));
  reveal('.st-stage', '.st-stage', { y: 60, duration: 1.4 });

  /* image frames: curtain wipe + settle */
  $$('.clip').forEach(el => {
    G.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } })
      .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .from(el.querySelector('img'), { scale: 1.35, duration: 2.2, ease: 'expo.out' }, '<.2');
  });
  /* parallax layers */
  $$('[data-px]').forEach(el => {
    const a = parseFloat(el.dataset.px) || 7;
    G.fromTo(el, { yPercent: -a }, { yPercent: a, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* about: statement lights up word by word */
  G.fromTo(splitWords($('#aboutLead')), { opacity: .14 }, {
    opacity: 1, stagger: .1, ease: 'none',
    scrollTrigger: { trigger: '#aboutLead', start: 'top 82%', end: 'bottom 48%', scrub: true }
  });

  /* stats count up */
  $$('.stat-list .num').forEach(el => {
    const m = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!m) return;
    const o = { v: 0 }, end = +m[1], suffix = m[2];
    el.textContent = '0' + suffix;
    G.to(o, {
      v: end, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => { el.textContent = Math.round(o.v) + suffix; }
    });
  });

  /* materials follow the scroll position too */
  matRows.forEach((r, i) => ST.create({ trigger: r, start: 'top 60%', end: 'bottom 60%', onToggle: self => self.isActive && setMat(i) }));

  /* footer wordmark rises letter by letter */
  G.from(splitChars($('#footGiant')), { yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '#footGiant', start: 'top 95%' } });

  /* ---------- pointer-only flourishes ---------- */
  if (fine) {
    /* floating product on the collection index: follows the pointer, tilts in 3D
       with its motion, and flips like a card deck when the category changes */
    root.classList.add('has-preview');
    const list = $('#indexList'), pv = $('#idxPreview'), tilt = $('.pv-tilt', pv), pimgs = $$('img', pv), rows = $$('.idx-row', list);
    const px = G.quickTo(pv, 'x', { duration: .7, ease: 'power3' });
    const py = G.quickTo(pv, 'y', { duration: .7, ease: 'power3' });
    const ry = G.quickTo(tilt, 'rotationY', { duration: .9, ease: 'power3' });
    const rx = G.quickTo(tilt, 'rotationX', { duration: .9, ease: 'power3' });
    const rz = G.quickTo(tilt, 'rotation', { duration: .9, ease: 'power3' });
    let lx = 0, ly = 0, settle, shown = -1;
    const level = () => { ry(0); rx(0); rz(0); };
    const showPiece = i => {
      if (i === shown) return;
      const dir = i > shown ? 1 : -1, prev = pimgs[shown], next = pimgs[i];
      if (prev) G.to(prev, { rotationX: 72 * dir, yPercent: -16 * dir, autoAlpha: 0, duration: .42, ease: 'power2.in', overwrite: true });
      G.fromTo(next, { rotationX: -72 * dir, yPercent: 16 * dir, autoAlpha: 0 },
        { rotationX: 0, yPercent: 0, autoAlpha: 1, duration: .8, ease: 'expo.out', delay: prev ? .06 : 0, overwrite: true });
      shown = i;
    };
    list.addEventListener('mouseenter', e => {
      G.set(pv, { x: e.clientX, y: e.clientY });
      lx = e.clientX; ly = e.clientY;
      G.to(pv, { autoAlpha: 1, scale: 1, duration: .6, ease: 'expo.out', overwrite: 'auto' });
    });
    list.addEventListener('mouseleave', () => G.to(pv, { autoAlpha: 0, scale: .6, duration: .5, ease: 'expo.out', overwrite: 'auto' }));
    list.addEventListener('mousemove', e => {
      px(e.clientX); py(e.clientY);
      const dx = e.clientX - lx, dy = e.clientY - ly;
      ry(G.utils.clamp(-34, 34, dx * 1.2));
      rx(G.utils.clamp(-24, 24, -dy * .9));
      rz(G.utils.clamp(-5, 5, dx * .12));
      lx = e.clientX; ly = e.clientY;
      clearTimeout(settle); settle = setTimeout(level, 110);
    });
    list.addEventListener('click', () => G.to(pv, { autoAlpha: 0, scale: .6, duration: .4, ease: 'expo.out', overwrite: 'auto' }));
    rows.forEach((r, i) => r.addEventListener('mouseenter', () => showPiece(i)));

    /* brass "View" / "Drag" cursor — on the Signature styles rail only */
    const cur = $('#cursor'), curLabel = $('#cursorLabel');
    const cx = G.quickTo(cur, 'x', { duration: .35, ease: 'power3' });
    const cy = G.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    hideCursor = () => cur.classList.remove('on', 'label');
    const railCursor = e => {
      cx(e.clientX); cy(e.clientY);
      curLabel.textContent = e.target.closest('.sample-item') && !rail.classList.contains('dragging') ? 'View' : 'Drag';
      cur.classList.add('on', 'label');
    };
    rail.addEventListener('mouseenter', e => { G.set(cur, { x: e.clientX, y: e.clientY }); railCursor(e); });
    rail.addEventListener('mousemove', railCursor);
    rail.addEventListener('mouseleave', hideCursor);
    window.addEventListener('scroll', () => { if (!rail.matches(':hover')) hideCursor(); }, { passive: true });

    /* magnetic buttons */
    $$('[data-magnetic]').forEach(el => {
      const mx = G.quickTo(el, 'x', { duration: .9, ease: 'elastic.out(1, .45)' });
      const my = G.quickTo(el, 'y', { duration: .9, ease: 'elastic.out(1, .45)' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .22);
        my((e.clientY - r.top - r.height / 2) * .32);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* keep trigger positions honest once fonts and images settle */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
  window.addEventListener('load', () => ST.refresh());
})();
