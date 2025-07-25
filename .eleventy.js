import md from "markdown-it";
import mdFN from "markdown-it-footnote";
import mdIterator from "markdown-it-for-inline";
import mdSmartArrows from "markdown-it-smartarrows";
import * as sass from "sass";
import path from "node:path";
import { promises as fs } from "node:fs";

import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { InputPathToUrlTransformPlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import directoryOutputPlugin from "@11ty/eleventy-plugin-directory-output";
import { IdAttributePlugin } from "@11ty/eleventy";
import purgeCssPlugin from "eleventy-plugin-purgecss";
import EleventyPluginOgImage from "eleventy-plugin-og-image";

import helpers from "./src/_data/helpers.js";
import siteConfig from "./src/_data/site.js";
import openGraph from "./src/_data/opengraph.js";

export default async function (eleventyConfig) {
  /* 11ty Plugins */
  /****************/
  // Image transforms
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: "html",
    formats: ["webp", "auto"],
    widths: ["auto"],
    urlPath: "/assets/images/",
    // optional, attributes assigned on <img> override these values.
    defaultAttributes: {
      decoding: "async",
      fetchpriority: "high",
    },
  });

  // Syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight);

  // Add anchors to headings
  eleventyConfig.addPlugin(IdAttributePlugin, {
    // Use standard slugify filter
    slugify: helpers.toSlug,
  });

  eleventyConfig.addPlugin(purgeCssPlugin, {
    config: {
      content: ["./_site/**/*.html"],
      css: ["./_site/assets/css/*.css"],
      fontFace: true,
      rejected: false,
    },
    quiet: true,
  });

  // RSS / Atom feed
  // ** Implicitly builds from a Nunjucks template, so templateFormats must include "njk" **
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom", // or "rss", "json"
    outputPath: siteConfig.rss.outputPath,
    collection: {
      name: siteConfig.rss.collection, // iterate over `collections.posts`
      limit: 0, // 0 means no limit
    },
    metadata: {
      language: "en",
      title: `${siteConfig.siteName} | ${siteConfig.rss.title}`,
      subtitle: siteConfig.rss.subtitle,
      base: `https://${siteConfig.domain}`,
      author: {
        name: siteConfig.authorName,
        email: siteConfig.authorEmail, // Optional
      },
    },
  });

  eleventyConfig.addPlugin(EleventyPluginOgImage, {
    outputFileExtension: "webp",
    outputDir: "assets/images/og",
    previewMode: false,
    satoriOptions: {
      fonts: [
        {
          name: "Inter",
          data: await fs.readFile("./src/_build/fonts/Inter-Bold.ttf"),
          weight: 700,
          style: "normal",
        },
        {
          name: "Source Serif 4",
          data: await fs.readFile(
            "./src/_build/fonts/SourceSerif4-BoldItalic.ttf",
          ),
          weight: 700,
          style: "italic",
        },
      ],
    },
  });

  // Directory output on build
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addPlugin(directoryOutputPlugin, {
    warningFileSize: 250 * 1000,
  });

  /* Passthrough assets */
  /**********************/
  eleventyConfig.addPassthroughCopy({
    "src/assets/css": "assets/css",
    "src/assets/images": "assets/images",
    "src/assets/files": "assets/files",
    "src/assets/podcast": "assets/podcast",
    "src/404.html": "404.html",
    "src/_redirects": "_redirects",
  });

  /* Collections config */
  /**********************/
  // Collections are defined in src/_data/site.js in the "nav" object
  let postCollections = new Set();
  siteConfig.nav.forEach((item) => {
    if (item.collection) {
      postCollections.add(item.url.replace(/\//g, ""));
    }
  });

  postCollections.forEach((collectionName) => {
    eleventyConfig.addCollection(`${collectionName}`, function (collectionApi) {
      return collectionApi.getFilteredByGlob(`src/${collectionName}/*.md`);
    });

    eleventyConfig.addCollection(
      `${collectionName}-years`,
      function (collectionApi) {
        let yearMap = new Map();

        collectionApi
          .getFilteredByGlob(`src/${collectionName}/*.md`)
          .forEach((item) => {
            if ("date" in item.data) {
              let year = new Date(item.data.date).getFullYear();
              if (!yearMap.has(year)) {
                yearMap.set(year, new Set());
              }
              yearMap.get(year).add(item);
            }
          });

        return Array.from(yearMap, ([year, items]) => ({
          year,
          items: [...items],
        }));
      },
    );
  });

  /* Markdown Configuration */
  /**************************/
  let markdownLib = md({
    typographer: true,
    html: true,
  })
    // Footnotes
    .use(mdFN)
    .use(mdIterator, "href_blank", "link_open", (tokens, idx) => {
      const [attrName, href] = tokens[idx].attrs.find(
        (attr) => attr[0] === "href",
      );

      if (
        href &&
        !href.includes(siteConfig.domain) &&
        !href.startsWith("/") &&
        !href.startsWith("#")
      ) {
        tokens[idx].attrPush(["target", "_blank"]);
        tokens[idx].attrPush(["rel", "noopener"]);
      }
    });

  // Footnote HTML customization
  markdownLib.renderer.rules.footnote_block_open = () =>
    '<section class="[ footnotes ] [ flow ]">\n' +
    "<h2>Notes</h2>\n" +
    '<ol role="list">\n';

  // Override footnote indicator render to output a number without square brackets
  markdownLib.renderer.rules.footnote_caption = (tokens, idx) => {
    let n = Number(tokens[idx].meta.id + 1).toString();
    if (tokens[idx].meta.subId > 0) n += `:${tokens[idx].meta.subId}`;
    return `${n}`;
  };

  // Add role="list" attribute for accessibility and correct styling
  markdownLib.renderer.rules.bullet_list_open = (
    tokens,
    idx,
    options,
    env,
    self,
  ) => {
    tokens[idx].attrPush(["role", "list"]);
    return self.renderToken(tokens, idx, options);
  };

  // Add role="list" attribute for accessibility and correct styling
  markdownLib.renderer.rules.ordered_list_open = (
    tokens,
    idx,
    options,
    env,
    self,
  ) => {
    tokens[idx].attrPush(["role", "list"]);
    return self.renderToken(tokens, idx, options);
  };

  markdownLib.use(mdSmartArrows);

  // Set the Markdown library to use
  eleventyConfig.setLibrary("md", markdownLib);

  /* Sass support as a template format */
  /*************************************/

  eleventyConfig.addTemplateFormats("scss");

  // Creates the extension for use
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css", // optional, default: "html"

    // Customizing the permalink for the output file
    compileOptions: {
      permalink: function (inputContent, inputPath) {
        let parsed = path.parse(inputPath);

        const outputDir = "/assets/css";
        const outputFilePath = path.join(outputDir, `${parsed.name}.css`);

        // Return the new permalink
        return outputFilePath;
      },
    },

    // `compile` is called once per .scss file in the input directory
    compile: async function (inputContent, inputPath) {
      let parsed = path.parse(inputPath);
      // Adhere to convention of not outputting Sass underscore files
      if (parsed.name.startsWith("_")) {
        return;
      }

      let result = sass.compileString(inputContent, {
        loadPaths: [parsed.dir || "."],
      });

      // This is the render function, `data` is the full data cascade
      return async (data) => {
        return result.css;
      };
    },
  });

  // Prevent _index.scss files from being rendered by Eleventy
  eleventyConfig.ignores.add("src/assets/scss/**/_*.scss");

  /* Custom filters */
  /******************/

  // Custom filter to determine if current page is within parent link path
  // Called like this: {{ pagePath | getLinkActiveState: parentPath }}
  eleventyConfig.addFilter("getLinkActiveState", helpers.getLinkActiveState);

  // Generate lorem ipsum for use in content
  // Called like this: {{ count | loremIpsum: type }}
  // Where type is one of: words, sentences, paragraphs
  eleventyConfig.addFilter("loremIpsum", helpers.loremIpsum);

  // Process input as Markdown, useful for Markdown included in frontmatter
  eleventyConfig.addFilter("markdownify", (markdownString) =>
    markdownLib.renderInline(markdownString),
  );

  // Filters used for OpenGraph SVG generation
  eleventyConfig.addFilter("readablePostDate", openGraph.ogReadablePostDate);

  /* Shortcodes */
  /**************/

  // Shortcode to add inline photos to articles
  // 'src' is the filename within assets/images
  // Valid ratios are set in assets/scss/blocks/_frame.scss
  eleventyConfig.addLiquidShortcode(
    "articleImage",
    function (src, alt, ratio, portrait = true) {
      let html = `
      <div class="[ article__photo ]" ${portrait ? `data-portrait` : ""}>
        <div class="[ box ] [ shadow-2xs-xs padding-none ]" data-shadow>
          <div class="frame" data-ratio="${ratio}">
            <img src="assets/images/${src}" alt="${alt}" />
          </div>
        </div>
      </div>
    `;
      return html;
    },
  );

  eleventyConfig.addPairedShortcode(
    "blockQuote",
    function (content, name, source, url = false) {
      let html = `
      <div class="[ quote ] [ flow ]">
        <blockquote>
          <p>${content}</p>
        </blockquote>
        <p class="flow-space-xs">${name}, ${url ? `<a href="${url}">` : ""}<cite>${source}</cite>${url ? `</a>` : ""}</p>
      </div>
    `;
      return html;
    },
  );

  return {
    // Set directories to watch
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    // Define other options like pathPrefix
    templateFormats: ["liquid", "md", "njk"],
    htmlTemplateEngine: "liquid",
  };
}
