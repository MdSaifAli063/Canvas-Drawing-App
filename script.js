/**
 * Canvas Studio - Enhanced Drawing App
 * - Tools: pen, eraser, line, rect, square, circle, ellipse, polygon, text
 * - Features: undo/redo, download, save/load, import, grid toggle, dash styles, XOR mode (experimental)
 * - Responsive canvas with device-pixel-ratio rendering
 */

(function () {
  // DOM
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const controlsPanel = document.getElementById('controlsPanel');
  const toggleControlsBtn = document.getElementById('toggleControls');

  const toolRadios = [...document.querySelectorAll('input[name="tool"]')];
  const lineWidthEl = document.getElementById('lineWidth');
  const lineWidthOut = document.getElementById('lineWidthOut');
  const lineCapRadios = [...document.querySelectorAll('input[name="lineCap"]')];
  const lineDashEl = document.getElementById('lineDash');
  const lineGapEl = document.getElementById('lineGap');

  const strokeColorEl = document.getElementById('strokeColor');
  const fillColorEl = document.getElementById('fillColor');
  const fillBoxEl = document.getElementById('fillBox');
  const xorEl = document.getElementById('xor');
  const backgroundColorEl = document.getElementById('backgroundColor');

  const polygonSidesEl = document.getElementById('polygonSides');
  const polygonSidesOut = document.getElementById('polygonSidesOut');

  const textInputEl = document.getElementById('textInput');
  const fontSizeEl = document.getElementById('fontSize');
  const fontSizeOut = document.getElementById('fontSizeOut');
  const fontFamilyEl = document.getElementById('fontFamily');

  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileEl = document.getElementById('importFile');
  const clearBtn = document.getElementById('clearCanvas');
  const resetSettingsBtn = document.getElementById('resetSettings');
  const gridToggleBtn = document.getElementById('gridToggle');
  const gridOverlay = document.getElementById('gridOverlay');

  const hint = document.querySelector('.hint');

  // State
  let state = {
    tool: getCheckedValue(toolRadios) || 'pen',
    stroke: strokeColorEl.value || '#1D4ED8',
    fill: fillColorEl.value || '#24B0D5',
    fillEnabled: fillBoxEl.checked,
    background: backgroundColorEl.value || '#ffffff',
    lineWidth: parseInt(lineWidthEl.value, 10) || 4,
    lineCap: getCheckedValue(lineCapRadios) || 'round',
    dash: [parseInt(lineDashEl.value, 10) || 0, parseInt(lineGapEl.value, 10) || 0],
    xor: !!xorEl.checked,
    polygonSides: parseInt(polygonSidesEl.value, 10) || 5,
    fontSize: parseInt(fontSizeEl.value, 10) || 36,
    fontFamily: fontFamilyEl.value || 'Inter, system-ui, sans-serif',
    grid: false
  };

  let drawing = false;
  let startX = 0, startY = 0;
  let lastX = 0, lastY = 0;
  let startSnapshot = null;

  // History (undo/redo)
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 50;

  // Utils
  function getCheckedValue(radioEls) {
    const r = radioEls.find(x => x.checked);
    return r ? r.value : null;
  }

  // DPR-aware sizing
  function resizeCanvasPreserve() {
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(Math.floor(rect.width), 1);
    const cssHeight = Math.max(Math.floor(rect.height), 1);

    // Preserve content
    const prev = canvas.toDataURL('image/png');

    // Resize internal buffer to CSS * DPR
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

    // Redraw previous content scaled to new canvas
    const img = new Image();
    img.onload = () => {
      // draw previous at full canvas size
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = prev;
  }

  // Pointer mapping to internal canvas space
  function getPointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (evt.touches ? evt.touches[0].clientX : evt.clientX);
    const clientY = (evt.touches ? evt.touches[0].clientY : evt.clientY);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function setCtxStyle() {
    ctx.lineWidth = state.lineWidth;
    ctx.lineCap = state.lineCap;
    ctx.strokeStyle = state.stroke;
    ctx.fillStyle = state.fill;
    ctx.setLineDash(state.dash[0] > 0 ? state.dash : []);
    if (state.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = state.xor ? 'xor' : 'source-over';
    }
  }

  function fillBackground(color) {
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = prev;
    ctx.restore();
  }

  function pushHistory() {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      undoStack.push(dataUrl);
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      // new action clears redo
      redoStack.length = 0;
      updateHistoryButtons();
    } catch (e) {
      console.warn('History push failed', e);
    }
  }

  function drawImageFromDataUrl(dataUrl, push = false) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (push) pushHistory();
    };
    img.src = dataUrl;
  }

  function updateHistoryButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }

  function undo() {
    if (undoStack.length === 0) return;
    const current = canvas.toDataURL('image/png');
    const previous = undoStack.pop();
    redoStack.push(current);
    drawImageFromDataUrl(previous, false);
    updateHistoryButtons();
  }

  function redo() {
    if (redoStack.length === 0) return;
    const current = canvas.toDataURL('image/png');
    const next = redoStack.pop();
    undoStack.push(current);
    drawImageFromDataUrl(next, false);
    updateHistoryButtons();
  }

  function takeSnapshot() {
    startSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  function restoreSnapshot() {
    if (startSnapshot) ctx.putImageData(startSnapshot, 0, 0);
  }

  // Shape helpers
  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawRect(x1, y1, x2, y2, square = false) {
    const w = x2 - x1;
    const h = y2 - y1;
    let rx = x1, ry = y1, rw = w, rh = h;
    if (square) {
      const s = Math.max(Math.abs(w), Math.abs(h));
      rw = s * Math.sign(w || 1);
      rh = s * Math.sign(h || 1);
    }
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    if (state.fillEnabled) ctx.fill();
    ctx.stroke();
  }

  function drawCircle(cx, cy, x2, y2) {
    const dx = x2 - cx, dy = y2 - cy;
    const r = Math.hypot(dx, dy);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (state.fillEnabled) ctx.fill();
    ctx.stroke();
  }

  function drawEllipse(x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (state.fillEnabled) ctx.fill();
    ctx.stroke();
  }

  function drawPolygon(cx, cy, x2, y2, sides) {
    sides = Math.max(3, sides | 0);
    const r = Math.hypot(x2 - cx, y2 - cy);
    const angleStep = (Math.PI * 2) / sides;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = -Math.PI / 2 + i * angleStep; // start pointing up
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (state.fillEnabled) ctx.fill();
    ctx.stroke();
  }

  function drawText(x, y, text) {
    const font = `${state.fontSize}px ${state.fontFamily}`;
    ctx.font = font;
    ctx.textBaseline = 'top';
    if (state.fillEnabled) {
      ctx.fillText(text, x, y);
    } else {
      ctx.strokeText(text, x, y);
    }
  }

  // Pointer handlers
  function onPointerDown(evt) {
    evt.preventDefault();
    const { x, y } = getPointerPos(evt);
    drawing = true;
    startX = lastX = x;
    startY = lastY = y;

    setCtxStyle();

    if (state.tool === 'pen' || state.tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      pushHistory();
    } else if (state.tool === 'text') {
      pushHistory();
      drawText(x, y, textInputEl.value || 'Text');
      drawing = false;
    } else {
      takeSnapshot();
    }
  }

  function onPointerMove(evt) {
    if (!drawing) return;
    const { x, y } = getPointerPos(evt);

    setCtxStyle();

    if (state.tool === 'pen' || state.tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x; lastY = y;
    } else {
      restoreSnapshot();
      switch (state.tool) {
        case 'line': drawLine(startX, startY, x, y); break;
        case 'rect': drawRect(startX, startY, x, y, false); break;
        case 'square': drawRect(startX, startY, x, y, true); break;
        case 'circle': drawCircle(startX, startY, x, y); break;
        case 'ellipse': drawEllipse(startX, startY, x, y); break;
        case 'polygon': drawPolygon(startX, startY, x, y, state.polygonSides); break;
      }
    }
  }

  function onPointerUp() {
    if (!drawing) return;
    drawing = false;
    if (state.tool !== 'pen' && state.tool !== 'eraser' && state.tool !== 'text') {
      pushHistory();
    }
  }

  function onPointerCancel() {
    drawing = false;
  }

  // Bind canvas events (mouse + touch)
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('mouseleave', onPointerCancel);

  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });
  canvas.addEventListener('touchend', onPointerUp);
  canvas.addEventListener('touchcancel', onPointerCancel);

  // UI bindings
  toolRadios.forEach(r => r.addEventListener('change', () => {
    if (r.checked) {
      state.tool = r.value;
      hint.textContent = state.tool === 'pen'
        ? 'Pen: drag to sketch freely'
        : state.tool === 'eraser'
        ? 'Eraser: drag to erase'
        : state.tool === 'text'
        ? 'Text: click on canvas to place text'
        : 'Shape: click and drag to preview and place';
    }
  }));

  lineWidthEl.addEventListener('input', () => {
    state.lineWidth = parseInt(lineWidthEl.value, 10) || 1;
    lineWidthOut.textContent = state.lineWidth;
  });
  lineCapRadios.forEach(r => r.addEventListener('change', () => {
    if (r.checked) state.lineCap = r.value;
  }));

  lineDashEl.addEventListener('input', () => {
    state.dash[0] = parseInt(lineDashEl.value, 10) || 0;
  });
  lineGapEl.addEventListener('input', () => {
    state.dash[1] = parseInt(lineGapEl.value, 10) || 0;
  });

  strokeColorEl.addEventListener('input', () => state.stroke = strokeColorEl.value);
  fillColorEl.addEventListener('input', () => state.fill = fillColorEl.value);
  fillBoxEl.addEventListener('change', () => state.fillEnabled = fillBoxEl.checked);
  xorEl.addEventListener('change', () => state.xor = xorEl.checked);

  backgroundColorEl.addEventListener('change', () => {
    if (confirm('Changing background will clear the canvas. Continue?')) {
      state.background = backgroundColorEl.value;
      fillBackground(state.background);
      pushHistory();
    } else {
      backgroundColorEl.value = state.background;
    }
  });

  polygonSidesEl.addEventListener('input', () => {
    state.polygonSides = parseInt(polygonSidesEl.value, 10) || 3;
    polygonSidesOut.textContent = state.polygonSides;
  });

  fontSizeEl.addEventListener('input', () => {
    state.fontSize = parseInt(fontSizeEl.value, 10) || 12;
    fontSizeOut.textContent = state.fontSize;
  });
  fontFamilyEl.addEventListener('change', () => state.fontFamily = fontFamilyEl.value);

  // Header actions
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  saveBtn.addEventListener('click', () => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      localStorage.setItem('canvasStudioImage', dataUrl);
      localStorage.setItem('canvasStudioBackground', state.background);
      alert('Saved to your browser storage.');
    } catch (e) {
      alert('Save failed (storage may be full or blocked).');
    }
  });

  loadBtn.addEventListener('click', () => {
    const dataUrl = localStorage.getItem('canvasStudioImage');
    const bg = localStorage.getItem('canvasStudioBackground');
    if (!dataUrl) {
      alert('No saved image found.');
      return;
    }
    if (bg) {
      state.background = bg;
      backgroundColorEl.value = bg;
    }
    drawImageFromDataUrl(dataUrl, true);
  });

  importBtn.addEventListener('click', () => importFileEl.click());
  importFileEl.addEventListener('change', () => {
    const file = importFileEl.files && importFileEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        pushHistory();
        // Clear and fill background first
        fillBackground(state.background);
        // Fit image (contain)
        const cw = canvas.width, ch = canvas.height;
        const iw = img.width, ih = img.height;
        const scale = Math.min(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    // reset input
    importFileEl.value = '';
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear canvas? This cannot be undone (except via Undo).')) return;
    pushHistory();
    fillBackground(state.background);
  });

  resetSettingsBtn.addEventListener('click', () => {
    // Defaults
    const defaults = {
      tool: 'pen',
      lineWidth: 4,
      lineCap: 'round',
      dash: [0, 0],
      stroke: '#1D4ED8',
      fill: '#24B0D5',
      fillEnabled: true,
      xor: false,
      polygonSides: 5,
      fontSize: 36,
      fontFamily: 'Inter, system-ui, sans-serif',
      background: '#ffffff',
      grid: false,
    };
    // Apply to DOM
    toolRadios.forEach(r => r.checked = (r.value === defaults.tool));
    lineWidthEl.value = String(defaults.lineWidth);
    lineWidthOut.textContent = String(defaults.lineWidth);
    lineCapRadios.forEach(r => r.checked = (r.value === defaults.lineCap));
    lineDashEl.value = String(defaults.dash[0]);
    lineGapEl.value = String(defaults.dash[1]);
    strokeColorEl.value = defaults.stroke;
    fillColorEl.value = defaults.fill;
    fillBoxEl.checked = defaults.fillEnabled;
    xorEl.checked = defaults.xor;
    polygonSidesEl.value = String(defaults.polygonSides);
    polygonSidesOut.textContent = String(defaults.polygonSides);
    fontSizeEl.value = String(defaults.fontSize);
    fontSizeOut.textContent = String(defaults.fontSize);
    fontFamilyEl.value = defaults.fontFamily;
    backgroundColorEl.value = defaults.background;
    gridOverlay.classList.remove('on');

    // Apply to state
    state = { ...state, ...defaults };
    hint.textContent = 'Pen: drag to sketch freely';
  });

  gridToggleBtn.addEventListener('click', () => {
    state.grid = !state.grid;
    gridOverlay.classList.toggle('on', state.grid);
  });

  toggleControlsBtn.addEventListener('click', () => {
    const open = controlsPanel.classList.toggle('open');
    toggleControlsBtn.setAttribute('aria-expanded', String(open));
    toggleControlsBtn.textContent = open ? 'Hide Controls' : 'Show Controls';
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (!mod) {
      const k = e.key.toLowerCase();
      if (k === 'p') selectTool('pen');
      if (k === 'e') selectTool('eraser');
      if (k === 't') selectTool('text');
      if (k === 'g') { state.grid = !state.grid; gridOverlay.classList.toggle('on', state.grid); }
    }
  });

  function selectTool(name) {
    const r = toolRadios.find(r => r.value === name);
    if (r) {
      r.checked = true;
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // Initialize
  function init() {
    // Size canvas to container DPR, preserving aspect content on resize
    const doResize = () => {
      resizeCanvasPreserve();
    };
    // First resize, then set initial bg if empty
    doResize();
    // If canvas is blank, fill background
    fillBackground(state.background);
    pushHistory();
    updateHistoryButtons();

    // Keep outputs in sync initially
    lineWidthOut.textContent = String(state.lineWidth);
    polygonSidesOut.textContent = String(state.polygonSides);
    fontSizeOut.textContent = String(state.fontSize);

    // Debounced resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 150);
    }, { passive: true });
  }

  init();
})();