import { MultikeyMap } from "./multikeyMap";
import { OrderedKeys, StructuredKeys, UnorderedKeys } from "./keyTypes";
import { MultikeyMapQueryResult, NonQueryable, Queryable } from "./queryTypes";

export const UnorderedMultiKeyMap = MultikeyMap(UnorderedKeys, NonQueryable);
export const QueryableUnorderedMultiKeyMap = MultikeyMap(UnorderedKeys, Queryable);
export const OrderedMultiKeyMap = MultikeyMap(OrderedKeys, NonQueryable);
export const QueryableOrderedMultiKeyMap = MultikeyMap(OrderedKeys, Queryable);
export const StructuredMultiKeyMap = MultikeyMap(StructuredKeys, NonQueryable);
export const QueryableStructuredMultiKeyMap = MultikeyMap(StructuredKeys, Queryable);

export { MultikeyMapQueryResult };