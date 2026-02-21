const transporter = require('../config/email');

class EmailService {
  /**
   * Send email with retry logic (optimized for cloud environments)
   */
  static async sendWithRetry(mailOptions, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create a new promise for each attempt
        const emailPromise = transporter.sendMail(mailOptions);
        
        // Shorter timeout for cloud environments (15 seconds per attempt)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Email timeout on attempt ${attempt}`)), 15000);
        });
        
        const result = await Promise.race([emailPromise, timeoutPromise]);
        
        if (attempt > 1) {
          console.log(`✓ Email sent successfully on attempt ${attempt}`);
        }
        
        return { success: true, result };
      } catch (error) {
        lastError = error;
        console.warn(`Email attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.code === 'EAUTH' || error.responseCode === 535) {
          console.error('Authentication failed - check SMTP credentials');
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    return { success: false, error: lastError };
  }

  static async sendOTP(email, otp) {
    if (!transporter) {
      console.error('Email transporter not initialized');
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USERNAME || 'noreply@examproctoring.com',
      to: email,
      subject: 'Your OTP for Student Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Exam Proctoring System</h2>
          <p>Your OTP for registration is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; margin: 0; font-size: 32px; letter-spacing: 10px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Exam Proctoring System. All rights reserved.</p>
        </div>
      `,
    };

    const { success, result, error } = await this.sendWithRetry(mailOptions, 3);
    
    if (success) {
      console.log('✓ OTP email sent successfully to:', email);
      if (result) {
        console.log('Email details:', {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected
        });
      }
      return true;
    } else {
      console.error('✗ Email sending failed after all retries');
      if (error) {
        console.error('Final error:', {
          message: error.message,
          code: error.code,
          command: error.command,
          responseCode: error.responseCode
        });
        
        // Provide helpful error messages
        if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          console.error('⚠ SMTP connection timeout. This often happens in cloud environments.');
          console.error('💡 Solution: Use SendGrid (SENDGRID_API_KEY) or check SMTP firewall settings');
        } else if (error.code === 'ECONNREFUSED') {
          console.error('⚠ SMTP connection refused. Check SMTP_HOST and SMTP_PORT');
        } else if (error.code === 'EAUTH') {
          console.error('⚠ SMTP authentication failed. Check SMTP_USERNAME and SMTP_PASSWORD');
        }
      }
      return false;
    }
  }

  static async sendWelcomeEmail(email, firstName) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Exam Proctoring System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Exam Proctoring System!</h2>
          <p>Dear ${firstName},</p>
          <p>Your account has been successfully created. You can now login and start using our platform.</p>
          <p>Features you can access:</p>
          <ul>
            <li>Take online exams</li>
            <li>View your results</li>
            <li>Track your progress</li>
            <li>Access study materials</li>
          </ul>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Exam Proctoring Team</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Welcome email error:', error);
      return false;
    }
  }

  static async sendPasswordResetOTP(email, otp, userType = 'student') {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset OTP - Exam Proctoring System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>You have requested to reset your password. Use the OTP below to verify your identity:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; margin: 0; font-size: 32px; letter-spacing: 10px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Exam Proctoring System. All rights reserved.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Password reset OTP email error:', error);
      return false;
    }
  }
}

module.exports = EmailService;