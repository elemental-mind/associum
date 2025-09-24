import { KeyStrategy } from "./keyTypes";
import { NonQueryable, Queryable, QueryStrategy } from "./queryTypes";

export function MultikeyMap<K, V>(keysType: new <K, V>() => KeyStrategy<K, V>, queryType: typeof NonQueryable | typeof Queryable)
{
    return class MultikeyMap extends (queryType(keysType) as new () => (KeyStrategy<K, V> & QueryStrategy))
    {
        // @ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        set(keys: K, value: V)
        {
            const composite = super.getOrCreateComposite(keys);
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
            if (!composite) return false;

            if (!super.delete(composite)) return false;

            super.deleteComposite(composite);

            return true;
        }

        clear()
        {
            for (const composite of super.keys())
                super.deleteComposite(composite);
            
            super.clear();
        }
    };
}