import colors from "./colors"
import { Readable } from "stream"
import { inspect } from "util"
import { logLevel } from "./index"

type dateFunction = () => string;

interface basicLogger extends Readable {
    on(event: 'logTrace' | 'logDebug' | 'logInfo' | 'logWarn' | 'logError' | 'logFatal', listener: (message: string, sender: string) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    emit(event: 'logTrace' | 'logDebug' | 'logInfo' | 'logWarn' | 'logError' | 'logFatal', message: string, sender: string): boolean;
    emit(event: string | symbol, ...args: any[]): boolean;
    catchGlobalErrors(): void;
}

class basicLogger extends Readable {
    colors:boolean = false; 
    defaultSender:string = "System"; 
    logLevel:logLevel = logLevel.info;
    constructor(level = logLevel.info, defaultSender = "System", colors = false) {
        super()
        this.colors = colors
        this.defaultSender = defaultSender
        this.logLevel = level
    }
    _read() {}
    _getdate() {
        let date = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
    setDateFunction(func:dateFunction) {
        this._getdate = func;
    }
    
    private _stripWeirdCharacters(text: string): string {
        // Strip ANSI escape sequences
        let cleanText = text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
        // Strip unprintable control characters (ASCII 0-31 and 127), EXCEPT tab (\t), newline (\n), and carriage return (\r)
        cleanText = cleanText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        return cleanText;
    }

    private _formatMarkdown(text: string): string {
        if (!this.colors) {
            return text.replace(/\*\*(.*?)\*\*/gs, '$1')
                       .replace(/\*(.*?)\*/gs, '$1')
                       .replace(/__(.*?)__/gs, '$1');
        }
        return text.replace(/\*\*(.*?)\*\*/gs, `${colors.bright}$1${colors.reset}`)
                   .replace(/\*(.*?)\*/gs, `${colors.dim}$1${colors.reset}`)
                   .replace(/__(.*?)__/gs, `${colors.underscore}$1${colors.reset}`);
    }

    addLog(message: string | Error, level: logLevel, sender = this.defaultSender, meta?: any) {
        let baseMsg = message instanceof Error ? message.message : String(message);
        let sanitizedMessage = this._stripWeirdCharacters(baseMsg);
        let formattedMessage = this._formatMarkdown(sanitizedMessage);

        let extraData = "";
        if (message instanceof Error && message.stack) {
            const stackLines = message.stack.split('\n').slice(1).join('\n');
            if (stackLines) extraData += "\n" + stackLines;
        }
        if (meta !== undefined) {
            extraData += (extraData ? "\n" : " ") + (typeof meta === 'string' ? meta : inspect(meta, { depth: null, colors: false }));
        }

        if (extraData) {
            extraData = this._stripWeirdCharacters(extraData);
            if (this.colors) {
                extraData = `${colors.dim}${extraData}${colors.reset}`;
            }
            formattedMessage += extraData;
        }
        
        let levelStr = "";
        let emitEvent = "";

        switch (level) {
            case logLevel.trace:
                levelStr = this.colors ? `${colors.bright}${colors.fg.gray}[TRACE]${colors.reset}` : "[TRACE]";
                emitEvent = "logTrace";
                break;
            case logLevel.debug:
                levelStr = this.colors ? `${colors.bright}[DEBUG]${colors.reset}` : "[DEBUG]";
                emitEvent = "logDebug";
                break;
            case logLevel.info:
                levelStr = this.colors ? `${colors.bright}${colors.fg.cyan}[INFO ]${colors.reset}` : "[INFO ]";
                emitEvent = "logInfo";
                break;
            case logLevel.warn:
                levelStr = this.colors ? `${colors.bright}${colors.fg.yellow}[WARN ]${colors.reset}` : "[WARN ]";
                emitEvent = "logWarn";
                break;
            case logLevel.error:
                levelStr = this.colors ? `${colors.bright}${colors.fg.red}[ERROR]${colors.reset}` : "[ERROR]";
                emitEvent = "logError";
                break;
            case logLevel.fatal:
                levelStr = this.colors ? `${colors.bg.red}${colors.fg.white}${colors.bright} FATAL ${colors.reset}` : "[FATAL]";
                emitEvent = "logFatal";
                break;
            default:
                return;
        }

        let dateStr = this.colors ? `${colors.fg.gray}[${this._getdate()}]${colors.reset}` : `[${this._getdate()}]`;
        let senderStr = this.colors ? `${colors.bright}${sender} ›${colors.reset}` : `${sender} ›`;
        let logString = `${dateStr} ${levelStr} ${senderStr} ${formattedMessage}\n`;
        this.emit(emitEvent, logString, sender);
        
        if(this.logLevel <= level) {
            this.push(logString);
        }
    }

    trace(message: string | Error, sender = this.defaultSender, meta?: any) {
        this.addLog(message, logLevel.trace, sender, meta)
    }
    debug(message: string | Error, sender = this.defaultSender, meta?: any) {
        this.addLog(message, logLevel.debug, sender, meta)
    }
    info(message: string | Error, sender = this.defaultSender, meta?: any) {
        this.addLog(message, logLevel.info, sender, meta)
    }
    warn(message: string | Error, sender = this.defaultSender, meta?: any) {
        this.addLog(message, logLevel.warn, sender, meta)
    }
    error(message: string | Error, sender = this.defaultSender, meta?: any) {
        this.addLog(message, logLevel.error, sender, meta)
    }
    fatal(message: string | Error, sender = this.defaultSender, meta?: any) {
        this.addLog(message, logLevel.fatal, sender, meta)
    }
    
    catchGlobalErrors() {
        process.on("uncaughtException", (err, origin) => {
            this.error(err.stack ? err.stack : err.name, origin)
        })

        process.on("unhandledRejection", (reason, promise) => {
            this.error(String(reason), String(promise))
        })

        process.on('warning', (warning) => {
            this.warn(warning.message, warning.name);
        });
    }
}

export default basicLogger;
