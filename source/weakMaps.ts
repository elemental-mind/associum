import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";

class WeakMultiKeyMap
{
    static idProvider = new IDProvider(AlphaNumeric);
    static keyletRegistry = new WeakMap<any, string>();
}

export class WeakOrderedMultiKeyMap<K extends object, V> extends WeakMultiKeyMap
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

export class WeakUnorderedMultiKeyMap<K extends object, V> extends WeakMultiKeyMap
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

export class WeakStructuredMultiKeyMap<TKey extends object, TValue> extends WeakMultiKeyMap
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