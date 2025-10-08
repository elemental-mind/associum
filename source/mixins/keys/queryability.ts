import { compositeSeparator, keyIndexPrefix, keyletSeparator, keyValuePrefix } from "../../constants.ts";
import { StringListIntersector } from "../../helpers/intersection.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";
import type { MapQueryResult } from "../interfaces.ts";

export function NonqueryableKeys(Base: new (...args: any[]) => AssociationContainer)
{
    class NonqueryableKeys extends Base
    {
        static readonly kind = "NonqueryableKeys" as const;
        declare keysQueryable: boolean;
    }

    NonqueryableKeys.prototype.keysQueryable = false;
    return NonqueryableKeys;
}

export function QueryableKeys(Base: new (...args: any[]) => AssociationContainer)
{
    class QueryableKeys extends Base
    {
        static readonly kind = "QueryableKeys" as const;
        declare keysQueryable: boolean;

        _bindKeylets(keylets: string[], bindToKey?: string[]): void
        {
            super._bindKeylets(keylets, bindToKey);

            //When a value is set, we skip indexing
            if (bindToKey) return;

            for (const keylet of keylets)
            {
                const keyletIndexKey = keyIndexPrefix + keylet;
                const existingComposites = super.get(keyletIndexKey);
                const composite = keylets.join(keyletSeparator);
                super.set(keyIndexPrefix + keylet, existingComposites ? (existingComposites + compositeSeparator + composite) : composite);
            }
        }

        _releaseKeylets(keylets: string[], releaseFromKey?: string[]): void
        {
            super._releaseKeylets(keylets, releaseFromKey);

            //When a value is set, we skip indexing
            if (releaseFromKey) return;

            for (const keylet of keylets)
            {
                const keyletIndexKey = keyIndexPrefix + keylet;
                const composite = keylets.join(keyletSeparator);
                const remainingComposites = super.get(keyletIndexKey).split(compositeSeparator).filter(c => c !== composite).join(compositeSeparator);

                if (!remainingComposites) super.delete(keyletIndexKey);
            }
        }

        queryKeysMatching(keyTemplate: any): MapQueryResult<any, any>[]
        {
            const keylets = [];
            const indicesThatNeedToMatch = [];

            if (!this._encodeQueryKey(keyTemplate, keylets, indicesThatNeedToMatch)) return [];

            const alreadyChecked = new Set<string>();
            const results: MapQueryResult<any, any>[] = [];

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
                            key: this._decodeKey(compositeKeylets),
                            value: this._decodeValue(super.get(keyValuePrefix + composite))
                        });
                }
            }

            return results;
        }

        queryKeysIndexedWith(keys: any[]): MapQueryResult<any, any>[]
        {
            const keylets = [];
            const indicesThatNeedToMatch = [];

            if (!this._encodeQueryKey(keys, keylets, indicesThatNeedToMatch)) return [];

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
                    key: this._decodeKey(compositeKeylets),
                    value: super._interceptGet(compositeKeylets)
                });
            }

            return results;
        }
    }

    QueryableKeys.prototype.keysQueryable = true;
    return QueryableKeys;
}