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

  // Configure Markdown-It with the TOC plugin
  let markdownLib = md({
    typographer: true
  })
  .use(mdAnchor, {
    permalink: mdAnchor.permalink.linkAfterHeader({
      style: 'visually-hidden',
      assistiveText: title => `Permalink to "${title}"`,
      visuallyHiddenClass: 'visually-hidden',
      placement: 'before',
      wrapper: ['<div class="header">','</div>']
    })
  })
  .use(mdTOC, {
    includeLevel: [1, 2, 3], // Levels to include in the TOC
    containerClass: 'toc', // Class for the TOC container
  });

  // Set the library to use
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
