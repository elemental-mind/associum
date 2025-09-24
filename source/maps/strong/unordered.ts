import { MultikeyMap, QueryableMultikeyMap } from './base';

export class UnorderedMultikeyMap<K extends Array<any>, V> extends MultikeyMap<K, V>
{
    protected getOrCreateComposite(keys: K): string
    {
        return keys
            .map(key => this.getOrCreateKeylet(key))
            .sort()
            .join(MultikeyMap.keyletSeparator);
    }

    protected resolveComposite(keys: K): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys) 
        {
            const keylet = MultikeyMap.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.sort().join(MultikeyMap.keyletSeparator);
    }

    protected freeComposite(composite: string): void
    {
        this.freeKeylets(composite.split(MultikeyMap.keyletSeparator));
    }
}

export class QueryableUnorderedMultikeyMap<K extends Array<any>, V> extends QueryableMultikeyMap<K, V>
{
    protected getOrCreateComposite(keys: K): string
    {
        const keylets = keys
            .map(key => this.getOrCreateKeylet(key))
            .sort();

        const composite = keylets.join(MultikeyMap.keyletSeparator);

        if (!Map.prototype.has.call(this, composite))
        {
            for (const keylet of new Set(keylets))
            {
                const existing = this.keyletsToComposites.get(keylet);
                this.keyletsToComposites.set(
                    keylet,
                    existing ? `${existing}${MultikeyMap.compositeSeparator}${composite}` : composite,
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
            const keylet = MultikeyMap.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.sort().join(MultikeyMap.keyletSeparator);
    }

    protected compositeToKeys(composite: string): K
    {
        return composite
            .split(MultikeyMap.keyletSeparator)
            .map(keylet => MultikeyMap.keyletsToKeys.get(keylet)) as K;
    }
}