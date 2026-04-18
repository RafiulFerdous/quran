import * as healthService from "../services/health.service.js";
export async function health(_req, res) {
    try {
        await healthService.pingDatabase();
        res.json({ status: "ok", database: "connected" });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(503).json({ status: "error", database: "disconnected", message });
    }
}
