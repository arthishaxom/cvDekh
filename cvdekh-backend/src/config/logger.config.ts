import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import winston from "winston";

const { combine, timestamp, errors, json, prettyPrint } = winston.format;

// biome-ignore lint/style/noNonNullAssertion: ENV TOKEN
const logtail = new Logtail(process.env.BS_TOKEN!, {
  endpoint: process.env.BS_ENDPOINT,
});

let logger: winston.Logger;

if (process.env.NODE_ENV === "PROD") {
  logger = winston.createLogger({
    level: "info",
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports: [
      new LogtailTransport(logtail),
      new winston.transports.Console(),
    ],
  });
} else {
  logger = winston.createLogger({
    level: "info",
    format: combine(timestamp(), errors({ stack: true }), prettyPrint()),
    transports: [new winston.transports.Console()],
  });
}

export default logger;
