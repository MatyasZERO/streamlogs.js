import { Readable } from "stream"
import { logLevel } from "./index"

export interface JSONMessage {
    message: string;
    level: string;
    sender: string;
    timestamp: Date;
    meta?: any;
    error?: string;
}

interface JSONLogger extends Readable {
    on(event: 'logTrace' | 'logDebug' | 'logInfo' | 'logWarn' | 'logError' | 'logFatal' | 'log', listener: (object: JSONMessage) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    emit(event: 'logTrace' | 'logDebug' | 'logInfo' | 'logWarn' | 'logError' | 'logFatal' | 'log', object: JSONMessage): boolean;
    emit(event: string | symbol, ...args: any[]): boolean;
}

class JSONLogger extends Readable {
    defaultSender = "System"
    logLevel = logLevel.info
    constructor(level = logLevel.info, defaultSender = "System",) {
        super()
        this.defaultSender = defaultSender
        this.logLevel = level
    }
    _read() {}

    private _getLevelString(level: logLevel): string {
        switch(level) {
            case logLevel.trace: return "trace";
            case logLevel.debug: return "debug";
            case logLevel.info: return "info";
            case logLevel.warn: return "warn";
            case logLevel.error: return "error";
            case logLevel.fatal: return "fatal";
            default: return "unknown";
        }
    }

    addLog(message: string | Error, level: logLevel, sender = this.defaultSender, meta?: any) {
        let actualMessage = message instanceof Error ? message.message : String(message);
        
        let object: JSONMessage = {
            message: actualMessage,
            level: this._getLevelString(level),
            sender: sender,
            timestamp: new Date()
        };

        if (meta !== undefined) object.meta = meta;
        if (message instanceof Error && message.stack) object.error = message.stack;

        if(this.logLevel <= level) {
            this.push(JSON.stringify(object) + "\n");
        }
        this.emit("log", object)
        switch (level) {
            case logLevel.trace: this.emit("logTrace", object); break;
            case logLevel.debug: this.emit("logDebug", object); break;
            case logLevel.info: this.emit("logInfo", object); break;
            case logLevel.warn: this.emit("logWarn", object); break;
            case logLevel.error: this.emit("logError", object); break;
            case logLevel.fatal: this.emit("logFatal", object); break;
        }
    }

    trace(message: string | Error, sender = this.defaultSender, meta?: any) { this.addLog(message, logLevel.trace, sender, meta) }
    debug(message: string | Error, sender = this.defaultSender, meta?: any) { this.addLog(message, logLevel.debug, sender, meta) }
    info(message: string | Error, sender = this.defaultSender, meta?: any) { this.addLog(message, logLevel.info, sender, meta) }
    warn(message: string | Error, sender = this.defaultSender, meta?: any) { this.addLog(message, logLevel.warn, sender, meta) }
    error(message: string | Error, sender = this.defaultSender, meta?: any) { this.addLog(message, logLevel.error, sender, meta) }
    fatal(message: string | Error, sender = this.defaultSender, meta?: any) { this.addLog(message, logLevel.fatal, sender, meta) }
}

export default JSONLogger;
