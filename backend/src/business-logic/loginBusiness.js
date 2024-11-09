const { ENTERING_TO, BUSINESS_LOGIC, STATUS_CODE, ERROR_CODE } = require('../constants/constants');
const userService = require('../services/userService.js');
const bcrypt = require('bcrypt');
const { setSessionData, getSessionData } = require('../utils/sessionManager');

const loginUsersBusiness = async (reqBody, redirection) => {
    console.log(`${ENTERING_TO} ${BUSINESS_LOGIC} | loginUsersBusiness || ${JSON.stringify(reqBody)}`);

    const { email, password: enteredPassword } = reqBody; // Destructure password and assign it to enteredPassword
    let response = {};

    // Validate input
    if (!email || !enteredPassword) {
        redirection.condition = 'EMAIL_PASSWORD_ERROR';
        redirection.url = '/retry_login'; // Corrected URL typo
        response = {
            status: STATUS_CODE.RETRY_ERROR,
            message: 'Both Email and Password are required.',
            ...redirection
        };
        return response;
    }

    const userIndexName = 'user_accounts';
    
    try {
        const isUserExist = await userService.searchUser(email, userIndexName);
        console.log(`isUserExist | ${JSON.stringify(isUserExist)}`);

        if (!isUserExist) {
            redirection.condition = 'USER_NOT_EXIST';
            redirection.url = '/register';
            response = {
                status: STATUS_CODE.NOT_FOUND,
                message: 'User does not exist. Please try creating an account or sign in using OUTLOOK.',
                errorCode: ERROR_CODE.USER_NOT_FOUND,
                ...redirection
            };
            return response;

        } else if (isUserExist.password) {
            console.log(`USER ENTERED PWD : ${enteredPassword} || STORED PASSWORD : ${isUserExist.password}`);
            const storedHashedPassword = isUserExist.password;
            const isMatch = await bcrypt.compare(enteredPassword, storedHashedPassword); // Compare enteredPassword
            console.log(`Passwords match | isMatch: ${isMatch}`);

            if (isMatch) {
                setSessionData({ userId: isUserExist.user_id });
                response = {
                    status: STATUS_CODE.SUCCESS,
                    message: 'Login successful.',
                    ...redirection
                };
                return response;
            } else {
                redirection.condition = 'INCORRECT_PASSWORD';
                redirection.url = '/login';
                response = {
                    status: STATUS_CODE.UNAUTHORISED,
                    message: 'Incorrect password! Please try again.',
                    errorCode: ERROR_CODE.INCORRECT_PASSWORD,
                    ...redirection
                };
                return response;
            }
        }

        redirection.condition = 'RETRY_LOGIN';
        redirection.url = '/retry_login';

        response = {
            status: STATUS_CODE.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred.',
            errorCode: ERROR_CODE.UNEXPECTED_ERROR,
            ...redirection
        };
        return response;
        
    } catch (error) {
        console.error(`Error in loginUsersBusiness: ${error.message || error}`);
        response = {
            status: STATUS_CODE.DATABASE_ERROR,
            message: 'Failed to process login request.',
            errorCode: ERROR_CODE.DATABASE_ERROR,
            ...redirection
        };
        return response;
    }
};

module.exports = {
    loginUsersBusiness
};
