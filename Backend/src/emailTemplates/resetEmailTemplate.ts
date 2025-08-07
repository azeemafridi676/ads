export const generateResetPasswordEmailTemplate = (resetUrl: string): string => {
    return `
      <html>
        <body>
          <p>Hi there,</p>
          <p>We received a request to reset your password. To reset it, please click the link below:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this change, please ignore this email. Your password will not be changed.</p>
          <p>Thank you!</p>
          <p>Best regards,<br>Your Company Team</p>
        </body>
      </html>
    `;
  };
  