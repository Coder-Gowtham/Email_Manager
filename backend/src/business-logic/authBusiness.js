// src/controllers/authController.js
const { authConfig, config } = require('../constants/environConfig');
const { AuthorizationCode } = require('simple-oauth2');
const { ENTERING_TO, BUSINESS_LOGIC, STATUS_CODE, ERROR_CODE } = require('../constants/constants');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { fetchEmailsOutlook, } = require('./fetchEmailBusiness');
const { storeNewEmails } = require('../services/userEmailService');
const { updateUserDetails } = require('../services/userService');
const { format } = require('date-fns');
const userService = require('../services/userService.js');
const { setSessionData, getSessionData } = require('../utils/sessionManager');


const oauthConfig = {
    client: {
        id: authConfig.CLIENT_ID,
        secret: authConfig.CLIENT_SECRET
    },
    auth: {
        tokenHost: authConfig.TOKEN_HOST,
        authorizePath: authConfig.AUTHORIZATION_PATH,
        tokenPath: authConfig.TOKEN_PATH
    }
};

const oauth2Client = new AuthorizationCode(oauthConfig);

const connectOutlook = (req, res) => {
    console.log(`${ENTERING_TO} connectOutlook`);
    const authorizationUri = oauth2Client.authorizeURL({
        redirect_uri: config.REDIRECT_URI,
        scope: 'openid https://outlook.office.com/IMAP.AccessAsUser.All offline_access',
        response_type: 'code',
        response_mode: 'query',
        prompt: 'consent'
    });

    res.json({ redirectUrl: authorizationUri });
};


const handleCallback = async (req, res) => {
    console.log(`${ENTERING_TO} ${BUSINESS_LOGIC} | handleCallback`,);
    const code = req.query.code;

    if (!code) {
        console.error('Authorization code missing from callback URL');
        return res.status(400).send('Authorization code missing');
    }
    try {

        const accessToken = await oauth2Client.getToken({
            code,
            redirect_uri: config.REDIRECT_URI,
            scope: 'openid https://outlook.office.com/IMAP.AccessAsUser.All offline_access',
        });
        console.log(`accessToken || ${JSON.stringify(accessToken)}`, accessToken);

        const idToken = accessToken?.token?.id_token;
        const decodedToken = jwt.decode(idToken);
        console.log(`decodedToken`, decodedToken?.preferred_username);
        const userName = decodedToken.preferred_username;
        if (userName) console.log(`userName : `, userName);
        else throw new Error("Unable to Fetch USER NAME");
        const userMailBoxName = `${userName}_mailbox`;
        const fetchUserId = await userService.searchUser(userName, 'user_accounts');
        console.log(`fetchUserId || ${fetchUserId}`);

        setSessionData({
            token: accessToken.token.access_token,
            refreshToken: accessToken.token.refresh_token,
            userName: userName,
            userId: getSessionData().userId || fetchUserId,
            userMailBoxName: userMailBoxName,
            tokenExpiry: Date.now() + accessToken.token.expires_in * 1000
        });

        let sessionData = getSessionData();
        console.log(`Check Session || `, sessionData);

        const updateUserInfo = await updateUserDetails(sessionData.userId || fetchUserId, sessionData.token, sessionData.userName, 'user_accounts');
        console.log(`updateUserInfo || `, updateUserInfo);

        const xoauth2Token = Buffer.from(`user=${userName}\x01auth=Bearer ${sessionData.token}\x01\x01`).toString('base64');
        const imapConfig = {
            user: process.env.USER_EMAIL,
            xoauth2: xoauth2Token,
            host: 'outlook.office365.com',
            port: 993,
            tls: true,
            timeout: 50000,
        };

        await fetchEmailsOutlook(imapConfig)
            .then(async (resultEmails) => {
                console.log(`Fetched emails:  ${JSON.stringify(resultEmails.length)}`);
                await storeNewEmails((sessionData.userMailBoxName || userMailBoxName), resultEmails, fetchUserId)
                    .then(result => {
                        console.log(`New Emails Successfully Synced with Database`, result);
                        console.log(`Fetched emails:  ${JSON.stringify(result)}`);
                        res.redirect('http://localhost:3000/connect-outlook-callback?status=success');
                    }).catch(storeEmailError => {
                        console.log(`Error while storing New Emails to Database`, storeEmailError);
                        throw new Error({
                            status: storeEmailError?.status || STATUS_CODE.DATABASE_ERROR,
                            message: 'Error while executing store emails!',
                            ERROR: JSON.stringify(storeEmailError)
                        });
                    })
            }).catch(fetchEmailError => {
                console.log(`Error while FETCHING New Emails from IMAP`, fetchEmailError);
                throw new Error({
                    status: fetchEmailError?.status || STATUS_CODE.FAILURE,
                    message: fetchEmailError?.message || 'Error while FETCHING New Emails from IMAP',
                    ERROR: JSON.stringify(fetchEmailError)
                });
            })

    } catch (error) {
        console.error('Error during OAuth flow:', error);
        let errorCode = error?.status || STATUS_CODE.INTERNAL_SERVER_ERROR
        let errMsg = error?.message || 'AUTHENTICATION FAILED'
        // res.status(errorCode).send(errMsg);
        res.redirect('http://localhost:3000/connect-outlook-callback?status=failure');

    }
};

async function refreshAccessToken(req) {
    console.log(`ENTERING REFRESH TOKEN LOGIC | refreshAccessToken`);
    let sessionData = getSessionData();

    if (Date.now() >= sessionData.tokenExpiry) {
        try {
            const tokenParams = {
                grant_type: 'refresh_token',
                refresh_token: sessionData.refreshToken
            };
            const accessToken = await oauth2Client.refresh(tokenParams);
            sessionData.token = accessToken.token.access_token;
            sessionData.refreshToken = accessToken.token.refresh_token;
            sessionData.tokenExpiry = Date.now() + accessToken.token.expires_in * 1000;
            console.log(`refreshAccessToken sessionData || `, sessionData);
        } catch (error) {
            console.error('Error refreshing access token:', error.message);
            throw new Error('Unable to refresh access token');
        }
    }
}

module.exports = { connectOutlook, handleCallback, refreshAccessToken };
