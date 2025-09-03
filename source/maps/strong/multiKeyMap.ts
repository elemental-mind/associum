import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { StringListIntersector } from "../../helpers/intersection.ts";
import type { MultikeyMapQueryResult } from "../../associatium.ts";

export class MultiKeyMap<V>
{
    static idProvider = new IDProvider(AlphaNumeric);
    static objectsToKeylets = new Map<any, string>();
    static keyletCountRegistry = new Map<string, number>();
    static keyletsToObjects = new Map<string, any>();

    static ensureKeylet(key: any): string
    {
        const id = this.objectsToKeylets.get(key);
        if (id) return id;

        const newId = this.idProvider.generateID();
        this.objectsToKeylets.set(key, newId);
        this.keyletsToObjects.set(newId, key);
        this.bindKeylet(newId);
        return newId;
    }

    static ensureKeylets(keys: readonly any[]): string[]
    {
        return keys.map(key => this.ensureKeylet(key));
    }

    static keysToKeylets(keys: readonly any[]): (string | undefined)[]
    {
        const keylets = [] as (string | undefined)[];
        for (const key of keys)
            keylets.push(this.objectsToKeylets.get(key));
        return keylets;
    }

    static keysToComposite(keys: readonly any[]): string | undefined
    {
        const keylets: string[] = [];
        for (const key of keys)
        {
            const keylet = this.objectsToKeylets.get(key);
            if (!keylet)
                return undefined;
            else
                keylets.push(keylet);
        }

        return this.keyletsToComposite(keylets);
    }

    static keyletsToComposite(keylets: string[])
    {
        return keylets.join("_");
    }

    static keyletToKey(id: string)
    {
        return this.keyletsToObjects.get(id);
    }

    static keyletsToKeys(ids: string[])
    {
        return ids.map(id => this.keyletToKey(id)!);
    }

    static compositeToKeylets(composite: string)
    {
        return composite.split("_");
    }

    static bindKeylet(keylet: string)
    {
        const currentCount = this.keyletCountRegistry.get(keylet) ?? 0;
        this.keyletCountRegistry.set(keylet, currentCount + 1);
    }

    static freeKeylet(keylet: string)
    {
        const currentCount = this.keyletCountRegistry.get(keylet) ?? 0;
        if (currentCount <= 1)
        {
            this.keyletCountRegistry.delete(keylet);
            const keyObj = this.keyletsToObjects.get(keylet);
            if (keyObj !== undefined)
            {
                this.objectsToKeylets.delete(keyObj);
            }
            this.keyletsToObjects.delete(keylet);
        }
        else
            this.keyletCountRegistry.set(keylet, currentCount - 1);
    }

    static freeComposite(composite: string)
    {
        const keylets = this.compositeToKeylets(composite);
        for (const keylet of keylets)
            this.freeKeylet(keylet);
    }

    protected map = new Map<string, V>();
}


