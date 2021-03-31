require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('everybot2 is ready');
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const guild = (!newState ? oldState : oldState).guild;
    if (!guild.available) return;

    const member = await (!newState ? oldState : oldState).member.fetch().catch(console.error);
    if (!member) return;

    if (newState && newState.channelID === process.env.GIVE_ROOM_CHANNEL_ID) {

        const basePermissions = ['VIEW_CHANNEL', 'CONNECT'];
        const ownerPermissions = basePermissions.concat('MOVE_MEMBERS', 'MANAGE_CHANNELS', 'MUTE_MEMBERS');

        try {

            console.log(`creating channel for ${member.id}`);

            const channel = await guild.channels.create(`${member.displayName}'s room`,  { type: 'voice', parent: process.env.DYNAMIC_ROOMS_CATEGORY_ID, permissionOverwrites: [ { id: guild.id, allow: basePermissions }, { id: member.id, allow: ownerPermissions } ] });

            await member.voice.setChannel(channel);
    
            console.log(`channel created channel for ${member.id}`);
        } catch (ex) {
            console.error(`failed to create channel for ${member.id}`, ex)
        }
    }

    const staticChannels = [process.env.GIVE_ROOM_CHANNEL_ID, process.env.DRAG_ME_IN_CHANNEL_ID];

    if (oldState && !staticChannels.includes(oldState.channelID) && (!newState || newState.channelID !== oldState.channelID)) {

        console.log("cleaning up channels");

        const category = guild.channels.resolve(process.env.DYNAMIC_ROOMS_CATEGORY_ID);
        if (!category) return;

        Array
          .from(category.children.filter(channel => !staticChannels.includes(channel.id) && channel.members.size === 0).values())
          .forEach(channel => {
              channel
                .delete()
                .then(() => console.log(`channel ${channel.id} deleted`))
                .catch(ex => console.error(`failed to delete channel ${channel.id}`, ex));
          });
    }
});


client.login(process.env.DISCORD_TOKEN);