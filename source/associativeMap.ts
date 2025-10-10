import { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";
import { RawValued, ArrayValued, SetValued } from "./mixins/values/normalization.ts";
import { NonqueryableValues, QueryableValues } from "./mixins/values/queryability.ts";
import { RawIndex, UnorderedIndex, OrderedIndex, StructuredIndex } from "./mixins/keys/normalization.ts";
import type { ArrayValuedAPI, KeyIndexType, KeyQueryAPI, OrderedQueryableKeysAPI, QueryableCollectionValuesAPI, QueryableValuesAPI, SetValuedAPI, StructuredQueryableKeysAPI, UnorderedQueryableKeysAPI, ValueIndexingAPI, ValueQueryAPI } from "./mixins/interfaces.ts";
import { AssociationContainer } from "./mixins/base/associationContainer.ts";

type KeyIndexStrategy =
    | typeof RawIndex
    | typeof UnorderedIndex
    | typeof OrderedIndex
    | typeof StructuredIndex;

type KeyQueryStrategy = typeof NonqueryableKeys | typeof QueryableKeys;
type ValueStructureType = typeof RawValued | typeof ArrayValued | typeof SetValued;
type ValueQueryStrategy = typeof NonqueryableValues | typeof QueryableValues;

type KeyConstraint<KeyIndex extends KeyIndexStrategy> =
    KeyIndex extends typeof RawIndex ? any :
    KeyIndex extends typeof UnorderedIndex ? any[] :
    KeyIndex extends typeof OrderedIndex ? any[] :
    KeyIndex extends typeof StructuredIndex ? Record<string, any> :
    never;

type ValueConstraint<ValueStructure extends ValueStructureType> =
    ValueStructure extends typeof RawValued ? any :
    ValueStructure extends typeof ArrayValued ? any[] :
    ValueStructure extends typeof SetValued ? Set<any> :
    never;

type InnerValueType<ValueStructure extends ValueStructureType, V> =
    ValueStructure extends typeof RawValued ? V :
    ValueStructure extends typeof ArrayValued ? (V extends (infer U)[] ? U : never) :
    ValueStructure extends typeof SetValued ? (V extends Set<infer U> ? U : never) :
    never;

type StoredValueType<ValueStructure extends ValueStructureType, V> = V;

type KeyIndexAPI<Strategy extends KeyIndexStrategy> = {
    readonly keyIndexType:
    Strategy extends typeof RawIndex ? KeyIndexType.None :
    Strategy extends typeof UnorderedIndex ? KeyIndexType.Unordered :
    Strategy extends typeof OrderedIndex ? KeyIndexType.Ordered :
    Strategy extends typeof StructuredIndex ? KeyIndexType.Structured :
    never;
};

type KeyQueryAPI_<
    QueryStrategy extends KeyQueryStrategy,
    IndexStrategy extends KeyIndexStrategy,
    K,
    V
> =
    QueryStrategy extends typeof NonqueryableKeys ? KeyQueryAPI :
    QueryStrategy extends typeof QueryableKeys ?
    (IndexStrategy extends typeof OrderedIndex ? OrderedQueryableKeysAPI<K, K extends any[] ? K[number] : never, V> :
        IndexStrategy extends typeof StructuredIndex ? StructuredQueryableKeysAPI<K, K extends Record<string, any> ? K[keyof K] : never, V> :
        IndexStrategy extends typeof UnorderedIndex ? UnorderedQueryableKeysAPI<K, K extends any[] ? K[number] : never, V> :
        KeyQueryAPI) :
    never;

type ValueStructureAPI<S extends ValueStructureType, K, V> =
    S extends typeof RawValued ? ValueIndexingAPI :
    S extends typeof ArrayValued ? ArrayValuedAPI<K, InnerValueType<S, V>> :
    S extends typeof SetValued ? SetValuedAPI<K, InnerValueType<S, V>> :
    never;

type ValueQueryAPI_<
    QueryStrategy extends ValueQueryStrategy,
    Structure extends ValueStructureType,
    K,
    V
> =
    QueryStrategy extends typeof NonqueryableValues ? ValueQueryAPI :
    QueryStrategy extends typeof QueryableValues ?
    (Structure extends typeof RawValued ? QueryableValuesAPI<K, K extends any[] ? K[number] : K, V> :
        Structure extends (typeof SetValued | typeof ArrayValued) ? QueryableCollectionValuesAPI<K, InnerValueType<Structure, V>, InnerValueType<Structure, V>[]> :
        ValueQueryAPI) :
    never;

type AssociativeAPI<
    KeyIndex extends KeyIndexStrategy,
    KeyQuery extends KeyQueryStrategy,
    ValueStructure extends ValueStructureType,
    ValueQuery extends ValueQueryStrategy,
    K,
    V
> =
    Map<K, StoredValueType<ValueStructure, V>>
    & KeyIndexAPI<KeyIndex>
    & KeyQueryAPI_<KeyQuery, KeyIndex, K, StoredValueType<ValueStructure, V>>
    & ValueStructureAPI<ValueStructure, K, V>
    & ValueQueryAPI_<ValueQuery, ValueStructure, K, V>;

type ConstructorFor<
    KeyIndex extends KeyIndexStrategy,
    KeyQuery extends KeyQueryStrategy,
    ValueStructure extends ValueStructureType,
    ValueQuery extends ValueQueryStrategy
> = new <
    K extends KeyConstraint<KeyIndex>,
    V extends ValueConstraint<ValueStructure>
>() => AssociativeAPI<KeyIndex, KeyQuery, ValueStructure, ValueQuery, K, V>;

export function AssociativeMap<
    KeyIndex extends KeyIndexStrategy,
    KeyQuery extends KeyQueryStrategy,
    ValueStructure extends ValueStructureType,
    ValueQuery extends ValueQueryStrategy
>(
    keyType: KeyIndex,
    keyQueryability: KeyQuery,
    valueType: ValueStructure,
    valueQueryability: ValueQuery
): ConstructorFor<KeyIndex, KeyQuery, ValueStructure, ValueQuery>
{
    return class AssociativeMap<K, V> extends (keyQueryability(keyType(valueQueryability(valueType(AssociationContainer)))) as new () => AssociationContainer)
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
