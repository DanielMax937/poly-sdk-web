/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'poly-sdk-web',
      script: 'npm',
      args: ['run', 'dev'],
      cwd: __dirname,
      env: {
        PORT: process.env.PORT || 3020,
        NODE_OPTIONS: '--dns-result-order=ipv4first',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
    },
  ],
};
