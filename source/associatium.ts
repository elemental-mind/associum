import { MultikeyMap } from "./multikeyMap";
import { KeyStrategy, OrderedKeys, StructuredKeys, UnorderedKeys } from "./keyTypes";
import { MultikeyMapQueryResult, NonQueryable, QueryInterface, QueryStrategy, Queryable } from "./queryTypes";

export const UnorderedMultiKeyMap = MultikeyMap(UnorderedKeys, NonQueryable) as new <K extends any[], V>() => (Map<K, V> & Pick<KeyStrategy<any, any>, "keyType"> & QueryStrategy);
export const QueryableUnorderedMultiKeyMap = MultikeyMap(UnorderedKeys, Queryable) as new <K extends any[], V>() => K extends (infer E)[] ? (Map<K, V> & Pick<KeyStrategy<any, any>, "keyType"> & Omit<QueryInterface<K, never, E, V>, "query">) : never;
export const OrderedMultiKeyMap = MultikeyMap(OrderedKeys, NonQueryable) as new <K extends any[], V>() => (Map<K, V> & Pick<KeyStrategy<any, any>, "keyType"> & QueryStrategy);
export const QueryableOrderedMultiKeyMap = MultikeyMap(OrderedKeys, Queryable) as new <K extends any[], V>() => K extends (infer E)[] ? (Map<K, V> & Pick<KeyStrategy<any, any>, "keyType"> & QueryInterface<K, (E | undefined)[], E, V>) : never;
export const StructuredMultiKeyMap = MultikeyMap(StructuredKeys, NonQueryable) as new <K extends Record<string, any>, V>() => (Map<K, V> & Pick<KeyStrategy<any, any>, "keyType"> & QueryStrategy);
export const QueryableStructuredMultiKeyMap = MultikeyMap(StructuredKeys, Queryable) as new <K extends Record<string, any>, V>() => K extends Record<string, infer E> ? (Map<K, V> & Pick<KeyStrategy<any, any>, "keyType"> & QueryInterface<K,Partial<Record<keyof K, E>>, E, V>) : never;

export { MultikeyMapQueryResult };