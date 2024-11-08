// src/controllers/emailController.js
const { refreshAccessToken } = require('../business-logic/authBusiness');
const axios = require('axios');
const { htmlToText } = require('html-to-text');

const fetchEmail = async (req, res) => {
    try {
        await refreshAccessToken(req);
        const emailsWithFolders = await fetchEmails(req);
        res.json({ emails: emailsWithFolders });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).send('Failed to fetch emails');
    }
};

let folderCache = {};

async function getFolders(globalAccessToken) {
    try{

    
    if (Object.keys(folderCache).length === 0) {
        const headers = { Authorization: `Bearer ${globalAccessToken}` };
        const folderResponse = await axios.get('https://graph.microsoft.com/v1.0/me/mailFolders', { headers });
        folderCache = folderResponse.data.value.reduce((acc, folder) => {
            acc[folder.id] = folder.displayName;
            return acc;
        }, {});
    }
    return folderCache;
}catch(error){

}
}

async function fetchEmails(req) {
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.session.token}`,
        'outlook.body-content-type': 'text'
    };

    const folders = await getFolders(req.session.token);
    const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages', { headers });

    console.log(response);
    
    
    return response.data.value.map(email => ({
        id: email.id,
        subject: email.subject,
        receivedDateTime: email.receivedDateTime,
        sentDateTime: email.sentDateTime,
        sender: email.sender.emailAddress.address,
        from: email.from.emailAddress.address,
        toRecipients: email.toRecipients.map(recipient => recipient.emailAddress.address),
        webLink: email.webLink,
        isRead: email.isRead,
        isDraft: email.isDraft,
        folderName: folders[email.parentFolderId] || 'Unknown',
        preview: htmlToText(email.bodyPreview).replace(/(\+|\r|\n)/g, ' ').trim(),
        body: htmlToText(email.body.content).replace(/(\+|\r|\n)/g, ' ').trim()
    }));
}

module.exports = { fetchEmail };
