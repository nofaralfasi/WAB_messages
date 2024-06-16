import axios from "axios";
import schedule from "node-schedule";

// Replace with your WhatsApp API credentials
const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0/ACCOUNT_ID/messages';
const API_TOKEN = 'TOKEN';

// Replace with your template name and parameters
const templateName_nofar = 'TEMPLATE_1';
const templateName_simon = 'TEMPLATE_2';

// Your array of phone numbers
// const phoneNumbersNofar = [];

// const phoneNumbersSimon = [];

// Function to send a message to a single phone number
async function sendMessage(phoneNumber, templateName) {
  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            // policy: 'deterministic',
            code: 'he' // Adjust the language code as needed
          }
          // Add additional template parameters if needed
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );

    console.log(`Message sent to ${phoneNumber}:`, response.data);
  } catch (error) {
    console.error(`Failed to send message to ${phoneNumber}:`, error.response ? error.response.data : error.message);
  }
}

// Iterate over the array of phone numbers and send messages
async function sendMessagesNofar() {
  const templateName = templateName_nofar;
  for (const phoneNumber of phoneNumbersNofar) {
    await sendMessage(phoneNumber, templateName);
  }
}

// Iterate over the array of phone numbers and send messages
async function sendMessagesSimon() {
  const templateName = templateName_simon;
  for (const phoneNumber of phoneNumbersSimon) {
    await sendMessage(phoneNumber, templateName);
  }
}

// Schedule the task to run at a specific time
const scheduleTimeNofar = '0 20 10 * * *'; // second, minute, hour, day of month, month, day of week):
const scheduleTimeSimon = '0 30 10 * * *'; // second, minute, hour, day of month, month, day of week):

schedule.scheduleJob(scheduleTimeNofar, () => {
  console.log('Starting to send messages Nofar...');
  sendMessagesNofar().then(() => {
    console.log('All messages sent successfully Nofar.');
  }).catch((error) => {
    console.error('Error sending messages Nofar:', error);
  });
});

schedule.scheduleJob(scheduleTimeSimon, () => {
  console.log('Starting to send messages Simon...');
  sendMessagesSimon().then(() => {
    console.log('All messages sent successfully Simon.');
  }).catch((error) => {
    console.error('Error sending messages Simon:', error);
  });
});

// Get the current date and time
const currentDate = new Date();

// Print the current date and time
console.log(`Current Date and Time: ${currentDate}`);
