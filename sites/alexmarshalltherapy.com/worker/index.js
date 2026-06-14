export const MIME_TYPES = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".zip": "application/zip",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript"
};

export function getContentType(pathname) {
  const ext = pathname.slice(pathname.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export async function handleR2Request(request, env, url) {
  const key = url.pathname.slice(1);

  try {
    const object = await env.R2_BUCKET.get(key);

    if (object === null) {
      return new Response("File not found", { status: 404 });
    }

    const contentType = getContentType(url.pathname);
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000");

    // Support range requests for streaming media
    if (contentType.startsWith("audio/") || contentType.startsWith("video/")) {
      headers.set("Accept-Ranges", "bytes");

      const range = request.headers.get("Range");

      if (range) {
        const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : object.size - 1;
          const length = end - start + 1;

          const rangeOptions = {
            range: { offset: start, length }
          };
          const rangeObject = await env.R2_BUCKET.get(key, rangeOptions);

          if (rangeObject) {
            headers.set(
              "Content-Range",
              `bytes ${start}-${end}/${object.size}`
            );
            headers.set("Content-Length", length.toString());

            return new Response(rangeObject.body, {
              status: 206,
              headers
            });
          }
        }
      }
    }

    if (object.size) {
      headers.set("Content-Length", object.size.toString());
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("R2 fetch error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle R2 files
    const r2Paths = JSON.parse(env.R2_PATHS);
    const matchedR2Path = r2Paths.find((path) => url.pathname.startsWith(path));
    if (matchedR2Path) {
      return handleR2Request(request, env, url);
    }

    // Serve static assets
    const response = await env.ASSETS.fetch(request);

    // Add TDM-Reservation header to HTML responses (W3C TDM Protocol)
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      const headers = new Headers(response.headers);
      headers.set("TDM-Reservation", "1");
      return new Response(response.body, {
        status: response.status,
        headers
      });
    }

    return response;
  }
};
