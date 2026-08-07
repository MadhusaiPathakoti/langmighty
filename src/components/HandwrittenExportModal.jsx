import { useRef, useState } from "react";
import HandwrittenCard from "./HandwrittenCard.jsx";
import {
  CSS_PAPER_BACKGROUNDS,
  PHOTO_BACKGROUNDS,
  DEFAULT_HANDWRITTEN_BACKGROUND_ID,
  getHandwrittenBackground,
} from "./handwrittenBackgrounds.js";
import {
  LATIN_HANDWRITING_FONTS,
  NATIVE_FONT_SETS,
  DEFAULT_LATIN_FONT_ID,
  DEFAULT_NATIVE_FONT_SET_ID,
} from "./handwrittenFonts.js";
import { ASPECT_RATIOS, DEFAULT_ASPECT_RATIO_ID, getAspectRatio, PREVIEW_WIDTH, previewHeightFor } from "./aspectRatios.js";
import { exportNodeToImage } from "../utils/imageExport.js";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;
const MIN_ROTATION = -15;
const MAX_ROTATION = 15;
const ROTATION_STEP = 1;
const PREVIEW_SCALE = 0.85;

export default function HandwrittenExportModal({ turn, onClose }) {
  const [backgroundId, setBackgroundId] = useState(DEFAULT_HANDWRITTEN_BACKGROUND_ID);
  const [customImage, setCustomImage] = useState(null);
  const [latinFontId, setLatinFontId] = useState(DEFAULT_LATIN_FONT_ID);
  const [nativeFontSetId, setNativeFontSetId] = useState(DEFAULT_NATIVE_FONT_SET_ID);
  const [aspectRatioId, setAspectRatioId] = useState(DEFAULT_ASPECT_RATIO_ID);
  const [fontScale, setFontScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);

  const background = getHandwrittenBackground(backgroundId);
  const aspectRatio = getAspectRatio(aspectRatioId);

  function adjustZoom(delta) {
    setFontScale((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)));
  }

  function adjustRotation(delta) {
    setRotation((r) => Math.min(MAX_ROTATION, Math.max(MIN_ROTATION, Math.round(r + delta))));
  }

  function handlePointerDown(e) {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y };
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / PREVIEW_SCALE;
    const dy = (e.clientY - dragRef.current.startY) / PREVIEW_SCALE;
    setPan({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  }

  function handlePointerUp(e) {
    dragRef.current = null;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDownload() {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    // The on-screen preview wraps the card in `transform: scale(...)` purely for
    // display; html2canvas miscalculates inline-block margins when an ancestor
    // has a CSS transform, so it must be removed for the duration of the capture.
    const scaledWrapper = cardRef.current.parentElement;
    const previousTransform = scaledWrapper?.style.transform;
    if (scaledWrapper) scaledWrapper.style.transform = "none";
    try {
      const scale = aspectRatio.width / PREVIEW_WIDTH;
      const height = previewHeightFor(aspectRatio);
      await exportNodeToImage(cardRef.current, `langmighty-note-${Date.now()}.png`, {
        scale,
        width: PREVIEW_WIDTH,
        height,
      });
    } finally {
      if (scaledWrapper) scaledWrapper.style.transform = previousTransform;
      setIsExporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Share as handwritten note</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 p-5">
          <div className="flex-1 overflow-auto rounded-lg bg-gray-100 dark:bg-gray-950 p-4 flex items-center justify-center">
            <div
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top center",
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <HandwrittenCard
                ref={cardRef}
                turn={turn}
                background={background}
                customImage={customImage}
                latinFontId={latinFontId}
                nativeFontSetId={nativeFontSetId}
                fontScale={fontScale}
                panX={pan.x}
                panY={pan.y}
                rotation={rotation}
                aspectRatio={aspectRatio}
              />
            </div>
          </div>

          <div className="md:w-56 flex-shrink-0 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Image size</p>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatioId(ratio.id)}
                    title={ratio.sublabel}
                    className={`flex flex-col items-center justify-center gap-1 rounded-md border-2 py-2 transition-colors ${
                      aspectRatioId === ratio.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <span
                      className="border border-current text-gray-500 dark:text-gray-400"
                      style={{
                        width: `${16 * (ratio.width / Math.max(ratio.width, ratio.height))}px`,
                        height: `${16 * (ratio.height / Math.max(ratio.width, ratio.height))}px`,
                      }}
                    />
                    <span className="text-[11px] text-gray-600 dark:text-gray-300">{ratio.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">{aspectRatio.sublabel}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Text position</p>
                <button
                  type="button"
                  onClick={() => setPan({ x: 0, y: 0 })}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Reset
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Drag the note in the preview to pan the text.</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Text size</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustZoom(-ZOOM_STEP)}
                  disabled={fontScale <= MIN_ZOOM}
                  className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-indigo-400 hover:text-indigo-600"
                >
                  −
                </button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={fontScale}
                  onChange={(e) => setFontScale(Number(e.target.value))}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => adjustZoom(ZOOM_STEP)}
                  disabled={fontScale >= MAX_ZOOM}
                  className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-indigo-400 hover:text-indigo-600"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 text-right">
                {Math.round(fontScale * 100)}%
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Rotation</p>
                <button
                  type="button"
                  onClick={() => setRotation(0)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustRotation(-ROTATION_STEP)}
                  disabled={rotation <= MIN_ROTATION}
                  className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-indigo-400 hover:text-indigo-600"
                >
                  −
                </button>
                <input
                  type="range"
                  min={MIN_ROTATION}
                  max={MAX_ROTATION}
                  step={ROTATION_STEP}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => adjustRotation(ROTATION_STEP)}
                  disabled={rotation >= MAX_ROTATION}
                  className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-indigo-400 hover:text-indigo-600"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 text-right">{rotation}°</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Handwriting font</p>
              <select
                value={latinFontId}
                onChange={(e) => setLatinFontId(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
              >
                {LATIN_HANDWRITING_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Native script style</p>
              <div className="flex gap-2">
                {NATIVE_FONT_SETS.map((set) => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => setNativeFontSetId(set.id)}
                    className={`flex-1 text-sm rounded-lg border px-2.5 py-1.5 transition-colors ${
                      nativeFontSetId === set.id
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950"
                        : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {set.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Background</p>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">Paper textures</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {CSS_PAPER_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    title={bg.label}
                    onClick={() => {
                      setBackgroundId(bg.id);
                      setCustomImage(null);
                    }}
                    className={`h-12 rounded-md border-2 transition-transform ${
                      backgroundId === bg.id && !customImage
                        ? "border-indigo-500 scale-105"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    style={{ backgroundImage: bg.swatch, backgroundSize: "cover" }}
                  />
                ))}
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">Photos</p>
              <div className="grid grid-cols-3 gap-2">
                {PHOTO_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    title={bg.label}
                    onClick={() => {
                      setBackgroundId(bg.id);
                      setCustomImage(null);
                    }}
                    className={`h-12 rounded-md border-2 transition-transform ${
                      backgroundId === bg.id && !customImage
                        ? "border-indigo-500 scale-105"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    style={{ backgroundImage: bg.swatch, backgroundSize: "cover", backgroundPosition: "center" }}
                  />
                ))}
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                {background.label}
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-sm rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Upload your own photo
              </button>
              {customImage && (
                <button
                  type="button"
                  onClick={() => setCustomImage(null)}
                  className="w-full text-xs text-gray-400 hover:text-red-500 mt-1.5"
                >
                  Remove uploaded background
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full rounded-lg bg-indigo-600 text-white font-medium px-3 py-2.5 text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isExporting ? "Rendering..." : "Download PNG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
