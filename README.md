### Licensing & Usage

This respository contains a mix of creative media and software, each of which are licensed under separate terms. Please see the appropriate [LICENSE](LICENSE) and [COPYRIGHT](COPYRIGHT) files for full details.

For additional inquiries around licensing, reproduction, or distribution, you may contact me via my website: [https://alxm.me](https://alxm.me/contact)

### Eleventy static site

This site is built using [Eleventy](https://www.11ty.dev), a static site generator, using Node.js, Markdown, and Liquid and Nunjucks templates. The site is hosted on [Cloudflare](https://www.cloudflare.com) using Cloudflare [Pages](https://pages.cloudflare.com) and [R2](https://www.cloudflare.com/developer-platform/products/r2/) for larger assets.

Site design follows the principles laid out by [Andy Bell](https://bell.bz/about/), which he calls [CUBE CSS](https://cube.fyi). The main principle is that you design your site layout in a single way that works for any device and viewport size. It works well, and I'm a huge fan. I also use a fluidly scalable type approach called [Utopia](https://utopia.fyi), which similarly results in lovely type sizing for any display configuration or size.

The site implements an RSS feed for my writing and automatically generates Open Graph preview images. Each use a corresponding plugin.

An Apple Podcasts-compliant RSS feed is also automatically generated based on a collection of episode details and metadata.

### Cloudflare hosting

Cloudflare provides free and relatively easy to use hosting for static sites. The site is currently hosted on [Pages](https://pages.cloudflare.com), which automatically pulls from this Github repository. Because some of the assets on my site are larger than 20MB, those assets are automatically deployed to [R2](https://www.cloudflare.com/developer-platform/products/r2/) as part of a simple CI/CD configuration. A simple [Worker](https://workers.cloudflare.com) route is used to transparently redirect those requests to R2, avoiding any browser redirects to the R2 bucket.
