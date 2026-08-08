import html2canvas from "html2canvas";

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function exportNodeToImage(node, filename, { backgroundColor = null, scale = 2, width, height } = {}) {
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

  const blob = await canvasToBlob(canvas);

  // Mobile browsers (especially iOS Safari) don't reliably honor <a download>,
  // so prefer the native share sheet — it lets the user save to Photos or share
  // directly — and only fall back to a classic download link when it's unavailable.
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

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
