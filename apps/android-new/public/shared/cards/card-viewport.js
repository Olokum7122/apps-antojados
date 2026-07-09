
/**
 * card-viewport.js
 * Web Component que monta una card HTML según el canal.
 * Cachea los assets (CSS/JS) una sola vez.
 * 
 * Stages: S1 (sin sponsorId) y S2 (con sponsorId).
 * 
 * Uso:
 *   <card-viewport
 *     channel="vas_ir"
 *     post='{"id":"xxx","docJson":{...},"media":[...],"sponsorId":"yyy","comments":[...]}'
 *   ></card-viewport>
 */
class CardViewport extends HTMLElement {
  static #cache = new Map(); // channel -> { html, loaded }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._channel = '';
    this._post = null;
    this._stage = 's1'; // 's1' = gallery, 's2' = negocio overlay
  }

  static get observedAttributes() {
    return ['channel', 'post', 'stage'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'channel') {
      this._channel = newVal;
    }
    if (name === 'stage') {
      this._stage = (newVal === 's2') ? 's2' : 's1';
    }
    if (name === 'post') {
      try {
        this._post = JSON.parse(newVal);
      } catch (e) {
        this._post = null;
      }
    }
    if (this._channel && this._post) this.#render();
  }

  async #render() {
    console.log('[DIAG card-viewport] #render START channel:', this._channel, 'post.id:', this._post?.id);
    try {
      const shadow = this.shadowRoot;
      const channel = this._channel;
      const post = this._post;
      if (!channel || !post) {
        console.log('[DIAG card-viewport] #render SKIP — no channel or post');
        return;
      }

      const isS2 = (this._stage === 's2');
      const docJson = post.docJson || {};
      const media = post.media || [];
      const sponsorId = post.sponsorId || '';
      const comments = post.comments || [];

      console.log('[DIAG card-viewport] stage:', this._stage, 'isS2:', isS2, 'sponsorId:', sponsorId, 'media.count:', media.length);
      console.log('[DIAG card-viewport] docJson keys:', Object.keys(docJson));
      console.log('[DIAG card-viewport] docJson.titulo:', docJson.titulo);
      console.log('[DIAG card-viewport] docJson.badge:', docJson.badge);
      console.log('[DIAG card-viewport] docJson.nombre_platillo:', docJson.nombre_platillo);
      console.log('[DIAG card-viewport] media[0]:', media[0]);

      // 1. Obtener template cacheado (único index.html para todos los canales)
      let entry = CardViewport.#cache.get('_index_html');
      if (!entry) {
        try {
          const resp = await fetch('/shared/cards/index.html');
          entry = { html: await resp.text(), loaded: true };
          CardViewport.#cache.set('_index_html', entry);
        } catch (err) {
          console.error('[card-viewport] FETCH ERROR:', err.message);
          shadow.innerHTML = `<div style="color:red">Error loading card: ${err.message}</div>`;
          return;
        }
      }

      // 2. Remplazar marcadores comunes
      let cardHtml = entry.html;
      const watermark = channel === 'arre' ? 'ARRE' : 'VAS IR';
      cardHtml = cardHtml.replace(/\{\{watermark\}\}/g, watermark);
      console.log('[DIAG card-viewport] template BEFORE replace (first 300 chars):', cardHtml.substring(0, 300));
    cardHtml = cardHtml.replace(/\{\{titulo\}\}/g, docJson.titulo || '');
    cardHtml = cardHtml.replace(/\{\{nombre_platillo\}\}/g, docJson.nombre_platillo || '');
    cardHtml = cardHtml.replace(/\{\{badge\}\}/g, docJson.badge || 'PROMO');
    cardHtml = cardHtml.replace(/\{\{descripcion\}\}/g, 
      (docJson.descripciones && docJson.descripciones[0]) || '');
    cardHtml = cardHtml.replace(/\{\{texto_promo\}\}/g, docJson.texto_promo || '');
    cardHtml = cardHtml.replace(/\{\{sponsor_id\}\}/g, sponsorId);

    // Carrusel (reemplaza en ambos stages ya que tienen el mismo marcador)
    let dotsHtml = '';
    let firstImg = '';
    if (media.length > 0) {
      firstImg = media[0];
      dotsHtml = media.map((_, i) =>
        `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
      ).join('');
    }
    cardHtml = cardHtml.replace(/\{\{main_image\}\}/g, firstImg);
    cardHtml = cardHtml.replace(/\{\{carousel_dots\}\}/g, dotsHtml);

    console.log('[DIAG card-viewport] firstImg:', firstImg);
    console.log('[DIAG card-viewport] dotsHtml:', dotsHtml);

    // Comentarios para S2
    let commentsHtml = '';
    if (comments.length > 0) {
      commentsHtml = comments.map(c =>
        `<div class="comment-item"><strong>@${c.user || c.usuario || 'anon'}</strong><span>${c.text || c.mensaje || ''}</span></div>`
      ).join('');
    }
    cardHtml = cardHtml.replace(/\{\{comments_html\}\}/g, commentsHtml);
    console.log('[DIAG card-viewport] cardHtml AFTER replace (first 300 chars):', cardHtml.substring(0, 300));

    // 3. Cargar roots.css cacheado
    if (!CardViewport.#cache.has('_roots_css')) {
      try {
        const resp = await fetch('/shared/cards/roots.css');
        const css = await resp.text();
        CardViewport.#cache.set('_roots_css', css);
      } catch { /* fallback */ }
    }
    const rootsCss = CardViewport.#cache.get('_roots_css') || '';

    // 4. Renderizar en shadow DOM
    shadow.innerHTML = `
      <style>${rootsCss}</style>
      <style>
        :host { display: block; width: 100%; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .canvas {
          width: 100%;
          aspect-ratio: 24 / 40;
          background: var(--canvas-bg, #0a0c12);
          border-radius: 28px;
          position: relative;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.8);
          overflow: hidden;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          color: var(--text-primary, #fff);
        }
        .main-container {
          width: 100%; height: 100%; position: relative;
          transition: background 0.3s ease;
        }
        /* ── S1 styles ── */
        .glass-back {
          position: absolute; bottom: 0; left: 0; right: 0; height: 250px; z-index: 1;
          background: var(--glass-bg,rgba(20,25,38,0.7));
          backdrop-filter: blur(var(--glass-blur,18px));
          -webkit-backdrop-filter: blur(var(--glass-blur,18px));
          pointer-events: none;
        }
        .glass-back .title {
          position: absolute; bottom: 70px; left: 14px;
          font-size: 22px; font-weight: 800;
          color: var(--text-primary,#fff);
          pointer-events: auto; cursor: pointer; z-index: 5;
        }
        .media-box {
          position: absolute; top: 10px; left: 10px; right: 10px;
          height: auto;
          border-radius: 16px; overflow: hidden; cursor: pointer; z-index: 10;
        }
        .media-box img {
          width: 100%;
          height: auto;
          object-fit: cover;
          display: block;
        }
        .badge {
          position: absolute; top: 12px; left: 12px; z-index: 15;
          padding: 4px 12px; border-radius: 999px;
          font-size: 11px; font-weight: 700;
          color: var(--badge-color,#fff); background: var(--badge-bg,#f97316);
          pointer-events: none;
        }
        .watermark {
          position: absolute; top: 14px; right: 14px; z-index: 15;
          font-size: 10px; font-weight: 600;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase; letter-spacing: 0.12em;
          pointer-events: none;
        }
        .platillo-name {
          position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
          z-index: 15; font-size: 11px; font-weight: 700;
          color: #fff; text-transform: uppercase; letter-spacing: 0.08em;
          background: rgba(0,0,0,0.4); padding: 3px 12px; border-radius: 999px;
          backdrop-filter: blur(4px); pointer-events: none; white-space: nowrap;
        }
        .carousel-dots {
          position: absolute; bottom: 44px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px; z-index: 15;
        }
        .carousel-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.35); transition: background 0.2s;
        }
        .carousel-dot.active { background: var(--btn-bg,#f59e0b); }
        .card-actions {
          position: absolute; bottom: 10px; left: 10px; right: 10px;
          z-index: 30; height: 40px; display: flex; gap: 8px;
        }
        .btn-sponsor {
          flex: 1; height: 40px; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          background: var(--btn-bg,#f59e0b); color: var(--btn-color,#0a0c12);
          transition: opacity 0.15s; font-family: inherit;
        }
        .btn-sponsor:hover { opacity: 0.9; }
        .btn-theme {
          width: 40px; height: 40px; border: none; border-radius: 10px;
          cursor: pointer; flex-shrink: 0;
          background: linear-gradient(135deg,#ff0000,#ff8800,#ffff00,#00ff00,#0088ff,#8800ff,#ff0088);
          transition: opacity 0.15s;
        }
        .btn-theme:hover { opacity: 0.85; }
        .glass-front {
          position: absolute; bottom: 0; left: 0; right: 0; height: 250px; z-index: 20;
          background: var(--glass-bg,rgba(20,25,38,0.7));
          backdrop-filter: blur(var(--glass-blur,18px));
          -webkit-backdrop-filter: blur(var(--glass-blur,18px));
          display: none; padding: 14px; cursor: pointer;
        }
        .glass-front.active { display: block; }
        .glass-front .front-title {
          position: absolute; top: 10px; left: 14px;
          font-size: 22px; font-weight: 800;
          color: var(--text-primary,#fff); margin-bottom: 4px;
        }
        .glass-front .front-desc {
          position: absolute; top: 50px; left: 14px; right: 14px;
          font-size: 14px; line-height: 1.45;
          color: var(--text-secondary,rgba(255,255,255,0.75));
        }
        /* ── S2: Glass P3 (comentarios) ── */
        .glass-comments {
          position: absolute; bottom: 0; left: 0; right: 0; height: 250px; z-index: 20;
          background: var(--glass-bg,rgba(20,25,38,0.7));
          backdrop-filter: blur(var(--glass-blur,18px));
          -webkit-backdrop-filter: blur(var(--glass-blur,18px));
          display: flex; padding: 12px 14px; flex-direction: column;
          pointer-events: auto;
        }
        /* En S2, la media box debe detenerse arriba del glass de comentarios */
        .stage-s2 .media-box {
          bottom: 250px !important;
        }
        /* En S2, ocultar los card-actions (tema + ver sponsor) */
        .stage-s2 .card-actions {
          display: none !important;
        }
        /* ── S2: Botón de retorno S2 → S1 ── */
        .s2-back {
          position: absolute; top: 12px; left: 12px; z-index: 40;
          width: 40px; height: 40px; border: none; border-radius: 50%;
          background: rgba(0,0,0,0.42); backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          touch-action: manipulation; transition: background 0.15s;
        }
        .s2-back:hover { background: rgba(0,0,0,0.6); }
        .s2-back:active { transform: scale(0.92); }
        .comments-list {
          flex: 1; overflow-y: auto; display: flex; flex-direction: column;
          gap: 5px; padding-bottom: 6px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.15) transparent;
        }
        .comments-list::-webkit-scrollbar { width: 4px; }
        .comments-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .comment-item {
          display: block; min-height: 24px; padding: 5px 10px;
          border-radius: 8px; background: rgba(255,255,255,0.06);
          line-height: 1.3; font-size: 12px;
        }
        .comment-item strong { color: var(--btn-bg,#f59e0b); font-size: 12px; margin-right: 6px; }
        .comment-item span { color: rgba(255,255,255,0.72); font-size: 12px; }
        .comments-input-row {
          display: flex; gap: 8px; padding-top: 4px; flex-shrink: 0;
        }
        .comments-input {
          flex: 1; min-height: 34px; padding: 0 14px; border: 0;
          border-radius: 999px; outline: 0; color: #fff;
          background: rgba(12,14,20,0.82); font-size: 13px; font-family: inherit;
        }
        .comments-input::placeholder { color: rgba(255,255,255,0.3); }
        /* ── Stage visibility ── */
        .stage-s1 { display: var(--s1-display, block); }
        .stage-s2 { display: var(--s2-display, none); }
      </style>
      <div class="canvas t0" id="canvasContainer">
        <div class="main-container">
          ${cardHtml}
        </div>
      </div>
    `;

    // 5. Activar stage según isS2
    // S1 siempre visible (contiene media box + imagen compartida por ambos stages)
    // S2 visible solo cuando hay sponsorId (overlay de comentarios + rail)
    const stageS1 = shadow.querySelector('#stageS1');
    const stageS2 = shadow.querySelector('#stageS2');
    if (stageS1) stageS1.style.display = 'block';
    if (stageS2) stageS2.style.display = isS2 ? 'block' : 'none';

    // 6. Inicializar interactividad
    this.#initInteraction(post, isS2);
    } catch (e) {
      console.error('[card-viewport] #render error:', e);
      this.shadowRoot.innerHTML = `<div style="color:red;padding:20px">Error: ${e.message}</div>`;
    }
  }

  #initInteraction(post, isS2) {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    const media = post.media || [];
    const images = media.length > 0 ? media : []; // Sin fallback de internet

    // ─── Elementos compartidos S1/S2 ───
    const img = shadow.querySelector('#mainImage');
    const mb = shadow.querySelector('.media-box');
    const dots = shadow.querySelectorAll('#carouselDots .carousel-dot');
    const canvasContainer = shadow.querySelector('#canvasContainer');
    const cardActions = shadow.querySelector('#cardActions');

    if (!img || !mb) return;

    let ci = 0;
    const themes = ['t0', 't1', 't2', 't3', 't4', 't5'];
    let currentTheme = 0;

    function si(i) {
      ci = i;
      img.src = images[i];
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    }

    // ─── Ajustes de layout según stage ───
    if (isS2) {
      // S2: media box se detiene arriba del glass de comentarios (250px)
      mb.style.bottom = '250px';
      // S2: ocultar card-actions (botón tema + ver sponsor)
      if (cardActions) cardActions.style.display = 'none';
    } else {
      // S1: media box usa inset:10px del CSS (sin bottom constraint)
      // No se modifica mb.style.bottom — el CSS .media-box { inset: 10px } ya aplica
      if (cardActions) cardActions.style.display = 'flex';
    }

    // ─── Carrusel (S1 y S2) ───
    mb.addEventListener('click', (e) => {
      if (e.target.closest('.carousel-dots,.badge,.watermark,.platillo-name')) return;
      si((ci + 1) % images.length);
    });

    dots.forEach(d => {
      d.addEventListener('click', (e) => {
        e.stopPropagation();
        si(parseInt(d.dataset.index, 10));
      });
    });

    // ─── Solo S1: temas + P1/P2 ───
    if (!isS2) {
      const btnTheme = shadow.querySelector('.btn-theme');
      const g2 = shadow.querySelector('.glass-front');
      const t = shadow.querySelector('.title');

      if (btnTheme) {
        btnTheme.addEventListener('click', () => {
          canvasContainer.classList.remove(themes[currentTheme]);
          currentTheme = (currentTheme + 1) % themes.length;
          canvasContainer.classList.add(themes[currentTheme]);
        });
      }

      // P1 ↔ P2
      if (t && g2) {
        t.addEventListener('click', (e) => {
          e.stopPropagation();
          g2.classList.add('active');
        });
        g2.addEventListener('click', () => {
          g2.classList.remove('active');
        });
      }

      // Botón Ver Sponsor
      const btnSponsor = shadow.querySelector('.btn-sponsor');
      if (btnSponsor) {
        btnSponsor.addEventListener('click', () => {
          const sponsorId = post.sponsorId || '';
          if (sponsorId) {
            this.dispatchEvent(new CustomEvent('ver-sponsor', {
              detail: { sponsorId },
              bubbles: true,
              composed: true,
            }));
          }
      });
      }
    }

    // ─── Solo S2: botón retorno + comentarios ───
    if (isS2) {
      // Botón de retorno S2 → S1
      const btnBack = shadow.querySelector('#btnBackToS1');
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('back-to-s1', {
            bubbles: true, composed: true,
          }));
        });
      }

      const commentInput = shadow.querySelector('#commentInput');

      // Input de comentario
      if (commentInput) {
        commentInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const text = commentInput.value.trim();
            if (text) {
              this.dispatchEvent(new CustomEvent('send-comment', {
                detail: { postId: post.id, text },
                bubbles: true, composed: true,
              }));
              commentInput.value = '';
            }
          }
        });
      }
    }

    si(0);
  }
}

// Solo definir si no está ya registrado
if (!customElements.get('card-viewport')) {
  customElements.define('card-viewport', CardViewport);
}
