import { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";
import { RawValued, ArrayValued, SetValued } from "./mixins/values/normalization.ts";
import { NonqueryableValues, QueryableValues } from "./mixins/values/queryability.ts";
import { RawIndex, UnorderedIndex, OrderedIndex, StructuredIndex } from "./mixins/keys/normalization.ts";
import type { ArrayValuedAPI, KeyQueryAPI, OrderedQueryableKeysAPI, QueryableCollectionValuesAPI, QueryableValuesAPI, SetValuedAPI, StructuredQueryableKeysAPI, UnorderedQueryableKeysAPI, ValueIndexingAPI, ValueQueryAPI } from "./mixins/interfaces.ts";
import { AssociationContainer } from "./mixins/base/associationContainer.ts";

type KeyStructureType = typeof RawIndex | typeof UnorderedIndex | typeof OrderedIndex | typeof StructuredIndex;
type KeyQueryStrategy = typeof NonqueryableKeys | typeof QueryableKeys;
type ValueStructureType = typeof RawValued | typeof ArrayValued | typeof SetValued;
type ValueQueryStrategy = typeof NonqueryableValues | typeof QueryableValues;

type KeyConstraint<KeyIndex extends KeyStructureType> =
    KeyIndex extends typeof RawIndex ? any :
    KeyIndex extends typeof UnorderedIndex ? any[] :
    KeyIndex extends typeof OrderedIndex ? any[] :
    KeyIndex extends typeof StructuredIndex ? Record<string, any>:
    never;

type KeyQueryExtensions<
    QueryStrategy extends KeyQueryStrategy,
    IndexStrategy extends KeyStructureType,
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

type ValueConstraint<ValueStructure extends ValueStructureType> =
    ValueStructure extends typeof RawValued ? any :
    ValueStructure extends typeof ArrayValued ? any[] :
    ValueStructure extends typeof SetValued ? Set<any> :
    never;

type ValueStructureExtensions<S extends ValueStructureType, K, V> =
    S extends typeof RawValued ? ValueIndexingAPI :
    S extends typeof ArrayValued ? ArrayValuedAPI<K, InnerValueType<S, V>> :
    S extends typeof SetValued ? SetValuedAPI<K, InnerValueType<S, V>> :
    never;

type ValueQueryExtensions<
    QueryStrategy extends ValueQueryStrategy,
    Structure extends ValueStructureType,
    K,
    V
> =
    QueryStrategy extends typeof NonqueryableValues ? ValueQueryAPI :
    QueryStrategy extends typeof QueryableValues ?
    (Structure extends typeof RawValued ? QueryableValuesAPI<K, V, V> :
        Structure extends (typeof SetValued | typeof ArrayValued) ? QueryableCollectionValuesAPI<K, V, InnerValueType<Structure, V>> :
        ValueQueryAPI) :
    never;

type InnerValueType<ValueStructure extends ValueStructureType, V> =
    ValueStructure extends typeof RawValued ? V :
    ValueStructure extends typeof ArrayValued ? (V extends (infer U)[] ? U : never) :
    ValueStructure extends typeof SetValued ? (V extends Set<infer U> ? U : never) :
    never;

type MapConstructorFor<
    KeyType extends KeyStructureType,
    KeyQuery extends KeyQueryStrategy,
    ValueType extends ValueStructureType,
    ValueQuery extends ValueQueryStrategy
> = new <
    K extends KeyConstraint<KeyType>,
    V extends ValueConstraint<ValueType>
>() => Map<K, V> & KeyQueryExtensions<KeyQuery, KeyType, K, V> & ValueStructureExtensions<ValueType, K, V> & ValueQueryExtensions<ValueQuery, ValueType, K, V>;

export function AssociativeMap<
    KeyType extends KeyStructureType,
    KeyQuery extends KeyQueryStrategy,
    ValueStructure extends ValueStructureType,
    ValueQuery extends ValueQueryStrategy
>(
    keyType: KeyType,
    keyQueryability: KeyQuery,
    valueType: ValueStructure,
    valueQueryability: ValueQuery
): MapConstructorFor<KeyType, KeyQuery, ValueStructure, ValueQuery>
{
    const BaseClass = keyQueryability(keyType(valueQueryability(valueType(AssociationContainer)))) as new () => AssociationContainer;
    
    return class AssociativeMap<K extends KeyConstraint<KeyType>, V extends ValueConstraint<ValueStructure>> extends BaseClass
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
    } as any as MapConstructorFor<KeyType, KeyQuery, ValueStructure, ValueQuery>;
}
