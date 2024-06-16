/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;

function isNumberBetween1And10(str) {
  const num = Number(str);
  return !isNaN(num) && num >= 1 && num <= 10;
}

app.post("/webhook", async (req, res) => {
  // log incoming messages
  console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  // check if the incoming message contains button or text
  if (message?.type === "button" || message?.type === "text") {
    // extract the business number to send the reply from it
    const business_phone_number_id =
      req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
    
    let followUpMessage = "תודה לך על תגובתך!";
    let responseNofar = "הודעת תגובה לנופר.";
    
    if (message?.type === "button") {
      const payload = message.button.payload;
      responseNofar = message.button.text;
      
      if (payload === 'PAYLOAD1') {
        followUpMessage = "נפלא!\nכמה תהיו? נא להשיב מספר בלבד";
      } else if (payload === 'PAYLOAD2') {
        followUpMessage = "מצטערים לשמוע. שנתראה רק בשמחות!\nבמידה ויהיה שינוי, עדיין ניתן ללחוץ על הכפתורים.";
      } else if (payload === 'PAYLOAD3') {
        followUpMessage = "אוקיי, תודה. אנחנו נתזכר אותך מאוחר יותר. במידה ויהיה שינוי, עדיין ניתן ללחוץ על הכפתורים.";
      } else {
        followUpMessage = "שגיאה. אנא נסו שוב.";
      }
    } else {
      // text message
        if (isNumberBetween1And10(message.text.body)) {
          followUpMessage = "תודה רבה, נתראה בקרוב!\nבמידה ויהיה שינוי, ניתן עדיין ללחוץ על הכפתורים.";
        } else {
          followUpMessage = "פנייתך מועברת לנציג. תודה על הסבלנות.";
        }
      responseNofar = message.text.body; 
    }

    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        text: { body: followUpMessage },
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
      },
    });

    // sends a message to Nofar to inform her about the response
    const profileName = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0].profile.name;
    const messageToNofar = profileName + " with the pohne number: " + message.from + ", responded with: " + responseNofar;

    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v19.0/ACCOUNT_ID/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: "PHONE_NUMBER",
        text: { body: messageToNofar },
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
      },
    });
    
    // mark incoming message as read
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
  }

  res.sendStatus(200);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
