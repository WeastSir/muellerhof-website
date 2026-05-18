/* Nav-Verhalten */
(function() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const isTransparent = nav.classList.contains('transparent');
  function onScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
      if (isTransparent) nav.classList.remove('transparent');
    } else {
      nav.classList.remove('scrolled');
      if (isTransparent) nav.classList.add('transparent');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
  }
})();

/* Speisekarte Flyer Blättern */
(function() {
  const pages = document.querySelectorAll('.flyer .page');
  if (pages.length === 0) return;

  const total = pages.length;
  let current = 1;
  const prevBtn = document.getElementById('flyerPrev');
  const nextBtn = document.getElementById('flyerNext');
  const indicator = document.getElementById('flyerIndicator');
  const chapterLinks = document.querySelectorAll('.chapter-link');

  function show(n) {
    if (n < 1) n = 1;
    if (n > total) n = total;
    current = n;
    pages.forEach(p => p.classList.remove('active'));
    const page = document.querySelector(`.flyer .page[data-page="${n}"]`);
    if (page) page.classList.add('active');
    if (indicator) indicator.innerHTML = `<strong>${n}</strong> / ${total}`;
    if (prevBtn) prevBtn.disabled = (n === 1);
    if (nextBtn) nextBtn.disabled = (n === total);
    chapterLinks.forEach(l => {
      l.classList.toggle('active', parseInt(l.dataset.page) === n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => show(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => show(current + 1));
  chapterLinks.forEach(l => {
    l.addEventListener('click', () => show(parseInt(l.dataset.page)));
  });

  // Tasten links/rechts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  show(1);
})();
