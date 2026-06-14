import helpers from "../_data/helpers.js";
import site from "../_data/site.js";

export default {
  pagination: {
    before(data) {
      return data.filter((item) =>
        helpers.hasAnyTag(item.tags, site.counsellingTags)
      );
    }
  },
  eleventyComputed: {
    date: (data) => data.post.date,
    version_date: (data) => data.post.version_date,
    meta: (data) => data.post.meta,
    ogImage: (data) =>
      `https://${site.domain}${site.og.generatedDir}${data.post.permalink.replace(/\/$/, "")}.png`
  }
};
