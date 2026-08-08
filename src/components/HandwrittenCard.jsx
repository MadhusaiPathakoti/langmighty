import { forwardRef } from "react";
import { LANGUAGES, getInputLanguage } from "../languages.js";
import { getLatinFont, getNativeFont, DEFAULT_LATIN_FONT_ID, DEFAULT_NATIVE_FONT_SET_ID } from "./handwrittenFonts.js";
import { PREVIEW_WIDTH, previewHeightFor } from "./aspectRatios.js";

const HandwrittenCard = forwardRef(function HandwrittenCard(
  {
    turn,
    background,
    customImage,
    latinFontId = DEFAULT_LATIN_FONT_ID,
    nativeFontSetId = DEFAULT_NATIVE_FONT_SET_ID,
    fontScale = 1,
    panX = 0,
    panY = 0,
    rotation = 0,
    aspectRatio,
    watermarkPanX = 0,
    watermarkPanY = 0,
    onWatermarkPointerDown,
    onWatermarkPointerMove,
    onWatermarkPointerUp,
    isDraggingWatermark = false,
  },
  ref
) {
  const sourceLabel = getInputLanguage(turn.sourceLanguage).label;
  const ink = background.ink;
  const paddingLeft = customImage ? 40 : background.marginLeft ? background.marginLeft + 20 : 40;
  const latinFont = getLatinFont(latinFontId);
  const cardHeight = aspectRatio ? previewHeightFor(aspectRatio) : 480;

  const paperStyle = customImage
    ? {
        backgroundColor: "#00000000",
        backgroundImage: `url(${customImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : background.style;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: `${PREVIEW_WIDTH}px`,
        height: `${cardHeight}px`,
        paddingTop: "48px",
        paddingBottom: "56px",
        paddingRight: "40px",
        paddingLeft: `${paddingLeft}px`,
        borderRadius: "6px",
        overflow: "hidden",
        boxSizing: "border-box",
        ...paperStyle,
      }}
    >
      {background.spiral && !customImage && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "22px",
            width: "18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.35)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
              }}
            />
          ))}
        </div>
      )}

      <div style={{ position: "relative", transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg)` }}>
        <p
          style={{
            fontFamily: latinFont,
            fontWeight: 600,
            fontSize: `${30 * fontScale}px`,
            lineHeight: 1.3,
            color: ink.primary,
            margin: `0 0 ${28 * fontScale}px`,
          }}
        >
          {turn.sourceText ?? turn.englishText}
          <span style={{ fontSize: `${16 * fontScale}px`, fontWeight: 500, opacity: 0.7 }}> — {sourceLabel}</span>
        </p>

        {LANGUAGES.map(({ key, label }, i) => {
          const row = turn.results?.[key];
          if (!row) return null;
          return (
            <div key={key} style={{ marginBottom: `${28 * fontScale}px` }}>
              <p
                style={{
                  fontFamily: getNativeFont(nativeFontSetId, key),
                  fontSize: `${32 * fontScale}px`,
                  lineHeight: 1.6,
                  color: ink.primary,
                  margin: `0 0 ${10 * fontScale}px`,
                }}
              >
                {row.translation}
              </p>
              <p
                style={{
                  fontFamily: latinFont,
                  fontSize: `${19 * fontScale}px`,
                  lineHeight: 1.4,
                  color: ink.secondary,
                  margin: 0,
                }}
              >
                <span style={{ display: "inline-block", marginRight: `${8 * fontScale}px` }}>({label}:</span>
                <span style={{ display: "inline-block" }}>{row.pronunciation}.)</span>
              </p>
            </div>
          );
        })}
      </div>

      <p
        aria-hidden="true"
        onPointerDown={onWatermarkPointerDown}
        onPointerMove={onWatermarkPointerMove}
        onPointerUp={onWatermarkPointerUp}
        onPointerCancel={onWatermarkPointerUp}
        style={{
          position: "absolute",
          bottom: "16px",
          right: "28px",
          fontFamily: latinFont,
          fontSize: "15px",
          color: ink.accent,
          opacity: 0.8,
          margin: 0,
          transform: `translate(${watermarkPanX}px, ${watermarkPanY}px)`,
          cursor: onWatermarkPointerDown ? (isDraggingWatermark ? "grabbing" : "grab") : undefined,
          touchAction: onWatermarkPointerDown ? "none" : undefined,
        }}
      >
        ✦ LangMighty
      </p>
    </div>
  );
});

export default HandwrittenCard;
