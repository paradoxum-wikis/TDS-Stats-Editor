// import 'dotenv/config';
import { execSync } from "child_process";

const WIKI_BASE = process.env.WIKI_BASE || "https://tds.fandom.com";
const USER_AGENT = process.env.USER_AGENT || "DarkGabonnie/1.048596";
const FANDOM_SESSION_VALUE = process.env.FANDOM_SESSION;
const COOKIE_HEADER = `fandom_session=${FANDOM_SESSION_VALUE}`;

console.log("--- Initializing Script ---");
if (!FANDOM_SESSION_VALUE) {
  console.error(
    "CRITICAL: FANDOM_SESSION environment variable is not set or empty!",
  );
  process.exit(1);
}
console.log(`FANDOM_SESSION loaded. Length: ${FANDOM_SESSION_VALUE.length}`);
console.log("--------------------------");

function extractUsernames(towerEntries) {
  const usernames = new Set();

  towerEntries.forEach((entry) => {
    if (entry.includes("/")) {
      const username = entry.split("/")[0];
      usernames.add(username);
    }
  });

  return Array.from(usernames);
}

function detectChanges() {
  try {
    const diff = execSync("git diff HEAD~1 HEAD -- db/ApprovedList.js", {
      encoding: "utf8",
    });

    if (!diff) {
      console.log("No changes detected in ApprovedList.js");
      return { newEntries: [] };
    }

    const addedLines = diff
      .split("\n")
      .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
      .map((line) => line.substring(1).trim())
      .filter((line) => line.includes("/") && line.includes('"'));

    const newEntries = new Set();

    addedLines.forEach((line) => {
      const match = line.match(/"([^"]+\/[^"]+)"/);
      if (match) {
        newEntries.add(match[1]);
      }
    });

    return { newEntries: Array.from(newEntries) };
  } catch (error) {
    console.error("Error detecting changes:", error.message);
    return { newEntries: [] };
  }
}

async function getCsrfToken() {
  console.log("--- Fetching CSRF token ---");
  const headers = {
    "User-Agent": USER_AGENT,
    Cookie: COOKIE_HEADER,
  };

  console.log("Token request headers:", JSON.stringify(headers, null, 2));

  const res = await fetch(
    `${WIKI_BASE}/api.php?action=query&meta=tokens&type=csrf&format=json`,
    {
      headers: headers,
    },
  );

  console.log(`Token response status: ${res.status} ${res.statusText}`);
  const responseText = await res.text();

  if (!res.ok) {
    console.error("Raw token response:", responseText);
    throw new Error(`Failed to get token: ${res.statusText}`);
  }

  const data = JSON.parse(responseText);

  if (!data.query || !data.query.tokens || !data.query.tokens.csrftoken) {
    console.error(
      "Invalid token response body:",
      JSON.stringify(data, null, 2),
    );
    throw new Error("Invalid token response");
  }

  const token = data.query.tokens.csrftoken;
  console.log(`Successfully fetched CSRF token: ${token}`);
  console.log("--------------------------");
  return token;
}

async function getUserId(username) {
  console.log(`Fetching user ID for username: "${username}"`);
  const res = await fetch(
    `${WIKI_BASE}/api.php?action=query&list=users&ususers=${encodeURIComponent(username)}&format=json`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: COOKIE_HEADER,
      },
    },
  );

  const data = await res.json();

  if (
    data.query &&
    data.query.users &&
    data.query.users[0] &&
    data.query.users[0].userid
  ) {
    const userId = data.query.users[0].userid.toString();
    console.log(`Found user ID: ${userId} for username: "${username}"`);
    return userId;
  }

  console.error(
    `User not found response for "${username}":`,
    JSON.stringify(data, null, 2),
  );
  throw new Error(`User ${username} not found`);
}

async function sendMessage(
  token,
  userId,
  title,
  username,
  pluralTowers,
  towerList,
  towerCount,
) {
  // Build rawContent
  const rawTowerList = towerList.join("\n");
  const rawContent = `Hello, ${username}!\nGreat news! Your ${pluralTowers} been approved and added to the TDS Statistics Editor database:\n${rawTowerList}\nYour ${towerCount > 1 ? "towers are" : "tower is"} now verified and will no longer be hidden by the "unverified" tag. You can view ${towerCount > 1 ? "them" : "it"} on the database at: https://tds-editor.com/db/\nThank you for your contribution to the TDS community!\n-----------------------------------------------------------------------------------------------------------\n This is an automated message from the TDS Statistics Editor system.`;

  // Build jsonModel
  const dbUrl = "https://tds-editor.com/db/";
  const jsonContent = [];

  jsonContent.push({
    type: "paragraph",
    content: [{ type: "text", text: `Hello, ${username}!` }],
  });
  jsonContent.push({ type: "paragraph" });
  jsonContent.push({
    type: "paragraph",
    content: [
      {
        type: "text",
        text: `Great news! Your ${pluralTowers} been approved and added to the TDS Statistics Editor database:`,
      },
    ],
  });

  const bulletListItems = towerList.map((towerName) => ({
    type: "listItem",
    content: [
      { type: "paragraph", content: [{ type: "text", text: towerName }] },
    ],
  }));
  jsonContent.push({
    type: "bulletList",
    attrs: { createdWith: "*+" },
    content: bulletListItems,
  });

  const verifiedText = `Your ${towerCount > 1 ? "towers are" : "tower is"} now verified and will no longer be hidden by the "unverified" tag. You can view ${towerCount > 1 ? "them" : "it"} on the database at: `;
  jsonContent.push({
    type: "paragraph",
    content: [
      { type: "text", text: verifiedText },
      {
        type: "text",
        marks: [{ type: "link", attrs: { href: dbUrl, title: null } }],
        text: dbUrl,
      },
    ],
  });

  jsonContent.push({
    type: "openGraph",
    attrs: { id: 0, url: dbUrl, wasAddedWithInlineLink: true },
  });
  jsonContent.push({
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "Thank you for your contribution to the TDS community!",
      },
    ],
  });
  jsonContent.push({
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "-----------------------------------------------------------------------------------------------------------",
      },
    ],
  });
  jsonContent.push({
    type: "paragraph",
    content: [
      {
        type: "text",
        marks: [{ type: "em" }],
        text: " This is an automated message from the TDS Statistics Editor system.",
      },
    ],
  });

  const jsonModel = JSON.stringify({ type: "doc", content: jsonContent });

  // Build attachments
  const attachments = JSON.stringify({
    contentImages: [],
    openGraphs: [
      {
        imageHeight: 630,
        imageUrl:
          "https://static.wikia.nocookie.net/3c87bdc9-09d5-4306-ae9a-4281214bc071",
        imageWidth: 1200,
        siteName: "TDS+Database+Browser",
        title: "TDS+Database+Browser",
        description:
          "Browse+and+share+your+custom+tower+ideas+for+the+Roblox+game+Tower+Defense+Simulator!",
        type: "website",
        url: "https://tds-editor.com/db",
        originalUrl: "https://tds-editor.com/db/",
      },
    ],
    atMentions: [],
  });

  // Create Form Data
  const form = new FormData();
  form.append("token", token);
  form.append("wallOwnerId", userId);
  form.append("title", title);
  form.append("rawContent", rawContent);
  form.append("jsonModel", jsonModel);
  form.append("attachments", attachments);

  // Send Request
  const res = await fetch(
    `${WIKI_BASE}/wikia.php?controller=Fandom\\MessageWall\\MessageWall&method=createThread&format=json`,
    {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: COOKIE_HEADER,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: form,
    },
  );

  const responseText = await res.text();
  if (!res.ok) {
    console.error("Raw API response:", responseText);
    throw new Error(`API request failed with status ${res.status}`);
  }

  try {
    const json = JSON.parse(responseText);
    return json;
  } catch (parseError) {
    console.error("Raw API response (could not parse as JSON):", responseText);
    throw new Error(`Failed to parse response: ${parseError.message}`);
  }
}

async function main() {
  try {
    console.log("Checking for changes in ApprovedList.js...");

    const { newEntries } = detectChanges();

    if (newEntries.length === 0) {
      console.log("No new tower entries found.");
      return;
    }

    console.log(`Found ${newEntries.length} new tower entries:`, newEntries);
    let usersToNotify = extractUsernames(newEntries);
    console.log("Initial users to notify:", usersToNotify);

    console.log("Getting CSRF token...");
    const token = await getCsrfToken();

    let failedUsers = [];
    const MAX_RETRIES = 5;
    let retryCount = 0;

    while (usersToNotify.length > 0 && retryCount <= MAX_RETRIES) {
      if (retryCount > 0) {
        console.log(
          `\n--- RETRY ATTEMPT ${retryCount}/${MAX_RETRIES} for ${usersToNotify.length} failed users ---`,
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }

      failedUsers = [];

      for (const username of usersToNotify) {
        try {
          console.log(`Processing user: ${username}`);
          const userTowers = newEntries.filter((entry) =>
            entry.startsWith(username + "/"),
          );

          if (userTowers.length === 0) continue;

          const userId = await getUserId(username);
          console.log(`User ID for ${username}: ${userId}`);

          const towerList = userTowers.map((tower) => tower.split("/")[1]);
          const pluralTowers =
            userTowers.length > 1 ? "towers have" : "tower has";

          const messageTitle = `🎉 Your ${userTowers.length > 1 ? "towers" : "tower"} ${userTowers.length > 1 ? "have" : "has"} been approved!`;

          console.log(`\nConstructing message for ${username}:`);
          console.log("====================================");
          console.log(`Towers: ${towerList.join(", ")}`);
          console.log("====================================");

          console.log(`Sending message to ${username}...`);
          await sendMessage(
            token,
            userId,
            messageTitle,
            username,
            pluralTowers,
            towerList,
            userTowers.length,
          );
          console.log(`✅ Message sent successfully to ${username}`);
        } catch (error) {
          console.error(`❌ Failed to notify ${username}:`, error.message);
          failedUsers.push(username);
        } finally {
          console.log("Waiting 5 seconds before processing next user...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      usersToNotify = failedUsers;
      retryCount++;
    }

    if (failedUsers.length > 0) {
      console.error(
        `\n❌ Notification process completed, but ${failedUsers.length} users could not be notified after ${MAX_RETRIES} retries:`,
        failedUsers,
      );
    } else {
      console.log("\n✅ Notification process completed successfully!");
    }
  } catch (error) {
    console.error("Error in main process:", error.message);
    process.exit(1);
  }
}

main();
