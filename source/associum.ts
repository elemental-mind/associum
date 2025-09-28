import { MultikeyMap } from "./multikeyMap.ts";
import { type KeyIndexingBaseAPI, OrderedIndex, StructuredIndex, UnorderedIndex } from "./mixins/keys/indexing.ts";
import { type MultikeyMapQueryResult, NonQueryableKeys, type OrderedQueryableKeysAPI, type QueryAbleKeysAPI, QueryableKeys, type StructuredQueryableKeysAPI, type UnorderedQueryableKeysAPI } from "./mixins/keys/queryability.ts";

export const UnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, NonQueryableKeys) as new <K extends any[], V>() =>
    (Map<K, V> & KeyIndexingBaseAPI & QueryAbleKeysAPI);
export const OrderedMultiKeyMap = MultikeyMap(OrderedIndex, NonQueryableKeys) as new <K extends any[], V>() =>
    (Map<K, V> & KeyIndexingBaseAPI & QueryAbleKeysAPI);
export const StructuredMultiKeyMap = MultikeyMap(StructuredIndex, NonQueryableKeys) as new <K extends Record<string, any>, V>() =>
    (Map<K, V> & KeyIndexingBaseAPI & QueryAbleKeysAPI);

export const QueryableUnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, QueryableKeys) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & KeyIndexingBaseAPI & UnorderedQueryableKeysAPI<K, E, V>)
    : never;
export const QueryableOrderedMultiKeyMap = MultikeyMap(OrderedIndex, QueryableKeys) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & KeyIndexingBaseAPI & OrderedQueryableKeysAPI<K, E, V>)
    : never;
export const QueryableStructuredMultiKeyMap = MultikeyMap(StructuredIndex, QueryableKeys) as unknown as new <K extends Record<string, any>, V>() =>
    K extends Record<string, infer E>
    ? (Map<K, V> & KeyIndexingBaseAPI & StructuredQueryableKeysAPI<K, E, V>)
    : never;

export type { MultikeyMapQueryResult };