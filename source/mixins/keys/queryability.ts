import type { MapQueryResult } from "../../associativeMap.ts";
import { StringListIntersector } from "../../helpers/intersection.ts";
import { compositeSeparator, keyIndexPrefix, keyletSeparator } from "../../constants.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";
import type { KeyIndexingAPI } from "./indexing.ts";

export interface QueryAbleKeysAPI
{
    readonly queryable: boolean;
}

export interface UnorderedQueryableKeysAPI<TKeys, TKey, TValue> extends QueryAbleKeysAPI
{
    queryKeysIndexedWith(keys: TKey[]): MapQueryResult<TKeys, TValue>[];
}

export interface OrderedQueryableKeysAPI<TKeys extends TKey[], TKey, TValue> extends UnorderedQueryableKeysAPI<TKeys, TKey, TValue>
{
    queryKeysMatching(keyTemplate: (TKey | undefined)[]): MapQueryResult<TKeys, TValue>[];
}

export interface StructuredQueryableKeysAPI<TKeys extends Record<string, TKey>, TKey, TValue> extends UnorderedQueryableKeysAPI<TKeys, TKey, TValue>
{
    queryKeysMatching(keyTemplate: Partial<TKeys>): MapQueryResult<TKeys, TValue>[];
}

export function NonqueryableKeys(Base: new () => KeyIndexingAPI)
{
    return class NonqueryableKeys<K, V> extends Base implements QueryAbleKeysAPI
    {
        queryable = false;
    };
}

export function QueryableKeys(Base: new () => KeyIndexingAPI)
{
    return class QueryableKeys<K, V> extends (Base as new () => (InstanceType<typeof Base> & KeyIndexingAPI)) implements QueryAbleKeysAPI
    {
        queryable = true;

        interceptSet(key: any, value: any)
        {
            if (!super.interceptSet(key, value)) return false;

            this.addToIndices(key);
            return true;
        }

        interceptDelete(key: any): boolean
        {
            const itemWasDeleted = super.interceptDelete(key);
            if (itemWasDeleted) this.removeFromIndices(key);
            return itemWasDeleted;
        }

        addToIndices(key: string)
        {
            const keylets = key.split(keyletSeparator);
            for (const keylet of keylets)
            {
                const keyletIndexKey = keyIndexPrefix + keylet;
                const existingComposites = super.get(keyletIndexKey);
                super.set(keyIndexPrefix + keylet, existingComposites ? (existingComposites + compositeSeparator + key) : key);
            }
        }

        removeFromIndices(key: string)
        {
            const keylets = key.split(keyletSeparator);
            for (const keylet of keylets)
            {
                const keyletIndexKey = keyIndexPrefix + keylet;
                const remainingComposites = super.get(keyletIndexKey).split(compositeSeparator).filter(c => c !== key).join(compositeSeparator);

                if (!remainingComposites) super.delete(keyletIndexKey);
            }
        }

        queryKeysMatching(keyTemplate: any): MapQueryResult<K, V>[]
        {
            const keylets = [];
            const indicesThatNeedToMatch = [];

            if (!this.resolveKeyQuery(keyTemplate, keylets, indicesThatNeedToMatch)) return [];

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
                        results.push(this.generateResultObject(composite));
                }
            }

            return results;
        }

        queryKeysIndexedWith(keys: any[]): MapQueryResult<K, V>[]
        {
            const keylets: string[] = [];
            for (const key of keys)
            {
                const keylet = this.encodeEntity(key, false);
                if (keylet === undefined) return [];
                keylets.push(keylet);
            }

            return this
                .findCompositesContainingAllOf(keylets as string[])
                .map((compositeKey: string) => this.generateResultObject(compositeKey));
        }

        findCompositesContainingAllOf(keylets: string[])
        {
            const intersector = new StringListIntersector();

            for (const keylet of keylets)
            {
                const comps = super.get(keyIndexPrefix + keylet)?.split(compositeSeparator) || [];
                intersector.addToIntersection(comps);
            }

            return intersector.computeIntersection();
        }
    };
}