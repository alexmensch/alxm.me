import podcast from "../../_data/podcast.js";
import { Liquid } from "liquidjs";

const liquid = new Liquid({
  root: ["src/_includes"],
  extname: '.liquid'
});

export default {
  eleventyComputed: {
    channel: {
      description: async function (data) {
        const renderedContent = await liquid.parseAndRender(
          data.page.rawInput,
          data
        );
        return podcast.markdownToCDATA(renderedContent);
      },
    },
    /*
     * podcast.11tydata.js from the parent directory propagates data into all
     * subdirectories. Any data that isn't needed must be null-ed out here.
     */
    pubDate: undefined,
    description: undefined,
    ogData: undefined,
    itunes: undefined,
    enclosure: undefined,
  },
};
