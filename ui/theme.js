// Pixel Drop — theme.js
// Responsible for detecting the user's OS on first install,
// applying the correct theme, and handling manual theme overrides
// from the settings panel.

// Available themes — these map directly to the CSS files in ui/themes/
export const THEMES = {
  WIN11: "win11",
  MACOS: "macos",
  DEFAULT: "default",
};

// The storage key used to persist the user's theme choice
const STORAGE_KEY = "pixeldrop_theme";

/**
 * Detects the current operating system using the modern
 * userAgentData API with a fallback to the legacy navigator.platform.
 *
 * @returns {'win11' | 'macos' | 'default'}
 */
function detectOSTheme() {
  // Modern API — available in Chrome 90+ and Edge 90+
  if (navigator.userAgentData) {
    const platform = navigator.userAgentData.platform.toLowerCase();
    if (platform.includes("windows")) return THEMES.WIN11;
    if (platform.includes("mac")) return THEMES.MACOS;
    return THEMES.DEFAULT;
  }

  // Legacy fallback — navigator.platform is deprecated but
  // still widely supported as a safety net
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("win")) return THEMES.WIN11;
  if (platform.includes("mac")) return THEMES.MACOS;
  return THEMES.DEFAULT;
}

/**
 * Loads the user's saved theme from storage.
 * If no theme has been saved yet (first install),
 * auto-detects the OS and saves that as the default.
 *
 * @returns {Promise<string>} The theme name to apply
 */
export async function loadTheme() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        // User has a saved preference — use it
        resolve(result[STORAGE_KEY]);
      } else {
        // First install — detect OS and save it
        const detected = detectOSTheme();
        saveTheme(detected);
        resolve(detected);
      }
    });
  });
}

/**
 * Saves the user's theme choice to chrome.storage.sync.
 * Using sync means the preference follows the user across
 * devices where they are signed into Chrome/Edge.
 *
 * @param {string} theme - One of the THEMES values
 * @returns {Promise<void>}
 */
export async function saveTheme(theme) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: theme }, resolve);
  });
}

/**
 * Applies a theme by injecting the correct CSS file into
 * the current page (popup or settings).
 *
 * Any previously applied Pixel Drop theme is removed first
 * to avoid stacking multiple theme stylesheets.
 *
 * @param {string} theme - One of the THEMES values
 */
export function applyTheme(theme) {
  // Remove any existing Pixel Drop theme link tag
  const existing = document.getElementById("pd-theme");
  if (existing) existing.remove();

  // Create a new link element pointing to the correct theme CSS
  const link = document.createElement("link");
  link.id = "pd-theme";
  link.rel = "stylesheet";
  link.href = `../ui/themes/${theme}.css`;

  document.head.appendChild(link);

  // Store the active theme name on the root element as a
  // data attribute — useful for theme-specific CSS overrides
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Convenience function — loads the saved theme and applies
 * it in one step. Called on startup by both popup.js and
 * settings.js.
 *
 * @returns {Promise<string>} The theme that was applied
 */
export async function initTheme() {
  const theme = await loadTheme();
  applyTheme(theme);
  return theme;
}
