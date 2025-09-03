export type MultikeyMapQueryResult<K, V> = { key: K[], value: V; };

export { OrderedMultiKeyMap, UnorderedMultiKeyMap, StructuredMultiKeyMap } from "./strongMaps";
export { WeakOrderedMultiKeyMap, WeakUnorderedMultiKeyMap, WeakStructuredMultiKeyMap } from "./weakMaps";