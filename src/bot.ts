import { Client, Intents, GuildMember, Message } from "discord.js";
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
            // If there is a previous message, spread the infection
            const LAST_MESSAGE_COUNT = 2;
            const messages = await message.channel.messages.fetch({ limit: LAST_MESSAGE_COUNT });
            if (messages.size === LAST_MESSAGE_COUNT) {
                const lastMessage = messages.last() as Message;
                outbreak.incubate(message, lastMessage);
            }
        }
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "ping") {
        await interaction.reply("pong!");
    }

    if (interaction.commandName === "vaccinate") {
        const patient = interaction.options.getMentionable("patient") as GuildMember;
        if (interaction.guildId) {
            const outbreak = pandemic.get(interaction.guildId);
            const result = outbreak && outbreak.vaccinate(patient.id);
            const text = result
                ? `You have vaccinated ${patient.user} against infection. How responsible!`
                : `${patient.user} is already vaccinated!`; 
            interaction.reply({
                content: text,
                ephemeral: true
            });
        }
    }

    if (interaction.commandName === "cough") {
        const victim = interaction.options.getMentionable("victim") as GuildMember;
        if (interaction.guildId) {
            const outbreak = pandemic.get(interaction.guildId);
            if (outbreak && outbreak.getVaccinated().includes(victim.id)) {
                interaction.reply({
                    content: `${victim.user} is vaccinated against discorona. Too bad!`,
                    ephemeral: true
                });
                return;
            }
            const result = outbreak && outbreak.cough(victim.id);
            const text = result
                ? `You have coughed on ${victim.user}. Gross!`
                : `${victim.user} is already infected with discorona.`;
            interaction.reply({
                content: text,
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);
