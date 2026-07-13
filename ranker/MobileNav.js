import { MobileNavBase } from "../Shared/MobileNavBase.js";

class MobileNavigation extends MobileNavBase {
  constructor() {
    const sectionConfigs = {
      controls: {
        originalElement: document.getElementById("tier-list-controls"),
        removeClasses: ["aside", "d-none", "d-md-flex"],
        addClasses: ["mobile-controls-section"],
        style: {
          width: "100%",
          height: "auto",
          minWidth: "auto",
          overflowY: "visible",
        },
      },
      filters: {
        originalElement: document.getElementById("tower-filters"),
        removeClasses: ["aside", "d-none", "d-md-flex"],
        addClasses: ["mobile-controls-section"],
        style: {
          width: "100%",
          height: "auto",
          minWidth: "auto",
          overflowY: "visible",
        },
      },
      navigation: {
        contentGenerator: () => this.createNavigationMenu(),
      },
    };

    const modalConfigs = {
      about: "discord-modal",
    };

    super({ sectionConfigs, modalConfigs, bodyActiveClass: "sidebar-open" });

    // store the currently selected tier
    this.selectedTier = "S";
  }

  /**
   * Overrides the base onInit to handle URL hash checking for initial section opening.
   */
  onInit() {
    const urlHash = window.location.hash.substring(1);
    if (
      urlHash === "controls" ||
      urlHash === "filters" ||
      urlHash === "navigation"
    ) {
      this.openSection(urlHash);
    }
  }

  /**
   * Overrides the base populateSidebarContent to handle specific ranker sections
   * and set the tier select dropdown value.
   * @param {string} sectionName - The name of the section to populate.
   */
  populateSidebarContent(sectionName) {
    if (!this.mobileSidebarContent) return;

    this.mobileSidebarContent.innerHTML = "";

    let contentElement = null;
    const config = this.sectionConfigs[sectionName];

    if (config) {
      if (config.originalElement) {
        contentElement = config.originalElement.cloneNode(true);
        if (config.removeClasses) {
          contentElement.classList.remove(...config.removeClasses);
        }
        if (config.addClasses) {
          contentElement.classList.add(...config.addClasses);
        }
        if (config.style) {
          Object.assign(contentElement.style, config.style);
        }

        // set the dropdown to the saved tier value
        if (sectionName === "controls") {
          const tierSelect = contentElement.querySelector("#tier-select");
          if (tierSelect) {
            tierSelect.value = this.selectedTier;
          }
        }
      } else if (typeof config.contentGenerator === "function") {
        contentElement = config.contentGenerator();
      }

      if (contentElement) {
        this.mobileSidebarContent.appendChild(contentElement);
        this.attachSectionEventListeners(contentElement, sectionName);
      }
    } else {
      const message = document.createElement("p");
      message.className = "text-white";
      message.textContent = "Unknown section selected.";
      this.mobileSidebarContent.appendChild(message);
    }
  }

  /**
   * Overrides the base attachSectionEventListeners for ranker-specific listeners.
   * @param {HTMLElement} container - The container element where the section content was added.
   * @param {string} sectionName - The name of the section.
   */
  attachSectionEventListeners(container, sectionName) {
    switch (sectionName) {
      case "controls":
        const tierSelect = container.querySelector("#tier-select");
        const towerInput = container.querySelector("#tower-input");
        const addTowerBtn = container.querySelector("#add-tower-btn");
        const resetBtn = container.querySelector("#reset-tierlist");
        const exportBtn = container.querySelector("#export-image");
        const copyBtn = container.querySelector("#copy-tierlist");

        if (tierSelect) {
          tierSelect.addEventListener("change", () => {
            this.selectedTier = tierSelect.value;
            // update desktop ui from mobile
            const mainTierSelect = document.getElementById("tier-select");
            if (mainTierSelect && mainTierSelect !== tierSelect) {
              mainTierSelect.value = this.selectedTier;
            }
          });
        }

        if (addTowerBtn) {
          addTowerBtn.addEventListener("click", () => {
            if (tierSelect) {
              this.selectedTier = tierSelect.value;
            }
            const selectedTier = this.selectedTier;
            if (towerInput && towerInput.value) {
              const towers = towerInput.value.split(",");
              towers.forEach((tower) => {
                const trimmedName = tower.trim();
                if (trimmedName) {
                  window.addTowerToTier(trimmedName, selectedTier);
                }
              });
              towerInput.value = "";
            }
          });
        }

        if (resetBtn) {
          resetBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to reset your tier list?")) {
              window.resetTierList();
            }
          });
        }

        if (exportBtn) {
          exportBtn.addEventListener("click", () => {
            window.exportTierListImage();
            this.closeSidebar();
          });
        }

        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            window.copyTierListCode();
            this.closeSidebar();
          });
        }
        break;

      case "filters":
        const filterCheckboxes = container.querySelectorAll(".filter-category");
        // sorta compact syncer
        filterCheckboxes.forEach((checkbox) => {
          checkbox.addEventListener("change", (event) => {
            const checkboxId = event.target.id;
            const mainCheckbox = document.getElementById(checkboxId);

            if (mainCheckbox) {
              mainCheckbox.checked = event.target.checked;
              mainCheckbox.dispatchEvent(
                new Event("change", { bubbles: true }),
              );
            }
            window.filterTowerGallery();
          });
        });
        break;
    }
  }

  /**
   * Creates and returns the navigation menu element for the "navigation" section.
   * @returns {HTMLElement} The navigation menu container.
   */
  createNavigationMenu() {
    const navContainer = document.createElement("div");
    navContainer.className = "navigation-links d-grid gap-3 p-3";

    const navigationItems = [
      {
        name: "TDS Tools Hub",
        url: "../",
        icon: "bi-house-fill",
        description: "Back to the tools hub",
      },
      {
        name: "TDS Wiki",
        url: "https://tds.fandom.com/wiki/",
        icon: "bi-journal-text",
        description: "The Tower Defense Simulator Wiki itself",
      },
      {
        name: "Statistics Editor",
        url: "https://se.tds.wiki/",
        icon: "bi-bar-chart-fill",
        description: "Create and edit tower statistics",
      },
      {
        name: "TDS Database",
        url: "../db/",
        icon: "bi-database-fill",
        description:
          "The Database housing custom towers made by people like you!",
      },
      {
        name: "Paradoxum Game Resources",
        url: "https://resources.tds-editor.com/",
        icon: "bi-file-image-fill",
        description: "Resources of ALTER EGO and TDS game pages",
      },
    ];

    navigationItems.forEach((item) => {
      const button = document.createElement("a");
      button.href = item.url;
      button.className =
        "btn btn-outline-primary p-3 d-flex flex-column align-items-center";

      const icon = document.createElement("i");
      icon.className = `bi ${item.icon} fs-2 mb-2`;

      const name = document.createElement("div");
      name.className = "fw-bold";
      name.textContent = item.name;

      const desc = document.createElement("div");
      desc.className = "small text-white-50";
      desc.textContent = item.description;

      button.appendChild(icon);
      button.appendChild(name);
      button.appendChild(desc);

      navContainer.appendChild(button);
    });

    return navContainer;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("load", () => {
    window.mobileNav = new MobileNavigation();

    window.openMobileSection = (section) => {
      window.mobileNav.openSection(section);
    };

    window.closeMobileSidebar = () => {
      window.mobileNav.closeSidebar();
    };
  });
});

export default MobileNavigation;
