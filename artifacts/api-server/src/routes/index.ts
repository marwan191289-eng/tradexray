import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import signalsRouter from "./signals";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/signals", signalsRouter);

export default router;
