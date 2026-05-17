import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { httpProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Middleware
app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

// Routes
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
