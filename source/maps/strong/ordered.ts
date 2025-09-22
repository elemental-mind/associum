import type { MultikeyMapQueryResult } from '../../associatium';
import { ArrayMultikeyMap, QueryableArrayMultikeyMap } from './base';

export class OrderedMultiKeyMap<K extends Array<any>, V> extends ArrayMultikeyMap<K, V>
{
    encodeSettingComposite(keys: readonly K[]): string
    {
        return this.keyletsToComposite(this.mapToOrCreateKeylets(keys));
    }

    encodeProbingComposite(keys: readonly K[]): string | undefined
    {
        return this.mapToComposite(keys);
    }
}

export class QueryableOrderedMultikeyMap<K extends Array<any>, V> extends QueryableArrayMultikeyMap<K, V>
{
    encodeSettingComposite = OrderedMultiKeyMap.prototype.encodeSettingComposite;
    encodeProbingComposite = OrderedMultiKeyMap.prototype.encodeProbingComposite;

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
    queryWithOrderedFragment(keys: K): MultikeyMapQueryResult<K, V>[]
    {
        const { keylets, compositesWithKeylets } = this.getAllCompositesContaining(keys);

        return compositesWithKeylets
            .filter(compositeKey => this.compositeKeyMatchesQueryKeyletsOrder(keylets, compositeKey))
            .map(compositeKey => this.generateResultObject(compositeKey));
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
}