module.exports = {
  apps : [{
    name: 'livesync',
    script: 'dist/main.js',
    instances: 1,
    autorestart: true,
    watch: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
