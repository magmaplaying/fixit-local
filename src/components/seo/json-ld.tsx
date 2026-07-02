/**
 * Emits a JSON-LD structured-data block. Content is server-generated (never user
 * free-text without escaping), and `<` is escaped so the script can't be broken
 * out of. Rendered server-side into the page for search engines.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
