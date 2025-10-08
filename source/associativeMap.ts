import { type UnorderedIndex, type OrderedIndex, type StructuredIndex } from "./mixins/keys/normalization.ts";
import { AssociationContainer } from "./mixins/base/associationContainer.ts";
import type { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";
import type { ArrayValued, RawValued, SetValued } from "./mixins/values/normalization.ts";
import type { NonqueryableValues, QueryableValues } from "./mixins/values/queryability.ts";
import type {
    OrderedQueryableKeysAPI,
    StructuredQueryableKeysAPI,
    UnorderedQueryableKeysAPI,
    KeyQueryAPI,
    QueryableCollectionValuesAPI,
    QueryableValuesAPI,
    ValueIndexingAPI,
    KeyIndexingAPI,
    ArrayValuedAPI,
    SetValuedAPI,
    ValueQueryAPI
} from "./mixins/interfaces.ts";

export function AssociativeMap(
    KeyType: typeof UnorderedIndex | typeof OrderedIndex | typeof StructuredIndex,
    KeyQueryability: typeof NonqueryableKeys | typeof QueryableKeys,
    ValueType: typeof RawValued | typeof ArrayValued | typeof SetValued,
    ValueQueryability: typeof NonqueryableValues | typeof QueryableValues
)
{
    return class AssociativeMap<K, V> extends KeyQueryability(KeyType(ValueQueryability(ValueType(AssociationContainer))))
    {
        set(key: K, value: any)
        {
            super._interceptSet(super._encodeSettingKey(key), this._encodeValue(value));
            return this;
        }

        get(key: K): V | undefined
        {
            const keylets = this._encodeRetrievalKey(key);
            if (!keylets) return undefined;
            return this._decodeValue(super._interceptGet(keylets));
        }

        has(key: K): boolean
        {
            const keylets = this._encodeRetrievalKey(key);
            if (!keylets) return false;
            return super._interceptHas(keylets);
        }

        delete(key: K): boolean
        {
            const keylets = this._encodeRetrievalKey(key);
            if (!keylets) return false;
            return super._interceptDelete(keylets);
        }
    } as unknown as new <K, V>()
            =>
            Map<K, V>
            &
            KeyIndexingAPI
            &
            (typeof KeyQueryability extends typeof QueryableKeys ?
                (typeof KeyType extends typeof OrderedIndex ? OrderedQueryableKeysAPI<K[], K, V> :
                    typeof KeyType extends typeof StructuredIndex ? StructuredQueryableKeysAPI<Record<string, K>, K, V> :
                    typeof KeyType extends typeof UnorderedIndex ? UnorderedQueryableKeysAPI<K[], K, V> :
                    never) :
                KeyQueryAPI)
            &
            (typeof ValueType extends typeof ArrayValued ? ArrayValuedAPI<K, V> :
                typeof ValueType extends typeof SetValued ? SetValuedAPI<K, V> :
                ValueIndexingAPI)
            &
            (typeof ValueQueryability extends typeof QueryableValues ?
                typeof ValueType extends typeof RawValued ? QueryableValuesAPI<K[], K, V> :
                typeof ValueType extends (typeof SetValued | typeof ArrayValued) ? QueryableCollectionValuesAPI<K, V, V[]> :
                {} :
                ValueQueryAPI);
}
