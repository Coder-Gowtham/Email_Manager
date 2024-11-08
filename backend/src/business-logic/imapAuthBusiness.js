// Step 1: Graph API Authentication
const connectOutlookGraph = (req, res) => {
    const authorizationUri = oauth2.authorizeURL({
        redirect_uri: config.REDIRECT_URI,
        scope: [
            'https://graph.microsoft.com/User.Read',
            'https://graph.microsoft.com/Mail.Read',
            'offline_access'
        ].join(' '),
        response_type: 'code'
    });
    res.redirect(authorizationUri);
};

// Step 2: Handle callback for Graph API
const handleCallbackGraph = async (req, res) => {
    const { code } = req.query;
    try {
        // Retrieve Graph token
        const graphToken = await oauth2.getToken({ code, redirect_uri: config.REDIRECT_URI });
        req.session.graphToken = graphToken.token.access_token;
        req.session.refreshToken = graphToken.token.refresh_token;

        // Fetch user info
        const authUserInfo = (await getAuthUserInfo(req)).data;
        req.session.outlook_email = authUserInfo.mail;

        // After acquiring Graph token, redirect for IMAP authorization
        const imapAuthorizationUri = oauth2.authorizeURL({
            redirect_uri: config.REDIRECT_URI,
            scope: 'https://outlook.office.com/IMAP.AccessAsUser.All',
            response_type: 'code'
        });
        res.redirect(imapAuthorizationUri); // Redirect to request IMAP token
    } catch (error) {
        console.error('Error during Graph OAuth flow:', error);
        res.status(500).send('Authentication failed for Graph API');
    }
};

// Step 3: Handle Callback for IMAP Authorization
const handleCallbackIMAP = async (req, res) => {
    const { code } = req.query;
    try {
        // Retrieve IMAP token
        const imapToken = await oauth2.getToken({ code, redirect_uri: config.REDIRECT_URI });
        req.session.imapToken = imapToken.token.access_token;

        // Now you can proceed to your application’s main page
        res.redirect('/manager/users/allEmail');
    } catch (error) {
        console.error('Error during IMAP OAuth flow:', error);
        res.status(500).send('Authentication failed for IMAP');
    }
};

// Helper function to request IMAP token using the refresh token
const getIMAPToken = async (req) => {
    try {
        // Exchange refresh token for a new token with IMAP scope
        const tokenParams = {
            refresh_token: req.session.refreshToken,
            scope: 'https://outlook.office.com/IMAP.AccessAsUser.All',
            grant_type: 'refresh_token',
            redirect_uri: config.REDIRECT_URI
        };
        const imapTokenResponse = await oauth2.getToken(tokenParams);

        // Store IMAP token in session
        req.session.imapToken = imapTokenResponse.token.access_token;
        req.session.imapTokenExpiry = Date.now() + imapTokenResponse.token.expires_in * 1000;

    } catch (error) {
        console.error('Error requesting IMAP token:', error);
        throw new Error('Failed to acquire IMAP token');
    }
};

// Helper function to get user info from Graph API
const getAuthUserInfo = async (req) => {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
            Authorization: `Bearer ${req.session.graphToken}`
        }
    });
    return response.data;
};

