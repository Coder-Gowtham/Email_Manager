    const registerBusiness = require('../business-logic/registerBusiness');
    const { ENTERING_TO, CONTROLLER } = require('../constants/constants');

    const registerUser = async (req, res) => {
        console.log(`${ENTERING_TO} ${CONTROLLER} | registerUser || ${JSON.stringify(req.body)}`);

        let redirection = {
            currentPageName : req.body.currentPageName,
            condition: 'REGISTRATION_SUCCESS',
            url: '/oAuth/login'
        }

        try {
            const reqBody = req.body;
            const registerUserResp = await registerBusiness.registerUsersBusiness(reqBody, redirection, req);
            console.log(`registerUserResp || ${JSON.stringify(registerUserResp)}`);

            const finalResponse = {
                status: registerUserResp?.status,
                message: registerUserResp?.message,
                ...registerUserResp
            };

            console.log(`finalResponse || ${JSON.stringify(finalResponse)}`);

            return res.status(200).send(finalResponse);
        } catch (error) {
            console.log(`ERROR CAUGHT IN CONTROLLER || ${JSON.stringify(error)}`);
        
            const errorResponse = {
                status: error?.status || 500,
                message: error?.message || "Something went wrong! Please try again after some time."
            };
            return res.status(errorResponse.status).send(errorResponse);
        }
    };

    module.exports = {
        registerUser,
    };