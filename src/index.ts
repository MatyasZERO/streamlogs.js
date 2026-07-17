export enum logLevel {
    trace,
    debug,
    info,
    warn,
    error,
    fatal
}

import basicLogger from "./basicLogger"
import JSONLogger, { JSONMessage } from "./JSONLogger"

export { basicLogger, JSONLogger, JSONMessage }

function getLogLevelFromEnv(): logLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
        case "trace": return logLevel.trace;
        case "debug": return logLevel.debug;
        case "info": return logLevel.info;
        case "warn": return logLevel.warn;
        case "error": return logLevel.error;
        case "fatal": return logLevel.fatal;
        default: return logLevel.info;
    }
}

export const defLog = new basicLogger(getLogLevelFromEnv(), "System", true);
defLog.pipe(process.stdout);


// Opt-in global error handling is available via defLog.catchGlobalErrors()





