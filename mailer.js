import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export async function sendValidationEmail(to, token) {
  const validationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/validate/${token}`;
  await transporter.sendMail({
    from: 'no-reply@tutochat.com',
    to,
    subject: 'Validation de votre compte',
    html: `<p>Merci pour votre inscription !</p><p>Cliquez ici pour valider votre compte : <a href="${validationUrl}">Cliquez pour valider</a></p>`
  });
}