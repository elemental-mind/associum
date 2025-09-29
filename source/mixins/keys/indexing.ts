import { keyletSeparator } from "../../constants.ts";
import type { KeyletContainerAPI } from "../keyletContaining.ts";

export enum KeyIndexType
{
    Unordered,
    Ordered,
    Structured,
}

export interface KeyIndexingBaseAPI extends KeyletContainerAPI
{
    readonly keyIndexType: KeyIndexType;
}

export interface KeyIndexingAPI<K> extends KeyIndexingBaseAPI
{
    getOrCreateKeyComposite(keys: K): string;
    resolveKeyComposite(keys: K): string | undefined;
    keyCompositeToKeys(composite: string): K;
    normalizeStructuralKeyQuery(input: any): SparseArray<string> | undefined;
    deleteKeyComposite(composite: string): void;
}

type SparseArray<T> = Array<T | undefined>;

export function UnorderedIndex(Base: new () => KeyletContainerAPI)
{
    return class UnorderedIndex<K extends any[], V> extends Base implements KeyIndexingAPI<K>
    {
        keyIndexType = KeyIndexType.Unordered;

        getOrCreateKeyComposite(keys: K): string
        {
            const uniqueKeys = new Set<any>(keys);

            if (uniqueKeys.has(undefined)) throw new Error("Cannot create composite for keys with undefined values in unordered maps");

            return [...uniqueKeys]
                .map(key => this.getOrCreateKeylet(key))
                .sort()
                .join(keyletSeparator);
        }

        resolveKeyComposite(keys: K): string | undefined
        {
            const uniqueKeys = new Set<any>(keys);

            if (uniqueKeys.has(undefined)) throw new Error("Cannot resolve keys with undefined values in unordered maps");

            const keylets: string[] = [];

            for (const key of uniqueKeys)
            {
                const keylet = this.resolveKeylet(key);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets.sort().join(keyletSeparator);
        }

        keyCompositeToKeys(composite: string): K
        {
            const keylets = composite.split(keyletSeparator);
            return keylets.map(keylet => super.get(keylet)!) as K;
        }

        normalizeStructuralKeyQuery(input: any): SparseArray<string> | undefined
        {
            throw new Error("Structural querying is not supported on unordered maps");
        }

        deleteKeyComposite(composite: string): void
        {
            this.freeKeylets(composite.split(keyletSeparator));
        }
    };
}

export function OrderedIndex(Base: new () => KeyletContainerAPI)
{
    return class OrderedIndex<K extends any[], V> extends Base implements KeyIndexingAPI<K>
    {
        keyIndexType = KeyIndexType.Ordered;

        getOrCreateKeyComposite(keys: K): string
        {
            const keylets: string[] = [];
            for (const key of keys)
            {
                if (key === undefined) throw new Error("Cannot use keys containing `undefined` in ordered maps");
                keylets.push(this.getOrCreateKeylet(key));
            }
            return keylets.join(keyletSeparator);
        }

        resolveKeyComposite(keys: K): string | undefined
        {
            const keylets: string[] = [];
            for (const key of keys)
            {
                if (key === undefined) return undefined;
                const keylet = this.resolveKeylet(key);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets.join(keyletSeparator);
        }

        keyCompositeToKeys(composite: string): K
        {
            const keylets = composite.split(keyletSeparator);
            return keylets.map(keylet => super.get(keylet)!) as K;
        }

        normalizeStructuralKeyQuery(input: any): SparseArray<string> | undefined
        {
            return (input as any[]).map(key => this.resolveKeylet(key));
        }

        deleteKeyComposite(composite: string): void
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
        keyIndexType = KeyIndexType.Structured;

        fieldCount = 0;
        fieldMap: Record<string, number> = Object.create(null);

        getOrCreateKeyComposite(keyObject: K): string
        {
            return super.getOrCreateKeyComposite(this.transformKeysToArray(keyObject));
        }

        resolveKeyComposite(keyObject: K): string | undefined
        {
            const array = this.resolveKeysToArray(keyObject);
            return array ? super.resolveKeyComposite(array) : undefined;
        }

        keyCompositeToKeys(composite: string): K
        {
            const keys = super.keyCompositeToKeys(composite) as any[];
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

        normalizeStructuralKeyQuery(input: any): SparseArray<string> | undefined
        {
            const keyArray = this.resolveKeysToArray(input as Partial<K>);
            return keyArray ? super.normalizeStructuralKeyQuery(keyArray) : undefined;
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