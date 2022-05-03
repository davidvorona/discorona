import { Client, Intents } from "discord.js";
import Pandemic from "./pandemic/Pandemic";
import { parseJson, readFile } from "./util";
import { EMOJI } from "./constants";
import { AuthJson } from "./types";

const { TOKEN } = parseJson(readFile("../config/auth.json")) as AuthJson;

let pandemic: Pandemic;

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

client.on("ready", () => {
    if (client.user) {
        console.log(`Logged in as ${client.user.tag}!`);
    }
    // For now, make sure global commands are cleared if any found
    if (client.application) {
        console.warn("Clearing any existing global application (/) commands.");
        client.application.commands.set([]);
    }
    console.log("------");
    console.log("Initial discorona outbreak imminent...")
    pandemic = new Pandemic();
    pandemic.addAll(client.guilds.cache.map(g => g.id));
    pandemic.getAll().forEach((outbreak) => {
        const guild = client.guilds.cache.get(outbreak.guildId);
        guild && outbreak.infect(guild.ownerId);
    });
});

client.on("guildCreate", (guild) => {
    pandemic.add(guild.id);
    const outbreak = pandemic.get(guild.id);
    outbreak && outbreak.infect(guild.ownerId);
});

client.on("messageCreate", async (message) => {
    const user = message.author;
    if (message.guildId) {
        const outbreak = pandemic.get(message.guildId);
        if (outbreak && outbreak.getInfected().includes(user.id)) {
            message.react(EMOJI.MICROBE);
            const messages = await message.channel.messages.fetch({ limit: 2 });
            const lastMessage = messages.last();
            outbreak.spread(message, lastMessage);
        }
    }
});

client.login(TOKEN);
