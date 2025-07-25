---
layout: podcast/apple-podcasts
eleventyExcludeFromCollections: true
permalink: /podcast/feed/what-i-knew.rss
artwork: /assets/podcast/images/cover-artwork-default.png

channel:
  title: What I Knew
  itunes:
    categories:
      - category: Health &amp; Fitness
        subcategory: Mental Health
      - category: Society &amp; Culture
        subcategory: Personal Journals
      - category: Education
        subcategory: Self-Improvement
    explicit: true
    type: episodic
  language: en
  link: https://alxm.me/podcast

eleventyComputed:
  channel:
    itunes:
      author: "{{ site.authorName }}"
      title: "{{ channel.title }}"
      image: '{{ "https://" | append: site.domain | append: artwork }}'
    copyright: "Copyright &#169; {{ helpers.currentYear }} {{ site.authorName }}"
---

This is a description of the show.

## Here is a heading

And more content below it.
