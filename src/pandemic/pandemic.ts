import Outbreak from "./outbreak";

class Pandemic {
    private outbreaks: Outbreak[] = [];

    add(guildId: string) {
        this.outbreaks.push(new Outbreak({ guildId }));
    }

    addAll(guildIds: string[]) {
        this.outbreaks.push(...guildIds.map(guildId => new Outbreak({ guildId })));
    }

    get(guildId: string) {
        return this.outbreaks.find(g => g.guildId === guildId);
    }

    getAll(): Outbreak[] {
        return this.outbreaks;
    }
}

export default Pandemic;
