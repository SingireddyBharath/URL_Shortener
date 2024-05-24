const dotenv = require('dotenv')
const environment = process.env.NODE_ENV || 'local';
console.log("Running in " + environment)
dotenv.config({ path: `./src/environments/.env.${environment.trim()}` });