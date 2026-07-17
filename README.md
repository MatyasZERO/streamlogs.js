# Streamlogs.js

> A robust, event-driven, stream-based logging library for Node.js.

Streamlogs.js manages application logs by utilizing native Node.js Readable streams and events. It offers clean, customizable output, metadata support, native error handling, and simple markdown formatting.

## Features

- **Stream-Based**: Logs are Node.js readable streams, allowing you to easily `pipe()` them anywhere (stdout, files, HTTP responses, etc.).
- **Event-Driven**: Listen to specific log events (e.g., `logError`, `logFatal`, `log`) for external processing or notifications.
- **Multiple Output Formats**: Supports beautifully colorized terminal logs and structured JSON logs.
- **Markdown Support**: Use simple markdown (`**bold**`, `*dim*`, `__underscore__`) to format your CLI logs.
- **Global Error Handling**: The default logger automatically captures unhandled exceptions and promise rejections.
- **Environment Aware**: Automatically sets the log level using the `LOG_LEVEL` environment variable.

## Installation

```bash
npm install streamlogs
```

## Quick Start (Default Logger)

The easiest way to use Streamlogs is via the pre-configured default logger, `defLog`, which pipes directly to `process.stdout` and supports colors.

```typescript
import { defLog } from "streamlogs";

// Simple logging
defLog.info("Application started successfully!", "System");

// Logging with variables (bold formatting)
defLog.warn("Connection to **redis** timed out.", "Database");

// Logging errors
try {
    throw new Error("Cannot read property 'id' of null");
} catch (error) {
    defLog.error(error, "AuthService");
}
```

## Using Custom Loggers

If you need more control, you can create your own logger instances and pipe them to a file or stream.

### Basic Logger (Human Readable)

```typescript
import { basicLogger, logLevel } from "streamlogs";
import * as fs from "fs";

// Create a logger (level, defaultSender, colors)
const log = new basicLogger(logLevel.debug, "My App", false);

// Pipe to a file
const logFile = fs.createWriteStream("app.log", { flags: "a" });
log.pipe(logFile);

log.info("This will be saved to app.log");
log.debug("A debug message", "Network", { port: 8080 }); // Includes metadata!
```

### JSON Logger (Machine Readable)

Structured logging is ideal for log aggregators like ElasticSearch or Datadog.

```typescript
import { JSONLogger, logLevel } from "streamlogs";
import * as fs from "fs";

const jsonLog = new JSONLogger(logLevel.info, "Microservice");

// Pipe to a file or standard output
jsonLog.pipe(fs.createWriteStream("structured.log", { flags: "a" }));

jsonLog.info("Service healthy", "HealthCheck", { cpu: "12%", ram: "450MB" });
```

## Log Levels

Streamlogs provides the following levels (in increasing severity):

1. `trace`
2. `debug`
3. `info`
4. `warn`
5. `error`
6. `fatal`

You can control the global log level by setting the `LOG_LEVEL` environment variable before running your app:

```bash
LOG_LEVEL=debug node app.js
```

## Events

You can attach listeners directly to the loggers to perform side effects (like sending a Discord webhook on fatal errors).

```typescript
import { defLog } from "streamlogs";

defLog.on("logError", (message, sender) => {
    // Alerting logic here
    console.log(`Error caught from ${sender}: ${message}`);
});

defLog.on("logFatal", (message, sender) => {
    // Send email to admin
});
```
*(For `JSONLogger`, the event listener will receive a `JSONMessage` object instead of a string).*

## API Reference

### `basicLogger`
Constructor: `new basicLogger(level?: logLevel, defaultSender?: string, colors?: boolean)`
- Emits: `logTrace`, `logDebug`, `logInfo`, `logWarn`, `logError`, `logFatal`
- Includes markdown parsing: `**bright**`, `*dim*`, `__underscore__` (when `colors` is true).

### `JSONLogger`
Constructor: `new JSONLogger(level?: logLevel, defaultSender?: string)`
- Emits: `logTrace`, `logDebug`, `logInfo`, `logWarn`, `logError`, `logFatal`, and `log`

## License

MIT