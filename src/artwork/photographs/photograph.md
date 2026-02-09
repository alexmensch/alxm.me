---
layout: layouts/photograph-preview
pagination:
  data: collections.photographs
  size: 1
  alias: photo
eleventyComputed:
  title: "{{ photo.data.title }}"
  permalink: "{{ photo.page.url }}"
  date: "{{ photo.data.date }}"
  image: "{{ photo.data.image }}"
  ratio: "{{ photo.data.ratio }}"
  landscape: "{{ photo.data.landscape }}"
  page_slug: "{{ photo.data.page_slug }}"
  description: "{{ photo.data.description }}"
  location: "{{ photo.data.location }}"
  latitude: "{{ photo.data.latitude }}"
  longitude: "{{ photo.data.longitude }}"
---
