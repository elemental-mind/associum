import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { StringListIntersector } from "../../helpers/intersection.ts";
import { MultikeyMapQueryResult } from "../../associatium.ts";

export abstract class MultikeyMap<K, V> extends Map<any, V>
{
    static idProvider = new IDProvider(AlphaNumeric);
    static objectsToKeylets = new Map<any, string>();
    static keyletCountRegistry = new Map<string, number>();
    static keyletsToObjects = new Map<string, any>();

    /**
     * Encodes the given keys into a composite string that can be used as a key in the internal map for setting values.
     * This method is called when setting a value and must always produce a valid composite.
     * Subclasses must implement this to define how multiple keys are combined into a single string.
     * @param keys - The tuple of keys to encode.
     * @returns The composite string representation of the keys.
     */
    abstract encodeSettingComposite(keys: K): string;

    /**
     * Encodes the given keys into a composite string for probing (getting, checking, or deleting) from the map.
     * Returns undefined if the keys cannot be encoded, e.g., if they are not yet registered or invalid for lookup.
     * Subclasses must implement this to define how to probe for existing key combinations.
     * @param keys - The tuple of keys to probe.
     * @returns The composite string if encodable, otherwise undefined.
     */
    abstract encodeProbingComposite(keys: K): string | undefined;

    set(keys: K, value: V)
    {
        const composite = this.encodeSettingComposite(keys);
        super.set(composite, value);
        return this;
    }

    get(keys: K): V | undefined
    {
        const composite = this.encodeProbingComposite(keys);
        if (!composite)
            return;
        else
            return super.get(composite);
    }

    has(keys: K): boolean
    {
        const composite = this.encodeProbingComposite(keys);
        if (!composite)
            return false;
        else
            return super.has(composite);
    }

    delete(keys: K): boolean
    {
        const composite = this.encodeProbingComposite(keys);
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

    //Key management functions
    protected ensureAndReturnKeylet(key: any)
    {
        const id = MultikeyMap.objectsToKeylets.get(key);
        if (id) return id;

        const newId = MultikeyMap.idProvider.generateID();
        MultikeyMap.objectsToKeylets.set(key, newId);
        MultikeyMap.keyletsToObjects.set(newId, key);
        this.bindKeylet(newId);
        return newId;
    }

    //Key composition functions

    protected keyletsToComposite(keylets: string[])
    {
        return keylets.join("_");
    }

    protected compositeToKeylets(composite: string)
    {
        return composite.split("_");
    }

    //Memory management functions

    protected bindKeylet(keylet: string)
    {
        const currentCount = MultikeyMap.keyletCountRegistry.get(keylet) ?? 0;
        MultikeyMap.keyletCountRegistry.set(keylet, currentCount + 1);
    }

    protected freeKeylet(keylet: string)
    {
        const currentCount = MultikeyMap.keyletCountRegistry.get(keylet) ?? 0;
        if (currentCount <= 1)
        {
            MultikeyMap.keyletCountRegistry.delete(keylet);
            const keyObj = MultikeyMap.keyletsToObjects.get(keylet);
            if (keyObj !== undefined)
            {
                MultikeyMap.objectsToKeylets.delete(keyObj);
            }
            MultikeyMap.keyletsToObjects.delete(keylet);
        }
        else
            MultikeyMap.keyletCountRegistry.set(keylet, currentCount - 1);
    }

    protected freeComposite(composite: string)
    {
        const keylets = this.compositeToKeylets(composite);
        for (const keylet of keylets)
            this.freeKeylet(keylet);
    }
}

export abstract class ArrayMultikeyMap<K extends Array<any>, V> extends MultikeyMap<K, V>
{
    protected mapToOrCreateKeylets(keys: readonly any[]): string[]
    {
        const result: string[] = [];

        for (const key of keys)
            result.push(this.ensureAndReturnKeylet(key));

        return result;
    }

    protected mapToComposite(keys: readonly any[]): string | undefined
    {
        const keylets: string[] = [];
        for (const key of keys)
        {
            const keylet = MultikeyMap.objectsToKeylets.get(key);
            if (!keylet)
                return undefined;
            else
                keylets.push(keylet);
        }

        return this.keyletsToComposite(keylets);
    }

    protected keyletsToKeys(keylets: string[])
    {
        const result = [] as unknown as K;

        for (const keylet of keylets)
            result.push(MultikeyMap.keyletsToObjects.get(keylet)!);

        return result;
    }
}

export abstract class QueryableArrayMultikeyMap<K extends Array<any>, V> extends ArrayMultikeyMap<K, V>
{
    //This holds associations like ... "abc" => "a_dba_abc|abc_ndf_b|bla_abc_foo" ... with keylets separated by _ and composites separated by |
    keyletToComposites = new Map<string, string>();

    set(keys: K, value: V)
    {
        const compositeKey = this.encodeSettingComposite(keys);

        if (!Map.prototype.has.call(this, compositeKey))
        {
            for (const key of keys)
            {
                const keylet = MultikeyMap.objectsToKeylets.get(key)!;

                const existingKeys = this.keyletToComposites.get(keylet);
                this.keyletToComposites.set(keylet, existingKeys ? `${existingKeys}|${compositeKey}` : compositeKey);
            }
        }

        Map.prototype.set.call(this, compositeKey, value);
        return this;
    }

    /**
     * Returns entries that have any of the given query keys in their key tuple
     * @param keys An array of keys of which at least one should appear in the tuple of any result key
     * @example 
     * ```ts 
     *  map.set(["A", "B"], 123);
     *  map.set(["C", "D"], 456);
     * 
     *  map.query(["B", "A"]) // yields [{key: ["A", "B"], value: 123}] as "A" and "B" appear both in this result
     *  map.query(["D", "B"]) // yields [{key: ["A", "B"], value: 123}, {key: ["C", "D"], value: 456}], as "D" appears in key of second object and "B" appears in key of first object.
     * ```
     */
    query(keys: K): MultikeyMapQueryResult<K, V>[]
    {
        const { compositesWithKeylets } = this.getAllCompositesContaining(keys);

        return compositesWithKeylets.map(compositeKey => this.generateResultObject(compositeKey));
    }

    protected freeComposite(composite: string): void
    {
        super.freeComposite(composite);

        for (const keylet of this.compositeToKeylets(composite))
        {
            const leftOverCompositesWithCurrentKeylet = this.keyletToComposites.get(keylet)!
                .split("|")
                .filter(keyletComposite => keyletComposite !== composite);

            if (leftOverCompositesWithCurrentKeylet.length === 0)
                this.keyletToComposites.delete(keylet);
            else
                this.keyletToComposites.set(keylet, leftOverCompositesWithCurrentKeylet.join("|"));
        }
    }

    protected getAllCompositesContaining(keys: K)
    {
        const keylets: string[] = [];
        const intersector = new StringListIntersector();

        for (const key of keys)
        {
            const keylet = MultikeyMap.objectsToKeylets.get(key);
            if (!keylet) continue;

            keylets.push(keylet);

            intersector.addToIntersection(this.getCompositesForKeylet(keylet));
        }

        const compositesWithKeylets = intersector.computeIntersection();

        return { keylets, compositesWithKeylets };
    }

    protected getCompositesForKeylet(keylet: string)
    {
        const keyletContainingKeys = this.keyletToComposites.get(keylet);
        if (!keyletContainingKeys) return [];

        return keyletContainingKeys.split("|");
    }

    protected generateResultObject(compositeKey: string): MultikeyMapQueryResult<K, V>
    {
        const key = this.keyletsToKeys(compositeKey.split("_"));
        const value = Map.prototype.get.call(this, compositeKey)!;

        return { key, value };
    }
}
