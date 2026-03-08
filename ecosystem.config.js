/**
 * PM2 Ecosystem Configuration
 * Run: pm2 start ecosystem.config.js
 * 
 * Place this file in project root on AWS Lightsail
 */

module.exports = {
  apps: [
    {
      name: 'shadow-howl-api',
      script: './Backend/index.js',
      instances: 1,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Load from .env file
      "env_file": "./Backend/.env",
      
      // Logging
      error_file: '/tmp/shadow-howl-api-error.log',
      out_file: '/tmp/shadow-howl-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // File watching
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.env'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Clustering
      max_memory_restart: '1G',
      
      // Restart strategies
      exp_backoff_restart_delay: 100,
    }
  ],

  // Cluster automation
  deploy: {
    production: {
      user: 'ubuntu',
      host: '18.134.190.37',
      ref: 'origin/main',
      repo: 'your-repo-url',
      path: '/home/ubuntu/Shadow Howl',
      'post-deploy': 'npm install && pm2 restart ecosystem.config.js'
    }
  }
};
