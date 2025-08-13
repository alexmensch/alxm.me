---
layout: layouts/posts
pagination:
  data: collections.writing
  size: 1
  alias: post
eleventyComputed:
  title: "{{ post.title }}"
  date: "{{ post.date }}"
  version_date: "{{ post.version_date }}"
  permalink: "{{ post.permalink }}"
  ogData:
    title: title
    date: date
---

{{ post.content }}