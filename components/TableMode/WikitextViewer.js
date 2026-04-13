import { WikitextHighlighter } from "wikistxr";

class WikitextViewer {
  constructor() {
    this.container = document.createElement("div");
    this.container.className = "wikitext-viewer";
    this.highlighter = new WikitextHighlighter();

    if (!document.getElementById("wikistxr-styles")) {
      const styleTag = document.createElement("style");
      styleTag.id = "wikistxr-styles";
      styleTag.textContent = WikitextHighlighter.getDefaultStyles();
      document.head.appendChild(styleTag);
    }
  }

  getContainer() {
    return this.container;
  }

  showWikitext(wikitext) {
    this.container.innerHTML = "";

    const highlightedHtml = this.highlighter.highlight(wikitext);
    this.container.innerHTML = highlightedHtml;

    return this;
  }
}

export default WikitextViewer;
