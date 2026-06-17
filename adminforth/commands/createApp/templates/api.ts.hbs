import { Express, Response } from "express";
import { IAdminForth, IAdminUserExpressRequest } from "adminforth";
import * as z from "zod";

export function initApi(app: Express, admin: IAdminForth) {
  app.get(`${admin.config.baseUrl}/api/hello/`,

    admin.express.withSchema(
      {
        description: "Returns example data from a custom Express API together with the current authenticated AdminForth user.",
        response: z.object({
          message: z.string(),
          users: z.array(z.record(z.string(), z.unknown())),
          adminUser: z.record(z.string(), z.unknown()),
        }),
      },

      // you can use data API to work with your database https://adminforth.dev/docs/tutorial/Customization/dataApi/
      // and admin.express.authorize to inject req.adminUser
      admin.express.authorize(
        async (req: IAdminUserExpressRequest, res: Response) => {
          const allUsers = await admin.resource("adminuser").list([]);
          res.json({
            message: "Hello from AdminForth API!",
            users: allUsers,
            adminUser: req.adminUser,
          });
        }
      )
    )
  );
}