// Pixel Drop — content-type-checker.js
// Responsible for determining if a URL serves an image
// by inspecting its Content-Type response header.
// This is used as a fallback when the URL has no file extension.

// All MIME types we consider valid images
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/avif",
  "image/ico",
  "image/x-icon",
  "image/tiff",
];

/**
 * Sends a HEAD request to the given URL and checks if the
 * Content-Type header indicates an image.
 *
 * We use HEAD instead of GET deliberately — it asks the server
 * for headers only, without downloading the actual file body.
 * This keeps the check lightweight and fast.
 *
 * @param {string} url - The tab URL to check
 * @returns {Promise<boolean>} True if the URL serves an image
 */
export async function isImageByContentType(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      // 'no-cors' would hide the headers from us, so we use cors.
      // If the server doesn't allow CORS, the request will fail
      // and we catch it below — the tab is simply skipped.
      mode: "cors",
    });

    const contentType = response.headers.get("Content-Type") || "";

    // Content-Type can include extra info e.g. "image/jpeg; charset=utf-8"
    // so we check with startsWith against each known MIME type
    return IMAGE_MIME_TYPES.some((mime) => contentType.startsWith(mime));
  } catch {
    // Network error, CORS block, or unreachable URL — not our image to grab
    return false;
  }
}
