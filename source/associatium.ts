

export class OrderedMultiKeyMap<K, V>
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

export class UnorderedMultiKeyMap<K, V>
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

export class StructuredMultiKeyMap<TKey extends object, TValue>
{
    set(key: Readonly<TKey>, value: TValue): void
    {
        throw new Error("Not implemented");
    }
    get(key: Readonly<TKey>): TValue | undefined
    {
        throw new Error("Not implemented");
    }
    has(key: Readonly<TKey>): boolean
    {
        throw new Error("Not implemented");
    }
    delete(key: Readonly<TKey>): boolean
    {
        throw new Error("Not implemented");
    }
    query(partial: Readonly<Partial<TKey>>): Array<{key: TKey, value: TValue}>
    {
        throw new Error("Not implemented");
    }
}

export class WeakOrderedMultiKeyMap<K extends object, V>
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

export class WeakUnorderedMultiKeyMap<K extends object, V>
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

export class WeakStructuredMultiKeyMap<TKey extends object, TValue>
{
    set(key: Readonly<TKey>, value: TValue): void
    {
        throw new Error("Not implemented");
    }
    get(key: Readonly<TKey>): TValue | undefined
    {
        throw new Error("Not implemented");
    }
    has(key: Readonly<TKey>): boolean
    {
        throw new Error("Not implemented");
    }
    delete(key: Readonly<TKey>): boolean
    {
        throw new Error("Not implemented");
    }
}