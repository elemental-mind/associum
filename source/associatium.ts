import { MultikeyMap } from "./multikeyMap";
import { IndexingStrategy, OrderedIndex, StructuredIndex, UnorderedIndex } from "./mixins/indexing";
import { MultikeyMapQueryResult, NonQueryable, QueryInterface, QueryStrategy, Queryable } from "./mixins/queryability";

export const UnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, NonQueryable) as new <K extends any[], V>() => (Map<K, V> & Pick<IndexingStrategy<any, any>, "keyType"> & QueryStrategy);
export const QueryableUnorderedMultiKeyMap = MultikeyMap(UnorderedIndex, Queryable) as new <K extends any[], V>() => K extends (infer E)[] ? (Map<K, V> & Pick<IndexingStrategy<any, any>, "keyType"> & Omit<QueryInterface<K, never, E, V>, "query">) : never;
export const OrderedMultiKeyMap = MultikeyMap(OrderedIndex, NonQueryable) as new <K extends any[], V>() => (Map<K, V> & Pick<IndexingStrategy<any, any>, "keyType"> & QueryStrategy);
export const QueryableOrderedMultiKeyMap = MultikeyMap(OrderedIndex, Queryable) as new <K extends any[], V>() => K extends (infer E)[] ? (Map<K, V> & Pick<IndexingStrategy<any, any>, "keyType"> & QueryInterface<K, (E | undefined)[], E, V>) : never;
export const StructuredMultiKeyMap = MultikeyMap(StructuredIndex, NonQueryable) as new <K extends Record<string, any>, V>() => (Map<K, V> & Pick<IndexingStrategy<any, any>, "keyType"> & QueryStrategy);
export const QueryableStructuredMultiKeyMap = MultikeyMap(StructuredIndex, Queryable) as new <K extends Record<string, any>, V>() => K extends Record<string, infer E> ? (Map<K, V> & Pick<IndexingStrategy<any, any>, "keyType"> & QueryInterface<K,Partial<Record<keyof K, E>>, E, V>) : never;

export { MultikeyMapQueryResult };