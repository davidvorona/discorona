export default class Logger {
    prefix: string;

    constructor(prefix = "") {
        this.prefix = prefix;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log(...args: any[]) {
        const date = new Date();
        const prefixArgs = this.prefix ? [date, `[${this.prefix}]:`] : [date];
        console.log(...prefixArgs, ...args);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info(...args: any[]) {
        this.log(...args);
    }

    error(error: unknown) {
        if (error instanceof Error) {
            this.log(error);
        } else {
            const errStr = error as string;
            this.log(errStr);
        }
    }
}

export const defaultLogger = new Logger();
