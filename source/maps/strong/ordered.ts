import type { MultikeyMapQueryResult } from '../../associatium';
import { MultikeyMap, QueryableMultikeyMap } from './base';

export class OrderedMultiKeyMap<K extends Array<any>, V> extends MultikeyMap<K, V>
{
    protected getOrCreateComposite(keys: readonly K[]): string
    {
        return keys
            .map(key => this.getOrCreateKeylet(key))
            .join(MultikeyMap.keyletSeparator);
    }

    protected resolveComposite(keys: readonly K[]): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys) 
        {
            const keylet = MultikeyMap.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.join(MultikeyMap.keyletSeparator);
    }

    protected freeComposite(composite: string)
    {
        this.freeKeylets(composite.split(MultikeyMap.keyletSeparator));
    }
}

export class QueryableOrderedMultikeyMap<K extends Array<any>, V> extends QueryableMultikeyMap<K, V>
{
    getOrCreateComposite(keys: readonly K[]): string
    {
        const compositeRaw = keys.map(key => this.getOrCreateKeylet(key));
        const composite = compositeRaw.join(MultikeyMap.keyletSeparator);

        if (!Map.prototype.has.call(this, composite))
        {
            for (const keylet of new Set(compositeRaw))
            {
                const existing = this.keyletsToComposites.get(keylet);
                this.keyletsToComposites.set(keylet, existing ? existing + MultikeyMap.compositeSeparator + composite : composite);
            }
        }

        return composite;
    }

    //@ts-ignore
    resolveComposite = OrderedMultiKeyMap.prototype.resolveComposite;

    queryEntriesWithSubkeys(keys: K): MultikeyMapQueryResult<K, V>[]
    {
        const keylets: string[] = [];

        for (const key of keys) 
        {
            const keylet = MultikeyMap.keysToKeylets.get(key);
            if (!keylet) return [];
            keylets.push(keylet);
        }

        return this
            .findCompositesContainingAllOf(keylets)
            .map(compositeKey => this.generateResultObject(compositeKey));
    }

    queryEntriesMatching(sparseKeys: K): MultikeyMapQueryResult<K, V>[]
    {
        const indicesThatNeedToMatch: number[] = [];
        const keylets = [] as string[];

        for (let index = 0; index < sparseKeys.length; index++)
        {
            if (sparseKeys[index] === undefined) continue;
            const keylet = MultikeyMap.keysToKeylets.get(sparseKeys[index]);
            if (!keylet) return [];

            keylets[index] = keylet;
            indicesThatNeedToMatch.push(index);
        }

        const alreadyCheckedComposites = new Set<string>();
        const result: MultikeyMapQueryResult<K, V>[] = [];

        keyletLoop:
        for (const keyIndex of indicesThatNeedToMatch)
        {
            const keylet = keylets[keyIndex];

            const compositesContainingKeylet = this.keyletsToComposites.get(keylet);
            if (!compositesContainingKeylet) return [];

            compositeLoop:
            for (const composite of compositesContainingKeylet.split(MultikeyMap.compositeSeparator))
            {
                if (alreadyCheckedComposites.has(composite)) continue; else alreadyCheckedComposites.add(composite);

                const compositeKeylets = composite.split(MultikeyMap.keyletSeparator);

                compositeCheckLoop:
                for (const index of indicesThatNeedToMatch)
                    if (compositeKeylets[index] !== keylets[index]) continue compositeLoop;

                result.push(this.generateResultObject(composite));
            }
        }

        return result;
    }

    protected compositeToKeys(composite: string): K
    {
        return composite.split(MultikeyMap.keyletSeparator).map(keylet => MultikeyMap.keyletsToKeys.get(keylet)) as K;
    }
}