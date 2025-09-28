import { MultikeyMap } from "./multikeyMap.ts";
import { type IndexingBaseAPI, OrderedIndex, StructuredIndex, UnorderedIndex } from "./mixins/indexing.ts";
import { type MultikeyMapQueryResult, NonQueryable, type OrderedQueryableAPI, type QueryAPI, Queryable, type StructuredQueryableAPI, type UnorderedQueryableAPI } from "./mixins/queryability.ts";

export const UnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, NonQueryable) as new <K extends any[], V>() =>
    (Map<K, V> & IndexingBaseAPI & QueryAPI);
export const OrderedMultiKeyMap = MultikeyMap(OrderedIndex, NonQueryable) as new <K extends any[], V>() =>
    (Map<K, V> & IndexingBaseAPI & QueryAPI);
export const StructuredMultiKeyMap = MultikeyMap(StructuredIndex, NonQueryable) as new <K extends Record<string, any>, V>() =>
    (Map<K, V> & IndexingBaseAPI & QueryAPI);

export const QueryableUnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, Queryable) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & IndexingBaseAPI & UnorderedQueryableAPI<K, E, V>)
    : never;
export const QueryableOrderedMultiKeyMap = MultikeyMap(OrderedIndex, Queryable) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & IndexingBaseAPI & OrderedQueryableAPI<K, E, V>)
    : never;
export const QueryableStructuredMultiKeyMap = MultikeyMap(StructuredIndex, Queryable) as unknown as new <K extends Record<string, any>, V>() =>
    K extends Record<string, infer E>
    ? (Map<K, V> & IndexingBaseAPI & StructuredQueryableAPI<K, E, V>)
    : never;

export type { MultikeyMapQueryResult };