import helpers from "../../_data/helpers.js";
import site from "../../_data/site.js";

export default {
  eleventyComputed: {
    channel: {
      copyright(_data) {
        return `Copyright &#169; ${helpers.currentYear()} ${site.authorName}`;
      }
    },
    /*
     * podcast.11tydata.js from the parent directory propagates data into all
     * subdirectories. Any data that isn't needed must be null-ed out here.
     */
    pubDate: undefined,
    description: undefined,
    ogData: undefined,
    itunes: undefined,
    enclosure: undefined
  }
};
