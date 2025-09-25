import { KeyletRegistry } from "./keyletRegistry.ts";
import type { UnorderedIndex, OrderedIndex, StructuredIndex } from "./mixins/indexing.ts";
import type { NonQueryable, Queryable } from "./mixins/queryability.ts";

export function MultikeyMap(indexingStrategy: typeof UnorderedIndex | typeof OrderedIndex | typeof StructuredIndex, queryStrategy: typeof Queryable | typeof NonQueryable)
{
    return class MultikeyMap<K, V> extends queryStrategy(indexingStrategy(Map))<K, V>
    {
        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        set(keys: K, value: V)
        {
            const composite = super.getOrCreateComposite(keys);
            if (!super.has(composite)) KeyletRegistry.bindKeylets(composite.split(KeyletRegistry.keyletSeparator));
            super.set(composite, value);
            return this;
        }

        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        get(keys: K): V | undefined
        {
            const composite = super.resolveComposite(keys);
            if (!composite) return undefined;
            return super.get(composite);
        }

        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        has(keys: K): boolean
        {
            const composite = super.resolveComposite(keys);
            if (!composite) return false;
            return super.has(composite);
        }

        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        delete(keys: K): boolean
        {
            const composite = super.resolveComposite(keys);
            if (!composite || !super.delete(composite))
                return false;
            else
                super.deleteComposite(composite);

            return true;
        }

        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        *keys(): MapIterator<K>
        {
            for (const composite of super.keys())
                yield super.compositeToKeys(composite) as K;
        }

        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        *entries(): MapIterator<K, V>
        {
            for (const composite of super.keys())
                yield [super.compositeToKeys(composite), super.get(composite)];
        }

        clear()
        {
            for (const composite of super.keys())
                super.deleteComposite(composite);

            super.clear();
        }
    };
}