import type { RequestHandler } from "express";
import { ok } from "../../shared/utils/response.ts";
import * as service from "./dashboard.service.ts";

export const summary: RequestHandler = async (req, res) => {
  res.json(ok(await service.getSummary(req.gym!)));
};
