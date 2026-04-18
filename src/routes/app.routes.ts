import { Router } from "express";
import * as healthController from "../controllers/health.controller.js";
import * as rootController from "../controllers/root.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", rootController.index);
router.get("/health", asyncHandler(healthController.health));

export { router as appRouter };
