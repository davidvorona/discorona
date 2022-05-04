import { Client, Intents, GuildMember, Message } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import Pandemic from "./pandemic/pandemic";
import { parseJson, readFile, runStorageInterval } from "./util";
import { defaultLogger as log } from "./logger";
import { EMOJI } from "./constants";
import { AuthJson, ConfigJson } from "./types";
import Heuristics from "./heuristics";
import Storage from "./storage";
import { OutbreakState } from "./pandemic/outbreak";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const commands = require("../config/commands");

const { TOKEN } = parseJson(readFile("../config/auth.json")) as AuthJson;
const { CLIENT_ID } = parseJson(readFile("../config/config.json")) as ConfigJson;

const rest = new REST({ version: "9" }).setToken(TOKEN);

const storage = new Storage("./state.json");
const serializedState = storage.read() as Record<string, OutbreakState>;

const guildHeuristics: Record<string, Heuristics> = {};
let pandemic: Pandemic;

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

// On ready, state is restored from storage
// Heuristics are (re)generated for each guild
// Outbreaks are created for each guild, using data from state to hydrate
// Every 9am and 9pm outbreak state is checked for a stage change or end state

client.on("ready", async () => {
    try {
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
        await Promise.all(client.guilds.cache.map(async (guild) => {
            // Get state for the guild if exists
            const state = serializedState[guild.id];
            // Generate heuristics for the guild
            const heuristics = new Heuristics(guild);
            await heuristics.loadHeuristics();
            guildHeuristics[guild.id] = heuristics;
            // Create an outbreak for the guild
            pandemic.add(guild, state);
            // Infect the owner if necessary to start the infection
            const owner = await guild.fetchOwner();
            const outbreak = pandemic.get(guild.id);
            if (outbreak && !outbreak.getInfected().length) {
                outbreak.infect(owner.user);
            }
        }));
        // Once outbreaks have been created for each guild, begin
        // periodically saving state to storage
        runStorageInterval(storage, pandemic);
    } catch (err) {
        log.error(err);
    }
});

client.on("guildCreate", async (guild) => {
    try {
        log.info(`Started refreshing application (/) commands for guild: ${guild.id}.`);
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guild.id),
            { body: commands }
        );
        log.info("Successfully reloaded application (/) commands.");
        const state = serializedState[guild.id];
        pandemic.add(guild, state);
        const outbreak = pandemic.get(guild.id);
        const owner = await guild.fetchOwner();
        if (outbreak && outbreak.canInfect(owner.user.id)) {
            outbreak.infect(owner.user);
        }
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
                    outbreak.incubate({
                        channelId: message.channelId,
                        messageId: message.id,
                        createdTimestamp: message.createdTimestamp,
                        lastMessageId: lastMessage.id
                    });
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
