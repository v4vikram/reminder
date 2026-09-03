import type { RequestHandler } from "express";
import { ok, paginated } from "../../shared/utils/response.ts";
import { param } from "../../shared/utils/params.ts";
import * as service from "./members.service.ts";
import type {
  CreateMemberInput,
  ListMembersQuery,
  UpdateMemberInput,
} from "./members.validator.ts";

/**
 * Controllers parse the request, call the service, and format the response.
 * No business rules here, and no ownership checks - tenantGuard already
 * verified the gym and attached it to the request.
 *
 * req.gym is non-null because every route below is mounted behind tenantGuard.
 */

export const list: RequestHandler = async (req, res) => {
  const gym = req.gym!;
  const query = req.query as unknown as ListMembersQuery;

  const { items, total } = await service.listMembers(gym, query);
  res.json(paginated(items, query.page, query.limit, total));
};

export const getOne: RequestHandler = async (req, res) => {
  const member = await service.getMember(req.gym!, param(req, "memberId"));
  res.json(ok(member));
};

export const create: RequestHandler = async (req, res) => {
  const member = await service.createMember(req.gym!, req.body as CreateMemberInput);
  res.status(201).json(ok(member));
};

export const update: RequestHandler = async (req, res) => {
  const member = await service.updateMember(
    req.gym!,
    param(req, "memberId"),
    req.body as UpdateMemberInput,
  );
  res.json(ok(member));
};

export const deactivate: RequestHandler = async (req, res) => {
  await service.deactivateMember(req.gym!, param(req, "memberId"));
  res.status(204).send();
};
