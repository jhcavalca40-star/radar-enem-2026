(() => {
  'use strict';

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const radar = document.getElementById('brandRadar');
  const motionToggle = document.getElementById('radarMotionToggle');
  const navs = [...document.querySelectorAll('.radar-section-nav')];
  let manuallyPaused = false;
  let visible = false;
  let scheduled = false;

  function sweepState() {
    const allowSweep = !manuallyPaused && !preference.matches;
    radar.dataset.running = String(allowSweep && visible && !document.hidden);
    motionToggle.disabled = preference.matches;
    motionToggle.lastElementChild.textContent = preference.matches ? 'Movimento reduzido' :
      allowSweep ? 'Pausar varredura' : 'Retomar varredura';
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sweepState();
  }, {threshold:0});
  observer.observe(radar.closest('.brand-cover'));
  motionToggle.addEventListener('click', () => { manuallyPaused = !manuallyPaused; sweepState(); });
  preference.addEventListener('change', sweepState);
  document.addEventListener('visibilitychange', sweepState);
  sweepState();

  function navigation() {
    scheduled = false;
    const activeNav = navs.find(nav => !nav.closest('.radar-panel').hidden);
    const panel = activeNav.closest('.radar-panel');
    const dock = activeNav.closest('.radar-dock');
    const height = Math.ceil(dock.getBoundingClientRect().height);
    const px = `${height}px`;
    if (panel.style.getPropertyValue('--radar-nav-height') !== px) panel.style.setProperty('--radar-nav-height',px);
    const links = [...activeNav.querySelectorAll('a')];
    let current = null;
    let lastTop = -Infinity;
    for (const link of links) {
      const section = document.getElementById(link.hash.slice(1));
      const top = section.getBoundingClientRect().top;
      if (top <= Math.max(0,parseFloat(getComputedStyle(dock).top)) + height + 40 && top > lastTop) {
        current = link;
        lastTop = top;
      }
    }
    const previous = activeNav.querySelector('[aria-current]');
    if (current === previous) return;
    previous?.removeAttribute('aria-current');
    if (!current) return;
    current.setAttribute('aria-current','location');
    const navBox = activeNav.getBoundingClientRect(), box = current.getBoundingClientRect();
    if (box.left < navBox.left) activeNav.scrollLeft -= navBox.left - box.left + 4;
    if (box.right > navBox.right) activeNav.scrollLeft += box.right - navBox.right + 4;
  }

  function updateNavigation() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(navigation); }
  }
  const resize = new ResizeObserver(updateNavigation);
  navs.forEach(nav => resize.observe(nav.closest('.radar-dock')));
  window.addEventListener('scroll',updateNavigation,{passive:true});
  window.addEventListener('resize',updateNavigation,{passive:true});
  updateNavigation();

  const entering = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entering.unobserve(entry.target);
      if (!preference.matches) entry.target.animate(
        [{opacity:.7,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:235,easing:'ease-out'}
      );
    }
  });
  document.querySelectorAll('.radar-panel > section > .section-head').forEach(head => entering.observe(head));

  function barKey(fill) {
    const row=fill.closest('.row'), d=row.dataset;
    return d.chartField ? `${d.chartField}|${d.chartValue}` : `${d.comparisonBank}|${d.comparisonExam}`;
  }

  function renderBars(container, html) {
    const box = container.getBoundingClientRect();
    const animate = !preference.matches && box.height > 0 && box.top < innerHeight && box.bottom > 0;
    const previous = new Map();
    if (animate) {
      container.querySelectorAll('.fill').forEach(fill => {
        const trackWidth = fill.parentElement.clientWidth;
        if (trackWidth) previous.set(barKey(fill), `${fill.getBoundingClientRect().width / trackWidth * 100}%`);
      });
    }
    container.innerHTML = html;
    if (!animate) return;
    container.querySelectorAll('.fill').forEach(fill => {
      const box = fill.closest('.row').getBoundingClientRect();
      if (!box.height || box.top > innerHeight || box.bottom < 0) return;
      const width = fill.style.width, before = previous.get(barKey(fill)) || '0%';
      if (Math.abs(parseFloat(width) - parseFloat(before)) > .8) {
        fill.animate([{width:before},{width}],{duration:330,easing:'cubic-bezier(.2,.72,.3,1)'});
      }
    });
  }

  function changeArea() {
    if (!manuallyPaused && !preference.matches) {
      radar.getAnimations?.({subtree:true}).forEach(animation => { animation.currentTime = 0; });
    }
    updateNavigation();
  }

  window.radarMotion = {renderBars,changeArea,updateNavigation};
})();
