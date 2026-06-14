import helpers from "../_data/helpers.js";
import site from "../_data/site.js";

export default {
  pagination: {
    // Counselling-tagged articles are source-of-truth on alexmarshalltherapy.com,
    // so no local page is generated. They remain in collections.writing, so the
    // /writing/ listing still surfaces them (linking out — writing-collection.liquid).
    before(data) {
      return data.filter(
        (item) => !helpers.hasAnyTag(item.tags, site.counselling.tags)
      );
    }
  },
  // For metadata that needs to be preserved as objects
  eleventyComputed: {
    date: (data) => data.post.date,
    version_date: (data) => data.post.version_date,
    meta: (data) => data.post.meta,
    ogData: (data) => ({
      date: data.post.date,
      title: data.post.title
    })
  }
};
