import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate.ts";
import * as controller from "./auth.controller.ts";

export const authRouter: Router = Router();

// Public: these establish identity, so they cannot require it.
authRouter.get("/google", controller.startGoogleOAuth);
authRouter.get("/google/callback", controller.handleGoogleCallback);

authRouter.get("/me", authenticate, controller.getCurrentUser);
authRouter.post("/logout", authenticate, controller.logout);
