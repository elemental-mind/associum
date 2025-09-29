import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { keyletUseCountPrefix, stringEscapePrefix } from "../../constants.ts";

export class AssociationContainer extends Map<any, any> 
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

    //These method stubs are necessary to silence TypeScript errors about non-super methods.
    //It would be better to assign map methods in a static block in combination with declares, but that causes type issues - for now we will leave it as is.
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

    //Keylet encoding/decoding

    //Maps original value to a keylet
    encodeEntity(value: any, createIfMissing: true): string;
    encodeEntity(value: any, createIfMissing?: false): string | undefined;
    encodeEntity(value: any, createIfMissing = false): string | undefined
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

    //Maps keylet back to original value
    decodeEntity(keylet: any): string | undefined
    {
        return super.get(keylet);
    }

    //Memory management for keylets

    bindEncodings(keylets: string[])
    {
        for (const keylet of keylets)
        {
            const keyletCountAccessor = keyletUseCountPrefix + keylet;
            super.set(keyletCountAccessor, super.get(keyletCountAccessor)! + 1);
        }
    }

    releaseEncodings(keylets: string[])
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
