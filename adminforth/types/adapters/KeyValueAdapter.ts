
/**
 * Might have implementations like RAM, Redis, Memcached,
 * 
 */
export interface KeyValueAdapter {

  get(key: string): Promise<string | null>;
  
  set(key: string, value: string, expiresInSeconds?: number): Promise<void>;

  delete(key: string): Promise<void>;

}

  