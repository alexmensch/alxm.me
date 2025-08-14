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
    explicit: false
    type: episodic
  podcast:
    guid: 75F7697F-7B5E-4B3B-BC73-FB3E0E2EA8CD
    locked: no
  language: en
  link: https://alxm.me/podcast

eleventyComputed:
  channel:
    itunes:
      author: "{{ site.authorName }}"
      title: "{{ channel.title }}"
      image: '{{ "https://" | append: site.domain | append: artwork }}'
    description: "{{ page.rawInput | renderContent: 'liquid' | markdownToCDATA }}"
---

_What I Knew_ celebrates the courage that it takes to make big personal changes. My guests tell their stories with candor and vulnerability, giving light to the inner conflict, complexity, and mystery faced in navigating what it means to live a life with purpose. From career changes, to mental health challenges, to spiritual journeys, each of them share insights and moments that any of us can both relate to and learn from.
