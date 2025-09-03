import { MultikeyMap, QueryableMultikeyMap } from './base';

export class UnorderedMultikeyMap<K, V> extends MultikeyMap<K, V>
{
    encodeSettingComposite(keys: readonly K[]): string
    {
        const sortedKeylets = this.mapToOrCreateKeylets(keys).sort();
        return this.keyletsToComposite(sortedKeylets);
    }

    encodeProbingComposite(keys: readonly K[]): string | undefined
    {
        const keylets: string[] = [];
        for (const key of keys) 
        {
            const keylet = MultikeyMap.objectsToKeylets.get(key);

            if (!keylet) return;

            keylets.push(keylet);
        }

        keylets.sort();
        return this.keyletsToComposite(keylets);
    }
}

export class QueryableUnorderedMultikeyMap<K, V> extends QueryableMultikeyMap<K, V>
{
    encodeSettingComposite = UnorderedMultikeyMap.prototype.encodeSettingComposite;
    encodeProbingComposite = UnorderedMultikeyMap.prototype.encodeProbingComposite;
}