import { Guild, Message, User } from "discord.js";
import { EMOJI } from "../constants";
import Spreader from "./spreader";
import Logger from "../logger";

export default class Outbreak {
    guildId: string;

    guild: Guild;

    log: Logger;

    private infected: string[] = [];

    private vaccinated: string[] = [];

    private spreaders: Spreader[] = [];

    private distanced: Record<string, string[]> = {};

    constructor(guild: Guild) {
        this.guildId = guild.id;
        this.guild = guild;
        this.log = new Logger(this.guildId);
        this.log.info("Discorona has spread to guild", this.guildId);
    }

    getInfected = () => this.infected;

    isInfected = (userId: string) => this.infected.includes(userId);

    private canInfect = (userId: string) => !this.isInfected(userId) && !this.isVaccinated(userId);

    async infect(user: User) {
        this.infected.push(user.id);
        const dmChannel = await user.createDM();
        await dmChannel.send(`You have been infected with discorona in ${this.guild}...`);
        this.log.info("Discorona has infected user", user.id);
    }

    cough(user: User): boolean {
        if (this.canInfect(user.id)) {
            this.infect(user);
            return true;
        }
        return false;
    }

    getSpreaders = () => this.spreaders;

    private canSpread = (userId: string, message: Message) =>
        this.canInfect(userId) && message.reactions.cache.get(EMOJI.MASK) === undefined;
    
    incubate(message: Message, lastMessage: Message) {
        const spreader = new Spreader({ message, lastMessage });
        this.spreaders.push(spreader);
        const spreadThis = this.spread.bind(this);
        spreader.incubate(spreadThis);
        this.log.info("Discorona is incubating in message", message.id);
    }

    private async spread(spreader: Spreader) {
        try {
            this.spreaders.splice(this.spreaders.indexOf(spreader));
            const { lastMessage } = spreader;
            const infectedId = lastMessage.author.id;
            if (this.canSpread(infectedId, lastMessage)) {
                this.log.info("Discorona is now spreading to message", lastMessage.id);
                await lastMessage.react(EMOJI.MICROBE);
                await this.infect(lastMessage.author);
            } else {
                this.log.info("Discorona failed to spread to message", lastMessage.id);
            }
        } catch (err) {
            this.log.error(err);
        }
    }

    getVaccinated = () => this.vaccinated;

    isVaccinated = (userId: string) => this.vaccinated.indexOf(userId) > -1;

    private canVaccinate = (userId: string) => !this.isVaccinated(userId);

    vaccinate(userId: string): boolean {
        if (this.canVaccinate(userId)) {
            this.log.info("User", userId, "has been vaccinated against discorona");
            this.vaccinated.push(userId);
            return true;
        }
        return false;
    }

    getDistanced = () => this.distanced;

    isDistanced = (userId: string, channelId: string) =>
        this.distanced[userId] && this.distanced[userId].includes(channelId);

    startDistancing(userId: string, channelId: string): boolean {
        if (!this.isDistanced(userId, channelId)) {
            if (!this.distanced[userId]) {
                this.distanced[userId] = [];
            }
            this.distanced[userId].push(channelId);
            return true;
        }
        return false;
    }

    endDistancing(userId: string, channelId: string) {
        if (this.isDistanced(userId, channelId)) {
            this.distanced[userId].splice(this.distanced[userId].indexOf(channelId));
        }
    }
}
