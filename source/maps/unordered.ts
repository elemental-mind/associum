import { BaseMultiKeyMap, QueryableMultikeyMap } from './base';

export class UnorderedMultikeyMap<K extends Array<any>, V> extends BaseMultiKeyMap<K, V>
{
    protected getOrCreateComposite(keys: K): string
    {
        return keys
            .map(key => this.getOrCreateKeylet(key))
            .sort()
            .join(BaseMultiKeyMap.keyletSeparator);
    }

    protected resolveComposite(keys: K): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys) 
        {
            const keylet = BaseMultiKeyMap.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.sort().join(BaseMultiKeyMap.keyletSeparator);
    }

    protected deleteComposite(composite: string): void
    {
        this.freeKeylets(composite.split(BaseMultiKeyMap.keyletSeparator));
    }
}

export class QueryableUnorderedMultikeyMap<K extends Array<any>, V> extends QueryableMultikeyMap<K, V>
{
    protected getOrCreateComposite(keys: K): string
    {
        const keylets = keys
            .map(key => this.getOrCreateKeylet(key))
            .sort();

        const composite = keylets.join(BaseMultiKeyMap.keyletSeparator);

        if (!Map.prototype.has.call(this, composite))
        {
            for (const keylet of new Set(keylets))
            {
                const existing = this.keyletsToComposites.get(keylet);
                this.keyletsToComposites.set(
                    keylet,
                    existing ? `${existing}${BaseMultiKeyMap.compositeSeparator}${composite}` : composite,
                );
            }
        }

        return composite;
    }

    protected resolveComposite(keys: K): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys)
        {
            const keylet = BaseMultiKeyMap.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.sort().join(BaseMultiKeyMap.keyletSeparator);
    }

    protected compositeToKeys(composite: string): K
    {
        return composite
            .split(BaseMultiKeyMap.keyletSeparator)
            .map(keylet => BaseMultiKeyMap.keyletsToKeys.get(keylet)) as K;
    }
}