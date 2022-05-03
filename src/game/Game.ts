interface GameArgs {
    guildId: string;
}

export default class Game {
    guildId: string;

    private infected: string[] = [];

    constructor(args: GameArgs) {
        this.guildId = args.guildId;
        console.log("Discorona has spread to guild", this.guildId);
    }

    getInfected = () => this.infected;

    infect(userId: string) {
        this.infected.push(userId);
        console.log("Discorona has infected the user", userId);
    }
}
