import { KeyletRegistry } from "../keyletRegistry.ts";

export enum IndexType
{
    Unordered,
    Ordered,
    Structured,
}

export interface IndexingStrategy<K, V> extends Map<string, V>
{
    readonly indexType: IndexType;
}

export interface IndexingStrategyMixin<K, V> extends IndexingStrategy<K, V>
{
    getOrCreateComposite(keys: K): string;
    resolveComposite(keys: K): string | undefined;
    compositeToKeys(composite: string): K;
    normalizeQuery(input: Partial<K>): SparseArray<string> | undefined;
    deleteComposite(composite: string): void;
}

type SparseArray<T> = Array<T | undefined>;

export function UnorderedIndex(Base: new () => Map<string, any>)
{
    return class UnorderedIndex<K extends any[], V> extends Base implements IndexingStrategyMixin<K, V>
    {
        indexType = IndexType.Unordered;

        getOrCreateComposite(keys: K): string
        {
            return keys
                .map(key => KeyletRegistry.getOrCreateKeylet(key))
                .sort()
                .join(KeyletRegistry.keyletSeparator);
        }

        resolveComposite(keys: K): string | undefined
        {
            const keylets: string[] = [];

            for (const key of keys)
            {
                if (!key) continue;
                const keylet = KeyletRegistry.keysToKeylets.get(key);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets.sort().join(KeyletRegistry.keyletSeparator);
        }

        compositeToKeys(composite: string): K
        {
            const keylets = composite.split(KeyletRegistry.keyletSeparator);
            return keylets.map(keylet => KeyletRegistry.keyletsToKeys.get(keylet) ?? null).filter(Boolean) as K;
        }

        normalizeQuery(input: Partial<K>): SparseArray<string> | undefined
        {
            return (input as any[]).map(key => key ? KeyletRegistry.keysToKeylets.get(key) : undefined);
        }

        deleteComposite(composite: string): void
        {
            KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator));
        }
    };
}

export function OrderedIndex(Base: new () => Map<string, any>)
{
    return class OrderedIndex<K extends any[], V> extends Base implements IndexingStrategyMixin<K, V>
    {
        indexType = IndexType.Ordered;

        getOrCreateComposite(keys: K): string
        {
            return keys.map(key => KeyletRegistry.getOrCreateKeylet(key)).join(KeyletRegistry.keyletSeparator);
        }

        resolveComposite(keys: K): string | undefined
        {
            const keylets: string[] = [];

            for (const key of keys)
            {
                if (!key) continue;
                const keylet = KeyletRegistry.keysToKeylets.get(key);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets.join(KeyletRegistry.keyletSeparator);
        }

        compositeToKeys(composite: string): K
        {
            const keylets = composite.split(KeyletRegistry.keyletSeparator);
            return keylets.map(keylet => KeyletRegistry.keyletsToKeys.get(keylet) ?? null).filter(Boolean) as K;
        }

        normalizeQuery(input: Partial<K>): SparseArray<string> | undefined
        {
            return (input as any[]).map(key => key ? KeyletRegistry.keysToKeylets.get(key) : undefined);
        }

        deleteComposite(composite: string): void
        {
            KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator));
        }
    };
}

export function StructuredIndex(Base: new () => Map<string, any>)
{
    //@ts-ignore
    return class StructuredIndex<K extends Record<string, any>, V> extends OrderedIndex(Base)<Record<string, any>, any>
    {
        indexType = IndexType.Structured;

        fieldCount = 0;
        fieldMap: Record<string, number> = Object.create(null);

        getOrCreateComposite(keyObject: K): string
        {
            return super.getOrCreateComposite(this.transformKeysToArray(keyObject));
        }

        resolveComposite(keyObject: K): string | undefined
        {
            const array = this.resolveKeysToArray(keyObject);
            return array ? super.resolveComposite(array) : undefined;
        }

        compositeToKeys(composite: string): K
        {
            const keys = super.compositeToKeys(composite) as any[];
            const obj: Record<string, any> = {};

            for (const field in this.fieldMap)
            {
                const fieldIndex = this.fieldMap[field];
                const fieldValue = keys[fieldIndex];
                if (fieldValue !== undefined)
                    obj[field] = fieldValue;
            }

            return obj as K;
        }

        normalizeQuery(input: Partial<K>): SparseArray<string> | undefined
        {
            const keyArray = this.resolveKeysToArray(input);
            return keyArray ? super.normalizeQuery(keyArray) : undefined;
        }

        transformKeysToArray(keyObject: Partial<K>): any[]
        {
            const keys: any[] = [];

            for (const field in keyObject)
                keys[this.fieldMap[field] ?? this.registerNewField(field)] = keyObject[field];

            return keys;
        }

        resolveKeysToArray(keyObject: Partial<K>): any[] | undefined
        {
            const keys: any[] = [];

            for (const field in keyObject)
            {
                const arrayPosition = this.fieldMap[field];
                if (arrayPosition === undefined) return;

                keys[arrayPosition] = keyObject[field];
            }

            return keys;
        }

        registerNewField(name: string): number
        {
            const pos = this.fieldCount++;
            this.fieldMap[name] = pos;
            return pos;
        }
    };
}