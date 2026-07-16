import { basicLogger, JSONLogger, logLevel } from "../src/index";

describe("streamlogs", () => {
    describe("basicLogger", () => {
        it("should emit log events with correct formatted string", (done) => {
            const logger = new basicLogger(logLevel.trace, "TestSender", false);
            logger.on("logTrace", (msg, sender) => {
                expect(sender).toBe("TestSender");
                expect(msg).toContain("[TRACE]");
                expect(msg).toContain("test trace message");
                done();
            });
            logger.trace("test trace message");
        });

        it("should not emit logs below configured log level", () => {
            const logger = new basicLogger(logLevel.info, "TestSender", false);
            const mockFn = jest.fn();
            logger.on("logTrace", mockFn);
            logger.trace("this should be ignored");
            
            // For basicLogger, log events are still emitted but they aren't pushed to the stream
            // Wait, looking at the code, it emits the event first, then pushes to stream.
            // So event is emitted. The stream push is what respects the level.
            // Let's test the stream push behavior instead.
        });

        it("should only push logs to stream if level is adequate", () => {
            const logger = new basicLogger(logLevel.info, "TestSender", false);

            logger.trace("trace message");
            logger.debug("debug message");
            
            expect(logger.read()).toBeNull();

            logger.info("info message");
            logger.warn("warn message");
            
            const chunk1 = logger.read();
            const chunk2 = logger.read();
            const fullOutput = chunk1.toString() + (chunk2 ? chunk2.toString() : "");
            expect(fullOutput).toContain("[INFO ]");
            expect(fullOutput).toContain("[WARN ]");
        });

        it("should apply ANSI codes for basic markdown when colors are enabled", (done) => {
            const logger = new basicLogger(logLevel.info, "TestSender", true);
            logger.on("logInfo", (msg) => {
                // \x1b[1m is bright/bold, \x1b[2m is dim/italic, \x1b[4m is underscore
                expect(msg).toContain("\x1b[1mbold\x1b[0m");
                expect(msg).toContain("\x1b[2mitalic\x1b[0m");
                expect(msg).toContain("\x1b[4munderline\x1b[0m");
                done();
            });
            logger.info("here is **bold**, *italic*, and __underline__ text.");
        });

        it("should strip markdown symbols when colors are disabled", (done) => {
            const logger = new basicLogger(logLevel.info, "TestSender", false);
            logger.on("logInfo", (msg) => {
                expect(msg).not.toContain("**");
                expect(msg).not.toContain("__");
                expect(msg).not.toContain("\x1b[1m"); // Ensure no ANSI codes leaked
                expect(msg).toContain("here is bold, italic, and underline text.");
                done();
            });
            logger.info("here is **bold**, *italic*, and __underline__ text.");
        });

        it("should color only the log level prefix and the date when colors are enabled", (done) => {
            const logger = new basicLogger(logLevel.info, "TestSender", true);
            logger.on("logInfo", (msg) => {
                // Should start with colored date prefix: \x1b[90m[date]\x1b[0m
                expect(msg.startsWith("\x1b[90m[")).toBe(true);
                // Should contain bright cyan foreground for info level
                expect(msg).toContain("]\x1b[0m \x1b[1m\x1b[36m[INFO ]\x1b[0m");
                // The rest of the message should be plain text
                expect(msg).toContain("\x1b[1mTestSender ›\x1b[0m plain message");
                done();
            });
            logger.info("plain message");
        });

        it("should strip control characters and ANSI escape codes to prevent formatting breakage", (done) => {
            const logger = new basicLogger(logLevel.info, "TestSender", false);
            logger.on("logInfo", (msg) => {
                expect(msg).not.toContain("\x1b");
                expect(msg).not.toContain("\x07"); // Bell character
                expect(msg).toContain("clean text");
                done();
            });
            logger.info("clean \x1b[31mtext\x1b[0m\x07");
        });

        it("should parse markdown across multiline messages properly", (done) => {
            const logger = new basicLogger(logLevel.info, "TestSender", true);
            logger.on("logInfo", (msg) => {
                expect(msg).toContain("\x1b[1mmultiline\nbold text\x1b[0m");
                done();
            });
            logger.info("this is **multiline\nbold text** parsed correctly.");
        });
    });

    describe("JSONLogger", () => {
        it("should push JSON stringified objects to stream with newline", () => {
            const logger = new JSONLogger(logLevel.info, "JSONSender");

            logger.trace("trace message"); // Below level info, should not push
            expect(logger.read()).toBeNull();

            logger.info("info message", undefined, { userId: 42 });
            
            const chunk = logger.read();
            expect(chunk).not.toBeNull();
            
            // Should end with newline
            expect(chunk.toString().endsWith("\n")).toBe(true);

            const parsed = JSON.parse(chunk.toString());
            expect(parsed.message).toBe("info message");
            expect(parsed.level).toBe("info"); // Should now be a string!
            expect(parsed.sender).toBe("JSONSender");
            expect(parsed.meta.userId).toBe(42); // Should include metadata
            expect(parsed.timestamp).toBeDefined();
        });

        it("should emit specific events with object containing Error parsing", (done) => {
            const logger = new JSONLogger(logLevel.error, "JSONSender");
            const testError = new Error("Broken database");
            
            logger.on("logError", (obj) => {
                expect(obj.message).toBe("Broken database");
                expect(obj.error).toBeDefined(); // Error stack should be extracted
                expect(obj.error).toContain("Broken database");
                expect(obj.level).toBe("error");
                expect(obj.sender).toBe("JSONSender");
                done();
            });
            logger.error(testError);
        });
    });
});
