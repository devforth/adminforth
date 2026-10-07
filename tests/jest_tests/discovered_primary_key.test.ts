import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(currentDir, '../application');

// resolves to the BUILT package (adminforth/dist) the test application runs on;
// rebuild it (`npx tsc` in adminforth/) after editing adminforth/index.ts or the assertions below test stale code
const require = createRequire(import.meta.url);
const adminforthEntry = require.resolve('adminforth', { paths: [applicationDir] });
const { default: AdminForth, primaryKeyColumnNames } = await import(pathToFileURL(adminforthEntry).href);

process.env.ADMINFORTH_SECRET ??= 'a'.repeat(64);

// like ClickHouse connector, reports every sorting key column as primaryKey although they are not unique
class SortingKeyConnector {
  supportsCompositePrimaryKey = false;

  async setupClient() {}

  async discoverFields() {
    return {
      id: { name: 'id', type: 'string' },
      user_id: { name: 'user_id', type: 'string', primaryKey: true },
      ts: { name: 'ts', type: 'datetime', primaryKey: true },
      amount: { name: 'amount', type: 'float' },
    };
  }
}

async function discover(columns: any[]) {
  // AdminForth allows one instance per process; each test needs a fresh one
  delete (globalThis as any).adminforth;
  const admin = new AdminForth({
    baseUrl: '',
    databaseConnectors: { sortingkey: SortingKeyConnector },
    dataSources: [{ id: 'events', url: 'sortingkey://events' }],
    resources: [{ resourceId: 'transactions', table: 'transactions', dataSource: 'events', columns }],
    menu: [{ label: 'Transactions', resourceId: 'transactions' }],
  });
  await admin.discoverDatabases();
  return admin.config.resources[0];
}

describe('discovered primaryKey', () => {
  it('is ignored when config marks another column as primaryKey', async () => {
    const resource = await discover([
      { name: 'id', primaryKey: true },
      { name: 'user_id' },
      { name: 'ts' },
      { name: 'amount' },
    ]);
    expect(primaryKeyColumnNames(resource)).toEqual(['id']);
  });

  it('is used when config marks no column as primaryKey', async () => {
    await expect(discover([{ name: 'user_id' }, { name: 'amount' }]))
      .resolves.toMatchObject({ columns: [{ name: 'user_id', primaryKey: true }, { name: 'amount' }] });
  });
});
