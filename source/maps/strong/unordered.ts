import { ArrayMultikeyMap, MultikeyMap, QueryableArrayMultikeyMap } from './base';

export class UnorderedMultikeyMap<K extends Array<any>, V> extends ArrayMultikeyMap<K, V>
{
    encodeSettingComposite(keys: K): string
    {
        const sortedKeylets = this.mapToOrCreateKeylets(keys).sort();
        return this.keyletsToComposite(sortedKeylets);
    }

    encodeProbingComposite(keys: K): string | undefined
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

export class UnorderedQueryableMultikeyMap<K extends Array<any>, V> extends QueryableArrayMultikeyMap<K, V>
{
    encodeSettingComposite = UnorderedMultikeyMap.prototype.encodeSettingComposite;
    encodeProbingComposite = UnorderedMultikeyMap.prototype.encodeProbingComposite;
}