import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.ts";
import * as controller from "./payments.controller.ts";
import { listPaymentsQuerySchema, recordPaymentSchema } from "./payments.validator.ts";

/** Mounted at /gyms/:gymId/members/:memberId/payments. */
export const memberPaymentsRouter: Router = Router({ mergeParams: true });

memberPaymentsRouter.post("/", validate(recordPaymentSchema), controller.record);
memberPaymentsRouter.get(
  "/",
  validate(listPaymentsQuerySchema, "query"),
  controller.listForMember,
);

/** Mounted at /gyms/:gymId/payments. */
export const gymPaymentsRouter: Router = Router({ mergeParams: true });

gymPaymentsRouter.get(
  "/",
  validate(listPaymentsQuerySchema, "query"),
  controller.listForGym,
);
