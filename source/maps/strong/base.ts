import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { StringListIntersector } from "../../helpers/intersection.ts";
import { MultikeyMapQueryResult } from "../../associatium.ts";

export abstract class MultikeyMap<K, V> extends Map<any, V>
{
    static idProvider = new IDProvider(AlphaNumeric);
    static keysToKeylets = new Map<any, string>();
    static keyletCountRegistry = new Map<string, number>();
    static keyletsToKeys = new Map<string, any>();

    static keyletSeparator = "_";
    static compositeSeparator = "|";

    /**
     * Encodes the given keys into a composite string that can be used as a key in the internal map for setting values.
     * This method is called when setting a value and must always produce a valid composite.
     * Subclasses must implement this to define how multiple keys are combined into a single string.
     * @param keys - The tuple of keys to encode.
     * @returns The composite string representation of the keys.
     */
    protected abstract getOrCreateComposite(keys: K): string;

    /**
     * Encodes the given keys into a composite string for probing (getting, checking, or deleting) from the map.
     * Returns undefined if the keys cannot be encoded, e.g., if they are not yet registered or invalid for lookup.
     * Subclasses must implement this to define how to probe for existing key combinations.
     * @param keys - The tuple of keys to probe.
     * @returns The composite string if encodable, otherwise undefined.
     */
    protected abstract resolveComposite(keys: K): string | undefined;

    /**
     * This method is called when a composite key is no longer needed (e.g., after deletion).
     * Subclasses must implement this to handle any necessary cleanup, such as dereferencing keylets.
     * @param composite The composite key to free from memory
     */
    protected abstract freeComposite(composite: string): void;

    //Instance methods
    set(keys: K, value: V)
    {
        const composite = this.getOrCreateComposite(keys);
        super.set(composite, value);
        return this;
    }

    get(keys: K): V | undefined
    {
        const composite = this.resolveComposite(keys);
        if (!composite)
            return;
        else
            return super.get(composite);
    }

    has(keys: K): boolean
    {
        const composite = this.resolveComposite(keys);
        if (!composite)
            return false;
        else
            return super.has(composite);
    }

    delete(keys: K): boolean
    {
        const composite = this.resolveComposite(keys);
        if (!composite)
            return false;

        if (!super.delete(composite))
            return false;

        this.freeComposite(composite);

        return true;
    }

    clear()
    {
        for (const composite of super.keys())
            this.freeComposite(composite);

        super.clear();
    }

    protected getOrCreateKeylet(key: any)
    {
        const id = MultikeyMap.keysToKeylets.get(key);
        if (id) return id;

        const newId = MultikeyMap.idProvider.generateID();
        MultikeyMap.keysToKeylets.set(key, newId);
        MultikeyMap.keyletsToKeys.set(newId, key);
        this.bindKeylet(newId);
        return newId;
    }

    protected bindKeylet(keylet: string)
    {
        const currentCount = MultikeyMap.keyletCountRegistry.get(keylet) ?? 0;
        MultikeyMap.keyletCountRegistry.set(keylet, currentCount + 1);
    }

    protected freeKeylets(keylets: string[])
    {
        for (const keylet of keylets)
        {
            const currentCount = MultikeyMap.keyletCountRegistry.get(keylet) ?? 0;
            if (currentCount <= 1)
            {
                MultikeyMap.keyletCountRegistry.delete(keylet);
                const keyObj = MultikeyMap.keyletsToKeys.get(keylet);
                if (keyObj !== undefined)
                {
                    MultikeyMap.keysToKeylets.delete(keyObj);
                }
                MultikeyMap.keyletsToKeys.delete(keylet);
            }
            else
                MultikeyMap.keyletCountRegistry.set(keylet, currentCount - 1);
        }
    }
}

export abstract class QueryableMultikeyMap<K, V> extends MultikeyMap<K, V>
{
    //This holds associations like ... "abc" => "a_dba_abc|abc_ndf_b|bla_abc_foo" ... with keylets separated by _ and composites separated by |
    keyletsToComposites = new Map<string, string>();

    protected abstract compositeToKeys(composite: string): K;

    protected freeComposite(composite: string): void
    {
        const keylets = composite.split(MultikeyMap.keyletSeparator);

        for (const keylet of keylets)
        {
            const filteredComposites = this.keyletsToComposites.get(keylet)!.split(MultikeyMap.compositeSeparator).filter(c => c !== composite).join(MultikeyMap.compositeSeparator);

            if (filteredComposites)
                this.keyletsToComposites.set(keylet, filteredComposites);
            else
                this.keyletsToComposites.delete(keylet);
        }

        this.freeKeylets(keylets);
    }

    protected findCompositesContainingAllOf(keylets: string[])
    {
        const intersector = new StringListIntersector();

        for (const keylet of keylets)
            intersector.addToIntersection(this.keyletsToComposites.get(keylet)!.split(MultikeyMap.compositeSeparator));

        return intersector.computeIntersection();
    }

    protected generateResultObject(compositeKey: string): MultikeyMapQueryResult<K, V>
    {
        const key = this.compositeToKeys(compositeKey);
        const value = Map.prototype.get.call(this, compositeKey)!;

        return { key, value };
    }
}
