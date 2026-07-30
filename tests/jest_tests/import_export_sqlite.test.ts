import { admin, agent, closeApplication, Filters } from './testApp';

const RESOURCE_ID = 'cars_sl';

let pluginBase: string;

// column-oriented CSV data (same shape PapaParse produces and the plugin expects)
function carData(rows: Array<Record<string, string>>) {
  const data: Record<string, string[]> = {};
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      (data[key] ??= []).push(value);
    }
  }
  return data;
}

function makeRow(id: string, overrides: Record<string, string> = {}) {
  return {
    id,
    model: `Model ${id}`,
    price: '1000',
    engine_type: 'gasoline',
    engine_power: '100',
    listed: 'true',
    mileage: '1000',
    ...overrides,
  };
}

beforeAll(async () => {
  const plugin = (admin as any).activatedPlugins.find(
    (p: any) => p.className === 'ImportExport' && p.resourceConfig?.resourceId === RESOURCE_ID,
  );
  expect(plugin).toBeDefined();
  pluginBase = `/adminapi/v1/plugin/${plugin.pluginInstanceId}`;

  // plugin endpoints now require authentication + create/edit/list/show access;
  // the agent keeps the auth cookie for all subsequent requests
  const login = await agent
    .post('/adminapi/v1/login')
    .send({ username: 'adminforth', password: 'adminforth' });
  expect(login.status).toEqual(200);
});

afterAll(async () => {
  await closeApplication();
});

describe('Import-Export plugin', () => {
  describe('POST /import-csv', () => {
    it('creates new records from column-oriented data', async () => {
      const res = await agent
        .post(`${pluginBase}/import-csv`)
        .send({ data: carData([makeRow('ie-1'), makeRow('ie-2')]) });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.importedCount).toEqual(2);
      expect(res.body.updatedCount).toEqual(0);
      expect(res.body.errors).toEqual([]);

      const created = await admin.resource(RESOURCE_ID).list([Filters.EQ('id', 'ie-1')]);
      expect(created.length).toEqual(1);
      expect(created[0].model).toEqual('Model ie-1');
    });

    it('coerces value types according to column definitions', async () => {
      await agent
        .post(`${pluginBase}/import-csv`)
        .send({ data: carData([makeRow('ie-types', { engine_power: '250', listed: 'false', mileage: '42' })]) });

      const [record] = await admin.resource(RESOURCE_ID).list([Filters.EQ('id', 'ie-types')]);
      expect(record.engine_power).toEqual(250); // INTEGER coerced from string
      expect(record.mileage).toEqual(42); // FLOAT coerced from string
      expect(record.listed).toEqual(false); // BOOLEAN coerced from "false"
    });

    it('updates existing records matched by primary key', async () => {
      const res = await agent
        .post(`${pluginBase}/import-csv`)
        .send({
          data: carData([
            makeRow('ie-1', { model: 'Model ie-1 UPDATED' }), // exists -> update
            makeRow('ie-3'), // new -> create
          ]),
        });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.importedCount).toEqual(1);
      expect(res.body.updatedCount).toEqual(1);

      const [updated] = await admin.resource(RESOURCE_ID).list([Filters.EQ('id', 'ie-1')]);
      expect(updated.model).toEqual('Model ie-1 UPDATED');
    });

    it('returns validation errors for unknown columns and imports nothing', async () => {
      const res = await agent
        .post(`${pluginBase}/import-csv`)
        .send({ data: carData([makeRow('ie-bad', { not_a_column: 'x' })]) });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(res.body.errors[0]).toContain("not_a_column");

      const found = await admin.resource(RESOURCE_ID).list([Filters.EQ('id', 'ie-bad')]);
      expect(found.length).toEqual(0);
    });
  });

  describe('POST /import-csv-new-only', () => {
    it('imports only new records and skips existing ones', async () => {
      const res = await agent
        .post(`${pluginBase}/import-csv-new-only`)
        .send({
          data: carData([
            makeRow('ie-1', { model: 'Model ie-1 MUST NOT CHANGE' }), // exists -> skip
            makeRow('ie-new-only'), // new -> create
          ]),
        });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.importedCount).toEqual(1);

      const [existing] = await admin.resource(RESOURCE_ID).list([Filters.EQ('id', 'ie-1')]);
      expect(existing.model).toEqual('Model ie-1 UPDATED'); // unchanged by new-only import

      const created = await admin.resource(RESOURCE_ID).list([Filters.EQ('id', 'ie-new-only')]);
      expect(created.length).toEqual(1);
    });
  });

  describe('POST /check-records', () => {
    it('reports existing vs new record counts by primary key', async () => {
      const res = await agent
        .post(`${pluginBase}/check-records`)
        .send({
          data: carData([
            makeRow('ie-1'), // exists
            makeRow('ie-2'), // exists
            makeRow('ie-does-not-exist'), // new
          ]),
        });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.total).toEqual(3);
      expect(res.body.existingCount).toEqual(2);
      expect(res.body.newCount).toEqual(1);
    });
  });

  describe('POST /export-csv', () => {
    it('exports all records with fields and rows', async () => {
      const res = await agent.post(`${pluginBase}/export-csv`).send({ filters: [], sort: [] });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.fields)).toBe(true);
      expect(res.body.data.fields).toContain('model');
      expect(res.body.data.fields).toContain('price');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.exportedCount).toEqual(res.body.data.data.length);
      expect(res.body.exportedCount).toBeGreaterThan(0);
    });

    it('respects filters when exporting', async () => {
      const res = await agent
        .post(`${pluginBase}/export-csv`)
        .send({ filters: [Filters.EQ('id', 'ie-1')], sort: [] });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.exportedCount).toEqual(1);

      const modelIdx = res.body.data.fields.indexOf('model');
      expect(res.body.data.data[0][modelIdx]).toEqual('Model ie-1 UPDATED');
    });
  });

  describe('JSON type fields', () => {
    const colorObj = { hex: '#ffffff', name: 'white' };

    it('exports JSON column object values as JSON strings', async () => {
      await admin.resource(RESOURCE_ID).create({
        id: 'ie-json',
        model: 'JSON Car',
        price: '1000',
        engine_type: 'gasoline',
        engine_power: 100,
        listed: true,
        mileage: 1000,
        color: colorObj,
      });

      const res = await agent
        .post(`${pluginBase}/export-csv`)
        .send({ filters: [Filters.EQ('id', 'ie-json')], sort: [] });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.exportedCount).toEqual(1);

      const colorIdx = res.body.data.fields.indexOf('color');
      const exported = res.body.data.data[0][colorIdx];
      expect(typeof exported).toEqual('string'); // object serialized for CSV
      expect(JSON.parse(exported)).toEqual(colorObj);
    });

    it('imports JSON column values supplied as JSON strings', async () => {
      const importedColor = { hex: '#000000', name: 'black' };
      const res = await agent
        .post(`${pluginBase}/import-csv`)
        .send({
          data: carData([
            makeRow('ie-json-import', { color: JSON.stringify(importedColor) }),
          ]),
        });

      expect(res.status).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.importedCount).toEqual(1);
      expect(res.body.errors).toEqual([]);

      const [record] = await admin.resource(RESOURCE_ID).list([Filters.EQ('id', 'ie-json-import')]);
      const stored = typeof record.color === 'string' ? JSON.parse(record.color) : record.color;
      expect(stored).toEqual(importedColor);
    });
  });
});
