import { keyletSeparator } from "../../constants.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";

export enum KeyIndexType
{
    Unordered,
    Ordered,
    Structured,
}

export interface KeyIndexingAPI extends AssociationContainer
{
    readonly keyIndexType: KeyIndexType;
    resolveKeyQuery(keyTemplate: any[], keylets: string[], matchIndices: number[]): boolean;
}

function IndexBase(Base: new () => AssociationContainer)
{
    return class IndexingBaseMixin<K, V> extends Base
    {
        encodeKey(key: any[], throwOnUndefined: boolean = false): string[]
        {
            const keylets = [];
            for (const subKey of key)
                if (subKey === undefined && throwOnUndefined)
                    throw new Error("Cannot use keys containing `undefined`");
                else
                    keylets.push(this.encodeEntity(subKey, true));

            return keylets;
        }

        resolveKey(key: any[]): string[] | undefined
        {
            const keylets = [];
            for (const subKey of key)
            {
                const keylet = this.encodeEntity(subKey, false);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets;
        }

        resolveKeyQuery(keyTemplate: any[], keylets: string[], matchIndices: number[])
        {
            let isValidQuery = true;
            //We use the property of `every` to break at first false return value - and its property to skip sparse elements in an array;
            keyTemplate.every((key, index) =>
            {
                matchIndices.push(index);
                const keylet = this.encodeEntity(key, false);
                if (keylet)
                    keylets[index] = keylet;
                else
                    isValidQuery = false;
                return isValidQuery;
            });
            return isValidQuery;
        }

        interceptSet(key: K, value: any)
        {
            const keylets = this.encodeKey(key as any[]);
            return super.interceptSet(keylets.join(keyletSeparator), value);
        }

        interceptGet(key: K): V | undefined
        {
            const keylets = this.resolveKey(key as any[]);
            if (!keylets) return undefined;
            return super.interceptGet(keylets.join(keyletSeparator));
        }

        interceptHas(key: K): boolean
        {
            const keylets = this.resolveKey(key as any[]);
            if (!keylets) return false;
            return super.interceptHas(keylets.join(keyletSeparator));
        }

        interceptDelete(key: K): boolean
        {
            const keylets = this.resolveKey(key as any[]);
            if (!keylets) return false;
            if (!super.interceptDelete(keylets.join(keyletSeparator))) return false;

            super.releaseEncodings(keylets);
        }
    };
}

export function UnorderedIndex(Base: new () => AssociationContainer)
{
    return class UnorderedIndex<K extends any[], V> extends IndexBase(Base)<K, V> implements KeyIndexingAPI
    {
        keyIndexType = KeyIndexType.Unordered;

        encodeKey(key: any[]): string[] | undefined
        {
            return super.encodeKey(key, true).sort();
        }

        resolveKey(key: any[])
        {
            const keylets = super.resolveKey(key);
            if (!keylets) return undefined;
            return keylets.sort();
        }
    };
}

export function OrderedIndex(Base: new () => AssociationContainer)
{
    return class OrderedIndex<K extends any[], V> extends IndexBase(Base)<K, V> implements KeyIndexingAPI
    {
        keyIndexType = KeyIndexType.Ordered;
    };
}

export function StructuredIndex(Base: new () => AssociationContainer)
{
    //@ts-ignore
    return class StructuredIndex<K extends Record<string, any>, V> extends OrderedIndex(Base)<K, V> implements KeyIndexingAPI
    {
        keyIndexType = KeyIndexType.Structured;

        fieldCount = 0;
        fieldMap: Record<string, number> = Object.create(null);

        //@ts-ignore
        encodeKey(key: K): string[]
        {
            const keyArray = this.keyObjectToKeyArray(key, true);
            return super.encodeKey(keyArray, false);
        }

        //@ts-ignore
        resolveKey(key: K): string[] | undefined
        {
            const keyArray = this.keyObjectToKeyArray(key as K, false);
            if (!keyArray) return undefined;
            return super.resolveKey(keyArray);
        }

        //@ts-ignore
        resolveKeyQuery(keyTemplate: Partial<K>, keylets: string[], matchIndices: number[]): boolean
        {
            const keyArray = this.keyObjectToKeyArray(keyTemplate as K, false);
            if (!keyArray) return false;
            super.resolveKeyQuery(keyArray, keylets, matchIndices);
        }

        keyObjectToKeyArray(keyObject: K, registerNewEntries: boolean): any[] | undefined
        {
            const keyArray: any[] = [];

            for (const field in keyObject)
            {
                let fieldIndex = this.fieldMap[field];
                if (fieldIndex === undefined) 
                {
                    if (registerNewEntries)
                        fieldIndex = this.registerNewField(field);
                    else
                        return undefined;
                }
                keyArray[fieldIndex] = keyObject[field];
            }

            return keyArray;
        }

        keyArrayToKeyObject(keyArray: any[]): K
        {
            const obj: Record<string, any> = {};

            for (const field in this.fieldMap)
            {
                const fieldIndex = this.fieldMap[field];
                const fieldValue = keyArray[fieldIndex];
                if (fieldValue !== undefined)
                    obj[field] = fieldValue;
            }

            return obj as K;
        }

        registerNewField(name: string): number
        {
            const pos = this.fieldCount++;
            this.fieldMap[name] = pos;
            return pos;
        }
    };
}