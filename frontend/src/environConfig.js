// environConfig.js
const environment = process.env.NODE_ENV || 'dev';

const environConfig = {
  dev: {
    PORT: process.env.PORT ,
    FRONTEND_URL: process.env.DEV_FRONTEND_URL,
    BACKEND_BASE_URL: process.env.DEV_BACKEND_BASE_URL
  },
  uat: {
    PORT: process.env.UAT_PORT,
    FRONTEND_URL: process.env.UAT_FRONTEND_URL,
    BACKEND_BASE_URL: process.env.UAT_BACKEND_BASE_URL

  }
};

const authConfig = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  TOKEN_HOST: process.env.TOKEN_HOST,
  AUTHORIZATION_PATH: process.env.AUTHORIZATION_PATH,
  TOKEN_PATH: process.env.TOKEN_PATH,
};

console.log('authConfig:', authConfig);

// Export the environment and the configuration
module.exports = {
  environment,
  config: environConfig[environment],
  authConfig
};
