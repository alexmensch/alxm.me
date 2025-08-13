import { DateTime } from "luxon";

const imageDir = "_site/assets/images/open-graph/";

export default {
  ogReadablePostDate: function (dateInput) {
    console.log(typeof dateInput, dateInput);
    const dt = typeof dateInput === 'string' 
      ? DateTime.fromISO(dateInput, { zone: "Europe/London" })
      : DateTime.fromJSDate(dateInput, { zone: "Europe/London" });
      
    return dt.setLocale("en").toLocaleString(DateTime.DATE_FULL);
  },
  imageDir: imageDir,
};
