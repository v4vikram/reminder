import type { RequestHandler } from "express";
import { ok } from "../../shared/utils/response.ts";
import { param } from "../../shared/utils/params.ts";
import * as service from "./fee-plans.service.ts";
import type { CreateFeePlanInput, UpdateFeePlanInput } from "./fee-plans.validator.ts";

export const list: RequestHandler = async (req, res) => {
  res.json(ok(await service.listPlans(req.gym!)));
};

export const create: RequestHandler = async (req, res) => {
  const plan = await service.createPlan(req.gym!, req.body as CreateFeePlanInput);
  res.status(201).json(ok(plan));
};

export const update: RequestHandler = async (req, res) => {
  const plan = await service.updatePlan(
    req.gym!,
    param(req, "planId"),
    req.body as UpdateFeePlanInput,
  );
  res.json(ok(plan));
};

export const remove: RequestHandler = async (req, res) => {
  await service.deletePlan(req.gym!, param(req, "planId"));
  res.status(204).send();
};
