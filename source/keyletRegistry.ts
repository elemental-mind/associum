import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";

export class KeyletRegistry
{
    static idProvider = new IDProvider(AlphaNumeric);
    static keysToKeylets = new Map<any, string>();
    static keyletCountRegistry = new Map<string, number>();
    static keyletsToKeys = new Map<string, any>();

    static keyletSeparator = "_";
    static compositeSeparator = "|";

    static getOrCreateKeylet(key: any)
    {
        const id = KeyletRegistry.keysToKeylets.get(key);
        if (id) return id;

        const newId = KeyletRegistry.idProvider.generateID();
        KeyletRegistry.keysToKeylets.set(key, newId);
        KeyletRegistry.keyletsToKeys.set(newId, key);
        KeyletRegistry.keyletCountRegistry.set(newId, 0);
        return newId;
    }

    static bindKeylet(keylet: string)
    {
        const currentCount = KeyletRegistry.keyletCountRegistry.get(keylet) ?? 0;
        KeyletRegistry.keyletCountRegistry.set(keylet, currentCount + 1);
    }

    static freeKeylets(keylets: string[])
    {
        for (const keylet of keylets)
        {
            const currentCount = KeyletRegistry.keyletCountRegistry.get(keylet) ?? 0;
            if (currentCount <= 1)
            {
                KeyletRegistry.keyletCountRegistry.delete(keylet);
                const keyObj = KeyletRegistry.keyletsToKeys.get(keylet);
                if (keyObj !== undefined)
                    KeyletRegistry.keysToKeylets.delete(keyObj);

                KeyletRegistry.keyletsToKeys.delete(keylet);
            } else
                KeyletRegistry.keyletCountRegistry.set(keylet, currentCount - 1);
        }
    }
}