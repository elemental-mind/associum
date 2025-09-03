import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { StringListIntersector } from "./helpers/intersection.ts";
import type { MultikeyMapQueryResult } from "./associatium.ts";

class MultiKeyMap<V>
{
    static idProvider = new IDProvider(AlphaNumeric);
    static objectsToKeylets = new Map<any, string>();
    static keyletCountRegistry = new Map<string, number>();
    static keyletsToObjects = new Map<string, any>();

    static ensureKeylet(key: any): string
    {
        const id = this.objectsToKeylets.get(key);
        if (id) return id;

        const newId = this.idProvider.generateID();
        this.objectsToKeylets.set(key, newId);
        this.keyletsToObjects.set(newId, key);
        this.bindKeylet(newId);
        return newId;
    }

    static ensureKeylets(keys: readonly any[]): string[]
    {
        return keys.map(key => this.ensureKeylet(key));
    }

    static keysToKeylets(keys: readonly any[]): (string | undefined)[]
    {
        const keylets = [] as (string | undefined)[];
        for (const key of keys)
            keylets.push(this.objectsToKeylets.get(key));
        return keylets;
    }

    static keysToComposite(keys: readonly any[]): string | undefined
    {
        const keylets: string[] = [];
        for (const key of keys)
        {
            const keylet = this.objectsToKeylets.get(key);
            if (!keylet)
                return undefined;
            else
                keylets.push(keylet);
        }

        return this.keyletsToComposite(keylets);
    }

    static keyletsToComposite(keylets: string[])
    {
        return keylets.join("_");
    }

    static keyletToKey(id: string)
    {
        return this.keyletsToObjects.get(id);
    }

    static keyletsToKeys(ids: string[])
    {
        return ids.map(id => this.keyletToKey(id)!);
    }

    static compositeToKeylets(composite: string)
    {
        return composite.split("_");
    }

    static bindKeylet(keylet: string)
    {
        const currentCount = this.keyletCountRegistry.get(keylet) ?? 0;
        this.keyletCountRegistry.set(keylet, currentCount + 1);
    }

    static freeKeylet(keylet: string)
    {
        const currentCount = this.keyletCountRegistry.get(keylet) ?? 0;
        if (currentCount <= 1)
        {
            this.keyletCountRegistry.delete(keylet);
            const keyObj = this.keyletsToObjects.get(keylet);
            if (keyObj !== undefined)
            {
                this.objectsToKeylets.delete(keyObj);
            }
            this.keyletsToObjects.delete(keylet);
        }
        else
            this.keyletCountRegistry.set(keylet, currentCount - 1);
    }

    static freeComposite(composite: string)
    {
        const keylets = this.compositeToKeylets(composite);
        for (const keylet of keylets)
            this.freeKeylet(keylet);
    }

    protected map = new Map<string, V>();
}

export class OrderedMultiKeyMap<K, V> extends MultiKeyMap<V>
{
    set(keys: readonly K[], value: V): void
    {
        this.map.set(MultiKeyMap.keyletsToComposite(MultiKeyMap.ensureKeylets(keys)), value);
    }

    get(keys: readonly K[]): V | undefined
    {
        const composite = MultiKeyMap.keysToComposite(keys);
        if (!composite)
            return;
        else
            return this.map.get(composite);
    }

    has(keys: readonly K[]): boolean
    {
        const composite = MultiKeyMap.keysToComposite(keys);
        if (!composite)
            return false;
        else
            return this.map.has(composite);
    }

    delete(keys: readonly K[]): boolean
    {
        const composite = MultiKeyMap.keysToComposite(keys);
        if (!composite)
            return false;

        if (!this.map.delete(composite))
            return false;

        MultiKeyMap.freeComposite(composite);

        return true;
    }

    clear()
    {
        for (const composite of this.map.keys())
            MultiKeyMap.freeComposite(composite);

        this.map.clear();
    }
}

export class QueryableOrderedMultikeyMap<K, V> extends OrderedMultiKeyMap<K, V>
{
    //This holds associations like ... "abc" => "a_dba_abc|abc_ndf_b|bla_abc_foo" ... with keylets separated by _ and composites separated by |
    keyletToComposites = new Map<string, string>();

    set(keys: readonly K[], value: V): void
    {
        const composites = MultiKeyMap.ensureKeylets(keys);
        const compositeKey = composites.join("_");

        if (!this.map.has(compositeKey))
        {
            for (const keylet of composites)
            {
                const existingKeys = this.keyletToComposites.get(keylet);
                this.keyletToComposites.set(keylet, existingKeys ? `${existingKeys}|${compositeKey}` : compositeKey);
            }
        }

        this.map.set(compositeKey, value);
    }

    delete(keys: readonly K[]): boolean
    {
        const composite = MultiKeyMap.keysToComposite(keys);
        if (!composite)
            return false;

        if (!this.map.delete(composite))
            return false;

        MultiKeyMap.freeComposite(composite);

        for (const keylet of MultiKeyMap.compositeToKeylets(composite))
        {
            const leftOverCompositesWithCurrentKeylet = this.keyletToComposites.get(keylet)!
                .split("|")
                .filter(keyletComposite => keyletComposite !== composite);

            if (leftOverCompositesWithCurrentKeylet.length === 0)
                this.keyletToComposites.delete(keylet);
            else
                this.keyletToComposites.set(keylet, leftOverCompositesWithCurrentKeylet.join("|"));
        }

        return true;
    }

    clear()
    {
        super.clear();
        this.keyletToComposites.clear();
    }

    /**
     * Returns entries that have any of the given query keys in their key tuple
     * @param keys An array of keys of which at least one should appear in the tuple of any result key
     * @example 
     * ```ts 
     *  map.set(["A", "B"], 123);
     *  map.set(["C", "D"], 456);
     * 
     *  map.query(["B", "A"]) // yields [{key: ["A", "B"], value: 123}] as "A" and "B" appear both in this result
     *  map.query(["D", "B"]) // yields [{key: ["A", "B"], value: 123}, {key: ["C", "D"], value: 456}], as "D" appears in key of second object and "B" appears in key of first object.
     * ```
     */
    query(keys: readonly K[]): MultikeyMapQueryResult<K, V>[]
    {
        const { compositesWithKeylets } = this.queryCompositesWith(keys);

        return compositesWithKeylets
            .map(compositeKey => this.generateResultObject(compositeKey));
    }

    /**
     * Returns entries that match the key fragment in order
     * @param keys An partial or full array of keys that need to form part of the composite key
     * @example 
     * ```ts 
     *  map.set(["A", "B", "C", "D"], 123);
     *  map.query(["B", "D"]) // yields [{key: ["A", "B", "C", "D"], value: 123}]
     *  map.query(["D", "B"]) // yields [], as there is a key with "B" and "D", but not in the right order
     * ```
     */
    queryWithOrderedFragment(keys: readonly K[]): MultikeyMapQueryResult<K, V>[]
    {
        const { keylets, compositesWithKeylets } = this.queryCompositesWith(keys);

        return compositesWithKeylets
            .filter(compositeKey => this.compositeKeyMatchesQueryKeyletsOrder(keylets, compositeKey))
            .map(compositeKey => this.generateResultObject(compositeKey));
    }

    private queryCompositesWith(keys: readonly K[])
    {
        const keylets: string[] = [];
        const intersector = new StringListIntersector();

        for (const key of keys)
        {
            const keylet = MultiKeyMap.objectsToKeylets.get(key);
            if (!keylet) continue;

            keylets.push(keylet);

            intersector.addToIntersection(this.getCompositeKeysForKeylet(keylet));
        }

        const compositesWithKeylets = intersector.computeIntersection();

        return { keylets, compositesWithKeylets };
    }

    private compositeKeyMatchesQueryKeyletsOrder(keyletsInQueryOrder: string[], compositeKey: string)
    {
        let lastIndex = -1;
        for (const keylet of keyletsInQueryOrder)
        {
            const foundIndex = compositeKey.indexOf(keylet, lastIndex);
            if (foundIndex <= lastIndex)
                return false;

            lastIndex = foundIndex + 1;
        }

        return true;
    }

    private getCompositeKeysForKeylet(keylet: string)
    {
        const keyletContainingKeys = this.keyletToComposites.get(keylet);
        if (!keyletContainingKeys) return [];

        return keyletContainingKeys.split("|");
    }

    private generateResultObject(compositeKey: string): MultikeyMapQueryResult<K, V>
    {
        const key = MultiKeyMap.keyletsToKeys(compositeKey.split("_"));
        const value = this.map.get(compositeKey)!;

        return { key, value };
    }
}

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