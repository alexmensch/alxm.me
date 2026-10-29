import helpers from "../_data/helpers.js";
import site from "../_data/site.js";

export default {
  // For metadata that needs to be preserved as objects
  eleventyComputed: {
    date: (data) => data.post.date,
    version_date: (data) => data.post.version_date,
    meta: (data) => data.post.meta,
    ogImage: (data) =>
      helpers.ogImageUrl(data.page.url, site.domain, site.og.generatedDir)
  }
};
