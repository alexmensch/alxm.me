import { DateTime } from "luxon";

const imageDir = "_site/assets/images/open-graph/";

export default {
  ogPostDate: function (dateObj) {
    return DateTime.fromJSDate(dateObj, {
      zone: "Europe/London",
    })
    .setLocale("en")
    .toISODate();
  },
  ogReadablePostDate: function (dateObj) {
    return DateTime.fromJSDate(dateObj, {
      zone: "Europe/London",
    })
    .setLocale("en")
    .toLocaleString(DateTime.DATE_FULL);
  },
  imageDir: imageDir,
 };