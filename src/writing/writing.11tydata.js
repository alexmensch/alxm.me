const slugify = require("slugify");
const { DateTime } = require("luxon");

module.exports = {
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
};
