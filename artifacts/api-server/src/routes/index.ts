import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import signalsRouter from "./signals-enhanced";
import meRouter from "./me";
import authRouter from "./auth";
import subscriptionsRouter from "./subscriptions";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/signals", signalsRouter);
router.use("/me", meRouter);
router.use("/auth", authRouter);
router.use("/subscriptions", subscriptionsRouter);

export default router;
