import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";

import router from "./routes";
import authRouter from "./auth/auth.routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
  }),
);

app.use(
  cors({
    credentials: true,
    origin: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Custom authentication routes.
 *
 * Phone:
 * POST /api/auth/send-otp
 * POST /api/auth/verify-otp
 *
 * Google:
 * POST /api/auth/google
 *
 * Logout:
 * POST /api/auth/logout
 */
app.use("/api/auth", authRouter);

/**
 * Existing application routes.
 */
app.use("/api", router);

export default app;