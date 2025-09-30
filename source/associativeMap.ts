import { type UnorderedIndex, type OrderedIndex, type StructuredIndex } from "./mixins/keys/normalization.ts";
import { AssociationContainer } from "./mixins/base/associationContainer.ts";
import type { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";

export function AssociativeMap(IndexingStrategy: typeof UnorderedIndex | typeof OrderedIndex | typeof StructuredIndex, QueryStrategy: typeof QueryableKeys | typeof NonqueryableKeys)
{
    return class AssociativeMap<K, V> extends AssociationContainer
    {
        interceptSet(key: K, value: any)
        {
            return super.interceptSet(super.encodeSettingKey(key), this.encodeValue(value));
        }

        interceptGet(key: K): V | undefined
        {
            const keylets = this.encodeRetrievalKey(key);
            if (!keylets) return undefined;
            return this.decodeValue(super.interceptGet(keylets));
        }

        interceptHas(key: K): boolean
        {
            const keylets = this.encodeRetrievalKey(key);
            if (!keylets) return false;
            return super.interceptHas(keylets);
        }

        interceptDelete(key: K): boolean
        {
            const keylets = this.encodeRetrievalKey(key);
            if (!keylets) return false;
            return super.interceptDelete(keylets);
        }
    };
}
