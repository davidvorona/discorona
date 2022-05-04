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

    infect(userId: string) {
        this.infected.push(userId);
        console.log("Discorona has infected the user", userId);
    }

    getSpreaders = () => this.spreaders;

    incubate(message: Message, lastMessage?: Message) {
        const spreader = new Spreader({ message, lastMessage });
        this.spreaders.push(spreader);
        const spreadThis = this.spread.bind(this);
        spreader.incubate(spreadThis);
        console.log("Discorona is incubating in message", message.id);
    }

    private async spread(spreader: Spreader) {
        this.spreaders.splice(this.spreaders.indexOf(spreader));
        const { message, lastMessage } = spreader;
        if (lastMessage) {
            console.log(
                "Discorona is now spreading from message", message.id,
                "to message", lastMessage.id
            );
            lastMessage.react(EMOJI.MICROBE);
            const infectedId = lastMessage.author.id;
            if (!this.infected.includes(infectedId) && !this.isVaccinated(infectedId)) {
                this.infect(infectedId);
                const dmChannel = await lastMessage.author.createDM();
                dmChannel.send("You have been infected with discorona...will you contain or spread the virus?");
            } else {
                console.log("Discorona could not infect user", lastMessage.author.id);
            }
        }
    }

    vaccinate(userId: string) {
        if (!this.isVaccinated(userId)) {
            console.log("User", userId, "has been vaccinated against discorona");
            this.vaccinated.push(userId);
        }
    }

    private isVaccinated = (userId: string) => this.vaccinated.indexOf(userId) > -1;

    cough(userId: string) {
        if (!this.isVaccinated(userId) && !this.infected.includes(userId)) {
            this.infect(userId);
        }
    }
}
