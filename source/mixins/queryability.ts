import { KeyletRegistry } from "../keyletRegistry.ts";
import { StringListIntersector } from "../helpers/intersection.ts";
import { IndexingStrategyMixin } from "./indexing.ts";

export type MultikeyMapQueryResult<K, V> = { key: K; value: V; };

export interface QueryStrategy
{
    readonly queryable: boolean;
}

export interface UnorderedQueryableStrategy<TKeys, TKey, TValue> extends QueryStrategy
{
    queryIndexedWith(keys: TKey[]): MultikeyMapQueryResult<TKeys, TValue>[];
}

export interface OrderedQueryableStrategy<TKeys extends TKey[], TKey, TValue> extends UnorderedQueryableStrategy<TKeys, TKey, TValue>
{
    query(keyTemplate: (TKey | undefined)[]): MultikeyMapQueryResult<TKeys, TValue>[];
}

export interface StructuredQueryableStrategy<TKeys extends Record<string, TKey>, TKey, TValue> extends UnorderedQueryableStrategy<TKeys, TKey, TValue>
{
    query(keyTemplate: Partial<TKeys>): MultikeyMapQueryResult<TKeys, TValue>[];
}

export function NonQueryable(Base: new () => IndexingStrategyMixin<any, any>)
{
    return class Nonqueryable<K, V> extends Base implements QueryStrategy
    {
        queryable = false;
    };
}

export function Queryable(Base: new () => IndexingStrategyMixin<any, any>)
{
    return class Queryable<K, V> extends Base implements QueryStrategy
    {
        queryable = true;

        private keyletsToComposites: Map<string, string> = new Map<string, string>();

        getOrCreateComposite(keys: any): string
        {
            const composite = super.getOrCreateComposite(keys);

            if (super.has(composite)) return composite;

            for (const keylet of new Set(composite.split(KeyletRegistry.keyletSeparator)))
            {
                const existing = this.keyletsToComposites.get(keylet) as string | undefined;
                this.keyletsToComposites.set(keylet, existing ? existing + KeyletRegistry.compositeSeparator + composite : composite);
            }

            return composite;
        }

        deleteComposite(composite: string): void
        {
            for (const keylet of composite.split(KeyletRegistry.keyletSeparator))
            {
                const compositesStr = this.keyletsToComposites.get(keylet);
                if (compositesStr)
                {
                    const filteredComposites = compositesStr.split(KeyletRegistry.compositeSeparator).filter(c => c !== composite).join(KeyletRegistry.compositeSeparator);

                    if (filteredComposites)
                    {
                        this.keyletsToComposites.set(keylet, filteredComposites);
                    } else
                    {
                        this.keyletsToComposites.delete(keylet);
                    }
                }
            }

            super.deleteComposite(composite);
        }

        findCompositesContainingAllOf(keylets: string[])
        {
            const intersector = new StringListIntersector();

            for (const keylet of keylets)
            {
                const comps = this.keyletsToComposites.get(keylet)?.split(KeyletRegistry.compositeSeparator) || [];
                intersector.addToIntersection(comps);
            }

            return intersector.computeIntersection();
        }

        generateResultObject(compositeKey: string): MultikeyMapQueryResult<K, V>
        {
            const key = (this as any).compositeToKeys(compositeKey) as K;
            const value = super.get(compositeKey) as V;

            return { key, value };
        }

        query(keyTemplate: any): MultikeyMapQueryResult<K, V>[]
        {
            const keylets = this.normalizeQuery(keyTemplate);

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
            const results: MultikeyMapQueryResult<K, V>[] = [];

            for (const index of indicesThatNeedToMatch)
            {
                const keylet = keylets[index]!;
                const compositesStr = this.keyletsToComposites.get(keylet);
                if (!compositesStr) continue;

                for (const composite of compositesStr.split(KeyletRegistry.compositeSeparator))
                {
                    if (alreadyChecked.has(composite)) continue;
                    alreadyChecked.add(composite);

                    const compositeKeylets = composite.split(KeyletRegistry.keyletSeparator);

                    if (indicesThatNeedToMatch.every(idx => compositeKeylets[idx] === keylets[idx]))
                    {
                        results.push(this.generateResultObject(composite));
                    }
                }
            }

            return results;
        }

        queryIndexedWith(keys: any[]): MultikeyMapQueryResult<K, V>[]
        {
            const keylets = keys.map(key => KeyletRegistry.keysToKeylets.get(key));

            if (keylets.some(k => k === undefined))
            {
                return [];
            }

            return this
                .findCompositesContainingAllOf(keylets as string[])
                .map((compositeKey: string) => this.generateResultObject(compositeKey));
        }
    };
}