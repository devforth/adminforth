
/**
 * Might have implementations like RAM, Redis, Memcached,
 * 
 */
export interface KeyValueAdapter {

  get(key: string): Promise<string | null>;

  listByPrefix(prefix: string, limit: number): Promise<Record<string, string>>;  
  
  set(key: string, value: string, expiresInSeconds?: number): Promise<void>;

  delete(key: string): Promise<void>;

}

  