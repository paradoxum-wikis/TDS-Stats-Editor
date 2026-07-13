import ImageLoader from "../../components/ImageLoader.js";

class MapFetcher {
  constructor() {
    this.wikiApiUrl = "https://api.tds-editor.com/randomizer?type=maps";
  }

  async fetchMaps() {
    try {
      console.log("[MapFetcher] Fetching raw map data from:", this.wikiApiUrl);
      const response = await fetch(this.wikiApiUrl, {
        method: "GET",
        headers: {
          Origin: window.location.origin,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (!response.ok) {
        console.error(
          "[MapFetcher] HTTP error response:",
          response.status,
          response.statusText,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawContent = await response.text();
      console.log(
        "[MapFetcher] Raw content received (truncated to 1337 chars):",
        rawContent.substring(0, 1337),
      );
      console.log("[MapFetcher] Full content length:", rawContent.length);

      const maps = [];
      const tableRegex = /\{\|\s*class="light-table[^]*?\|\}/gs;
      console.log("[MapFetcher] Starting table search with regex:", tableRegex);

      let tableMatch;
      let tableCount = 0;

      while ((tableMatch = tableRegex.exec(rawContent)) !== null) {
        tableCount++;
        console.log(`[MapFetcher] Found table #${tableCount}`);
        console.log(
          `[MapFetcher] Table content preview:`,
          tableMatch[0].substring(0, 500),
        );

        const tableContent = tableMatch[0];
        const rows = tableContent
          .split("|-")
          .map((row) => row.trim())
          .filter((row) => row.length > 0);
        console.log(
          `[MapFetcher] Table #${tableCount} has ${rows.length} rows.`,
        );

        let currentDataRowType = null;
        const extractedRows = {
          image: [],
          name: [],
          difficulty: [],
          enemiesBeta: [],
        };

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const headerStartIndex = row.indexOf("!");
          if (headerStartIndex === -1) {
            continue;
          }

          const normalizedRow = row.slice(headerStartIndex).trim();
          if (!normalizedRow.startsWith("!")) {
            continue;
          }

          console.log(
            `[MapFetcher] Processing row ${rowIndex}: "${normalizedRow}"`,
          );

          const headerMatch = normalizedRow.match(/^!\s*([^|!\n]*)/);
          const normalizedHeader = (headerMatch?.[1] || "")
            .trim()
            .toLowerCase();
          if (normalizedHeader.includes("map")) {
            currentDataRowType = "name";
            console.log(`[MapFetcher] Switching to name data row type`);
          } else if (normalizedHeader.includes("difficulty")) {
            currentDataRowType = "difficulty";
            console.log(`[MapFetcher] Switching to difficulty data row type`);
          } else if (normalizedHeader.includes("enemies beta")) {
            currentDataRowType = "enemiesBeta";
            console.log(`[MapFetcher] Switching to enemiesBeta data row type`);
          } else {
            currentDataRowType = "image";
            console.log(`[MapFetcher] Switching to image data row type`);
          }

          if (currentDataRowType) {
            console.log(
              `[MapFetcher] Found data row for ${currentDataRowType}: ${normalizedRow}`,
            );
            const cells = this.parseWikiTableCells(normalizedRow);
            console.log(`[MapFetcher] Extracted ${cells.length} cells:`, cells);
            extractedRows[currentDataRowType].push(...cells);
            console.log(
              `[MapFetcher] ${currentDataRowType} now has ${extractedRows[currentDataRowType].length} entries`,
            );
          }
        }

        console.log(
          `[MapFetcher] Extracted rows for table #${tableCount}:`,
          extractedRows,
        );

        const numMapsInTable = Math.min(
          extractedRows.image.length,
          extractedRows.name.length,
          extractedRows.difficulty.length || extractedRows.name.length,
        );
        console.log(
          `[MapFetcher] Number of maps to process in table #${tableCount}: ${numMapsInTable}`,
        );

        for (let i = 0; i < numMapsInTable; i++) {
          console.log(
            `[MapFetcher] Processing map ${i} in table ${tableCount}`,
          );
          const map = {};
          map.tableNumber = tableCount;

          const imageCell = extractedRows.image[i];
          console.log(`[MapFetcher] Processing image cell: "${imageCell}"`);
          const imageMatch = imageCell.match(/\[\[File:(.*?)\|/);
          if (imageMatch && imageMatch[1]) {
            map.imageFile = imageMatch[1];
            map.imageUrl = ImageLoader.convertFileToFandomUrl(map.imageFile);
            console.log(
              `[MapFetcher] Map ${i} image: ${map.imageFile}, URL: ${map.imageUrl}`,
            );
          } else {
            map.imageFile = "Unavailable.png";
            map.imageUrl = "./htmlassets/Unavailable.png";
            console.warn(
              `[MapFetcher] Map ${i} image not found for cell: "${imageCell}", using fallback.`,
            );
          }

          const nameCell = extractedRows.name[i];
          console.log(`[MapFetcher] Processing name cell: "${nameCell}"`);
          const nameMatch = nameCell.match(/\[\[(?:[^|]*\|)?(.*?)]]/);
          if (nameMatch && nameMatch[1]) {
            map.name = nameMatch[1];
            console.log(
              `[MapFetcher] Extracted Map Name: ${map.name} (Table: ${map.tableNumber})`,
            );
          } else {
            map.name = "Unknown Map";
            console.warn(
              `[MapFetcher] Map ${i} name not found for cell: "${nameCell}", using fallback.`,
            );
          }

          const difficultyCell = extractedRows.difficulty[i];
          if (difficultyCell) {
            console.log(
              `[MapFetcher] Processing difficulty cell: "${difficultyCell}"`,
            );
            const difficultyMatch = difficultyCell.match(
              /\{\{Colour?\|([^}|]+)\}\}/i,
            );
            if (difficultyMatch && difficultyMatch[1]) {
              map.difficulty = difficultyMatch[1];
              console.log(
                `[MapFetcher] Map ${i} difficulty: ${map.difficulty}`,
              );
            } else {
              map.difficulty = difficultyCell.trim();
              console.log(
                `[MapFetcher] Map ${i} difficulty (raw): ${map.difficulty}`,
              );
            }
          } else {
            map.difficulty = "Unknown";
            console.warn(
              `[MapFetcher] Map ${i} has no difficulty data, using fallback.`,
            );
          }

          const enemiesBetaCell = extractedRows.enemiesBeta[i];
          if (enemiesBetaCell) {
            map.enemiesBeta = enemiesBetaCell.trim();
            console.log(
              `[MapFetcher] Map ${i} enemiesBeta: ${map.enemiesBeta}`,
            );
          } else {
            map.enemiesBeta = "Unknown";
            console.warn(
              `[MapFetcher] Map ${i} has no enemiesBeta data, using fallback.`,
            );
          }

          console.log(`[MapFetcher] Completed map ${i}:`, map);
          maps.push(map);
        }
      }

      console.log(`[MapFetcher] Total tables found: ${tableCount}`);
      console.log(`[MapFetcher] Total maps extracted: ${maps.length}`);
      console.log(`[MapFetcher] All extracted maps:`, maps);

      return maps;
    } catch (error) {
      console.error("[MapFetcher] Error fetching or parsing map data:", error);
      console.error("[MapFetcher] Error stack:", error.stack);
      return [];
    }
  }

  parseWikiTableCells(row) {
    const content = row.replace(/^!\s*[^|!\n]*/, "");
    const cells = [];
    let currentCell = "";
    let bracketDepth = 0;
    let braceDepth = 0;
    let inBrackets = false;
    let inBraces = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === "[" && nextChar === "[") {
        inBrackets = true;
        bracketDepth++;
        currentCell += char;
      } else if (char === "]" && nextChar === "]" && inBrackets) {
        bracketDepth--;
        currentCell += char;
        if (bracketDepth === 0) {
          inBrackets = false;
        }
      } else if (char === "{" && nextChar === "{") {
        inBraces = true;
        braceDepth++;
        currentCell += char;
      } else if (char === "}" && nextChar === "}" && inBraces) {
        braceDepth--;
        currentCell += char;
        if (braceDepth === 0) {
          inBraces = false;
        }
      } else if ((char === "|" || char === "!") && !inBrackets && !inBraces) {
        if (currentCell.trim()) {
          cells.push(currentCell.trim());
        }
        currentCell = "";
      } else {
        currentCell += char;
      }
    }

    // Add the last cell
    // whole smuck is pretty complex imo
    if (currentCell.trim()) {
      cells.push(currentCell.trim());
    }

    return cells;
  }
}

export default MapFetcher;
