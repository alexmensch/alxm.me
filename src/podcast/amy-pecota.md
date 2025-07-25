---
title: 'Amy: ""'
date: 2025-06-21
summary: |
  This is an episode summary used only for the list view on my website.
recording:
guid: 1A87A9F5-D54B-40DA-895A-3D2660F2060D
itunes:
  explicit: false
  episode: 4
  season: 1
  episodeType: full
link: page.url

eleventyComputed:
  enclosure:
    url: '{{ "https://" | append: site.domain | append: recording }}'
  itunes:
    image: '{{ "https://" | append: site.domain | append: artwork }}'
    title: "{{ title }}"
---

This entire section is the episode description that will also be posted to Apple Podcasts.

### Credits

**Artwork**: Daniel Hollick

**Sound**: Someone Dedicated

**Music**: Sophia Wilhelmi

### Additional Resources

- Peter's book
- Peter's coaching practice
- Peter's LinkedIn profile
