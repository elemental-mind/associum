import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { keyletSeparator, keyletUseCountPrefix, keyValuePrefix, stringEscapePrefix } from "../../constants.ts";
import type { AssociationAPI, InterceptionAPI, KeyNormalizationAPI, ValueNormalizationAPI } from "../interfaces.ts";

export class AssociationContainer extends Map implements InterceptionAPI, KeyNormalizationAPI, ValueNormalizationAPI, AssociationAPI
{
    _idProvider = new IDProvider(AlphaNumeric);
    _mappingsCount = 0;

    get size()
    {
        return this._mappingsCount;
    }

    _interceptSet(keylets: string[], value: any): boolean
    {
        const previousSize = super.size;
        super.set(keyValuePrefix + keylets.join(keyletSeparator), value);
        if (super.size === previousSize) return false;
        this._mappingsCount++;
        return true;
    }

    _interceptGet(keylets: string[])
    {
        return super.get(keyValuePrefix + keylets.join(keyletSeparator));
    }

    _interceptHas(keylets: string[])
    {
        return super.has(keyValuePrefix + keylets.join(keyletSeparator));
    }

    _interceptDelete(keylets: string[])
    {
        const itemWasDeleted = super.delete(keyValuePrefix + keylets.join(keyletSeparator));
        if (itemWasDeleted) this._mappingsCount--;
        return itemWasDeleted;
    }

    _interceptClear(): void
    {
        this._idProvider = new IDProvider(AlphaNumeric);
        this._mappingsCount = 0;
        super.clear();
    }

    _interceptKeys()
    {
        return super.keys();
    };

    _interceptEntries()
    {
        return super.entries();
    };

    _interceptValues()
    {
        return super.values();
    };

    _encodeSettingKey(key: any): string[]
    {
        return key;
    }

    _encodeRetrievalKey(key: any): string[]
    {
        return key;
    }

    _encodeQueryKey(key: unknown[] | Partial<any>, keylets: string[], matchIndices: number[]): boolean
    {
        throw new Error("Key Queries not supported");
    }

    _decodeKey(keylets: string[])
    {
        throw new Error("Method not implemented.");
    }

    _encodeValue(value: any): any
    {
        return value;
    }

    _decodeValue(keyletsOrValue: any)
    {
        return keyletsOrValue;
    }

    _toKeylet(value: any, createIfMissing: true): string;
    _toKeylet(value: any, createIfMissing?: false): string | undefined;
    _toKeylet(value: any, createIfMissing = false): string | undefined
    {
        const normalizedKeyletAccessor = typeof value === "string" ? stringEscapePrefix + value : value;

        const currentKeylet = super.get(normalizedKeyletAccessor);
        if (currentKeylet)
            return currentKeylet as string;

        if (createIfMissing)
        {
            const newKeylet = this._idProvider.generateID();
            super.set(normalizedKeyletAccessor, newKeylet);
            super.set(newKeylet, value);
            super.set(keyletUseCountPrefix + newKeylet, 0);
            return newKeylet;
        }
    }

    _fromKeylet(keylet: any): any | undefined
    {
        return super.get(keylet);
    }

    _bindKeylets(keylets: string[], bindToKey?: string[])
    {
        for (const keylet of keylets)
        {
            const keyletCountAccessor = keyletUseCountPrefix + keylet;
            super.set(keyletCountAccessor, (super.get(keyletCountAccessor)! as number) + 1);
        }
    }

    _releaseKeylets(keylets: string[], releaseFromKey?: string[])
    {
        for (const keylet of keylets)
        {
            const keyletCountAccessor = keyletUseCountPrefix + keylet;
            const currentCount = super.get(keyletCountAccessor)! as number;

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
