export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('{{AUDIO_PATH}}')) {
      const filename = url.pathname.replace('{{AUDIO_PATH}}', '');
      
      try {
        const object = await env.PODCAST_ASSETS.get(filename);
        
        if (object === null) {
          return new Response('Audio file not found', { status: 404 });
        }
        
        const headers = new Headers();
        headers.set('Content-Type', 'audio/mpeg');
        headers.set('Cache-Control', 'public, max-age=31536000');
        
        if (object.size) {
          headers.set('Content-Length', object.size.toString());
        }
        
        return new Response(object.body, { headers });
        
      } catch (error) {
        console.error('R2 fetch error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
    
    return fetch(request);
  }
};