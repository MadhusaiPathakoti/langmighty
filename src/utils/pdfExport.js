import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAGE_MARGIN = 24; // pt, on every edge
const BLANK_THRESHOLD = 248; // 0-255; a pixel counts as "blank" at or above this brightness
const BLANK_SAMPLES = 24; // x-positions sampled per row when checking for blankness
const SPLIT_SEARCH_PX = 160; // how far (in source canvas px) to search for a blank row near the ideal page break

// Reads a horizontal band of the canvas once and returns a function that
// checks whether a given row within that band is blank (background-colored),
// so callers can probe many candidate rows without re-fetching pixel data.
function blankRowChecker(ctx, fromY, toY, width) {
  const height = toY - fromY + 1;
  const { data } = ctx.getImageData(0, fromY, width, height);
  const step = Math.max(1, Math.floor(width / BLANK_SAMPLES));

  return function isBlank(y) {
    const rowOffset = (y - fromY) * width * 4;
    for (let x = 0; x < width; x += step) {
      const i = rowOffset + x * 4;
      if (data[i] < BLANK_THRESHOLD || data[i + 1] < BLANK_THRESHOLD || data[i + 2] < BLANK_THRESHOLD) {
        return false;
      }
    }
    return true;
  };
}

// Looks for a blank row near `idealY` (checking just before it first, since
// that keeps more content on the earlier page), falling back to `idealY`
// itself if nothing suitably blank is nearby.
function findSafeSplit(ctx, idealY, maxY, width) {
  const from = Math.max(0, idealY - SPLIT_SEARCH_PX);
  const to = Math.min(maxY, idealY + SPLIT_SEARCH_PX);
  if (to <= from) return idealY;

  const isBlank = blankRowChecker(ctx, from, to, width);
  for (let y = idealY; y >= from; y--) {
    if (isBlank(y)) return y;
  }
  for (let y = idealY; y <= to; y++) {
    if (isBlank(y)) return y;
  }
  return idealY;
}

function extractSlice(source, sourceY, sliceHeight) {
  const slice = document.createElement("canvas");
  slice.width = source.width;
  slice.height = sliceHeight;
  slice.getContext("2d").drawImage(source, 0, sourceY, source.width, sliceHeight, 0, 0, source.width, sliceHeight);
  return slice.toDataURL("image/png");
}

// Renders `node` to a single tall canvas, then paginates it. Each page break
// is nudged to land on a blank (background-colored) row near the ideal cut
// point instead of a fixed pixel offset, so a table row or line of text is
// never sliced in half between pages.
export async function exportNodeToPdf(node, filename) {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const ctx = canvas.getContext("2d");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const usableHeight = pageHeight - PAGE_MARGIN * 2;

  const pxPerPt = canvas.width / contentWidth;
  const usableHeightPx = usableHeight * pxPerPt;

  let sourceY = 0;
  let isFirstPage = true;

  while (sourceY < canvas.height) {
    const idealEnd = sourceY + usableHeightPx;
    const sliceEnd =
      idealEnd >= canvas.height
        ? canvas.height
        : Math.max(sourceY + 1, findSafeSplit(ctx, Math.floor(idealEnd), canvas.height - 1, canvas.width));

    const sliceHeightPx = sliceEnd - sourceY;
    const imgData = extractSlice(canvas, sourceY, sliceHeightPx);
    const imgHeightPt = sliceHeightPx / pxPerPt;

    if (!isFirstPage) pdf.addPage();
    pdf.addImage(imgData, "PNG", PAGE_MARGIN, PAGE_MARGIN, contentWidth, imgHeightPt);

    sourceY = sliceEnd;
    isFirstPage = false;
  }

  pdf.save(filename);
}
