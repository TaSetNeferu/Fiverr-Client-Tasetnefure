// external packages
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Start the webapp
const webApp = express();

// Webapp settings
webApp.use(bodyParser.urlencoded({
    extended: true
}));
webApp.use(bodyParser.json());

// Server Port
const PORT = process.env.PORT;

// Home route
webApp.get('/', (req, res) => {
    res.send(`Hello World.!`);
});

const gd = require('../helper-functions/google-dialogflow');
const wa = require('../helper-functions/whatsapp-send-message');
const gs = require('../helper-functions/google-sheet');

const LANGUAGE = 'es';
const LONG_MSG = `Últimamente ando bastante liado preparando el lanzamiento, grabando vídeos, contestando comentarios, etc. Pero he sacado un ratillo para hablar contigo. Cuéntame : ¿a qué te dedicas y cuál es el motivo real por el que te has apuntado a mi seminario del día 11 de mayo?`;

const TIME_INTERVAL = process.env.TIME_INTERVAL;

// Route for WhatsApp
webApp.post('/whatsapp', async (req, res) => {

    // Get the message and senderId
    let message = req.body.Body;
    let senderId = req.body.From.split('+')[1];

    console.log(`Sender id --> ${senderId}`);
    console.log(`Message --> ${message}`);

    if (message === undefined) {
        console.log(`Something bad came to WhatsApp`);
        await wa.sendMessage(`Lo siento, no puedo entender esto por el momento.`, senderId);
    } else {
        let intentData = await gd.detectIntent(message, LANGUAGE, senderId);

        if (intentData.intent === 'Default Welcome Intent') {

            let flag = 0;

            // Make sure no user can use this twice
            if (senderId === undefined) {
                console.log(`Something bad came to WhatsApp`);
                await wa.sendMessage(`Lo siento, no puedo entender esto por el momento.`, senderId);
            } else {
                flag = await gs.getUserByMobileNumber(senderId);
            }

            if (flag == 0) {
                let reply = intentData.fulfillmentMessages.text.text[0];
                await wa.sendMessage(reply, senderId);
                setTimeout(async () => {
                    await wa.sendMessage(`dime, Cuál es tu nombre?`, senderId);
                }, 1000);
            } else {
                console.log('User came again.');
            }
        } else if (intentData.intent === 'User Provides Email') {
            let reply = intentData.fulfillmentMessages.text.text[0];
            let outputContext = intentData.outputContexts[0];
            let fields = outputContext.parameters.fields;
            let name = fields.person.structValue.fields.name.stringValue;
            let email = fields.email.stringValue;

            await gs.addNewRow({
                mobile: senderId,
                name: name,
                email: email
            });

            await wa.sendMessage(reply, senderId);

            setTimeout(async () => {
                await wa.sendMessage(LONG_MSG, senderId);
            }, TIME_INTERVAL);
        } else if (intentData.intent === 'User Provides Name') {
            let reply = intentData.fulfillmentMessages.text.text[0];
            await wa.sendMessage(reply, senderId);
        } else {
            await gs.updateRow(senderId, message);
        }
    }
});

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});