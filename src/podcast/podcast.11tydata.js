import helpers from "../_data/helpers.js";
import podcast from "../_data/podcast.js";
import { Liquid } from "liquidjs";

const liquid = new Liquid({
  root: ["src/_includes"],
  extname: ".liquid",
});

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
    description: async function (data) {
      const renderedContent = await liquid.parseAndRender(
        data.page.rawInput,
        data,
      );
      return podcast.markdownToCDATA(renderedContent);
    },
    itunes: {
      duration: async function ({ recording }) {
        if (!recording) {
          return 0;
        }
        const duration = await podcast.getDurationInSec("./src" + recording);
        return Math.ceil(duration);
      },
    },
    enclosure: {
      length: async function ({ recording }) {
        if (!recording) {
          return 0;
        }
        const bytes = await podcast.getFilesize("./src" + recording);
        return bytes;
      },
    },
  },
};
