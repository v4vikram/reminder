import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.ts";
import * as controller from "./members.controller.ts";
import {
  createMemberSchema,
  listMembersQuerySchema,
  updateMemberSchema,
} from "./members.validator.ts";

/**
 * Mounted at /gyms/:gymId/members by the parent router, which applies
 * authenticate and tenantGuard. mergeParams lets this router read :gymId.
 */
export const membersRouter: Router = Router({ mergeParams: true });

membersRouter.get("/", validate(listMembersQuerySchema, "query"), controller.list);
membersRouter.post("/", validate(createMemberSchema), controller.create);

membersRouter.get("/:memberId", controller.getOne);
membersRouter.patch("/:memberId", validate(updateMemberSchema), controller.update);
membersRouter.delete("/:memberId", controller.deactivate);
