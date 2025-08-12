import helpers from "../_data/helpers.js";

export default {
  permalink: function (data) {
    return `/writing/${helpers.permalinkToPath(data.post.title, data.post.date)}`;
  },
  eleventyComputed: {
    ogData: function ({ title, date }) {
      return {
        title: title,
        date: date,                                                                                                              
      };
    },
    // Flatten metadata so that templates work with pagination
    title: function (data) { return data.post.title; },
    date: function (data) { return data.post.date; },
    version_date: function (data) { return data.post.version_date; },
  },
};
