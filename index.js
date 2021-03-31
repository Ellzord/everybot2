require('dotenv').config();

const _ = require('lodash');
const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => console.log('everybot2 is ready'));

const cleanUpChannels = _.debounce(async () => { 

    console.log("cleaning up channels");

    const category = client.channels.resolve(process.env.DYNAMIC_ROOMS_CATEGORY_ID);
    if (!category) return;

    const channels = Array.from((await category.fetch()).children.values());

    for (const channel of channels) {

        if (channel.id === process.env.GIVE_ROOM_CHANNEL_ID || channel.id === process.env.DRAG_ME_IN_CHANNEL_ID) {
            continue;
        }
        
        if ((await channel.fetch()).members.size === 0) {
            await channel.delete().catch(ex => console.warn(`failed to delete channel ${channel.id}`, ex));
        }
    }
}, 300, { maxWait: 1500 });

client.on('voiceStateUpdate', async (oldState, newState) => {
    const guild = (newState ? newState : oldState).guild;
    if (!guild.available) return;

    const member = await (newState ? newState : oldState).member.fetch().catch(console.error);
    if (!member) return;

    if (newState && newState.channelID === process.env.GIVE_ROOM_CHANNEL_ID) {

        try {

            console.log(`creating channel for ${member.id}`);

            const basePermissions = ['VIEW_CHANNEL', 'CONNECT'];
            const ownerPermissions = basePermissions.concat('MOVE_MEMBERS', 'MANAGE_CHANNELS', 'MUTE_MEMBERS');

            const channelOptions = { 
                type: 'voice', 
                parent: process.env.DYNAMIC_ROOMS_CATEGORY_ID, 
                permissionOverwrites: [ { id: guild.id, allow: basePermissions }, { id: member.id, allow: ownerPermissions } ] 
            };

            const channel = await guild.channels.create(`${member.displayName}'s room`,  channelOptions);

            await member.voice.setChannel(channel);
    
            console.log(`channel created channel for ${member.id}`);
        } catch (ex) {
            console.error(`failed to create channel for ${member.id}`, ex)
        }
    }

    if (oldState && (!newState || newState.channelID !== oldState.channelID)) {
        cleanUpChannels();
    }
});

client.on('error', console.error);

client.on('warn', console.warn);

client.login(process.env.DISCORD_TOKEN);