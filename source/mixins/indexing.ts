import type { KeyletContainerAPI } from "./keyletContaining.ts";

export const keyletSeparator = "_";
export const compositeSeparator = "|";

export enum IndexType
{
    Unordered,
    Ordered,
    Structured,
}

export interface IndexingBaseAPI extends KeyletContainerAPI
{
    readonly indexType: IndexType;
}

export interface IndexingAPI<K> extends IndexingBaseAPI
{
    getOrCreateComposite(keys: K): string;
    resolveComposite(keys: K): string | undefined;
    compositeToKeys(composite: string): K;
    normalizeStructuralQuery(input: any): SparseArray<string> | undefined;
    deleteComposite(composite: string): void;
}

type SparseArray<T> = Array<T | undefined>;

export function UnorderedIndex(Base: new () => KeyletContainerAPI)
{
    return class UnorderedIndex<K extends any[], V> extends Base implements IndexingAPI<K>
    {
        indexType = IndexType.Unordered;

        getOrCreateComposite(keys: K): string
        {
            return keys
                .map(key => this.getOrCreateKeylet(key))
                .sort()
                .join(keyletSeparator);
        }

        resolveComposite(keys: K): string | undefined
        {
            const keylets: string[] = [];

            for (const key of keys)
            {
                if (!key) continue;
                const keylet = this.resolveKeylet(key);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets.sort().join(keyletSeparator);
        }

        compositeToKeys(composite: string): K
        {
            const keylets = composite.split(keyletSeparator);
            return keylets.map(keylet => super.get(keylet)!) as K;
        }

        normalizeStructuralQuery(input: any): SparseArray<string> | undefined
        {
            throw new Error("Structural querying is not supported on unordered indexes");
        }

        deleteComposite(composite: string): void
        {
            this.freeKeylets(composite.split(keyletSeparator));
        }
    };
}

export function OrderedIndex(Base: new () => KeyletContainerAPI)
{
    return class OrderedIndex<K extends any[], V> extends Base implements IndexingAPI<K>
    {
        indexType = IndexType.Ordered;

        getOrCreateComposite(keys: K): string
        {
            return keys
                .map(key => this.getOrCreateKeylet(key))
                .join(keyletSeparator);
        }

        resolveComposite(keys: K): string | undefined
        {
            const keylets: string[] = [];

            for (const key of keys)
            {
                if (!key) continue;
                const keylet = this.resolveKeylet(key);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets.join(keyletSeparator);
        }

        compositeToKeys(composite: string): K
        {
            const keylets = composite.split(keyletSeparator);
            return keylets.map(keylet => super.get(keylet)!) as K;
        }

        normalizeStructuralQuery(input: any): SparseArray<string> | undefined
        {
            return (input as any[]).map(key => this.resolveKeylet(key));
        }

        deleteComposite(composite: string): void
        {
            this.freeKeylets(composite.split(keyletSeparator));
        }
    };
}

export function StructuredIndex(Base: new () => KeyletContainerAPI)
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

        normalizeStructuralQuery(input: any): SparseArray<string> | undefined
        {
            const keyArray = this.resolveKeysToArray(input as Partial<K>);
            return keyArray ? super.normalizeStructuralQuery(keyArray) : undefined;
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