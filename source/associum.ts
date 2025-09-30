import { AssociativeMap } from "./associativeMap.ts";
import type { KeyIndexingAPI, KeyQueryAPI, MapQueryResult, OrderedQueryableKeysAPI, StructuredQueryableKeysAPI, UnorderedQueryableKeysAPI } from "./mixins/interfaces.ts";
import { OrderedIndex, StructuredIndex, UnorderedIndex } from "./mixins/keys/normalization.ts";
import { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";

export type { MapQueryResult };
export const UnorderedMultiKeyMap = AssociativeMap(UnorderedIndex, NonqueryableKeys) as new <K extends any[], V>() =>
    (Map<K, V> & KeyIndexingAPI & KeyQueryAPI);
export const OrderedMultiKeyMap = AssociativeMap(OrderedIndex, NonqueryableKeys) as new <K extends any[], V>() =>
    (Map<K, V> & KeyIndexingAPI & KeyQueryAPI);
export const StructuredMultiKeyMap = AssociativeMap(StructuredIndex, NonqueryableKeys) as new <K extends Record<string, any>, V>() =>
    (Map<K, V> & KeyIndexingAPI & KeyQueryAPI);

export const QueryableUnorderedMultiKeyMap = AssociativeMap(UnorderedIndex, QueryableKeys) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & KeyIndexingAPI & UnorderedQueryableKeysAPI<K, E, V>)
    : never;
export const QueryableOrderedMultiKeyMap = AssociativeMap(OrderedIndex, QueryableKeys) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & KeyIndexingAPI & OrderedQueryableKeysAPI<K, E, V>)
    : never;
export const QueryableStructuredMultiKeyMap = AssociativeMap(StructuredIndex, QueryableKeys) as unknown as new <K extends Record<string, any>, V>() =>
    K extends Record<string, infer E>
    ? (Map<K, V> & KeyIndexingAPI & StructuredQueryableKeysAPI<K, E, V>)
    : never;