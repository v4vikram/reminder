import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.ts";
import * as controller from "./reminders.controller.ts";
import {
  listRemindersQuerySchema,
  logReminderSchema,
  pendingQuerySchema,
} from "./reminders.validator.ts";

/** Mounted at /gyms/:gymId/reminders. */
export const remindersRouter: Router = Router({ mergeParams: true });

remindersRouter.get("/pending", validate(pendingQuerySchema, "query"), controller.pending);
remindersRouter.get("/", validate(listRemindersQuerySchema, "query"), controller.list);

/** Mounted at /gyms/:gymId/members/:memberId/reminders. */
export const memberRemindersRouter: Router = Router({ mergeParams: true });

memberRemindersRouter.post("/", validate(logReminderSchema), controller.log);
