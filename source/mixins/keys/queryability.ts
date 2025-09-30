import { compositeSeparator, keyIndexPrefix, keyletSeparator, keyValuePrefix } from "../../constants.ts";
import { StringListIntersector } from "../../helpers/intersection.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";
import type { MapQueryResult } from "../interfaces.ts";

export function NonqueryableKeys(Base: new () => AssociationContainer)
{
    Base.prototype.keysQueryable = false;
    return Base;
}

export function QueryableKeys(Base: new () => AssociationContainer)
{
    class QueryableKeys<K, V> extends Base
    {
        declare keysQueryable: boolean;

        interceptSet(keylets: string[], value: any)
        {
            if (!super.interceptSet(keylets, value)) return false;
            this.addToIndex(keylets);
            return true;
        }

        interceptDelete(keylets: string[]): boolean
        {
            const itemWasDeleted = super.interceptDelete(keylets);
            if (itemWasDeleted) this.removeFromIndex(keylets);
            return itemWasDeleted;
        }

        queryKeysMatching(keyTemplate: any): MapQueryResult<K, V>[]
        {
            const keylets = [];
            const indicesThatNeedToMatch = [];

            if (!this.encodeQueryKey(keyTemplate, keylets, indicesThatNeedToMatch)) return [];

            const alreadyChecked = new Set<string>();
            const results: MapQueryResult<K, V>[] = [];

            for (const index of indicesThatNeedToMatch)
            {
                const keylet = keylets[index]!;
                const compositesStr = super.get(keyIndexPrefix + keylet);

                for (const composite of compositesStr.split(compositeSeparator))
                {
                    if (alreadyChecked.has(composite)) continue;
                    alreadyChecked.add(composite);

                    const compositeKeylets = composite.split(keyletSeparator);

                    if (indicesThatNeedToMatch.every(matchIndex => compositeKeylets[matchIndex] === keylets[matchIndex]))
                        results.push({
                            key: this.decodeKey(compositeKeylets) as K,
                            value: this.decodeValue(super.get(keyValuePrefix + composite)) as V
                        });
                }
            }

            return results;
        }

        queryKeysIndexedWith(keys: any[]): MapQueryResult<K, V>[]
        {
            const keylets = [];
            const indicesThatNeedToMatch = [];

            if (!this.encodeQueryKey(keys, keylets, indicesThatNeedToMatch)) return [];

            // Inline findCompositesContainingAllOf
            const intersector = new StringListIntersector();

            for (const keylet of keylets)
            {
                const comps = super.get(keyIndexPrefix + keylet)?.split(compositeSeparator) || [];
                intersector.addToIntersection(comps);
            }

            const compositeKeys = intersector.computeIntersection();

            const results = [];
            for (const composite of compositeKeys)
            {
                const compositeKeylets = composite.split(keyletSeparator);
                results.push({
                    key: this.decodeKey(compositeKeylets) as K,
                    value: super.interceptGet(compositeKeylets) as V
                });
            }

            return results;
        }

        addToIndex(keylets: string[])
        {
            for (const keylet of keylets)
            {
                const keyletIndexKey = keyIndexPrefix + keylet;
                const existingComposites = super.get(keyletIndexKey);
                const composite = keylets.join(keyletSeparator);
                super.set(keyIndexPrefix + keylet, existingComposites ? (existingComposites + compositeSeparator + composite) : composite);
            }
        }

        removeFromIndex(keylets: string[])
        {
            for (const keylet of keylets)
            {
                const keyletIndexKey = keyIndexPrefix + keylet;
                const composite = keylets.join(keyletSeparator);
                const remainingComposites = super.get(keyletIndexKey).split(compositeSeparator).filter(c => c !== composite).join(compositeSeparator);

                if (!remainingComposites) super.delete(keyletIndexKey);
            }
        }
    }

    QueryableKeys.prototype.keysQueryable = true;
    return QueryableKeys;
}