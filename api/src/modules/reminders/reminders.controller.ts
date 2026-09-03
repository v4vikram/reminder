import type { RequestHandler } from "express";
import { ok, paginated } from "../../shared/utils/response.ts";
import { param } from "../../shared/utils/params.ts";
import * as service from "./reminders.service.ts";
import type {
  ListRemindersQuery,
  LogReminderInput,
  PendingQuery,
} from "./reminders.validator.ts";

export const pending: RequestHandler = async (req, res) => {
  const items = await service.listPending(req.gym!, req.query as unknown as PendingQuery);
  res.json(ok(items));
};

export const log: RequestHandler = async (req, res) => {
  const reminder = await service.logReminder(
    req.gym!,
    param(req, "memberId"),
    req.body as LogReminderInput,
  );
  res.status(201).json(ok(reminder));
};

export const list: RequestHandler = async (req, res) => {
  const query = req.query as unknown as ListRemindersQuery;
  const { items, total } = await service.listReminders(req.gym!, query);
  res.json(paginated(items, query.page, query.limit, total));
};
