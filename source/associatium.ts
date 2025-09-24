import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { StringListIntersector } from "./helpers/intersection";

type MultikeyMapQueryResult<K, V> = { key: K; value: V; };

enum KeyType
{
    Unordered,
    Ordered,
    Structured,
}

interface KeyStrategy<K, V> extends Map<string, V> 
{
    readonly keyType: KeyType;
    getOrCreateComposite(keys: K): string;
    resolveComposite(keys: K): string | undefined;
    compositeToKeys(composite: string): K;
    normalizeQuery(input: K): string[];
    deleteComposite(composite: string): void;
}

interface QueryStrategy
{
    readonly queryable: boolean;
}

interface QueryInterface<K, V>
{
    query(keyTemplate: Partial<K>): MultikeyMapQueryResult<K, V>[];
    queryIndexedWith(keys: any[]): MultikeyMapQueryResult<K, V>[];
}

class KeyletRegistry
{
    static idProvider = new IDProvider(AlphaNumeric);
    static keysToKeylets = new Map<any, string>();
    static keyletCountRegistry = new Map<string, number>();
    static keyletsToKeys = new Map<string, any>();

    static keyletSeparator = "_";
    static compositeSeparator = "|";

    static getOrCreateKeylet(key: any)
    {
        const id = KeyletRegistry.keysToKeylets.get(key);
        if (id) return id;

        const newId = KeyletRegistry.idProvider.generateID();
        KeyletRegistry.keysToKeylets.set(key, newId);
        KeyletRegistry.keyletsToKeys.set(newId, key);
        KeyletRegistry.keyletCountRegistry.set(newId, 0);
        return newId;
    }

    static bindKeylet(keylet: string)
    {
        const currentCount = KeyletRegistry.keyletCountRegistry.get(keylet) ?? 0;
        KeyletRegistry.keyletCountRegistry.set(keylet, currentCount + 1);
    }

    static freeKeylets(keylets: string[])
    {
        for (const keylet of keylets)
        {
            const currentCount = KeyletRegistry.keyletCountRegistry.get(keylet) ?? 0;
            if (currentCount <= 1)
            {
                KeyletRegistry.keyletCountRegistry.delete(keylet);
                const keyObj = KeyletRegistry.keyletsToKeys.get(keylet);
                if (keyObj !== undefined)
                    KeyletRegistry.keysToKeylets.delete(keyObj);

                KeyletRegistry.keyletsToKeys.delete(keylet);
            }
            else
                KeyletRegistry.keyletCountRegistry.set(keylet, currentCount - 1);
        }
    }
}

function MultikeyMap<K, V>(keysType: new <K, V>() => KeyStrategy<K, V>, queryType: typeof Queryable | typeof NonQueryable)
{
    return class MultikeyMap extends (queryType(keysType) as new () => (KeyStrategy<K, V> & (typeof queryType extends { new <K, V>(): infer Q; } ? Q : {})))
    {
        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        set(keys: K, value: V)
        {
            const composite = super.getOrCreateComposite(keys);
            super.set(composite, value);

            return this;
        }

        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        get(keys: K): V | undefined
        {
            const composite = super.resolveComposite(keys);
            if (!composite)
                return;
            else
                return super.get(composite);
        }

        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        has(keys: K): boolean
        {
            const composite = super.resolveComposite(keys);
            if (!composite)
                return false;
            else
                return super.has(composite);
        }

        //@ts-ignore for memory efficiency, we wrap methods of base map, and thus change signature type
        delete(keys: K): boolean
        {
            const composite = super.resolveComposite(keys);
            if (!composite)
                return false;

            if (!super.delete(composite))
                return false;

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

class UnorderedKeys<K extends any[], V> extends Map<string, V> implements KeyStrategy<K, V>
{
    keyType = KeyType.Unordered;

    getOrCreateComposite(keys: any[]): string
    {
        return keys
            .map(key => KeyletRegistry.getOrCreateKeylet(key))
            .sort()
            .join(KeyletRegistry.keyletSeparator);
    }

    resolveComposite(keys: any[]): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys) 
        {
            if (!key) continue;
            const keylet = KeyletRegistry.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.sort().join(KeyletRegistry.keyletSeparator);
    }

    compositeToKeys(composite: string): K
    {
        throw new Error("Method not implemented.");
    }

    normalizeQuery(input: K): string[]
    {
        throw new Error("Method not implemented.");
    }

    deleteComposite(composite: string): void
    {
        KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator));
    }
};

class OrderedKeys<K extends any[], V> extends Map<string, V> implements KeyStrategy<K, V>
{
    keyType = KeyType.Ordered;

    getOrCreateComposite(keys: any[]): string
    {
        return keys.map(key => KeyletRegistry.getOrCreateKeylet(key)).join(KeyletRegistry.keyletSeparator);
    }

    resolveComposite(keys: any[]): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys) 
        {
            if (!key) continue;
            const keylet = KeyletRegistry.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.join(KeyletRegistry.keyletSeparator);
    }

    compositeToKeys(composite: string): K
    {
        throw new Error("Method not implemented.");
    }
    normalizeQuery(input: K): string[]
    {
        throw new Error("Method not implemented.");
    }

    deleteComposite(composite: string): void
    {
        KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator));
    }
};

class StructuredKeys<K extends Record<string, V>, V> extends Map<string, V> implements KeyStrategy<K, V>
{
    keyType = KeyType.Structured;

    private fieldCount = 0;
    private fieldMap: Record<string, number> = Object.create(null);

    getOrCreateComposite(keyObject: Record<string, any>): string
    {
        return this
            .transformKeysToArray(keyObject)
            .map(key => KeyletRegistry.getOrCreateKeylet(key))
            .join(KeyletRegistry.keyletSeparator);
    }

    resolveComposite(keyObject: Record<string, any>): string | undefined
    {
        const keys = this.resolveKeysToArray(keyObject);

        if (!keys) return;

        const keylets: string[] = [];

        for (const key of keys) 
        {
            if (!key) continue;
            const keylet = KeyletRegistry.keysToKeylets.get(key);
            if (!keylet) return;
            keylets.push(keylet);
        }

        return keylets.join(KeyletRegistry.keyletSeparator);
    }

    compositeToKeys(composite: string): K
    {
        throw new Error("Method not implemented.");
    }

    normalizeQuery(input: K): string[]
    {
        throw new Error("Method not implemented.");
    }

    deleteComposite(composite: string): void
    {
        KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator));
    }

    protected transformKeysToArray(keyObject: Record<string, any>)
    {
        const keyletArray: any[] = [];

        for (const field in keyObject)
        {
            const arrayPosition = this.fieldMap[field] ?? this.registerNewField(field);
            keyletArray[arrayPosition] = KeyletRegistry.getOrCreateKeylet(keyObject[field]);
        }

        return keyletArray;
    }

    protected resolveKeysToArray(keyObject: Record<string, any>)
    {
        const keyletArray: string[] = [];

        for (const field in keyObject)
        {
            const arrayPosition = this.fieldMap[field];
            if (arrayPosition === undefined)
                return undefined;

            const keylet = KeyletRegistry.keysToKeylets.get(keyObject[field]);
            if (keylet === undefined)
                return undefined;

            keyletArray[arrayPosition] = keylet;
        }

        return keyletArray;
    }

    private registerNewField(name: string): number
    {
        this.fieldMap[name] = this.fieldCount++;
        return this.fieldMap[name];
    }
};

function NonQueryable<K, V>(KeyStrategy: new () => KeyStrategy<K, V>)
{
    return class NonQueryable extends KeyStrategy implements QueryStrategy
    {
        queryable = false;
    };
}

function Queryable<K, V>(KeyStrategy: new () => KeyStrategy<K, V>)
{
    return class Queryable extends KeyStrategy implements QueryStrategy, QueryInterface<K, V>
    {
        queryable = true;

        //This holds associations like ... "abc" => "a_dba_abc|abc_ndf_b|bla_abc_foo" ... with keylets separated by _ and composites separated by |
        protected keyletsToComposites = new Map<string, string>();

        getOrCreateComposite(keys: any): string
        {
            const composite = super.getOrCreateComposite(keys);

            if (super.has(composite))
                return composite;

            for (const keylet of new Set(composite.split(KeyletRegistry.keyletSeparator)))
            {
                const existing = this.keyletsToComposites.get(keylet);
                this.keyletsToComposites.set(keylet, existing ? existing + KeyletRegistry.compositeSeparator + composite : composite);
            }

            return composite;
        }

        deleteComposite(composite: string): void
        {
            for (const keylet of composite.split(KeyletRegistry.keyletSeparator))
            {
                const filteredComposites = this.keyletsToComposites.get(keylet)!.split(KeyletRegistry.compositeSeparator).filter(c => c !== composite).join(KeyletRegistry.compositeSeparator);

                if (filteredComposites)
                    this.keyletsToComposites.set(keylet, filteredComposites);
                else
                    this.keyletsToComposites.delete(keylet);
            }

            super.deleteComposite(composite);
        }

        protected findCompositesContainingAllOf(keylets: string[])
        {
            const intersector = new StringListIntersector();

            for (const keylet of keylets)
                intersector.addToIntersection(this.keyletsToComposites.get(keylet)!.split(KeyletRegistry.compositeSeparator));

            return intersector.computeIntersection();
        }

        protected generateResultObject(compositeKey: string): MultikeyMapQueryResult<K, V>
        {
            const key = this.compositeToKeys(compositeKey) as unknown as K;
            const value = super.get(compositeKey) as V;

            return { key, value };
        }

        query(queryObject: any): MultikeyMapQueryResult<K, V>[]
        {
            const keylets = this.normalizeQuery(queryObject);
            const indicesThatNeedToMatch: number[] = [];

            for (let index = 0; index < keylets.length; index++)
                if (keylets[index] !== undefined)
                    indicesThatNeedToMatch.push(index);

            const alreadyChecked = new Set<string>();
            const results: MultikeyMapQueryResult<K, V>[] = [];

            for (const index of indicesThatNeedToMatch)
            {
                const keylet = keylets[index]!;
                const composites = this.keyletsToComposites.get(keylet);
                if (!composites) continue;

                for (const composite of composites.split(KeyletRegistry.compositeSeparator))
                {
                    if (alreadyChecked.has(composite)) continue; else alreadyChecked.add(composite);

                    const compositeKeylets = composite.split(KeyletRegistry.keyletSeparator);

                    if (indicesThatNeedToMatch.every(idx => compositeKeylets[idx] === keylets[idx]))
                        results.push(this.generateResultObject(composite));
                }
            }

            return results;
        }

        queryIndexedWith(keys: any[]): MultikeyMapQueryResult<K, V>[]
        {
            const keylets = keys.map(key => KeyletRegistry.keysToKeylets.get(key));

            if (keylets.includes(undefined))
                return [];

            return this
                .findCompositesContainingAllOf(keylets as string[])
                .map(compositeKey => this.generateResultObject(compositeKey));
        }
    };
}

export const UnorderedMultiKeyMap = MultikeyMap(UnorderedKeys, NonQueryable);
export const QueryableUnorderedMultikeyMap = MultikeyMap(UnorderedKeys, Queryable);
export const OrderedMultiKeyMap = MultikeyMap(OrderedKeys, NonQueryable);
export const QueryableOrderedMultikeyMap = MultikeyMap(OrderedKeys, Queryable);
export const StructuredMultiKeyMap = MultikeyMap(StructuredKeys, NonQueryable);
export const QueryableStructuredMultiKeyMap = MultikeyMap(StructuredKeys, Queryable);