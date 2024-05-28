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

  // Add a custom filter to rotate a collection based on an index
  eleventyConfig.addFilter("rotateCollection", function(collection, startIndex) {
    if (!Array.isArray(collection)) {
      throw new Error("Expected an array as the first argument to 'rotateCollection' filter");
    }
    
    // Validate and adjust startIndex
    startIndex = parseInt(startIndex, 10);
    if (isNaN(startIndex) || startIndex < 0 || startIndex >= collection.length) {
      throw new Error("Invalid start index for 'rotateCollection' filter");
    }
    
    // Rotate the collection
    return collection.slice(startIndex).concat(collection.slice(0, startIndex));
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
  let markdownLib = md({
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
  eleventyConfig.setLibrary('md', markdownLib);

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
