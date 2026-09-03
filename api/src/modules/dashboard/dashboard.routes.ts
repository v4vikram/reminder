import { Router } from "express";
import * as controller from "./dashboard.controller.ts";

/** Mounted at /gyms/:gymId/dashboard, behind authenticate + tenantGuard. */
export const dashboardRouter: Router = Router({ mergeParams: true });

dashboardRouter.get("/summary", controller.summary);
