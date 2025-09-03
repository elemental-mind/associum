import { WeakMultiKeyMap } from './base';

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