import site from "./_data/site.js";

function titleCase(tag) {
  return String(tag)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
      return `${site.authorName} | Writing: ${titleCase(data.tagFeedData)}`;
    },
    feedSubtitle(data) {
      if (!data.tagFeedData) return "";
      return `Articles on ${titleCase(data.tagFeedData)}`;
    },
    tagCollection(data) {
      const writing = data.collections?.[site.rss.collection] || [];
      return writing.filter((item) => item.tag === data.tagFeedData);
    }
  }
};
