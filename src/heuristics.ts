import { Guild } from "discord.js";
import Logger from "./logger";
import { fetchMessageHistory } from "./util";

interface GuildHeuristics {
    minimumActiveUsers: number;
    uniqueActiveUsers: string[];
    channelMessageCounts: Record<string, number>;
}

export default class Heuristics {
    guildId: string;

    private guild: Guild;
    
    log: Logger;

    heuristics?: GuildHeuristics;

    constructor(guild: Guild) {
        this.guildId = guild.id;
        this.guild = guild;
        this.log = new Logger(this.guildId);
    }

    async loadHeuristics() {
        const TWO_WEEKS = 1000 * 60 * 60 * 24 * 7 * 2;
        const after = Date.now() - TWO_WEEKS;
        // Fetch all messages in channel in the past two weeks
        const channelMessages = await fetchMessageHistory(this.guild.channels.cache, after);
        const uniqueActiveUsers: string[] = [];
        const channelMessageCounts: Record<string, number> = {};
        Object.keys(channelMessages).forEach((channelId) => {
            const messages = channelMessages[channelId];
            // Record channel message counts
            channelMessageCounts[channelId] = messages.size;
            messages.forEach((message) => {
                if (uniqueActiveUsers.indexOf(message.author.id) === -1) {
                    // Record unique users in array
                    uniqueActiveUsers.push(message.author.id);
                }
            });
        });
        // Get minimum active users count from unique users array
        const minimumActiveUsers = uniqueActiveUsers.length;

        this.heuristics = {
            minimumActiveUsers,
            uniqueActiveUsers,
            channelMessageCounts
        };
        this.log.info("Heuristics:", this.heuristics);
    }

    getHeuristics = () => this.heuristics;
}
