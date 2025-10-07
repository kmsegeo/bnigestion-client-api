module.exports = {
    apps: [{
        name: "bnigestion-api-client",
        script: "server.js",
        // instances: "max",
        // exec_mode: "cluster",
        watch: false,
        max_memory_restart: "512M",
        env: {
            NODE_ENV: "development",
            PORT: 3002
        },
        env_production: {
            NODE_ENV: "production",
            PORT: 3002
        },
        log_date_format: "YYYY-MM-DD HH:mm Z"
    }],

    deploy: {
        production: {
        user: "root",
        host: "192.168.20.38",
        ref: "origin/main",
        repo: "https://github.com/kmsegeo/bnigestion-client-api.git",
        path: "/home/mybank/bnigestion/bnigestion-client-api",
        "pre-deploy-local": "",
        "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
        "pre-setup": ""
        }
    }
};