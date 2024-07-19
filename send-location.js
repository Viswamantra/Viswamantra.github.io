const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { name, mobile, latitude, longitude } = JSON.parse(event.body);

  const apiKey = 'YOUR_MAPPLS_API_KEY';
  const smsApiUrl = 'https://sms-api-service.com/send'; // Replace with actual SMS API endpoint

  // Example payload for the SMS API
  const payload = {
    to: '+917386361725',
    message: `User ${name} with mobile number ${mobile} is at location: (${latitude}, ${longitude})`,
  };

  try {
    const response = await fetch(smsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // If required by the SMS API
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS' }),
    };
  }
};
