import { Client, Intents, GuildMember } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import Pandemic from "./pandemic/Pandemic";
import { parseJson, readFile } from "./util";
import { EMOJI } from "./constants";
import { AuthJson, ConfigJson } from "./types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const commands = require("../config/commands");

const { TOKEN } = parseJson(readFile("../config/auth.json")) as AuthJson;
const { CLIENT_ID } = parseJson(readFile("../config/config.json")) as ConfigJson;

const rest = new REST({ version: "9" }).setToken(TOKEN);

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
    console.log("Initial discorona outbreak imminent...");
    pandemic = new Pandemic();
    pandemic.addAll(client.guilds.cache.map(g => g.id));
    pandemic.getAll().forEach((outbreak) => {
        const guild = client.guilds.cache.get(outbreak.guildId);
        guild && outbreak.infect(guild.ownerId);
    });
});

client.on("guildCreate", async (guild) => {
    try {
        console.log(`Started refreshing application (/) commands for guild: ${guild.id}.`);
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guild.id),
            { body: commands }
        );
        console.log("Successfully reloaded application (/) commands.");
        pandemic.add(guild.id);
        const outbreak = pandemic.get(guild.id);
        outbreak && outbreak.infect(guild.ownerId);
    } catch (err) {
        console.error(err);
    }
});

client.on("messageCreate", async (message) => {
    const user = message.author;
    if (message.guildId) {
        const outbreak = pandemic.get(message.guildId);
        if (outbreak && outbreak.getInfected().includes(user.id)) {
            message.react(EMOJI.MICROBE);
            const messages = await message.channel.messages.fetch({ limit: 2 });
            const lastMessage = messages.last();
            outbreak.incubate(message, lastMessage);
        }
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "ping") {
        await interaction.reply("pong!");
    }

    if (interaction.commandName === "vaccinate") {
        const infected = interaction.options.getMentionable("infected") as GuildMember;
        if (interaction.guildId) {
            const outbreak = pandemic.get(interaction.guildId);
            outbreak && outbreak.vaccinate(infected.id);
            interaction.reply({
                content: `You have vaccinated ${infected.user} against infection.`,
                ephemeral: true
            });
        }
    }

    if (interaction.commandName === "cough") {
        const victim = interaction.options.getMentionable("victim") as GuildMember;
        if (interaction.guildId) {
            const outbreak = pandemic.get(interaction.guildId);
            outbreak && outbreak.cough(victim.id);
            interaction.reply({
                content: `You have coughed on ${victim.user}. Gross!`,
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);
