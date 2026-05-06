import { Express, Response } from "express";
import { IAdminForth, IAdminUserExpressRequest } from "adminforth";
import * as z from "zod";
import TwoFactorsAuthPlugin from "../plugins/adminforth-two-factors-auth/index.js";

const DASHBOARD_CAR_SOURCES = [
  { resourceId: 'cars_sl', label: 'SQLite' },
  { resourceId: 'cars_mysql', label: 'MySQL' },
  { resourceId: 'cars_pg', label: 'PostgreSQL' },
  { resourceId: 'cars_mongo', label: 'MongoDB' },
  { resourceId: 'cars_ch', label: 'ClickHouse' },
] as const;

type DashboardCarRecord = {
  model: string;
  price: string | number;
  listed: boolean;
  mileage: string | number | null;
  production_year: number;
  engine_type: string;
  body_type: string;
};
 
function toNumber(value: string | number | null): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  return 0;
}

function roundMetric(value: number): number {
  return Number(value.toFixed(0));
}

function getBreakdown(records: DashboardCarRecord[], fieldName: 'engine_type' | 'body_type') {
  const counts: Record<string, number> = {};

  records.forEach((record) => {
    counts[record[fieldName]] = (counts[record[fieldName]] ?? 0) + 1;
  });

  return Object.entries(counts)
    .map(([label, amount]) => ({ label, amount }))
    .sort((left, right) => right.amount - left.amount || left.label.localeCompare(right.label));
}

function getTopModels(records: DashboardCarRecord[]) {
  const counts: Record<string, number> = {};

  records.forEach((record) => {
    counts[record.model] = (counts[record.model] ?? 0) + 1;
  });

  return Object.entries(counts)
    .map(([x, count]) => ({ x, count }))
    .sort((left, right) => right.count - left.count || left.x.localeCompare(right.x))
    .slice(0, 6);
}

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

  app.get(`${admin.config.baseUrl}/api/dashboard/`,
    admin.express.withSchema(
      {
        description: 'Returns aggregated car metrics used by the dev demo dashboard custom page.',
        response: z.object({
          summary: z.object({
            totalCars: z.number(),
            listedCars: z.number(),
            unlistedCars: z.number(),
            averagePrice: z.number(),
            averageMileage: z.number(),
          }),
          operations: z.object({
            adminUsers: z.number(),
            sessions: z.number(),
            backgroundJobs: z.number(),
          }),
          sourceTotals: z.array(
            z.object({
              source: z.string(),
              count: z.number(),
              listed: z.number(),
              avgPrice: z.number(),
            })
          ),
          engineTypeBreakdown: z.array(
            z.object({
              label: z.string(),
              amount: z.number(),
            })
          ),
          bodyTypeBreakdown: z.array(
            z.object({
              label: z.string(),
              amount: z.number(),
            })
          ),
          topModels: z.array(
            z.object({
              x: z.string(),
              count: z.number(),
            })
          ),
        }),
      },
      admin.express.authorize(
        async (_req: IAdminUserExpressRequest, res: Response) => {
          const [carsBySource, adminUsers, sessions, backgroundJobs] = await Promise.all([
            Promise.all(
              DASHBOARD_CAR_SOURCES.map(async ({ resourceId, label }) => {
                const records = await admin.resource(resourceId).list([]) as DashboardCarRecord[];

                return { label, records };
              })
            ),
            admin.resource('adminuser').count(),
            admin.resource('sessions').count(),
            admin.resource('jobs').count(),
          ]);

          const allCars = carsBySource.flatMap(({ records }) => records);
          const totalCars = allCars.length;
          const listedCars = allCars.filter((record) => record.listed).length;
          const totalPrice = allCars.reduce((sum, record) => sum + toNumber(record.price), 0);
          const totalMileage = allCars.reduce((sum, record) => sum + toNumber(record.mileage), 0);

          res.json({
            summary: {
              totalCars,
              listedCars,
              unlistedCars: totalCars - listedCars,
              averagePrice: totalCars > 0 ? roundMetric(totalPrice / totalCars) : 0,
              averageMileage: totalCars > 0 ? roundMetric(totalMileage / totalCars) : 0,
            },
            operations: {
              adminUsers,
              sessions,
              backgroundJobs,
            },
            sourceTotals: carsBySource.map(({ label, records }) => ({
              source: label,
              count: records.length,
              listed: records.filter((record) => record.listed).length,
              avgPrice: records.length > 0
                ? roundMetric(records.reduce((sum, record) => sum + toNumber(record.price), 0) / records.length)
                : 0,
            })),
            engineTypeBreakdown: getBreakdown(allCars, 'engine_type'),
            bodyTypeBreakdown: getBreakdown(allCars, 'body_type'),
            topModels: getTopModels(allCars),
          });
        }
      )
    )
  );
  app.get(`${admin.config.baseUrl}/api/test2faCall/`,
    admin.express.authorize(
      async (_req: IAdminUserExpressRequest, res: Response) => {
        console.log('Received test2faCall');
        const { adminUser } = _req;
        const t2fa = admin.getPluginByClassName<TwoFactorsAuthPlugin>('TwoFactorsAuthPlugin');
        const verifyResult = await t2fa.verifyAuto(adminUser);
        res.json({ message: "2FA call received!" });
      }
    )
  );
}