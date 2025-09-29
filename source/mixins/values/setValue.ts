import type { MapQueryResult } from "../../associativeMap.ts";
import type { AssociationContainer } from "../base/associationContainer.ts";

interface SetValueAPI<K, V>
{
    get(key: K): V[];
    getAsSet(key: K): Set<V>;
    add(key: K, item: V): number;
    delete(key: K, item: V): boolean;
    has(key: K, item: V): boolean;
    clear(): void;
}

interface QueryableArrayValueAPI<K, V> extends SetValueAPI<K, V>
{
    queryValuesContaining(values: V[]): MapQueryResult<K, V[]>[];
}

function NonQueryableSets(Base: new () => AssociationContainer)
{

}

function QueryableSets(Base: new () => AssociationContainer)
{

}