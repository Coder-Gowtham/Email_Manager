const { fetchEmailElasticBusiness } = require('../business-logic/fetchEmailElasticBusiness');
const { STATUS_CODE } = require('../constants/constants');
const { setSessionData, getSessionData } = require('../utils/sessionManager');

const fetchEmailElasticController = async (req, res) => {
  const { folder } = req.query;

  let sessionData = getSessionData();
  const { userMailBoxName } = sessionData || {};  // Safely extract userMailBoxName

  console.log(`ENTERING CONTROLLER | REQUEST: ${JSON.stringify(req.query)} || sessionData.userMailBoxName: ${JSON.stringify(userMailBoxName)}`);

  try {
    // Check if session data is empty or if userMailBoxName is missing
    if (!sessionData || !userMailBoxName) {
      console.log(`Session not found. Please log in again.`);

      const errResponse = {
        status: STATUS_CODE.RETRY_ERROR,
        message: `Session expired. Please log in again to continue.`,
        redirect_url: '/login',
      };
      return res.status(STATUS_CODE.RETRY_ERROR).json(errResponse); // Ensure proper status code
    }

    // Pass the query parameters and session data to the business logic function
    const result = await fetchEmailElasticBusiness(folder, userMailBoxName);

    console.log(`EMAILS FETCHED FROM DATABASE:`, result?.emails?.length || 0);

    // Respond with the fetched emails and additional data
    res.status(STATUS_CODE.SUCCESS).json(result);

  } catch (error) {
    console.log(`FAILED TO FETCH FROM DATABASE:`, error);

    // Create a detailed error response
    const errorResp = {
      status: error?.status || STATUS_CODE.DATABASE_ERROR,
      message: error?.message || 'Failed to fetch emails from the database.',
      error: error?.stack || error.message || 'Unknown error', // Include the stack trace for debugging
    };

    // Return the error response with the appropriate status code
    res.status(error?.status || STATUS_CODE.DATABASE_ERROR).json(errorResp);
  }
};

module.exports = { fetchEmailElasticController };
