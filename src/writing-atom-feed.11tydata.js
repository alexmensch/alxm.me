import site from "./_data/site.js";

export default {
  // For metadata that needs to be preserved as objects
  eleventyComputed: {
    collection: (data) => {
      return data.collections[site.rss.collection];
    },
  },
};
