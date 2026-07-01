import helpers from "../_data/helpers.js";
import site from "../_data/site.js";

export default {
  // For metadata that needs to be preserved as objects
  eleventyComputed: {
    date: (data) => data.stub.date,
    hero: (data) => data.stub.hero,
    ogImage: (data) =>
      helpers.ogImageUrl(data.page.url, site.domain, site.og.generatedDir)
  }
};
