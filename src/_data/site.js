import fonts from "./fonts.js";

export default {
  domain: "alxm.me",
  authorName: "Alex Marshall",
  authorEmail: "hello@alxm.me",
  siteName: "Alex Marshall",
  includes: [
    {
      rel: "stylesheet",
      href: fonts.buildCSS,
    },
    {
      rel: "stylesheet",
      href: "/assets/css/syntax.css",
    },
    {
      rel: "stylesheet",
      href: "/assets/css/root.css",
    },
  ],
  rss: {
    collection: "writing",
    title: "Alex Marshall | Writing",
    subtitle: "A collection of my writing on various topics.",
  },
  nav: [
    { title: "Coaching", url: "/coaching/" },
    { title: "Advisory", url: "/advisory/" },
    { title: "Writing", url: "/writing/", collection: true },
    { title: "Contact", url: "/contact/", footer: true },
    { title: "About", url: "/about/", footer: true },
    { title: "Styles", url: "/styles/", hidden: true },
  ],
};
