import {
  COMPOSITE_RECORD_ID_SEPARATOR,
  compositePkValues,
  decodeRecordId,
  encodeRecordId,
  isCompositePrimaryKey,
  primaryKeyColumnNames,
} from '../../adminforth/modules/recordId.js';

const singlePkResource: any = {
  resourceId: 'cars',
  columns: [
    { name: 'id', primaryKey: true },
    { name: 'model' },
  ],
};

const compositePkResource: any = {
  resourceId: 'asset_network',
  columns: [
    { name: 'assetSymbol', primaryKey: true },
    { name: 'networkCode', primaryKey: true },
    { name: 'withdrawalFee' },
  ],
};

const triplePkResource: any = {
  resourceId: 'tenant_asset_network',
  columns: [
    { name: 'tenant', primaryKey: true },
    { name: 'asset_symbol', primaryKey: true },
    { name: 'network_code', primaryKey: true },
    { name: 'fee' },
  ],
};

describe('record id codec', () => {
  it('keeps raw value for resources with single primary key', () => {
    expect(isCompositePrimaryKey(singlePkResource)).toBe(false);
    expect(encodeRecordId(singlePkResource, { id: 42, model: 'x' })).toEqual(42);
    expect(decodeRecordId(singlePkResource, 42)).toEqual({ id: 42 });
  });

  it('unwraps { pk, label } values returned for foreignResource columns', () => {
    expect(encodeRecordId(singlePkResource, { id: { pk: 7, label: 'seven' } })).toEqual(7);
  });

  it('glues composite primary key parts', () => {
    expect(isCompositePrimaryKey(compositePkResource)).toBe(true);
    expect(primaryKeyColumnNames(compositePkResource)).toEqual(['assetSymbol', 'networkCode']);
    const recordId = encodeRecordId(compositePkResource, { assetSymbol: 'BTC', networkCode: 'ERC20', withdrawalFee: '0.1' });
    expect(recordId).toEqual(`BTC${COMPOSITE_RECORD_ID_SEPARATOR}ERC20`);
    expect(decodeRecordId(compositePkResource, recordId)).toEqual({ assetSymbol: 'BTC', networkCode: 'ERC20' });
  });

  it('escapes separator and url-unsafe characters in values', () => {
    const record = { assetSymbol: 'a~b', networkCode: 'c/d e' };
    const recordId = encodeRecordId(compositePkResource, record);
    expect(recordId.split(COMPOSITE_RECORD_ID_SEPARATOR)).toHaveLength(2);
    expect(decodeRecordId(compositePkResource, recordId)).toEqual(record);
  });

  it('keeps numbers decodable as strings which connectors cast to column types', () => {
    const recordId = encodeRecordId(compositePkResource, { assetSymbol: 'BTC', networkCode: 10 });
    expect(decodeRecordId(compositePkResource, recordId)).toEqual({ assetSymbol: 'BTC', networkCode: '10' });
  });

  it('throws on record id with wrong number of parts', () => {
    expect(() => decodeRecordId(compositePkResource, 'BTC')).toThrow(/expected 2 parts/);
  });

  it('supports more then two primary key columns', () => {
    const record = { tenant: 'globex/eu', asset_symbol: 'USDT', network_code: 'ERC20', fee: 9 };
    const recordId = encodeRecordId(triplePkResource, record);
    expect(recordId).toEqual('globex%2Feu~USDT~ERC20');
    expect(decodeRecordId(triplePkResource, recordId)).toEqual({
      tenant: 'globex/eu', asset_symbol: 'USDT', network_code: 'ERC20',
    });
    expect(() => decodeRecordId(triplePkResource, 'acme~USDT')).toThrow(/expected 3 parts/);
  });

  it('throws when primary key column has no value in record', () => {
    expect(() => encodeRecordId(compositePkResource, { assetSymbol: 'BTC' })).toThrow(/networkCode/);
  });
});


describe('single primary key path is left untouched (pure extension)', () => {
  it('encodeRecordId returns exactly the raw column value, with no encoding', () => {
    for (const raw of [42, 'a~b', 'c/d e', 'BTC~ERC20', 0, false, '']) {
      expect(encodeRecordId(singlePkResource, { id: raw })).toBe(raw);
    }
  });

  it('decodeRecordId never splits or unescapes for single primary key', () => {
    expect(decodeRecordId(singlePkResource, 'a~b~c')).toEqual({ id: 'a~b~c' });
    expect(decodeRecordId(singlePkResource, '%2F')).toEqual({ id: '%2F' });
  });

  it('compositePkValues returns undefined, so connectors get pre-composite arguments', () => {
    const calls: any[] = [];
    const connector = { getPrimaryKeyValues: (...args: any[]) => { calls.push(args); return {}; } };
    expect(compositePkValues(connector as any, singlePkResource, '42')).toBeUndefined();
    // must not even be consulted for single primary key resources
    expect(calls).toHaveLength(0);
  });

  it('compositePkValues delegates to connector only for composite primary key', () => {
    const calls: any[] = [];
    const connector = {
      getPrimaryKeyValues: (...args: any[]) => {
        calls.push(args);
        return { assetSymbol: 'BTC', networkCode: 'ERC20' };
      },
    };
    expect(compositePkValues(connector as any, compositePkResource, 'BTC~ERC20'))
      .toEqual({ assetSymbol: 'BTC', networkCode: 'ERC20' });
    expect(calls).toEqual([[compositePkResource, 'BTC~ERC20']]);
  });

  it('compositePkValues tolerates connector without composite support', () => {
    expect(compositePkValues({} as any, compositePkResource, 'BTC~ERC20')).toBeUndefined();
  });
});
