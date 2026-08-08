import html2canvas from "html2canvas";

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function renderNodeToBlob(node, { backgroundColor = null, scale = 2, width, height } = {}) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  const canvas = await html2canvas(node, {
    scale,
    backgroundColor,
    useCORS: true,
    letterRendering: true,
    ...(width ? { width, windowWidth: width } : {}),
    ...(height ? { height, windowHeight: height } : {}),
  });
  return canvasToBlob(canvas);
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Always saves the image as a local file download, regardless of platform.
export async function downloadNodeAsImage(node, filename, options = {}) {
  const blob = await renderNodeToBlob(node, options);
  triggerBrowserDownload(blob, filename);
}

// Opens the native share sheet when available (useful on mobile, e.g. saving
// straight to Photos or sharing to another app), falling back to a plain
// download if sharing isn't supported or the user's browser rejects the file.
export async function shareNodeAsImage(node, filename, options = {}) {
  const blob = await renderNodeToBlob(node, options);
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
      // Any other failure: fall through to the download link below.
    }
  }
  triggerBrowserDownload(blob, filename);
}
