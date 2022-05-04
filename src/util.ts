import { Client, AnyChannel, Guild, GuildMember, Collection, Channel, Message, TextChannel } from "discord.js";
import * as fs from "fs";
import { timeout } from "cron";
import path from "path";
import { TEXT_CHANNEL_TYPE, INFECTION_STAGE, MINIMUM_STAGE_LENGTH } from "./constants";
import Heuristics, { GuildHeuristics } from "./heuristics";
import { defaultLogger as log } from "./logger";
import { OutbreakState } from "./pandemic/outbreak";
import Pandemic from "./pandemic/pandemic";
import Storage from "./storage";

/**
 * Reads the file at the provided file path and returns stringified data.
 * 
 * @param {string} filePath relative path to the file
 * @returns {string} stringified data from file
 */
export const readFile = (filePath: string): string =>
    fs.readFileSync(path.join(__dirname, filePath), "utf-8");

/**
 * Parses the stringified data to a JSON object and logs any exceptions.
 * 
 * @param {string} dataJson 
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseJson = (dataJson: string): any => {
    try {
        return JSON.parse(dataJson);
    } catch (err) {
        log.error(`Failed to read JSON ${dataJson}`);
        throw err;
    }
};

/**
 * Finds a random number between 0 and the provided max, exclusive.
 * Example: rand(3) => 0 or 1 or 2
 * 
 * @param {number} max 
 * @returns 
 */
export const rand = (max: number) => Math.floor(Math.random() * Math.floor(max));

/**
 * Gets a channel from a Discord container by its ID.
 * 
 * @param {Guild|Client|GuildMember} container 
 * @param {string} channelId 
 * @returns {AnyChannel}
 */
export const getChannel = (container: Guild | Client | GuildMember, channelId: string): AnyChannel | void => {
    if (container instanceof GuildMember) {
        return container.guild.channels.cache.get(channelId);
    }
    return container.channels.cache.get(channelId);
};

/**
 * Gets the message history from a list of channels.
 * 
 * @param {Collection} channels
 * @param {number} after
 * @param {number} [limit]
 * @returns {Promise<Record<string, Collection>>}
 */
export const fetchMessageHistory = async (channels: Collection<string, Channel>, after: number, limit = 1000): Promise<Record<string, Collection<string, Message>>> => {
    const textChannels = channels
        .filter(channel => channel.type === TEXT_CHANNEL_TYPE) as Collection<string, TextChannel>;
    const messageHistory: Record<string, Collection<string, Message>> = {};
    await Promise.all(textChannels.map(async (channel) => {
        let messages = await channel.messages.fetch();
        const fetchMessages = async (before?: string) => {
            // If collected messages greater than hard maximum, abort
            if (messages.size >= limit) {
                return;
            }
            const page = await channel.messages.fetch({ before });
            // If nothing was fetched, abort
            if (!page.size) {
                return;
            }
            const firstMessage = page.first() as Message;
            // If the most recent message is after the date limit, abort
            if (firstMessage.createdTimestamp <= after) {
                return;
            }
            messages = messages.concat(page);
            const lastMessage = page.last() as Message;
            await fetchMessages(lastMessage.id);
        };
        if (messages.size) {
            // Recursively call fetchMessages, starting from the last message
            const lastMessage = messages.last() as Message;
            await fetchMessages(lastMessage.id);
            // Add the channel's message history to the result object
            messageHistory[channel.id] = messages;
        }
    }));
    return messageHistory;
};

export const runStorageInterval = async (storage: Storage, pandemic: Pandemic): Promise<void> => {
    const THIRTY_SECONDS = 30000;
    setInterval(() => {
        const outbreaks = pandemic.getAll();
        const serializableState: Record<string, OutbreakState> = {};
        outbreaks.forEach((outbreak) => {
            serializableState[outbreak.guildId] = outbreak.getState();
        });
        storage.write(serializableState);
    }, THIRTY_SECONDS);
};

export const runStateCheck = async (heuristics: Record<string, Heuristics>, pandemic: Pandemic): Promise<void> => {
    const outbreaks = pandemic.getAll();
    await Promise.all(outbreaks.map(async (outbreak) => {
        const guildHeuristics = heuristics[outbreak.guildId];
        const {
            minimumActiveUsers
        } = guildHeuristics.getHeuristics() as GuildHeuristics;
        const timeInStage = Date.now() - outbreak.stageSetTimestamp;
        // If in outbreak stage and infected count goes above the
        // minimum active users count
        if (
            outbreak.getStage() === INFECTION_STAGE.OUTBREAK
            && timeInStage >= MINIMUM_STAGE_LENGTH.OUTBREAK
            && outbreak.getInfected().length >= minimumActiveUsers
        ) {
            outbreak.setStage(INFECTION_STAGE.CONTAINMENT);
            return;
        }
        // If in containment stage and infected count goes below 50%
        // of the minimum active users count
        if (
            outbreak.getStage() === INFECTION_STAGE.CONTAINMENT
            && timeInStage >= MINIMUM_STAGE_LENGTH.CONTAINMENT
            && outbreak.getInfected().length <= (minimumActiveUsers / 2)
        ) {
            outbreak.setStage(INFECTION_STAGE.MUTATION);
            return;
        }
        // If in mutation stage and infected count goes below 25% or
        // above 150% of the minimum active users count
        if (
            outbreak.getStage() === INFECTION_STAGE.MUTATION
            && timeInStage >= MINIMUM_STAGE_LENGTH.MUTATION
            && (outbreak.getInfected().length <= (minimumActiveUsers / 4)
            || outbreak.getInfected().length >= (minimumActiveUsers * 1.5))
        ) {
            outbreak.setStage(INFECTION_STAGE.PANDEMIC);
            return;
        }
        // If in pandemic stage, start checking for win/loss conditions
        if (
            outbreak.getStage() === INFECTION_STAGE.PANDEMIC
            && timeInStage >= MINIMUM_STAGE_LENGTH.PANDEMIC
        ) {
            log.info("Outbreak is now in a pandemic state!");
        }
    }));
};

export const getReadableDateFromCronTime = (cronTime: string | Date | moment.Moment): string => {
    return new Date(Date.now() + timeout(cronTime)).toLocaleString();
};
