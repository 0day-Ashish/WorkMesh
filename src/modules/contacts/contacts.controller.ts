import { Request, Response, NextFunction } from "express";
import prisma from "../../config/db";

export class ContactsController {
  public static async submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, email, message } = req.body;

      const submission = await prisma.contactSubmission.create({
        data: {
          full_name: fullName,
          email,
          message,
        },
      });

      res.status(201).json({
        success: true,
        message: "Contact inquiry submitted successfully",
        submission,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissions = await prisma.contactSubmission.findMany({
        orderBy: { created_at: "desc" },
      });
      res.status(200).json(submissions);
    } catch (error) {
      next(error);
    }
  }
}
