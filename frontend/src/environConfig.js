// environConfig.js
const environment = process.env.NODE_ENV || 'dev';

const environConfig = {
  dev: {
    PORT: 'http://localhost:5000/',
    BACKEND_BASE_URL: process.env.DEV_BACKEND_BASE_URL
  },
  uat: {
    PORT: '',
    BACKEND_BASE_URL: process.env.UAT_BACKEND_BASE_URL

  }
};

module.exports = {
  environment,
  config: environConfig[environment],
};
