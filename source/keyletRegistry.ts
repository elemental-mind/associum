import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";

export class KeyletRegistry
{
    static idProvider = new IDProvider(AlphaNumeric);
    static keysToKeylets = new Map<any, string>();
    static keyletsToKeys = new Map<string, any>();
    static keyletUseCounts = new Map<string, number>();

    static keyletSeparator = "_";
    static compositeSeparator = "|";

    static getOrCreateKeylet(key: any)
    {
        const id = KeyletRegistry.keysToKeylets.get(key);
        if (id) return id;

        const newKeylet = KeyletRegistry.idProvider.generateID();
        KeyletRegistry.keysToKeylets.set(key, newKeylet);
        KeyletRegistry.keyletsToKeys.set(newKeylet, key);
        KeyletRegistry.keyletUseCounts.set(newKeylet, 0);
        return newKeylet;
    }

    static bindKeylets(keylets: string[])
    {
        for (const keylet of keylets)
            KeyletRegistry.keyletUseCounts.set(keylet, KeyletRegistry.keyletUseCounts.get(keylet)! + 1);
    }

    static freeKeylets(keylets: string[])
    {
        for (const keylet of keylets)
        {
            const currentCount = KeyletRegistry.keyletUseCounts.get(keylet)!;

            if (currentCount > 1) 
            {
                KeyletRegistry.keyletUseCounts.set(keylet, currentCount - 1);
            }
            else
            {
                const keyObj = KeyletRegistry.keyletsToKeys.get(keylet)!;
                KeyletRegistry.keysToKeylets.delete(keyObj);
                KeyletRegistry.keyletsToKeys.delete(keylet);
                KeyletRegistry.keyletUseCounts.delete(keylet);
            }
        }
    }
}