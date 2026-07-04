import { Router } from "express";
import { ContactsController } from "./contacts.controller";
import { validateBody } from "../../middlewares/validateMiddleware";
import { createContactSchema } from "./contacts.schema";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requireRole } from "../../middlewares/roleMiddleware";

const createContactsRouter = (): Router => {
  const router = Router();

  // Public contact submission endpoint
  router.post("/", validateBody(createContactSchema), ContactsController.submitContact);

  // Admin-only contact listing endpoint
  router.get("/", authMiddleware, requireRole(["admin"]), ContactsController.listSubmissions);

  return router;
};

export default createContactsRouter;
