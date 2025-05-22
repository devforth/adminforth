export const filtersTools = {
  get(query: any) {
    return {
      checkTopFilterExists(field: string) {
        return Array.isArray(query.filters)
          ? query.filters.some((f: any) => f.field === field)
          : false;
      },

      removeTopFilter(field: string) {
        if (!Array.isArray(query.filters)) {
          throw new Error('query.filters is not an array');
        }
      
        if (!this.checkTopFilterExists(field)) {
          throw new Error(`Top-level filter for field "${field}" not found`);
        }
      
        query.filters = query.filters.filter((f: any) => f.field !== field);
      },
      
      removeTopFilterIfExists(field: string) {
        try {
          this.removeTopFilter(field);
        } catch (e) {
          console.log(e);
        }
      },

      replaceOrAddTopFilter(filter: { field: string; value: any; operator: string }) {
          if (!Array.isArray(query.filters)) query.filters = [];
          this.removeTopFilterIfExists(filter.field);
          query.filters.push(filter);
        }
    };
  }
};