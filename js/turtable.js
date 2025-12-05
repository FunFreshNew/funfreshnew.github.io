class Turntable {
  constructor(config = {}) {
    // required DOM
    this.container = document.getElementById(config.containerId);
    this.viewer = document.getElementById(config.imageId);

    if (!this.container || !this.viewer) {
      console.error('Turntable: container or viewer element not found.', { containerId: config.containerId, imageId: config.imageId });
      return;
    }

    // select is optional
    this.select = config.selectId ? document.getElementById(config.selectId) : null;
    if (config.selectId && !this.select) {
      console.warn('Turntable: selectId provided but element not found. Continuing without selector.', config.selectId);
    }

    // settings
    this.fps = config.fps || 24;
    this.idleDelay = config.idleDelay || 3000;
    this.models = config.models || {};
    this.currentModel = null;
    this.images = [];
    this.frame = 0;

    // interaction and motion settings (tweakable)
    this.isPlaying = true;
    this.isDragging = false;
    this.lastX = 0;
    this.velocity = 0;
    this.momentum = 0;
    this.momentumDecay = config.momentumDecay ?? 0.94;
    this.dragSensitivity = config.dragSensitivity ?? 1;
    this.momentumSensitivity = config.momentumSensitivity ?? 1.2;
    this.cooldownAfterInteraction = config.cooldownAfterInteraction ?? 1500;
    this.autoPlayTimer = null;

    // populate select if present
    this.loadSelectOptions();

    // global listeners for drag outside container support
    this.addListeners();

    // Auto-load first model if any models defined
    const modelKeys = Object.keys(this.models);
    if (modelKeys.length === 0) {
      console.error('Turntable: no models provided in config.models');
      return;
    }

    // Prefer to load the model selected in the <select> if it exists and has a value,
    // otherwise load the first model key.
    const initialKey = (this.select && this.select.value) ? this.select.value : modelKeys[0];
    this.loadModel(initialKey).catch(err => {
      console.error('Turntable: failed to load initial model', err);
    });
  }

  loadSelectOptions() {
    if (!this.select) return; // optional

    // clear existing options
    this.select.innerHTML = '';

    for (const key in this.models) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      this.select.appendChild(opt);
    }

    // when user changes selection, load that model
    this.select.addEventListener('change', () => {
      const k = this.select.value;
      if (k && this.models[k]) this.loadModel(k);
    });
  }

  async loadModel(name) {
    if (!this.models[name]) {
      console.error('Turntable: model not found:', name);
      return;
    }

    // stop any existing playback while we load
    this.stopPlay();

    this.currentModel = this.models[name];
    this.images = [];
    this.frame = 0;
    this.viewer.src = ''; // clear while loading

    const model = this.currentModel;
    const frameCount = model.frameCount || 0;
    if (frameCount <= 0) {
      console.error('Turntable: model.frameCount must be > 0', model);
      return;
    }

    // load images
    const promises = [];
    for (let i = 0; i < frameCount; i++) {
      const idx = String(i).padStart(model.padding || 0, '0');
      const src = `${model.path}${idx}${model.ext || ''}`;
      const img = new Image();
      img.src = src;
      // optional onerror handler so Promise.all doesn't hang silently
      promises.push(new Promise((res, rej) => {
        img.onload = () => res();
        img.onerror = (e) => {
          console.warn('Turntable: image failed to load:', src, e);
          // resolve anyway — we keep the image but it will be broken; reject only if you want strict behavior
          res();
        };
      }));
      this.images.push(img);
    }

    await Promise.all(promises);

    // sanity check: at least one image loaded (even if 404 set)
    if (this.images.length === 0) {
      console.error('Turntable: no images loaded for model', name);
      return;
    }

    // show first valid image (if some frames failed this still shows whatever is available)
    this.viewer.src = this.images[0].src || '';

    // start playback loop
    this.playLoop();

    this.isPlaying = true;
  }

  playLoop() {
    // avoid starting multiple loops
    if (this._playLoopRunning) return;
    this._playLoopRunning = true;

    const interval = 1000 / this.fps;
    let lastTime = performance.now();

    const loop = (time) => {
      if (!this._playLoopRunning) return;

      const delta = time - lastTime;
      if (delta >= interval) {
        lastTime = time;

        if (this.isPlaying || Math.abs(this.momentum) > 0.0001) {
          // if playing, advance by 1 frame per tick; if flicking, advance by momentum
          this.frame += this.isPlaying ? 1 : this.momentum;

          // wrap & clamp
          while (this.frame < 0) this.frame += this.images.length;
          while (this.frame >= this.images.length) this.frame -= this.images.length;

          const idx = Math.floor(this.frame) % this.images.length;
          // defensive: ensure images[idx] exists
          if (this.images[idx]) this.viewer.src = this.images[idx].src;

          // apply momentum decay if not playing
          if (!this.isPlaying && Math.abs(this.momentum) > 0.0001) {
            this.momentum *= this.momentumDecay;
            if (Math.abs(this.momentum) <= 0.0001) {
              this.momentum = 0;
              this.scheduleAutoPlay();
            }
          }
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // Start listening (supports dragging outside container)
  addListeners() {
    // click toggles play/pause (but ignore click while dragging)
    this.container.addEventListener('click', (e) => {
      if (this._justDragged) {
        // ignore click event immediately after drag (prevents toggling when releasing drag)
        this._justDragged = false;
        return;
      }
      this.togglePlay();
    });

    // start drag on mousedown (we bind global mousemove/up so drag continues outside)
    this.container.addEventListener('mousedown', (e) => this._onStartDrag(e));
    // touch support
    this.container.addEventListener('touchstart', (e) => this._onStartDrag(e.touches ? e.touches[0] : e), { passive: true });
  }

  _onStartDrag(e) {
    this.isDragging = true;
    this.lastX = e.clientX;
    this.velocity = 0;
    this.momentum = 0;
    this.stopPlay();
    clearTimeout(this.autoPlayTimer);
    this.container.style.cursor = 'grabbing';

    // bind global handlers (so you can drag outside container)
    this._boundMove = (ev) => this._onDrag(ev.touches ? ev.touches[0] : ev);
    this._boundUp = (ev) => this._onEndDrag(ev);
    window.addEventListener('mousemove', this._boundMove);
    window.addEventListener('mouseup', this._boundUp);
    window.addEventListener('touchmove', this._boundMove, { passive: true });
    window.addEventListener('touchend', this._boundUp);

    // small flag to ignore immediate click after drag
    this._justDragged = false;
  }

  _onDrag(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastX;
    this.lastX = e.clientX;

    // update frame with sensitivity
    this.frame -= dx * this.dragSensitivity;

    // normalize/wrap
    while (this.frame < 0) this.frame += this.images.length;
    while (this.frame >= this.images.length) this.frame -= this.images.length;

    const idx = Math.floor(this.frame) % this.images.length;
    if (this.images[idx]) this.viewer.src = this.images[idx].src;

    // velocity for flick detection (smoothed)
    this.velocity = dx * 0.6 + (this.velocity || 0) * 0.4;

    // mark that we dragged (to prevent click toggles)
    this._justDragged = true;
  }

  _onEndDrag(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.container.style.cursor = 'grab';

    // remove global handlers
    if (this._boundMove) window.removeEventListener('mousemove', this._boundMove);
    if (this._boundUp) window.removeEventListener('mouseup', this._boundUp);
    window.removeEventListener('touchmove', this._boundMove);
    window.removeEventListener('touchend', this._boundUp);

    // momentum based on last velocity
    this.momentum = (-this.velocity) * this.momentumSensitivity; // invert as needed

    // small threshold: if momentum tiny, zero it
    if (Math.abs(this.momentum) < (this.flickThreshold ?? 0.05)) {
      this.momentum = 0;
    } else {
      // we paused autoplay while flicking — keep isPlaying false so momentum decays
      this.isPlaying = false;
    }

    // schedule autoplay after cooldown only when momentum reaches 0
    if (this.momentum === 0) {
      this.scheduleAutoPlay();
    }

    // short guard to ignore immediate click
    setTimeout(() => { this._justDragged = false; }, 50);
  }

  togglePlay() {
    if (this.isDragging) return;
    this.isPlaying = !this.isPlaying;
    this.momentum = 0;
    if (this.isPlaying) clearTimeout(this.autoPlayTimer);
  }

  stopPlay() {
    this.isPlaying = false;
    clearTimeout(this.autoPlayTimer);
  }

  scheduleAutoPlay() {
    clearTimeout(this.autoPlayTimer);
    this.autoPlayTimer = setTimeout(() => {
      if (!this.isDragging && this.momentum === 0) this.isPlaying = true;
    }, this.cooldownAfterInteraction);
  }
}
const viewer = new Turntable({
  containerId: 'turntable-container',
  imageId: 'turntable-viewer',
  fps: 24,
  idleDelay: 300,
  dragSensitivity: 0.8,
  momentumSensitivity: 1.5,
  momentumDecay: 0.95,
  cooldownAfterInteraction: 150,
  flickThreshold: 0.08,
  models: {
    kani: {
      path: '/source/turntable/kani-viewport/Kani poly wf',
      frameCount: 250,
      padding: 4,
      ext: '.jpg'
    }
  }
});
