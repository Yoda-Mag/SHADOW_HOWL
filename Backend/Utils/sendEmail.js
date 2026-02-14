const axios = require('axios');

console.log('RESEND_API_KEY Check:', process.env.RESEND_API_KEY ? 'Present' : 'MISSING');

const sendSignalEmail = async (userEmail, signalDetails) => {
    try {
        console.log(`Attempting to send email to ${userEmail}`);
        const result = await axios.post('https://api.resend.com/emails', {
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
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
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Email sent successfully to ${userEmail}:`, result.data);
        return result.data;
    } catch (error) {
        console.error(`Failed to send email to ${userEmail}:`, error.response?.data || error.message);
        throw error;
    }
};

module.exports = sendSignalEmail;