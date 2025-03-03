import slugify from "slugify";
import { DateTime } from "luxon";

export default {
  permalink: function ({ title, date }) {
    return `/writing/${DateTime.fromJSDate(date).toFormat("yyyy/LL/dd")}/${slugify(
      title,
      {
        lower: true,
        replacement: "-",
        remove: /[*+~.()'"!:@]/g,
      },
    )}/`;
  },
  eleventyComputed: {
    og_description: function ({ og_description, page }) {
      if (og_description) {
        return og_description;
      }

      return `${page.rawInput.substring(0, 150)}...`;
    },
  },
};
