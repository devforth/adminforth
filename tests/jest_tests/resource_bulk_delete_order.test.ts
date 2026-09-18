import AdminForth from '../../adminforth/index.js';
import ConfigValidator from '../../adminforth/modules/configValidator.js';

function setup(parentBeforeSave: () => Promise<{ ok: boolean; error?: string }>) {
  const events: string[] = [];
  const parent = {
    resourceId: 'parents',
    dataSource: 'main',
    columns: [{ name: 'id', primaryKey: true }],
    hooks: {
      delete: {
        beforeSave: [async () => {
          events.push('parent-before');
          return parentBeforeSave();
        }],
        afterSave: [async () => {
          events.push('parent-after');
          return { ok: true };
        }],
      },
    },
  } as any;
  const child = {
    resourceId: 'children',
    dataSource: 'main',
    columns: [
      { name: 'id', primaryKey: true },
      { name: 'parent_id', foreignResource: { resourceId: 'parents', onDelete: 'cascade' } },
    ],
    hooks: {
      delete: {
        beforeSave: [async () => {
          events.push('child-before');
          return { ok: true };
        }],
        afterSave: [async () => {
          events.push('child-after');
          return { ok: true };
        }],
      },
    },
  } as any;
  const admin = Object.create(AdminForth.prototype) as any;
  admin.config = { resources: [parent, child] };
  admin.statuses = { dbDiscover: 'done' };
  admin.warnedDeprecatedResourceMutations = new Set();
  admin.connectors = {
    main: {
      getRecordByPrimaryKey: async () => ({ id: 'p1' }),
      deleteRecord: async ({ resource }) => {
        events.push(resource.resourceId === 'parents' ? 'parent-delete' : 'child-delete');
        return true;
      },
    },
  };
  admin.operationalResources = {
    children: {
      list: async () => {
        events.push('child-list');
        return [{ id: 'c1', parent_id: 'p1' }];
      },
    },
  };
  const actions = new ConfigValidator(admin, {} as any)
    .validateAndNormalizeBulkActions({ options: { bulkActions: [] } } as any, parent, []);
  const deleteChecked = actions[actions.length - 1];

  return {
    events,
    deleteChecked: () => deleteChecked.action({
      selectedIds: ['p1'],
      adminUser: {} as any,
      response: {} as any,
    } as any),
  };
}

describe('default bulk delete', () => {
  it('does not cascade when the parent beforeSave hook vetoes deletion', async () => {
    const { events, deleteChecked } = setup(async () => ({ ok: false, error: 'blocked' }));

    await expect(deleteChecked()).resolves.toMatchObject({ ok: false, error: 'blocked' });
    expect(events).toEqual(['parent-before']);
  });

  it('runs the parent veto hook before cascading and deletes each record once', async () => {
    const { events, deleteChecked } = setup(async () => ({ ok: true }));

    await expect(deleteChecked()).resolves.toMatchObject({ ok: true });
    expect(events).toEqual([
      'parent-before',
      'child-list',
      'child-before',
      'child-delete',
      'child-after',
      'parent-delete',
      'parent-after',
    ]);
  });
});
