import { AdminForthDataTypes } from '../../adminforth/index.js';
import { prepareApiBasedTools } from '../../plugins/adminforth-agent/apiBasedTools.js';

describe('adminforth-agent apiBasedTools', () => {
  it('formats get_resource_data datetime columns in the caller timezone', async () => {
    const adminforth = {
      config: {
        baseUrl: 'http://localhost:3000',
      },
      tr: async (msg: string) => msg,
      setupEndpoints(server: { endpoint: (options: any) => void }) {
        server.endpoint({
          method: 'POST',
          path: '/get_resource',
          request_schema: {},
          response_schema: {},
          handler: ({ body }: { body: Record<string, unknown> }) => ({
            resource: {
              resourceId: body.resourceId,
              columns: [
                {
                  name: 'created_at',
                  type: AdminForthDataTypes.DATETIME,
                },
                {
                  name: 'updated_at',
                  type: AdminForthDataTypes.DATETIME,
                },
                {
                  name: 'raw_iso_note',
                  type: AdminForthDataTypes.STRING,
                },
              ],
            },
          }),
        });

        server.endpoint({
          method: 'POST',
          path: '/get_resource_data',
          request_schema: {},
          response_schema: {},
          handler: () => ({
            data: [
              {
                created_at: '2026-04-18T12:32:45.123Z',
                updated_at: '2026-04-18T23:01:02.003Z',
                raw_iso_note: '2026-04-18T12:32:45.123Z',
              },
            ],
            total: 1,
          }),
        });
      },
    } as any;

    const tools = prepareApiBasedTools(adminforth);
    const output = await tools.get_resource_data.call({
      inputs: {
        resourceId: 'adminuser',
        source: 'list',
        limit: 1,
        offset: 0,
        filters: [],
        sort: [],
      },
      userTimeZone: 'Europe/Kyiv',
    });

    expect(output).toContain('18 Apr 2026, 15:32:45.123 (GMT+3)');
    expect(output).toContain('19 Apr 2026, 02:01:02.003 (GMT+3)');
    expect(output).toContain('raw_iso_note: 2026-04-18T12:32:45.123Z');
    expect(output).not.toContain('created_at: 2026-04-18T12:32:45.123Z');
    expect(output).not.toContain('updated_at: 2026-04-18T23:01:02.003Z');
  });
});
