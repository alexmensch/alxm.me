const slugify = require("slugify");
const { DateTime } = require("luxon");

module.exports = {
  permalink: function ({ title, date }) {
    return `/projects/${DateTime.fromJSDate(date).toFormat("yyyy/LL/dd")}/${slugify(
      title,
      {
        lower: true,
        replacement: "-",
        remove: /[*+~.()'"!:@]/g,
      },
    )}/`;
  },
};
