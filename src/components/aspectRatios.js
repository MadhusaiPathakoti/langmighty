// Export sizes for social media. All share the same target width (1080px) so a
// single export scale works for every ratio; height follows from the ratio.
export const ASPECT_RATIOS = [
  { id: "portrait", label: "Portrait", sublabel: "4:5 · 1080×1350", width: 1080, height: 1350 },
  { id: "square", label: "Square", sublabel: "1:1 · 1080×1080", width: 1080, height: 1080 },
  { id: "landscape", label: "Landscape", sublabel: "1080×566", width: 1080, height: 566 },
];

export const DEFAULT_ASPECT_RATIO_ID = "square";

export function getAspectRatio(id) {
  return ASPECT_RATIOS.find((r) => r.id === id) || ASPECT_RATIOS.find((r) => r.id === DEFAULT_ASPECT_RATIO_ID);
}

// Fixed CSS-pixel width used for on-screen editing; the export scale (target
// width / this) is what brings the final PNG up to the real target size.
export const PREVIEW_WIDTH = 640;

export function previewHeightFor(aspectRatio) {
  return Math.round(PREVIEW_WIDTH * (aspectRatio.height / aspectRatio.width));
}
