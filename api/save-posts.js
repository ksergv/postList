const DEFAULT_FILE_PATH = "posts.json";

function sendJson(response, statusCode, payload, origin) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function getAllowedOrigin(request) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  const requestOrigin = request.headers.origin || "";

  if (allowedOrigin === "*") {
    return requestOrigin || "*";
  }

  return allowedOrigin.split(",").map((origin) => origin.trim()).includes(requestOrigin)
    ? requestOrigin
    : allowedOrigin.split(",")[0].trim();
}

async function readRequestJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function githubRequest(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "postlist-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || `GitHub API error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

module.exports = async function handler(request, response) {
  const origin = getAllowedOrigin(request);

  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true }, origin);
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" }, origin);
    return;
  }

  if (!process.env.ADMIN_API_SECRET || request.headers["x-admin-secret"] !== process.env.ADMIN_API_SECRET) {
    sendJson(response, 401, { error: "Unauthorized" }, origin);
    return;
  }

  const requiredEnv = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);

  if (missingEnv.length) {
    sendJson(response, 500, { error: `Missing env: ${missingEnv.join(", ")}` }, origin);
    return;
  }

  try {
    const payload = await readRequestJson(request);
    const posts = Array.isArray(payload.posts) ? payload.posts : null;

    if (!posts) {
      sendJson(response, 400, { error: "Payload must contain posts array" }, origin);
      return;
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const filePath = process.env.GITHUB_FILE_PATH || DEFAULT_FILE_PATH;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const currentFile = await githubRequest(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      method: "GET",
    });
    const json = `${JSON.stringify({ posts }, null, 2)}\n`;

    const result = await githubRequest(apiUrl, {
      method: "PUT",
      body: JSON.stringify({
        branch,
        content: Buffer.from(json, "utf8").toString("base64"),
        message: `Update ${filePath} from admin`,
        sha: currentFile.sha,
      }),
    });

    sendJson(response, 200, {
      ok: true,
      commit: result.commit && result.commit.html_url,
      path: filePath,
    }, origin);
  } catch (error) {
    sendJson(response, 500, { error: error.message }, origin);
  }
};
