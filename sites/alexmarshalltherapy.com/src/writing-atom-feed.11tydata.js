import helpers from "./_data/helpers.js";
import site from "./_data/site.js";

export default {
  eleventyComputed: {
    // Mirror the writing listing page: only counsellingTags-owned items.
    collection: (data) =>
      data.collections[site.rss.collection].filter((item) =>
        helpers.hasAnyTag(item.tags, site.counsellingTags)
      )
  }
};
