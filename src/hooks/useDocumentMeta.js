import { useEffect } from "react";

const SITE_URL = "https://langmighty.in";

function setMetaTag(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// This app has no SSR, so index.html's static meta tags are the only ones
// search engines reliably see without executing JS. This hook overrides them
// client-side per route for real browsers/social scrapers that do run JS,
// and restores the site-wide defaults on unmount so navigating away (or to a
// route that doesn't call this hook) doesn't leave a stale title/description.
export default function useDocumentMeta({ title, description, path }) {
  useEffect(() => {
    const previousTitle = document.title;
    const url = `${SITE_URL}${path}`;

    document.title = title;
    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute("href");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    return () => {
      document.title = previousTitle;
      if (previousCanonical) canonical.setAttribute("href", previousCanonical);
    };
  }, [title, description, path]);
}
