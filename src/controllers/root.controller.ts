import type { Request, Response } from "express";

export function index(_req: Request, res: Response) {
  res.json({
    name: "quran_web_application",
    version: "1.0.0",
    api: {
      surahs: "GET /api/surahs?page=&limit=",
      ayat: "GET /api/surahs/:surahNumber/ayat?page=&limit=&edition=",
      search: "GET /api/ayat/search?q=&page=&limit=&edition=",
    },
  });
}
