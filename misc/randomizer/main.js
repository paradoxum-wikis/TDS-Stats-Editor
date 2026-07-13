import "../../Styles/bootstrap.css";
import "../../Styles/Dashboard.css";
import "../../Styles/torus.css";
import "../../Styles/theme.css";
import "./randomizer.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../components/SettingsManager.js";
import AboutModal from "../../Shared/AboutModal.js";

import MapFetcher from "./MapFetcher.js";
import LoadoutFetcher from "./LoadoutFetcher.js";
import ModeFetcher from "./ModeFetcher.js";

import { UI_ELEMENTS } from "./components/Constants.js";
import { appState } from "./components/Constants.js";
import { showLoading, showError } from "./components/utils.js";
import {
  renderMapGallery,
  renderTowerGallery,
  renderPreselectedTowers,
  renderExcludedMaps,
  renderExcludedTowers,
} from "./components/Render.js";
import { populatePreselectionOptions } from "./components/Populator.js";
import { setupFilterHandlers } from "./components/Filters.js";
import { performRandomization } from "./components/Randomize.js";
import { generateResultUrl, applyUrlParameters } from "./components/url.js";
import RandomizerMobileNav from "./components/MobileNav.js";

import * as bootstrap from "bootstrap";

window.bootstrap = bootstrap;

(async () => {
  new AboutModal({
    modalId: "about-modal",
    title: "About Randomizer",
    subtitle: "Information about the Randomizer",
    overviewText: `
      <p>
        The TDS Randomizer is a tool for generating random suggestions
        for your Tower Defense Simulator gameplay. It can suggest
        maps, gamemodes, and even full loadouts to spice up your runs!
      </p>
      <p>
        This randomizer is part of TDS Tools,
        maintained by the Tower Defense Simulator Wiki community.
      </p>
    `,
    showUpdateLog: false,
    showCredits: false,
    showDonations: true,
    additionalTabs: [
      {
        id: "howto",
        title: "How to Use",
        icon: "bi-question-circle",
        content: `
          <div class="toru-section">
            <h6 class="toru-heading">
              <i class="bi bi-question-circle me-2"></i>How to Use
            </h6>
            <div class="toru-options">
              <ol>
                <li>
                  Use the Randomizer Options to pick or exclude Maps,
                  Gamemodes, and Towers.
                </li>
                <li>
                  Pre-select specific items or exclude ones you don't want.
                </li>
                <li>Click "Randomize!" to generate your challenge.</li>
                <li>
                  Use "Copy Result URL" to share it, or "Clear All Filters" to
                  reset.
                </li>
              </ol>
            </div>
          </div>
        `,
      },
    ],
    customFooter: `
      <button type="button" class="w-100 btn btn-secondary" data-bs-dismiss="modal">
        Close
      </button>
    `,
  });

  document.addEventListener("DOMContentLoaded", function () {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-tooltip="true"]'),
    );
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  });

  document.addEventListener("DOMContentLoaded", async () => {
    const mapFetcher = new MapFetcher();
    const loadoutFetcher = new LoadoutFetcher();
    const modeFetcher = new ModeFetcher();

    showLoading(UI_ELEMENTS.randomizedResultsContainer);
    showLoading(UI_ELEMENTS.mapGalleryContainer);
    showLoading(UI_ELEMENTS.towerGalleryContainer);

    try {
      const [maps, towers, modes] = await Promise.all([
        mapFetcher.fetchMaps(),
        loadoutFetcher.fetchTowers(),
        modeFetcher.fetchModes(),
      ]);
      appState.allMaps = maps;
      appState.allTowers = towers;
      appState.allModes = modes;

      if (
        appState.allMaps.length === 0 ||
        appState.allTowers.length === 0 ||
        appState.allModes.length === 0
      ) {
        showError(
          UI_ELEMENTS.randomizedResultsContainer,
          "Some data could not be loaded. Please check console for details.",
        );
      } else {
        UI_ELEMENTS.randomizedResultsContainer.innerHTML =
          '<p class="text-muted text-center mb-0">Click "Randomize!" to generate your challenge!</p>';
      }

      renderMapGallery(appState.allMaps);
      renderTowerGallery(appState.allTowers);
      populatePreselectionOptions();
      renderPreselectedTowers();
      renderExcludedMaps();
      renderExcludedTowers();

      applyUrlParameters();
    } catch (error) {
      showError(
        UI_ELEMENTS.randomizedResultsContainer,
        "Error fetching initial data.",
      );
      showError(UI_ELEMENTS.mapGalleryContainer, "Error loading maps.");
      showError(UI_ELEMENTS.towerGalleryContainer, "Error loading towers.");
      console.error("Initial data fetch error:", error);
    }

    UI_ELEMENTS.randomizeBtn.addEventListener("click", performRandomization);

    UI_ELEMENTS.copyResultBtn.addEventListener("click", async () => {
      if (
        !appState.lastSelectedMap &&
        !appState.lastSelectedMode &&
        appState.lastFinalTowers.length === 0
      ) {
        alert("Please randomize a challenge first!");
        return;
      }
      const resultUrl = generateResultUrl(
        appState.lastSelectedMap,
        appState.lastSelectedMode,
        appState.lastFinalTowers,
      );
      try {
        await navigator.clipboard.writeText(resultUrl);
        alert("Result URL copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy URL: ", err);
        alert("Failed to copy URL. Please copy manually:\n" + resultUrl);
      }
    });

    // mobile shit
    const randomizerMobileNavInstance = new RandomizerMobileNav();

    setupFilterHandlers(() => {
      if (
        randomizerMobileNavInstance.isSidebarOpen() &&
        appState.activeMobileSection === "controls"
      ) {
        randomizerMobileNavInstance.populateSidebarContent("controls");
      }
    });

    window.addEventListener("resize", () => {
      if (
        window.innerWidth >= 768 &&
        randomizerMobileNavInstance.isSidebarOpen()
      ) {
        randomizerMobileNavInstance.closeSidebar();
      }
    });
  });
})();
