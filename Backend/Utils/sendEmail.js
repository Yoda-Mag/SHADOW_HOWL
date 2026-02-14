const nodeMailer = require('nodemailer');
require('dotenv').config();
console.log('EMAIL_USER Check:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'MISSING');

const transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    name: '3.10.68.207',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Adding these can help bypass some certificate issues
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection configuration
transporter.verify((error) => {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email transporter is ready to send emails');
    }
});

const sendSignalEmail = async (userEmail, signalDetails) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `NEW SIGNAL: ${signalDetails.pair} (${signalDetails.direction})`,
        html: `
            <div style="font-family: sans-serif; background: #111; color: white; padding: 20px; border-radius: 10px;">
                <h2 style="color: #3b82f6;">New Trading Signal Approved!</h2>
                <p><strong>Pair:</strong> ${signalDetails.pair}</p>
                <p><strong>Direction:</strong> <span style="color: ${signalDetails.direction === 'BUY' ? '#22c55e' : '#ef4444'}">${signalDetails.direction}</span></p>
                <p><strong>Entry Price:</strong> ${signalDetails.entry_price}</p>
                <p><strong>Stop Loss:</strong> ${signalDetails.stop_loss}</p>
                <p><strong>Take Profit:</strong> ${signalDetails.take_profit}</p>
                <br>
                <p style="font-size: 12px; color: #666;">Check the dashboard for more details.</p>
            </div>
        `
    };

    try {
        console.log(`Attempting to send email to ${userEmail}`);
        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${userEmail}:`, result.response);
        return result;
    } catch (error) {
        console.error(`Failed to send email to ${userEmail}:`, error);
        throw error;
    }
};


module.exports = sendSignalEmail;