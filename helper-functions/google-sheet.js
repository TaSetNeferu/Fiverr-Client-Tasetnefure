require('dotenv').config();

const { GoogleSpreadsheet } = require('google-spreadsheet');

// spreadsheet key is the long id in the sheets URL
const SHEET_ID = process.env.SHEET_ID;
const doc = new GoogleSpreadsheet(SHEET_ID);

// Credentials for the service account
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

const addNewRow = async (row) => {

    // use service account creds
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });

    await doc.loadInfo();

    let sheet = doc.sheetsByIndex[0];

    await sheet.addRow(row);
};

const updateRow = async (mobile, message) => {

    // use service account creds
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });

    await doc.loadInfo();

    let sheet = doc.sheetsByIndex[0];

    let rows = await sheet.getRows();

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        if (row.mobile === mobile) {
            if (row.message === undefined) {
                row.message = message;
                row.save();
                break;
            } else {
                let newMessage = `${row.message} ${message}`;
                row.message = newMessage;
                row.save();
                break;
            }
        }
    }
};

const getUserByMobileNumber = async (mobile) => {

    // use service account creds
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });

    await doc.loadInfo();

    let sheet = doc.sheetsByIndex[0];

    let rows = await sheet.getRows();

    let flag = 0;

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        if (row.mobile === mobile) {
            flag = 1;
        }
    }

    return flag;
};

module.exports = {
    addNewRow,
    updateRow,
    getUserByMobileNumber
}