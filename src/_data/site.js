const site = {
  domain: "alxm.me",
  authorName: "Alex Marshall",
  authorEmail: "hello@alxm.me",
  siteName: "Alex Marshall",
  rss: {
    collection: "writing",
    title: "Alex Marshall | Writing",
    subtitle: "A collection of my writing on various topics."
  },
  podcastEmail: "podcast@alexmarshall.me",
  podcastURL: {
    remotes: [
      {
        name: "Apple",
        url: "https://podcasts.apple.com/us/podcast/what-i-knew/id1846839520"
      },
      {
        name: "Spotify",
        url: "https://open.spotify.com/show/54h0C6BuIMJnYiXcsnt67H"
      },
      {
        name: "Overcast",
        url: "https://overcast.fm/itunes1846839520"
      },
      {
        name: "YouTube",
        url: "https://www.youtube.com/playlist?list=PL5BiFkWofLTWIxHPdfu2MRhHMubCxi-N_"
      },
      {
        name: "Amazon",
        url: "https://music.amazon.co.uk/podcasts/973c75f5-1dc0-4e8a-92ad-1bb7579a4b28"
      }
    ]
  },
  links: [],
  nav: [
    { title: "Counselling", url: "/counselling/" },
    { title: "Advisory", url: "/advisory/", hidden: true },
    { title: "Writing", url: "/writing/" },
    { title: "Podcast", url: "/podcast/", collection: true },
    { title: "Contact", url: "/contact/", footer: true },
    { title: "About", url: "/about/", footer: true },
    { title: "Styles", url: "/styles/", hidden: true }
  ]
};

site.rss.outputPath = `/${site.rss.collection}.atom`;

site.podcastURL.local = `https://${site.domain}/podcast/feed/what-i-knew.rss`;

site.links = [
  {
    rel: "preconnect",
    href: "https://rsms.me"
  },
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com"
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossorigin: ""
  },
  {
    rel: "stylesheet",
    href: "/assets/css/root.css"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap"
  },
  {
    rel: "stylesheet",
    href: "https://rsms.me/inter/inter.css"
  },
  {
    rel: "stylesheet",
    href: "/assets/css/syntax.css"
  },
  {
    rel: "alternate",
    title: site.rss.title,
    type: "application/atom+xml",
    href: site.rss.outputPath
  }
];

export default site;
