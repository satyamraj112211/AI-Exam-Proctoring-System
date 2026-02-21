const nodemailer = require('nodemailer');
const logger = require('../../utils/helpers/logger');

class EmailService {
  constructor() {
    const hasSmtpConfig =
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USERNAME &&
      process.env.SMTP_PASSWORD;

    if (hasSmtpConfig) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
          },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000
        });

        this.transporter.verify((error) => {
          if (error) {
            logger.error('SMTP connection error:', error);
          } else {
            logger.info('SMTP server is ready to send emails');
          }
        });
      } catch (err) {
        logger.error('Failed to initialize SMTP transporter, switching to dev fallback:', err);
        this.useFallbackTransport();
      }
    } else {
      this.useFallbackTransport();
    }
  }

  useFallbackTransport() {
    this.transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    logger.info('EmailService running in fallback mode (jsonTransport). No real emails sent.');
  }

  async sendOTPEmail({ email, otp, name }) {
    const mailOptions = {
      from: `"Exam Proctoring System" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your OTP for Teacher Registration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .otp-box { background: #f8f9fa; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Exam Proctoring System</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering as a teacher. Use the OTP below to verify your email address:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <br>
              <p>Best regards,<br>Exam Proctoring Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Exam Proctoring System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail({ email, name, teacherId }) {
    const mailOptions = {
      from: `"Exam Proctoring System" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to Exam Proctoring System - Teacher Registration Complete',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; color: white; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Registration Successful!</h1>
            </div>
            <div class="content">
              <h2>Welcome ${name}!</h2>
              <p>Your teacher account has been successfully created.</p>
              
              <div class="details">
                <h3>Your Account Details:</h3>
                <p><strong>Teacher ID:</strong> ${teacherId}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>You can now log in to your teacher dashboard and start:</p>
              <ul>
                <li>Creating exams and tests</li>
                <li>Monitoring student activities</li>
                <li>Generating performance reports</li>
                <li>Managing your classes</li>
              </ul>
              
              <p>
                <a href="${process.env.CLIENT_URL}/teacher/login" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Go to Teacher Dashboard
                </a>
              </p>
              
              <br>
              <p>Need help? Contact our support team at support@examproctoring.com</p>
              <br>
              <p>Best regards,<br>Exam Proctoring Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Exam Proctoring System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail({ email, name, resetURL }) {
    const mailOptions = {
      from: `"Exam Proctoring System" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset Request - Teacher Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; color: white; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .button { background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>You have requested to reset your password. Click the button below to reset it:</p>
              <p>
                <a href="${resetURL}" class="button">Reset Password</a>
              </p>
              <p>This link will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <br>
              <p>Best regards,<br>Exam Proctoring Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Exam Proctoring System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();