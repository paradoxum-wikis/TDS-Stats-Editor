import ImageLoader from "../../components/ImageLoader.js";

class LoadoutFetcher {
  constructor() {
    this.wikiApiUrl = "https://api.tds-editor.com/randomizer?type=towers";
  }

  async fetchTowers() {
    try {
      console.log(
        "[LoadoutFetcher] Fetching raw tower data from:",
        this.wikiApiUrl,
      );
      const response = await fetch(this.wikiApiUrl, {
        method: "GET",
        headers: {
          Origin: window.location.origin,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (!response.ok) {
        console.error(
          "[LoadoutFetcher] HTTP error! status:",
          response.status,
          response.statusText,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawContent = await response.text();
      console.log(
        "[LoadoutFetcher] Raw content received (truncated to 1337 chars):",
        rawContent.substring(0, 1337),
      );
      console.log("[LoadoutFetcher] Full content length:", rawContent.length);

      const towers = [];
      const tableRegex = /\{\|\s*class="light-table[^]*?\|\}/gs;
      console.log(
        "[LoadoutFetcher] Starting table search with regex:",
        tableRegex,
      );
      let tableMatch;
      let tableCount = 0;

      while ((tableMatch = tableRegex.exec(rawContent)) !== null) {
        tableCount++;
        console.log(`[LoadoutFetcher] Found table #${tableCount}`);
        console.log(
          `[LoadoutFetcher] Table content preview:`,
          tableMatch[0].substring(0, 500),
        );

        const tableContent = tableMatch[0];
        const rows = tableContent
          .split("|-")
          .map((row) => row.trim())
          .filter((row) => row.length > 0);
        console.log(
          `[LoadoutFetcher] Table #${tableCount} has ${rows.length} rows.`,
        );
        console.log(
          `[LoadoutFetcher] First 10 rows of table #${tableCount}:`,
          rows.slice(0, 10),
        );

        const imageAndLinkCells = [];

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
            `[LoadoutFetcher] Processing row ${rowIndex}: "${normalizedRow}"`,
          );

          const headerMatch = normalizedRow.match(/^!\s*([^|!\n]*)/);
          const normalizedHeader = (headerMatch?.[1] || "")
            .trim()
            .toLowerCase();
          const isImageRow =
            !normalizedHeader.includes("tower") &&
            !normalizedHeader.includes("unlock method") &&
            !normalizedHeader.includes("level required") &&
            !normalizedHeader.includes("unlock cost");

          if (!isImageRow) {
            console.log(
              `[LoadoutFetcher] Skipping non-image row header: "${normalizedHeader}"`,
            );
            continue;
          }

          console.log(
            `[LoadoutFetcher] Found image row data row: ${normalizedRow}`,
          );
          const cells = this.parseWikiTableCells(normalizedRow);
          for (const cellContent of cells) {
            if (cellContent) {
              imageAndLinkCells.push(cellContent);
            }
          }
          console.log(
            `[LoadoutFetcher] imageAndLinkCells now has ${imageAndLinkCells.length} entries`,
          );
        }

        console.log(
          `[LoadoutFetcher] Total imageAndLinkCells for table #${tableCount}:`,
          imageAndLinkCells.length,
        );
        console.log(
          `[LoadoutFetcher] imageAndLinkCells content:`,
          imageAndLinkCells,
        );

        for (let i = 0; i < imageAndLinkCells.length; i++) {
          const cellContent = imageAndLinkCells[i];
          console.log(
            `[LoadoutFetcher] Processing cell ${i}: "${cellContent}"`,
          );

          const tower = {};
          const match = cellContent.match(/\[\[File:(.*?)\|.*?link=(.*?)]]/);
          console.log(`[LoadoutFetcher] Regex match result:`, match);

          if (match && match[1] && match[2]) {
            tower.imageFile = match[1];
            tower.imageUrl = ImageLoader.convertFileToFandomUrl(
              tower.imageFile,
            );
            tower.name = match[2];
            tower.isExclusive = tableCount === 6;
            tower.isGolden = tableCount === 5;
            tower.isRemoved = tableCount === 7;
            console.log(`[LoadoutFetcher] Successfully parsed tower:`, tower);
            towers.push(tower);
          } else {
            console.warn(
              "[LoadoutFetcher] Tower image/link not found for cell:",
              cellContent,
            );
          }
        }
      }

      console.log(`[LoadoutFetcher] Total tables found: ${tableCount}`);
      console.log(`[LoadoutFetcher] Total towers extracted: ${towers.length}`);
      console.log(`[LoadoutFetcher] All extracted towers:`, towers);

      if (towers.length === 0) {
        console.error(
          `[LoadoutFetcher] No towers were extracted! Raw content sample:`,
          rawContent.substring(0, 2000),
        );
      }

      return towers;
    } catch (error) {
      console.error(
        "[LoadoutFetcher] Error fetching or parsing tower data:",
        error,
      );
      console.error("[LoadoutFetcher] Error stack:", error.stack);
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
      } else if (
        (char === "|" || char === "!") &&
        !inBrackets &&
        !inBraces
      ) {
        if (currentCell.trim()) {
          cells.push(currentCell.trim());
        }
        currentCell = "";
      } else {
        currentCell += char;
      }
    }

    if (currentCell.trim()) {
      cells.push(currentCell.trim());
    }

    return cells;
  }
}

export default LoadoutFetcher;
