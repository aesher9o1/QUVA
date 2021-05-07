module.exports = {
  apps: [
    {
      name: 'QCINE',
      script: 'dist/main.js',
      instances: 4,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
