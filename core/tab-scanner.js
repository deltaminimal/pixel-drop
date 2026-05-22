// Pixel Drop — tab-scanner.js
// Responsible for scanning all open tabs in the current window
// and identifying which ones contain direct image files.

import { isImageByContentType } from "./content-type-checker.js";

// Image file extensions we consider valid for direct download
const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "avif",
  "ico",
  "tiff",
];

/**
 * Checks if a URL ends with a known image file extension.
 * This is the fast/cheap check — no network request needed.
 * @param {string} url
 * @returns {boolean}
 */
function isImageByExtension(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const ext = pathname.split(".").pop();
    return IMAGE_EXTENSIONS.includes(ext);
  } catch {
    // If the URL is malformed, skip it
    return false;
  }
}

/**
 * Scans all tabs in the current window and returns those
 * that are displaying a direct image file.
 *
 * Detection strategy:
 *   1. Fast path — check URL extension (no network cost)
 *   2. Slow path — fetch Content-Type header for tabs that
 *      don't have an obvious image extension in the URL
 *
 * @returns {Promise<chrome.tabs.Tab[]>} Array of image tabs
 */
export async function scanForImageTabs() {
  // Query all tabs in the current window
  const allTabs = await chrome.tabs.query({ currentWindow: true });

  // Filter out tabs with no URL or browser internal pages (chrome://, edge://, etc.)
  const candidateTabs = allTabs.filter(
    (tab) =>
      tab.url &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("edge://") &&
      !tab.url.startsWith("about:") &&
      !tab.url.startsWith("chrome-extension://"),
  );

  // Run both checks concurrently across all candidate tabs
  const results = await Promise.all(
    candidateTabs.map(async (tab) => {
      // Fast path first — if extension matches, no need to fetch
      if (isImageByExtension(tab.url)) {
        return tab;
      }

      // Slow path — check Content-Type header via network request
      const isImage = await isImageByContentType(tab.url);
      return isImage ? tab : null;
    }),
  );

  // Filter out nulls (non-image tabs)
  return results.filter(Boolean);
}
