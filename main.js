/* ASTRION — Grid Nightwatch
   Boot sequence: Lenis + GSAP defaults + matchMedia (responsivo/reduced-motion),
   reveals, headline reveal mascarado, rail de pulso (assinatura), parallax duotone,
   nav condensante + menu mobile, CTAs magnéticas. */

document.documentElement.classList.add('has-js');

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 0. Vídeos de fundo do hero — carrossel com crossfade (wind → offshore → nightwatch).
   Pausa sob reduced-motion / mobile (dados/bateria) / aba oculta. */
const heroVideos = Array.from(document.querySelectorAll('[data-hero-video]'));
const HERO_HOLD_MS = 12000;
const skipHeroVideo = reduced || matchMedia('(max-width: 899px)').matches;
if (heroVideos.length) {
  if (skipHeroVideo) {
    heroVideos.forEach((v) => {
      v.pause();
      v.querySelectorAll('source').forEach((s) => s.remove());
      v.load();
    });
  } else {
    let current = 0;
    const first = heroVideos[0];
    first.addEventListener('playing', () => {
      first.classList.add('is-active');
      first.closest('[data-hero-bg]')?.classList.add('video-ready');
    }, { once: true });
    first.play().catch(() => {});

    setInterval(() => {
      if (document.hidden) return;
      const prev = heroVideos[current];
      current = (current + 1) % heroVideos.length;
      const next = heroVideos[current];
      next.currentTime = 0;
      next.play().then(() => {
        next.classList.add('is-active');
        prev.classList.remove('is-active');
        setTimeout(() => prev.pause(), 1400);
      }).catch(() => { current = heroVideos.indexOf(prev); });
    }, HERO_HOLD_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) heroVideos.forEach((v) => v.pause());
      else heroVideos[current].play().catch(() => {});
    });
  }
}

/* 1. Smooth scroll — relógio único com GSAP */
let lenis;
if (!reduced) {
  lenis = new Lenis({ autoRaf: false, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* 2. Nav que condensa */
const nav = document.querySelector('[data-nav]');
ScrollTrigger.create({
  start: 80,
  onEnter: () => nav.classList.add('is-scrolled'),
  onLeaveBack: () => nav.classList.remove('is-scrolled'),
});

/* 2b. Menu mobile */
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = document.querySelector('[data-nav-links]');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    })
  );
}

/* 3. Tudo que anima vive num matchMedia */
const mm = gsap.matchMedia();
mm.add(
  { isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)', reduce: '(prefers-reduced-motion: reduce)' },
  ({ conditions: { isDesktop, reduce } }) => {
    if (reduce) {
      gsap.set('[data-reveal]', { opacity: 1, y: 0 });
      return;
    }

    /* reveals simples, em lote */
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, stagger: 0.1, overwrite: true }),
      once: true,
    });

    /* headlines: reveal de linhas mascarado */
    document.querySelectorAll('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
        },
      });
    });

    /* parallax interno de imagem duotone clipada */
    document.querySelectorAll('[data-parallax] img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: img.closest('[data-parallax]'), start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    /* efeito interativo: o vídeo do hero reage sutilmente ao mouse (janela para dentro da cena) */
    if (isDesktop) {
      const heroBg = document.querySelector('[data-hero-bg]');
      const heroSection = document.querySelector('.hero');
      if (heroBg && heroSection) {
        const xTo = gsap.quickTo(heroBg, 'x', { duration: 1.1, ease: 'power3' });
        const yTo = gsap.quickTo(heroBg, 'y', { duration: 1.1, ease: 'power3' });
        heroSection.addEventListener('mousemove', (e) => {
          const r = heroSection.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          xTo(nx * -26);
          yTo(ny * -16);
        });
        heroSection.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
      }
    }

    /* esteira de parceiros (conteúdo duplicado no HTML → wrap seamless em -50%) */
    const marquee = document.querySelector('[data-marquee]');
    if (marquee) {
      const tween = gsap.to(marquee, { xPercent: -50, repeat: -1, ease: 'none', duration: 32 });
      marquee.addEventListener('mouseenter', () => tween.timeScale(0.25));
      marquee.addEventListener('mouseleave', () => tween.timeScale(1));
    }

    /* botões magnéticos (desktop apenas) */
    if (isDesktop) {
      document.querySelectorAll('.magnetic').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.3);
          yTo((e.clientY - r.top - r.height / 2) * 0.3);
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.3)' });
        });
      });
    }

    /* ELEMENTO ASSINATURA — trilho de pulso que percorre a página com o scroll */
    if (isDesktop) {
      const main = document.querySelector('main');
      const pulse = document.querySelector('[data-rail-pulse]');
      if (main && pulse) {
        gsap.set(pulse, { top: 0 });
        ScrollTrigger.create({
          trigger: main,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          onUpdate(self) {
            const travel = main.offsetHeight - pulse.offsetHeight;
            gsap.set(pulse, { top: self.progress * travel });
          },
        });
      }
    }
  }
);

/* 4. Refresh após fontes (evita medidas erradas de split/pin) */
document.fonts.ready.then(() => ScrollTrigger.refresh());
