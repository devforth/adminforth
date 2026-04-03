import { Express } from "express";
import { IAdminForth, IAdminUserExpressRequest } from "adminforth";

export function initApi(app: Express, admin: IAdminForth) {
  app.get(`${admin.config.baseUrl}/api/hello/`,
    admin.express.authorize(
    async (req:IAdminUserExpressRequest, res: any) => {
      admin.refreshMenuBadge('menuTimestamp', req.adminUser);
      res.json({ message: "Hello from AdminForth API!" });
    }
  ));
}