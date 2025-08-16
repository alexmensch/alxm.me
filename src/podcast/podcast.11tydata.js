import helpers from "../_data/helpers.js";
import podcast from "../_data/podcast.js";

export default {
  permalink({ title }) {
    return `/podcast/${helpers.permalinkToPage(title)}/`;
  },
  eleventyComputed: {
    ogData({ title, date }) {
      return {
        title,
        date
      };
    },
    pubDate({ date }) {
      return helpers.dateToRFC2822(date);
    },
    itunes: {
      async duration({ recording }) {
        if (!recording) {
          return 0;
        }
        const duration = await podcast.getDurationInSec(`./src${recording}`);
        return Math.ceil(duration);
      }
    },
    enclosure: {
      async length({ recording }) {
        if (!recording) {
          return 0;
        }
        const bytes = await podcast.getFilesize(`./src${recording}`);
        return bytes;
      }
    }
  }
};
