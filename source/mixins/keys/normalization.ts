import type { AssociationContainer } from "../base/associationContainer.ts";
import { KeyIndexType } from "../interfaces.ts";

export function OrderedIndex(Base: new () => AssociationContainer)
{
    return class OrderedIndex<K extends any[], V> extends Base
    {
        keyIndexType = KeyIndexType.Ordered;

        encodeSettingKey(key: any[], throwOnUndefined: boolean = false): string[]
        {
            const keylets = [];
            for (const subKey of key)
                if (subKey === undefined && throwOnUndefined)
                    throw new Error("Cannot use keys containing `undefined`");
                else
                    keylets.push(this.toKeylet(subKey, true));

            return keylets;
        }

        encodeRetrievalKey(key: any[]): string[] | undefined
        {
            const keylets = [];
            for (const subKey of key)
            {
                const keylet = this.toKeylet(subKey, false);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets;
        }

        encodeQueryKey(keyTemplate: any[], keylets: string[], matchIndices: number[])
        {
            let isValidQuery = true;
            //We use the property of `every` to break at first false return value - and its property to skip sparse elements in an array;
            keyTemplate.every((key, index) =>
            {
                matchIndices.push(index);
                const keylet = this.toKeylet(key, false);
                if (keylet)
                    keylets[index] = keylet;
                else
                    isValidQuery = false;
                return isValidQuery;
            });
            return isValidQuery;
        }

        decodeKey(keylets: string[])
        {
            const key = [];
            for (const keylet of keylets)
                key.push(super.get(keylet)!);
            return key;
        }
    };
}

export function UnorderedIndex(Base: new () => AssociationContainer)
{
    return class UnorderedIndex<K extends any[], V> extends OrderedIndex(Base)<K, V>
    {
        keyIndexType = KeyIndexType.Unordered;

        encodeSettingKey(key: any[]): string[] | undefined
        {
            return super.encodeSettingKey(key, true).sort();
        }

        encodeRetrievalKey(key: any[])
        {
            const keylets = super.encodeRetrievalKey(key);
            if (!keylets) return undefined;
            return keylets.sort();
        }
    };
}

export function StructuredIndex(Base: new () => AssociationContainer)
{
    //@ts-ignore
    return class StructuredIndex<K extends Record<string, any>, V> extends OrderedIndex(Base)<K, V>
    {
        keyIndexType = KeyIndexType.Structured;

        fieldCount = 0;
        fieldMap: Record<string, number> = Object.create(null);

        //@ts-ignore
        encodeSettingKey(key: K): string[]
        {
            const keyArray = this.keyObjectToKeyArray(key, true);
            return super.encodeSettingKey(keyArray, false);
        }

        //@ts-ignore
        encodeRetrievalKey(key: K): string[] | undefined
        {
            const keyArray = this.keyObjectToKeyArray(key, false);
            if (!keyArray) return undefined;
            return super.encodeRetrievalKey(keyArray);
        }

        //@ts-ignore
        encodeQueryKey(keyTemplate: Partial<K>, keylets: string[], matchIndices: number[]): boolean
        {
            const keyArray = this.keyObjectToKeyArray(keyTemplate as K, false);
            if (!keyArray) return false;
            super.encodeQueryKey(keyArray, keylets, matchIndices);
        }

        //@ts-ignore
        decodeKey(keylets: string[])
        {
            const keys = super.decodeKey(keylets);
            return this.keyArrayToKeyObject(keys);
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