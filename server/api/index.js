// Entrada serverless da Vercel: reaproveita o app Express compilado (npm run build → dist/).
module.exports = require('../dist/app').default;
