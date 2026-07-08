/**
 * interactive-card.js
 * Manejador de interacciones del card: stages, toggles, efectos.
 * Adaptado para funcionar dentro de shadow DOM.
 * Cada card-viewport crea su propia instancia.
 */
class InteractiveCard {
  constructor(shadowRoot) {
    this.shadow = shadowRoot;
    this.config = {};
    this.state = {};
  }

  /** Inicializa el card con una configuración específica del feed */
  init(cardConfig = {}) {
    this.config = {
      feedType: 'vas_ir',
      stages: ['s1', 's2'],
      initialStage: 's1',
      selectors: {
        card: '.canvas',
        stageS1: '#stageS1',
        stageS2: '#stageS2',
        glassBack: '.glass-back',
        glassFront: '.glass-front',
        glassComments: '.glass-comments',
        mediabox: '.media-box',
        mainImage: '#mainImage',
        carouselDots: '#carouselDots',
        carouselDot: '.carousel-dot',
        btnTheme: '.btn-theme',
        btnVerSponsor: '.btn-sponsor',
        btnBackToS1: '#btnBackToS1',
        commentInput: '#commentInput',
        commentList: '#commentsList',
        btnFabPublicar: '#btnFabPublicar',
        railBtns: '.rail-btn[data-action]',
        cardActions: '#cardActions',
        s2Rail: '.s2-rail',
        title: '.title',
        frontTitle: '.front-title',
        frontDesc: '.front-desc',
        watermark: '.watermark',
        platilloName: '.platillo-name',
        badge: '.badge',
      },
      ...cardConfig,
    };

    this.state = {
      currentStage: this.config.initialStage,
      currentImageIndex: 0,
      images: cardConfig.images || [],
      currentTheme: 0,
      themes: ['t0', 't1', 't2', 't3', 't4', 't5'],
      glassExpanded: false,
      postId: cardConfig.postId || '',
      sponsorId: cardConfig.sponsorId || '',
      channel: cardConfig.channel || 'vas_ir',
      feedType: this.config.feedType,
    };

    this.bindEvents();
    this.renderStage(this.state.currentStage);
  }

  /** Obtiene el estado actual */
  getState() {
      return { ...this.state };
  }

  /** Actualiza una parte del estado */
  setState(partial) {
      Object.assign(this.state, partial);
  }

  /** Renderiza el stage actual (S1 o S2) */
  renderStage(stage) {
    const s1 = this.shadow.querySelector(this.config.selectors.stageS1);
    const s2 = this.shadow.querySelector(this.config.selectors.stageS2);
    const mediabox = this.shadow.querySelector(this.config.selectors.mediabox);
    const cardActions = this.shadow.querySelector(this.config.selectors.cardActions);

    if (stage === 's1') {
      if (s1) s1.style.display = '';
      if (s2) s2.style.display = 'none';
      // Media box sobre botones (120px)
      if (mediabox) mediabox.style.bottom = '120px';
      // Mostrar card-actions
      if (cardActions) cardActions.style.display = 'flex';
    } else if (stage === 's2') {
      if (s1) s1.style.display = 'none';
      if (s2) s2.style.display = '';
      // Media box sobre glass de comentarios (250px)
      if (mediabox) mediabox.style.bottom = '250px';
      // Ocultar card-actions
      if (cardActions) cardActions.style.display = 'none';
    }

    this.state.currentStage = stage;
    const card = this.shadow.querySelector(this.config.selectors.card);
    if (card) card.dataset.stage = stage;
  }

  /** Cambia al siguiente stage (S1 → S2) */
  nextStage() {
    if (this.state.currentStage === 's1') {
      this.renderStage('s2');
    }
  }

  /** Cambia al stage anterior (S2 → S1) */
  prevStage() {
    if (this.state.currentStage === 's2') {
      this.renderStage('s1');
    }
  }

  /** Navega a la siguiente imagen del carrusel */
  nextImage() {
    const images = this.state.images;
    if (images.length === 0) return;
    const next = (this.state.currentImageIndex + 1) % images.length;
    this.goToImage(next);
  }

  /** Va a una imagen específica del carrusel */
  goToImage(index) {
    const images = this.state.images;
    if (images.length === 0) return;
    const img = this.shadow.querySelector(this.config.selectors.mainImage);
    const dots = this.shadow.querySelectorAll(this.config.selectors.carouselDot);
    if (!img) return;

    this.state.currentImageIndex = index;
    img.src = images[index];
    dots.forEach((d, idx) => {
      d.classList.toggle('active', idx === index);
    });
  }

  /** Toggle del glass front (expandir/colapsar P2) */
  toggleGlass() {
    const glass = this.shadow.querySelector(this.config.selectors.glassFront);
    if (!glass) return;

    this.state.glassExpanded = !this.state.glassExpanded;
    glass.classList.toggle('active', this.state.glassExpanded);
  }

  /** Colapsa el glass front */
  collapseGlass() {
    const glass = this.shadow.querySelector(this.config.selectors.glassFront);
    if (!glass) return;
    this.state.glassExpanded = false;
    glass.classList.remove('active');
  }

  /** Expande el glass front (sube al hero) */
  expandGlass() {
    const glass = this.shadow.querySelector(this.config.selectors.glassFront);
    if (!glass) return;
    this.state.glassExpanded = true;
    glass.classList.add('active');
  }

  /** Cambia al siguiente tema */
  nextTheme() {
    const card = this.shadow.querySelector(this.config.selectors.card);
    if (!card) return;
    card.classList.remove(this.state.themes[this.state.currentTheme]);
    this.state.currentTheme = (this.state.currentTheme + 1) % this.state.themes.length;
    card.classList.add(this.state.themes[this.state.currentTheme]);
  }

  /** Vincula eventos del DOM (shadow) */
  bindEvents() {
    const s = this.shadow;

    // ─── Glass toggle (P1 ↔ P2) ───
    const title = s.querySelector(this.config.selectors.title);
    const glassFront = s.querySelector(this.config.selectors.glassFront);
    if (title) {
      title.addEventListener('click', (e) => {
        e.stopPropagation();
        this.expandGlass();
      });
    }
    if (glassFront) {
      glassFront.addEventListener('click', () => {
        this.collapseGlass();
      });
    }

    // ─── Carrusel: click en media box ───
    const mediabox = s.querySelector(this.config.selectors.mediabox);
    if (mediabox) {
      mediabox.addEventListener('click', (e) => {
        if (e.target.closest(
          `${this.config.selectors.carouselDots},` +
          `${this.config.selectors.badge},` +
          `${this.config.selectors.watermark},` +
          `${this.config.selectors.platilloName}`
        )) return;
        this.nextImage();
      });
    }

    // ─── Dots del carrusel ───
    const dots = s.querySelectorAll(this.config.selectors.carouselDot);
    dots.forEach(d => {
      d.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToImage(parseInt(d.dataset.index, 10));
      });
    });

    // ─── Botón temas (arcoíris) ───
    const btnTheme = s.querySelector(this.config.selectors.btnTheme);
    if (btnTheme) {
      btnTheme.addEventListener('click', () => this.nextTheme());
    }

    // ─── Botón "Ver Sponsor" → cambia a S2 ───
    const btnSponsor = s.querySelector(this.config.selectors.btnVerSponsor);
    if (btnSponsor) {
      btnSponsor.addEventListener('click', () => {
        const sid = btnSponsor.dataset.sponsorId || this.state.sponsorId;
        if (sid) {
          this.setState({ sponsorId: sid });
          // Disparar evento hacia el Web Component padre
          this.shadow.host.dispatchEvent(new CustomEvent('ver-sponsor', {
            detail: { sponsorId: sid },
            bubbles: true,
            composed: true,
          }));
        }
      });
    }

    // ─── Botón retorno S2 → S1 ───
    const btnBack = s.querySelector(this.config.selectors.btnBackToS1);
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.shadow.host.dispatchEvent(new CustomEvent('back-to-s1', {
          bubbles: true,
          composed: true,
        }));
      });
    }

    // ─── Input de comentario (Enter) ───
    const commentInput = s.querySelector(this.config.selectors.commentInput);
    if (commentInput) {
      commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = commentInput.value.trim();
          if (text) {
            this.shadow.host.dispatchEvent(new CustomEvent('send-comment', {
              detail: { postId: this.state.postId, text },
              bubbles: true,
              composed: true,
            }));
            commentInput.value = '';
          }
        }
      });
    }

    // ─── FAB Publicar ───
    const btnFab = s.querySelector(this.config.selectors.btnFabPublicar);
    if (btnFab) {
      btnFab.addEventListener('click', () => {
        this.shadow.host.dispatchEvent(new CustomEvent('open-publish', {
          detail: { sponsorId: this.state.sponsorId, channel: this.state.channel },
          bubbles: true,
          composed: true,
        }));
      });
    }

    // ─── Botones del rail (Chocalas, Morrar, Pasalo, Califica) ───
    const railBtns = s.querySelectorAll(this.config.selectors.railBtns);
    railBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action) {
          this.shadow.host.dispatchEvent(new CustomEvent('rail-action', {
            detail: { action, postId: this.state.postId },
            bubbles: true,
            composed: true,
          }));
        }
      });
    });
  }

  /** Destruye el card (libera eventos) */
  destroy() {
    // Por ahora no hay listeners removibles individualmente
    // Al rerenderizar el shadow DOM se eliminan automáticamente
  }
}
