import { readFileSync } from "fs";
import helpers from "../_data/helpers.js";

const audioMetadata = JSON.parse(
  readFileSync("src/_data/audioMetadata.json", "utf8")
);

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
      duration({ recording }) {
        if (!recording) {
          return 0;
        }
        return audioMetadata[recording]?.duration ?? 0;
      }
    },
    enclosure: {
      length({ recording }) {
        if (!recording) {
          return 0;
        }
        return audioMetadata[recording]?.size ?? 0;
      }
    }
  }
};
