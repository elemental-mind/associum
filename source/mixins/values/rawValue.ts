import type { AssociationContainer } from "../base/associationContainer.ts";

interface QueryableValuesAPI<K, V>
{
    queryValues(values: V[]): MapQueryResult<K, V[]>[];
}

function NonQueryableRaws(Base: new () => AssociationContainer)
{
    return Base;
}

function QueryableRaws(Base: new () => AssociationContainer)
{
    return class QueryableRaws<K, V> extends Base implements QueryableValuesAPI<K, V>
    {
        
    }
}