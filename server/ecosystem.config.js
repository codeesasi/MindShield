module.exports = {
    apps: [{
        name: 'content-blocker-server',
        script: 'index.js',
        cwd: 'd:/Extension/server',
        watch: false,
        autorestart: true,
        max_restarts: 10,
        env: {
            NODE_ENV: 'production',
            PORT: 3001,
            MONGO_URI: 'mongodb://localhost:27017/content-blocker'
        }
    }]
};
