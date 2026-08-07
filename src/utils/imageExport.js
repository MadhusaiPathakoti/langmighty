import html2canvas from "html2canvas";

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
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
