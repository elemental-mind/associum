import { compositeSeparator, keyletSeparator, valueIndexPrefix, keyValuePrefix, keyIndexPrefix } from "../../constants.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";
import type { MapQueryResult } from "../interfaces.ts";
import { StringListIntersector } from "../../helpers/intersection.ts";
import { decrementUInt, encodeUIntToASCII, incrementUInt, isOne } from "asciinumerium";

export function NonqueryableValues(Base: new (...args: any[]) => AssociationContainer)
{
    Base.prototype.valuesQueryable = false;
    return Base;
}

export function QueryableValues(Base: new (...args: any[]) => AssociationContainer)
{
    class QueryableKeys extends Base
    {
        declare valuesQueryable: boolean;

        //We need to save value use to an index
        //Value index looks like: |<key>#<usageCount>|<key>#<usageCount>|...
        _bindKeylets(keylets: string[], bindToKey?: string[]): void
        {
            super._bindKeylets(keylets);

            if (!bindToKey) return;

            const keyEntry = compositeSeparator + bindToKey.join(keyletSeparator) + "#";

            for (const keylet of keylets)
            {
                const keyletRegistryKey = valueIndexPrefix + keylet;
                const existingKeyletRegister = super.get(keyletRegistryKey) as string ?? "";
                const keyPosition = existingKeyletRegister.indexOf(keyEntry);
                let modifiedRegistry: string;

                if (keyPosition === -1)
                    modifiedRegistry = existingKeyletRegister + keyEntry + encodeUIntToASCII(1);
                else
                {
                    const [keyCounterStartInclusive, keyCounterEndExclusive] = this._findCounterRange(existingKeyletRegister, keyPosition, keyEntry);
                    modifiedRegistry = incrementUInt(existingKeyletRegister, keyCounterStartInclusive, keyCounterEndExclusive);
                }

                super.set(keyletRegistryKey, modifiedRegistry);
            }
        }

        _releaseKeylets(keylets: string[], releaseFromKey?: string[]): void
        {
            super._releaseKeylets(keylets);

            if (!releaseFromKey) return;

            const keyEntry = compositeSeparator + releaseFromKey.join(keyletSeparator) + "#";

            for (const keylet of keylets)
            {
                const keyletRegistryKey = valueIndexPrefix + keylet;
                const existingKeyletRegister = super.get(keyletRegistryKey) as string ?? "";
                const keyPosition = existingKeyletRegister.indexOf(keyEntry);

                let modifiedRegistry: string;

                const [keyCounterStartInclusive, keyCounterEndExclusive] = this._findCounterRange(existingKeyletRegister, keyPosition, keyEntry);
                if (isOne(existingKeyletRegister, keyCounterStartInclusive, keyCounterEndExclusive))
                {
                    modifiedRegistry = modifiedRegistry.substring(0, keyPosition) + modifiedRegistry.substring(keyCounterEndExclusive);
                    if (modifiedRegistry.length)
                        super.set(keyletRegistryKey, modifiedRegistry);
                    else
                    {
                        if (!super.has(keyIndexPrefix + keylet))
                            super.delete(keylet);
                        super.delete(keyletRegistryKey);
                    }
                }
                else
                {
                    modifiedRegistry = decrementUInt(existingKeyletRegister, keyCounterStartInclusive, keyCounterEndExclusive);
                    super.set(keyletRegistryKey, modifiedRegistry);
                }
            }
        }

        queryValuesContaining(keyTemplate: any): MapQueryResult<any, any>[]
        {
            const keylets = [];
            const indicesThatNeedToMatch = [];

            if (!this._encodeQueryKey(keyTemplate, keylets, indicesThatNeedToMatch)) return [];

            const alreadyChecked = new Set<string>();
            const results: MapQueryResult<any, any>[] = [];

            for (const index of indicesThatNeedToMatch)
            {
                const keylet = keylets[index]!;
                const compositesStr = super.get(valueIndexPrefix + keylet) ?? "";

                for (const fullComposite of compositesStr.split(compositeSeparator))
                {
                    if (!fullComposite) continue;
                    const hashPos = fullComposite.lastIndexOf('#');
                    if (hashPos === -1) continue;
                    const keyStr = fullComposite.substring(0, hashPos);
                    if (alreadyChecked.has(keyStr)) continue;
                    alreadyChecked.add(keyStr);

                    const compositeKeylets = keyStr.split(keyletSeparator);

                    if (indicesThatNeedToMatch.every(matchIndex => compositeKeylets[matchIndex] === keylets[matchIndex]))
                        results.push({
                            key: this._decodeKey(compositeKeylets),
                            value: this._decodeValue(super.get(keyValuePrefix + keyStr))
                        });
                }
            }

            return results;
        }

        queryValuesMatching(keys: any[]): MapQueryResult<any, any>[]
        {
            const keylets = [];
            const indicesThatNeedToMatch = [];

            if (!this._encodeQueryKey(keys, keylets, indicesThatNeedToMatch)) return [];

            // Inline findCompositesContainingAllOf
            const intersector = new StringListIntersector();

            for (const keylet of keylets)
            {
                const fullCompsStr = super.get(valueIndexPrefix + keylet) ?? "";
                const keyStrs: string[] = [];
                for (const fullComp of fullCompsStr.split(compositeSeparator))
                {
                    if (!fullComp) continue;
                    const hashPos = fullComp.lastIndexOf('#');
                    if (hashPos !== -1)
                    {
                        const keyStr = fullComp.substring(0, hashPos);
                        keyStrs.push(keyStr);
                    }
                }
                intersector.addToIntersection(keyStrs);
            }

            const keyStrs = intersector.computeIntersection();

            const results: MapQueryResult<any, any>[] = [];
            for (const keyStr of keyStrs)
            {
                const compositeKeylets = keyStr.split(keyletSeparator);
                results.push({
                    key: this._decodeKey(compositeKeylets),
                    value: this._decodeValue(super.get(keyValuePrefix + keyStr))
                });
            }

            return results;
        }

        _findCounterRange(existingKeyletRegister: string, keyPosition: number, keyEntry: string): [number, number]
        {
            const keyCounterStartInclusive = keyPosition + keyEntry.length;
            let keyCounterEndExclusive = existingKeyletRegister.indexOf(compositeSeparator, keyCounterStartInclusive);
            return [keyCounterStartInclusive, keyCounterEndExclusive < 0 ? existingKeyletRegister.length : keyCounterEndExclusive];
        }
    }

    QueryableKeys.prototype.valuesQueryable = true;
    return QueryableKeys;
}