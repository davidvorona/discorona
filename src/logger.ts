export default class Logger {
    prefix: string;

    constructor(prefix = "") {
        this.prefix = prefix;
    }

    log(...args: string[]) {
        const date = new Date();
        const prefixArgs = this.prefix ? [date, `[${this.prefix}]:`] : [date];
        console.log(...prefixArgs, ...args);
    }

    info(...args: string[]) {
        this.log(...args);
    }

    error(error: unknown) {
        if (error instanceof Error) {
            this.log(error.toString());
        } else {
            const errStr = error as string;
            this.log(errStr);
        }
    }
}
