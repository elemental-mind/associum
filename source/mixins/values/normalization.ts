import { collectionSizePrefix, compositeSeparator, keyletSeparator } from "../../constants.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";
import { ValueIndexType } from "../interfaces.ts";

export function RawValued(Base: new(...args: any[]) => AssociationContainer)
{
    class RawValued extends Base
    {
        static readonly kind = "RawValued" as const;
        declare valueIndexType: ValueIndexType;
    };

    RawValued.prototype.valueIndexType = ValueIndexType.None;
    return RawValued;
}

export function ArrayValued(Base: new (...args: any[]) => AssociationContainer)
{
    //We basically just save everything as a string of | separated keylets: $a_b_c => b|d|f|f|e|m
    //We also keep track of size: !a_b_c => 6
    class ArrayValued extends Base
    {
        static readonly kind = "ArrayValued" as const;
        declare valueIndexType: ValueIndexType;

        _encodeValue(value: any[])
        {
            const keylets: string[] = [];
            for (const element of value)
            {
                const keylet = super._toKeylet(element, true);
                keylets.push(keylet);
            }
            return keylets.join(compositeSeparator);
        }

        _decodeValue(keylets: string)
        {
            return keylets.split(compositeSeparator).map(keylet => super._fromKeylet(keylet));
        }

        _interceptSet(keylets: string[], value: string): boolean
        {
            const previous = super._interceptGet(keylets) as string | undefined;
            if (previous !== undefined)
                this._releaseKeylets(previous.split(compositeSeparator), keylets);

            this._bindKeylets(value.split(compositeSeparator), keylets);
            return super._interceptSet(keylets, value);
        }

        _interceptDelete(keylets: string[]): boolean
        {
            const value = super._interceptGet(keylets) as string | undefined;
            if (value !== undefined)
                this._releaseKeylets(value.split(compositeSeparator), keylets);

            return super._interceptDelete(keylets);
        }

        push(key: any, ...items: any[]): number
        {
            const accessKeylets = this._encodeSettingKey(key);
            const newKeylets = items.map(item => this._toKeylet(item, true));
            this._bindKeylets(newKeylets);

            const existingEntries = super._interceptGet(accessKeylets);
            const appendedEntries = newKeylets.join(compositeSeparator);

            super._interceptSet(accessKeylets, existingEntries ? existingEntries + compositeSeparator + appendedEntries : appendedEntries);
            return this._adjustLength(accessKeylets, items.length);
        }

        unshift(key: any, ...items: any[]): number
        {
            const accessKeylets = this._encodeSettingKey(key);
            const newKeylets = items.map(item => this._toKeylet(item, true));
            this._bindKeylets(newKeylets);

            const existingEntries = super._interceptGet(accessKeylets);
            const appendedEntries = newKeylets.join(compositeSeparator);

            super._interceptSet(accessKeylets, existingEntries ? appendedEntries + compositeSeparator + existingEntries : appendedEntries);
            return this._adjustLength(accessKeylets, items.length);
        }

        pop(key: any): any | undefined
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries) return undefined;

            let sliceIndex = existingEntries.lastIndexOf(compositeSeparator);

            if (sliceIndex < 0) sliceIndex = 0;

            const removedKeylet = existingEntries.slice(sliceIndex, 1)[0];
            const shortenedEntries = existingEntries.slice(0, sliceIndex);

            this._adjustLength(accessKeylets, -1);
            this._releaseKeylets([removedKeylet]);
            super._interceptSet(accessKeylets, shortenedEntries);

            return super._fromKeylet(removedKeylet);
        }

        shift(key: any): any | undefined
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries) return undefined;

            let sliceIndex = existingEntries.indexOf(compositeSeparator);

            if (sliceIndex < 0) sliceIndex = existingEntries.length;

            const removedKeylet = existingEntries.slice(0, sliceIndex);
            const shortenedEntries = existingEntries.slice(sliceIndex);

            this._adjustLength(accessKeylets, -1);
            this._releaseKeylets([removedKeylet]);
            super._interceptSet(accessKeylets, shortenedEntries);

            return super._fromKeylet(removedKeylet);
        }

        splice(key: any, start: number, deleteCount?: number, ...addedItems: any[]): any[]
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return [];

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries) return undefined;

            const existingKeylets = existingEntries.split(compositeSeparator);
            const keyletsToAdd = addedItems.map(item => this._toKeylet(item, true));
            this._bindKeylets(keyletsToAdd);

            const removedKeylets = existingKeylets.splice(start, deleteCount, ...keyletsToAdd);
            //We need to save it here, as freeing the keylets may remove them from the map.
            const removedItems = removedKeylets.map(keylet => super._fromKeylet(keylet));

            super._interceptSet(accessKeylets, existingKeylets);
            this._releaseKeylets(removedKeylets);
            this._adjustLength(accessKeylets, addedItems.length - removedKeylets.length);

            return removedItems;
        }

        purge(key: any, item: any, occurence: "First" | "Last" | "All"): boolean
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return false;

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries) return false;

            const targetKeylet = this._toKeylet(item, false);
            if (!targetKeylet) return false;

            let patchedString;
            let deletedEntries = 0;
            if (occurence === "First")
            {
                const index = existingEntries.indexOf(targetKeylet);
                if (index === -1) return false;
                patchedString = existingEntries.substring(0, index) + existingEntries.substring(index + targetKeylet.length + 1);
                deletedEntries++;
            }
            else if (occurence === "Last")
            {
                const index = existingEntries.lastIndexOf(targetKeylet);
                if (index === -1) return false;
                patchedString = existingEntries.substring(0, index) + existingEntries.substring(index + targetKeylet.length + 1);
                deletedEntries++;
            }
            else // All
            {
                patchedString = existingEntries
                    .split(compositeSeparator)
                    .filter(entry =>
                    {
                        const match = entry === targetKeylet;
                        if (match) deletedEntries++;
                        return !match;
                    })
                    .join(compositeSeparator);
            }

            this._adjustLength(accessKeylets, -deletedEntries);
            //Ok, very hacky - but it's just a proof of concept for now.
            this._releaseKeylets(new Array(deletedEntries).fill(targetKeylet));

            return true;
        }

        length(key: any)
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;
            return super.get(collectionSizePrefix + accessKeylets.join(keyletSeparator));
        }

        _adjustLength(keylets: string[], lengthDiff: number)
        {
            const collectionCountAccessor = collectionSizePrefix + keylets.join(keyletSeparator);
            const newLength = (super.get(collectionCountAccessor) ?? 0) + lengthDiff;
            super.set(collectionCountAccessor, newLength);
            return newLength;
        }
    };

    ArrayValued.prototype.valueIndexType = ValueIndexType.Array;
    return ArrayValued;
}

export function SetValued(Base: new (...args: any[]) => AssociationContainer)
{
    class SetValued extends Base
    {
        static readonly kind = "SetValued" as const;
        declare valueIndexType: ValueIndexType;

        _encodeValue(value: Set<any>): string[]
        {
            const keylets: string[] = [];
            for (const element of value)
            {
                const keylet = super._toKeylet(element, true);
                keylets.push(keylet);
            }
            return keylets;
        }

        _decodeValue(encoded: string)
        {
            const value = new Set();
            for (const keylet of encoded.split(compositeSeparator))
                value.add(super._fromKeylet(keylet));
            return value;
        }

        _interceptSet(keylets: string[], value: string): boolean
        {
            const previous = super._interceptGet(keylets) as string | undefined;
            if (previous !== undefined)
                this._releaseKeylets(previous.split(compositeSeparator));

            this._bindKeylets(value.split(compositeSeparator));
            return super._interceptSet(keylets, value);
        }

        _interceptDelete(keylets: string[]): boolean
        {
            const value = super._interceptGet(keylets) as string | undefined;
            if (value !== undefined)
                this._releaseKeylets(value.split(compositeSeparator));

            return super._interceptDelete(keylets);
        }

        fillSet(key: any, items: any[]): void
        {
            for (const item of items)
                this.addToSet(key, item);
        }

        addToSet(key: any, item: any): boolean
        {
            const accessKeylets = this._encodeSettingKey(key);
            const targetKeylet = this._toKeylet(item, true);

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries)
            {
                super._interceptSet(accessKeylets, targetKeylet);
                this._bindKeylets([targetKeylet]);
                this._adjustSize(accessKeylets, 1);
                return true;
            }

            const existingKeylets = existingEntries.split(compositeSeparator);
            if (existingKeylets.includes(targetKeylet)) return false;

            existingKeylets.push(targetKeylet);
            this._bindKeylets([targetKeylet]);
            super._interceptSet(accessKeylets, existingKeylets.join(compositeSeparator));
            this._adjustSize(accessKeylets, 1);
            return true;
        }

        deleteFromSet(key: any, item: any): boolean
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return false;

            const targetKeylet = this._toKeylet(item, false);
            if (!targetKeylet) return false;

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries) return false;

            const existingKeylets = existingEntries.split(compositeSeparator);
            const index = existingKeylets.indexOf(targetKeylet);
            if (index === -1) return false;

            existingKeylets.splice(index, 1);
            super._interceptSet(accessKeylets, existingKeylets.join(compositeSeparator));
            this._adjustSize(accessKeylets, -1);
            this._releaseKeylets([targetKeylet]);
            return true;
        }

        hasInSet(key: any, item: any): boolean
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return false;

            const targetKeylet = this._toKeylet(item, false);
            if (!targetKeylet) return false;

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries) return false;

            return existingEntries.split(compositeSeparator).includes(targetKeylet);
        }

        clearSet(key: any): void
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return;

            const existingEntries = super._interceptGet(accessKeylets) as string;
            if (!existingEntries) return;

            const existingKeylets = existingEntries.split(compositeSeparator);
            this._releaseKeylets(existingKeylets);
            this._adjustSize(accessKeylets, -existingKeylets.length);
            super._interceptDelete(accessKeylets);
        }

        sizeOfSet(key: any): number | undefined
        {
            const accessKeylets = this._encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;
            return super.get(collectionSizePrefix + accessKeylets.join(keyletSeparator)) ?? 0;
        }

        _adjustSize(keylets: string[], sizeDiff: number): number
        {
            const collectionSizeAccessor = collectionSizePrefix + keylets.join(keyletSeparator);
            const newSize = (super.get(collectionSizeAccessor) ?? 0) + sizeDiff;
            super.set(collectionSizeAccessor, newSize);
            return newSize;
        }
    };

    SetValued.prototype.valueIndexType = ValueIndexType.Set;
    return SetValued;
}