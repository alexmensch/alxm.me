import podcast from "../../_data/podcast.js";

export default {
  eleventyComputed: {
    channel: {
      description: function (data) {
        return podcast.markdownToCDATA(data.page.rawInput);
      },
    },
    /*
     * podcast.11tydata.js from the parent directory propagates data into all
     * subdirectories. Any data that isn't needed must be null-ed out here.
     */
    pubDate: undefined,
    description: undefined,
    ogData: undefined,
  },
};
