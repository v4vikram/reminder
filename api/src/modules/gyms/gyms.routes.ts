import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.ts";
import { authenticate } from "../../shared/middlewares/authenticate.ts";
import * as controller from "./gyms.controller.ts";
import { createGymSchema, updateGymSchema } from "./gyms.validator.ts";

/**
 * Mounted at /gyms. Creation is authenticated but NOT tenant-guarded: there is
 * no gym to own yet. Everything addressing an existing gym lives under the
 * guarded /gyms/:gymId router in app.ts.
 */
export const gymsRouter: Router = Router();

gymsRouter.post("/", authenticate, validate(createGymSchema), controller.create);

/** Mounted at /gyms/:gymId, behind authenticate + tenantGuard. */
export const gymScopedRouter: Router = Router({ mergeParams: true });

gymScopedRouter.get("/", controller.getOne);
gymScopedRouter.patch("/", validate(updateGymSchema), controller.update);
