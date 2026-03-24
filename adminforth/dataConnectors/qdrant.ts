import { QdrantClient } from '@qdrant/js-client-rest';
import dayjs from 'dayjs';

import type {
	AdminForthConfig,
	AdminForthResource,
	AdminForthResourceColumn,
	IAdminForthAndOrFilter,
	IAdminForthDataSourceConnector,
	IAdminForthSingleFilter,
	IAdminForthSort,
} from '../types/Back.js';
import {
	AdminForthDataTypes,
	AdminForthFilterOperators,
	AdminForthSortDirections,
} from '../types/Common.js';
import AdminForthBaseConnector from './baseConnector.js';

type QdrantMatchValue = string | number | boolean;
type QdrantPointId = string | number;
type QdrantPoint = {
	id?: QdrantPointId;
	payload?: Record<string, any> | null;
	vector?: unknown;
};

class QdrantConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {
	private static readonly MIN_SCROLL_PAGE_SIZE = 50;

	async setupClient(url: string): Promise<void> {
		const parsed = new URL(url);
    const apiKey = parsed.searchParams.get('apiKey');
		this.client = new QdrantClient({
			url: `http://${parsed.host}`,
      ...(apiKey ? { apiKey } : {}),
		});
	}

	private getCollectionName(resource: AdminForthResource): string {
		return resource.table;
	}

  // Qdrant point ids can be strings or numbers
	private normalizePointId(value: any): QdrantPointId { 
		if (typeof value === 'number') {
			return value;
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) {
				throw new Error('Qdrant point id cannot be empty');
			}
			if (/^-?\d+$/.test(trimmed) && Number.isSafeInteger(Number(trimmed))) {
				return Number(trimmed);
			}
			return trimmed;
		}
		throw new Error(`Unsupported Qdrant point id type: ${typeof value}`);
	}

  // Checks if the filter is a simple equality filter on the 'id' 
	private getSingleIdFilterValue(filter: IAdminForthAndOrFilter): QdrantPointId | undefined {
		if (filter.operator !== AdminForthFilterOperators.AND || filter.subFilters.length !== 1) {
			return undefined;
		}

		const single = filter.subFilters[0] as IAdminForthSingleFilter;
		if (
			single.field !== 'id'
			|| single.operator !== AdminForthFilterOperators.EQ
			|| single.rightField !== undefined
			|| single.value === undefined
		) {
			return undefined;
		}

		return this.normalizePointId(single.value);
	}

  // check if we can use this filter in quadrant
	private isLocalOnlyFilter(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): boolean {
		const single = filter as IAdminForthSingleFilter;
		if (single.field || single.insecureRawNoSQL !== undefined || single.insecureRawSQL !== undefined) {
			return this.toQdrantFilter(filter) === undefined;
		}

		const complex = filter as IAdminForthAndOrFilter;
		return complex.subFilters.some((subFilter) => this.isLocalOnlyFilter(subFilter));
	}

  // get all collections
	async getAllTables(): Promise<Array<string>> {
		const collections = await this.client.getCollections();
		return (collections.collections ?? []).map((collection: { name: string }) => collection.name);
	}

  // discover fields 
	async discoverFields(resource) {
			return resource.columns.filter((col) => !col.virtual).reduce((acc, col) => {
					if (!col.type) {
							throw new Error(`Type is not defined for column ${col.name} in resource ${resource.table}`);
					}

					acc[col.name] = {
							name: col.name,
							type: col.type,
							primaryKey: col.primaryKey,
							virtual: col.virtual,
							_underlineType: col._underlineType,
					};
					return acc;
			}, {});
	}

  // get field value
	getFieldValue(field: AdminForthResourceColumn, value: any) {
		if (value === undefined) {
			return null;
		}
		if (field.type === AdminForthDataTypes.DATETIME) {
			return value ? dayjs(value).toISOString() : null;
		}
		if (field.type === AdminForthDataTypes.DATE) {
			return value ? dayjs(value).format('YYYY-MM-DD') : null;
		}
		if (field.type === AdminForthDataTypes.BOOLEAN) {
			return value === null ? null : !!value;
		}
		return value;
	}

  //just passthrough
	setFieldValue(_field: AdminForthResourceColumn, value: any) {
		return value;
	}
  
  // detect column type for the discover fields
	private detectColumnType(value: any): AdminForthDataTypes {
		if (value === null || value === undefined) {
			return AdminForthDataTypes.STRING;
		}
		if (typeof value === 'boolean') {
			return AdminForthDataTypes.BOOLEAN;
		}
		if (typeof value === 'number') {
			return Number.isInteger(value) ? AdminForthDataTypes.INTEGER : AdminForthDataTypes.FLOAT;
		}
		if (typeof value === 'string') {
			if (dayjs(value).isValid() && value.includes('T')) {
				return AdminForthDataTypes.DATETIME;
			}
			return AdminForthDataTypes.STRING;
		}
		return AdminForthDataTypes.JSON;
	}

  // get field value from point based on field name
	private getPointFieldValue(point: QdrantPoint, fieldName: string): any {
		if (fieldName === 'id') {
			return point.id ?? null;
		}
		if (fieldName === 'payload') {
			return point.payload ?? null;
		}
		if (fieldName === 'vector') {
			return point.vector ?? null;
		}
		return point.payload?.[fieldName] ?? null;
	}

  // for comparison purposes
	private normalizeComparable(value: any): any {
		if (Array.isArray(value)) {
			return value.map((item) => this.normalizeComparable(item));
		}
		if (value && typeof value === 'object') {
			return JSON.stringify(value);
		}
		return value;
	}

  // compare actual and expected values based on the operator
	private compareValues(operator: IAdminForthSingleFilter['operator'], actual: any, expected: any): boolean {
		switch (operator) {
			case AdminForthFilterOperators.EQ:
				return this.normalizeComparable(actual) === this.normalizeComparable(expected);
			case AdminForthFilterOperators.NE:
				return this.normalizeComparable(actual) !== this.normalizeComparable(expected);
			case AdminForthFilterOperators.GT:
				return actual > expected;
			case AdminForthFilterOperators.GTE:
				return actual >= expected;
			case AdminForthFilterOperators.LT:
				return actual < expected;
			case AdminForthFilterOperators.LTE:
				return actual <= expected;
			case AdminForthFilterOperators.LIKE:
				return String(actual ?? '').includes(String(expected ?? ''));
			case AdminForthFilterOperators.ILIKE:
				return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
			case AdminForthFilterOperators.IN:
				return Array.isArray(expected) && expected.some((item) => this.normalizeComparable(item) === this.normalizeComparable(actual));
			case AdminForthFilterOperators.NIN:
				return Array.isArray(expected) && !expected.some((item) => this.normalizeComparable(item) === this.normalizeComparable(actual));
			case AdminForthFilterOperators.IS_EMPTY:
				return actual === null || actual === undefined || actual === '' || (Array.isArray(actual) && actual.length === 0);
			case AdminForthFilterOperators.IS_NOT_EMPTY:
				return !(actual === null || actual === undefined || actual === '' || (Array.isArray(actual) && actual.length === 0));
			default:
				return true;
		}
	}

  // check if we can use this filter in quadrant
	private matchesFilter(point: QdrantPoint, filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): boolean {
		const single = filter as IAdminForthSingleFilter;
		if (single.field) {
			const actual = this.getPointFieldValue(point, single.field);
			const expected = single.rightField ? this.getPointFieldValue(point, single.rightField) : single.value;
			return this.compareValues(single.operator, actual, expected);
		}
		if (single.insecureRawNoSQL !== undefined || single.insecureRawSQL !== undefined) {
			return true;
		}

		const complex = filter as IAdminForthAndOrFilter;
		if (complex.operator === AdminForthFilterOperators.AND) {
			return complex.subFilters.every((subFilter) => this.matchesFilter(point, subFilter));
		}
		return complex.subFilters.some((subFilter) => this.matchesFilter(point, subFilter));
	}

  // transform input value to valid qdrant match value
	private toQdrantMatchValue(value: any): QdrantMatchValue | QdrantMatchValue[] | undefined {
		if (Array.isArray(value)) {
			const arr = value.filter((v) => ['string', 'number', 'boolean'].includes(typeof v)) as QdrantMatchValue[];
			return arr.length ? arr : undefined;
		}
		if (['string', 'number', 'boolean'].includes(typeof value)) {
			return value as QdrantMatchValue;
		}
		return undefined;
	}

  // convert our filter format to qdrant filter format
	private toQdrantFilter(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): any | undefined {
		const single = filter as IAdminForthSingleFilter;
		if (single.insecureRawNoSQL !== undefined) {
			return single.insecureRawNoSQL;
		}
		if (single.insecureRawSQL !== undefined) {
			return undefined;
		}
		if (single.field) {
			if (single.rightField || single.field === 'id' || single.field === 'vector' || single.field === 'payload') {
				return undefined;
			}
			const matchValue = this.toQdrantMatchValue(single.value);
			switch (single.operator) {
				case AdminForthFilterOperators.EQ:
					if (matchValue !== undefined && !Array.isArray(matchValue)) {
						return { must: [{ key: single.field, match: { value: matchValue } }] };
					}
					return undefined;
				case AdminForthFilterOperators.NE:
					if (matchValue !== undefined && !Array.isArray(matchValue)) {
						return { must_not: [{ key: single.field, match: { value: matchValue } }] };
					}
					return undefined;
				case AdminForthFilterOperators.IN:
					if (Array.isArray(matchValue)) {
						return { must: [{ key: single.field, match: { any: matchValue } }] };
					}
					return undefined;
				case AdminForthFilterOperators.NIN:
					if (Array.isArray(matchValue)) {
						return { must_not: [{ key: single.field, match: { any: matchValue } }] };
					}
					return undefined;
				case AdminForthFilterOperators.GT:
					return { must: [{ key: single.field, range: { gt: single.value } }] };
				case AdminForthFilterOperators.GTE:
					return { must: [{ key: single.field, range: { gte: single.value } }] };
				case AdminForthFilterOperators.LT:
					return { must: [{ key: single.field, range: { lt: single.value } }] };
				case AdminForthFilterOperators.LTE:
					return { must: [{ key: single.field, range: { lte: single.value } }] };
				default:
					return undefined;
			}
		}

		const complex = filter as IAdminForthAndOrFilter;
		const subFilters = complex.subFilters.map((subFilter) => this.toQdrantFilter(subFilter)).filter(Boolean);

		if (!subFilters.length) {
			return undefined;
		}
		if (complex.operator === AdminForthFilterOperators.AND) {
			return { must: subFilters };
		}
		return { should: subFilters, min_should: 1 };
	}

  // transform qdrant point to our record format  
	private mapPointToRecord(resource: AdminForthResource, point: QdrantPoint): Record<string, any> {
		const result: Record<string, any> = {};
		for (const column of resource.dataSourceColumns) {
			result[column.name] = this.getPointFieldValue(point, column.name);
		}
		return result;
	}

  // locally sort records
	private sortRecords(records: Record<string, any>[], sort: IAdminForthSort[]): Record<string, any>[] {
		if (!sort.length) {
			return records;
		}
		return [...records].sort((a, b) => {
			for (const sortItem of sort) {
				const left = a[sortItem.field];
				const right = b[sortItem.field];
				if (left === right) {
					continue;
				}
				if (left === null || left === undefined) {
					return sortItem.direction === AdminForthSortDirections.asc ? -1 : 1;
				}
				if (right === null || right === undefined) {
					return sortItem.direction === AdminForthSortDirections.asc ? 1 : -1;
				}
				if (left < right) {
					return sortItem.direction === AdminForthSortDirections.asc ? -1 : 1;
				}
				if (left > right) {
					return sortItem.direction === AdminForthSortDirections.asc ? 1 : -1;
				}
			}
			return 0;
		});
	}

  // check if we can sort in qdrant
	private canUseServerSideSort(resource: AdminForthResource, sort: IAdminForthSort[]): boolean {
		if (sort.length !== 1) {
			return false;
		}

		const fieldName = sort[0].field;
		if (['id', 'payload', 'vector'].includes(fieldName)) {
			return false;
		}

		const column = resource.dataSourceColumns.find((item) => item.name === fieldName);
		if (!column) {
			return false;
		}

		return [
			AdminForthDataTypes.STRING,
			AdminForthDataTypes.INTEGER,
			AdminForthDataTypes.FLOAT,
			AdminForthDataTypes.BOOLEAN,
			AdminForthDataTypes.DATE,
			AdminForthDataTypes.DATETIME,
		].includes(column.type as AdminForthDataTypes);
	}

	private isBadRequestError(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}
		return /bad request/i.test(error.message);
	}

  // get scroll arguments for qdrant
	private getScrollArgs(filters: IAdminForthAndOrFilter, limit: number, offset?: QdrantPointId) {
		const qdrantFilter = this.toQdrantFilter(filters);
		return {
			limit,
			...(offset !== undefined ? { offset } : {}),
			...(qdrantFilter ? { filter: qdrantFilter } : {}),
			with_payload: true as const,
			with_vector: true as const,
		};
	}

  // scroll request to qdrant
	private async scrollPage(resource: AdminForthResource, filters: IAdminForthAndOrFilter, limit: number, sort: IAdminForthSort[], offset?: QdrantPointId): Promise<{ response: any; usedServerSort: boolean; }> {
		const collectionName = this.getCollectionName(resource);
		const canUseServerSort = this.canUseServerSideSort(resource, sort);
		const baseArgs = this.getScrollArgs(filters, limit, offset);

		if (!canUseServerSort) {
			return {
				response: await this.client.scroll(collectionName, baseArgs),
				usedServerSort: false,
			};
		}

		try {
			return {
				response: await this.client.scroll(collectionName, {
					...baseArgs,
					order_by: {
						key: sort[0].field,
						direction: sort[0].direction === AdminForthSortDirections.asc ? 'asc' : 'desc',
					},
				}),
				usedServerSort: true,
			};
		} catch (error) {
			if (!this.isBadRequestError(error)) {
				throw error;
			}

			return {
				response: await this.client.scroll(collectionName, baseArgs),
				usedServerSort: false,
			};
		}
	}

  // filter points based on our filter format
	private filterPoints(points: QdrantPoint[], filters: IAdminForthAndOrFilter): QdrantPoint[] {
		const qdrantFilter = this.toQdrantFilter(filters);
		return qdrantFilter ? points : points.filter((point) => this.matchesFilter(point, filters));
	}

  //scroll pages and filter them until we have enough matches or no more data
	private async collectMatchingPoints(resource: AdminForthResource, filters: IAdminForthAndOrFilter, sort: IAdminForthSort[], requiredMatches: number): Promise<{ points: QdrantPoint[]; usedServerSort: boolean; }> {
		let offset: QdrantPointId | undefined;
		let usedServerSort = false;
		const points: QdrantPoint[] = [];
		const pageSize = Math.max(requiredMatches, QdrantConnector.MIN_SCROLL_PAGE_SIZE);

		while (points.length < requiredMatches) {
			const page = await this.scrollPage(resource, filters, pageSize, sort, offset);
			usedServerSort = page.usedServerSort;

			const pagePoints = (page.response?.points ?? []) as QdrantPoint[];
			points.push(...this.filterPoints(pagePoints, filters));

			const nextOffset = page.response?.next_page_offset as QdrantPointId | undefined;
			if (!nextOffset || pagePoints.length === 0) {
				break;
			}

			offset = nextOffset;
		}

		return { points, usedServerSort };
	}

  // get records by direct ID
	private async getDirectIdRecords(resource: AdminForthResource, pointId: QdrantPointId, sort: IAdminForthSort[]): Promise<any[]> {
		const points = await this.client.retrieve(this.getCollectionName(resource), {
			ids: [pointId],
			with_payload: true,
			with_vector: true,
		});

		const records = ((points ?? []) as QdrantPoint[]).map((point) => this.mapPointToRecord(resource, point));
		return sort.length ? this.sortRecords(records, sort) : records;
	}

	async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }: {
		resource: AdminForthResource;
		limit: number;
		offset: number;
		sort: IAdminForthSort[];
		filters: IAdminForthAndOrFilter;
	}): Promise<any[]> {
		const directId = this.getSingleIdFilterValue(filters);
		if (directId !== undefined) {
			const records = await this.getDirectIdRecords(resource, directId, sort);
			return records.slice(offset, offset + limit);
		}

		const requestedLimit = Math.max(limit + offset, 1);
		const localFilteringRequired = this.isLocalOnlyFilter(filters);
		const result = localFilteringRequired
			? await this.collectMatchingPoints(resource, filters, sort, requestedLimit)
			: await this.scrollPage(resource, filters, requestedLimit, sort);
		const points = 'points' in result ? result.points : this.filterPoints((result.response?.points ?? []) as QdrantPoint[], filters);

		let records = points.map((point) => this.mapPointToRecord(resource, point));
		if (!result.usedServerSort) {
			records = this.sortRecords(records, sort);
		}

		return records.slice(offset, offset + limit);
	}

	async getCount({ resource, filters }: { resource: AdminForthResource; filters: IAdminForthAndOrFilter; }): Promise<number> {
		const collectionName = this.getCollectionName(resource);
		const directId = this.getSingleIdFilterValue(filters);

		if (directId !== undefined) {
			const points = await this.client.retrieve(collectionName, {
				ids: [directId],
				with_payload: false,
				with_vector: false,
			});
			return (points ?? []).length;
		}

		const qdrantFilter = this.toQdrantFilter(filters);

		if (qdrantFilter || filters.subFilters.length === 0) {
			const result = await this.client.count(collectionName, {
				...(qdrantFilter ? { filter: qdrantFilter } : {}),
				exact: true,
			});
			return result.count ?? 0;
		}

		const allMatches = await this.collectMatchingPoints(resource, filters, [], Number.MAX_SAFE_INTEGER);
		return allMatches.points.length;
	}

	async getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource; columns: AdminForthResourceColumn[]; }): Promise<{ [key: string]: { min: any; max: any; }; }> {
		const response = await this.client.scroll(this.getCollectionName(resource), {
			limit: 10_000,
			with_payload: true,
			with_vector: true,
		});
		const records = ((response.points ?? []) as QdrantPoint[]).map((point) => this.mapPointToRecord(resource, point));
		const result: { [key: string]: { min: any; max: any; }; } = {};

		for (const column of columns) {
			const values = records.map((record) => record[column.name]).filter((value) => value !== null && value !== undefined);
			if (!values.length) {
				result[column.name] = { min: null, max: null };
				continue;
			}
			const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
			result[column.name] = {
				min: sorted[0],
				max: sorted[sorted.length - 1],
			};
		}

		return result;
	}

	async createRecordOriginalValues(): Promise<string> {
		throw new Error('Qdrant connector is read-only for AdminForth operations');
	}

	async updateRecordOriginalValues(): Promise<void> {
		throw new Error('Qdrant connector is read-only for AdminForth operations');
	}

	async deleteRecord(): Promise<boolean> {
		throw new Error('Qdrant connector is read-only for AdminForth operations');
	}

	async deleteMany(): Promise<number> {
		throw new Error('Qdrant connector is read-only for AdminForth operations');
	}

	async close() {
		return;
	}
}

export default QdrantConnector;
