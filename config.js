const dotenv = require('dotenv');

// The default NODE_ENV value is 'local'
let nodeEnv = process.env.NODE_ENV || 'local';

// Load configuration from the correct .env file
dotenv.config({ path: `./src/environments/.env.${nodeEnv}` });

// If NODE_ENV has been mistakenly overwritten by dotenv, reset it
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = nodeEnv;
}

console.log("Running in " + process.env.NODE_ENV);
