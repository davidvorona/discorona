import { Message } from "discord.js";
import { EMOJI } from "../constants";

interface SpreaderArgs {
    message: Message;
    lastMessage?: Message;
}

const DEFAULT_INCUBATION_PERIOD = 1000; // 1000 * 60 * 60; // 1 hour

export default class Spreader {
    message: Message;

    lastMessage?: Message;

    incubationPeriod: number = DEFAULT_INCUBATION_PERIOD;

    constructor(args: SpreaderArgs) {
        this.message = args.message;
        this.lastMessage = args.lastMessage;
    }

    incubate(stop: () => void): void {
        const timeSinceExposure = Date.now() - this.message.createdTimestamp;
        const timeToInfection = this.incubationPeriod - timeSinceExposure;
        setTimeout(async () => {
            if (this.lastMessage) {
                console.log(
                    "Discorona is now spreading from message", this.message.id,
                    "to message", this.lastMessage.id
                );
                this.lastMessage.react(EMOJI.MICROBE);
                const dmChannel = await this.lastMessage.author.createDM();
                dmChannel.send("You have been infected with discorona...will you contain or spread the virus?");
                stop();
            }
        }, timeToInfection);
    }
}
