import { Router } from "express";
import * as quranController from "../controllers/quran.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/surahs", asyncHandler(quranController.listSurahs));
router.get(
  "/surahs/:surahNumber/ayat",
  asyncHandler(quranController.getAyatBySurah)
);
router.get("/ayat/search", asyncHandler(quranController.searchAyat));

export { router as quranRouter };
