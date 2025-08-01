export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle RSS feed requests
    if (url.pathname === '{{RSS_PATH}}') {
      return handleRSSFeed(request);
    }
    
    // Handle audio file requests
    if (url.pathname.startsWith("{{AUDIO_PATH}}")) {
      const filename = url.pathname.replace("{{AUDIO_PATH}}", "");

      try {
        const object = await env.PODCAST_ASSETS.get(filename);

        if (object === null) {
          return new Response("File not found", { status: 404 });
        }

        const headers = new Headers();
        headers.set("Content-Type", "audio/mpeg");
        headers.set("Cache-Control", "public, max-age=31536000");
        headers.set('Accept-Ranges', 'bytes');
        
        const range = request.headers.get('Range');
        
        if (range) {
          const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : object.size - 1;
            const length = end - start + 1;
            
            const rangeOptions = {
              range: { offset: start, length: length }
            };
            const rangeObject = await env.PODCAST_ASSETS.get(filename, rangeOptions);
            
            if (rangeObject) {
              headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
              headers.set('Content-Length', length.toString());
              
              return new Response(rangeObject.body, {
                status: 206,
                headers: headers
              });
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

    return fetch(request);
  },
};

async function handleRSSFeed(request) {
  try {
    // Parse the last modified date
    const lastModified = new Date('{{RSS_LAST_MODIFIED}}T00:00:00Z');
    const lastModifiedString = lastModified.toUTCString();
    
    // Check if client has cached version
    const ifModifiedSince = request.headers.get('If-Modified-Since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      if (clientDate >= lastModified) {
        return new Response(null, { 
          status: 304,
          headers: {
            'Last-Modified': lastModifiedString,
            'Cache-Control': 'public, max-age=3600'
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
    headers.set('Content-Length', new TextEncoder().encode(rssContent).length.toString());
    headers.set('Last-Modified', lastModifiedString);
    headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    headers.set('Content-Type', 'application/rss+xml; charset=utf-8');
    
    return new Response(rssContent, {
      status: rssResponse.status,
      headers: headers
    });
    
  } catch (error) {
    console.error('RSS feed error:', error);
    return new Response('RSS feed error', { status: 500 });
  }
}
