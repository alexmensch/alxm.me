import site from "./_data/site.js";
import helpers from "./_data/helpers.js";

export default {
  eleventyExcludeFromCollections: true,
  metadata: {
    language: "en"
  },
  pagination: {
    data: "collections.writing",
    size: 1,
    alias: "tagFeedData",
    before(paginationData) {
      const tags = [
        ...new Set(
          paginationData.filter((item) => item.tag).map((item) => item.tag)
        )
      ];
      return tags.sort();
    }
  },
  eleventyComputed: {
    permalink(data) {
      if (!data.tagFeedData) return false;
      return `/writing/${data.tagFeedData}.atom`;
    },
    feedTitle(data) {
      if (!data.tagFeedData) return "";
      return `${site.authorName} | Writing: ${helpers.titleCaseTag(data.tagFeedData)}`;
    },
    feedSubtitle(data) {
      if (!data.tagFeedData) return "";
      return `Articles on ${helpers.titleCaseTag(data.tagFeedData)}`;
    },
    tagCollection(data) {
      const writing = data.collections?.[site.rss.collection] || [];
      return writing.filter((item) => item.tag === data.tagFeedData);
    }
  }
};
