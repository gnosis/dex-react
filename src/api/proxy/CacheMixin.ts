/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeCache from 'node-cache'

interface CacheOptions<T> {
  method: keyof T
  ttl?: number
  hashFn?: (...params: any[]) => string
}

interface CacheMethodParams<T, P, R> extends CacheOptions<T> {
  fnToCache: (params: P) => R
  instance: T
}

export class CacheMixin {
  private cache: NodeCache

  public constructor() {
    this.cache = new NodeCache({ useClones: false })
  }

  /**
   * Injects into provided `instance` a version with cache according to the list `toCache`.
   * Injected methods will obey `ttl` if provided, otherwise global cache config.
   *
   * @param instance Class instance to cache
   * @param toCache List of configs for methods to be cached
   */
  public injectCache<T>(instance: T, toCache: CacheOptions<T>[]): void {
    toCache.forEach(cacheConfig => {
      const { method } = cacheConfig
      const methodName = method.toString()

      const fnToCache = instance[methodName]

      const params: CacheMethodParams<T, Parameters<typeof fnToCache>, ReturnType<typeof fnToCache>> = {
        ...cacheConfig,
        fnToCache,
        instance,
      }

      instance[methodName] = this.cacheMethod(params)
    })
  }

  /**
   * HOF that returns a new function caching the return value of provided `fnToCache`
   */
  public cacheMethod<T, P, R>({
    fnToCache,
    instance,
    method,
    ttl,
    hashFn,
  }: CacheMethodParams<T, P, R>): (params: P) => R {
    return (params: P): R => {
      const hash = hashFn ? hashFn(method, params) : this.hashParams(method.toString(), params)

      let value = this.get<R>(hash)

      if (value) {
        // cache hit
        return value
      }

      // call original fn
      // needs to bind to original instance so it has the proper `this`
      value = fnToCache.bind(instance)(params)

      // save it for next round
      this.store(hash, value, ttl)

      return value as R
    }
  }

  private get<R>(hash: string): R | undefined {
    const obj = this.cache.get(hash)

    if (obj) {
      console.debug(`cache hit for ${hash}`)
      return obj as R
    }

    return
  }

  private store<R>(hash: string, obj: R, expiration?: number): void {
    if (expiration) {
      // with TTL
      this.cache.set(hash, obj, expiration)
    } else {
      // based on default config
      this.cache.set(hash, obj)
    }
  }

  /**
   * Dumb hash function that simply glues together paramName:paramValue
   * Assumes all values being hashed can be converted to string
   * Sorts parameters for determinism
   *
   * TODO: replace this with an actual hash function once testing is done
   *
   * @param params The params we want to hash
   *
   */
  private hashParams<P>(methodName: string, params: P): string {
    return Object.keys(params)
      .sort()
      .reduce((acc, key) => `${acc}|${key}:${params[key]}`, methodName)
  }
}
