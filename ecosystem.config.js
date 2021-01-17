module.exports = {
    apps: [
        {
            name: 'mdw-be',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
