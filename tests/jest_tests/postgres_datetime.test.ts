import { AdminForthDataTypes } from '../../adminforth/index.js';
import PostgresConnector from '../../adminforth/dataConnectors/postgres.js';

describe('PostgresConnector DATETIME normalization', () => {
  const connector = new PostgresConnector();
  const timestampField = {
    type: AdminForthDataTypes.DATETIME,
    _underlineType: 'timestamp',
    name: 'created_at',
    table: 'adminuser',
  } as any;

  it('parses raw postgres timestamp strings as UTC', () => {
    expect(connector.getFieldValue(timestampField, '2026-05-09 17:09:21.622')).toBe('2026-05-09T17:09:21.622Z');
  });

  it('accepts Date objects returned by pg timestamp parsers', () => {
    expect(connector.getFieldValue(timestampField, new Date('2026-05-09T17:09:21.622Z'))).toBe('2026-05-09T17:09:21.622Z');
  });
});