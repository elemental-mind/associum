import { MultiKeyMap } from './base';

export class UnorderedMultiKeyMap<K, V> extends MultiKeyMap<V>
{
    set(keys: readonly K[], value: V): void
    {
        throw new Error("Not implemented");
    }

    get(keys: readonly K[]): V | undefined
    {
        throw new Error("Not implemented");
    }

    has(keys: readonly K[]): boolean
    {
        throw new Error("Not implemented");
    }

    delete(keys: readonly K[]): boolean
    {
        throw new Error("Not implemented");
    }
}

export class QueryableUnorderedMultikeyMap<K, V> extends UnorderedMultiKeyMap<K, V>
{
    set(keys: readonly K[], value: V): void
    {
        throw new Error("Not implemented");
    }

    query(keys: readonly K[])
    {
        throw new Error("Not implemented");
    }
}