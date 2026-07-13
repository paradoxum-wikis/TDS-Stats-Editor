import "../../Styles/bootstrap.css";
import "../../Styles/Dashboard.css";
import "../../Styles/torus.css";
import "../../Styles/theme.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./skills.css";

import "../../components/SettingsManager.js";
import AboutModal from "../../Shared/AboutModal.js";

import * as bootstrap from "bootstrap";
import { SkillTreePlanner } from "./SkillTreePlanner.js";
import { MobileNav } from "./MobileNav.js";

window.bootstrap = bootstrap;
document.addEventListener("DOMContentLoaded", () => {
  new AboutModal({
    title: "About Skills Planner",
    subtitle: "Information about the Skills Planner",
    overviewText: `
      <p>
        The TDS Skills Planner is a tool for planning your skill tree
        in Tower Defense Simulator. It allows you to try out different
        skill combinations and optimize your builds before spending
        your hard-earned coins in-game.
      </p>
      <p>
        This planner is part of TDS Tools, maintained by the
        Tower Defense Simulator Wiki community.
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
                <li>Enter your total available coins in the sidebar</li>
                <li>Use the + and - buttons to allocate skill points</li>
                <li>Prerequisites must be met before unlocking advanced skills</li>
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

  new SkillTreePlanner();

  if (window.innerWidth < 768) {
    new MobileNav();
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth < 768 && !window.skillsMobileNav) {
      window.skillsMobileNav = new MobileNav();
    }
  });
});
