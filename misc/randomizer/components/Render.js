import { UI_ELEMENTS, appState } from "./Constants.js";

export function renderRandomizedResult(
  selectedMap,
  selectedMode,
  selectedTowers,
) {
  UI_ELEMENTS.randomizedResultsContainer.innerHTML = "";

  const resultHtml = `
    <div class="d-flex flex-column">
      ${
        selectedMap
          ? `
        <div class="randomized-section border-secondary pb-3">
          <h5 class="text-info mb-2 d-flex align-items-center">
            <i class="bi bi-map me-2"></i>Map:
          </h5>
          <div class="card bg-dark border-0 text-white">
            <div class="card-body d-flex align-items-center p-3">
              <img src="${selectedMap.imageUrl}" class="me-3 rounded" alt="${selectedMap.name}" style="width: 90px; height: 90px; object-fit: contain;">
              <div>
                <h5 class="card-title mb-1">${selectedMap.name}</h5>
                <p class="card-text small text-muted mb-0">Difficulty: ${selectedMap.difficulty}</p>
                ${selectedMap.enemiesBeta === "Yes" ? '<span class="badge bg-danger mt-1">Enemies Beta</span>' : ""}
              </div>
            </div>
          </div>
        </div>
        <hr class="border-secondary">
      `
          : '<p class="text-muted text-center mb-0">Map randomization disabled or no map found.</p>'
      }

      ${
        selectedMode
          ? `
        <div class="randomized-section border-secondary pb-3">
          <h5 class="text-info mb-2 d-flex align-items-center">
            <i class="bi bi-controller me-2"></i>Gamemode:
          </h5>
          <div class="card bg-dark border-0 text-white">
            <div class="card-body d-flex align-items-center p-3">
              <img src="${selectedMode.imageUrl}" class="me-3 rounded" alt="${selectedMode.name}" style="width: 90px; height: 90px; object-fit: contain;">
              <div>
                <h5 class="card-title mb-1">${selectedMode.name}</h5>
                ${selectedMode.type === "special" ? '<span class="badge bg-warning text-dark mt-1">Special Mode</span>' : ""}
              </div>
            </div>
          </div>
        </div>
        <hr class="border-secondary">
      `
          : '<p class="text-muted text-center mb-0">Gamemode randomization disabled or no mode found.</p>'
      }

      ${
        selectedTowers && selectedTowers.length > 0
          ? `
        <div class="randomized-section">
          <h5 class="text-info mb-2 d-flex align-items-center">
            <i class="bi bi-people me-2"></i>Loadout:
          </h5>
          <div class="row g-2 justify-content-center">
            ${selectedTowers
              .map(
                (tower) => `
              <div class="col-4 col-md-2">
                <div class="card bg-dark border-0 text-white h-100">
                  <img src="${tower.imageUrl}" class="card-img-top p-2" alt="${tower.name}" style="object-fit: contain; height: 70px;">
                  <div class="card-body p-1 text-center">
                    <p class="card-title mb-0 small">${tower.name}</p>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : '<p class="text-muted text-center mb-0">Loadout randomization disabled or no towers found.</p>'
      }
    </div>
  `;
  UI_ELEMENTS.randomizedResultsContainer.innerHTML = resultHtml;
}

export function renderMapGallery(maps) {
  if (maps.length === 0) {
    UI_ELEMENTS.mapGalleryContainer.innerHTML =
      '<p class="text-muted text-center mb-0">No maps available.</p>';
    return;
  }
  UI_ELEMENTS.mapGalleryContainer.innerHTML = "";

  maps.forEach((map) => {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";

    const mapCard = document.createElement("div");
    mapCard.className = "card bg-dark text-white h-100";
    mapCard.innerHTML = `
      <img src="${map.imageUrl}" class="card-img-top p-2" alt="${map.name}" style="object-fit: contain; height: 80px;">
      <div class="card-body p-2 text-center">
        <h6 class="card-title mb-1 small">${map.name}</h6>
      </div>
    `;
    col.appendChild(mapCard);
    UI_ELEMENTS.mapGalleryContainer.appendChild(col);
  });
}

export function renderTowerGallery(towers) {
  if (towers.length === 0) {
    UI_ELEMENTS.towerGalleryContainer.innerHTML =
      '<p class="text-muted text-center mb-0">No towers available.</p>';
    return;
  }
  UI_ELEMENTS.towerGalleryContainer.innerHTML = "";

  towers.forEach((tower) => {
    const col = document.createElement("div");
    col.className = "col-4 col-md-2";

    const towerCard = document.createElement("div");
    towerCard.className = "card bg-dark text-white h-100";
    towerCard.innerHTML = `
      <img src="${tower.imageUrl}" class="card-img-top p-2" alt="${tower.name}" style="object-fit: contain; height: 60px;">
      <div class="card-body p-1 text-center">
        <p class="card-title mb-0 small">${tower.name}</p>
      </div>
    `;
    col.appendChild(towerCard);
    UI_ELEMENTS.towerGalleryContainer.appendChild(col);
  });
}

export function renderPreselectedTowers() {
  UI_ELEMENTS.preselectedTowersContainer.innerHTML = "";
  appState.preselectedTowers.forEach((tower, index) => {
    const towerBadge = document.createElement("span");
    towerBadge.className =
      "badge bg-primary text-white d-flex align-items-center me-1 mb-1";
    towerBadge.innerHTML = `
      ${tower.name}
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Remove" data-index="${index}"></button>
    `;
    UI_ELEMENTS.preselectedTowersContainer.appendChild(towerBadge);

    towerBadge.querySelector(".btn-close").addEventListener("click", (e) => {
      const idxToRemove = parseInt(e.target.dataset.index);
      appState.preselectedTowers.splice(idxToRemove, 1);
      renderPreselectedTowers();
    });
  });
  UI_ELEMENTS.preselectedTowerCountSpan.textContent = `${appState.preselectedTowers.length}/5 towers selected`;
}

export function renderExcludedMaps() {
  UI_ELEMENTS.excludedMapsContainer.innerHTML = "";
  appState.excludedMaps.forEach((map, index) => {
    const mapBadge = document.createElement("span");
    mapBadge.className =
      "badge bg-danger text-white d-flex align-items-center me-1 mb-1";
    mapBadge.innerHTML = `
      ${map.name}
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Remove" data-index="${index}"></button>
    `;
    UI_ELEMENTS.excludedMapsContainer.appendChild(mapBadge);

    mapBadge.querySelector(".btn-close").addEventListener("click", (e) => {
      const idxToRemove = parseInt(e.target.dataset.index);
      appState.excludedMaps.splice(idxToRemove, 1);
      renderExcludedMaps();
    });
  });
  UI_ELEMENTS.excludedMapCountSpan.textContent = `${appState.excludedMaps.length} maps excluded`;
}

export function renderExcludedTowers() {
  UI_ELEMENTS.excludedTowersContainer.innerHTML = "";
  appState.excludedTowers.forEach((tower, index) => {
    const towerBadge = document.createElement("span");
    towerBadge.className =
      "badge bg-danger text-white d-flex align-items-center me-1 mb-1";
    towerBadge.innerHTML = `
      ${tower.name}
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Remove" data-index="${index}"></button>
    `;
    UI_ELEMENTS.excludedTowersContainer.appendChild(towerBadge);

    towerBadge.querySelector(".btn-close").addEventListener("click", (e) => {
      const idxToRemove = parseInt(e.target.dataset.index);
      appState.excludedTowers.splice(idxToRemove, 1);
      renderExcludedTowers();
    });
  });
  UI_ELEMENTS.excludedTowerCountSpan.textContent = `${appState.excludedTowers.length} towers excluded`;
}
