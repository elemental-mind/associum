import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { keyletUseCountPrefix, stringEscapePrefix } from "../../constants.ts";
import type { AssociationAPI, InterceptionAPI, KeyNormalizationAPI, ValueNormalizationAPI } from "../interfaces.ts";

export class AssociationContainer extends Map<any, any> implements InterceptionAPI, KeyNormalizationAPI<any>, ValueNormalizationAPI<any>, AssociationAPI
{
    idProvider = new IDProvider(AlphaNumeric);
    mappingsCount = 0;

    get size()
    {
        return this.mappingsCount;
    }

    interceptSet(key: any, value: any): boolean
    {
        const previousSize = super.size;
        super.set(key, value);
        if (super.size === previousSize) return false;
        this.mappingsCount++;
        return true;
    }

    interceptGet(key: any)
    {
        return super.get(key);
    }

    interceptHas(key: any)
    {
        return super.has(key);
    }

    interceptDelete(key: any)
    {
        const itemWasDeleted = super.delete(key);
        if (itemWasDeleted) this.mappingsCount--;
        return itemWasDeleted;
    }

    interceptClear(): void
    {
        this.idProvider = new IDProvider(AlphaNumeric);
        this.mappingsCount = 0;
        super.clear();
    }

    interceptKeys()
    {
        return super.keys();
    };

    interceptEntries()
    {
        return super.entries();
    };

    interceptValues()
    {
        return super.values();
    };

    encodeSettingKey(key: any): string[]
    {
        return key;
    }

    encodeRetrievalKey(key: any): string[]
    {
        return key;
    }

    encodeQueryKey(key: unknown[] | Partial<any>, keylets: string[], matchIndices: number[]): boolean
    {
        throw new Error("Key Queries not supported");
    }

    decodeKey(keylets: string[])
    {
        throw new Error("Method not implemented.");
    }

    normalizeValue(value: any): string[]
    {
        return value;
    }

    decodeValue(keylets: string[])
    {
        throw new Error("Method not implemented.");
    }

    toKeylet(value: any, createIfMissing: true): string;
    toKeylet(value: any, createIfMissing?: false): string | undefined;
    toKeylet(value: any, createIfMissing = false): string | undefined
    {
        const normalizedKeyletAccessor = typeof value === "string" ? stringEscapePrefix + value : value;

        const currentKeylet = super.get(normalizedKeyletAccessor);
        if (currentKeylet)
            return currentKeylet;

        if (createIfMissing)
        {
            const newKeylet = this.idProvider.generateID();
            super.set(normalizedKeyletAccessor, newKeylet);
            super.set(newKeylet, value);
            super.set(keyletUseCountPrefix + newKeylet, 0);
            return newKeylet;
        }
    }

    fromKeylet(keylet: any): string | undefined
    {
        return super.get(keylet);
    }

    bindKeylets(keylets: string[])
    {
        for (const keylet of keylets)
        {
            const keyletCountAccessor = keyletUseCountPrefix + keylet;
            super.set(keyletCountAccessor, super.get(keyletCountAccessor)! + 1);
        }
    }

    releaseKeylets(keylets: string[])
    {
        for (const keylet of keylets)
        {
            const keyletCountAccessor = keyletUseCountPrefix + keylet;
            const currentCount = super.get(keyletCountAccessor)!;

            if (currentCount > 1) 
            {
                super.set(keyletCountAccessor, currentCount - 1);
            }
            else
            {
                const key = super.get(keylet)!;
                super.delete(typeof key === "string" ? stringEscapePrefix + key : key);
                super.delete(keylet);
                super.delete(keyletCountAccessor);
            }
        }
    }
};
