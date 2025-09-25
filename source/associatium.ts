import { MultikeyMap } from "./multikeyMap";
import { IndexingStrategy, OrderedIndex, StructuredIndex, UnorderedIndex } from "./mixins/indexing";
import { MultikeyMapQueryResult, NonQueryable, OrderedQueryableStrategy, QueryStrategy, Queryable, StructuredQueryableStrategy, UnorderedQueryableStrategy } from "./mixins/queryability";

export const UnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, NonQueryable) as new <K extends any[], V>() =>
    (Map<K, V> & IndexingStrategy<K, V> & QueryStrategy);
export const OrderedMultiKeyMap = MultikeyMap(OrderedIndex, NonQueryable) as new <K extends any[], V>() =>
    (Map<K, V> & IndexingStrategy<K, V> & QueryStrategy);
export const StructuredMultiKeyMap = MultikeyMap(StructuredIndex, NonQueryable) as new <K extends Record<string, any>, V>() =>
    (Map<K, V> & IndexingStrategy<K, V> & QueryStrategy);

export const QueryableUnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, Queryable) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & IndexingStrategy<K, V> & UnorderedQueryableStrategy<K, E, V>)
    : never;
export const QueryableOrderedMultiKeyMap = MultikeyMap(OrderedIndex, Queryable) as unknown as new <K extends any[], V>() =>
    K extends (infer E)[]
    ? (Map<K, V> & IndexingStrategy<K, V> & OrderedQueryableStrategy<K, E, V>)
    : never;
export const QueryableStructuredMultiKeyMap = MultikeyMap(StructuredIndex, Queryable) as unknown as new <K extends Record<string, any>, V>() =>
    K extends Record<string, infer E>
    ? (Map<K, V> & IndexingStrategy<K, V> & StructuredQueryableStrategy<K, E, V>)
    : never;

export { MultikeyMapQueryResult };