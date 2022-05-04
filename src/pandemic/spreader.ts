export interface SpreaderArgs {
    channelId: string;
    messageId: string;
    createdTimestamp: number;
    lastMessageId: string;
}

// 1 hour (1 second in dev mode)
const DEFAULT_INCUBATION_PERIOD = process.env.DEV_MODE ? 1000 : 1000 * 60 * 60;

export default class Spreader {
    channelId: string;

    messageId: string;

    createdTimestamp: number;

    lastMessageId: string;

    incubationPeriod: number = DEFAULT_INCUBATION_PERIOD;

    constructor(args: SpreaderArgs) {
        this.channelId = args.channelId;
        this.messageId = args.messageId;
        this.createdTimestamp = args.createdTimestamp;
        this.lastMessageId = args.lastMessageId;
    }

    incubate(spread: (spreader: Spreader) => void): void {
        const timeSinceExposure = Date.now() - this.createdTimestamp;
        const timeToInfection = this.incubationPeriod - timeSinceExposure;
        setTimeout(() => spread(this), timeToInfection);
    }
}
