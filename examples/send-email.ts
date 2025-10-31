import { Client } from 'mailrify';

async function main() {
  const apiKey = process.env.MAILRIFY_API_KEY;
  if (!apiKey) {
    throw new Error('MAILRIFY_API_KEY is required to run this example.');
  }

  const client = new Client({ apiKey });

  const response = await client.emails.send({
    to: 'recipient@example.com',
    from: 'sender@example.com',
    subject: 'Hello from Mailrify SDK',
    text: 'Hello world!',
    html: '<p>Hello world!</p>',
  });

  console.log('Email queued with ID:', response.emailId);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
