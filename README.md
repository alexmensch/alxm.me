## Prerequisities

Only [Node.js](https://nodejs.org/en/download) is required, and everything is built around [11ty](https://www.11ty.dev), a static site generator. [Sass](https://sass-lang.com), HTML, and [Liquid](https://shopify.github.io/liquid/) templates are all that are used for development.

## Environment setup

After cloning the repository and installing Node, run `npm install` to download and install all dependencies.

- `npm run build` builds the site on demand
- For local development, `npm run 11ty:watch` will watch for any changes to files and immediatley rebuild the site
- `npm run sass:watch` will do the equivalent to generate CSS
