const loginBusiness = require('../business-logic/loginBusiness');
const { ENTERING_TO, CONTROLLER, STATUS_CODE } = require('../constants/constants');

const loginUser = async (req, res) => {
    console.log(`${ENTERING_TO} ${CONTROLLER} | loginUser || ${JSON.stringify(req.body)}`);

    const redirection = {
        currentPageName: req.body.currentPageName,
        condition: 'LOGIN_SUCCESS',
        url: '/connect-outlook'
    };

    try {
        const reqBody = req.body;
        const loginUserResp = await loginBusiness.loginUsersBusiness(reqBody, redirection, req);
        console.log(`loginUserResp || ${JSON.stringify(loginUserResp)}`);

        if (loginUserResp?.status !== STATUS_CODE.SUCCESS) {
            throw new Error("Login failed. Please try again later.");
        }
        return res.status(200).json({
            status: loginUserResp.status,
            message: 'Login successful',
            ...redirection
        });
    } catch (error) {
        console.error(`ERROR CAUGHT IN CONTROLLER || ${error.message}`);
        const errorResponse = {
            status: error.status || 500,
            message: error.message || 'An error occurred. Please try again later.'
        };
        return res.status(errorResponse.status).json(errorResponse);
    }
};

module.exports = {
    loginUser,
};
