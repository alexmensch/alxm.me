---
layout: layouts/contact.liquid
title: Contact
---
<section>
  <h1>Contact Me</h1>
  <form action="/api/contact" method="POST">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>

    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>

    <label for="message">Message:</label>
    <textarea id="message" name="message" rows="4" required></textarea>

    <button type="submit">Send</button>
  </form>
</section>
