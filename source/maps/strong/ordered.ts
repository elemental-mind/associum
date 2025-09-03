import { MultiKeyMap } from './multiKeyMap';
import { StringListIntersector } from '../../helpers/intersection';
import type { MultikeyMapQueryResult } from '../../associatium';

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