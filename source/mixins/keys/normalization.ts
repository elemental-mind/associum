import type { AssociationContainer } from "../base/associationContainer.ts";
import { KeyIndexType } from "../interfaces.ts";

export function OrderedIndex(Base: new(...args: any[]) => AssociationContainer)
{
    return class OrderedIndex extends Base
    {
        keyIndexType = KeyIndexType.Ordered;

        _interceptSet(keylets: string[], value: any): boolean
        {
            const itemWasAdded = super._interceptSet(keylets, value);
            if (itemWasAdded)
                this._bindKeylets(keylets);
            return itemWasAdded;
        }

        _interceptDelete(keylets: string[]): boolean
        {
            const itemWasDeleted = super._interceptDelete(keylets);
            if (itemWasDeleted)
                this._releaseKeylets(keylets);
            return itemWasDeleted;
        }

        _encodeSettingKey(key: any[], throwOnUndefined: boolean = false): string[]
        {
            const keylets = [];
            for (const subKey of key)
                if (subKey === undefined && throwOnUndefined)
                    throw new Error("Cannot use keys containing `undefined`");
                else
                    keylets.push(this._toKeylet(subKey, true));

            return keylets;
        }

        _encodeRetrievalKey(key: any[]): string[] | undefined
        {
            const keylets = [];
            for (const subKey of key)
            {
                const keylet = this._toKeylet(subKey, false);
                if (!keylet) return undefined;
                keylets.push(keylet);
            }

            return keylets;
        }

        _encodeQueryKey(keyTemplate: any[], keylets: string[], matchIndices: number[])
        {
            let isValidQuery = true;
            //We use the property of `every` to break at first false return value - and its property to skip sparse elements in an array;
            keyTemplate.every((key, index) =>
            {
                matchIndices.push(index);
                const keylet = this._toKeylet(key, false);
                if (keylet)
                    keylets[index] = keylet;
                else
                    isValidQuery = false;
                return isValidQuery;
            });
            return isValidQuery;
        }

        _decodeKey(keylets: string[])
        {
            const key = [];
            for (const keylet of keylets)
                key.push(super.get(keylet)!);
            return key;
        }
    };
}

export function UnorderedIndex(Base: new(...args: any[]) => AssociationContainer)
{
    return class UnorderedIndex extends OrderedIndex(Base)
    {
        keyIndexType = KeyIndexType.Unordered;

        _encodeSettingKey(key: any[]): string[] | undefined
        {
            return super._encodeSettingKey(key, true).sort();
        }

        _encodeRetrievalKey(key: any[])
        {
            const keylets = super._encodeRetrievalKey(key);
            if (!keylets) return undefined;
            return keylets.sort();
        }
    };
}

export function StructuredIndex(Base: new(...args: any[]) => AssociationContainer)
{
    return class StructuredIndex extends OrderedIndex(Base)
    {
        keyIndexType = KeyIndexType.Structured;

        fieldCount = 0;
        fieldMap: Record<string, number> = Object.create(null);

        //@ts-ignore
        _encodeSettingKey(key: K): string[]
        {
            const keyArray = this._keyObjectToKeyArray(key, true);
            return super._encodeSettingKey(keyArray, false);
        }

        //@ts-ignore
        _encodeRetrievalKey(key: K): string[] | undefined
        {
            const keyArray = this._keyObjectToKeyArray(key, false);
            if (!keyArray) return undefined;
            return super._encodeRetrievalKey(keyArray);
        }

        //@ts-ignore
        _encodeQueryKey(keyTemplate: Partial<K>, keylets: string[], matchIndices: number[]): boolean
        {
            const keyArray = this._keyObjectToKeyArray(keyTemplate, false);
            if (!keyArray) return false;
            super._encodeQueryKey(keyArray, keylets, matchIndices);
        }

        //@ts-ignore
        _decodeKey(keylets: string[])
        {
            const keys = super._decodeKey(keylets);
            return this._keyArrayToKeyObject(keys);
        }

        _keyObjectToKeyArray(keyObject: any, registerNewEntries: boolean): any[] | undefined
        {
            const keyArray: any[] = [];

            for (const field in keyObject)
            {
                let fieldIndex = this.fieldMap[field];
                if (fieldIndex === undefined) 
                {
                    if (registerNewEntries)
                        fieldIndex = this._registerNewField(field);
                    else
                        return undefined;
                }
                keyArray[fieldIndex] = keyObject[field];
            }

            return keyArray;
        }

        _keyArrayToKeyObject(keyArray: any[])
        {
            const obj: Record<string, any> = {};

            for (const field in this.fieldMap)
            {
                const fieldIndex = this.fieldMap[field];
                const fieldValue = keyArray[fieldIndex];
                if (fieldValue !== undefined)
                    obj[field] = fieldValue;
            }

            return obj;
        }

        _registerNewField(name: string): number
        {
            const pos = this.fieldCount++;
            this.fieldMap[name] = pos;
            return pos;
        }
    };
}