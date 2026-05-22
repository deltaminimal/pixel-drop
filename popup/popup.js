// Pixel Drop — popup.js
// Handles all popup UI interactions:
// - Initialising the theme on load
// - Wiring up the Quick Save button
// - Communicating with the service worker
// - Updating the UI state based on results

import { initTheme } from "../ui/theme.js";

// ─── DOM References ───────────────────────────────────────────
const btnQuickSave = document.getElementById("btn-quick-save");
const btnSettings = document.getElementById("btn-settings");

const stateIdle = document.getElementById("state-idle");
const stateLoading = document.getElementById("state-loading");
const stateSuccess = document.getElementById("state-success");
const stateNone = document.getElementById("state-none");
const stateError = document.getElementById("state-error");

const msgSuccess = document.getElementById("msg-success");
const msgError = document.getElementById("msg-error");

// ─── State Management ─────────────────────────────────────────

/**
 * Hides all state panels and shows only the requested one.
 * This is the single source of truth for what the popup displays.
 *
 * @param {'idle' | 'loading' | 'success' | 'none' | 'error'} state
 */
function showState(state) {
  const states = {
    idle: stateIdle,
    loading: stateLoading,
    success: stateSuccess,
    none: stateNone,
    error: stateError,
  };

  // Hide all states first
  Object.values(states).forEach((el) => el.classList.add("pd-state--hidden"));

  // Show the requested one
  if (states[state]) {
    states[state].classList.remove("pd-state--hidden");
  }
}

// ─── Quick Save ───────────────────────────────────────────────

/**
 * Handles the Quick Save button click.
 * Sends a message to the service worker and updates
 * the UI based on the response.
 */
async function handleQuickSave() {
  // Disable the button to prevent double-clicks
  btnQuickSave.disabled = true;

  // Show the loading spinner
  showState("loading");

  try {
    // Send the QUICK_SAVE action to the service worker
    // Options object is empty for Phase 1 — Phase 2 will populate it
    const response = await chrome.runtime.sendMessage({
      action: "QUICK_SAVE",
      options: {},
    });

    // Handle the response based on status
    switch (response.status) {
      case "success":
        // Build a human-friendly result message
        msgSuccess.textContent =
          response.failed > 0
            ? `Saved ${response.succeeded} image${response.succeeded !== 1 ? "s" : ""}. ${response.failed} failed.`
            : `${response.succeeded} image${response.succeeded !== 1 ? "s" : ""} saved successfully!`;
        showState("success");
        break;

      case "none_found":
        showState("none");
        break;

      case "error":
        msgError.textContent =
          response.errors[0] || "Something went wrong. Please try again.";
        showState("error");
        break;

      default:
        showState("idle");
    }
  } catch (error) {
    // This can happen if the service worker is not responding
    msgError.textContent =
      "Could not connect to the extension. Try reloading it.";
    showState("error");
  }

  // Re-enable the button after a short delay
  // so the user can run another save if needed
  setTimeout(() => {
    btnQuickSave.disabled = false;
  }, 2000);
}

// ─── Settings ─────────────────────────────────────────────────

/**
 * Opens the settings panel.
 * Chrome opens options_ui pages as a popup within the popup
 * when open_in_tab is set to false in manifest.json.
 */
function handleOpenSettings() {
  chrome.runtime.openOptionsPage();
}

// ─── Event Listeners ──────────────────────────────────────────
btnQuickSave.addEventListener("click", handleQuickSave);
btnSettings.addEventListener("click", handleOpenSettings);

// ─── Initialise ───────────────────────────────────────────────

/**
 * Entry point — runs when the popup is opened.
 * Initialises the theme and sets the default state.
 */
async function init() {
  await initTheme();
  showState("idle");
}

init();
