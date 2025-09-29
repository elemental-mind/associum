/*desired interface:
map.get(key) => [];
map.push(key, value);
map.pop(key);
map.unshift(key, value);
map.shift(key);
map.includes(key, value);
map.queryValuesContaining(containingArray);
map.queryValuesMatching(sparseArray);
...all other usual map methods;
*/

import type { MapQueryResult } from "../../associativeMap.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";

interface ArrayValueAPI<K, V>
{
    get(key: K): V[];
    push(key: K, ...items: V[]): number;
    pop(key: K): V | undefined;
    shift(key: K): V | undefined;
    unshift(key: K, ...items: V[]): number;
    splice(key: K, start: number, deleteCount?: number): V[];
    purge(key: K, item: V, occurence: "First" | "Last" | "All"): boolean;
}

interface QueryableArrayValueAPI<K, V> extends ArrayValueAPI<K, V>
{
    queryValuesContaining(values: V[]): MapQueryResult<K, V[]>[];
}

function NonQueryableArrays(Base: new () => AssociationContainer)
{

}

function QueryableArrays(Base: new () => AssociationContainer)
{
    export class QueryableArrays<K, V> extends Base implements QueryableArrayValueAPI<K, V>
    {
        get(key: K): V[]
        {
            const composite = super.resolveKeyComposite(key);
            if (!composite) return [];
            const existing = super.get(keyValuePrefix + composite);
            if (!existing) return [];
            return existing as V[];
        }
    }
}