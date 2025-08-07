import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';
const lookup = promisify(dns.lookup);

let transporter: nodemailer.Transporter | null = null;

async function getSMTPIP() {
  try {
    const result = await lookup(process.env.SMTP_HOST || '');
    return result.address;
  } catch (error) {
    console.error('DNS Lookup Error:', error);
    throw error;
  }
}

async function initializeTransporter() {
  if (transporter) return transporter;

  try {
    const smtpIP = await getSMTPIP();
    
    transporter = nodemailer.createTransport({
      host: smtpIP,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.3',
        ciphers: 'ALL:!EXPORT:!EXPORT40:!EXPORT56:!aNULL:!LOW:!RC4:@STRENGTH',
        servername: process.env.SMTP_HOST
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      debug: false
    });

    // Verify connection on startup
    await transporter.verify();
    console.log('SMTP server is ready to take our messages');
    return transporter;
  } catch (error) {
    console.error('Failed to initialize SMTP connection:', error);
    throw error;
  }
}

export { initializeTransporter };
export default transporter;
