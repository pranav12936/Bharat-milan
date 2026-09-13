import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import matrimonialRouter from "./matrimonial";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(matrimonialRouter);

export default router;
