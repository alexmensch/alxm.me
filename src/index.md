---
layout: "layouts/home"
title: Home
intro:
  main: Fluid, responsive styling on any device without nasty breakpoints
  summary: |
    Cubetopia is designed to be visually appealing and readable with any content, on any device, out of the box. Both type and space scale automatically, and the layout of every component adjusts naturally to the available space. This showcase site demonstrates the styling and the layouts that are available. You're encouraged to preview it on different devices to get a feel for how the fluid type and space adjust automatically. Check out the project on [Github](https://github.com/alexmensch/11ty-cubetopia).
highlights:
  heading: Perfect for content-driven sites
  summary: |
    Cubetopia is intended for personal, content-driven websites where writing is the primary medium. This encompasses a huge proportion of the content that exists on the web, but it's surprisingly difficult to find a starting template that is easy to deploy, looks good with minimal customization, works on any device or viewport size, and comes with easily reusable CSS classes that can be used to customize and extend the site in the future. The web was originally designed for the exchange of written content and ideas, and Cubetopia is a return to that simplicity and purpose. Deliberately easy to read and fast to load, nothing but HTML and CSS are used, making the site lightweight and simple to host as a static site.
  list:
    - title: Opinionated defaults
      body: The default styling is opinionated but grounded in timeless design principles. Branding and styling can be easily changed via configuration, and the built in layout blocks can be combined in ways unique to your needs.
    - title: Looks great on any device
      body: It's impossible to know what size device or viewport a user will view your site in, which is why Cubetopia is built so that you never have to worry about it. Every layout block, space, and even the typograhy fluidly resizes and reconfigures gracefully to ensure that the site is always readable and stylish.
    - title: Focus on your content
      body: Because all the hard work of building the layouts is done for you, all you need to do is focus on adding content to the site. User-friendly, readable design and typography are important to keep visitors engaged, but do not need to be reinvented every time.
features:
  heading: Packed full of functionality
  summary: |
    I'm leaning heavily on [Andy Bell](https://x.com/belldotbz)'s [CUBE CSS](https://cube.fyi) principles and making use of [James Gilyead](https://x.com/j98) and [Trys Mudford](https://x.com/trysmudford)'s [Utopia](https://utopia.fyi) fluid type and space scaling. Combined, their approaches to web design make for a delightful experience for both developers and end users alike.
  list:
    - title: Semantic HTML5
      body: Standard semantics with accessibility considerations
    - title: Syntax highlighting
      body: Uses [PrismJS](https://prismjs.com/), widely used across the web
    - title: Locally served fonts
      body: Google Fonts are fetched and cached automatically at build time
    - title: Fluid type and space scaling
      body: Automatic scaling based on viewport width, eliminating @media breakpoints
    - title: CUBE CSS
      body: Uses Andy Bell's CUBE paradigm for a lightweight and reusable CSS implementation
    - title: Removes unused CSS
      body: Build-time removal of unused CSS using [PurgeCSS](https://purgecss.com)
    - title: Automatic image processing
      body: Image conversion at build-time into WebP and device-appropriate dimensions
    - title: RSS Feed
      body: Posts are included in an Atom feed by default
    - title: Config file driven
      body: Collection creation and site nav is determined via config file
    - title: Markdown footnotes
      body: Footnotes are automatically generated based on Markdown tagging
    - title: Sass template format
      body: Processing of Sass is performed automatically by Eleventy
---
