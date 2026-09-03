import type { RequestHandler } from "express";
import { ok, paginated } from "../../shared/utils/response.ts";
import { param } from "../../shared/utils/params.ts";
import * as service from "./payments.service.ts";
import type { ListPaymentsQuery, RecordPaymentInput } from "./payments.validator.ts";

export const record: RequestHandler = async (req, res) => {
  const result = await service.recordPayment(
    req.gym!,
    param(req, "memberId"),
    req.body as RecordPaymentInput,
    req.user!.id,
  );
  res.status(201).json(ok(result));
};

export const listForMember: RequestHandler = async (req, res) => {
  const query = req.query as unknown as ListPaymentsQuery;
  const { items, total } = await service.listMemberPayments(
    req.gym!,
    param(req, "memberId"),
    query,
  );
  res.json(paginated(items, query.page, query.limit, total));
};

export const listForGym: RequestHandler = async (req, res) => {
  const query = req.query as unknown as ListPaymentsQuery;
  const { items, total } = await service.listGymPayments(req.gym!, query);
  res.json(paginated(items, query.page, query.limit, total));
};
