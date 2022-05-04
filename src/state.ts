import { Guild } from "discord.js";
import Logger from "./logger";
import { fetchMessageHistory } from "./util";
import { INFECTION_STAGE } from "./constants";

interface GuildHeuristics {
    minimumActiveUsers: number;
    uniqueActiveUsers: string[]
}

export default class State {
    guildId: string;

    private guild: Guild;

    stage: string;
    
    log: Logger;

    heuristics?: GuildHeuristics;

    constructor(guild: Guild) {
        this.guildId = guild.id;
        this.guild = guild;
        this.stage = INFECTION_STAGE.OUTBREAK;
        this.log = new Logger(this.guildId);
    }

    validateStage(stage: string) {
        return Object.values(INFECTION_STAGE).includes(stage);
    }

    getStage = (): string => this.stage;

    setStage(stage: string) {
        if (!this.validateStage(stage)) {
            throw new Error("Invalid stage: " + stage);
        }
        this.stage = stage;
    }

    async getGuildHeuristics() {
        const TWO_WEEKS = 1000 * 60 * 60 * 24 * 7 * 2;
        const after = Date.now() - TWO_WEEKS;
        // Fetch all messages in channel in the past two weeks
        const channelMessages = await fetchMessageHistory(this.guild.channels.cache, after);
        const uniqueActiveUsers: string[] = [];
        channelMessages.forEach((messages) => {
            messages.forEach((message) => {
                if (uniqueActiveUsers.indexOf(message.author.id) === -1) {
                    uniqueActiveUsers.push(message.author.id);
                }
            });
        });
        const minimumActiveUsers = uniqueActiveUsers.length;

        this.heuristics = {
            minimumActiveUsers,
            uniqueActiveUsers
        };
        this.log.info("Heuristics:", this.heuristics);
    }
}
