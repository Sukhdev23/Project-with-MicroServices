require('dotenv').config();
const nodemailer = require('nodemailer');

const { EMAIL_USER, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, APP_PASSWORD } = process.env;

function hintInvalidGrant(err) {
    if (err && (err.message || '').includes('invalid_grant')) {
        console.error('\nHint: invalid_grant usually means the OAuth2 refresh token is invalid, expired, revoked, or from a different project.');
        console.error(' - Ensure CLIENT_ID/CLIENT_SECRET belong to the same Google Cloud project as the REFRESH_TOKEN');
        console.error(' - If you changed the Google password or revoked app access, generate a new refresh token');
        console.error(' - Alternatively, set APP_PASSWORD in .env (with 2-Step Verification enabled) to use basic SMTP auth');
    }
}

let transporter;
if (APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: APP_PASSWORD,
        },
        logger: true,
        debug: true,
    });
    console.log('Using Gmail App Password authentication.');
} else {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: EMAIL_USER,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
        },
        logger: true,
        debug: true,
    });
    console.log('Using Gmail OAuth2 authentication.');
}

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
        hintInvalidGrant(error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: EMAIL_USER,
            to,
            subject,
            text,
            html,
            envelope: {
                from: EMAIL_USER,
                to: Array.isArray(to) ? to : [to],
            },
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
        hintInvalidGrant(error);
    }
};

// Only send a test email if executed directly, not when imported by the app
if (require.main === module) {
  sendEmail(EMAIL_USER, 'Test Subject', 'Test Text', '<h1>Test HTML</h1>');
}
module.exports = { sendEmail };