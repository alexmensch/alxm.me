import * as sass from "sass";
import path from "node:path";
import "dotenv/config";

import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import {
  InputPathToUrlTransformPlugin,
  RenderPlugin,
  HtmlBasePlugin,
  IdAttributePlugin
} from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import directoryOutputPlugin from "@11ty/eleventy-plugin-directory-output";
import purgeCssPlugin from "eleventy-plugin-purgecss";
import kvCollectionsPlugin from "eleventy-plugin-cloudflare-kv";
import { LoremIpsum } from "lorem-ipsum";
import sharedConfig, { includesDir, makeHelpers } from "@alxm/eleventy-config";
import permalinkTracker from "./eleventy-plugins/permalink-tracker.js";
import audioValidationPlugin from "./eleventy-plugins/audio-validation.js";
import { ogImagePlugin } from "@alxm/og-image/plugin";

import siteConfig from "./src/_data/site.js";
import { ogTheme } from "./src/_build/og-theme.js";
import podcast from "./src/_data/podcast.js";

const helpers = makeHelpers();

export default async function (eleventyConfig) {
  /* 11ty Plugins */
  /****************/
  // Shared markdown library, common filters/shortcodes, and the feedmail
  // subscribe-form partial (resolved via the Liquid root added below).
  eleventyConfig.addPlugin(sharedConfig, {
    domain: siteConfig.domain,
    loremIpsum: LoremIpsum,
    pageTheme: true
  });

  // Custom Cloudflare KV -> Collections fetch
  eleventyConfig.addPlugin(kvCollectionsPlugin, {
    accountId: "CLOUDFLARE_ACCOUNT_ID",
    namespaceId: "CLOUDFLARE_KV_NS_ID",
    cloudflareAPIToken: "CLOUDFLARE_API_TOKEN",
    metadata: {
      permalink(metadata, key, collection) {
        if (!metadata.permalink) {
          if (!metadata.title || !metadata.date) {
            throw new Error(
              `Unable to generate permalink for item with key: ${key}`
            );
          }
          return `/${collection}/${helpers.permalinkToPath(metadata.title, metadata.date)}`;
        }
        return metadata.permalink;
      }
    },
    quiet: false
  });

  // Audio metadata validation
  eleventyConfig.addPlugin(audioValidationPlugin);

  // Template rendering shortcode
  eleventyConfig.addPlugin(RenderPlugin);

  // HTML base URL rewriting (used in RSS feed for absolute URLs)
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Add the permalink tracker plugin
  eleventyConfig.addPlugin(permalinkTracker);

  // Image transforms
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: "html",
    formats: ["webp", "auto"],
    widths: [320, 640, 960, 1280, "auto"],
    urlPath: "/assets/images/",
    defaultAttributes: {
      decoding: "async",
      loading: "lazy",
      sizes: "(min-width: 1280px) 70rem, calc(100vw - 3rem)"
    }
  });

  // Syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight);

  // Add anchors to headings
  eleventyConfig.addPlugin(IdAttributePlugin, {
    // Use standard slugify filter
    slugify: helpers.toSlug
  });

  eleventyConfig.addPlugin(purgeCssPlugin, {
    config: {
      content: ["./_site/**/*.html"],
      css: ["./_site/assets/css/*.css"],
      fontFace: true,
      rejected: false
    },
    quiet: true
  });

  ogImagePlugin(eleventyConfig, {
    domain: siteConfig.domain,
    siteName: siteConfig.siteName,
    generatedDir: siteConfig.og.generatedDir,
    defaultImage: siteConfig.og.defaultImage,
    theme: ogTheme
  });

  // Directory output on build
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addPlugin(directoryOutputPlugin, {
    warningFileSize: 250 * 1000
  });

  /* Passthrough assets */
  /**********************/
  // Large files excluded - served from R2 in production
  // To test locally: cp -r src/assets/files src/assets/podcast/audio _site/assets/
  eleventyConfig.addPassthroughCopy({
    "src/assets/css": "assets/css",
    "src/assets/images": "assets/images",
    "src/assets/podcast/images": "assets/podcast/images",
    "src/favicon.svg": "favicon.svg",
    "src/favicon.ico": "favicon.ico",
    "src/favicon-192.png": "favicon-192.png",
    "src/favicon-512.png": "favicon-512.png",
    "src/apple-touch-icon.png": "apple-touch-icon.png",
    "src/site.webmanifest": "site.webmanifest",
    "src/404.html": "404.html",
    ".assetsignore": ".assetsignore"
  });

  /* Collections config */
  /**********************/
  // Collections are defined in src/_data/site.js in the "nav" object
  const postCollections = new Set();
  siteConfig.nav.forEach((item) => {
    if (item.collection) {
      postCollections.add(item.url.replace(/\//g, ""));
    }
  });

  postCollections.forEach((collectionName) => {
    eleventyConfig.addCollection(`${collectionName}`, (collectionApi) => {
      return collectionApi.getFilteredByGlob(`src/${collectionName}/**/*.md`);
    });
  });

  /* Liquid include resolution */
  /*****************************/
  // Add the @alxm/eleventy-config includes dir alongside the site's own so
  // `{% render "partials/subscribe-form" %}` resolves the package-owned partial.
  eleventyConfig.setLiquidOptions({
    root: ["src/_includes", "src", includesDir]
  });

  /* Sass support as a template format */
  /*************************************/

  eleventyConfig.addTemplateFormats("scss");

  // Creates the extension for use
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css", // optional, default: "html"

    // Customizing the permalink for the output file
    compileOptions: {
      permalink(inputContent, inputPath) {
        const parsed = path.parse(inputPath);

        const outputDir = "/assets/css";
        const outputFilePath = path.join(outputDir, `${parsed.name}.css`);

        // Return the new permalink
        return outputFilePath;
      },

      // Default is true: Eleventy caches the compile() result for the
      // lifetime of the process, keyed off the template's own content.
      // Since partials (_*.scss) aren't part of root.scss's content, a
      // partial edit wouldn't invalidate the cache and the dev server
      // would keep serving stale CSS until restart. Disable to force
      // a fresh sass.compileString() on every rebuild.
      cache: false
    },

    // `compile` is called once per .scss file in the input directory
    async compile(inputContent, inputPath) {
      const parsed = path.parse(inputPath);
      // Adhere to convention of not outputting Sass underscore files
      if (parsed.name.startsWith("_")) {
        return () => "";
      }

      const result = sass.compileString(inputContent, {
        loadPaths: [parsed.dir || "."],
        // Resolves pkg: URLs (@alxm/cube-scss and its utopia-core-scss dep)
        // through the pnpm workspace symlinks.
        importers: [new sass.NodePackageImporter(parsed.dir || ".")]
      });

      // This is the render function, `data` is the full data cascade
      return async (_data) => {
        return result.css;
      };
    }
  });

  // Prevent _index.scss files from being rendered by Eleventy
  eleventyConfig.ignores.add("src/assets/scss/**/_*.scss");

  // Ignored partials aren't part of root.scss's dependency graph, so an
  // explicit watch target is needed for `--serve` to rebuild root.css when
  // a partial changes. Without this, only edits to root.scss itself
  // trigger a Sass recompile.
  eleventyConfig.addWatchTarget("src/assets/scss/");

  /* Site-specific filters */
  /*************************/
  // Common filters (getLinkActiveState, loremIpsum, markdownify, dateToRfc3339,
  // getNewestCollectionItemDate, markdownToHTML, escapeHTML, jsonEscape,
  // getPageTheme, hasAnyTag) and the articleImage / blockQuote shortcodes are
  // registered by the @alxm/eleventy-config plugin above.

  // Renders Markdown input to CDATA-enclosed HTML
  // Example: {{ markdown_content | markdownToCDATA }}
  eleventyConfig.addFilter("markdownToCDATA", podcast.markdownToCDATA);

  return {
    // Set directories to watch
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    // Define other options like pathPrefix
    templateFormats: ["liquid", "md"],
    htmlTemplateEngine: "liquid"
  };
}
