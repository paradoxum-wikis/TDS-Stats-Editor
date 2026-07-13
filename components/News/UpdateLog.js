/**
 * Gets update logs from GitHub commits (for the About modal)
 * Uses UIHelpers for updatelog.json data
 */
import { loadUpdateLog } from "./UIHelpers.js";

const repoConfig = {
  owner: "Paradoxum-Wikis",
  name: "TDS-Stats-Editor",
};

class UpdateLog {
  constructor() {
    this.repoOwner = repoConfig.owner;
    this.repoName = repoConfig.name;
    this.commitLimit = 20;
    this.modalContainer = null; // For GitHub commits
  }

  async init() {
    this.modalContainer = document.getElementById("update-log-content");

    // db check
    const isDbDirectory = window.location.pathname.includes("/db/");

    if (this.modalContainer) {
      this.fetchCommits();
    }

    // load JSON changelog outside of the DB page
    if (!isDbDirectory) {
      loadUpdateLog();
    }

    const modal = document.getElementById("discord-modal");
    const updatesTab = document.getElementById("aboutSectionUpdates");

    if (modal && updatesTab) {
      // refresh commits when showing modal or clicking updates tab
      const refreshHandler = () => {
        if (this.modalContainer) this.fetchCommits();
      };

      modal.addEventListener("shown.bs.modal", refreshHandler);
      updatesTab.addEventListener("click", refreshHandler);
    }
  }

  // fetch GitHub commits for the About modal
  async fetchCommits() {
    if (!this.modalContainer) return;

    try {
      //      const token = process.env.GITHUB_PAT;
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/commits?per_page=${this.commitLimit}`,
        {
          headers: {
            //            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const commits = await response.json();
      this.displayCommits(commits);
    } catch (error) {
      console.error("Failed to fetch commits:", error);
      this.showError(
        "Couldn't fetch GitHub updates. Please try again later.",
        this.modalContainer,
      );
    }
  }

  // badge styling for different commit types
  getBadgeStyle(type) {
    switch (type?.toLowerCase()) {
      case "feat":
        return { class: "bg-success", label: "Feature" };
      case "fix":
        return { class: "bg-danger", label: "Fix" };
      case "docs":
        return { class: "bg-info", label: "Documentation" };
      case "style":
        return { class: "bg-primary", label: "Style" };
      case "refactor":
        return { class: "bg-warning text-dark", label: "Refactor" };
      case "perf":
        return { class: "bg-purple", label: "Performance" };
      case "test":
        return { class: "bg-dark", label: "Test" };
      case "chore":
        return { class: "bg-secondary", label: "Chore" };
      case "build":
        return { class: "bg-crimson", label: "Build" };
      default:
        return { class: "bg-secondary", label: type || "Update" };
    }
  }

  formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // displays GitHub commits
  displayCommits(commits) {
    if (!this.modalContainer || !commits?.length) {
      this.modalContainer.innerHTML =
        '<p class="text-center">No commits available.</p>';
      return;
    }

    let html = '<div class="list-group">';

    commits.forEach((commit) => {
      const dateDisplay = this.formatDate(commit.commit.author.date);

      // parse commit message with conventional commit format
      let message = commit.commit.message;
      let type = "";
      let scope = "";
      let description = message;

      const conventionalPattern = /^(\w+)(?:\(([^)]+)\))?: (.+)/;
      const match = message.match(conventionalPattern);

      if (match) {
        [, type, scope, description] = match;
        description = description.split("\n")[0]; // First line only
      }

      const badge = this.getBadgeStyle(type, true);

      html += `
                <div class="list-group-item bg-dark text-white border-secondary">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">
                            <span class="badge ${badge.class} me-1">${badge.label}</span>
                            ${scope ? `<span class="text-muted">(${scope})</span> ` : ""}
                            ${description}
                        </h5>
                    </div>
                    <p class="mb-1 text-muted">by ${commit.commit.author.name}</p>
                    <div class="d-flex w-100 justify-content-between">
                        <small>
                            <a href="${commit.html_url}" target="_blank" class="text-info">
                                <i class="bi bi-github me-1"></i>View details
                            </a>
                        </small>
                        <small class="text-muted">${dateDisplay}</small>
                    </div>
                </div>`;
    });

    html += "</div>";
    this.modalContainer.innerHTML = html;
  }

  showError(message, container) {
    if (!container) return;
    container.innerHTML = `
            <div class="alert alert-danger" role="alert">${message}</div>`;
  }
}

// Displays version info with commit hash
class VersionDisplay {
  constructor() {
    this.version = "";
    this.commitHash = "";
    this.repoOwner = repoConfig.owner;
    this.repoName = repoConfig.name;
  }

  async init() {
    try {
      await Promise.all([
        this.loadVersionFromUpdateLog(),
        this.fetchLatestCommit(),
      ]);

      this.updateVersionElements();
    } catch (error) {
      console.error("Failed to get version display:", error);
      this.commitHash = "dev";
    }
  }

  async loadVersionFromUpdateLog() {
    try {
      const response = await fetch("/updatelog.json");
      if (!response.ok) throw new Error("Failed to load updatelog.json");

      const data = await response.json();
      this.version = data[0]?.version || "";
    } catch (error) {
      console.warn("Failed to load version from updatelog:", error);
      this.version = "";
    }
    return this.version;
  }

  async fetchLatestCommit() {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/commits?per_page=1`,
      );
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

      const commits = await response.json();
      this.commitHash = commits[0]?.sha.substring(0, 7) || "dev";
    } catch (error) {
      console.warn("Failed to fetch commit info:", error);
      this.commitHash = "dev";
    }
    return this.commitHash;
  }

  updateVersionElements() {
    // stats editor ver
    document.querySelectorAll(".version-full").forEach((el) => {
      el.textContent = `${this.version} (${this.commitHash})`;
    });

    // tds ver
    if (window.TDSVersion) {
      document.querySelectorAll(".tdsversion").forEach((el) => {
        el.textContent = window.TDSVersion;
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const updateLog = new UpdateLog();
  updateLog.init();

  const versionDisplay = new VersionDisplay();
  versionDisplay.init();

  const settingsModal = document.getElementById("settings-modal");
  if (settingsModal) {
    settingsModal.addEventListener("shown.bs.modal", () => {
      versionDisplay.updateVersionElements();
    });
  }
});

export { UpdateLog, VersionDisplay };
