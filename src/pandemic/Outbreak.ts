import { Message } from "discord.js";
import { EMOJI } from "../constants";
import Spreader from "./Spreader";

interface OutbreakArgs {
    guildId: string;
}

export default class Outbreak {
    guildId: string;

    private infected: string[] = [];

    private vaccinated: string[] = [];

    private spreaders: Spreader[] = [];

    constructor(args: OutbreakArgs) {
        this.guildId = args.guildId;
        console.log("Discorona has spread to guild", this.guildId);
    }

    getInfected = () => this.infected;

    private isInfected = (userId: string) => this.infected.includes(userId);

    private canInfect = (userId: string) => !this.isInfected(userId) && !this.isVaccinated(userId);

    infect(userId: string) {
        this.infected.push(userId);
        console.log("Discorona has infected the user", userId);
    }

    cough(userId: string): boolean {
        if (this.canInfect(userId)) {
            this.infect(userId);
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
        console.log("Discorona is incubating in message", message.id);
    }

    private async spread(spreader: Spreader) {
        try {
            this.spreaders.splice(this.spreaders.indexOf(spreader));
            const { lastMessage } = spreader;
            const infectedId = lastMessage.author.id;
            if (this.canSpread(infectedId, lastMessage)) {
                console.log("Discorona is now spreading to message", lastMessage.id);
                await lastMessage.react(EMOJI.MICROBE);
                this.infect(infectedId);
                const dmChannel = await lastMessage.author.createDM();
                dmChannel.send("You have been infected with discorona...will you contain or spread the virus?");
            } else {
                console.log("Discorona failed to spread to message", lastMessage.id);
            }
        } catch (err) {
            console.error(err);
        }
    }

    getVaccinated = () => this.vaccinated;

    isVaccinated = (userId: string) => this.vaccinated.indexOf(userId) > -1;

    private canVaccinate = (userId: string) => !this.isVaccinated(userId);

    vaccinate(userId: string): boolean {
        if (this.canVaccinate(userId)) {
            console.log("User", userId, "has been vaccinated against discorona");
            this.vaccinated.push(userId);
            return true;
        }
        return false;
    }
}
