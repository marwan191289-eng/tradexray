import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import signalsRouter from "./signals";
import meRouter from "./me";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/signals", signalsRouter);
router.use("/me", meRouter);

export default router;
