import { readFileSync } from "fs";
import helpers from "../_data/helpers.js";
import site from "../_data/site.js";

const audioMetadata = JSON.parse(
  readFileSync("src/_data/audioMetadata.json", "utf8")
);

export default {
  permalink({ title }) {
    return `/podcast/${helpers.permalinkToPage(title)}/`;
  },
  eleventyComputed: {
    ogImage(data) {
      return helpers.ogImageUrl(
        data.page.url,
        site.domain,
        site.og.generatedDir
      );
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
