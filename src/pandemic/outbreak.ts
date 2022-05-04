import { Guild, Message, TextChannel, User } from "discord.js";
import { EMOJI, INFECTION_STAGE } from "../constants";
import Spreader, { SpreaderArgs } from "./spreader";
import Logger from "../logger";

export interface OutbreakState {
    stage: string;
    infected: string[];
    vaccinated: string[];
    spreaders: Spreader[];
    distanced: Record<string, string[]>;
    createdAtTimestamp: number;
    stageSetTimestamp: number;
}

export default class Outbreak {
    createdAtTimestamp: number = Date.now();

    guildId: string;

    guild: Guild;

    stage: string = INFECTION_STAGE.OUTBREAK;

    stageSetTimestamp: number = Date.now();

    log: Logger;

    private infected: string[] = [];

    private vaccinated: string[] = [];

    private spreaders: Spreader[] = [];

    private distanced: Record<string, string[]> = {};

    constructor(guild: Guild, state?: OutbreakState) {
        this.guildId = guild.id;
        this.guild = guild;
        this.log = new Logger(this.guildId);
        if (state) {
            this.hydrate(state);
        }
        this.log.info("Discorona has spread to guild", this.guildId);
    }

    hydrate(state: OutbreakState) {
        this.stage = state.stage || INFECTION_STAGE.OUTBREAK;
        this.infected = state.infected || [];
        this.vaccinated = state.vaccinated || [];
        // For spreaders, restart incubation
        state.spreaders.forEach(s => this.incubate(s));
        this.distanced = state.distanced || [];
        this.createdAtTimestamp = state.createdAtTimestamp || Date.now();
        this.stageSetTimestamp = state.stageSetTimestamp || Date.now();
    }

    getState = (): OutbreakState => ({
        stage: this.stage,
        infected: this.infected,
        vaccinated: this.vaccinated,
        spreaders: this.spreaders,
        distanced: this.distanced,
        createdAtTimestamp: this.createdAtTimestamp,
        stageSetTimestamp: this.stageSetTimestamp
    });

    validateStage(stage: string) {
        return Object.values(INFECTION_STAGE).includes(stage);
    }

    getStage = (): string => this.stage;

    setStage(stage: string) {
        if (!this.validateStage(stage)) {
            throw new Error("Invalid stage: " + stage);
        }
        this.stage = stage;
        this.stageSetTimestamp = Date.now();
        this.log.info("Stage set to", this.stage);
    }

    getInfected = () => this.infected;

    isInfected = (userId: string) => this.infected.includes(userId);

    canInfect = (userId: string) => !this.isInfected(userId) && !this.isVaccinated(userId);

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
    
    incubate(args: SpreaderArgs) {
        const spreader = new Spreader(args);
        this.spreaders.push(spreader);
        const spreadThis = this.spread.bind(this);
        spreader.incubate(spreadThis);
        this.log.info("Discorona is incubating in message", args.messageId);
    }

    private async spread(spreader: Spreader) {
        try {
            this.spreaders.splice(this.spreaders.indexOf(spreader));
            const { lastMessageId, channelId } = spreader;
            const channel = this.guild.channels.cache.get(channelId) as TextChannel;
            const lastMessage = await channel.messages.fetch(lastMessageId);
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
