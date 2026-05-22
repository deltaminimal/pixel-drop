// Pixel Drop — downloader.js
// Responsible for orchestrating the download of images from
// a list of tabs. Handles filename extraction, duplicate naming,
// and reporting results back to the popup.

/**
 * Extracts a filename from a URL if it looks clean and human-readable.
 * Falls back to a Pixel Drop timestamp name for anything that looks
 * like an ID, hash, or encoded string.
 *
 * @param {string} url
 * @returns {string} filename
 */
function extractFilename(url) {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    const raw = parts[parts.length - 1];

    if (raw && raw.includes(".")) {
      const decoded = decodeURIComponent(raw);
      const nameWithoutExt = decoded.split(".").slice(0, -1).join(".");

      // If the name is short, readable, and doesn't look like a hash or ID
      // (no long strings of random chars, no special symbols)
      const looksClean = /^[a-zA-Z0-9_\-\s]{1,60}$/.test(nameWithoutExt);

      if (looksClean) return decoded;
    }
  } catch {
    // Malformed URL — fall through
  }

  // Default: clean timestamped name
  return `pixel-drop-${Date.now()}.jpg`;
}
/**
 * Downloads a single image from a given URL.
 * Duplicate filenames are handled automatically by the browser —
 * Chrome and Edge will append (1), (2) etc. when conflictAction
 * is set to 'uniquify'.
 *
 * @param {string} url - The image URL to download
 * @param {string} [subfolder] - Optional subfolder (Phase 2)
 * @param {string} [filename] - Optional override filename (Phase 2)
 * @returns {Promise<{success: boolean, url: string, error?: string}>}
 */
async function downloadImage(url, subfolder = null, filename = null) {
  try {
    const name = filename || extractFilename(url);

    // If a subfolder is provided (Phase 2), prepend it to the filename
    // e.g. subfolder="Moodboard" → "Moodboard/sunset.jpg"
    const filepath = subfolder ? `${subfolder}/${name}` : name;

    await chrome.downloads.download({
      url: url,
      filename: filepath,
      // 'uniquify' tells the browser to auto-increment duplicate filenames
      // so existing files are never overwritten
      conflictAction: "uniquify",
      saveAs: false,
    });

    return { success: true, url };
  } catch (error) {
    // Capture the error but don't let one failed download
    // stop the rest of the batch
    return { success: false, url, error: error.message };
  }
}

/**
 * Downloads all images from a list of image tabs.
 * Runs concurrently and returns a summary of results.
 *
 * @param {chrome.tabs.Tab[]} imageTabs - Tabs identified as images
 * @param {object} [options] - Download options (expanded in Phase 2)
 * @param {string} [options.subfolder] - Optional subfolder name
 * @returns {Promise<{
 *   total: number,
 *   succeeded: number,
 *   failed: number,
 *   errors: string[]
 * }>}
 */
export async function downloadAllImages(imageTabs, options = {}) {
  const { subfolder = null } = options;

  // Kick off all downloads concurrently
  const results = await Promise.all(
    imageTabs.map((tab) => downloadImage(tab.url, subfolder)),
  );

  // Summarise the results to report back to the popup
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const errors = results
    .filter((r) => !r.success)
    .map((r) => `${r.url}: ${r.error}`);

  return { total: results.length, succeeded, failed, errors };
}
