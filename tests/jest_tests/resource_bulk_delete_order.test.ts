import AdminForth from '../../adminforth/index.js';
import ConfigValidator from '../../adminforth/modules/configValidator.js';

function setup(parentBeforeSave: () => Promise<{ ok: boolean; error?: string }>) {
  const events: string[] = [];
  let scopedDeleteCalls = 0;
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
  admin.resource = (resourceId: string) => {
    if (resourceId === 'children') {
      return admin.operationalResources.children;
    }
    return {
      asUser: (adminUser: any, { response, bulkDeleteHooks }: any) => ({
        delete: async (recordId: string) => {
          scopedDeleteCalls += 1;
          const result = await admin.executeDeleteResourceRecord({
            resource: parent,
            recordId,
            record: await admin.connectors.main.getRecordByPrimaryKey(parent, recordId),
            adminUser,
            response,
          }, true, bulkDeleteHooks);
          if (result.error) {
            throw new Error(result.error);
          }
          return true;
        },
      }),
    };
  };
  const actions = new ConfigValidator(admin, {} as any)
    .validateAndNormalizeBulkActions({ options: { bulkActions: [] } } as any, parent, []);
  const deleteChecked = actions[actions.length - 1];

  return {
    events,
    parent,
    scopedDeleteCalls: () => scopedDeleteCalls,
    deleteChecked: () => deleteChecked.action({
      selectedIds: ['p1'],
      adminUser: {} as any,
      response: {} as any,
    } as any),
  };
}

describe('default bulk delete', () => {
  it('does not cascade when the parent beforeSave hook vetoes deletion', async () => {
    const { events, scopedDeleteCalls, deleteChecked } = setup(async () => ({ ok: false, error: 'blocked' }));

    await expect(deleteChecked()).resolves.toMatchObject({ ok: false, error: 'blocked' });
    expect(scopedDeleteCalls()).toBe(1);
    expect(events).toEqual(['parent-before']);
  });

  it('runs the parent veto hook before cascading and deletes each record once', async () => {
    const { events, scopedDeleteCalls, deleteChecked } = setup(async () => ({ ok: true }));

    await expect(deleteChecked()).resolves.toMatchObject({ ok: true });
    expect(scopedDeleteCalls()).toBe(1);
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

  it('runs every beforeSave hook when one vetoes deletion', async () => {
    const { events, parent, deleteChecked } = setup(async () => ({ ok: false, error: 'blocked' }));
    parent.hooks.delete.beforeSave.push(async () => {
      events.push('parent-before-second');
      return { ok: true };
    });

    await expect(deleteChecked()).resolves.toMatchObject({ ok: false, error: 'blocked' });
    expect(events).toEqual(['parent-before', 'parent-before-second']);
  });

  it('runs every afterSave hook and ignores returned errors', async () => {
    const { events, parent, deleteChecked } = setup(async () => ({ ok: true }));
    parent.hooks.delete.afterSave[0] = async () => {
      events.push('parent-after');
      return { ok: false, error: 'after failed' };
    };
    parent.hooks.delete.afterSave.push(async () => {
      events.push('parent-after-second');
      return { ok: true };
    });

    await expect(deleteChecked()).resolves.toMatchObject({ ok: true });
    expect(events).toContain('parent-after-second');
    expect(events).toContain('parent-delete');
  });
});
