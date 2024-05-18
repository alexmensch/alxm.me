module.exports = function(eleventyConfig) {
  // Use Liquid for templates
  eleventyConfig.setTemplateFormats([
    "md", // Markdown
    "liquid" // Liquid templates
  ]);

  // Add a passthrough copy directive for assets
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addLayoutAlias('base', 'layouts/base.liquid');

  // Optional: Add any plugins, filters, or shortcodes

  return {
    // Set directories to watch
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data"
    },
    // Define other options like pathPrefix
  };
};
