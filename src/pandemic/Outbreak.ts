import { Message } from "discord.js";
import Spreader from "./Spreader";

interface OutbreakArgs {
    guildId: string;
}

export default class Outbreak {
    guildId: string;

    private infected: string[] = [];

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

    spread(message: Message, lastMessage?: Message) {
        const spreader = new Spreader({ message, lastMessage });
        this.spreaders.push(spreader);
        spreader.incubate(() => this.stopSpread(spreader));
        console.log("Discorona is incubating in message", message.id);
    }

    private stopSpread(spreader: Spreader) {
        this.spreaders.splice(this.spreaders.indexOf(spreader));
    }
}
