import fs from "fs";
import { ConfigJson, AnyObject } from "./types";
import { defaultLogger as log } from "./logger";
import { readFile, parseJson } from "./util";

const { DATA_DIR } = parseJson(readFile("../config/config.json")) as ConfigJson;

class Storage {
    static validateDataDir(path: string) {
        const exists = fs.existsSync(path);
        if (!exists) {
            log.error("Cannot start bot without data directory, aborting");
            throw new Error("No data directory");
        }
    }

    dataDir: string = DATA_DIR;

    filePath: string;

    constructor(fileName: string, overridePath?: boolean) {
        this.filePath = overridePath ? fileName : `${this.dataDir}/${fileName}`;
        const fileExists = fs.existsSync(this.filePath);
        if (!fileExists) {
            fs.openSync(this.filePath, "a");
            log.info(`File ${this.filePath} created`);
        }
    }

    read(): Record<string, AnyObject> {
        let data;
        try {
            const dataStr = fs.readFileSync(this.filePath, "utf-8");
            data = parseJson(dataStr);
            log.info(`${this.filePath} loaded`);
        } catch (err) {
            log.error(err);
            data = [];
        }
        return data;
    }

    write(data: Record<string, AnyObject>) {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data));
            log.info(`${this.filePath} written`);
        } catch(err) {
            log.error(err);
        }
    }

    add(key: string, value: AnyObject) {
        const data = this.read();
        data[key] = value;
        this.write(data);
    }
}

export default Storage;
