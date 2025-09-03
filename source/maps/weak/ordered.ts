import { WeakMultiKeyMap } from './base';

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