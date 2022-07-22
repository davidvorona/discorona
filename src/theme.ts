import { Guild } from "discord.js";
import { THEME } from "./constants";

const ThemeProvider = {
    infect(theme: string, guild: Guild) {
        switch (theme) {
        case THEME.ZOMBIE:
            return `You've been infected with the zombie virus in ${guild}!`;
        default:
            return `You have been infected with discorona in ${guild}...`;
        }
    }
};

export default ThemeProvider;
