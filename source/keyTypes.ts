import { KeyletRegistry } from "./keyletRegistry";

export enum KeyType
{
    Unordered,
    Ordered,
    Structured,
}

export interface KeyStrategy<K, V> extends Map<string, V>
{
    readonly keyType: KeyType;
    getOrCreateComposite(keys: K): string;
    resolveComposite(keys: K): string | undefined;
    compositeToKeys(composite: string): K;
    normalizeQuery(input: Partial<K>): (string | undefined)[];
    deleteComposite(composite: string): void;
}

export class UnorderedKeys<K extends any[], V> extends Map<string, V> implements KeyStrategy<K, V>
{
    keyType = KeyType.Unordered;

    getOrCreateComposite(keys: K): string
    {
        return keys
            .map(key => KeyletRegistry.getOrCreateKeylet(key))
            .sort()
            .join(KeyletRegistry.keyletSeparator);
    }

    resolveComposite(keys: K): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys)
        {
            if (!key) continue;
            const keylet = KeyletRegistry.keysToKeylets.get(key);
            if (!keylet) return undefined;
            keylets.push(keylet);
        }

        return keylets.sort().join(KeyletRegistry.keyletSeparator);
    }

    compositeToKeys(composite: string): K
    {
        const keylets = composite.split(KeyletRegistry.keyletSeparator);
        return keylets.map(keylet => KeyletRegistry.keyletsToKeys.get(keylet) ?? null).filter(Boolean) as K;
    }

    normalizeQuery(input: Partial<K>): (string | undefined)[]
    {
        return (input as any[]).map(key => key ? KeyletRegistry.keysToKeylets.get(key) : undefined);
    }

    deleteComposite(composite: string): void
    {
        KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator));
    }
}

export class OrderedKeys<K extends any[], V> extends Map<string, V> implements KeyStrategy<K, V>
{
    keyType = KeyType.Ordered;

    getOrCreateComposite(keys: K): string
    {
        return keys.map(key => KeyletRegistry.getOrCreateKeylet(key)).join(KeyletRegistry.keyletSeparator);
    }

    resolveComposite(keys: K): string | undefined
    {
        const keylets: string[] = [];

        for (const key of keys)
        {
            if (!key) continue;
            const keylet = KeyletRegistry.keysToKeylets.get(key);
            if (!keylet) return undefined;
            keylets.push(keylet);
        }

        return keylets.join(KeyletRegistry.keyletSeparator);
    }

    compositeToKeys(composite: string): K
    {
        const keylets = composite.split(KeyletRegistry.keyletSeparator);
        return keylets.map(keylet => KeyletRegistry.keyletsToKeys.get(keylet) ?? null).filter(Boolean) as K;
    }

    normalizeQuery(input: Partial<K>): (string | undefined)[]
    {
        return (input as any[]).map(key => key ? KeyletRegistry.keysToKeylets.get(key) : undefined);
    }

    deleteComposite(composite: string): void
    {
        KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator));
    }
}

export class StructuredKeys<K extends Record<string, any>, V> extends Map<string, V> implements KeyStrategy<K, V>
{
    keyType = KeyType.Structured;

    private fieldCount = 0;
    private fieldMap: Record<string, number> = Object.create(null);
    private reverseFieldMap: string[] = [];

    getOrCreateComposite(keyObject: K): string
    {
        return this.transformKeysToArray(keyObject).join(KeyletRegistry.keyletSeparator);
    }

    resolveComposite(keyObject: K): string | undefined
    {
        const keylets = this.resolveKeysToArray(keyObject);
        if (!keylets) return undefined;
        return keylets.join(KeyletRegistry.keyletSeparator);
    }

    compositeToKeys(composite: string): K
    {
        const keylets = composite.split(KeyletRegistry.keyletSeparator);
        const obj: Record<string, any> = {};
        for (let i = 0; i < this.fieldCount; i++)
        {
            const keylet = keylets[i];
            if (keylet && keylet !== "")
            {
                const value = KeyletRegistry.keyletsToKeys.get(keylet);
                if (value !== undefined)
                {
                    const field = this.reverseFieldMap[i];
                    if (field) obj[field] = value;
                }
            }
        }
        return obj as K;
    }

    normalizeQuery(input: Partial<K>): (string | undefined)[]
    {
        const keyletArray: (string | undefined)[] = new Array(this.fieldCount).fill(undefined);
        for (const field in input)
        {
            let arrayPosition = this.fieldMap[field];
            if (arrayPosition === undefined)
            {
                arrayPosition = this.registerNewField(field);
                this.reverseFieldMap[arrayPosition] = field;
            }
            const keyValue = input[field];
            if (keyValue !== undefined)
            {
                const keylet = KeyletRegistry.keysToKeylets.get(keyValue);
                if (keylet !== undefined)
                {
                    keyletArray[arrayPosition] = keylet;
                }
            }
        }
        return keyletArray;
    }

    deleteComposite(composite: string): void
    {
        KeyletRegistry.freeKeylets(composite.split(KeyletRegistry.keyletSeparator).filter(k => k));
    }

    transformKeysToArray(keyObject: K): string[]
    {
        const keyletArray: string[] = new Array(this.fieldCount).fill("");
        for (const field in keyObject)
        {
            let arrayPosition = this.fieldMap[field];
            if (arrayPosition === undefined)
            {
                arrayPosition = this.registerNewField(field);
                this.reverseFieldMap[arrayPosition] = field;
            }
            keyletArray[arrayPosition] = KeyletRegistry.getOrCreateKeylet(keyObject[field]);
        }
        return keyletArray;
    }

    resolveKeysToArray(keyObject: K): string[] | undefined
    {
        const keyletArray: string[] = new Array(this.fieldCount).fill("");
        for (const field in keyObject)
        {
            const arrayPosition = this.fieldMap[field];
            if (arrayPosition === undefined) return undefined;
            const keylet = KeyletRegistry.keysToKeylets.get(keyObject[field]);
            if (keylet === undefined) return undefined;
            keyletArray[arrayPosition] = keylet;
        }
        return keyletArray;
    }

    private registerNewField(name: string): number
    {
        const pos = this.fieldCount++;
        this.fieldMap[name] = pos;
        this.reverseFieldMap[pos] = name;
        return pos;
    }
}