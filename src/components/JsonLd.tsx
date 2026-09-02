import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

// Site-wide schema.org WebSite + publisher Organization (rendered from
// layout.tsx on every page). Declared as a WebSite rather than
// WebApplication so link previews don't label the site as an "app"; PWA
// installability comes from the manifest + service worker, not from here.
// Page-specific schemas (MedicalWebPage + FAQPage on the landing page, the
// education @graph) live next to their pages.
export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    alternateName: "Insulin Reset",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "bg",
    publisher: {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon-192.png"),
        width: 192,
        height: 192,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      // schema.org JSON-LD — static content from constants above.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
