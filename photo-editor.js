(function () {
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function buildFilterString(state) {
    const filters = [];
    filters.push('brightness(' + state.brightness + '%)');
    filters.push('contrast(' + state.contrast + '%)');
    filters.push('saturate(' + state.saturate + '%)');
    if (state.preset === 'bw') filters.push('grayscale(100%)');
    if (state.preset === 'sepia') filters.push('sepia(80%)');
    if (state.preset === 'vintage') filters.push('sepia(40%) contrast(115%) saturate(85%)');
    return filters.join(' ');
  }

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  window.openPhotoEditor = function (fileOrBlob) {
    return new Promise((resolve) => {
      loadImageFromBlob(fileOrBlob).then((img) => {
        const workingCanvas = document.createElement('canvas');
        workingCanvas.width = img.naturalWidth;
        workingCanvas.height = img.naturalHeight;
        workingCanvas.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(img.src);

        const state = { brightness: 100, contrast: 100, saturate: 100, preset: 'none' };

        const overlay = document.createElement('div');
        overlay.id = 'photoEditorOverlay';
        overlay.innerHTML = `
          <style>
            #photoEditorOverlay { position: fixed; inset: 0; z-index: 99999; background: rgba(15,23,32,.94);
              display: flex; flex-direction: column; font-family: 'Assistant', 'Segoe UI', Arial, sans-serif; color: #fff; }
            #photoEditorOverlay .pe-topbar { display: flex; justify-content: space-between; align-items: center;
              padding: 12px 18px; background: rgba(0,0,0,.25); }
            #photoEditorOverlay .pe-topbar h3 { margin: 0; font-size: 16px; }
            #photoEditorOverlay .pe-topbar div { display: flex; gap: 8px; }
            #photoEditorOverlay button { cursor: pointer; border: 0; border-radius: 8px; padding: 8px 14px;
              font-weight: 700; font-size: 14px; }
            #photoEditorOverlay .pe-btn-primary { background: #1c9c8a; color: #fff; }
            #photoEditorOverlay .pe-btn-ghost { background: rgba(255,255,255,.12); color: #fff; }
            #photoEditorOverlay .pe-body { flex: 1; display: flex; overflow: hidden; flex-wrap: wrap; }
            #photoEditorOverlay .pe-canvas-area { flex: 1; min-width: 260px; display: flex; align-items: center;
              justify-content: center; overflow: auto; padding: 16px; }
            #photoEditorOverlay .pe-canvas-wrap { position: relative; touch-action: none; }
            #photoEditorOverlay .pe-canvas-wrap canvas { display: block; max-width: 70vw; max-height: 62vh;
              width: auto; height: auto; box-shadow: 0 4px 24px rgba(0,0,0,.5); }
            #photoEditorOverlay .pe-crop-box { position: absolute; border: 2px dashed #fff;
              box-shadow: 0 0 0 2000px rgba(0,0,0,.35); box-sizing: border-box; cursor: move; }
            #photoEditorOverlay .pe-handle { position: absolute; width: 16px; height: 16px; background: #fff;
              border-radius: 50%; transform: translate(-50%, -50%); }
            #photoEditorOverlay .pe-handle.nw { top: 0; left: 0; cursor: nwse-resize; }
            #photoEditorOverlay .pe-handle.ne { top: 0; left: 100%; cursor: nesw-resize; }
            #photoEditorOverlay .pe-handle.sw { top: 100%; left: 0; cursor: nesw-resize; }
            #photoEditorOverlay .pe-handle.se { top: 100%; left: 100%; cursor: nwse-resize; }
            #photoEditorOverlay .pe-panel { width: 230px; padding: 16px; background: rgba(0,0,0,.2);
              overflow-y: auto; }
            #photoEditorOverlay .pe-panel h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase;
              letter-spacing: .04em; color: rgba(255,255,255,.65); }
            #photoEditorOverlay .pe-row { margin-bottom: 16px; }
            #photoEditorOverlay .pe-row label { display: flex; justify-content: space-between; font-size: 13px;
              margin-bottom: 4px; }
            #photoEditorOverlay .pe-row input[type=range] { width: 100%; }
            #photoEditorOverlay .pe-rotate-row, #photoEditorOverlay .pe-preset-row { display: flex; gap: 8px;
              flex-wrap: wrap; margin-bottom: 16px; }
            #photoEditorOverlay .pe-preset-row button, #photoEditorOverlay .pe-rotate-row button {
              flex: 1 1 40%; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
              font-size: 13px; padding: 8px 6px; }
            #photoEditorOverlay .pe-preset-row button.active { outline: 2px solid #1c9c8a; }
            @media (max-width: 700px) {
              #photoEditorOverlay .pe-topbar { padding: 10px 12px; flex-wrap: wrap; gap: 8px; }
              #photoEditorOverlay .pe-topbar h3 { font-size: 14px; }
              #photoEditorOverlay .pe-body { flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; }
              #photoEditorOverlay .pe-canvas-area { flex: 0 0 auto; padding: 10px; overflow: visible; }
              #photoEditorOverlay .pe-canvas-wrap canvas { max-width: 90vw; max-height: 42vh; }
              #photoEditorOverlay .pe-panel { width: 100%; overflow-y: visible; padding: 14px; }
              #photoEditorOverlay .pe-handle { width: 26px; height: 26px; }
              #photoEditorOverlay button { padding: 11px 14px; font-size: 15px; }
              #photoEditorOverlay .pe-preset-row button, #photoEditorOverlay .pe-rotate-row button { padding: 11px 6px; }
            }
          </style>
          <div class="pe-topbar">
            <h3>Edit Picture</h3>
            <div>
              <button type="button" class="pe-btn-ghost" id="peReset">Reset</button>
              <button type="button" class="pe-btn-ghost" id="peCancel">Cancel</button>
              <button type="button" class="pe-btn-primary" id="peSave">Save</button>
            </div>
          </div>
          <div class="pe-body">
            <div class="pe-canvas-area">
              <div class="pe-canvas-wrap" id="peCanvasWrap">
                <canvas id="peCanvas"></canvas>
                <div class="pe-crop-box" id="peCropBox" hidden>
                  <div class="pe-handle nw" data-h="nw"></div>
                  <div class="pe-handle ne" data-h="ne"></div>
                  <div class="pe-handle sw" data-h="sw"></div>
                  <div class="pe-handle se" data-h="se"></div>
                </div>
              </div>
            </div>
            <div class="pe-panel">
              <h4>Rotate</h4>
              <div class="pe-rotate-row">
                <button type="button" class="pe-btn-ghost" id="peRotateLeft">&#8634; Left</button>
                <button type="button" class="pe-btn-ghost" id="peRotateRight">&#8635; Right</button>
              </div>
              <h4>Crop</h4>
              <div class="pe-rotate-row">
                <button type="button" class="pe-btn-ghost" id="peCropStart">Start Crop</button>
                <button type="button" class="pe-btn-primary" id="peCropApply" hidden>Apply Crop</button>
              </div>
              <h4>Filter</h4>
              <div class="pe-preset-row">
                <button type="button" class="pe-btn-ghost active" data-preset="none">None</button>
                <button type="button" class="pe-btn-ghost" data-preset="bw">B&amp;W</button>
                <button type="button" class="pe-btn-ghost" data-preset="sepia">Sepia</button>
                <button type="button" class="pe-btn-ghost" data-preset="vintage">Vintage</button>
              </div>
              <h4>Adjust</h4>
              <div class="pe-row">
                <label><span>Brightness</span><span id="peBrightnessVal">100%</span></label>
                <input type="range" id="peBrightness" min="40" max="160" value="100">
              </div>
              <div class="pe-row">
                <label><span>Contrast</span><span id="peContrastVal">100%</span></label>
                <input type="range" id="peContrast" min="40" max="160" value="100">
              </div>
              <div class="pe-row">
                <label><span>Saturation</span><span id="peSaturateVal">100%</span></label>
                <input type="range" id="peSaturate" min="0" max="200" value="100">
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        const canvas = overlay.querySelector('#peCanvas');
        const ctx = canvas.getContext('2d');
        const cropBox = overlay.querySelector('#peCropBox');
        const canvasWrap = overlay.querySelector('#peCanvasWrap');

        function redraw() {
          canvas.width = workingCanvas.width;
          canvas.height = workingCanvas.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(workingCanvas, 0, 0);
          canvas.style.filter = buildFilterString(state);
        }
        redraw();

        function applyRotation(deg) {
          const w = workingCanvas.width, h = workingCanvas.height;
          const rotated = document.createElement('canvas');
          rotated.width = h; rotated.height = w;
          const rctx = rotated.getContext('2d');
          rctx.translate(rotated.width / 2, rotated.height / 2);
          rctx.rotate(deg * Math.PI / 180);
          rctx.drawImage(workingCanvas, -w / 2, -h / 2);
          workingCanvas.width = rotated.width;
          workingCanvas.height = rotated.height;
          workingCanvas.getContext('2d').drawImage(rotated, 0, 0);
          redraw();
        }
        overlay.querySelector('#peRotateLeft').addEventListener('click', () => applyRotation(-90));
        overlay.querySelector('#peRotateRight').addEventListener('click', () => applyRotation(90));

        function updateFilterLabels() {
          overlay.querySelector('#peBrightnessVal').textContent = state.brightness + '%';
          overlay.querySelector('#peContrastVal').textContent = state.contrast + '%';
          overlay.querySelector('#peSaturateVal').textContent = state.saturate + '%';
        }
        overlay.querySelector('#peBrightness').addEventListener('input', (e) => {
          state.brightness = e.target.value; updateFilterLabels(); redraw();
        });
        overlay.querySelector('#peContrast').addEventListener('input', (e) => {
          state.contrast = e.target.value; updateFilterLabels(); redraw();
        });
        overlay.querySelector('#peSaturate').addEventListener('input', (e) => {
          state.saturate = e.target.value; updateFilterLabels(); redraw();
        });
        overlay.querySelectorAll('.pe-preset-row button').forEach((btn) => {
          btn.addEventListener('click', () => {
            state.preset = btn.getAttribute('data-preset');
            overlay.querySelectorAll('.pe-preset-row button').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            redraw();
          });
        });

        let cropRect = null;
        let dragMode = null;
        let dragStart = null;

        function renderCropBox() {
          cropBox.style.left = cropRect.x + 'px';
          cropBox.style.top = cropRect.y + 'px';
          cropBox.style.width = cropRect.w + 'px';
          cropBox.style.height = cropRect.h + 'px';
        }
        function showCropBoxAtFull() {
          const rect = canvas.getBoundingClientRect();
          const wrapRect = canvasWrap.getBoundingClientRect();
          cropRect = { x: rect.left - wrapRect.left, y: rect.top - wrapRect.top, w: rect.width, h: rect.height };
          renderCropBox();
        }
        overlay.querySelector('#peCropStart').addEventListener('click', () => {
          cropBox.hidden = false;
          overlay.querySelector('#peCropStart').hidden = true;
          overlay.querySelector('#peCropApply').hidden = false;
          showCropBoxAtFull();
        });

        cropBox.addEventListener('pointerdown', (e) => {
          const handle = e.target.getAttribute && e.target.getAttribute('data-h');
          dragMode = handle || 'move';
          dragStart = { x: e.clientX, y: e.clientY, rect: Object.assign({}, cropRect) };
          e.preventDefault();
        });
        document.addEventListener('pointermove', (e) => {
          if (!dragMode || !dragStart) return;
          const dx = e.clientX - dragStart.x;
          const dy = e.clientY - dragStart.y;
          const canvasRect = canvas.getBoundingClientRect();
          const wrapRect = canvasWrap.getBoundingClientRect();
          const originX = canvasRect.left - wrapRect.left;
          const originY = canvasRect.top - wrapRect.top;
          const maxW = canvasRect.width, maxH = canvasRect.height;
          let { x, y, w, h } = dragStart.rect;
          if (dragMode === 'move') {
            x = clamp(dragStart.rect.x + dx, originX, originX + maxW - w);
            y = clamp(dragStart.rect.y + dy, originY, originY + maxH - h);
          } else {
            if (dragMode.indexOf('e') !== -1) w = clamp(dragStart.rect.w + dx, 40, originX + maxW - dragStart.rect.x);
            if (dragMode.indexOf('s') !== -1) h = clamp(dragStart.rect.h + dy, 40, originY + maxH - dragStart.rect.y);
            if (dragMode.indexOf('w') !== -1) {
              const newX = clamp(dragStart.rect.x + dx, originX, dragStart.rect.x + dragStart.rect.w - 40);
              w = dragStart.rect.w + (dragStart.rect.x - newX);
              x = newX;
            }
            if (dragMode.indexOf('n') !== -1) {
              const newY = clamp(dragStart.rect.y + dy, originY, dragStart.rect.y + dragStart.rect.h - 40);
              h = dragStart.rect.h + (dragStart.rect.y - newY);
              y = newY;
            }
          }
          cropRect = { x, y, w, h };
          renderCropBox();
        });
        document.addEventListener('pointerup', () => { dragMode = null; dragStart = null; });

        overlay.querySelector('#peCropApply').addEventListener('click', () => {
          const canvasRect = canvas.getBoundingClientRect();
          const wrapRect = canvasWrap.getBoundingClientRect();
          const originX = canvasRect.left - wrapRect.left;
          const originY = canvasRect.top - wrapRect.top;
          const scaleX = workingCanvas.width / canvasRect.width;
          const scaleY = workingCanvas.height / canvasRect.height;
          const sx = (cropRect.x - originX) * scaleX, sy = (cropRect.y - originY) * scaleY;
          const sw = cropRect.w * scaleX, sh = cropRect.h * scaleY;
          const cropped = document.createElement('canvas');
          cropped.width = Math.max(1, Math.round(sw));
          cropped.height = Math.max(1, Math.round(sh));
          cropped.getContext('2d').drawImage(workingCanvas, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height);
          workingCanvas.width = cropped.width;
          workingCanvas.height = cropped.height;
          workingCanvas.getContext('2d').drawImage(cropped, 0, 0);
          cropBox.hidden = true;
          overlay.querySelector('#peCropStart').hidden = false;
          overlay.querySelector('#peCropApply').hidden = true;
          redraw();
        });

        const originalCanvas = document.createElement('canvas');
        originalCanvas.width = workingCanvas.width;
        originalCanvas.height = workingCanvas.height;
        originalCanvas.getContext('2d').drawImage(workingCanvas, 0, 0);

        overlay.querySelector('#peReset').addEventListener('click', () => {
          workingCanvas.width = originalCanvas.width;
          workingCanvas.height = originalCanvas.height;
          workingCanvas.getContext('2d').drawImage(originalCanvas, 0, 0);
          state.brightness = 100; state.contrast = 100; state.saturate = 100; state.preset = 'none';
          overlay.querySelector('#peBrightness').value = 100;
          overlay.querySelector('#peContrast').value = 100;
          overlay.querySelector('#peSaturate').value = 100;
          updateFilterLabels();
          overlay.querySelectorAll('.pe-preset-row button').forEach((b) => b.classList.remove('active'));
          overlay.querySelector('[data-preset="none"]').classList.add('active');
          cropBox.hidden = true;
          overlay.querySelector('#peCropStart').hidden = false;
          overlay.querySelector('#peCropApply').hidden = true;
          redraw();
        });

        function cleanup() { overlay.remove(); }

        overlay.querySelector('#peCancel').addEventListener('click', () => { cleanup(); resolve(null); });

        overlay.querySelector('#peSave').addEventListener('click', () => {
          const out = document.createElement('canvas');
          out.width = workingCanvas.width;
          out.height = workingCanvas.height;
          const octx = out.getContext('2d');
          octx.filter = buildFilterString(state);
          octx.drawImage(workingCanvas, 0, 0);
          out.toBlob((blob) => {
            cleanup();
            resolve(blob);
          }, 'image/jpeg', 0.92);
        });
      }).catch(() => {
        alert('Could not open that picture for editing.');
        resolve(null);
      });
    });
  };
})();
