/**
 * Site-wide appearance settings (theme + motion).
 * Safe to import on any page; only wires up elements that exist.
 */
class SettingsManager {
  constructor() {
    this.themeModeControl = document.getElementById("themeModeControl");
    this.themeToggle = document.getElementById("themeToggle");
    this.themeToggleLabel = document.querySelector('label[for="themeToggle"]');
    this.animationsToggle = document.getElementById("animationsToggle");
    this.animationsStylesheet = document.getElementById("animsCSS");
    this.body = document.body;
    this.systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    this.themeMode = localStorage.getItem("themeMode") || "auto";
    this.theme =
      localStorage.getItem("theme") ||
      (this.systemThemeQuery.matches ? "dark" : "light");
    this.updateCurrentTheme();

    this.animationsEnabled =
      localStorage.getItem("animationsEnabled") !== "false";

    this.init();
  }

  updateCurrentTheme() {
    if (this.themeMode === "auto") {
      this.currentTheme = this.systemThemeQuery.matches ? "dark" : "light";
    } else {
      this.currentTheme = this.theme;
    }
  }

  applyTheme() {
    this.body.classList.toggle("light-mode", this.currentTheme === "light");
    this.updateThemeImages();

    if (this.themeToggle) {
      this.themeToggle.checked = this.currentTheme === "dark";
      this.updateToggleLabel();
    }

    if (this.themeModeControl) {
      this.themeModeControl.value = this.themeMode;
    }

    this.updateThemeToggleState();
  }

  updateThemeToggleState() {
    const isDisabled = this.themeMode === "auto";
    if (this.themeToggle) {
      this.themeToggle.disabled = isDisabled;
    }
    if (this.themeToggleLabel) {
      this.themeToggleLabel
        .closest(".toru-item")
        ?.classList.toggle("disabled", isDisabled);
    }
  }

  handleSystemThemeChange() {
    if (this.themeMode === "auto") {
      this.updateCurrentTheme();
      this.applyTheme();
    }
  }

  init() {
    if (this.themeModeControl) {
      this.themeModeControl.value = this.themeMode;
      this.themeModeControl.addEventListener(
        "change",
        this.setThemeMode.bind(this),
      );
    }

    this.applyTheme();

    if (this.themeMode === "auto") {
      this.systemThemeQuery.addEventListener(
        "change",
        this.handleSystemThemeChange.bind(this),
      );
    }

    if (this.animationsStylesheet) {
      this.animationsStylesheet.disabled = !this.animationsEnabled;
    }

    if (this.themeToggle) {
      this.themeToggle.addEventListener("change", this.toggleTheme.bind(this));
    }

    if (this.animationsToggle) {
      this.animationsToggle.checked = !this.animationsEnabled;
      this.animationsToggle.addEventListener(
        "change",
        this.toggleAnimations.bind(this),
      );
    }

    this.updateThemeImages();
  }

  setThemeMode(event) {
    const newMode = event.target.value;
    if (this.themeMode === newMode) return;

    if (newMode === "auto") {
      this.systemThemeQuery.addEventListener(
        "change",
        this.handleSystemThemeChange.bind(this),
      );
    } else {
      this.systemThemeQuery.removeEventListener(
        "change",
        this.handleSystemThemeChange.bind(this),
      );
    }

    this.themeMode = newMode;
    localStorage.setItem("themeMode", this.themeMode);
    this.updateCurrentTheme();
    this.applyTheme();
  }

  toggleTheme() {
    if (this.themeMode === "manual") {
      this.theme = this.themeToggle.checked ? "dark" : "light";
      localStorage.setItem("theme", this.theme);
      this.updateCurrentTheme();
      this.applyTheme();
    }
  }

  toggleAnimations() {
    this.animationsEnabled = !this.animationsToggle.checked;
    localStorage.setItem("animationsEnabled", this.animationsEnabled);

    if (this.animationsStylesheet) {
      this.animationsStylesheet.disabled = !this.animationsEnabled;
    }
  }

  updateToggleLabel() {
    if (!this.themeToggleLabel) return;

    const icon = this.themeToggleLabel.querySelector(".bi");
    const titleSpan = this.themeToggleLabel.querySelector(".toru-title");
    const descriptionSpan = this.themeToggleLabel.querySelector(
      ".d-block.small.text-muted",
    );

    if (!icon || !titleSpan || !descriptionSpan) return;

    if (this.currentTheme === "dark") {
      icon.className = "bi bi-moon-stars me-2 toru-icon";
      titleSpan.textContent = "Dark Mode";
      descriptionSpan.textContent = "Enjoy the dark side of the web";
    } else {
      icon.className = "bi bi-sun me-2 toru-icon";
      titleSpan.textContent = "Light Mode";
      descriptionSpan.textContent = "Bathe in the light of the web";
    }
  }

  updateThemeImages() {
    document.querySelectorAll(".theme-image").forEach((img) => {
      if (this.currentTheme === "light") {
        if (img.dataset.lightSrc) img.src = img.dataset.lightSrc;
      } else if (img.dataset.darkSrc) {
        img.src = img.dataset.darkSrc;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.settingsManager = new SettingsManager();
});
