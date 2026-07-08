/**
 * fab-publicar.js
 * Web Component para el flujo de publicación (P1 → P2 → Publicar).
 * Se monta en viewport completo cuando el FAB es presionado.
 * 
 * Uso:
 *   <fab-publicar
 *     sponsor-id="xxx"
 *     channel="vas_ir"
 *   ></fab-publicar>
 */
class FabPublicar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._sponsorId = '';
    this._channel = 'vas_ir';
    this._selectedFiles = [];
    this._selectedBadge = 'PROMO';
  }

  static get observedAttributes() {
    return ['sponsor-id', 'channel'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'sponsor-id') this._sponsorId = newVal || '';
    if (name === 'channel') this._channel = newVal || 'vas_ir';
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    const shadow = this.shadowRoot;
    shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          background: #0a0c12;
          color: #fff;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }
        .fab-publish {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }
        .fab-publish__header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fab-publish__back {
          width: 38px; height: 38px; border: none; border-radius: 50%;
          background: rgba(255,255,255,0.08); color: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          touch-action: manipulation;
        }
        .fab-publish__back:hover { background: rgba(255,255,255,0.15); }
        .fab-publish__step {
          font-size: 12px; color: rgba(255,255,255,0.4);
          font-weight: 600; margin-left: auto;
        }
        .fab-publish__title { font-size: 16px; font-weight: 700; }
        .fab-publish__stage {
          flex: 1; display: flex; flex-direction: column;
          padding: 16px; overflow-y: auto;
        }
        .fab-publish__media-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .fab-publish__media-item {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 2px dashed rgba(255,255,255,0.12);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
          position: relative;
        }
        .fab-publish__media-item--add {
          color: rgba(255,255,255,0.4);
          gap: 4px; font-size: 11px; font-weight: 600;
        }
        .fab-publish__media-item--add:hover {
          border-color: var(--btn-bg,#f59e0b);
          color: var(--btn-bg,#f59e0b);
          background: rgba(245,158,11,0.06);
        }
        .fab-publish__media-item img {
          width: 100%; height: 100%; object-fit: cover;
          position: absolute; top: 0; left: 0;
        }
        .fab-publish__media-item .remove-btn {
          position: absolute; top: 4px; right: 4px; z-index: 2;
          width: 24px; height: 24px; border-radius: 50%; border: none;
          background: rgba(0,0,0,0.6); color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; touch-action: manipulation;
        }
        .fab-publish__next-btn, .fab-publish__publish-btn {
          width: 100%; height: 50px; border: none; border-radius: 14px;
          font-size: 16px; font-weight: 700; cursor: pointer;
          font-family: inherit; margin-top: auto; flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .fab-publish__next-btn {
          background: var(--btn-bg,#f59e0b); color: var(--btn-color,#0a0c12);
        }
        .fab-publish__publish-btn {
          background: var(--btn-bg,#f59e0b); color: var(--btn-color,#0a0c12);
        }
        .fab-publish__next-btn:hover, .fab-publish__publish-btn:hover { opacity: 0.85; }
        .fab-publish__next-btn:disabled, .fab-publish__publish-btn:disabled {
          opacity: 0.3; cursor: not-allowed;
        }
        .fab-publish__form {
          display: flex; flex-direction: column; gap: 14px;
        }
        .fab-publish__field {
          display: flex; flex-direction: column; gap: 4px;
        }
        .fab-publish__field label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          color: rgba(255,255,255,0.4); letter-spacing: 0.06em;
        }
        .fab-publish__field input, .fab-publish__field textarea {
          width: 100%; padding: 12px 14px; border: 0;
          border-radius: 10px; outline: 0; color: #fff;
          background: rgba(255,255,255,0.06);
          font-size: 14px; font-family: inherit;
          resize: none;
        }
        .fab-publish__field input:focus, .fab-publish__field textarea:focus {
          background: rgba(255,255,255,0.1);
        }
        .fab-publish__field input::placeholder, .fab-publish__field textarea::placeholder {
          color: rgba(255,255,255,0.2);
        }
        .fab-publish__badge-options {
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .badge-option {
          padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12);
          background: transparent; color: rgba(255,255,255,0.5); cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: inherit;
          transition: all 0.15s; touch-action: manipulation;
        }
        .badge-option:hover { border-color: var(--btn-bg,#f59e0b); color: #fff; }
        .badge-option.selected {
          background: var(--btn-bg,#f59e0b); color: var(--btn-color,#0a0c12);
          border-color: var(--btn-bg,#f59e0b);
        }
      </style>
      <div class="fab-publish" id="fabPublish">
        <div class="fab-publish__header">
          <button class="fab-publish__back" id="btnBack">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <span class="fab-publish__step" id="stepLabel">1 / 2</span>
          <span class="fab-publish__title">Publicar</span>
        </div>
        <div class="fab-publish__stage" id="stage1">
          <div class="fab-publish__media-grid" id="mediaGrid">
            <div class="fab-publish__media-item fab-publish__media-item--add" id="btnAddMedia">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span>Agregar foto</span>
            </div>
          </div>
          <input type="file" id="fileInput" accept="image/*" multiple style="display:none" />
          <button class="fab-publish__next-btn" id="btnToP2">Siguiente →</button>
        </div>
        <div class="fab-publish__stage" id="stage2" style="display:none">
          <div class="fab-publish__form">
            <div class="fab-publish__field">
              <label>Título</label>
              <input type="text" id="fieldTitulo" placeholder="Ej: Promo 2x1" maxlength="60" />
            </div>
            <div class="fab-publish__field">
              <label>Nombre del platillo</label>
              <input type="text" id="fieldNombre" placeholder="Ej: Taco de pastor" maxlength="60" />
            </div>
            <div class="fab-publish__field">
              <label>Descripción</label>
              <textarea id="fieldDescripcion" placeholder="Describe tu publicación..." rows="3" maxlength="200"></textarea>
            </div>
            <div class="fab-publish__field">
              <label>Badge</label>
              <div class="fab-publish__badge-options" id="badgeOptions">
                <button class="badge-option" data-badge="PROMO">PROMO</button>
                <button class="badge-option" data-badge="DESCUENTO">DESCUENTO</button>
                <button class="badge-option" data-badge="PLATILLO">PLATILLO</button>
                <button class="badge-option" data-badge="GENERAL">GENERAL</button>
              </div>
            </div>
          </div>
          <button class="fab-publish__publish-btn" id="btnPublicar">Publicar</button>
        </div>
      </div>
    `;

    this._initEvents();
  }

  _initEvents() {
    const shadow = this.shadowRoot;

    const btnBack = shadow.querySelector('#btnBack');
    btnBack.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('close-publish', {
        bubbles: true, composed: true,
      }));
    });

    const btnAddMedia = shadow.querySelector('#btnAddMedia');
    const fileInput = shadow.querySelector('#fileInput');
    btnAddMedia.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        if (this._selectedFiles.length >= 9) return;
        this._selectedFiles.push(file);
      });
      this._updateMediaGrid();
      fileInput.value = '';
    });

    const btnToP2 = shadow.querySelector('#btnToP2');
    btnToP2.addEventListener('click', () => {
      const stage1 = shadow.querySelector('#stage1');
      const stage2 = shadow.querySelector('#stage2');
      const stepLabel = shadow.querySelector('#stepLabel');
      stage1.style.display = 'none';
      stage2.style.display = 'flex';
      stepLabel.textContent = '2 / 2';
    });

    const badgeOptions = shadow.querySelector('#badgeOptions');
    badgeOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.badge-option');
      if (!btn) return;
      badgeOptions.querySelectorAll('.badge-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      this._selectedBadge = btn.dataset.badge;
    });
    const defaultBadge = badgeOptions.querySelector('[data-badge="PROMO"]');
    if (defaultBadge) defaultBadge.classList.add('selected');

    const btnPublicar = shadow.querySelector('#btnPublicar');
    btnPublicar.addEventListener('click', () => {
      const titulo = (shadow.querySelector('#fieldTitulo').value || '').trim();
      const nombre = (shadow.querySelector('#fieldNombre').value || '').trim();
      const descripcion = (shadow.querySelector('#fieldDescripcion').value || '').trim();

      if (!titulo || !nombre) return;

      this.dispatchEvent(new CustomEvent('publish-post', {
        detail: {
          sponsorId: this._sponsorId,
          channel: this._channel,
          files: this._selectedFiles,
          docJson: {
            titulo,
            nombre_platillo: nombre,
            descripciones: [descripcion],
            badge: this._selectedBadge,
            texto_promo: this._selectedBadge === 'PROMO' ? '2x1' :
                         this._selectedBadge === 'DESCUENTO' ? '20% OFF' : '',
          },
        },
        bubbles: true,
        composed: true,
      }));
    });
  }

  _updateMediaGrid() {
    const shadow = this.shadowRoot;
    const grid = shadow.querySelector('#mediaGrid');
    if (!grid) return;

    const items = grid.querySelectorAll('.fab-publish__media-item');
    items.forEach(item => {
      if (!item.classList.contains('fab-publish__media-item--add')) {
        item.remove();
      }
    });

    this._selectedFiles.forEach((file, index) => {
      const div = document.createElement('div');
      div.className = 'fab-publish__media-item';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      div.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._selectedFiles.splice(index, 1);
        URL.revokeObjectURL(img.src);
        this._updateMediaGrid();
      });
      div.appendChild(removeBtn);

      grid.insertBefore(div, document.createElement('div'));
      grid.insertBefore(div, grid.querySelector('.fab-publish__media-item--add'));
    });

    const btnToP2 = shadow.querySelector('#btnToP2');
    if (btnToP2) {
      btnToP2.disabled = this._selectedFiles.length === 0;
    }
  }
}

customElements.define('fab-publicar', FabPublicar);