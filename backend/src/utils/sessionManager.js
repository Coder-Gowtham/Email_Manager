let sessionData = {};

const setSessionData = (data) => {
    sessionData = { ...sessionData, ...data };
};

const getSessionData = () => {
    console.log(`SESSION DATA : ${sessionData}`)
    return sessionData;
};

module.exports = { setSessionData, getSessionData };
