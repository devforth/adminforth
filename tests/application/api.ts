import { Express, Request, Response } from "express";
import { IAdminForth } from "adminforth";
export function initApi(app: Express, admin: IAdminForth) {
  app.get(`${admin.config.baseUrl}/api/hello/`,
    admin.express.withSchema(
      {
        description: 'Returns a public example response from a custom Express API.',
        response: {
          type: 'object',
          required: ['message', 'users'],
          properties: {
            message: { type: 'string' },
            users: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          additionalProperties: false,
        },
      },
      async (req: Request, res: Response) => {
        const allUsers = await admin.resource("adminuser").list([]);
        res.json({
          message: "Hello from AdminForth API!",
          users: allUsers,
        });
      }
    )
  );
}