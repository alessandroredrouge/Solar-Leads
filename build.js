// build.js
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'app', 'static', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

configContent = configContent.replace('__GEOAPIFY_API_KEY__', process.env.GEOAPIFY_API_KEY || 'YOUR_LOCAL_API_KEY');

fs.writeFileSync(configPath, configContent);