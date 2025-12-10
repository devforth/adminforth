import type { AdminForthResourceColumnInputCommon, Predicate } from "./types/Common.js";

export function checkShowIf(c: AdminForthResourceColumnInputCommon, record: Record<string, any>) {
  if (!c.showIf) return true;

  const evaluatePredicate = (predicate: Predicate): boolean => {
    const results: boolean[] = [];

    if ("$and" in predicate) {
      results.push(predicate.$and.every(evaluatePredicate));
    }

    if ("$or" in predicate) {
      results.push(predicate.$or.some(evaluatePredicate));
    }

    const fieldEntries = Object.entries(predicate).filter(([key]) => !key.startsWith('$'));
    if (fieldEntries.length > 0) {
      const fieldResult = fieldEntries.every(([field, condition]) => {
        const recordValue = record[field];

        if (condition === undefined) {
          return true;
        }
        if (typeof condition !== "object" || condition === null) {
          return recordValue === condition;
        }

        if ("$eq" in condition) return recordValue === condition.$eq;
        if ("$not" in condition) return recordValue !== condition.$not;
        if ("$gt" in condition) return recordValue > condition.$gt;
        if ("$gte" in condition) return recordValue >= condition.$gte;
        if ("$lt" in condition) return recordValue < condition.$lt;
        if ("$lte" in condition) return recordValue <= condition.$lte;
        if ("$in" in condition) return (Array.isArray(condition.$in) && condition.$in.includes(recordValue));
        if ("$nin" in condition) return (Array.isArray(condition.$nin) && !condition.$nin.includes(recordValue));
        if ("$includes" in condition)
          return (
            Array.isArray(recordValue) &&
            recordValue.includes(condition.$includes)
          );
        if ("$nincludes" in condition)
          return (
            Array.isArray(recordValue) &&
            !recordValue.includes(condition.$nincludes)
          );

        return true;
      });
      results.push(fieldResult);
    }

    return results.every(result => result);
  };
  return evaluatePredicate(c.showIf);
}
