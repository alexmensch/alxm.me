---
layout: layouts/landing
meta:
  noindex: true
pagination:
  data: collections.stubs
  size: 1
  alias: stub
eleventyComputed:
  title: "{{ stub.title }}"
  date: "{{ stub.date }}"
  hero: "{{ stub.hero }}"
  permalink: "{{ stub.permalink }}"
---

{{ stub.content }}