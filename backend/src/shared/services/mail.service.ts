import nodemailer from 'nodemailer';

export class MailService {
  private transporter;

  constructor() {
    // Les infos SMTP proviennent de ton .env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // passe à true si tu utilises le port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send2FACode(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: `"Transcendence Auth" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your 2FA Verification Code',
      text: `Here is your 2FA code: ${code}\nThis code expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>🔒 2FA Verification</h2>
          <p>Hello,</p>
          <p>Your 2FA code is:</p>
          <p style="font-size: 1.5em; font-weight: bold; color: #007bff;">${code}</p>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you didn’t request this, please ignore this email.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
