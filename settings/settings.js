// Pixel Drop — settings.js
// Handles all settings page interactions:
// - Initialising the theme on load
// - Loading and displaying saved preferences
// - Saving preferences when the user makes changes

import { initTheme, saveTheme, applyTheme, THEMES } from "../ui/theme.js";

// ─── DOM References ───────────────────────────────────────────
const selectTheme = document.getElementById("select-theme");

// ─── Theme Setting ────────────────────────────────────────────

/**
 * Populates the theme selector with the currently saved theme,
 * so the dropdown reflects the user's existing preference
 * when they open settings.
 *
 * @param {string} currentTheme - The currently active theme
 */
function populateThemeSelector(currentTheme) {
  // Set the dropdown to the saved theme value
  selectTheme.value = currentTheme;
}

/**
 * Handles the theme dropdown change event.
 * Saves the new theme and applies it immediately
 * so the user sees the change in real time.
 */
async function handleThemeChange() {
  const selected = selectTheme.value;

  // Validate — make sure the value is one we recognise
  if (!Object.values(THEMES).includes(selected)) return;

  // Save to storage first
  await saveTheme(selected);

  // Apply immediately so the user sees the change live
  applyTheme(selected);
}

// ─── Event Listeners ──────────────────────────────────────────
selectTheme.addEventListener("change", handleThemeChange);

// ─── Initialise ───────────────────────────────────────────────

/**
 * Entry point — runs when the settings page is opened.
 * Loads and applies the saved theme, then populates
 * all controls with their saved values.
 */
async function init() {
  // initTheme returns the currently active theme name
  // so we can use it to populate the controls
  const currentTheme = await initTheme();

  // Populate all controls with saved values
  populateThemeSelector(currentTheme);
}

init();
