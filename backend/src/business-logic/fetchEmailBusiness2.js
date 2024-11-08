// src/controllers/emailController.js
const { refreshAccessToken } = require('./authBusiness');
const axios = require('axios');
const { htmlToText } = require('html-to-text');
const userEmailService = require('../services/userEmailService2');
const { ENTERING_TO } = require('../constants/constants');

const fetchEmail = async (req, res) => {
    try {
        // Refresh access token only if needed
        if (!req.session.token || tokenNeedsRefresh(req)) {
            await refreshAccessToken(req);
        }

        // Fetch folders once and cache result
        const folders = req.session.folders || await getFolders(req.session.token);
        req.session.folders = folders;

        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${req.session.token}`,
            'outlook.body-content-type': 'text'
        };

        // Ensure the index is created once per session
        let userIndexNameId;
        if (req.session.userId) {
            userIndexNameId = req.session.userId;
            console.log(`userIndexNameId || ${userIndexNameId}`);
        } else {
            throw new Error("req.session.userId does not exist!");
        }

        const userIndexName = `outlook_emails_${userIndexNameId}`;
        if (!req.session.indexCreated) {
            const createUserEmailIndex = await userEmailService.createUserEmailIndex(userIndexName);
            console.log(`Index created: ${createUserEmailIndex.message}`);
            req.session.indexCreated = true;
        }

        // Fetch emails from Outlook
        const { data } = await axios.get('https://graph.microsoft.com/v1.0/me/messages', { headers });


        console.log(`Fetched emails count: ${data.value.length}`);

        const emailsWithFolders = data.value.map(email => mapEmailData(email, folders));

        await userEmailService.storeEmails(userIndexName, emailsWithFolders);

        res.json({ emails: emailsWithFolders });
    } catch (error) {
        console.error('Error fetching emails:', error.message || error);
        res.status(500).send('Failed to fetch emails');
    }
};

const mapEmailData = (email, folders) => ({
    id: email.id,
    subject: email.subject,
    receivedDateTime: email.receivedDateTime,
    sentDateTime: email.sentDateTime,
    sender: {
        name: email.sender?.emailAddress?.name,
        address: email.sender?.emailAddress?.address,
    },
    from: {
        name: email.from?.emailAddress?.name,
        address: email.from?.emailAddress?.address,
    },
    toRecipients: email.toRecipients.map(recipient => recipient.emailAddress.address),
    webLink: email.webLink,
    isRead: email.isRead,
    isDraft: email.isDraft,
    folderName: folders[email.parentFolderId] || 'Unknown',
    flag: email.flag?.flagStatus,
    preview: htmlToText(email.bodyPreview).replace(/(\+|\r|\n)/g, ' ').trim(),
    body: htmlToText(email.body.content).replace(/(\+|\r|\n)/g, ' ').trim()
});

const tokenNeedsRefresh = (req) => {
    const { tokenExpiry } = req.session;
    return !tokenExpiry || new Date() > new Date(tokenExpiry);
};

let folderCache = {};

async function getFolders(acessToken) {

    try {
        console.log(`${ENTERING_TO} | getFolders | FETCHING FOLDERS`);

        if (Object.keys(folderCache).length === 0) {
            const headers = { Authorization: `Bearer ${acessToken}` };
            const folderResponse = await axios.get('https://graph.microsoft.com/v1.0/me/mailFolders', { headers });
            folderCache = folderResponse.data.value.reduce((acc, folder) => {
                acc[folder.id] = folder.displayName;
                return acc;
            }, {});
        }
        console.log(`folderCache || `, folderCache);
        return folderCache;
    } catch (error) {
        console.error('Error fetching folders:', error);
        throw new Error(`Error fetching folders ${error?.message ? error.message : 'Something went wrong while fething the folders'}`);

    }
}

module.exports = { fetchEmail };
