const md = require('markdown-it');
const mdAnchor = require('markdown-it-anchor');
const mdTOC = require('markdown-it-table-of-contents');

module.exports = function(eleventyConfig) {
  // Add a passthrough copy directive for assets
  eleventyConfig.addPassthroughCopy("src/assets");

  // Define collections for projects and writing
  eleventyConfig.addCollection("projects", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/projects/*.md");
  });

  eleventyConfig.addCollection("writing", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/writing/*.md");
  });

  // Custom collection to aggregate all writing tags
  eleventyConfig.addCollection('writing-tags', function(collectionApi) {
    let tagSet = new Set();
    collectionApi.getFilteredByGlob("src/writing/*.md").forEach(item => {
      if ('tags' in item.data) {
        let tags = item.data.tags;
        tags = Array.isArray(tags) ? tags : [tags];
        tags.forEach(tag => tagSet.add(tag));
      }
    });
    return [...tagSet];
  });

  // Configure Markdown-It with the TOC plugin
  let markdownLibToc = md({
    typographer: true
  })
  .use(mdAnchor, {
    permalink: mdAnchor.permalink.headerLink({ safariReaderFix: true })
  })
  .use(mdTOC, {
    includeLevel: [1, 2, 3], // Levels to include in the TOC
    containerClass: 'toc', // Class for the TOC container
  });

  // Set the Markdown library to use
  eleventyConfig.setLibrary('md', markdownLibToc);

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
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid"
  };
};
