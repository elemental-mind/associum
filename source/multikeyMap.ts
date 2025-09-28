import { type UnorderedIndex, type OrderedIndex, type StructuredIndex, keyletSeparator } from "./mixins/keys/indexing.ts";
import { compositePrefix, KeyletContaining } from "./mixins/keyletContaining.ts";
import type { NonQueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";

export function MultikeyMap(IndexingStrategy: typeof UnorderedIndex | typeof OrderedIndex | typeof StructuredIndex, QueryStrategy: typeof QueryableKeys | typeof NonQueryableKeys)
{
    return class MultikeyMap<K, V> extends QueryStrategy(IndexingStrategy(KeyletContaining(Map)))<K, V>
    {
        mappingsCount = 0;

        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        set(keys: K, value: V)
        {
            const composite = super.getOrCreateKeyComposite(keys);
            const registryEntry = compositePrefix + composite;
            if (!super.has(registryEntry)) this.bindKeylets(composite.split(keyletSeparator));
            super.set(registryEntry, value);
            return this;
        }

        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        get(keys: K): V | undefined
        {
            const composite = super.resolveKeyComposite(keys);
            if (!composite) return undefined;
            return super.get(compositePrefix + composite);
        }

        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        has(keys: K): boolean
        {
            const composite = super.resolveKeyComposite(keys);
            if (!composite) return false;
            return super.has(compositePrefix + composite);
        }

        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        delete(keys: K): boolean
        {
            const composite = super.resolveKeyComposite(keys);
            if (!composite || !super.delete(compositePrefix + composite))
                return false;
            else
                super.deleteKeyComposite(composite);

            return true;
        }

        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        *keys(): MapIterator<K>
        {
            for (const key of super.keys())
                if (typeof key === "string" && key.startsWith(compositePrefix))
                    yield super.keyCompositeToKeys(key.substring(1)) as K;
        }

        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        *entries(): MapIterator<K, V>
        {
            for (const key of super.keys())
                if (typeof key === "string" && key.startsWith(compositePrefix))
                    yield [super.keyCompositeToKeys(key.substring(1)), super.get(key)];
        }

        *values(): MapIterator<V>
        {
            for (const key of super.keys())
                if (typeof key === "string" && key.startsWith(compositePrefix))
                    yield super.get(key) as V;
        }

        clear()
        {
            super.clear();
            this.mappingsCount = 0;
        }
    };
}