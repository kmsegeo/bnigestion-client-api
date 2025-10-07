require('dotenv').config();

module.exports = {
    apps: [{
        name: "bnigestion-api-client",
        script: "server.js",
        instances: "1",
        exec_mode: "cluster",
        watch: false,
        max_memory_restart: "512M",
        env: {
            NODE_ENV: "development",
            PORT: process.env.PORT || 3002
        },
        env_production: {
            NODE_ENV: "production",
            PORT: process.env.PORT || 3002
        },
        log_date_format: "YYYY-MM-DD HH:mm Z"
    }],

    deploy: {
        production: {
        user: process.env.SERVER_USER,
        host: process.env.SERVER_HOST,
        ref: process.env.GIT_BRANCH,
        repo: process.env.GIT_REPOSITORY,
        path: process.env.SERVER_PATH,
        "pre-deploy-local": "",
        "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
        "pre-setup": ""
        }
    }
};