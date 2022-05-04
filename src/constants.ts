export const EMOJI = {
    MICROBE: "🦠",
    SYRINGE: "💉",
    MASK: "😷"
} as const;


export const INFECTION_STAGE = {
    OUTBREAK: "outbreak",
    CONTAINMENT: "containment",
    MUTATION: "mutation",
    PANDEMIC: "pandemic"
};

const ONE_DAY = 1000 * 60 * 60 * 24;
export const MINIMUM_STAGE_LENGTH = {
    [INFECTION_STAGE.OUTBREAK]: ONE_DAY,
    [INFECTION_STAGE.CONTAINMENT]: ONE_DAY * 2,
    [INFECTION_STAGE.MUTATION]: ONE_DAY * 2,
    [INFECTION_STAGE.PANDEMIC]: ONE_DAY,
};

export const TEXT_CHANNEL_TYPE = "GUILD_TEXT";

export const CRON_TIME = {
    EVERY_MINUTE: "* * * * *",
    EVERY_DAY_AT_9_AM_AND_PM: "0 9,21 * * *"
};
