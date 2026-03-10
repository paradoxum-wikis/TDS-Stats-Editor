import "bootstrap/dist/css/bootstrap.min.css"; // temp fix
import "../Styles/bootstrap.css";
import "../Styles/torus.css";
import "./Style.css";
import "./theme.css";
import "./GridScale.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import * as bootstrap from "bootstrap";
window.bootstrap = bootstrap;

import { mwFileUrl } from "mediawiki-file-url";
window.mwFileUrl = mwFileUrl;

import "./TDSWikiFetcher.js";
import "./TDSWikiLoader.js";
import "./TDSWikiUploader.js";
import "./TDSWikiUploaderUI.js";
import "./TDSWikiSorter.js";
import "./ApprovedList.js";
import "./DBSettingsManager.js";
import "./Modals.js";

// radio button bullshit
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.setupRadioButtonHandlers === "function") {
    window.setupRadioButtonHandlers();
  }
});
