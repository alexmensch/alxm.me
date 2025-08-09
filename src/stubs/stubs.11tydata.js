import helpers from "../_data/helpers.js";

export default {
  permalink: function (data) {
    return data.stub.permalink || `/s/${helpers.permalinkToPage(data.stub.title)}/`;
  },
  eleventyComputed: {
    // Flatten metadata so that templates work with pagination
    title: function (data) { return data.stub.title; },
    date: function (data) { return data.stub.date; },
    hero: function (data) { return data.stub.hero; },
  },
};