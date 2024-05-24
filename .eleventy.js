module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection("writing", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/writing/*.md");
  });

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
