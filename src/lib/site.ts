// Canonical public site identity — used for metadata, canonical links, the
// sitemap, robots and JSON-LD. Override the URL per environment with
// NEXT_PUBLIC_SITE_URL (set it to the production domain once it's attached).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://podruka.bg").replace(/\/+$/, "");
export const SITE_NAME = "Под ръка";
export const SITE_DESCRIPTION =
  "Намерете и заявете проверени майстори — почистване, ремонти, уроци, преместване и още — във вашия град, в цяла България.";
