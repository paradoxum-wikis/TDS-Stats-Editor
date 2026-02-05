/**
 * TDSWikiFetcher.js
 * gets tower data from the TDS wiki
 */

import { mwFileUrl } from "mediawiki-file-url";

class TDSWikiFetcher {
  constructor() {
    this.apiBaseUrl = "https://tds.fandom.com/api.php";
    this.robloxProxyBase = "https://api.tds-editor.com/?url=";
    this.sourcePage = "User:Gabonnie/DBT";
    this.featuredTowers = window.featuredTowers || [];
  }

  async fetchFromApi(params) {
    const defaultParams = {
      action: "parse",
      format: "json",
      origin: "*",
      disablepp: "true",
    };
    const finalParams = new URLSearchParams({ ...defaultParams, ...params });
    const response = await fetch(
      `${this.apiBaseUrl}?${finalParams.toString()}`,
    );

    if (!response.ok) throw new Error(`Wiki API error: ${response.status}`);
    return response.json();
  }

  convertFileToFandomUrl(filename) {
    try {
      return mwFileUrl(
        filename,
        "https://static.wikia.nocookie.net/tower-defense-sim/images",
      );
    } catch (error) {
      console.error(`Error converting File: syntax: ${error.message}`);
      return `./../htmlassets/Unavailable.png`;
    }
  }

  async fetchTowers() {
    try {
      console.log("fetching towers from wiki API...");

      const data = await this.fetchFromApi({
        page: this.sourcePage,
        prop: "text",
      });
      if (data.error) throw new Error(data.error.info);

      const htmlContent = data.parse?.text?.["*"];
      if (!htmlContent) return this.getFallbackTowers();

      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<body>${htmlContent}</body>`,
        "text/html",
      );
      const towerElements = doc.querySelectorAll(".CategoryTreeItem");

      if (towerElements.length === 0) return this.getFallbackTowers();

      const towers = Array.from(towerElements)
        .filter((element) =>
          element.querySelector("a")?.href.includes("User_blog:"),
        )
        .map((element) => {
          const link = element.querySelector("a");
          let fullText = link?.textContent?.trim() || "Unknown Tower";

          if (fullText.startsWith("User blog:"))
            fullText = fullText.replace("User blog:", "");

          const towerName = fullText.includes("/")
            ? fullText.split("/").pop()
            : fullText;
          const href = link?.getAttribute("href") || "";
          const pageTitle = href.replace(/^\/wiki\//, "") || fullText;

          return {
            name: towerName,
            pageTitle: decodeURIComponent(pageTitle),
            url: href,
            image:
              "https://static.wikia.nocookie.net/tower-defense-sim/images/4/4a/Site-favicon.ico",
            author: fullText.includes("/")
              ? fullText.split("/")[0]
              : "Wiki Contributor",
            featured: this.featuredTowers.includes(fullText),
            highlighted: window.highlights
              ? window.highlights.includes(fullText)
              : false,
            verified: window.approvedTowers
              ? window.approvedTowers.includes(fullText)
              : false,
            unverified: window.approvedTowers
              ? !window.approvedTowers.includes(fullText)
              : true,
            grandfathered: window.grandfatheredTowers
              ? window.grandfatheredTowers.includes(fullText)
              : false,
            uploadDate: "Recently",
          };
        });

      await Promise.allSettled(
        towers.map((tower) => this.enrichTowerData(tower)),
      );

      return towers;
    } catch (error) {
      console.error("failed to get towers:", error);
      return this.getFallbackTowers();
    }
  }

  async enrichTowerData(tower) {
    try {
      const data = await this.fetchFromApi({
        page: tower.pageTitle,
        prop: "text",
      });
      if (!data.parse?.text?.["*"]) throw new Error("No content");

      const html = data.parse.text["*"];
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
      const contentElement = doc.querySelector(".mw-parser-output") || doc.body;

      const descElement = doc.querySelector("#desc");
      if (descElement) {
        const rawText = descElement.textContent.trim();
        const parts = rawText.split("|").map((s) => s.trim());

        const lastPart = parts[parts.length - 1];
        if (lastPart.toLowerCase().startsWith("last updated:")) {
          tower.uploadDate = lastPart.replace(/last updated:/i, "").trim();
          parts.pop();
        }

        tower.description = parts.join(" | ");
      } else {
        const p = contentElement.querySelector("p");
        if (p) tower.description = p.textContent.trim();
      }

      const images = Array.from(contentElement.querySelectorAll("img")).filter(
        (img) => !img.closest("pre"),
      );

      for (const img of images) {
        const src = img.getAttribute("src");
        if (src && !src.includes("favicon") && !src.includes("icon")) {
          tower.image = src;
          break;
        }
      }

      const preElement =
        doc.querySelector("pre#towerdata") || doc.querySelector("pre");
      if (preElement) {
        const preContent = preElement.innerHTML.trim();
        const linkMatch = preContent.match(
          /<a\s+href="(\/wiki\/User_blog:.+\/.+)".*?>.*?<\/a>/i,
        );
        if (linkMatch) {
          tower.linkedTower = linkMatch[1];
          tower.isLink = true;
        } else {
          try {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = preContent;
            const cleanJson = tempDiv.textContent || tempDiv.innerText || "";
            const jsonData = JSON.parse(cleanJson);
            tower.data = jsonData;
            if (Object.keys(jsonData)[0])
              tower.jsonName = Object.keys(jsonData)[0];
          } catch (e) {}
        }
      }

      const allTextContent = contentElement.textContent;
      const tagMatch = allTextContent.match(/\b(New|Rework|Rebalance)\b/);
      if (tagMatch) {
        tower.tag = tagMatch[0];
      }

      if (!tower.image || tower.image.includes("Site-favicon.ico")) {
        const fileMatch = contentElement.textContent.match(
          /File:([^\s"'<>()]+\.(?:png|jpg|jpeg|gif))/i,
        );
        if (fileMatch) {
          tower.image = this.convertFileToFandomUrl(fileMatch[1]);
        } else {
          const robloxIdMatch =
            contentElement.textContent.match(/RobloxID(\d+)/i);
          if (robloxIdMatch) {
            await this.fetchRobloxImage(robloxIdMatch[1], tower);
          }
        }
      }

      if (tower.image && tower.image.startsWith("File:")) {
        tower.image = this.convertFileToFandomUrl(tower.image.substring(5));
      }
    } catch (error) {
      console.warn(`enrich failed for ${tower.name}:`, error);
    }
  }

  async fetchRobloxImage(robloxId, tower) {
    try {
      const roProxyUrl = `https://assetdelivery.roblox.com/v2/assetId/${robloxId}`;
      const requestUrl = `${this.robloxProxyBase}${encodeURIComponent(roProxyUrl)}`;
      const response = await fetch(requestUrl, {
        headers: {
          Origin: window.location.origin,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await response.json();
      if (data?.locations?.[0]?.location)
        tower.image = data.locations[0].location;
    } catch (e) {
      console.warn(`Roblox fetch failed for ID ${robloxId}`, e);
    }
  }

  // called it fallbacks, but it's mostly placeholder data for testing tbh
  getFallbackTowers() {
    return [
      {
        name: "GAIA",
        description:
          "GAIA is an Earth Simulator developed by the GAI Computer Corporation.",
        image:
          "https://static.wikia.nocookie.net/tower-defense-sim/images/2/23/SlasherReworkUpgrade4.png",
        author: "Nishijou",
      },
    ];
  }
}

window.TDSWikiFetcher = TDSWikiFetcher;
