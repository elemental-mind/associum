import { type UnorderedIndex, type OrderedIndex, type StructuredIndex } from "./mixins/keys/indexing.ts";
import { AssociationContainer } from "./mixins/base/associationContainer.ts";
import type { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";

export function AssociativeMap(IndexingStrategy: typeof UnorderedIndex | typeof OrderedIndex | typeof StructuredIndex, QueryStrategy: typeof QueryableKeys | typeof NonqueryableKeys)
{
    const Base = QueryStrategy(IndexingStrategy(AssociationContainer));

    return class AssociativeMap<K, V> extends Base<K, V>
    {
        //Rereoute Map methods to intercepted versions
        //This is done to allow mixins to access the underlying map via super without interference
        //while still allowing users to use the Map methods directly on the final class
        //See documentation/code-architecture.md for more information
        static {
            this.prototype.get = this.prototype.interceptGet;
            this.prototype.has = this.prototype.interceptHas;
            this.prototype.delete = this.prototype.interceptDelete;
            this.prototype.keys = this.prototype.interceptKeys;
            this.prototype.entries = this.prototype.interceptEntries;
            this.prototype.values = this.prototype.interceptValues;
        }

        set(key: K, value: V): this
        {
            this.interceptSet(key, value);
            return this;
        }
    };
}

export type MapQueryResult<K, V> = { key: K; value: V; };
