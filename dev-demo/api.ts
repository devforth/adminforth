import { Express } from "express";
import { IAdminForth } from "adminforth";

export function initApi(app: Express, admin: IAdminForth) {
  app.get(`${admin.config.baseUrl}/api/hello/`,
    (req, res) => {
      res.json({ message: "Hello from AdminForth API!" });
    }
  );
}