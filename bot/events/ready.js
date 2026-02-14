const { ActivityType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        logger.info(`✅ Logged in as ${client.user.tag}`);
        
        // Rotating status
        const statuses = [
            { name: 'Botify | /help', type: ActivityType.Watching },
            { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
            { name: 'with your settings', type: ActivityType.Playing },
            { name: 'dashboard.botify.xyz', type: ActivityType.Streaming, url: 'https://twitch.tv/botify' }
        ];
        
        let i = 0;
        setInterval(() => {
            const status = statuses[i];
            client.user.setActivity(status.name, { type: status.type, url: status.url });
            i = (i + 1) % statuses.length;
        }, 10000);
        
        // Register slash commands
        const commands = client.slashCommands.map(cmd => cmd.data.toJSON());
        
        if (process.env.NODE_ENV === 'production') {
            await client.application.commands.set(commands);
            logger.info(`Registered ${commands.length} global slash commands`);
        }
    }
};
