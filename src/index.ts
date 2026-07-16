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


// error handlings
process.on("uncaughtException", (err, origin) => {
    defLog.error(err.stack ? err.stack : err.name, origin)
})

process.on("unhandledRejection", (reason, promise) => {
    defLog.error(String(reason), String(promise))
})

process.on('warning', (warning) => {
    defLog.warn(warning.message, warning.name);
});





