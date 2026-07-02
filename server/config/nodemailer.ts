import { createTransport } from "nodemailer";

// Create a transporter using SMTP
const transporter = createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
 
  auth: {
    user: process.env.SMTP_USER || process.env.SMPT_USER,
    pass: process.env.SMTP_PASS || process.env.SMPT_PASS,
  },
});

const sendEmail = async ({to, subject, body}: {to: string, subject: string, body: string}) => {

  const response = await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html: body,

  })
  return response
  



}

export default sendEmail;
