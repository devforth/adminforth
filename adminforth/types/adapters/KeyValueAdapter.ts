
/**
 * Might have implementations like RAM, Redis, Memcached,
 * 
 */
export interface KeyValueAdapter {

  get(key: string, collection?: string): Promise<string | null>;

  listByPrefix(prefix: string, limit: number, collection?: string): Promise<Record<string, string>[]>;  
  
  set(key: string, value: string, expiresInSeconds?: number, collection?: string): Promise<void>;

  delete(key: string, collection?: string): Promise<void>;

}

  