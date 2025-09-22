import type { MultikeyMapQueryResult } from "../../associatium.ts";
import { MultikeyMap } from './base';

export class StructuredMultiKeyMap<K extends Record<string, any>, V> extends MultikeyMap<K, V>
{
    protected fieldCount = 0;
    protected fieldMap: Record<string, number> = Object.create(null);

    constructor()
    {
        super();
    }

    encodeSettingComposite(keys: K): string
    {
        const keyletArray: any[] = [];

        for (const key in keys)
        {
            const arrayPosition = this.fieldMap[key] ?? this.registerNewField(key);
            keyletArray[arrayPosition] = this.ensureAndReturnKeylet(keys[key]);
        }

        return this.keyletsToComposite(keyletArray);
    }

    encodeProbingComposite(keys: K): string | undefined
    {
        const probeArray = this.encodeProbingArray(keys);
        return probeArray ? this.keyletsToComposite(probeArray) : undefined;
    }

    protected encodeProbingArray(keys: Partial<K>)
    {
        const keyletArray: string[] = [];

        for (const key in keys)
        {
            const arrayPosition = this.fieldMap[key];
            if (arrayPosition === undefined)
                return undefined;

            const keylet = MultikeyMap.objectsToKeylets.get(keys[key]);
            if (keylet === undefined)
                return undefined;

            keyletArray[arrayPosition] = keylet;
        }

        return keyletArray;
    }

    private registerNewField(name: string): number
    {
        this.fieldMap[name] = this.fieldCount++;
        return this.fieldMap[name];
    }


}

export class QueryableStructuredMultiKeyMap<K extends Record<string, any>, V> extends StructuredMultiKeyMap<K, V>
{
    protected keyletToComposites = new Map<string, string>();

    set(keys: K, value: V): void
    {
        const composite = this.encodeSettingComposite(keys);

        if (!this.map.has(composite))
            return;

        for (const field in keys)
        {
            const keylet = MultikeyMap.objectsToKeylets.get(keys[field])!;

            this.linkKeyletToComposite(keylet, composite);
        }

        this.map.set(composite, value);
    }

    query(queryTemplate: Partial<K>): MultikeyMapQueryResult<K, V>[]
    {
        const requiredKeyletsInOrder = this.encodeProbingArray(queryTemplate);
        if (!requiredKeyletsInOrder) return [];

        const indicesThatNeedToMatch: number[] = [];
        for (let index = 0; index < requiredKeyletsInOrder.length; index++)
            if (requiredKeyletsInOrder[index] !== undefined) indicesThatNeedToMatch.push(index);

        const alreadyCheckedComposites = new Set<string>();
        const result: MultikeyMapQueryResult<K, V>[] = [];

        keyletLoop:
        for (const keyletIndex of indicesThatNeedToMatch)
        {
            const keylet = requiredKeyletsInOrder[keyletIndex];
            const compositesContainingKeylet = this.keyletToComposites.get(keylet)!;

            compositeLoop:
            for (const composite of compositesContainingKeylet.split("|"))
            {
                if (alreadyCheckedComposites.has(composite)) continue;

                alreadyCheckedComposites.add(composite);

                const compositeKeylets = composite.split("_");

                compositeCheckLoop:
                for (const index of indicesThatNeedToMatch)
                    if (compositeKeylets[index] !== requiredKeyletsInOrder[index]) continue compositeLoop;

                result.push(
                    {
                        key: this.buildKeyObject(compositeKeylets) as K,
                        value: this.map.get(composite)!
                    });
            }
        }

        return result;
    }

    delete(keys: K): boolean
    {
        const composite = this.encodeProbingComposite(keys);
        if (!composite || !this.map.delete(composite))
            return false;

        this.deleteCompositeFromKeyletMappings(composite);
        this.freeComposite(composite);

        return true;
    }

    clear()
    {
        super.clear();
        this.keyletToComposites.clear();
    }

    private linkKeyletToComposite(keylet: string, composite: string): void
    {
        const existing = this.keyletToComposites.get(keylet);
        this.keyletToComposites.set(keylet, existing ? `${existing}|${composite}` : composite);
    }

    private deleteCompositeFromKeyletMappings(composite: string): void
    {
        const compositeKeylets = composite.split("_");
        for (const keylet of compositeKeylets)
        {
            const compositesContainingKeylet = this.keyletToComposites.get(keylet)!;
            const filteredComposites = compositesContainingKeylet.split("|").filter(c => c !== composite).join("|");
            if (filteredComposites)
                this.keyletToComposites.set(keylet, filteredComposites);
            else
                this.keyletToComposites.delete(keylet);
        }
    }

    private buildKeyObject(keyKeylets: string[])
    {
        const keyObject = {} as Record<string, any>;
        for (const key in this.fieldMap)
        {
            const keyIndex = this.fieldMap[key];

            if (keyKeylets[keyIndex])
                keyObject[key] = MultikeyMap.keyletsToObjects.get(keyKeylets[keyIndex]);
        }
        return keyObject;
    }
}