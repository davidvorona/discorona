import Game from "./Game";

class GameHandler {
    private games: Game[] = [];

    add(guildId: string) {
        this.games.push(new Game({ guildId }));
    }

    addAll(guildIds: string[]) {
        this.games.push(...guildIds.map(guildId => new Game({ guildId })));
    }

    get(guildId: string) {
        return this.games.find(g => g.guildId === guildId);
    }

    getAll(): Game[] {
        return this.games;
    }
}

export default GameHandler;
