import { Client, Guild, Intents } from "discord.js";
import GameHandler from "./game/GameHandler";
import { parseJson, readFile } from "./util";
import { AuthJson } from "./types";

const { TOKEN } = parseJson(readFile("../config/auth.json")) as AuthJson;

let gameHandler: GameHandler;

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

client.on("ready", () => {
    if (client.user) {
        console.log(`Logged in as ${client.user.tag}!`);
    }
    // For now, make sure global commands are cleared if any found
    if (client.application) {
        console.warn("Clearing any existing global application (/) commands.");
        client.application.commands.set([]);
    }
    console.log("------");
    console.log("Initial discorona outbreak imminent...")
    gameHandler = new GameHandler();
    gameHandler.addAll(client.guilds.cache.map(g => g.id));
    gameHandler.getAll().forEach((game) => {
        const guild = client.guilds.cache.get(game.guildId);
        guild && game.infect(guild.ownerId);
    });
});

client.on("guildCreate", (guild) => {
    gameHandler.add(guild.id);
    const game = gameHandler.get(guild.id);
    game && game.infect(guild.ownerId);
});

client.on("messageCreate", (message) => {
    const user = message.author;
    if (message.guildId) {
        const game = gameHandler.get(message.guildId);
        if (game && game.getInfected().includes(user.id)) {
            message.reply("An infected user has spoken in the chat...");
        }
    }
});

client.login(TOKEN);
