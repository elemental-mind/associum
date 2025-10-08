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

export function AssociativeMap<
    KeyMixin extends typeof UnorderedIndex | typeof OrderedIndex | typeof StructuredIndex,
    KeyQueryMixin extends typeof NonqueryableKeys | typeof QueryableKeys,
    ValueMixin extends typeof RawValued | typeof ArrayValued | typeof SetValued,
    ValueQueryMixin extends typeof NonqueryableValues | typeof QueryableValues
>(
    KeyType: KeyMixin,
    KeyQueryability: KeyQueryMixin,
    ValueType: ValueMixin,
    ValueQueryability: ValueQueryMixin
): new <K, V>()
        =>
        Map<K, V>
        &
        KeyIndexingAPI
        &
        (KeyQueryMixin extends typeof QueryableKeys ?
            (KeyMixin extends typeof OrderedIndex ? OrderedQueryableKeysAPI<K[], K, V> :
                KeyMixin extends typeof StructuredIndex ? StructuredQueryableKeysAPI<Record<string, K>, K, V> :
                KeyMixin extends typeof UnorderedIndex ? UnorderedQueryableKeysAPI<K[], K, V> :
                never) :
            KeyQueryAPI)
        &
        (ValueMixin extends typeof ArrayValued ? ArrayValuedAPI<K, V> :
            ValueMixin extends typeof SetValued ? SetValuedAPI<K, V> :
            ValueIndexingAPI)
        &
        (ValueQueryMixin extends typeof QueryableValues ?
            ValueMixin extends typeof RawValued ? QueryableValuesAPI<K[], K, V> :
            ValueMixin extends (typeof SetValued | typeof ArrayValued) ? QueryableCollectionValuesAPI<K, V, V[]> :
            {} :
            ValueQueryAPI)
{
    return class AssociativeMap<K, V> extends (KeyQueryability(KeyType(ValueQueryability(ValueType(AssociationContainer)))) as new () => AssociationContainer)
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
    } as any;
}
