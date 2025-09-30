import { collectionSizePrefix, compositeSeparator, keyletSeparator } from "../../constants.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";
import type { ValueIndexType } from "../interfaces.ts";

export function RawValued(Base: new () => AssociationContainer)
{
    return class RawValued extends Base
    {
        valueIndexType: ValueIndexType.None;
    };
}

export function ArrayValued(Base: new () => AssociationContainer)
{
    //We basically just save everything as a string of | separated keylets: $a_b_c => b|d|f|f|e|m
    //We also keep track of size: !a_b_c => 6
    return class ArrayValued<K, V> extends Base
    {
        valueIndexType: ValueIndexType.Array;

        encodeValue(value: any[])
        {
            const keylets: string[] = [];
            for (const element of value)
            {
                const keylet = super.toKeylet(element, true);
                keylets.push(keylet);
            }
            return keylets.join(compositeSeparator);
        }

        decodeValue(keylets: string)
        {
            return keylets.split(compositeSeparator).map(keylet => super.fromKeylet(keylet));
        }

        interceptSet(keylets: string[], value: string): boolean
        {
            const previous = super.interceptGet(keylets) as string | undefined;
            if (previous !== undefined)
                this.releaseKeylets(previous.split(compositeSeparator));

            this.bindKeylets(value.split(compositeSeparator));
            return super.interceptSet(keylets, value);
        }

        interceptDelete(keylets: string[]): boolean
        {
            const value = super.interceptGet(keylets) as string | undefined;
            if (value !== undefined)
                this.releaseKeylets(value.split(compositeSeparator));

            return super.interceptDelete(keylets);
        }

        push(key: K, ...items: V[]): number
        {
            const accessKeylets = this.encodeSettingKey(key);
            const newKeylets = items.map(item => this.toKeylet(item, true));
            this.bindKeylets(newKeylets);

            const existingEntries = super.interceptGet(accessKeylets);
            const appendedEntries = newKeylets.join(compositeSeparator);

            super.interceptSet(accessKeylets, existingEntries ? existingEntries + compositeSeparator + appendedEntries : appendedEntries);
            return this.adjustLength(accessKeylets, items.length);
        }

        unshift(key: K, ...items: V[]): number
        {
            const accessKeylets = this.encodeSettingKey(key);
            const newKeylets = items.map(item => this.toKeylet(item, true));
            this.bindKeylets(newKeylets);

            const existingEntries = super.interceptGet(accessKeylets);
            const appendedEntries = newKeylets.join(compositeSeparator);

            super.interceptSet(accessKeylets, existingEntries ? appendedEntries + compositeSeparator + existingEntries : appendedEntries);
            return this.adjustLength(accessKeylets, items.length);
        }

        pop(key: K): V | undefined
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries) return undefined;

            let sliceIndex = existingEntries.lastIndexOf(compositeSeparator);

            if (sliceIndex < 0) sliceIndex = 0;

            const removedKeylet = existingEntries.slice(sliceIndex, 1)[0];
            const shortenedEntries = existingEntries.slice(0, sliceIndex);

            this.adjustLength(accessKeylets, -1);
            this.releaseKeylets([removedKeylet]);
            super.interceptSet(accessKeylets, shortenedEntries);

            return super.fromKeylet(removedKeylet);
        }

        shift(key: K): V | undefined
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries) return undefined;

            let sliceIndex = existingEntries.indexOf(compositeSeparator);

            if (sliceIndex < 0) sliceIndex = existingEntries.length;

            const removedKeylet = existingEntries.slice(0, sliceIndex);
            const shortenedEntries = existingEntries.slice(sliceIndex);

            this.adjustLength(accessKeylets, -1);
            this.releaseKeylets([removedKeylet]);
            super.interceptSet(accessKeylets, shortenedEntries);

            return super.fromKeylet(removedKeylet);
        }

        splice(key: K, start: number, deleteCount?: number, ...addedItems: V[]): V[]
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return [];

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries) return undefined;

            const existingKeylets = existingEntries.split(compositeSeparator);
            const keyletsToAdd = addedItems.map(item => this.toKeylet(item, true));
            this.bindKeylets(keyletsToAdd);

            const removedKeylets = existingKeylets.splice(start, deleteCount, ...keyletsToAdd);
            //We need to save it here, as freeing the keylets may remove them from the map.
            const removedItems = removedKeylets.map(keylet => super.fromKeylet(keylet));

            super.interceptSet(accessKeylets, existingKeylets);
            this.releaseKeylets(removedKeylets);
            this.adjustLength(accessKeylets, addedItems.length - removedKeylets.length);

            return removedItems;
        }

        purge(key: K, item: V, occurence: "First" | "Last" | "All"): boolean
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return false;

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries) return false;

            const targetKeylet = this.toKeylet(item, false);
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
                const patchedString = existingEntries
                    .split(compositeSeparator)
                    .filter(entry =>
                    {
                        const match = entry === targetKeylet;
                        if (match) deletedEntries++;
                        return !match;
                    })
                    .join(compositeSeparator);
            }

            this.adjustLength(accessKeylets, deletedEntries);
            //Ok, very hacky for now - but it's just proof of concept for now.
            this.releaseKeylets(new Array(deletedEntries).fill(targetKeylet));

            return true;
        }

        length(key: K)
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;
            return super.get(collectionSizePrefix + accessKeylets.join(keyletSeparator));
        }

        adjustLength(keylets: string[], lengthDiff: number)
        {
            const collectionCountAccessor = collectionSizePrefix + keylets.join(keyletSeparator);
            const newLength = (super.get(collectionCountAccessor) ?? 0) + lengthDiff;
            super.set(collectionCountAccessor, newLength);
            return newLength;
        }
    };
}

export function SetValued(Base: new () => AssociationContainer)
{
    return class SetValued<K, V> extends Base
    {
        valueIndexType: ValueIndexType.Set;

        encodeValue(value: Set<any>): string[]
        {
            const keylets: string[] = [];
            for (const element of value)
            {
                const keylet = super.toKeylet(element, true);
                keylets.push(keylet);
            }
            return keylets;
        }

        decodeValue(encoded: string)
        {
            const value = new Set();
            for (const keylet of encoded.split(compositeSeparator))
                value.add(super.fromKeylet(keylet));
            return value;
        }

        interceptSet(keylets: string[], value: string): boolean
        {
            const previous = super.interceptGet(keylets) as string | undefined;
            if (previous !== undefined)
                this.releaseKeylets(previous.split(compositeSeparator));

            this.bindKeylets(value.split(compositeSeparator));
            return super.interceptSet(keylets, value);
        }

        interceptDelete(keylets: string[]): boolean
        {
            const value = super.interceptGet(keylets) as string | undefined;
            if (value !== undefined)
                this.releaseKeylets(value.split(compositeSeparator));

            return super.interceptDelete(keylets);
        }

        fillSet(key: K, items: V[]): void
        {
            for (const item of items)
                this.addToSet(key, item);
        }

        addToSet(key: K, item: V): boolean
        {
            const accessKeylets = this.encodeSettingKey(key);
            const targetKeylet = this.toKeylet(item, true);

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries)
            {
                super.interceptSet(accessKeylets, targetKeylet);
                this.bindKeylets([targetKeylet]);
                this.adjustSize(accessKeylets, 1);
                return true;
            }

            const existingKeylets = existingEntries.split(compositeSeparator);
            if (existingKeylets.includes(targetKeylet)) return false;

            existingKeylets.push(targetKeylet);
            this.bindKeylets([targetKeylet]);
            super.interceptSet(accessKeylets, existingKeylets.join(compositeSeparator));
            this.adjustSize(accessKeylets, 1);
            return true;
        }

        deleteFromSet(key: K, item: V): boolean
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return false;

            const targetKeylet = this.toKeylet(item, false);
            if (!targetKeylet) return false;

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries) return false;

            const existingKeylets = existingEntries.split(compositeSeparator);
            const index = existingKeylets.indexOf(targetKeylet);
            if (index === -1) return false;

            existingKeylets.splice(index, 1);
            super.interceptSet(accessKeylets, existingKeylets.join(compositeSeparator));
            this.adjustSize(accessKeylets, -1);
            this.releaseKeylets([targetKeylet]);
            return true;
        }

        hasInSet(key: K, item: V): boolean
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return false;

            const targetKeylet = this.toKeylet(item, false);
            if (!targetKeylet) return false;

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries) return false;

            return existingEntries.split(compositeSeparator).includes(targetKeylet);
        }

        clearSet(key: K): void
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return;

            const existingEntries = super.interceptGet(accessKeylets) as string;
            if (!existingEntries) return;

            const existingKeylets = existingEntries.split(compositeSeparator);
            this.releaseKeylets(existingKeylets);
            this.adjustSize(accessKeylets, -existingKeylets.length);
            super.interceptDelete(accessKeylets);
        }

        sizeOfSet(key: K): number | undefined
        {
            const accessKeylets = this.encodeRetrievalKey(key);
            if (!accessKeylets) return undefined;
            return super.get(collectionSizePrefix + accessKeylets.join(keyletSeparator)) ?? 0;
        }

        adjustSize(keylets: string[], sizeDiff: number): number
        {
            const collectionSizeAccessor = collectionSizePrefix + keylets.join(keyletSeparator);
            const newSize = (super.get(collectionSizeAccessor) ?? 0) + sizeDiff;
            super.set(collectionSizeAccessor, newSize);
            return newSize;
        }
    };
}