// Requiered Packages
const dialogflow = require('dialogflow');
require('dotenv').config();

// Your credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

// Your google dialogflow project-id
const projectId = CREDENTIALS.project_id;

// Configuration for the client
const config = {
    credentials: {
        private_key: CREDENTIALS['private_key'],
        client_email: CREDENTIALS['client_email']
    }
}

// Create a session client
const sessionClient = new dialogflow.SessionsClient(config);

// Create a context client
const contextsClient = new dialogflow.v2.ContextsClient(config);

const detectIntent = async (queryText, languageCode, senderId) => {

    // Create a sessionPath for the senderId
    let sessionPath = sessionClient.sessionPath(projectId, senderId);

    let request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: queryText,
                languageCode: languageCode,
            }
        }
    };

    try {
        let response = await sessionClient.detectIntent(request);
        let intent = response[0]['queryResult']['intent']['displayName'];
        let fulfillmentMessages = response[0]['queryResult']['fulfillmentMessages'][0];
        let outputContexts = response[0]['queryResult']['outputContexts'];

        return {
            'intent': intent,
            'fulfillmentMessages': fulfillmentMessages,
            'outputContexts': outputContexts
        };
    } catch (error) {
        console.log(`Error at detectIntent --> ${error}`);
    }
};

const setContext = async (senderId, contextName, lifespanCount) => {

    let formattedParent = contextsClient.sessionPath(projectId, senderId);

    let context = {
        name: `${formattedParent}/contexts/${contextName}`,
        lifespanCount: lifespanCount
    };

    let request = {
        parent: formattedParent,
        context: context,
    };

    try {
        await contextsClient.createContext(request);
        return {
            status: 1
        }
    } catch (error) {
        console.log(`Error at setContext --> ${error}`);
    }
};

const deleteContext = async (senderId, contextName) => {

    let formattedName = contextsClient.contextPath(projectId, senderId, contextName);

    try {
        await contextsClient.deleteContext({ name: formattedName });
    } catch (error) {
        console.log(`Error at deleteContext --> ${error}`);
    }
}

module.exports = {
    detectIntent,
    setContext,
    deleteContext
}