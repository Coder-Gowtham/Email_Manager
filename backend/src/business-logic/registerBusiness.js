const { ENTERING_TO, BUSINESS_LOGIC, STATUS_CODE, ERROR_CODE } = require('../constants/constants');
const userService = require('../services/userService.js');
const bcrypt = require('bcrypt'); // Ensure bcrypt is imported
const ShortUniqueId = require('short-uuid');
const { setSessionData, getSessionData } = require('../utils/sessionManager');

const registerUsersBusiness = async (reqBody, redirection, req) => {
    console.log(`${ENTERING_TO} ${BUSINESS_LOGIC} | registerUsersBusiness || ${JSON.stringify(reqBody)}`);

    const { email, password, confirmPassword } = reqBody;
    let response = {};

    // Validate input
    if (!email || !password) {
        redirection.condition = 'EMAIL_PASSWORD_ERROR';
        redirection.url = '/register';
        response = {
            status: STATUS_CODE.RETRY_ERROR,
            message: 'Both Email and Password are required.',
            errorCode: ERROR_CODE.EMAIL_PASSWORD_MISSING,
            ...redirection
        };
        return response;
    } else if (password !== confirmPassword) {
        redirection.condition = 'PASSWORD_MISMATCH';
        redirection.url = '/register';
        response = {
            status: STATUS_CODE.RETRY_ERROR,
            message: 'Passwords do not match.',
            errorCode: ERROR_CODE.PASSWORD_MISMATCH,
            ...redirection
        };
        return response;
    }

    const userIndexName = 'user_accounts';
    const isUserExist = await userService.searchUser(email, userIndexName);
    console.log(`isUserExist | ${JSON.stringify(isUserExist)}`);

    if (isUserExist) {
        redirection.condition = 'USER_EXIST';
        redirection.url = '/login';
        response = {
            status: STATUS_CODE.RETRY_ERROR,
            message: 'User already exists. Please try Logging in.',
            errorCode: ERROR_CODE.USER_EXIST,
            ...redirection
        };
        return response;
    }

    // Creating a unique user_id
    const translator = ShortUniqueId();
    const generateUniqueId = () => {
        return translator.new();
    };
    const userId = generateUniqueId();
    console.log(`Generated User ID: ${userId}`);
    setSessionData({userId : userId})

    //hashing and salting the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`Encrypted Password: ${hashedPassword}`);

    const createUser = await userService.createUser(userId, email, hashedPassword, userIndexName);
    console.log(`createUser | USER SUCCESSFULLY CREATED | ${JSON.stringify(createUser)}`);

    if (createUser) {
        redirection.condition = 'USER_SUCCESSFULLY_CREATED';
        redirection.url = '/oauth_login';
        response = {
            status: STATUS_CODE.SUCCESS,
            message: 'User successfully created.',
            errorCode: ERROR_CODE.USER_CREATED,
            ...redirection
        };
        return response;
    } else {
        redirection.condition = 'REGISTRATION_FAILED';
        redirection.url = '/register';
        errorResponse = {
            status: STATUS_CODE.RETRY_ERROR,
            message: 'Registration failed. Please try again.',
            errorCode: ERROR_CODE.REGISTRATION_FAILED,
            ...redirection
        };
        throw errorResponse;
    }
};

module.exports = {
    registerUsersBusiness
};
