import { validateWritingTags } from "../../eleventy-plugins/tag-validation.js";
import tagPhrases from "../_data/tagPhrases.js";

function titleCase(tag) {
  return String(tag)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
      return data.tagData ? `Writing: ${titleCase(data.tagData)}` : "Writing";
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
        ? { header: `Writing: ${titleCase(data.tagData)}` }
        : {};
    }
  }
};
