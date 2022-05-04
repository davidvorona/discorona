import { Client, AnyChannel, Guild, GuildMember, Collection, Channel, Message, TextChannel } from "discord.js";
import * as fs from "fs";
import path from "path";
import { TEXT_CHANNEL_TYPE } from "./constants";
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
