import helpers from "../_data/helpers.js";

export default {
  permalink: function ({ title, date }) {
    return `/writing/${helpers.permalinkToPath(title, date)}`;
  },
  eleventyComputed: {
    ogData: function ({title, date}) {
      return {
        'title': title,
        'date': date
      };
    },
  },
};
