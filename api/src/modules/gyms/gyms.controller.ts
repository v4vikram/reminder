import type { RequestHandler } from "express";
import { ok } from "../../shared/utils/response.ts";
import * as service from "./gyms.service.ts";
import type { CreateGymInput, UpdateGymInput } from "./gyms.validator.ts";

export const create: RequestHandler = async (req, res) => {
  const gym = await service.createGym(req.user!.id, req.body as CreateGymInput);
  res.status(201).json(ok(gym));
};

export const getOne: RequestHandler = (req, res) => {
  res.json(ok(service.toResponse(req.gym!)));
};

export const update: RequestHandler = async (req, res) => {
  const gym = await service.updateGym(req.gym!, req.body as UpdateGymInput);
  res.json(ok(gym));
};
