import helpers from "../_data/helpers.js";
import podcast from "../_data/podcast.js";

export default {
  permalink: function ({ title }) {
    return `/podcast/${helpers.permalinkToPage(title)}/`;
  },
  eleventyComputed: {
    ogData: function ({ title, date }) {
      return {
        title: title,
        date: date,
      };
    },
    pubDate: function ({ date }) {
      return helpers.dateToRFC2822(date);
    },
    description: function (data) {
        return podcast.markdownToCDATA(data.page.rawInput);
    },
  },
};
