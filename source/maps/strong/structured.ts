import { MultiKeyMap } from './base';

export class StructuredMultiKeyMap<K extends object, V> extends MultiKeyMap<V>
{
    set(key: Readonly<K>, value: V): void
    {
        throw new Error("Not implemented");
    }

    get(key: Readonly<K>): V | undefined
    {
        throw new Error("Not implemented");
    }

    has(key: Readonly<K>): boolean
    {
        throw new Error("Not implemented");
    }

    delete(key: Readonly<K>): boolean
    {
        throw new Error("Not implemented");
    }

    query(partial: Readonly<Partial<K>>): Array<{ key: K, value: V; }>
    {
        throw new Error("Not implemented");
    }
}