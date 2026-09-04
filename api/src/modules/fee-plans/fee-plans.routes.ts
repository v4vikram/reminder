import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.ts";
import * as controller from "./fee-plans.controller.ts";
import { createFeePlanSchema, updateFeePlanSchema } from "./fee-plans.validator.ts";

/** Mounted at /gyms/:gymId/fee-plans, behind authenticate + tenantGuard. */
export const feePlansRouter: Router = Router({ mergeParams: true });

feePlansRouter.get("/", controller.list);
feePlansRouter.post("/", validate(createFeePlanSchema), controller.create);
feePlansRouter.patch("/:planId", validate(updateFeePlanSchema), controller.update);
feePlansRouter.delete("/:planId", controller.remove);
