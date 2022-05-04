import { Message } from "discord.js";

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

    incubate(spread: (spreader: Spreader) => void): void {
        const timeSinceExposure = Date.now() - this.message.createdTimestamp;
        const timeToInfection = this.incubationPeriod - timeSinceExposure;
        setTimeout(() => spread(this), timeToInfection);
    }
}
