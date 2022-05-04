import { Client, Intents, GuildMember, Message } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import Pandemic from "./pandemic/pandemic";
import { parseJson, readFile } from "./util";
import Logger from "./logger";
import { EMOJI } from "./constants";
import { AuthJson, ConfigJson } from "./types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const commands = require("../config/commands");

const { TOKEN } = parseJson(readFile("../config/auth.json")) as AuthJson;
const { CLIENT_ID } = parseJson(readFile("../config/config.json")) as ConfigJson;

const rest = new REST({ version: "9" }).setToken(TOKEN);

const log = new Logger();

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
        log.info(`Logged in as ${client.user.tag}!`);
    }
    // For now, make sure global commands are cleared if any found
    if (client.application) {
        log.info("Clearing any existing global application (/) commands.");
        client.application.commands.set([]);
    }
    log.info("------");
    log.info("Initial discorona outbreak imminent...");
    pandemic = new Pandemic();
    pandemic.addAll(client.guilds.cache.map(g => g));
    pandemic.getAll().forEach(async (outbreak) => {
        const guild = client.guilds.cache.get(outbreak.guildId);
        const owner = guild && await guild.fetchOwner();
        owner && outbreak.infect(owner.user);
    });
});

client.on("guildCreate", async (guild) => {
    try {
        log.info(`Started refreshing application (/) commands for guild: ${guild.id}.`);
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guild.id),
            { body: commands }
        );
        log.info("Successfully reloaded application (/) commands.");
        pandemic.add(guild);
        const outbreak = pandemic.get(guild.id);
        const owner = await guild.fetchOwner();
        outbreak && outbreak.infect(owner.user);
    } catch (err) {
        log.error(err);
    }
});

client.on("messageCreate", async (message) => {
    try {
        const user = message.author;
        if (message.guildId) {
            const outbreak = pandemic.get(message.guildId);
            // If user is social distancing, prevent the spread and end the distancing
            if (outbreak && outbreak.isDistanced(user.id, message.channelId)) {
                outbreak.endDistancing(user.id, message.channelId);
                return;
            }
            if (outbreak && outbreak.isInfected(user.id)) {
                await message.react(EMOJI.MICROBE);
                // If there is a previous message, spread the infection
                const LAST_MESSAGE_COUNT = 2;
                const messages = await message.channel.messages.fetch({ limit: LAST_MESSAGE_COUNT });
                if (messages.size === LAST_MESSAGE_COUNT) {
                    const lastMessage = messages.last() as Message;
                    outbreak.incubate(message, lastMessage);
                }
            }
        }
    } catch (err) {
        log.error(err);
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
            await interaction.reply({
                content: text,
                ephemeral: true
            });
        }
    }

    if (interaction.commandName === "cough") {
        const victim = interaction.options.getMentionable("victim") as GuildMember;
        if (interaction.guildId) {
            const outbreak = pandemic.get(interaction.guildId);
            let text: string;
            if (outbreak && outbreak.isVaccinated(victim.id)) {
                text = `${victim.user} is vaccinated against discorona. Too bad!`;
            } else {
                const result = outbreak && outbreak.cough(victim.user);
                text = result
                    ? `You have coughed on ${victim.user}. Gross!`
                    : `${victim.user} is already infected with discorona.`;
            }
            await interaction.reply({
                content: text,
                ephemeral: true
            });
        }
    }

    if (interaction.commandName === "distance") {
        if (interaction.guildId) {
            const outbreak = pandemic.get(interaction.guildId);
            const result = outbreak && outbreak.startDistancing(interaction.user.id, interaction.channelId);
            const text = result
                ? "You are now social distancing, your next message in this channel cannot spread the infection."
                : "You are already social distancing in this channel.";
            await interaction.reply({
                content: text,
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);
