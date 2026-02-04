/**
 * TDSWikiFetcher.js
 * gets tower data from the TDS wiki
 */

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
      origin: "*", // Enables CORS for Fandom
      disablepp: "true",
    };

    const finalParams = new URLSearchParams({ ...defaultParams, ...params });
    const url = `${this.apiBaseUrl}?${finalParams.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Wiki API returned status: ${response.status}`);
    }

    return response.json();
  }

  async fetchTowers() {
    try {
      console.log("fetching towers from wiki API...");

      const data = await this.fetchFromApi({
        page: this.sourcePage,
        prop: "text",
      });

      if (data.error) throw new Error(`API Error: ${data.error.info}`);

      const htmlContent = data.parse?.text?.["*"];
      if (!htmlContent) {
        console.warn("No content found in API response");
        return this.getFallbackTowers();
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<body>${htmlContent}</body>`,
        "text/html",
      );

      const towerElements = doc.querySelectorAll(".CategoryTreeItem");
      console.log(`found ${towerElements.length} towers on wiki`);

      if (towerElements.length === 0) {
        return this.getFallbackTowers();
      }

      const towers = Array.from(towerElements)
        .filter((element) =>
          element.querySelector("a")?.href.includes("User_blog:"),
        )
        .map((element) => {
          const link = element.querySelector("a");
          let fullText = link?.textContent?.trim() || "Unknown Tower";

          if (fullText.startsWith("User blog:")) {
            fullText = fullText.replace("User blog:", "");
          }

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
          };
        });

      console.log(`loading details for ${towers.length} towers...`);

      const enrichmentPromises = towers.map((tower) =>
        this.enrichTowerData(tower).catch((err) =>
          console.warn(`failed to get details for ${tower.name}:`, err),
        ),
      );

      await Promise.allSettled(enrichmentPromises);
      return towers;
    } catch (error) {
      console.error("failed to get towers from wiki:", error);
      return this.getFallbackTowers();
    }
  }

  async enrichTowerData(tower) {
    try {
      const data = await this.fetchFromApi({
        page: tower.pageTitle,
        prop: "text",
      });

      if (data.error || !data.parse?.text?.["*"]) {
        throw new Error("Page content missing");
      }

      const html = data.parse.text["*"];
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");

      let contentElement = doc.querySelector(".mw-parser-output") || doc.body;

      const descElement = doc.querySelector("#desc");
      if (descElement) {
        tower.description = descElement.textContent.trim();
      } else {
        const paragraphs = contentElement.querySelectorAll("p");
        if (paragraphs.length > 0) {
          tower.description = paragraphs[0].textContent.trim();
        }
      }

      const images = Array.from(contentElement.querySelectorAll("img")).filter(
        (img) => !img.closest("pre"),
      );

      if (images.length > 0) {
        for (const img of images) {
          const imgSrc = img.getAttribute("src") || "";
          if (
            imgSrc &&
            !imgSrc.includes("favicon") &&
            !imgSrc.includes("icon")
          ) {
            tower.image = imgSrc;
            break;
          }
        }
      }

      const preElement =
        doc.querySelector("pre#towerdata") ||
        doc.querySelector('pre[id="towerdata"]') ||
        doc.querySelector("pre");

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
            const firstKey = Object.keys(jsonData)[0];
            if (firstKey) tower.jsonName = firstKey;
          } catch (jsonError) {
            console.log("No valid JSON found in <pre> block for", tower.name);
          }
        }
      }

      if (!tower.image || tower.image.includes("Site-favicon.ico")) {
        const contentText = contentElement.textContent;
        const robloxIdMatch = contentText.match(/RobloxID(\d+)/i);

        if (robloxIdMatch) {
          const robloxId = robloxIdMatch[1];
          await this.fetchRobloxImage(robloxId, tower);
        }
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

      if (!response.ok) throw new Error("Proxy error");

      const data = await response.json();
      if (data?.locations?.[0]?.location) {
        tower.image = data.locations[0].location;
      }
    } catch (e) {
      console.warn(`Roblox fetch failed for ID ${robloxId}`, e);
    }
  }

  // called it fallbacks, but it's mostly placeholder data for testing tbh
  getFallbackTowers() {
    console.log("using fallback towers");
    return [
      {
        name: "GAIA",
        description:
          "GAIA is an Earth Simulator developed by the GAI Computer Corporation.",
        image:
          "https://static.wikia.nocookie.net/tower-defense-sim/images/2/23/SlasherReworkUpgrade4.png",
        author: "Nishijou",
      },
      {
        name: "Noah II",
        description:
          "Noah II is a second-generation artificial Gigalomaniac device developed by N.O.Z.O.M.I.",
        image:
          "https://static.wikia.nocookie.net/tower-defense-sim/images/a/ab/MiniLevel4.png",
        author: "Takumi",
      },
      {
        name: "Pyro Mage",
        description: "Deals fire damage over time to enemies in a wide area.",
        image:
          "https://static.wikia.nocookie.net/tower-defense-sim/images/9/92/MinigunnerUpgradeLevel3.png",
        author: "Takuru",
      },
      {
        name: "Shadow Assassin",
        description:
          "Stealthy tower with high critical damage and hidden detection.",
        image:
          "https://static.wikia.nocookie.net/tower-defense-sim/images/c/c4/MinigunnerUpgradeLevel2.png",
        author: "Miyashiro",
      },
    ];
  }
}

window.TDSWikiFetcher = TDSWikiFetcher;
