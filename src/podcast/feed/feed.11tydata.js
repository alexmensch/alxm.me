import podcast from "../../_data/podcast.js";

export default {
  eleventyComputed: {
    channel: {
      description: function (data) {
        return podcast.markdownToCDATA(data.page.rawInput);
      },
    },
  },
};
