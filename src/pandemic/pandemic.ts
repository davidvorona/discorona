import { Guild } from "discord.js";
import Outbreak, { OutbreakState } from "./outbreak";

class Pandemic {
    private outbreaks: Outbreak[] = [];

    add(guild: Guild, state?: OutbreakState) {
        this.outbreaks.push(new Outbreak(guild, state));
    }

    get(guildId: string) {
        return this.outbreaks.find(g => g.guildId === guildId);
    }

    getAll() {
        return this.outbreaks;
    }
}

export default Pandemic;
