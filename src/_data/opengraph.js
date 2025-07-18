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
  ogSplitLines: function (input, chars) {
    const parts = input.split(" ");
    const lines = parts.reduce(function (prev, current) {
      if (!prev.length) {
        return [current];
      }

      let lastOne = prev[prev.length - 1];

      if (lastOne.length + current.length > chars) {
        return [...prev, current];
      }

      prev[prev.length - 1] = lastOne + " " + current;

      return prev;
    }, []);

    return lines;
  },
  imageDir: imageDir,
 };