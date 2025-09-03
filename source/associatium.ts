export type MultikeyMapQueryResult<K, V> = { key: K[], value: V; };

export { OrderedMultiKeyMap } from "./maps/strong/ordered";
export { UnorderedMultiKeyMap } from "./maps/strong/unordered";
export { StructuredMultiKeyMap } from "./maps/strong/structured";
export { WeakOrderedMultiKeyMap } from "./maps/weak/ordered";
export { WeakUnorderedMultiKeyMap } from "./maps/weak/unordered";
export { WeakStructuredMultiKeyMap } from "./maps/weak/structured";