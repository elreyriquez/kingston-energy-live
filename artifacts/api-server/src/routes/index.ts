import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import trucksRouter from "./trucks.js";
import zonesRouter from "./zones.js";
import reportsRouter from "./reports.js";
import scheduleRouter from "./schedule.js";
import smartbinRouter from "./smartbin.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(trucksRouter);
router.use(zonesRouter);
router.use(reportsRouter);
router.use(scheduleRouter);
router.use(smartbinRouter);
router.use(statsRouter);

export default router;
