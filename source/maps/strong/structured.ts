import { OrderedMultiKeyMap, type MultikeyMapQueryResult } from "../../associatium.ts";
import { BaseMultiKeyMap, QueryableMultikeyMap } from './base';
import { QueryableOrderedMultikeyMap } from './ordered';

export class StructuredMultiKeyMap<K extends Record<string, any>, V> extends BaseMultiKeyMap<K, V>
{
    private fieldCount = 0;
    private fieldMap: Record<string, number> = Object.create(null);

    protected getOrCreateComposite(keyObject: K): string
    {
        return OrderedMultiKeyMap.prototype.getOrCreateComposite.call(this, this.transformKeysToArray(keyObject));
    }

    protected resolveComposite(keyObject: K): string | undefined
    {
        const resolvedKeysArray = this.resolveKeysToArray(keyObject);
        if (!resolvedKeysArray) return undefined;

        return OrderedMultiKeyMap.prototype.resolveComposite.call(this, resolvedKeysArray);
    }

    protected deleteComposite = OrderedMultiKeyMap.prototype.deleteComposite;

    protected transformKeysToArray(keyObject: K)
    {
        const keyletArray: any[] = [];

        for (const field in keyObject)
        {
            const arrayPosition = this.fieldMap[field] ?? this.registerNewField(field);
            keyletArray[arrayPosition] = this.getOrCreateKeylet(keyObject[field]);
        }

        return keyletArray;
    }

    protected resolveKeysToArray(keyObject: K)
    {
        const keyletArray: string[] = [];

        for (const field in keyObject)
        {
            const arrayPosition = this.fieldMap[field];
            if (arrayPosition === undefined)
                return undefined;

            const keylet = BaseMultiKeyMap.keysToKeylets.get(keyObject[field]);
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

export class QueryableStructuredMultiKeyMap<K extends Record<string, any>, V> extends QueryableMultikeyMap<K, V>
{
    private fieldCount = 0;
    private fieldMap: Record<string, number> = Object.create(null);

    query(partial: Partial<K>): MultikeyMapQueryResult<K, V>[]
    {
        //@ts-ignore borrow transform from non-queryable structured
        const orderedKeysArray = StructuredMultiKeyMap.prototype.resolveKeysToArray.call(this, partial);
        if (!orderedKeysArray) return [];

        //@ts-ignore reuse ordered+queryable query to find matches
        return QueryableOrderedMultikeyMap.prototype.queryEntriesMatching.call(this, orderedKeysArray);
    }

    protected getOrCreateComposite(keyObject: K): string
    {
        //@ts-ignore borrow transform from non-queryable structured
        const orderedKeysArray = StructuredMultiKeyMap.prototype.transformKeysToArray.call(this, keyObject);
        //@ts-ignore reuse ordered+queryable composition to index for queries
        return QueryableOrderedMultikeyMap.prototype.getOrCreateComposite.call(this, orderedKeysArray);
    }

    protected resolveComposite = StructuredMultiKeyMap.prototype.resolveComposite;
    protected deleteComposite = QueryableMultikeyMap.prototype.deleteComposite;

    protected compositeToKeys(composite: string): K
    {
        const keylets = composite.split(BaseMultiKeyMap.keyletSeparator);
        const keyObject: Record<string, any> = {};

        for (const field in this.fieldMap)
        {
            const arrayPosition = this.fieldMap[field];
            const keylet = keylets[arrayPosition];
            if (keylet !== undefined)
                keyObject[field] = BaseMultiKeyMap.keyletsToKeys.get(keylet);
        }

        return keyObject as K;
    }

    // Needed by borrowed transformKeysToArray
    private registerNewField = StructuredMultiKeyMap.prototype.registerNewField;
}