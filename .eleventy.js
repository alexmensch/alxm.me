const md = require("markdown-it");
const mdAnchor = require("markdown-it-anchor");
const mdTOC = require("markdown-it-table-of-contents");
const mdFN = require("markdown-it-footnote");
const { DateTime } = require("luxon");

const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { feedPlugin } = require("@11ty/eleventy-plugin-rss");
const directoryOutputPlugin = require("@11ty/eleventy-plugin-directory-output");

const fs = require("fs");

module.exports = async function (eleventyConfig) {
  // Ignore test page if NODE_ENV=production
  if (process.env.NODE_ENV === "production") {
    eleventyConfig.ignores.add("src/test.md");
  }

  /* 11ty Plugins */
  /****************/
  // Image transforms
  const { InputPathToUrlTransformPlugin } = await import("@11ty/eleventy");
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: "html",
    formats: ["webp", "auto"],
    widths: ["auto"],
    urlPath: "/assets/images/",

    // optional, attributes assigned on <img> override these values.
    defaultAttributes: {
      loading: "lazy",
      decoding: "async",
    },
  });

  // Syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight);

  // RSS / Atom feed
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom", // or "rss", "json"
    outputPath: "/writing.atom",
    collection: {
      name: "writing", // iterate over `collections.posts`
      limit: 0, // 0 means no limit
    },
    metadata: {
      language: "en",
      title: "Alex Marshall | Writing",
      subtitle: "A collection of all of my writing on various topics.",
      base: "https://alxm.me/writing",
      author: {
        name: "Alex Marshall",
        email: "", // Optional
      },
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
    "src/assets/files": "assets/files",
    "src/_redirects": "_redirects",
    "src/404.html": "404.html",
  });

  /* Collections config */
  /**********************/
  let postCollections = new Set();
  postCollections.add("writing");
  postCollections.add("projects");

  postCollections.forEach((collectionName) => {
    // Collection for unique tags
    eleventyConfig.addCollection(
      `${collectionName}-tags`,
      function (collectionApi) {
        let tagSet = new Set();

        collectionApi
          .getFilteredByGlob(`src/${collectionName}/*.md`)
          .forEach((item) => {
            if ("tags" in item.data) {
              let tags = item.data.tags;
              tags = Array.isArray(tags) ? tags : [tags];
              tags.forEach((tag) => tagSet.add(tag));
            }
          });

        return [...tagSet];
      },
    );

    // Collection for years
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

    // Collection for all items
    eleventyConfig.addCollection(`${collectionName}`, function (collectionApi) {
      return collectionApi.getFilteredByGlob(`src/${collectionName}/*.md`);
    });
  });

  /* Markdown Configuration */
  /**************************/
  let markdownLib = md({
    typographer: true,
  })
    // Heading anchors
    .use(mdAnchor, {
      permalink: mdAnchor.permalink.headerLink({ safariReaderFix: true }),
    })
    // Table of Contents
    .use(mdTOC, {
      includeLevel: [1, 2, 3], // Levels to include in the TOC
      containerClass: "toc", // Class for the TOC container
    })
    // Footnotes
    .use(mdFN);

  // Footnote HTML customization
  markdownLib.renderer.rules.footnote_block_open = () =>
    '<hr class="footnotes-sep">\n' +
    '<h4 class="footnotes">Notes</h4>\n' +
    '<section class="footnotes">\n' +
    '<ol class="footnotes-list">\n';

  // Override footnote indicator render to output a number without square brackets
  markdownLib.renderer.rules.footnote_caption = (tokens, idx) => {
    let n = Number(tokens[idx].meta.id + 1).toString();
    if (tokens[idx].meta.subId > 0) n += `:${tokens[idx].meta.subId}`;
    return `${n}`;
  };

  // Set the Markdown library to use
  eleventyConfig.setLibrary("md", markdownLib);

  /* Open Graph image generation */
  /*******************************/

  // Custom filter for date in OG image permalink
  eleventyConfig.addFilter("ogPostDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, {
      zone: "Europe/London",
    })
      .setLocale("en")
      .toISODate();
  });

  // Custom filter for a human-readable post date
  eleventyConfig.addFilter("readablePostDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, {
      zone: "Europe/London",
    })
      .setLocale("en")
      .toLocaleString(DateTime.DATE_FULL);
  });

  // Custom filter to split text into multiple lines
  eleventyConfig.addFilter("ogSplitLines", function (input, chars) {
    const parts = input.split(" ");
    const lines = parts.reduce(function (prev, current) {
      if (!prev.length) {
        return [current];
      }

      let lastOne = prev[prev.length - 1];

      if (lastOne.length + current.length > chars) {
        return [...prev, current];
      }

      prev[prev.length - 1] = lastOne + " " + current;

      return prev;
    }, []);

    return lines;
  });

  // Post-process SVGs to convert to JPEG for OpenGraph compatibility
  eleventyConfig.on("eleventy.after", async ({}) => {
    const socialPreviewImagesDir = "_site/assets/images/open-graph/";

    fs.readdir(socialPreviewImagesDir, function (err, files) {
      if (files.length > 0) {
        files.forEach(function (filename) {
          if (filename.endsWith(".svg")) {
            let imageUrl = socialPreviewImagesDir + filename;
            eleventyImageTransformPlugin(imageUrl, {
              formats: ["jpeg"],
              outputDir: "./" + socialPreviewImagesDir,
              filenameFormat: function (id, src, width, format, options) {
                let outputFilename = filename.substring(0, filename.length - 4);
                return `${outputFilename}.${format}`;
              },
            });
          }
        });
      }
    });
  });

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
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
  };
};
