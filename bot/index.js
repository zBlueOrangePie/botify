require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const database = require('../utils/database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
    ],
    presence: {
        status: 'online',
        activities: [{
            name: 'Botify | /help',
            type: 3
        }]
    }
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();

// Load commands
const loadCommands = async () => {
    const categories = ['economy', 'leveling', 'moderation', 'music', 'fun', 'utility', 'giveaway', 'ticket', 'owner'];
    
    for (const category of categories) {
        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', category)).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            try {
                const command = require(`./commands/${category}/${file}`);
                if (command.name) client.commands.set(command.name, command);
                if (command.data) client.slashCommands.set(command.data.name, command);
                logger.info(`Loaded command: ${command.name} from ${category}`);
            } catch (error) {
                logger.error(`Error loading command ${file}:`, error);
            }
        }
    }
};

// Load events
const loadEvents = async () => {
    const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        try {
            const event = require(`./events/${file}`);
            const eventName = file.split('.')[0];
            
            if (event.once) {
                client.once(eventName, (...args) => event.execute(...args, client));
            } else {
                client.on(eventName, (...args) => event.execute(...args, client));
            }
            logger.info(`Loaded event: ${eventName}`);
        } catch (error) {
            logger.error(`Error loading event ${file}:`, error);
        }
    }
};

// Initialize
const init = async () => {
    try {
        await database.connect();
        await loadCommands();
        await loadEvents();
        await client.login(process.env.BOT_TOKEN);
        logger.info('✅ Botify is ready!');
    } catch (error) {
        logger.error('Failed to initialize bot:', error);
        process.exit(1);
    }
};

init();

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await database.disconnect();
    client.destroy();
    process.exit(0);
});
