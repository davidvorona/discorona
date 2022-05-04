import { Guild } from "discord.js";
import Outbreak from "./outbreak";

class Pandemic {
    private outbreaks: Outbreak[] = [];

    add(guild: Guild) {
        this.outbreaks.push(new Outbreak(guild));
    }

    addAll(guilds: Guild[]) {
        this.outbreaks.push(...guilds.map(guild => new Outbreak(guild)));
    }

    get(guildId: string) {
        return this.outbreaks.find(g => g.guildId === guildId);
    }

    getAll(): Outbreak[] {
        return this.outbreaks;
    }
}

export default Pandemic;
