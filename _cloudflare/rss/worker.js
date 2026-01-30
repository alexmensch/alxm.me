export default {
  async fetch(request, env) {
    try {
      // Parse the last modified date
      const lastModified = new Date(`${env.RSS_LAST_MODIFIED}T00:00:00Z`);
      const lastModifiedString = lastModified.toUTCString();

      // Check if client has cached version
      const ifModifiedSince = request.headers.get("If-Modified-Since");
      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (clientDate >= lastModified) {
          return new Response(null, {
            status: 304,
            headers: {
              "Last-Modified": lastModifiedString,
              "Cache-Control": "public, max-age=3600"
            }
          });
        }
      }

      // Fetch the RSS feed from Pages
      const rssResponse = await fetch(request);

      if (!rssResponse.ok) {
        return rssResponse;
      }

      // Get the response body
      const rssContent = await rssResponse.text();

      // Create new response with proper headers
      const headers = new Headers(rssResponse.headers);
      headers.set(
        "Content-Length",
        new TextEncoder().encode(rssContent).length.toString()
      );
      headers.set("Last-Modified", lastModifiedString);
      headers.set("Cache-Control", "public, max-age=3600"); // 1 hour cache
      headers.set("Content-Type", "application/rss+xml; charset=utf-8");

      return new Response(rssContent.trim(), {
        status: rssResponse.status,
        headers
      });
    } catch (error) {
      console.error("RSS feed error:", error);
      return new Response("RSS feed error", { status: 500 });
    }
  }
};
