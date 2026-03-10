import "../Styles/bootstrap.css";
import "../Styles/Dashboard.css";
import "../Styles/Sidebars.css";
import "../Styles/torus.css";
import "../Styles/theme.css";
import "../Styles/MobileNav.css";
import "./tierlist.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import * as bootstrap from "bootstrap";
window.bootstrap = bootstrap;
import html2canvas from "html2canvas";
window.html2canvas = html2canvas;

import ImageLoader from "../components/ImageLoader.js";
import { renderTowerShorthands } from "./Shorthand.js";
import "./MobileNav.js";
import "../components/Slides.js";
import "../components/News/UpdateLog.js";
import "../components/SettingsManager.js";
import AboutModal from "../Shared/AboutModal.js";

new AboutModal({
  modalId: "discord-modal",
  title: "About Us",
  subtitle: "Information about the Tier List Maker",
  overviewText: `
    <p>
      Adachi's TDS Ranker is a part of the TDS Statistics
      Editor, a project owned by the community of Tower Defense
      Simulator Wiki.
    </p>
    <p>
      The official Tower Defense Simulator Wiki is hosted by
      <img
        width="60px"
        class="theme-image"
        src="https://static.wikia.nocookie.net/6a181c72-e8bf-419b-b4db-18fd56a0eb60"
        data-light-src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Fandom.svg"
        data-dark-src="https://static.wikia.nocookie.net/6a181c72-e8bf-419b-b4db-18fd56a0eb60"
        style="vertical-align: text-top"
        alt="Fandom"
        loading="lazy"
      />
      which manages and maintains the platform for the
      community. This website operates independently and is not
      directly affiliated with it.
    </p>
  `,
  showUpdateLog: true,
  showCredits: true,
  showDonations: true,
  customFooter: `
    <button type="button" class="w-100 btn btn-secondary" data-bs-dismiss="modal">
      Close
    </button>
  `,
});

// if you have the time, please split this main.js file into smaller files, it's getting a bit too much tbh
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// main tier list data
const tierListData = {
  S: [],
  A: [],
  B: [],
  C: [],
  D: [],
  E: [],
  F: [],
};

// tower data and aliases loaded from lua
let towerData = {};
let towerAliases = {};

async function initializeTierlistData() {
  try {
    const response = await fetch("/tierlist.lua");
    if (!response.ok) {
      throw new Error(`Failed to load tierlist.lua: ${response.status}`);
    }
    const luaContent = await response.text();
    // call the actual parsing functions which update the global variables
    parseTowerData(luaContent);
    parseTowerAliases(luaContent);

    console.log("Tower data loaded:", Object.keys(towerData).length, "towers");
    console.log(
      "Tower aliases loaded:",
      Object.keys(towerAliases).length,
      "aliases",
    );
    if (Object.keys(towerData).length === 0) {
      console.error("No tower data was extracted from tierlist.lua");
    }
    console.log("Successfully loaded data from tierlist.lua");
  } catch (error) {
    console.error("Error initializing tierlist data:", error);
    alert(
      "Failed to load essential tower data. The application might not work correctly. Check console for details.",
    );
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeTierlistData();
    await new Promise((resolve) => setTimeout(resolve, 0));

    renderTierList();
    renderTowerShorthands(towerAliases);

    await new Promise((resolve) => setTimeout(resolve, 0));

    populateTowerGallery();
    setupEventListeners();
    loadTierListFromURL(); // Or load default
  } catch (error) {
    console.error("Initialization failed:", error);
    const alertContainer = document.getElementById("alert-container");
    if (alertContainer) {
      alertContainer.innerHTML = `<div class="alert alert-danger" role="alert">Failed to initialize application. Please try refreshing the page if the issue still persists. Best to check the console for details.</div>`;
    }
  }
});

function parseTowerData(luaContent) {
  // grab tower info from lua
  const towerDataRegex =
    /keywordMap\s*=\s*{\s*([\s\S]*?)(?=}\s*(?:local|return|\n\n))/;
  const towerEntryRegex =
    /\["([^"]+)"\]\s*=\s*{\s*file\s*=\s*"([^"]+)",\s*category\s*=\s*"([^"]+)"([^}]*)}/g;
  const dataMatch = luaContent.match(towerDataRegex);
  if (dataMatch && dataMatch[1]) {
    const towerSection = dataMatch[1];
    let match;
    while ((match = towerEntryRegex.exec(towerSection)) !== null) {
      const [_, name, file, category, extraData] = match;
      towerData[name] = { file, category };

      const categories = [category];
      const additionalCategoriesMatch = extraData.match(/"([^"]+)"/g);
      if (additionalCategoriesMatch) {
        additionalCategoriesMatch.forEach((catMatch) => {
          const cat = catMatch.replace(/"/g, "");
          categories.push(cat);
        });
      }

      towerData[name].categories = categories;
    }
  } else {
    console.error("Failed to find tower data section in the Lua file");
    console.log(
      "Lua file content preview:",
      luaContent.substring(0, 500) + "...",
    );
  }
}

function parseTowerAliases(luaContent) {
  // grab aliases from lua
  const aliasesRegex =
    /keywordAlias\s*=\s*{\s*([\s\S]*?)(?=}\s*(?:local|return|\n\n))/;
  const aliasEntryRegex = /\["([^"]+)"\]\s*=\s*"([^"]+)"/g;
  const aliasesMatch = luaContent.match(aliasesRegex);
  if (aliasesMatch && aliasesMatch[1]) {
    const aliasesSection = aliasesMatch[1];
    let match;
    while ((match = aliasEntryRegex.exec(aliasesSection)) !== null) {
      const [_, alias, fullName] = match;
      towerAliases[alias.toLowerCase()] = fullName;
    }
  } else {
    console.warn(
      "Aliases section not found. The app will work without aliases.",
    );
  }
}

// find tower name, ignore case
function findTowerCaseInsensitive(name) {
  if (towerData[name]) {
    return name;
  }
  const lowerName = name.toLowerCase();
  for (const towerName in towerData) {
    if (towerName.toLowerCase() === lowerName) {
      return towerName;
    }
  }
  return name;
}

function getImageUrl(filename) {
  return ImageLoader.convertFileToFandomUrl(filename);
}

function renderTierList() {
  // Clear existing towers from all tiers
  document.querySelectorAll(".tier-content").forEach((tierContent) => {
    tierContent.innerHTML = "";
  });

  // Add towers to each tier
  const tiers = ["S", "A", "B", "C", "D", "E", "F"];
  tiers.forEach((tier) => {
    const tierContent = document.querySelector(
      `.tier-content[data-tier="${tier}"]`,
    );
    if (!tierContent) return;

    tierListData[tier].forEach((towerName) => {
      const normalizedName = towerAliases[towerName] || towerName;
      const towerInfo = towerData[normalizedName];

      const towerElement = document.createElement("span");
      towerElement.className = "tier-item";
      towerElement.setAttribute("data-tower", normalizedName);
      towerElement.setAttribute("data-tier", tier);

      if (towerInfo) {
        const imageUrl = getImageUrl(towerInfo.file);
        towerElement.classList.add(`category-${towerInfo.category}`);
        towerElement.setAttribute("data-tooltip", normalizedName);

        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = normalizedName;
        towerElement.appendChild(img);
      } else {
        towerElement.setAttribute(
          "data-tooltip",
          `Unknown tower: ${towerName}`,
        );

        const placeholder = document.createElement("div");
        placeholder.className =
          "bg-danger text-white d-flex align-items-center justify-content-center w-100 h-100";
        placeholder.textContent = towerName.charAt(0);
        towerElement.appendChild(placeholder);
      }

      tierContent.appendChild(towerElement);
    });
  });

  addTierItemListeners();
}

function populateTowerGallery() {
  const gallery = document.getElementById("tower-gallery");
  const scrollPosition = gallery.scrollTop;
  gallery.innerHTML = "";

  const fragment = document.createDocumentFragment();

  const sections = {
    towers: {
      title: "Towers",
      items: [],
    },
    golden: {
      title: "Golden Towers",
      items: [],
    },
    skins: {
      title: "Skins",
      items: [],
    },
  };

  // sort towers into appropriate sections
  const towerNames = Object.keys(towerData).sort();
  towerNames.forEach((name) => {
    const towerInfo = towerData[name];
    const isTower = Array.isArray(towerInfo.categories)
      ? towerInfo.categories.includes("tower")
      : towerInfo.category === "tower" ||
        (towerInfo.category && towerInfo.category.includes("tower"));

    const isGolden = towerInfo.category === "golden";
    const isInTier = Object.values(tierListData).some((tierArr) =>
      tierArr.some((t) => t.toLowerCase() === name.toLowerCase()),
    );

    const tower = document.createElement("div");
    tower.className = `tower-item tier-item m-1 p-1 bg-dark border border-secondary category-${towerInfo.category || ""}`;
    tower.setAttribute("data-tower", name);
    tower.setAttribute("data-tooltip", name);

    if (isInTier) {
      tower.classList.add("added");
    } else {
      tower.addEventListener("click", () => {
        const selectedTier = document.getElementById("tier-select").value;
        addTowerToTier(name, selectedTier);
        // showAddedIndicator itself also calls populateTowerGallery again after animation, might wanna do something about this in the future
        showAddedIndicator(tower, selectedTier);
      });
    }

    const img = document.createElement("img");
    img.src = getImageUrl(towerInfo.file);
    img.className = "img-fluid";
    img.alt = name;

    tower.appendChild(img);

    // ads tower element to the items array
    if (isTower) {
      sections.towers.items.push(tower);
    } else if (isGolden) {
      sections.golden.items.push(tower);
    } else {
      sections.skins.items.push(tower);
    }
  });

  for (const [key, section] of Object.entries(sections)) {
    if (section.items.length > 0) {
      const header = document.createElement("h5");
      header.className = "text-white text-center my-2";
      header.textContent = section.title;
      fragment.appendChild(header);

      const container = document.createElement("div");
      container.className = "d-flex flex-wrap justify-content-center w-100";
      container.setAttribute("data-section", key);

      section.items.forEach((towerElement) => {
        container.appendChild(towerElement);
      });

      fragment.appendChild(container);
    }
  }

  gallery.appendChild(fragment);
  gallery.scrollTop = scrollPosition;
  filterTowerGallery();
}

// show animation when tower is added to tier list
function showAddedIndicator(element, tierName) {
  // prevent adding indicator if already greyed out (already added)
  if (element.classList.contains("added")) return;

  const indicator = document.createElement("div");
  indicator.className = "added-indicator";
  indicator.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
  indicator.style.color = getTierColor(tierName);

  element.appendChild(indicator);
  setTimeout(() => {
    indicator.style.opacity = "1";
  }, 10);

  // add tier letter
  const tierIndicator = document.createElement("div");
  tierIndicator.className = "tier-indicator";
  tierIndicator.textContent = tierName;
  tierIndicator.style.color = getTierColor(tierName);

  element.appendChild(tierIndicator);
  setTimeout(() => {
    tierIndicator.style.opacity = "1";
  }, 10);

  // remove after anim and THEN update gallery
  setTimeout(() => {
    indicator.style.opacity = "0";
    tierIndicator.style.opacity = "0";
    setTimeout(() => {
      if (element.contains(indicator)) element.removeChild(indicator);
      if (element.contains(tierIndicator)) element.removeChild(tierIndicator);
      // Update the gallery AFTER the animation finishes and indicators are removed
      populateTowerGallery();
    }, 500);
  }, 1000);
}

// get color for tier indicator
function getTierColor(tier) {
  const tierColors = {
    S: "#d33b3b",
    A: "#d58639",
    B: "#d7c73f",
    C: "#3ad54f",
    D: "#5197dd",
    E: "#885dcb",
    F: "#b55bb5",
  };
  return tierColors[tier] || "#FFFFFF";
}

function setupEventListeners() {
  document.getElementById("add-tower-btn").addEventListener("click", () => {
    const input = document.getElementById("tower-input");
    const selectedTier = document.getElementById("tier-select").value;
    const towers = input.value.split(",");
    towers.forEach((tower) => {
      const trimmedName = tower.trim();
      if (trimmedName) {
        addTowerToTier(trimmedName, selectedTier);
      }
    });
    input.value = "";
  });

  document.getElementById("reset-tierlist").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset your tier list?")) {
      resetTierList();
    }
  });

  document.getElementById("export-image").addEventListener("click", () => {
    exportTierListImage();
  });

  document.getElementById("copy-tierlist").addEventListener("click", () => {
    copyTierListCode();
  });

  document.getElementById("import-btn").addEventListener("click", () => {
    importTierList();
  });

  document.querySelectorAll(".filter-category").forEach((checkbox) => {
    checkbox.addEventListener("change", filterTowerGallery);
  });

  // debounce the search input listener
  const searchInput = document.querySelector("#Tower-Search input");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(filterTowerGallery, 300));
  }

  // Prevent form submission on Enter in search bar
  const searchForm = document.getElementById("Tower-Search");
  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  }

  // hash change listener for url updates without page reload
  window.addEventListener("hashchange", function () {
    // This function will be called whenever the hash part of the url changes
    loadTierListFromURL();
  });

  const towerInput = document.getElementById("tower-input");
  towerInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("add-tower-btn").click();
    }
  });
}

function addTowerToTier(towerName, tier) {
  // normalize tower name using aliases
  const lowerTowerName = towerName.toLowerCase();
  const normalizedName = towerAliases[lowerTowerName] || towerName;
  const correctCaseTowerName = findTowerCaseInsensitive(normalizedName);
  if (!towerData[correctCaseTowerName] && !towerData[normalizedName]) {
    console.warn(`Adding unknown tower: ${towerName}`);
  }
  const finalTowerName = towerData[correctCaseTowerName]
    ? correctCaseTowerName
    : normalizedName;

  // check if already in ANY tier
  const alreadyInAnyTier = Object.values(tierListData).some((tierArr) =>
    tierArr.some((t) => t.toLowerCase() === finalTowerName.toLowerCase()),
  );

  let towerMoved = false;

  if (!alreadyInAnyTier) {
    tierListData[tier].push(finalTowerName);
  } else {
    console.log(
      `Tower ${finalTowerName} is already in a tier. Moving to ${tier}.`,
    );
    // remove from existing tier first
    Object.keys(tierListData).forEach((t) => {
      const index = tierListData[t].findIndex(
        (name) => name.toLowerCase() === finalTowerName.toLowerCase(),
      );
      if (index !== -1) {
        tierListData[t].splice(index, 1);
        towerMoved = true;
      }
    });
    tierListData[tier].push(finalTowerName);
  }

  renderTierList();

  // Only update gallery if the tower was moved between tiers
  if (towerMoved) {
    populateTowerGallery();
  }

  updateURLHash();
}

function removeTowerFromTier(towerName, tier) {
  const index = tierListData[tier].findIndex(
    (t) => t.toLowerCase() === towerName.toLowerCase(),
  );
  if (index !== -1) {
    tierListData[tier].splice(index, 1);
    renderTierList();
    populateTowerGallery();
    updateURLHash();
  }
}

function resetTierList() {
  Object.keys(tierListData).forEach((tier) => {
    tierListData[tier] = [];
  });
  renderTierList();
  populateTowerGallery();
  updateURLHash();
}

function exportTierListImage() {
  const tierlist = document.querySelector(".tier-list");
  if (!tierlist) {
    alert("No tier list to export!");
    return;
  }
  const exportBtn = document.getElementById("export-image");
  const originalHTML = exportBtn.innerHTML;
  const resetButtonState = () => {
    exportBtn.innerHTML = originalHTML;
    exportBtn.disabled = false;
  };
  exportBtn.innerHTML = "Exporting...";
  exportBtn.disabled = true;

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = tierlist.offsetWidth + "px";
  wrapper.style.height = tierlist.offsetHeight + "px";

  // clone the tierlist to avoid modifying the original
  const tierlistClone = tierlist.cloneNode(true);
  wrapper.appendChild(tierlistClone);

  const logo = document.createElement("img");
  logo.src = "../htmlassets/tdsrankerlogo.png";
  logo.style.position = "absolute";
  logo.style.right = "10px";
  logo.style.bottom = "10px";
  logo.style.height = "50px";
  logo.style.opacity = "0.55";
  logo.style.zIndex = "100";
  wrapper.appendChild(logo);

  wrapper.style.position = "absolute";
  wrapper.style.top = "-9999px";
  wrapper.style.left = "-9999px";
  document.body.appendChild(wrapper);

  // wait for all images to load
  const allImages = wrapper.querySelectorAll("img");
  const imagePromises = Array.from(allImages).map((img) => {
    if (img.complete) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }
  });

  Promise.all(imagePromises)
    .then(() => {
      return html2canvas(wrapper, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "null",
        scale: 2,
        logging: false,
      });
    })
    .then((canvas) => {
      const link = document.createElement("a");
      link.download = "adachi-tds-tierlist.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      document.body.removeChild(wrapper);
    })
    .catch((error) => {
      console.error("Error exporting tier list:", error);
      alert("Failed to export tier list image. Check console for details.");

      // clean up even when there's an error
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    })
    .finally(() => {
      resetButtonState();
    });
}

function copyTierListCode() {
  let code = "{{Tierlist";
  Object.keys(tierListData).forEach((tier) => {
    if (tierListData[tier].length > 0) {
      code += ` | ${tier} = ${tierListData[tier].join(", ")}`;
    }
  });
  code += "}}";
  navigator.clipboard
    .writeText(code)
    .then(() => {
      alert(
        "Tier list code copied to clipboard, have fun showcasing it on the wiki!",
      );
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
      alert("Failed to copy to clipboard.");
      // fallback: use textarea
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy"); // for older browsers, ignore the strikethrough
        alert("Tier list code copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy: ", err);
        alert("Failed to copy. Here is your code:\n\n" + code);
      }
      document.body.removeChild(textarea);
    });
}

function importTierList() {
  const importCode = document.getElementById("import-code").value.trim();
  // check if code looks right
  const tierlistRegex = /{{Tierlist(?:\s*\|[^=|}]+=\s*[^\s|}][^|}]*)+\s*}}/i;
  if (!tierlistRegex.test(importCode)) {
    alert(
      "Invalid tier list code format. It should look like:\n{{Tierlist | S = Tower1, Tower2 | A = Tower3}}",
    );
    return;
  }

  resetTierList();

  // grab tier data from code
  const tierRegex = /\|\s*([A-Z])\s*=\s*([^|]+)(?=\||}})/g;
  let match;
  let updatedTiers = false;

  while ((match = tierRegex.exec(importCode)) !== null) {
    const tier = match[1];
    const towers = match[2]
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    if (tierListData[tier]) {
      towers.forEach((tower) => {
        const lowerTowerName = tower.toLowerCase();
        const normalizedName = towerAliases[lowerTowerName] || tower;
        const correctCaseTowerName = findTowerCaseInsensitive(normalizedName);
        const finalTowerName = towerData[correctCaseTowerName]
          ? correctCaseTowerName
          : normalizedName;

        // Direct addition to avoid multiple renders
        if (
          !Object.values(tierListData)
            .flat()
            .some((t) => t.toLowerCase() === finalTowerName.toLowerCase())
        ) {
          tierListData[tier].push(finalTowerName);
          updatedTiers = true;
        }
      });
    }
  }

  // Only update UI once, after all changes are processed
  if (updatedTiers) {
    renderTierList();
    populateTowerGallery();
    updateURLHash();
  }

  document.getElementById("import-code").value = "";
}

function filterTowerGallery() {
  const searchTerm = document
    .querySelector("#Tower-Search input")
    .value.toLowerCase();
  const enabledCategories = Array.from(
    document.querySelectorAll(".filter-category:checked"),
  ).map((cb) => cb.value);
  const towers = document.querySelectorAll("#tower-gallery .tower-item");
  towers.forEach((tower) => {
    const towerName = tower.getAttribute("data-tower").toLowerCase();
    const category =
      towerData[tower.getAttribute("data-tower")]?.category || "";
    const matchesSearch = searchTerm === "" || towerName.includes(searchTerm);
    const matchesCategory =
      category === "" || enabledCategories.includes(category);
    tower.style.display = matchesSearch && matchesCategory ? "" : "none";
  });
}

function addTierItemListeners() {
  const preview = document.getElementById("tierlist-preview");
  preview.addEventListener("click", function (event) {
    // finds the closest ancestor that is a tier item with a tier attribute
    const item = event.target.closest(".tier-item[data-tier]");
    if (item) {
      const tower = item.getAttribute("data-tower");
      const tier = item.getAttribute("data-tier");
      if (tower && tier) {
        removeTowerFromTier(tower, tier);
      }
    }
  });
}

function loadTierListFromURL() {
  const hash = window.location.hash.substring(1);
  if (!hash) {
    console.log("No tier list data found in the URL hash.");
    return;
  }

  try {
    resetTierList(); // this will clear the hash via updateURLHash()

    const params = new URLSearchParams(hash);
    let loadedSomething = false;

    params.forEach((towerString, tier) => {
      const upperTier = tier.toUpperCase();
      if (tierListData.hasOwnProperty(upperTier)) {
        const towers = towerString
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== ""); // Split, trim, remove empty

        towers.forEach((towerName) => {
          const lowerTowerName = towerName.toLowerCase();
          const normalizedName = towerAliases[lowerTowerName] || towerName;
          const correctCaseTowerName = findTowerCaseInsensitive(normalizedName);
          const finalTowerName = towerData[correctCaseTowerName]
            ? correctCaseTowerName
            : normalizedName;

          // directly add to tierListData to avoid multiple renders inside the loop
          if (
            !Object.values(tierListData)
              .flat()
              .some((t) => t.toLowerCase() === finalTowerName.toLowerCase())
          ) {
            tierListData[upperTier].push(finalTowerName);
            loadedSomething = true;
          } else {
            console.warn(
              `Tower "${finalTowerName}" found multiple times in URL or already present, skipping duplicate.`,
            );
          }
        });
      } else {
        console.warn(`Invalid tier "${tier}" found in URL hash.`);
      }
    });

    if (loadedSomething) {
      console.log("Tier list loaded from URL hash.");
      renderTierList();
      populateTowerGallery();

      // ALWAYS RESTORE HASH AFTER LOADING
      updateURLHash();
    } else {
      if (hash) {
        console.log("A URL hash was found, but no valid tier data was loaded.");
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }
  } catch (error) {
    console.error("Error parsing tier list from URL hash:", error);
    alert("Could not load tier list from URL. The format might be invalid.");
    resetTierList();
  }
}

function updateURLHash() {
  const params = new URLSearchParams();
  let hashIsEmpty = true;
  Object.keys(tierListData).forEach((tier) => {
    if (tierListData[tier].length > 0) {
      // join the raw tower names with commas
      const towerNamesString = tierListData[tier].join(",");
      // let URLSearchParams handle the encoding when toString() is called
      params.set(tier, towerNamesString);
      hashIsEmpty = false;
    }
  });

  if (!hashIsEmpty) {
    // params.toString() will correctly encode spaces and other necessary characters
    history.replaceState(null, "", "#" + params.toString());
  } else {
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }
}

window.addTowerToTier = addTowerToTier;
window.resetTierList = resetTierList;
window.exportTierListImage = exportTierListImage;
window.copyTierListCode = copyTierListCode;
window.filterTowerGallery = filterTowerGallery;
