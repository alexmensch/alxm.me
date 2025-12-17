import helpers from "../../_data/helpers.js";

const slugFromTitle = ({ title }) =>
  helpers.permalinkToPage(title);

export default {
  eleventyComputed: {
    page_slug: slugFromTitle,
  },
  permalink(data) {
    return `/artwork/paintings/${slugFromTitle(data)}/`;
  }
};