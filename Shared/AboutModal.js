/**
 * AboutModal - About modal component
 * Generates a modal with tabs for About, Update Log, Credits, and optional custom tabs.
 */
export default class AboutModal {
  constructor(options = {}) {
    this.options = {
      modalId: options.modalId || "about-modal",
      title: options.title || "About Us",
      subtitle: options.subtitle || "Information about this tool",
      overviewText: options.overviewText || this.#getDefaultOverview(),
      projectName: options.projectName || "TDS Tools",
      showUpdateLog: options.showUpdateLog !== false,
      showCredits: options.showCredits !== false,
      showDonations: options.showDonations !== false,
      additionalTabs: options.additionalTabs || [],
      ...options,
    };

    this.modal = null;
    this.updateLogContainer = null;
    this.supporters = [];
    this.supportersLoaded = false;
    this.init();
  }

  #getDefaultOverview() {
    return `
      <p>
        TDS Tools (and the Database) is a website and project
        owned by the community of the Tower Defense Simulator Wiki.
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
    `;
  }

  init() {
    if (document.getElementById(this.options.modalId)) {
      console.warn(`Modal with id "${this.options.modalId}" already exists`);
      return;
    }

    const modalHTML = this.#generateModalHTML();
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    this.modal = document.getElementById(this.options.modalId);

    if (this.options.showDonations) {
      this.#createMoMoModal();
    }

    if (this.options.showUpdateLog) {
      this.updateLogContainer = this.modal.querySelector(
        `#${this.options.modalId}-updates-content`,
      );

      this.#setupUpdateLogLoading();
    }

    this.#setupSupportersLoading();
    this.#updateThemeImages();

    if (window.bootstrap && window.bootstrap.Tooltip) {
      const tooltipTriggerList = [].slice.call(
        this.modal.querySelectorAll('[data-bs-tooltip="true"]'),
      );
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new window.bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }

  #updateThemeImages() {
    if (!this.modal) return;

    const body = document.body;
    const isLightMode = body.classList.contains("light-mode");

    this.modal.querySelectorAll(".theme-image").forEach((img) => {
      if (isLightMode) {
        if (img.dataset.lightSrc) {
          img.src = img.dataset.lightSrc;
        }
      } else {
        if (img.dataset.darkSrc) {
          img.src = img.dataset.darkSrc;
        }
      }
    });
  }

  #createMoMoModal() {
    if (document.getElementById("momo-qr-modal")) {
      return;
    }

    const momoModalHTML = `
      <div
        class="modal fade"
        id="momo-qr-modal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="momo-qr-label"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content bg-dark text-white">
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="d-flex align-items-center">
                <div class="toru-icon-container me-3">
                  <i class="bi bi-qr-code-scan fs-3"></i>
                </div>
                <div>
                  <h5 class="modal-title unisans mb-0" id="momo-qr-label">
                    Donate via MoMo
                  </h5>
                  <p class="text-muted small mb-0">
                    Scan QR code with MoMo app
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body text-center p-4 pb-0">
              <div class="mb-3">
                <img
                  src="https://bin.t7ru.link/a551f4de9d6d"
                  alt="MoMo QR Code"
                  class="img-fluid"
                  style="max-width: 300px; border-radius: 8px;"
                  loading="lazy"
                />
              </div>
              <p class="text-muted">
                Open the MoMo app on your phone, scan this QR code, and follow the prompts to complete your donation.
              </p>
              <div class="alert alert-info mt-3">
                <i class="bi bi-info-circle me-2"></i>
                MoMo is available for users in Vietnam only.
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", momoModalHTML);
  }

  #setupUpdateLogLoading() {
    if (!this.modal || !this.updateLogContainer) return;

    const updatesTab = this.modal.querySelector(
      `#${this.options.modalId}-updates-tab`,
    );
    const loadCommits = () => {
      if (this.updateLogContainer && !this.updateLogContainer.dataset.loaded) {
        this.#fetchGitHubCommits();
        this.updateLogContainer.dataset.loaded = "true";
      }
    };

    this.modal.addEventListener("shown.bs.modal", loadCommits);

    if (updatesTab) {
      updatesTab.addEventListener("click", loadCommits);
    }
  }

  async #fetchGitHubCommits() {
    if (!this.updateLogContainer) return;

    const repoOwner = "Paradoxum-Wikis";
    const repoName = "TDS-Stats-Editor";
    const commitLimit = 20;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=${commitLimit}`,
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const commits = await response.json();
      this.#displayCommits(commits);
    } catch (error) {
      console.error("Failed to fetch commits:", error);
      this.#showError("Couldn't fetch GitHub updates. Please try again later.");
    }
  }

  #displayCommits(commits) {
    if (!this.updateLogContainer) return;

    let html = '<div class="list-group">';

    commits.forEach((commit) => {
      const message = commit.commit.message;
      const fullDate = new Date(commit.commit.author.date);
      const formattedDate = fullDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const sha = commit.sha.substring(0, 7);
      const author = commit.commit.author.name;
      const url = commit.html_url;
      const { badge, extraBadge, cleanMessage } = this.#getBadgeStyle(message);

      html += `
        <div class="list-group-item bg-dark text-white border-secondary">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">
              ${badge}
              ${extraBadge}
              ${cleanMessage}
            </h5>
          </div>
          <p class="mb-1 text-muted">by ${author}</p>
          <div class="d-flex w-100 justify-content-between">
            <small>
              <a href="${url}" target="_blank" class="text-info">
                <i class="bi bi-github me-1"></i>View details
              </a>
            </small>
            <small class="text-muted">${formattedDate}</small>
          </div>
        </div>
      `;
    });

    html += "</div>";
    this.updateLogContainer.innerHTML = html;
  }

  #getBadgeStyle(message) {
    const lowerMessage = message.toLowerCase();
    let badge = "";
    let extraBadge = "";
    let cleanMessage = message.split("\n")[0];

    if (lowerMessage.startsWith("npm(")) {
      const npmMatch = message.match(/npm\(([^)]+)\):\s*(.*)/);
      if (npmMatch) {
        badge = '<span class="badge bg-secondary me-1">npm</span>';
        extraBadge = `<span class="text-muted">(${npmMatch[1]})</span> `;
        cleanMessage = npmMatch[2];
      } else {
        badge = '<span class="badge bg-secondary me-1">npm</span>';
      }
    }
    // conventional commit formats
    else if (
      lowerMessage.startsWith("feat:") ||
      lowerMessage.startsWith("feat(")
    ) {
      badge = '<span class="badge bg-success me-1">Feature</span>';
      cleanMessage = cleanMessage.replace(/^feat(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("fix:") ||
      lowerMessage.startsWith("fix(")
    ) {
      badge = '<span class="badge bg-danger me-1">Fix</span>';
      cleanMessage = cleanMessage.replace(/^fix(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("chore:") ||
      lowerMessage.startsWith("chore(")
    ) {
      badge = '<span class="badge bg-secondary me-1">Chore</span>';
      cleanMessage = cleanMessage.replace(/^chore(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("docs:") ||
      lowerMessage.startsWith("docs(")
    ) {
      badge = '<span class="badge bg-info me-1">Docs</span>';
      cleanMessage = cleanMessage.replace(/^docs(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("refactor:") ||
      lowerMessage.startsWith("refactor(")
    ) {
      badge = '<span class="badge bg-warning me-1">Refactor</span>';
      cleanMessage = cleanMessage.replace(/^refactor(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("style:") ||
      lowerMessage.startsWith("style(")
    ) {
      badge = '<span class="badge bg-info me-1">Style</span>';
      cleanMessage = cleanMessage.replace(/^style(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("test:") ||
      lowerMessage.startsWith("test(")
    ) {
      badge = '<span class="badge bg-warning me-1">Test</span>';
      cleanMessage = cleanMessage.replace(/^test(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("perf:") ||
      lowerMessage.startsWith("perf(")
    ) {
      badge = '<span class="badge bg-success me-1">Performance</span>';
      cleanMessage = cleanMessage.replace(/^perf(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("ci:") ||
      lowerMessage.startsWith("ci(")
    ) {
      badge = '<span class="badge bg-info me-1">CI</span>';
      cleanMessage = cleanMessage.replace(/^ci(\([^)]*\))?:\s*/i, "");
    } else if (
      lowerMessage.startsWith("build:") ||
      lowerMessage.startsWith("build(")
    ) {
      badge = '<span class="badge bg-secondary me-1">Build</span>';
      cleanMessage = cleanMessage.replace(/^build(\([^)]*\))?:\s*/i, "");
    }
    // merge commits
    else if (
      lowerMessage.startsWith("merge pull request") ||
      lowerMessage.startsWith("merge branch")
    ) {
      badge = '<span class="badge bg-primary me-1">Merge</span>';
    } else if (lowerMessage.includes("fix") || lowerMessage.includes("bug")) {
      badge = '<span class="badge bg-danger me-1">Fix</span>';
    } else if (
      lowerMessage.includes("add") ||
      lowerMessage.includes("feature")
    ) {
      badge = '<span class="badge bg-success me-1">Feature</span>';
    } else if (
      lowerMessage.includes("update") ||
      lowerMessage.includes("improve")
    ) {
      badge = '<span class="badge bg-primary me-1">Update</span>';
    } else if (
      lowerMessage.includes("refactor") ||
      lowerMessage.includes("cleanup")
    ) {
      badge = '<span class="badge bg-warning me-1">Refactor</span>';
    } else if (lowerMessage.includes("doc")) {
      badge = '<span class="badge bg-info me-1">Docs</span>';
    } else {
      badge = '<span class="badge bg-secondary me-1">Chore</span>';
    }

    return { badge, extraBadge, cleanMessage };
  }

  #showError(message) {
    if (!this.updateLogContainer) return;

    this.updateLogContainer.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
      </div>
    `;
  }

  #generateModalHTML() {
    const tabs = this.#generateTabs();
    const tabContent = this.#generateTabContent();

    return `
      <div
        class="modal fade"
        id="${this.options.modalId}"
        tabindex="-1"
        role="dialog"
        aria-labelledby="${this.options.modalId}-label"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content bg-dark text-white">
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="d-flex align-items-center">
                <div class="toru-icon-container me-3">
                  <i class="bi bi-info-circle-fill fs-3"></i>
                </div>
                <div>
                  <h5 class="modal-title unisans mb-0" id="${this.options.modalId}-label">
                    ${this.options.title}
                  </h5>
                  <p class="text-muted small mb-0">
                    ${this.options.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-0">
              ${tabs}
              ${tabContent}
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              ${this.#generateFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  #generateTabs() {
    const baseTabs = [];

    // Supporters tab
    baseTabs.push({
      id: "supporters",
      title: "Supporters",
      icon: "bi-heart",
      active: true,
    });

    // About tab
    baseTabs.push({
      id: "about",
      title: "About",
      icon: "bi-info-circle",
      active: false,
    });

    // Update Log tab
    if (this.options.showUpdateLog) {
      baseTabs.push({
        id: "updates",
        title: "Update Log",
        icon: "bi-journal-code",
      });
    }

    // Credits tab
    if (this.options.showCredits) {
      baseTabs.push({
        id: "credits",
        title: "Credits",
        icon: "bi-people-fill",
      });
    }

    // Custom tabs
    const allTabs = [...baseTabs, ...this.options.additionalTabs];

    const tabsHTML = allTabs
      .map(
        (tab, index) => `
      <li class="nav-item" role="presentation">
        <button
          class="nav-link ${index === 0 ? "active" : ""} text-white"
          id="${this.options.modalId}-${tab.id}-tab"
          data-bs-toggle="tab"
          data-bs-target="#${this.options.modalId}-${tab.id}-content"
          type="button"
          role="tab"
          aria-controls="${this.options.modalId}-${tab.id}-content"
          aria-selected="${index === 0 ? "true" : "false"}"
        >
          <i class="bi ${tab.icon} me-2"></i>${tab.title}
        </button>
      </li>
    `,
      )
      .join("");

    return `
      <ul class="nav nav-tabs nav-fill bg-darker" id="${this.options.modalId}-tabs" role="tablist">
        ${tabsHTML}
      </ul>
    `;
  }

  #generateTabContent() {
    const baseContent = [];

    baseContent.push(this.#generateSupportersContent());
    baseContent.push(this.#generateAboutContent());

    if (this.options.showUpdateLog) {
      baseContent.push(this.#generateUpdateLogContent());
    }

    if (this.options.showCredits) {
      baseContent.push(this.#generateCreditsContent());
    }

    const customContent = this.options.additionalTabs
      .map(
        (tab) => `
      <div
        class="tab-pane fade"
        id="${this.options.modalId}-${tab.id}-content"
        role="tabpanel"
        aria-labelledby="${this.options.modalId}-${tab.id}-tab"
      >
        ${tab.content}
      </div>
    `,
      )
      .join("");

    return `
      <div class="tab-content p-3">
        ${baseContent.join("")}
        ${customContent}
      </div>
    `;
  }

  #generateSupportersContent() {
    return `
      <div
        class="tab-pane fade show active"
        id="${this.options.modalId}-supporters-content"
        role="tabpanel"
        aria-labelledby="${this.options.modalId}-supporters-tab"
      >
        <div class="toru-section">
          <h6 class="toru-heading">
            <i class="bi bi-heart-fill me-2"></i>Our Supporters
          </h6>
          <div class="toru-options">
            <p class="text-center text-muted mb-3">
              Special thanks to our generous supporters who help keep this project running!
            </p>
            <div id="supporters-container">
              <div class="text-center">
                <div class="spinner-border spinner-border-sm text-secondary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${
          this.options.showDonations
            ? `
          <div class="toru-section">
            <h6 class="toru-heading">
              <i class="bi bi-envelope-open-heart me-2"></i>Support Us
            </h6>
            <div class="toru-options">
              <p class="text-center">
                If you find this tool useful and would like to support its development, consider making a donation!
              </p>
              <div class="row g-3 mt-2">
                <div class="col-md-4">
                  <a
                    href="https://github.com/sponsors/Paradoxum-Wikis"
                    target="_blank"
                    class="btn btn-outline-light w-100 d-flex flex-column align-items-center p-3"
                  >
                    <i class="bi bi-github fs-3 mb-2"></i>
                    <span class="fw-bold">GitHub Sponsors</span>
                    <small class="text-muted mt-1">Get yourself a GitHub sponsor badge too!</small>
                  </a>
                </div>
                <div class="col-md-4">
                  <a
                    href="https://ko-fi.com/paradoxumwikis"
                    target="_blank"
                    class="btn btn-outline-light w-100 d-flex flex-column align-items-center p-3"
                  >
                    <i class="bi bi-cup-hot-fill fs-3 mb-2"></i>
                    <span class="fw-bold">Ko-fi</span>
                    <small class="text-muted mt-1">The most convenient way to support us!</small>
                  </a>
                </div>
                <div class="col-md-4">
                  <button
                    type="button"
                    class="btn btn-outline-light w-100 d-flex flex-column align-items-center p-3"
                    data-bs-toggle="modal"
                    data-bs-target="#momo-qr-modal"
                  >
                    <i class="bi bi-qr-code fs-3 mb-2"></i>
                    <span class="fw-bold">MoMo</span>
                    <small class="text-muted mt-1">Quyên góp qua ngân hàng nội địa!</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  #generateAboutContent() {
    return `
      <div
        class="tab-pane fade"
        id="${this.options.modalId}-about-content"
        role="tabpanel"
        aria-labelledby="${this.options.modalId}-about-tab"
      >
        <div class="toru-section">
          <h6 class="toru-heading">
            <i class="bi bi-book me-2"></i>Overview
          </h6>
          <div class="toru-options">
            ${this.options.overviewText}
          </div>
        </div>

        <div class="toru-section">
          <div class="d-flex align-items-center justify-content-center">
            <a
              href="https://discord.gg/fBgQzudY3h"
              target="_blank"
              class="mx-3 text-decoration-none d-flex flex-column align-items-center"
            >
              <img
                style="width: 48px"
                class="zoomup type1"
                title="Join the Tower Defense Simulator Wiki Discord server!"
                data-bs-tooltip="true"
                data-bs-placement="bottom"
                src="https://static.wikia.nocookie.net/tower-defense-sim/images/4/4c/Discord-Symbol-Blurple.svg"
                alt="Discord Logo"
                loading="lazy"
              />
            </a>
            <a
              href="https://github.com/Paradoxum-Wikis/TDS-Stats-Editor"
              target="_blank"
              class="mx-3 text-decoration-none d-flex flex-column align-items-center"
            >
              <img
                style="width: 48px"
                class="zoomup theme-image"
                title="Contribute to the website's source code!"
                data-bs-tooltip="true"
                data-bs-placement="bottom"
                src="/htmlassets/github-mark-white.svg"
                data-light-src="/htmlassets/github-mark.svg"
                data-dark-src="/htmlassets/github-mark-white.svg"
                alt="GitHub Logo"
                loading="lazy"
              />
            </a>
            <a
              href="https://tds.fandom.com/wiki/Help:Statistics_Editor"
              target="_blank"
              class="mx-3 text-decoration-none d-flex flex-column align-items-center"
            >
              <img
                style="width: 48px"
                class="zoomup type1"
                title="Visit the dedicated help guide on the TDS Wiki!"
                data-bs-tooltip="true"
                data-bs-placement="bottom"
                src="/htmlassets/wikisquaredsmall.png"
                alt="TDS Wiki Logo"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>
    `;
  }

  #generateUpdateLogContent() {
    return `
      <div
        class="tab-pane fade overflow-auto"
        id="${this.options.modalId}-updates-content"
        role="tabpanel"
        aria-labelledby="${this.options.modalId}-updates-tab"
        style="max-height: 25rem"
      >
        <div class="d-flex justify-content-center">
          <div class="spinner-border text-secondary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    `;
  }

  #generateCreditsContent() {
    return `
      <div
        class="tab-pane fade"
        id="${this.options.modalId}-credits-content"
        role="tabpanel"
        aria-labelledby="${this.options.modalId}-credits-tab"
      >
        <div class="toru-section">
          <h6 class="toru-heading">
            <i class="bi bi-code-slash me-2"></i>Developers
          </h6>
          <div class="toru-options">
            <div class="row justify-content-center">
              <div class="col-md-4 mb-3">
                <div class="card bg-dark border-secondary h-100">
                  <div class="card-body text-center">
                    <img
                      src="https://avatars.githubusercontent.com/u/85133189"
                      alt="Developer"
                      class="rounded-circle mb-3 object-fit-cover"
                      style="width: 5rem"
                      loading="lazy"
                    />
                    <h6 class="card-title">megu-dev</h6>
                    <p class="card-text small text-muted">
                      Developer<br />(Tier Maker)
                    </p>
                    <a
                      href="https://github.com/megu-dev"
                      target="_blank"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-github me-1"></i>GitHub
                    </a>
                  </div>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="card bg-dark border-secondary h-100">
                  <div class="card-body text-center">
                    <img
                      src="https://avatars.githubusercontent.com/u/57356716"
                      alt="Developer"
                      class="rounded-circle mb-3 object-fit-cover"
                      style="width: 5rem"
                      loading="lazy"
                    />
                    <h6 class="card-title">t7ru</h6>
                    <p class="card-text small text-muted">
                      Core Developer<br />(Entirety)
                    </p>
                    <a
                      href="https://github.com/t7ru"
                      target="_blank"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-github me-1"></i>GitHub
                    </a>
                  </div>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="card bg-dark border-secondary h-100">
                  <div class="card-body text-center">
                    <img
                      src="https://avatars.githubusercontent.com/u/64506745"
                      alt="Developer"
                      class="rounded-circle mb-3 object-fit-cover"
                      style="width: 5rem"
                      loading="lazy"
                    />
                    <h6 class="card-title">SneakyWolfy</h6>
                    <p class="card-text small text-muted">
                      Original Developer<br />(Stats Editor)
                    </p>
                    <a
                      href="https://github.com/SneakyWolfy"
                      target="_blank"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-github me-1"></i>GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="toru-section">
          <h6 class="toru-heading">
            <i class="bi bi-stars me-2"></i>Acknowledgements
          </h6>
          <div class="toru-options">
            <p>
              Special thanks to all contributors to the project,
              Mentin123, the Tower Defense Simulator Wiki community, and
              the Tower Defense Simulator community for their support
              and feedback.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  #generateFooter() {
    if (this.options.customFooter) {
      return this.options.customFooter;
    }

    return `
      <span class="text-muted small me-auto">Last updated for game version: <b class="tdsversion"></b></span>
      <button
        type="button"
        class="btn btn-secondary"
        data-bs-dismiss="modal"
      >
        Close
      </button>
    `;
  }

  show() {
    if (this.modal && window.bootstrap && window.bootstrap.Modal) {
      const modalInstance = new window.bootstrap.Modal(this.modal);
      modalInstance.show();
    }
  }

  hide() {
    if (this.modal && window.bootstrap && window.bootstrap.Modal) {
      const modalInstance = window.bootstrap.Modal.getInstance(this.modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  #setupSupportersLoading() {
    const loadSupporters = async () => {
      if (!this.supportersLoaded) {
        await this.#fetchSupporters();
        this.#updateSupportersDisplay();
        this.supportersLoaded = true;
      }
    };

    this.modal.addEventListener("shown.bs.modal", loadSupporters);
  }

  async #fetchSupporters() {
    try {
      const response = await fetch("/supporters.json");
      if (response.ok) {
        this.supporters = await response.json();
      }
    } catch (error) {
      console.error("Failed to load supporters:", error);
      this.supporters = [];
    }
  }

  #updateSupportersDisplay() {
    const supportersContainer = this.modal.querySelector(
      "#supporters-container",
    );
    if (supportersContainer) {
      supportersContainer.innerHTML = this.#generateSupporterCards();
    }
  }

  #generateSupporterCards() {
    if (this.supporters.length === 0) {
      return '<p class="text-center text-muted">Be the first to support us!</p>';
    }

    return this.supporters
      .map((supporter) => {
        const linkStart = supporter.link
          ? `<a href="${supporter.link}" target="_blank" class="text-decoration-none">`
          : "";
        const linkEnd = supporter.link ? "</a>" : "";
        const tierBadge = supporter.tier
          ? `<span class="badge bg-warning text-dark mb-2">Tier ${supporter.tier}</span>`
          : "";
        const message = supporter.message
          ? `<p class="card-text small text-muted fst-italic mt-2 mb-0">"${supporter.message}"</p>`
          : "";

        return `
        <div class="card bg-dark border-secondary mb-3">
          <div class="card-body">
            <div class="d-flex align-items-center">
              ${linkStart}
                <img
                  src="${supporter.avatar}"
                  alt="${supporter.name || "Supporter"}"
                  class="rounded-circle me-3"
                  style="width: 3.5rem; height: 3.5rem; object-fit: cover;"
                  loading="lazy"
                />
              ${linkEnd}
              <div class="flex-grow-1">
                ${linkStart}
                  <h6 class="card-title mb-1">${supporter.name || "Anonymous Supporter"}</h6>
                ${linkEnd}
                ${tierBadge}
              </div>
            </div>
            ${message}
          </div>
        </div>
      `;
      })
      .join("");
  }
}
