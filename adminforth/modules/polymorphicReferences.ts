import type { AdminForthResource, IAdminForth } from '../types/Back.js';
import { Filters } from '../types/Back.js';

/** Fill discriminator columns only after user-provided columns have passed access checks. */
export async function resolvePolymorphicReferences(
  resource: AdminForthResource,
  record: Record<string, any>,
  adminforth: IAdminForth,
  oldRecord?: Record<string, any>,
): Promise<void> {
  for (const column of resource.columns) {
    const foreignResource = column.foreignResource;
    if (!foreignResource?.polymorphicOn || !(column.name in record)) {
      continue;
    }

    let discriminator: string | null | undefined = oldRecord ? null : undefined;
    if (record[column.name] === null) {
      record[foreignResource.polymorphicOn] = foreignResource.polymorphicResources.find((target) => target.resourceId === null).whenValue;
      continue;
    }
    if (record[column.name]) {
      for (const target of foreignResource.polymorphicResources) {
        if (target.resourceId === null) {
          continue;
        }
        const targetResource = adminforth.config.resources.find((candidate) => candidate.resourceId === target.resourceId);
        if (!targetResource) {
          continue;
        }
        const targetPrimaryKey = targetResource.columns.find((candidate) => candidate.primaryKey).name;
        const { data } = await adminforth.connectors[targetResource.dataSource].getData({
          resource: targetResource,
          limit: 1,
          offset: 0,
          filters: Filters.AND(Filters.EQ(targetPrimaryKey, record[column.name])),
          sort: [],
        });
        if (data.length) {
          discriminator = target.whenValue;
          break;
        }
      }
    } else {
      continue;
    }

    if (!oldRecord || oldRecord[foreignResource.polymorphicOn] !== discriminator) {
      record[foreignResource.polymorphicOn] = discriminator;
    }
  }
}
