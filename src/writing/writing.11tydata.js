import helpers from "../_data/helpers.js";

export default {
  permalink: function ({ title, date }) {
    return `/writing/${helpers.permalinkToPath(title, date)}`;
  },
  eleventyComputed: {
    og_description: function ({ og_description, page }) {
      if (og_description) {
        return og_description;
      }

      return `${page.rawInput.substring(0, 150)}...`;
    },
  },
};
