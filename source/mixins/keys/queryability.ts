import type { MapQueryResult } from "../../multikeyMap.ts";
import { StringListIntersector } from "../../helpers/intersection.ts";
import { type KeyIndexingAPI } from "./indexing.ts";
import { compositeSeparator, keyIndexPrefix, keyletSeparator } from "../../constants.ts";

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

export function NonQueryableKeys(Base: new () => KeyIndexingAPI<any>)
{
    return class NonqueryableKeys<K, V> extends Base implements QueryAbleKeysAPI
    {
        queryable = false;
    };
}

export function QueryableKeys(Base: new () => KeyIndexingAPI<any>)
{
    return class QueryableKeys<K, V> extends Base implements QueryAbleKeysAPI
    {
        queryable = true;

        getOrCreateKeyComposite(keys: any): string
        {
            const composite = super.getOrCreateKeyComposite(keys);

            if (super.has(composite)) return composite;

            for (const keylet of new Set(composite.split(keyletSeparator)))
            {
                const indexKey = keyIndexPrefix + keylet;
                const existing = super.get(indexKey) as string | undefined;
                super.set(indexKey, existing ? existing + compositeSeparator + composite : composite);
            }

            return composite;
        }

        deleteKeyComposite(composite: string): void
        {
            for (const keylet of composite.split(keyletSeparator))
            {
                const indexKey = keyIndexPrefix + keylet;
                const compositesStr = super.get(indexKey);
                if (compositesStr)
                {
                    const filteredComposites = compositesStr.split(compositeSeparator).filter(c => c !== composite).join(compositeSeparator);

                    if (filteredComposites)
                        super.set(indexKey, filteredComposites);
                    else
                        super.delete(indexKey);
                }
            }

            super.deleteKeyComposite(composite);
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

        generateResultObject(compositeKey: string): MapQueryResult<K, V>
        {
            const key = this.keyCompositeToKeys(compositeKey) as K;
            const value = super.get(compositeKey) as V;

            return { key, value };
        }

        queryKeysMatching(keyTemplate: any): MapQueryResult<K, V>[]
        {
            const keylets = this.normalizeStructuralKeyQuery(keyTemplate);

            if (!keylets) return [];

            const indicesThatNeedToMatch: number[] = [];

            for (let index = 0; index < keylets.length; index++)
            {
                if (keylets[index] !== undefined)
                {
                    indicesThatNeedToMatch.push(index);
                }
            }

            const alreadyChecked = new Set<string>();
            const results: MapQueryResult<K, V>[] = [];

            for (const index of indicesThatNeedToMatch)
            {
                const keylet = keylets[index]!;
                const compositesStr = super.get(keyIndexPrefix + keylet);
                if (!compositesStr) continue;

                for (const composite of compositesStr.split(compositeSeparator))
                {
                    if (alreadyChecked.has(composite)) continue;
                    alreadyChecked.add(composite);

                    const compositeKeylets = composite.split(keyletSeparator);

                    if (indicesThatNeedToMatch.every(idx => compositeKeylets[idx] === keylets[idx]))
                    {
                        results.push(this.generateResultObject(composite));
                    }
                }
            }

            return results;
        }

        queryKeysIndexedWith(keys: any[]): MapQueryResult<K, V>[]
        {
            const keylets: string[] = [];
            for (const key of keys)
            {
                const k = this.resolveKeylet(key);
                if (k === undefined) return [];
                keylets.push(k);
            }

            return this
                .findCompositesContainingAllOf(keylets as string[])
                .map((compositeKey: string) => this.generateResultObject(compositeKey));
        }
    };
}