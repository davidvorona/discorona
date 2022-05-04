// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ApplicationCommandOptionType } = require("discord-api-types/v9");

module.exports = [
    {
        name: "ping",
        description: "Replies with pong!"
    },
    {
        name: "vaccinate",
        description: "Vaccinate an infected or healthy user",
        options: [{
            type: ApplicationCommandOptionType.Mentionable,
            name: "patient",
            description: "Who do you want to vaccinate?",
            required: true
        }]
    },
    {
        name: "cough",
        description: "Cough on a healthy user",
        options: [{
            type: ApplicationCommandOptionType.Mentionable,
            name: "victim",
            description: "Who do you want to infect?",
            required: true
        }]
    },
    {
        name: "distance",
        description: "Practice social distancing for your next message"
    }
];
