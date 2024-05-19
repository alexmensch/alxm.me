export async function onRequestPost({ request, env }) {
  // Parse the form data
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const message = formData.get('message');

  // Email parameters
  const sendGridApiKey = env.SENDGRID_API_KEY;
  const sendGridUrl = 'https://api.sendgrid.com/v3/mail/send';

  const emailBody = {
    personalizations: [
      {
        to: [{ email: 'form-submit@alxm.me' }],
      },
    ],
    from: { email: 'no-reply@alxm.me' },
    subject: `New contact form submission from ${name}`,
    content: [
      {
        type: 'text/plain',
        value: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      },
    ],
  };

  // Send the email via SendGrid
  const response = await fetch(sendGridUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailBody),
  });

  if (response.ok) {
    return Response.redirect('/', 302);
  } else {
    return Response.redirect('/contact/error', 302);
  }
}
