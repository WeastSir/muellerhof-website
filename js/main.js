(function() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const isTransparentStart = nav.classList.contains('transparent');
  function onScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
      if (isTransparentStart) nav.classList.remove('transparent');
    } else {
      nav.classList.remove('scrolled');
      if (isTransparentStart) nav.classList.add('transparent');
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
