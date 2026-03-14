import { validateWritingTags } from "../../eleventy-plugins/tag-validation.js";
import tagPhrases from "../_data/tagPhrases.js";
import helpers from "../_data/helpers.js";

let validated = false;

export default {
  layout: "layouts/writing",
  eleventyExcludeFromCollections: true,
  pagination: {
    data: "collections.writing",
    size: 1,
    alias: "tagData",
    before(paginationData) {
      // Validate tags once during the build
      if (!validated) {
        validateWritingTags(paginationData, tagPhrases);
        validated = true;
      }

      // Extract unique tags from the writing collection
      const tags = [
        ...new Set(
          paginationData.filter((item) => item.tag).map((item) => item.tag)
        )
      ];
      return tags.sort();
    }
  },
  eleventyComputed: {
    title(data) {
      return data.tagData ? `Writing: ${helpers.titleCaseTag(data.tagData)}` : "Writing";
    },
    permalink(data) {
      if (!data.tagData) return false;
      return `/writing/${data.tagData}/`;
    },
    tag_filter(data) {
      return data.tagData || "";
    },
    hero(data) {
      return data.tagData
        ? { header: `Writing: ${helpers.titleCaseTag(data.tagData)}` }
        : {};
    }
  }
};
