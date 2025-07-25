import helpers from "../_data/helpers.js";

export default {
  permalink: function ({ title }) {
    return `/s/${helpers.permalinkToPage(title)}/`;
  },
  eleventyComputed: {
    ogData: function ({ title, date }) {
      return {
        title: title,
        date: date,
      };
    },
  },
};
