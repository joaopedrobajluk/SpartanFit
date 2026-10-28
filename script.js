// ====== LENIS + GSAP INTEGRATION ======
const availableGsapPlugins = [
  typeof ScrollTrigger !== 'undefined' ? ScrollTrigger : null,
  typeof SplitText !== 'undefined' ? SplitText : null,
  typeof CustomEase !== 'undefined' ? CustomEase : null,
  typeof Draggable !== 'undefined' ? Draggable : null,
  typeof InertiaPlugin !== 'undefined' ? InertiaPlugin : null
].filter(Boolean);

if (typeof gsap === 'undefined') {
  document.getElementById('preloader')?.remove();
  throw new Error('GSAP não carregou; o conteúdo foi liberado sem as animações.');
}

gsap.registerPlugin(...availableGsapPlugins);
gsap.config({ trialWarn: false });

const lenis = new Lenis({ duration: 1.2, smoothWheel: true, lerp: 0.08 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const headerEl = document.getElementById('header');

// ====== PRELOADER LOGIC (TRANSIÇÃO PARA O HEADER) ======
const preloader = document.getElementById("preloader");
const preloaderBg = document.querySelector(".preloader__bg");
const preloaderLogo = document.querySelector(".preloader__logo");
const preloaderPercent = document.querySelector(".preloader__percent");
const headerLogoImg = document.querySelector(".header__logo-img");
const wavePath = document.getElementById("wavePath");

// Posição inicial da onda
gsap.set(wavePath, { y: 160 });

// Movimento contínuo horizontal da onda
gsap.to(wavePath, {
  x: -100,
  duration: 1.8,
  repeat: -1,
  ease: "sine.inOut"
});

// Esconde os itens do menu inicialmente para eles descerem depois.
gsap.set(headerLogoImg, { opacity: 0 });
gsap.set('.header__menu-item, .header__menu-toggle', { y: -120 });

// Configurações iniciais da tela
lenis.stop();
gsap.set("#hero-title", { opacity: 0 });
gsap.set([".subtitle", ".home-hero__button"], { opacity: 0, x: -150 });
gsap.set(".scroll-indicator", { opacity: 0, x: 150 });

// Timeline que controla a subida da onda e o percentual
const loadTl = gsap.timeline({
  onComplete: () => setTimeout(finish, 200)
});

// Duração do preenchimento (queda) da logo reduzida de 2.5s para 1.6s
loadTl.to(wavePath, {
  y: -220,
  duration: 1.6, 
  ease: "power1.inOut", 
  onUpdate: () => {
    const currentY = gsap.getProperty(wavePath, "y");
    const progress = (160 - currentY) / 380 * 100;
    preloaderPercent.textContent = Math.round(progress) + "%";
  }
});

function finish() {
  gsap.to(preloaderPercent, { opacity: 0, y: 10, duration: 0.3, ease: "power2.out" });

  // 1. Garante que a logo real do header está escondida para medirmos a posição
  gsap.set(headerLogoImg, { y: 0, opacity: 0 });

  const preRect = preloaderLogo.getBoundingClientRect();
  const headerRect = headerLogoImg.getBoundingClientRect();

  const deltaX = (headerRect.left + headerRect.width / 2) - (preRect.left + preRect.width / 2);
  const deltaY = (headerRect.top + headerRect.height / 2) - (preRect.top + preRect.height / 2);
  const scale = headerRect.height / preRect.height;

  const headerHeight = headerEl.offsetHeight || 80;

  gsap.set(preloaderBg, { 
    top: 0, 
    bottom: "auto", 
    height: window.innerHeight, 
    boxShadow: "0 15px 40px rgba(0,0,0,0.5)" 
  });

  const revealTl = gsap.timeline({
    onStart: () => { lenis.start(); initScrollAnims(); },
    onComplete: () => {
      preloader.style.pointerEvents = 'none';
    }
  });

  // 2. Logo voa para o cabeçalho.
  revealTl.to(preloaderLogo, {
    x: deltaX,
    y: deltaY,
    scale: scale,
    duration: 0.8, 
    ease: "power3.inOut",
    transformOrigin: "50% 50%"
  }, 0.05);

  // 3. A tela começa a subir um pouco antes da logo terminar
  revealTl.to(preloaderBg, {
    height: headerHeight,
    duration: 1.15, 
    ease: "power3.inOut"
  }, "-=0.3");

  // 4. A tela faz fade out (some de vez).
  revealTl.to(preloaderBg, {
    opacity: 0,
    duration: 0.35,
    ease: "power1.out"
  });

  // 5. AGORA SIM trocamos as logos
  revealTl.add(() => {
    gsap.set(preloaderLogo, { opacity: 0, display: 'none' });
    gsap.set(headerLogoImg, { opacity: 1, x: 0, y: 0, scale: 1 });
  });

  // 6. As informações do menu vêm de cima
  revealTl.to('.header__menu-item, .header__menu-toggle', {
    y: 0,
    duration: 0.9,
    ease: "power2.out",
    stagger: 0.08
  }, "-=0.25");

  // 7. Inicia as animações do conteúdo do site
  revealTl.add(() => initGsapBlocks());
}

// ====== HEADER SCROLL EFFECT & BACK BUTTON BEHAVIOR ======
let lastScrollY = 0;
let scrollTimeout = null;

lenis.on('scroll', (e) => {
  const scrollY = e.scroll || 0;
  if (scrollY > 50) headerEl.classList.add('is-scrolled');
  else headerEl.classList.remove('is-scrolled');

  const activeBackBtn = document.querySelector('.page-content.active .btn-back-auth--fixed');
  if (activeBackBtn && activeBackBtn.id !== 'quizBackToHomeBtn') {
    if (scrollY <= 50) {
      gsap.to(activeBackBtn, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    } else {
      if (scrollY > lastScrollY + 5) {
        gsap.to(activeBackBtn, { y: -150, opacity: 1, duration: 0.4, ease: 'power3.out' });
      } else if (scrollY < lastScrollY - 5) {
        gsap.to(activeBackBtn, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
      }
    }
  }
  
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (activeBackBtn && scrollY > 50 && activeBackBtn.id !== 'quizBackToHomeBtn') {
      gsap.to(activeBackBtn, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    }
  }, 150);

  lastScrollY = scrollY;
});

// ====== MENU TOGGLE ======
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('mobile-menu-isopen');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) lenis.stop(); else lenis.start();
  });
}

// ====== SPA TRANSITION SYSTEM (APENAS VERMELHO) ======
const transitionLayer2 = document.getElementById("transitionLayer2");
const transitionBrand = document.getElementById("transitionBrand");
const pageScrollPositions = {};

function saveScrollPosition(pageId, scrollValue) {
  try {
    sessionStorage.setItem(`spartan_scroll_${pageId}`, String(Math.round(scrollValue || 0)));
  } catch (e) {}
}

function getSavedScrollPosition(pageId) {
  try {
    const stored = sessionStorage.getItem(`spartan_scroll_${pageId}`);
    return stored ? Number(stored) : 0;
  } catch (e) {
    return 0;
  }
}

function setActivePage(targetId) {
  document.querySelectorAll('.page-content').forEach(p => {
    p.classList.remove('active', 'quiz-underlay');
    p.style.visibility = '';
    p.setAttribute('aria-hidden', 'true');
    p.setAttribute('tabindex', '-1');
  });
  const targetPage = document.getElementById(`page-${targetId}`);
  if (targetPage) {
    targetPage.classList.add('active');
    targetPage.setAttribute('aria-hidden', 'false');
    targetPage.removeAttribute('tabindex');
  }

  if (targetId === 'conta' || targetId === 'termos' || targetId === 'quiz' || targetId === 'obtenha') {
    gsap.set(headerEl, { y: -100, opacity: 0 });
  } else {
    gsap.to(headerEl, { y: 0, opacity: 1, duration: 0.3 });
  }

  const contaVideo = document.getElementById('bgVideoConta');
  if (contaVideo) {
    if (targetId === 'conta') {
      contaVideo.currentTime = 0;
      contaVideo.play().catch(e => console.log("Autoplay blocked:", e));
    } else {
      contaVideo.pause();
    }
  }

  // ====== WHATSAPP CHAT DEPOIMENTOS ======
function initWhatsAppChat() {
  const chat    = document.getElementById('waChat');
  const sendBtn = document.getElementById('waSendBtn');
  const typEl   = document.getElementById('waTyping');
  const ctaEl   = document.getElementById('waCta');
  if (!chat || !sendBtn || chat.dataset.init) return;
  chat.dataset.init = 'true';

  const msgs = [
    { name:'Lucas Lima',     init:'LL', text:'Sério mesmo, plataforma completassa! Ainda não vi todos os treinos por falta de tempo, mas estou gostando bastante. Além disso, a disposição em conversar pelo WhatsApp é um baita diferencial. Ajudou sempre que precisei. Fechei meu primeiro objetivo de perder 5kg alguns meses atrás.', time:'22:47' },
    { name:'Matheus França', init:'MF', text:'Plataforma e comunidade foda! Entrei tem 3 meses e já tinha um conhecimento básico de treino, mais estou conseguindo me aperfeiçoar através dos protocolos. Consegui evoluir na carga do agachamento depois de 15 dias, e só tenho agradecer pelo suporte que vc dá lá no grupo.', time:'23:12' },
    { name:'Carlos Junior',  init:'CJ', text:'Boa tarde! Estou de boca aberta pelo conteúdo!! Me identifiquei com a proposta! Que Deus te abençoe muito!!!', time:'09:15' },
    { name:'Lucas Luciano',  init:'LL', text:'Sempre que procurava treinos no youtube, os vídeos tinham a solução, mas nada focado no meu corpo. Então decidi entrar para a plataforma SpartanFit e agora estou no módulo de Hipertrofia, estou curtindo demais.', time:'14:33' },
    { name:'Noeli Heitzmann', init:'NH', text:'Decidi mudar de vida após me apaixonar por estilo de vida saudável. Descobri o SpartanFit e fiquei encantada com o quanto ensinam de forma clara e científica. Não "economiza" nos conhecimentos e ainda incentiva você a continuar. Vale a pena se dar essa chance.', time:'16:08' },
    { name:'Igor Oliveira',   init:'IO', text:'A comunidade é sensacional. Tenho aprendido cada vez mais com os treinos, são bem didáticos. Eu nunca tive experiência com esse mundo de musculação e cada vez mais me familiarizado. A plataforma é muito completa, e o suporte é diretamente com o professor.', time:'18:45' },
    { name:'Mylleny Melo',   init:'MM', text:'O conteúdo é muito bom, bem objetivo sem enrolação, você realmente ensina não só vende ilusão. Parabéns pelo seu trabalho, você é referência para mim.', time:'21:22' }
  ];

  let idx  = 0;
  let busy = false;

  sendBtn.addEventListener('click', handleClick);
  if (!isTouchDevice) {
    sendBtn.addEventListener('mouseenter', () => {
      gsap.to(sendBtn, { scale: 1.08, duration: 0.25, ease: 'power2.out' });
    });
    sendBtn.addEventListener('mouseleave', () => {
      gsap.to(sendBtn, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
    });
  }

  function handleClick() {
    if (idx >= msgs.length || busy) return;
    busy = true;

    gsap.timeline()
      .to(sendBtn, { scale: 0.78, duration: 0.07, ease: 'power2.in' })
      .to(sendBtn, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.45)' });

    const m = msgs[idx];
    showTyping(m.name, m.init, () => {
      hideTyping(() => {
        addMsg(m, false);
        idx++;
        if (idx >= msgs.length) {
          setTimeout(() => {
            addMsg({ text: 'Quero fazer parte da comunidade 🔥', time: '21:23' }, true);
            setTimeout(() => {
              gsap.to(ctaEl, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
            }, 700);
          }, 1100);
        }
        busy = false;
      });
    });
  }

  function showTyping(name, initials, cb) {
    typEl.querySelector('.wa-typing__name').textContent   = name;
    typEl.querySelector('.wa-typing__avatar').textContent = initials;
    typEl.style.display = 'flex';
    gsap.set(typEl, { y: 20, opacity: 0 });
    gsap.to(typEl, {
      y: 0, opacity: 1, duration: 0.3, ease: 'power2.out',
      onComplete: () => { scrollChat(); setTimeout(cb, 480); }
    });
  }

  function hideTyping(cb) {
    gsap.to(typEl, {
      opacity: 0, duration: 0.15,
      onComplete: () => { typEl.style.display = 'none'; if (cb) cb(); }
    });
  }

  function addMsg(m, sent) {
    const el = document.createElement('div');
    el.className = 'wa-msg' + (sent ? ' wa-msg--sent' : '');

    if (sent) {
      el.innerHTML =
        '<div class="wa-msg__content">' +
          '<div class="wa-msg__bubble">' +
            '<span class="wa-msg__text">' + m.text + '</span>' +
            '<span class="wa-msg__meta">' +
              '<span class="wa-msg__time">' + m.time + '</span>' +
              '<span class="wa-msg__ticks">✓✓</span>' +
            '</span>' +
          '</div>' +
        '</div>';
    } else {
      el.innerHTML =
        '<div class="wa-msg__avatar">' + m.init + '</div>' +
        '<div class="wa-msg__content">' +
          '<span class="wa-msg__name">' + m.name + '</span>' +
          '<div class="wa-msg__bubble">' +
            '<span class="wa-msg__text">' + m.text + '</span>' +
            '<span class="wa-msg__meta">' +
              '<span class="wa-msg__time">' + m.time + '</span>' +
              '<span class="wa-msg__ticks">✓✓</span>' +
            '</span>' +
          '</div>' +
        '</div>';
    }

    chat.appendChild(el);
    gsap.fromTo(el,
      { y: 28, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.35)' }
    );
    scrollChat();
  }

  function scrollChat() {
    gsap.to(chat, {
      scrollTop: chat.scrollHeight - chat.clientHeight,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }
}

  lenis.start();
  gsap.set('.btn-back-auth--fixed', { y: 0, opacity: 1 });

  ScrollTrigger.getAll().forEach(st => st.kill());

  if (targetId === 'obtenha') {
    initWebHub();
  } else {
    initTilt(); initRevealText(); initScrollAnims(); initDraggable(); initRecHover();
  }
  
  // Inicia a lógica de esconder/mostrar o botão de voltar na página de login
  if (targetId === 'conta') {
    initContaBackBtn();
  }
  
  ScrollTrigger.refresh();
}

// ====== TRANSIÇÃO DO QUIZ (GSAP) ======
// Entrada: a tela do quiz sobe de baixo para cima e os elementos entram em cascata.
// Saída (seta de voltar): a tela desliza suavemente para a direita, revelando a home.
let quizTl = null;

// Deixa a rolagem nativa funcionar dentro do quiz (o Lenis fica pausado enquanto ele está aberto)
(function () {
  const q = document.getElementById('page-quiz');
  if (!q) return;
  ['wheel', 'touchmove'].forEach((ev) => q.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
})();

function openQuizFlow(fromPage) {
  const quiz = document.getElementById('page-quiz');
  if (!quiz || !fromPage) return;
  if (quizTl && quizTl.isActive()) quizTl.progress(1);

  // A home continua visível por baixo (mantém a posição do scroll)
  fromPage.classList.remove('active');
  fromPage.classList.add('quiz-underlay');
  fromPage.setAttribute('aria-hidden', 'true');

  quiz.classList.add('active');
  quiz.setAttribute('aria-hidden', 'false');
  quiz.removeAttribute('tabindex');
  quiz.scrollTop = 0;
  lenis.stop();

  const backBtn = quiz.querySelector('.btn-back-auth--fixed');
  const items = quiz.querySelectorAll('.quiz-header, .quiz-step.active > *, .quiz-nav');

  gsap.set(quiz, { yPercent: 100, xPercent: 0, boxShadow: '0 -40px 100px rgba(0,0,0,0.65)' });
  gsap.set(items, { y: 90, opacity: 0 });
  if (backBtn) gsap.set(backBtn, { y: 40, opacity: 0 });

  quizTl = gsap.timeline({
    onComplete: () => {
      fromPage.style.visibility = 'hidden';
      gsap.set(fromPage, { clearProps: 'transform,opacity' });
      gsap.set(quiz, { clearProps: 'transform,boxShadow' });
      gsap.set(items, { clearProps: 'transform,opacity' });
      if (backBtn) gsap.set(backBtn, { y: 0, opacity: 1 });
    }
  });

  quizTl
    .to(quiz, { yPercent: 0, duration: 1.3, ease: 'power4.inOut' }, 0)
    .to(fromPage, { y: -90, opacity: 0.45, duration: 1.3, ease: 'power4.inOut' }, 0)
    .to(items, { y: 0, opacity: 1, duration: 1.4, ease: 'expo.out', stagger: 0.09 }, 0.55);

  if (backBtn) {
    quizTl.to(backBtn, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0.7);
  }
}

function closeQuizFlow(homePage) {
  const quiz = document.getElementById('page-quiz');
  const home = homePage || document.getElementById('page-home');
  if (!quiz || !home) return;
  if (quizTl && quizTl.isActive()) quizTl.progress(1);

  // Se o quiz foi aberto por outro caminho, garante a home visível por baixo
  if (!home.classList.contains('quiz-underlay')) {
    document.querySelectorAll('.page-content').forEach(p => {
      if (p !== quiz) p.classList.remove('active');
    });
    home.classList.add('quiz-underlay');
    const savedScroll = pageScrollPositions.home ?? getSavedScrollPosition('home') ?? 0;
    window.scrollTo({ top: savedScroll, left: 0, behavior: 'auto' });
  }

  home.style.visibility = '';
  home.setAttribute('aria-hidden', 'false');
  gsap.set(home, { y: -90, opacity: 0.45 });
  gsap.set(quiz, { boxShadow: '40px 0 100px rgba(0,0,0,0.65)' });

  quizTl = gsap.timeline({
    onComplete: () => {
      quiz.classList.remove('active');
      quiz.setAttribute('aria-hidden', 'true');
      quiz.setAttribute('tabindex', '-1');
      gsap.set(quiz, { clearProps: 'all' });

      home.classList.remove('quiz-underlay');
      home.classList.add('active');
      gsap.set(home, { clearProps: 'transform,opacity' });
      gsap.set(headerEl, { y: 0, opacity: 1 });

      lenis.start();
      ScrollTrigger.refresh();
    }
  });

  quizTl
    .to(quiz, { xPercent: -100, duration: 1.15, ease: 'power4.inOut' }, 0)
    .to(home, { y: 0, opacity: 1, duration: 1.15, ease: 'power4.inOut' }, 0);
}

function animatePageTransition(targetId, pushToHistory = true) {
  const currentPage = document.querySelector('.page-content.active');
  const currentId = currentPage ? currentPage.id.replace('page-', '') : 'home';
  const currentScroll = window.scrollY || document.documentElement.scrollTop || 0;

  if (currentId && currentId !== targetId) {
    pageScrollPositions[currentId] = currentScroll;
    saveScrollPosition(currentId, currentScroll);
  }

  if (targetId === 'quiz' && currentId !== 'quiz') {
    pageScrollPositions.home = currentScroll;
    saveScrollPosition('home', currentScroll);
  }

  const targetPage = document.getElementById(`page-${targetId}`);
  // Home <-> Quiz têm transição própria (sobe de baixo / sai para a direita)
  const isQuizFlow = (targetId === 'quiz' && currentId === 'home') || (currentId === 'quiz' && targetId === 'home');

  if (isQuizFlow) {
    if (pushToHistory) {
      history.pushState({ page: targetId }, targetId, `#${targetId}`);
    }
    if (targetId === 'quiz') openQuizFlow(currentPage);
    else closeQuizFlow(targetPage);
    return;
  }

  const tl = gsap.timeline();
  gsap.set(transitionBrand, { opacity: 1 });

  tl.to(transitionLayer2, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "power3.inOut" })
    .add(() => {
      setActivePage(targetId);
      if (pushToHistory) {
        history.pushState({ page: targetId }, targetId, `#${targetId}`);
      }
      const targetScroll = getSavedScrollPosition(targetId) || pageScrollPositions[targetId] || 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetScroll, left: 0, behavior: 'auto' });
        if (typeof lenis !== 'undefined' && lenis.scrollTo) {
          lenis.scrollTo(targetScroll, { duration: 0.4, immediate: true });
        }
      });
    })
    .to(transitionLayer2, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.75, ease: "power3.inOut" })
    .set(transitionBrand, { opacity: 0 });
}

history.replaceState({ page: 'home' }, 'home', '#home');

window.addEventListener('popstate', (e) => {
  const targetId = (e.state && e.state.page) || (location.hash.replace('#', '') || 'home');
  animatePageTransition(targetId, false);
});

window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '');
  const targetPage = document.getElementById(`page-${hash}`);
  if (targetPage && !targetPage.classList.contains('active')) {
    animatePageTransition(hash, false);
  }
});

document.body.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('javascript') || href.endsWith('.html')) return;

  if (href.startsWith('#') && href.length > 1) {
    const targetEl = document.getElementById(href.substring(1));
    if (targetEl && targetEl.closest('.page-content.active')) {
      e.preventDefault();
      lenis.scrollTo(targetEl, { duration: 1.5, offset: -50 });
      return;
    }
  }
  const cleanHref = href.replace(/^#/, '');
  const targetPage = document.getElementById(`page-${cleanHref}`);
  if (!targetPage) return;
  e.preventDefault();
  if (targetPage.classList.contains('active')) return;
  animatePageTransition(cleanHref, true);
});

// ====== SERVICES ACCORDION ======
document.querySelectorAll("[data-service]").forEach(service => {
  const btn = service.querySelector(".service__btn");
  const top = service.querySelector(".service__top");
  top.addEventListener("click", () => {
    const isActive = service.classList.contains("is-active");
    document.querySelectorAll("[data-service]").forEach(s => {
      s.classList.remove("is-active");
      const b = s.querySelector(".service__btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    if (!isActive) {
      service.classList.add("is-active");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
    ScrollTrigger.refresh();
  });
});

// ====== 3D TILT & MAGNETIC ======
function initTilt() {
  document.querySelectorAll("[data-tilt]").forEach(card => {
    if (card.dataset.init || isTouchDevice) return;
    gsap.set(card, { transformPerspective: 1000 });
    const xTo = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      yTo(((y - rect.height / 2) / (rect.height / 2)) * -5);
      xTo(((x - rect.width / 2) / (rect.width / 2)) * 5);
    });
    card.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    card.dataset.init = 'true';
  });
}
function initMagnetic() {
  document.querySelectorAll("[data-magnetic]").forEach(btn => {
    if (btn.dataset.init || isTouchDevice) return;
    gsap.set(btn, { transformPerspective: 1000 });
    const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      xTo((e.clientX - rect.left - rect.width / 2) * 0.3);
      yTo((e.clientY - rect.top - rect.height / 2) * 0.3);
    });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    btn.dataset.init = 'true';
  });
}
initTilt(); initMagnetic();

// ====== DRAGGABLE CARDS (Home Page) ======
function initDraggable() {
  const track = document.getElementById("dragTrack");
  const wrapper = document.getElementById("dragWrapper");
  if (!track || !wrapper || track.dataset.init) return;

  const cards = track.querySelectorAll(".drag-card");
  const hint = document.getElementById("dragHint");
  const cardWidth = 380 + 40;
  let isDragging = false;
  let hasDragged = false;

  if (isTouchDevice) {
    if (hint) hint.style.display = 'none';
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
      });
    });
    track.dataset.init = 'true';
    return;
  }

  Draggable.create(track, {
    type: "x", edgeResistance: 0.65, bounds: "#dragWrapper", inertia: true,
    cursor: "grab", activeCursor: "grabbing",
    snap: { x: (endValue) => Math.round(endValue / cardWidth) * cardWidth },
    onDragStart: function() {
      isDragging = true;
      cards.forEach(c => c.classList.remove('is-active'));
      if (!hasDragged) {
        hasDragged = true;
        gsap.to(hint, { opacity: 0, scale: 0.8, duration: 0.4, onComplete: () => { hint.style.display = 'none'; } });
      }
    },
    onDrag: function() {
      const v = this.getVelocity() / 200;
      const rot = gsap.utils.clamp(-6, 6, v);
      gsap.to(cards, { rotation: rot, stagger: 0.02, ease: "power3.out", overwrite: true });
    },
    onDragEnd: function() {
      gsap.to(cards, { rotation: 0, stagger: 0.02, ease: "elastic.out(1, 0.5)", duration: 1.5 });
      setTimeout(() => { isDragging = false; }, 100);
    }
  });

  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (isDragging) return;
      const isActive = card.classList.contains('is-active');
      cards.forEach(c => c.classList.remove('is-active'));
      if (!isActive) card.classList.add('is-active');
    });
  });
  track.dataset.init = 'true';
}

// ====== HOVER ANIMATION PARA RECONHECIMENTO ======
function initRecHover() {
  document.querySelectorAll(".rec-item").forEach(item => {
    if (item.dataset.init || isTouchDevice) return;
    gsap.set(item, { transformPerspective: 1000 });
    item.addEventListener("mousemove", (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      gsap.to(item, {
        rotationY: ((x - rect.width / 2) / (rect.width / 2)) * 3,
        rotationX: -((y - rect.height / 2) / (rect.height / 2)) * 3,
        duration: 0.6, ease: "power3.out"
      });
    });
    item.addEventListener("mouseleave", () => {
      gsap.to(item, { rotationX: 0, rotationY: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
    });
    item.dataset.init = true;
  });
}

// ====== GSAP SCROLL ANIMATIONS & REVEAL TEXT (COM BLUR) ======
function initRevealText() {
  document.querySelectorAll(".reveal-text").forEach(el => {
    if (el.dataset.revealed !== 'true') {
      const text = el.textContent.trim(); el.innerHTML = "";
      text.split(/\s+/).forEach((word, i) => {
        const wrap = document.createElement("span"); wrap.className = "word-wrap";
        const inner = document.createElement("span"); inner.className = "word-inner"; inner.textContent = word;
        wrap.appendChild(inner); el.appendChild(wrap);
        if (i < text.split(/\s+/).length - 1) el.appendChild(document.createTextNode(" "));
      });
      el.dataset.revealed = 'true';
    }

    const words = el.querySelectorAll(".word-inner");
    gsap.fromTo(words,
      { y: "110%" },
      { y: "0%", duration: 1, ease: "power4.out", stagger: 0.04,
        scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 20%", toggleActions: "play none none reverse" }
      }
    );
  });
}

function initScrollAnims() {
  gsap.fromTo(".work__item", { y: 100, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".work__grid", start: "top 85%", end: "bottom 20%", toggleActions: "play none none reverse" } });
  gsap.fromTo(".service", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power4.out", scrollTrigger: { trigger: ".services__list", start: "top 85%", end: "bottom 20%", toggleActions: "play none none reverse" } });
  gsap.fromTo(".marquee__track span", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power4.out", scrollTrigger: { trigger: ".marquee", start: "top 90%", end: "bottom 10%", toggleActions: "play none none reverse" } });
  gsap.fromTo(".perfil__left > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power4.out", scrollTrigger: { trigger: ".perfil__body", start: "top 85%", end: "bottom 20%", toggleActions: "play none none reverse" } });
  gsap.fromTo(".perfil__right > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power4.out", scrollTrigger: { trigger: ".perfil__body", start: "top 85%", end: "bottom 20%", toggleActions: "play none none reverse" } });
  gsap.fromTo(".contact > *", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out", scrollTrigger: { trigger: ".contact", start: "top 85%", end: "bottom 20%", toggleActions: "play none none reverse" } });
  gsap.fromTo(".footer-col", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power4.out", scrollTrigger: { trigger: ".site-footer", start: "top 85%", end: "bottom 20%", toggleActions: "play none none reverse" } });
  gsap.to(".footer-giant", { yPercent: -20, ease: "none", scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom top", scrub: true } });
}
initRevealText();

// ====== VÍDEO REEL ======
const reelPlayBtn = document.getElementById("reelPlayBtn");
if (reelPlayBtn) {
  const togglePlay = () => {
    const isPlaying = reelPlayBtn.classList.toggle("is-playing");
    reelPlayBtn.setAttribute('aria-label', isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo');
    reelPlayBtn.innerHTML = isPlaying
      ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
      : '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  };
  reelPlayBtn.addEventListener("click", togglePlay);
}

// ====== SISTEMA DE QUIZ ======
const quizData = { questions: [ { id: 1, name: 'nome', type: 'text', question: 'Como você se chama?', desc: 'Vamos começar pelo básico.', placeholder: 'Seu nome' }, { id: 2, name: 'idade', type: 'number', question: 'Qual é a sua idade?', desc: 'A idade influencia diretamente no seu plano de treino.', placeholder: 'Ex: 25', unit: 'anos', min: 10, max: 99 }, { id: 3, name: 'sexo', type: 'choice', question: 'Qual é o seu sexo biológico?', desc: 'Usamos isso para calcular métricas corporais com mais precisão.', options: [ { value: 'Masculino', label: '♂ Masculino' }, { value: 'Feminino', label: '♀ Feminino' } ]}, { id: 4, name: 'altura', type: 'number', question: 'Qual é a sua altura?', desc: 'Necessária para calcular o seu IMC e peso ideal.', placeholder: 'Ex: 175', unit: 'cm', min: 100, max: 250 }, { id: 5, name: 'peso', type: 'number', question: 'Qual é o seu peso atual?', desc: 'Não julgamos — só calculamos.', placeholder: 'Ex: 80', unit: 'kg', min: 30, max: 300, step: 0.1 }, { id: 6, name: 'pesoIdeal', type: 'number', question: 'Qual peso você quer atingir?', desc: 'Seu objetivo em números. Seja realista, seja ambicioso.', placeholder: 'Ex: 70', unit: 'kg', min: 30, max: 300, step: 0.1 }, { id: 7, name: 'nivel', type: 'choice', question: 'Qual é o seu nível de atividade atual?', desc: 'Seja honesto — isso define o ponto de partida.', layout: 'col', options: [ { value: 'Sedentário', label: 'Sedentário — quase não me movo' }, { value: 'Leve', label: 'Leve — caminhadas e atividades leves' }, { value: 'Moderado', label: 'Moderado — treino 2 a 3x por semana' }, { value: 'Intenso', label: 'Intenso — treino 5x ou mais por semana' } ]}, { id: 8, name: 'objetivo', type: 'choice', question: 'Qual é o seu principal objetivo?', desc: 'Isso defines a direção de todo o seu plano.', layout: 'col', options: [ { value: 'Perder peso', label: 'Perder peso e gordura' }, { value: 'Ganhar massa', label: 'Ganhar massa muscular' }, { value: 'Definição', label: 'Definir e tonificar' }, { value: 'Saúde geral', label: 'Melhorar saúde e disposição' } ]}, { id: 9, name: 'lesao', type: 'choice', question: 'Possui alguma lesão ou restrição?', desc: 'Garanta sua segurança durante os treinos.', layout: 'col', options: [ { value: 'Nenhuma', label: 'Nenhuma lesão ou restrição' }, { value: 'Coluna', label: 'Problemas na coluna/lombar' }, { value: 'Articulação', label: 'Problemas articulares (joelho, ombro)' }, { value: 'Outras', label: 'Outras restrições médicas' } ]}, { id: 10, name: 'sono', type: 'choice', question: 'Como está seu sono e recuperação?', desc: 'O músculo cresce enquanto você descansa.', layout: 'col', options: [ { value: 'Excelente', label: 'Durmo 8h+ e acordo revigorado' }, { value: 'Razoável', label: 'Durmo 6-7h, às vezes cansado' }, { value: 'Ruim', label: 'Durmo mal e sempre estou exausto' } ]} ], summary: [ { name: 'nome', label: 'Nome', type: 'text' }, { name: 'idade', label: 'Idade', type: 'number' }, { name: 'sexo', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] }, { name: 'altura', label: 'Altura (cm)', type: 'number' }, { name: 'peso', label: 'Peso Atual (kg)', type: 'number', step: 0.1 }, { name: 'pesoIdeal', label: 'Peso Ideal (kg)', type: 'number', step: 0.1 }, { name: 'nivel', label: 'Nível de Atividade', type: 'select', options: ['Sedentário', 'Leve', 'Moderado', 'Intenso'] }, { name: 'objetivo', label: 'Objetivo', type: 'select', options: ['Perder peso', 'Ganhar massa', 'Definição', 'Saúde geral'] }, { name: 'lesao', label: 'Lesões/Restrições', type: 'select', options: ['Nenhuma', 'Coluna', 'Articulação', 'Outras'] }, { name: 'sono', label: 'Sono/Recuperação', type: 'select', options: ['Excelente', 'Razoável', 'Ruim'] } ] };
const quizStepsContainer = document.getElementById("quizSteps");
const quizNext = document.getElementById("quizNext");
const quizBack = document.getElementById("quizBack");
const quizProgressBar = document.getElementById("quizProgressBar");
const quizProgressEl = document.getElementById("quizProgress");
const quizStepLabel = document.getElementById("quizStepLabel");
const openQuizBtn = document.getElementById("openQuizBtn");
const totalQuestions = quizData.questions.length;
const totalSteps = totalQuestions + 2;
let currentStep = 1;
const quizAnswers = {};

function renderQuiz() {
  if (!quizStepsContainer) return;
  let html = '';
  quizData.questions.forEach((q, idx) => {
    const stepNum = idx + 1;
    html += `<div class="quiz-step ${stepNum === 1 ? 'active' : ''}" data-step="${stepNum}" role="group" aria-labelledby="q-${q.name}-title">`;
    html += `<h2 id="q-${q.name}-title">${q.question}</h2><p>${q.desc}</p>`;
    if (q.type === 'text' || q.type === 'number') {
      html += `<div class="quiz-field"><input type="${q.type}" id="q_${q.name}" placeholder="${q.placeholder}"`;
      if (q.min !== undefined) html += ` min="${q.min}"`;
      if (q.max !== undefined) html += ` max="${q.max}"`;
      if (q.step !== undefined) html += ` step="${q.step}"`;
      html += ` aria-label="${q.question}" />`;
      if (q.unit) html += `<span class="quiz-field__unit" aria-hidden="true">${q.unit}</span>`;
      html += `</div>`;
    } else if (q.type === 'choice') {
      const layoutClass = q.layout === 'col' ? ' quiz-options--col' : '';
      html += `<div class="quiz-options${layoutClass}" role="radiogroup" aria-label="${q.question}">`;
      q.options.forEach(opt => {
        html += `<button type="button" class="quiz-opt" data-group="${q.name}" data-val="${opt.value}" role="radio" aria-checked="false" aria-label="${opt.label}">${opt.label}</button>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });
  html += `<div class="quiz-step quiz-step--result" data-step="${totalQuestions + 1}" role="group" aria-label="Revisão do perfil">`;
  html += `<div class="quiz-result-header"><h2>Revise seu Perfil</h2><p>Algo wrong? Edite diretamente nos campos abaixo.</p></div>`;
  html += `<div class="quiz-summary" id="quizSummary">`;
  quizData.summary.forEach(field => {
    html += `<div class="quiz-summary__item"><span class="quiz-summary__label">${field.label}</span>`;
    if (field.type === 'select') {
      html += `<select id="edit_${field.name}" class="quiz-edit-input" aria-label="${field.label}">`;
      field.options.forEach(opt => { html += `<option>${opt}</option>`; });
      html += `</select>`;
    } else {
      const stepAttr = field.step !== undefined ? ` step="${field.step}"` : '';
      html += `<input type="${field.type}" id="edit_${field.name}" class="quiz-edit-input" aria-label="${field.label}"${stepAttr} />`;
    }
    html += `</div>`;
  });
  html += `</div></div>`;
  html += `<div class="quiz-step quiz-step--final" data-step="${totalQuestions + 2}" role="group" aria-label="Avaliação concluída">`;
  html += `<div class="quiz-success-icon" aria-hidden="true"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>`;
  html += `<h2>Avaliação Concluída!</h2><p>Para salvar seu perfil e acessar seu plano personalizado, entre na sua conta ou crie uma agora.</p>`;
  html += `<div class="quiz-auth-actions">`;
  html += `<a href="conta" class="quiz-auth-btn quiz-auth-btn--primary" data-magnetic><span>Já tenho conta</span></a>`;
  html += `<a href="conta" class="quiz-auth-btn quiz-auth-btn--secondary" data-magnetic><span>Criar conta grátis</span></a>`;
  html += `</div></div>`;
  quizStepsContainer.innerHTML = html;
  bindQuizEvents();
}

function bindQuizEvents() {
  document.querySelectorAll(".quiz-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      const group = opt.dataset.group;
      const val = opt.dataset.val;
      document.querySelectorAll(`.quiz-opt[data-group="${group}"]`).forEach(o => {
        o.classList.remove("selected");
        o.setAttribute("aria-checked", "false");
      });
      opt.classList.add("selected");
      opt.setAttribute("aria-checked", "true");
      quizAnswers[group] = val;
    });
  });
}

if (openQuizBtn) openQuizBtn.addEventListener("click", () => animatePageTransition('quiz', true));

const quizHomeBackBtn = document.querySelector('#page-quiz a[href="home"]');
if (quizHomeBackBtn) {
  quizHomeBackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quizTl && quizTl.isActive()) return;
    animatePageTransition('home', true);
  });
}

if (quizNext) {
  quizNext.addEventListener("click", () => {
    const currentStepEl = document.querySelector(`.quiz-step[data-step="${currentStep}"]`);
    if (!currentStepEl) return;
    if (currentStep <= totalQuestions) {
      const question = quizData.questions[currentStep - 1];
      if (question.type === 'text' || question.type === 'number') {
        const input = currentStepEl.querySelector('input');
        if (!input || !input.value.trim()) return showToast("Preencha o campo para continuar.");
        quizAnswers[question.name] = input.value;
      } else if (question.type === 'choice') {
        if (!quizAnswers[question.name]) return showToast("Selecione uma opção.");
      }
    } else if (currentStep === totalQuestions + 1) {
      saveEditedSummary();
    }
    currentStepEl.classList.remove("active");
    currentStep++;
    const nextStepEl = document.querySelector(`.quiz-step[data-step="${currentStep}"]`);
    if (nextStepEl) nextStepEl.classList.add("active");
    if (currentStep === totalQuestions + 1) generateSummary();
    updateQuizUI();
  });
}

if (quizBack) {
  quizBack.addEventListener("click", () => {
    if (currentStep <= 1) return;
    document.querySelector(`.quiz-step[data-step="${currentStep}"]`).classList.remove("active");
    currentStep--;
    document.querySelector(`.quiz-step[data-step="${currentStep}"]`).classList.add("active");
    updateQuizUI();
  });
}

function updateQuizUI() {
  if (currentStep <= totalQuestions) {
    quizStepLabel.textContent = `Pergunta ${currentStep} de ${totalQuestions}`;
    const pct = (currentStep / totalSteps) * 100;
    quizProgressBar.style.width = `${pct}%`;
    if (quizProgressEl) quizProgressEl.setAttribute('aria-valuenow', Math.round(pct));
    
    if (currentStep === 1) {
      quizBack.style.display = 'none';
    } else {
      quizBack.style.display = 'flex';
    }
    
    quizNext.style.display = 'flex';
    quizNext.textContent = currentStep === totalQuestions ? "Ver Revisão →" : "Próximo →";
  } else if (currentStep === totalQuestions + 1) {
    quizStepLabel.textContent = "Revisão";
    quizProgressBar.style.width = `90%`;
    if (quizProgressEl) quizProgressEl.setAttribute('aria-valuenow', 90);
    quizBack.style.display = 'flex';
    quizNext.style.display = 'flex';
    quizNext.textContent = "Finalizar →";
  } else if (currentStep === totalQuestions + 2) {
    quizStepLabel.textContent = "Conclusão";
    quizProgressBar.style.width = `100%`;
    if (quizProgressEl) quizProgressEl.setAttribute('aria-valuenow', 100);
    quizBack.style.display = 'none';
    quizNext.style.display = 'none';
  }
}

function generateSummary() {
  quizData.summary.forEach(field => {
    const el = document.getElementById(`edit_${field.name}`);
    if (el) el.value = quizAnswers[field.name] || (field.type === 'select' ? field.options[0] : '');
  });
}

function saveEditedSummary() {
  quizData.summary.forEach(field => {
    const el = document.getElementById(`edit_${field.name}`);
    if (el) quizAnswers[field.name] = el.value;
  });
}

if (quizStepsContainer) {
  renderQuiz();
  updateQuizUI();
}

// ====== SISTEMA DE LOGIN / REGISTRO ======
const dsContainer = document.getElementById("dsContainer");
const registerBtn = document.getElementById("dsRegisterButton");
const loginBtn = document.getElementById("dsLoginButton");
const mobileToLogin = document.getElementById("dsMobileToLogin");
const mobileToRegister = document.getElementById("dsMobileToRegister");
const signInForm = document.querySelector(".sign-in-container");
const signUpForm = document.querySelector(".sign-up-container");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    dsContainer.classList.add("right-panel-active");
    signInForm.classList.remove("is-active-mobile");
    signUpForm.classList.add("is-active-mobile");
  });
}
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    dsContainer.classList.remove("right-panel-active");
    signUpForm.classList.remove("is-active-mobile");
    signInForm.classList.add("is-active-mobile");
  });
}
if (mobileToRegister) {
  mobileToRegister.addEventListener("click", (e) => {
    e.preventDefault();
    dsContainer.classList.add("right-panel-active");
    signInForm.classList.remove("is-active-mobile");
    signUpForm.classList.add("is-active-mobile");
  });
}
if (mobileToLogin) {
  mobileToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    dsContainer.classList.remove("right-panel-active");
    signUpForm.classList.remove("is-active-mobile");
    signInForm.classList.add("is-active-mobile");
  });
}
if (signInForm) signInForm.classList.add("is-active-mobile");

// ====== FORÇA DA SENHA + VALIDAÇÃO REAL NO SUBMIT ======
const regPasswordInput = document.getElementById("regPassword");
const strengthLabel = document.getElementById("strengthLabel");
let currentStrength = 0;

function calculateStrength(val) {
  let strength = 0;
  if (val.length >= 8) strength++;
  if (val.length >= 12) strength++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength++;
  if (/[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)) strength++;
  return strength;
}

if (regPasswordInput) {
  regPasswordInput.addEventListener("input", (e) => {
    const val = e.target.value;
    currentStrength = calculateStrength(val);

    const segs = document.querySelectorAll(".strength-bar__seg");
    const colors = ["#ff4757", "#ff6348", "#ffa502", "#2ed573"];
    segs.forEach(s => s.style.backgroundColor = "var(--color-surface25)");

    if (val.length === 0) strengthLabel.textContent = "Digite uma senha (mín. 8 caracteres)";
    else if (currentStrength === 1) { segs[0].style.backgroundColor = colors[0]; strengthLabel.textContent = "Fraca"; }
    else if (currentStrength === 2) { segs[0].style.backgroundColor = colors[1]; segs[1].style.backgroundColor = colors[1]; strengthLabel.textContent = "Razoável"; }
    else if (currentStrength === 3) { segs[0].style.backgroundColor = colors[2]; segs[1].style.backgroundColor = colors[2]; segs[2].style.backgroundColor = colors[2]; strengthLabel.textContent = "Boa"; }
    else if (currentStrength === 4) { segs[0].style.backgroundColor = colors[3]; segs[1].style.backgroundColor = colors[3]; segs[2].style.backgroundColor = colors[3]; segs[3].style.backgroundColor = colors[3]; strengthLabel.textContent = "Forte"; }
  });
}

const toast = document.getElementById("toast");
let toastTimer = null;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

// ====== API (PHP + MySQL no XAMPP) ======
async function apiPost(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error('Servidor não encontrado. Abra o site por http://localhost/spartanfit/ com o Apache ligado.');
  }
  let data = {};
  try { data = await res.json(); } catch (err) {}
  if (!res.ok) throw new Error(data.error || 'Erro no servidor. Verifique se o MySQL está ligado.');
  return data;
}

function goToApp() {
  setTimeout(() => { window.location.href = 'app.html'; }, 700);
}

async function submitAuth(form, url, payload, okMsg) {
  const btn = form.querySelector('.btn-auth-submit');
  const label = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Aguarde...'; }
  try {
    await apiPost(url, payload);
    showToast(okMsg);
    form.reset();
    goToApp();
  } catch (err) {
    showToast(err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = label; }
  }
}

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("regNome");
    const email = document.getElementById("regEmail");
    const senha = regPasswordInput;
    const terms = document.getElementById("regTerms");

    if (!nome.value.trim()) return showToast("Preencha seu nome completo.");
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return showToast("Digite um email válido.");
    if (!senha.value || senha.value.length < 8) return showToast("A senha deve ter no mínimo 8 caracteres.");
    if (currentStrength < 2) return showToast("Use uma senha mais forte: combine letras, números e símbolos.");
    if (!terms.checked) return showToast("Você precisa aceitar os Termos para continuar.");

    submitAuth(registerForm, 'api/register.php', {
      nome: nome.value.trim(),
      email: email.value.trim(),
      senha: senha.value,
      quiz: (typeof quizAnswers !== 'undefined') ? quizAnswers : {}
    }, "Conta criada com sucesso! Bem-vindo, Guerreiro.");
  });
}
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail");
    const pass = document.getElementById("loginPass");
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return showToast("Digite um email válido.");
    if (!pass.value) return showToast("Digite sua senha.");

    submitAuth(loginForm, 'api/login.php', {
      email: email.value.trim(),
      senha: pass.value
    }, "Login realizado com sucesso!");
  });
}

// Se já estiver logado, o link do topo vira "Acessar App"
fetch('api/me.php', { credentials: 'same-origin' })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    if (!d || !d.user) return;
    document.querySelectorAll('.header__menu-link--auth').forEach((a) => {
      a.textContent = 'Acessar App';
      a.setAttribute('href', 'app.html');
    });
  })
  .catch(() => {});


// ====== GSAP HOMEPAGE BLOCKS ======
function initGsapBlocks() {
    class Block { constructor(block) { this.block = block; } }

    class HomeHero extends Block {
        init() {
            this.DOM = {
                title: this.block.querySelector("#hero-title"),
                subtitle: this.block.querySelector(".subtitle"),
                button: this.block.querySelector(".home-hero__button"),
                scrollIndicator: this.block.querySelector(".scroll-indicator")
            };
            gsap.set(this.DOM.title, { autoAlpha: 1, overflow: "hidden" });
            
            const split = new SplitText(this.DOM.title, { type: "chars, words", linesClass: "line-mask" });
            gsap.set(split.chars, { y: -window.innerHeight, opacity: 0 });
            
            const tl = gsap.timeline({ delay: 0.15 });
            
            tl.to(split.chars, {
                y: 0,
                opacity: 1,
                duration: 1.35,
                ease: "power4.out",
                stagger: { each: 0.035, from: "start" }
            })
            .to(this.DOM.subtitle, {
                opacity: 1,
                x: 0,
                duration: 1.8, 
                ease: "elastic.out(1, 0.6)"
            }, "-=0.85")
            .to(this.DOM.button, {
                opacity: 1,
                x: 0,
                duration: 1.8, 
                ease: "elastic.out(1, 0.6)"
            }, "-=1.15")
            // DURAÇÃO DO SCROLL INDICATOR EXTREMAMENTE RÁPIDA (0.2s) E ANTECIPADA (-=0.8)
            .to(this.DOM.scrollIndicator, {
                opacity: 0.8,
                x: 0,
                duration: 0.2, 
                ease: "power3.out",
                onComplete: () => {
                    if (this.DOM.scrollIndicator) {
                        gsap.to(this.DOM.scrollIndicator, {
                            opacity: 0,
                            ease: "none",
                            scrollTrigger: {
                                trigger: ".home-hero",
                                start: "top top",
                                end: "+=200",
                                scrub: true
                            }
                        });
                    }
                }
            }, "-=0.8");
        }
    }

    document.querySelectorAll('[data-block]').forEach(el => {
        const blockName = el.dataset.block;
        let instance;
        switch (blockName) {
            case "home-hero": instance = new HomeHero(el); break;
        }
        if (instance && typeof instance.init === 'function') instance.init();
    });
    ScrollTrigger.refresh();
}

// ====== WHATSAPP CHAT DEPOIMENTOS ======
function initWhatsAppChat() {
  var chat    = document.getElementById('waChat');
  var sendBtn = document.getElementById('waSendBtn');
  var typEl   = document.getElementById('waTyping');
  var ctaEl   = document.getElementById('waCta');
  if (!chat || !sendBtn || chat.dataset.init) return;
  chat.dataset.init = 'true';

  var msgs = [
    { name:'Lucas Lima',     init:'LL', text:'Sério mesmo, plataforma completassa! Ainda não vi todos os treinos por falta de tempo, mas estou gostando bastante. Além disso, a disposição em conversar pelo WhatsApp é um baita diferencial. Ajudou sempre que precisei. Fechei meu primeiro objetivo de perder 5kg alguns meses atrás.', time:'22:47' },
    { name:'Matheus França', init:'MF', text:'Plataforma e comunidade foda! Entrei tem 3 meses e já tinha um conhecimento básico de treino, mais estou conseguindo me aperfeiçoar através dos protocolos. Consegui evoluir na carga do agachamento depois de 15 dias, e só tenho agradecer pelo suporte que vc dá lá no grupo.', time:'23:12' },
    { name:'Carlos Junior',  init:'CJ', text:'Boa tarde! Estou de boca aberta pelo conteúdo!! Me identifiquei com a proposta! Que Deus te abençoe muito!!!', time:'09:15' },
    { name:'Lucas Luciano',  init:'LL', text:'Sempre que procurava treinos no youtube, os vídeos tinham a solução, mas nada focado no meu corpo. Então decidi entrar para a plataforma SpartanFit e agora estou no módulo de Hipertrofia, estou curtindo demais.', time:'14:33' },
    { name:'Noeli Heitzmann', init:'NH', text:'Decidi mudar de vida após me apaixonar por estilo de vida saudável. Descobri o SpartanFit e fiquei encantada com o quanto ensinam de forma clara e científica. Não "economiza" nos conhecimentos e ainda incentiva você a continuar. Vale a pena se dar essa chance.', time:'16:08' },
    { name:'Igor Oliveira',   init:'IO', text:'A comunidade é sensacional. Tenho aprendido cada vez mais com os treinos, são bem didáticos. Eu nunca tive experiência com esse mundo de musculação e cada vez mais me familiarizado. A plataforma é muito completa, e o suporte é diretamente com o professor.', time:'18:45' },
    { name:'Mylleny Melo',   init:'MM', text:'O conteúdo é muito bom, bem objetivo sem enrolação, você realmente ensina não só vende ilusão. Parabéns pelo seu trabalho, você é referência para mim.', time:'21:22' }
  ];

  var idx  = 0;
  var busy = false;

  sendBtn.addEventListener('click', handleClick);
  if (!isTouchDevice) {
    sendBtn.addEventListener('mouseenter', function() {
      gsap.to(sendBtn, { scale: 1.08, duration: 0.25, ease: 'power2.out' });
    });
    sendBtn.addEventListener('mouseleave', function() {
      gsap.to(sendBtn, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
    });
  }

  function handleClick() {
    if (idx >= msgs.length || busy) return;
    busy = true;

    gsap.timeline()
      .to(sendBtn, { scale: 0.78, duration: 0.07, ease: 'power2.in' })
      .to(sendBtn, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.45)' });

    var m = msgs[idx];
    showTyping(m.name, m.init, function() {
      hideTyping(function() {
        addMsg(m, false);
        idx++;
        if (idx >= msgs.length) {
          setTimeout(function() {
            addMsg({ text: 'Quero fazer parte da comunidade 🔥', time: '21:23' }, true);
            setTimeout(function() {
              gsap.to(ctaEl, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
            }, 700);
          }, 1100);
        }
        busy = false;
      });
    });
  }

  function showTyping(name, initials, cb) {
    typEl.querySelector('.wa-typing__name').textContent   = name;
    typEl.querySelector('.wa-typing__avatar').textContent = initials;
    typEl.style.display = 'flex';
    gsap.set(typEl, { y: 20, opacity: 0 });
    gsap.to(typEl, {
      y: 0, opacity: 1, duration: 0.3, ease: 'power2.out',
      onComplete: function() { scrollChat(); setTimeout(cb, 480); }
    });
  }

  function hideTyping(cb) {
    gsap.to(typEl, {
      opacity: 0, duration: 0.15,
      onComplete: function() { typEl.style.display = 'none'; if (cb) cb(); }
    });
  }

  function addMsg(m, sent) {
    var el = document.createElement('div');
    el.className = 'wa-msg' + (sent ? ' wa-msg--sent' : '');

    if (sent) {
      el.innerHTML =
        '<div class="wa-msg__content">' +
          '<div class="wa-msg__bubble">' +
            '<span class="wa-msg__text">' + m.text + '</span>' +
            '<span class="wa-msg__meta">' +
              '<span class="wa-msg__time">' + m.time + '</span>' +
              '<span class="wa-msg__ticks">✓✓</span>' +
            '</span>' +
          '</div>' +
        '</div>';
    } else {
      el.innerHTML =
        '<div class="wa-msg__avatar">' + m.init + '</div>' +
        '<div class="wa-msg__content">' +
          '<span class="wa-msg__name">' + m.name + '</span>' +
          '<div class="wa-msg__bubble">' +
            '<span class="wa-msg__text">' + m.text + '</span>' +
            '<span class="wa-msg__meta">' +
              '<span class="wa-msg__time">' + m.time + '</span>' +
              '<span class="wa-msg__ticks">✓✓</span>' +
            '</span>' +
          '</div>' +
        '</div>';
    }

    chat.appendChild(el);
    gsap.fromTo(el,
      { y: 28, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.35)' }
    );
    scrollChat();
  }

  function scrollChat() {
    gsap.to(chat, {
      scrollTop: chat.scrollHeight - chat.clientHeight,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }
}

// =========================================
// WEBHUB PAGE LOGIC (Runs only on #page-obtenha)
// =========================================
function initFaqAccordion(scope) {
  const faqScope = scope || document;
  faqScope.querySelectorAll(".faq__item").forEach(function(el) {
    if (el.dataset.faqInit === 'true') return;
    const summary = el.querySelector(".faq__summary");
    if (!summary) return;
    el.dataset.faqInit = 'true';
    summary.addEventListener("click", function(event) {
      event.preventDefault();
      const isOpen = el.classList.contains("faq__item--open");
      const list = el.closest(".faq__list") || faqScope;
      list.querySelectorAll(".faq__item").forEach(function(other) {
        other.classList.remove("faq__item--open");
      });
      if (!isOpen) el.classList.add("faq__item--open");
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });
}

function initWebHub() {
  var whScope = document.getElementById('page-obtenha');
  if (!whScope) return;

  whScope.querySelectorAll("[data-tilt]").forEach(function(card) {
    if (card.dataset.init || isTouchDevice) return;
    gsap.set(card, { transformPerspective: 1000, transformStyle: "preserve-3d" });
    var xTo = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
    var yTo = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
    card.addEventListener("mousemove", function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      yTo(((y - rect.height / 2) / (rect.height / 2)) * -5);
      xTo(((x - rect.width / 2) / (rect.width / 2)) * 5);
    });
    card.addEventListener("mouseleave", function() { xTo(0); yTo(0); });
    card.dataset.init = 'true';
  });

  initRevealText();
  initWhatsAppChat();
  initFaqAccordion(whScope);

  ScrollTrigger.refresh();
}

// =========================================
// DIRECTIONAL BUTTON HOVER (Borda carregando do mouse)
// =========================================
function initDirectionalButtons() {
  var strokeButtons = document.querySelectorAll('.button--stroke');
  strokeButtons.forEach(function(btn) {
    var flair = btn.querySelector('.button__flair');
    if (!flair) return;

    btn.addEventListener('mouseenter', function(e) {
      var rect = btn.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var dx = e.clientX - centerX;
      var dy = e.clientY - centerY;

      var startAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
      if (startAngle < 0) startAngle += 360;

      flair.style.transition = 'none';
      flair.style.setProperty('--start-angle', startAngle + 'deg');
      flair.style.setProperty('--border-angle', '0deg');
      
      void flair.offsetHeight;
      
      flair.style.transition = '';
      flair.style.setProperty('--border-angle', '360deg');
    });

    btn.addEventListener('mouseleave', function() {
      flair.style.setProperty('--border-angle', '0deg');
    });
  });
}
initDirectionalButtons();

// ====== EFEITO HOVER NO BOTÃO VOLTAR (CONTA) ======
function initContaBackBtn() {
    var contaBackBtn = document.querySelector('#page-conta .btn-back-auth--fixed');
    if (contaBackBtn && !contaBackBtn.dataset.hoverInit) {
        var svg = contaBackBtn.querySelector('svg');
        
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.width = '24px';
        svg.style.height = '24px';
        svg.style.flexShrink = '0';
        
        var textContent = contaBackBtn.textContent.trim();
        contaBackBtn.textContent = '';
        
        var textSpan = document.createElement('span');
        textSpan.textContent = textContent;
        textSpan.style.whiteSpace = 'nowrap';
        textSpan.style.overflow = 'hidden';
        textSpan.style.display = 'inline-block';
        
        contaBackBtn.appendChild(textSpan);
        contaBackBtn.appendChild(svg);
        
        contaBackBtn.style.flexDirection = "row";
        contaBackBtn.style.overflow = "hidden";
        
        gsap.set(textSpan, { width: 'auto', opacity: 1, marginRight: '0.75rem' });
        var textWidth = textSpan.offsetWidth;
        
        gsap.set(textSpan, { width: 0, opacity: 0, marginRight: 0, immediateRender: true });
        
        contaBackBtn.addEventListener('mouseenter', function() {
            gsap.to(textSpan, { width: textWidth, opacity: 1, marginRight: '0.75rem', duration: 0.5, ease: "power3.out" });
        });
        contaBackBtn.addEventListener('mouseleave', function() {
            gsap.to(textSpan, { width: 0, opacity: 0, marginRight: 0, duration: 0.4, ease: "power3.out" });
        });
        
        contaBackBtn.dataset.hoverInit = 'true';
    }
}

// ====== BOTÃO SUBIR NO RODAPÉ ======
var scrollTopBtnFooter = document.getElementById('scrollTopBtnFooter');
if (scrollTopBtnFooter) {
  scrollTopBtnFooter.addEventListener('click', function() {
    lenis.scrollTo(0, { duration: 1.5 });
  });
}

// ====== Inicializações finais ======
initFaqAccordion();
initRecHover();


// =========================================
// DIRECTIONAL BUTTON HOVER (Borda carregando do mouse)
// =========================================
function initDirectionalButtons() {
  const strokeButtons = document.querySelectorAll('.button--stroke');
  strokeButtons.forEach(btn => {
    const flair = btn.querySelector('.button__flair');
    if (!flair) return;

    btn.addEventListener('mouseenter', (e) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      let startAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
      if (startAngle < 0) startAngle += 360;

      flair.style.transition = 'none';
      flair.style.setProperty('--start-angle', startAngle + 'deg');
      flair.style.setProperty('--border-angle', '0deg');
      
      void flair.offsetHeight;
      
      flair.style.transition = '';
      flair.style.setProperty('--border-angle', '360deg');
    });

    btn.addEventListener('mouseleave', () => {
      flair.style.setProperty('--border-angle', '0deg');
    });
  });
}
initDirectionalButtons();

// ====== EFEITO HOVER NO BOTÃO VOLTAR (CONTA) ======
function initContaBackBtn() {
    const contaBackBtn = document.querySelector('#page-conta .btn-back-auth--fixed');
    if (contaBackBtn && !contaBackBtn.dataset.hoverInit) {
        const svg = contaBackBtn.querySelector('svg');
        
        // Aumenta o tamanho da seta, mas um pouco menor que antes para caber no botão diminuido
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.width = '24px';
        svg.style.height = '24px';
        svg.style.flexShrink = '0';
        
        const textContent = contaBackBtn.textContent.trim();
        contaBackBtn.textContent = ''; // Limpa o texto solto
        
        // Cria um span para o texto
        const textSpan = document.createElement('span');
        textSpan.textContent = textContent;
        textSpan.style.whiteSpace = 'nowrap';
        textSpan.style.overflow = 'hidden';
        textSpan.style.display = 'inline-block';
        
        // Adiciona o Texto PRIMEIRO, e a Seta DEPOIS
        // Assim, quando o texto crescer, ele empurra a seta para a direita
        contaBackBtn.appendChild(textSpan);
        contaBackBtn.appendChild(svg);
        
        // Garante que a direção do flex seja normal (texto depois seta)
        contaBackBtn.style.flexDirection = "row";
        contaBackBtn.style.overflow = "hidden";
        
        // Mede a largura do texto
        gsap.set(textSpan, { width: 'auto', opacity: 1, marginRight: '0.75rem' });
        const textWidth = textSpan.offsetWidth;
        
        // Estado inicial: texto escondido (largura 0)
        gsap.set(textSpan, { width: 0, opacity: 0, marginRight: 0, immediateRender: true });
        
        // Anima no hover
        contaBackBtn.addEventListener('mouseenter', () => {
            gsap.to(textSpan, { width: textWidth, opacity: 1, marginRight: '0.75rem', duration: 0.5, ease: "power3.out" });
        });
        contaBackBtn.addEventListener('mouseleave', () => {
            gsap.to(textSpan, { width: 0, opacity: 0, marginRight: 0, duration: 0.4, ease: "power3.out" });
        });
        
        contaBackBtn.dataset.hoverInit = 'true';
    }
}

// ====== Inicializações finais ======
initRecHover();