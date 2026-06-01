"use client";

/**
 * LogoCropUpload
 *
 * Canvas-based logo upload with interactive crop — no external dependencies.
 * Crops to a fixed-aspect-ratio rectangle (default 3:1 for wide partner logos,
 * or 1:1 for square marks). Outputs a compressed WebP blob via a hidden input.
 *
 * Interaction model:
 *   1. User selects a file → rendered on canvas in crop preview
 *   2. User drags the crop handle to reposition / resize the visible area
 *   3. "Apply crop" writes the cropped blob to a hidden input for form submission
 *   4. A preview thumbnail shows the final result
 *
 * Usage:
 *   <LogoCropUpload name="logo_file" aspect={3} maxOutputWidthPx={600} />
 */

import { useCallback, useEffect, useRef, useState } from "react";

const CANVAS_W = 480;   // preview canvas width
const CANVAS_H = 160;   // preview canvas height (3:1 default)

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function LogoCropUpload({
  currentLogoUrl = "",
  maxOutputWidthPx = 600,
  name = "logo_file",
  aspectRatio = 3,       // width / height  (3 = wide, 1 = square)
}) {
  const canvasH = Math.round(CANVAS_W / aspectRatio);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenInputRef = useRef(null);

  const [imageEl, setImageEl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 }); // in image pixels
  const [dragging, setDragging] = useState(null); // { startX, startY, startCrop }
  const [preview, setPreview] = useState(currentLogoUrl || null);
  const [fileName, setFileName] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  // ── Draw onto canvas ────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl) return;
    const ctx = canvas.getContext("2d");
    const { naturalWidth: iw, naturalHeight: ih } = imageEl;

    // Scale image to fit canvas (contain)
    const scale = Math.min(CANVAS_W / iw, canvasH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const offsetX = (CANVAS_W - drawW) / 2;
    const offsetY = (canvasH - drawH) / 2;

    ctx.clearRect(0, 0, CANVAS_W, canvasH);
    ctx.drawImage(imageEl, offsetX, offsetY, drawW, drawH);

    // Overlay dim outside crop
    const cx = offsetX + crop.x * scale;
    const cy = offsetY + crop.y * scale;
    const cw = crop.w * scale;
    const ch = crop.h * scale;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, CANVAS_W, canvasH);
    ctx.clearRect(cx, cy, cw, ch);
    ctx.drawImage(imageEl, crop.x, crop.y, crop.w, crop.h, cx, cy, cw, ch);

    // Crop border
    ctx.strokeStyle = "#0057B7";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Corner handles
    const hs = 8;
    ctx.fillStyle = "#0057B7";
    [[cx, cy], [cx + cw - hs, cy], [cx, cy + ch - hs], [cx + cw - hs, cy + ch - hs]].forEach(([hx, hy]) => {
      ctx.fillRect(hx, hy, hs, hs);
    });
  }, [imageEl, crop, canvasH]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // ── Load file → image element ───────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum 5 MB.");
      return;
    }

    setError("");
    setApplied(false);
    setFileName(file.name);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      // Initial crop: centered, matching target aspect ratio
      let cw = iw;
      let ch = Math.round(cw / aspectRatio);
      if (ch > ih) {
        ch = ih;
        cw = Math.round(ch * aspectRatio);
      }
      const cx = Math.round((iw - cw) / 2);
      const cy = Math.round((ih - ch) / 2);
      setCrop({ x: cx, y: cy, w: cw, h: ch });
      setImageEl(img);
    };
    img.src = url;
  }

  // ── Canvas mouse interactions ───────────────────────────────────────────────
  function getImageCoords(e) {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl) return { ix: 0, iy: 0 };
    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvasH / rect.height);
    const { naturalWidth: iw, naturalHeight: ih } = imageEl;
    const scale = Math.min(CANVAS_W / iw, canvasH / ih);
    const offsetX = (CANVAS_W - iw * scale) / 2;
    const offsetY = (canvasH - ih * scale) / 2;
    return {
      ix: (canvasX - offsetX) / scale,
      iy: (canvasY - offsetY) / scale,
    };
  }

  function onMouseDown(e) {
    if (!imageEl) return;
    const { ix, iy } = getImageCoords(e);
    setDragging({ startX: ix, startY: iy, startCrop: { ...crop } });
  }

  function onMouseMove(e) {
    if (!dragging || !imageEl) return;
    const { ix, iy } = getImageCoords(e);
    const dx = ix - dragging.startX;
    const dy = iy - dragging.startY;
    const { naturalWidth: iw, naturalHeight: ih } = imageEl;
    const newX = clamp(dragging.startCrop.x + dx, 0, iw - dragging.startCrop.w);
    const newY = clamp(dragging.startCrop.y + dy, 0, ih - dragging.startCrop.h);
    setCrop((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
  }

  function onMouseUp() {
    setDragging(null);
  }

  // Resize with scroll wheel (zoom crop in/out)
  function onWheel(e) {
    if (!imageEl) return;
    e.preventDefault();
    const { naturalWidth: iw, naturalHeight: ih } = imageEl;
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setCrop((prev) => {
      let newW = clamp(Math.round(prev.w * delta), 40, iw);
      let newH = Math.round(newW / aspectRatio);
      if (newH > ih) { newH = ih; newW = Math.round(newH * aspectRatio); }
      const newX = clamp(Math.round(prev.x + (prev.w - newW) / 2), 0, iw - newW);
      const newY = clamp(Math.round(prev.y + (prev.h - newH) / 2), 0, ih - newH);
      return { x: newX, y: newY, w: newW, h: newH };
    });
  }

  // ── Apply crop → output blob → hidden input ─────────────────────────────────
  function applyCrop() {
    if (!imageEl) return;
    const out = document.createElement("canvas");
    const outputH = Math.round(maxOutputWidthPx / aspectRatio);
    out.width = maxOutputWidthPx;
    out.height = outputH;
    const ctx = out.getContext("2d");
    ctx.drawImage(imageEl, crop.x, crop.y, crop.w, crop.h, 0, 0, maxOutputWidthPx, outputH);
    out.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setPreview(previewUrl);
        setApplied(true);
        // Write blob to hidden file input via DataTransfer
        try {
          const dt = new DataTransfer();
          dt.items.add(new File([blob], "logo.webp", { type: "image/webp" }));
          if (hiddenInputRef.current) {
            hiddenInputRef.current.files = dt.files;
          }
        } catch {
          // DataTransfer not available in all envs — fallback handled server-side
        }
      },
      "image/webp",
      0.88,
    );
  }

  function reset() {
    setImageEl(null);
    setPreview(currentLogoUrl || null);
    setFileName("");
    setApplied(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="logo-crop-upload">
      {/* Current / applied preview */}
      {preview && !imageEl && (
        <div className="logo-crop-preview">
          <img alt="Partner logo" src={preview} />
          <button className="logo-crop-replace-btn" onClick={() => fileInputRef.current?.click()} type="button">
            Replace logo
          </button>
        </div>
      )}

      {/* File picker (hidden when image is loaded) */}
      {!imageEl && (
        <div className="logo-crop-picker">
          <button
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {preview ? "Replace logo" : "Choose logo file"}
          </button>
          <span className="logo-crop-hint">
            JPEG, PNG, WebP or SVG · max 5 MB · will be cropped to {aspectRatio}:1
          </span>
        </div>
      )}

      <input
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />

      {/* Hidden output input — receives the cropped blob */}
      <input name={name} ref={hiddenInputRef} style={{ display: "none" }} type="file" />

      {error && <p className="logo-crop-error">{error}</p>}

      {/* Crop editor */}
      {imageEl && (
        <div className="logo-crop-editor">
          <p className="logo-crop-instruction">
            Drag to reposition · scroll to resize · then apply
          </p>
          <canvas
            height={canvasH}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onWheel={onWheel}
            ref={canvasRef}
            style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
            width={CANVAS_W}
          />
          <div className="logo-crop-editor-actions">
            <button className="primary-button" onClick={applyCrop} type="button">
              {applied ? "✓ Applied" : "Apply crop"}
            </button>
            <button className="secondary-button" onClick={reset} type="button">
              Cancel
            </button>
          </div>
          {applied && preview && (
            <div className="logo-crop-applied-preview">
              <span className="logo-crop-applied-label">Output preview</span>
              <img alt="Cropped logo preview" src={preview} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
