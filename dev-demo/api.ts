import { Express, Response } from "express";
import { IAdminForth, IAdminUserExpressRequest } from "adminforth";
import * as z from "zod";

export function initApi(app: Express, admin: IAdminForth) {
  app.get(`${admin.config.baseUrl}/api/hello/`,
    admin.express.withSchema(
      {
        description: 'Returns a simple authenticated example response and refreshes the demo menu badge.',
        response: z.object({
          message: z.string(),
        }),
      },
      admin.express.authorize(
        async (req: IAdminUserExpressRequest, res: Response) => {
          admin.refreshMenuBadge('menuTimestamp', req.adminUser);
          res.json({ message: "Hello from AdminForth API!" });
        }
      )
    )
  );
}