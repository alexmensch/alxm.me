import slugify from "slugify";
import { DateTime } from "luxon";
import { LoremIpsum } from "lorem-ipsum";
import MarkdownIt from "markdown-it";

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

const md = new MarkdownIt({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />)
  breaks: false, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
});

export const markdown = md;

export default {
  markdown,
  currentYear: function () {
    return new String(new Date().getFullYear());
  },
  // Standardize permalink format for full path use
  permalinkToPath: function (title, date) {
    return `${this.toDate(date, "/")}/${this.toSlug(title)}/`;
  },
  // Standardize permalink format for single file name use
  permalinkToFilename: function (title, date) {
    return `${this.toDate(date, "-")}-${this.toSlug(title)}`;
  },
  // Standardize permalink format for single page use -- without a date
  permalinkToPage: function (title) {
    return `${this.toSlug(title)}`;
  },
  toSlug: function (string) {
    return slugify(string, {
      lower: true,
      replacement: "-",
      remove: /[*+~.()'"!:@]/g,
    });
  },
  toDate: function (date, delim) {
    const formatString = ["yyyy", "LL", "dd"].join(delim);
    return DateTime.fromJSDate(date).toFormat(formatString);
  },
  dateToRFC2822: function (date) {
    return date.toUTCString();
  },
  dateToRFC339: function (date) {
    return date.toISOString();
  },
  getLinkActiveState(itemPath, pagePath) {
    let response = "";

    if (itemPath === pagePath) {
      response = ' aria-current="page"';
    }

    if (itemPath.length > 1 && pagePath.indexOf(itemPath) === 0) {
      response += ' data-state="active"';
    }

    return response;
  },
  loremIpsum: function (count, type) {
    switch (type) {
      case "words":
      case "word":
        return lorem.generateWords(count);
      case "sentences":
      case "sentence":
        return lorem.generateSentences(count);
      case "paragraphs":
      case "paragraph":
        return lorem.generateParagraphs(count);
      default:
        return "Invalid input. Parameters were: ${count} and ${type}";
    }
  },
  getNewestCollectionItemDate: function (collection) {
    if (!collection || collection.length === 0) {
      throw new Error(`No items in collection "${collection}"`);
    }
    
    return collection.reduce((newest, item) => {
      const itemDate = item.date || item.data?.date;
      return itemDate > newest ? itemDate : newest;
    }, collection[0].date || collection[0].data?.date || new Date());
  },
  markdownToHTML: function (content) {
    return String(md.render(content));
  },
  escapeHTML: function (string) {
    return String(string).replace(
      /[&<>'"]/g,
      tag =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag)
    );
  },
};
