import { DateTime } from "luxon";

const imageDir = "_site/assets/images/open-graph/";

export default {
  ogReadablePostDate: function (dateObj) {
    return DateTime.fromJSDate(dateObj, {
      zone: "Europe/London",
    })
      .setLocale("en")
      .toLocaleString(DateTime.DATE_FULL);
  },
  imageDir: imageDir,
};
