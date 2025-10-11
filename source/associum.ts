import { AssociativeMap } from "./associativeMap.ts";
import { OrderedKeysArray, RawKeys, StructuredKeys, UnorderedKeysArray } from "./mixins/keys/normalization.ts";
import { NonqueryableKeys } from "./mixins/keys/queryability.ts";
import { ArrayValued, RawValues, SetValued } from "./mixins/values/normalization.ts";
import { NonqueryableValues, QueryableValues } from "./mixins/values/queryability.ts";

export { OrderedKeysArray, RawKeys, StructuredKeys, UnorderedKeysArray } from "./mixins/keys/normalization.ts";
export { ArrayValued, RawValues, SetValued } from "./mixins/values/normalization.ts";
export { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";
export { NonqueryableValues, QueryableValues } from "./mixins/values/queryability.ts";
export { AssociativeMap } from "./associativeMap.ts";
export type { MapQueryResult } from "./mixins/interfaces.ts";


//Some common use cases

export const ValueIndexedMap = AssociativeMap(RawKeys, NonqueryableKeys, RawValues, QueryableValues);

export const MapOfArrays = AssociativeMap(RawKeys, NonqueryableKeys, ArrayValued, NonqueryableValues);
export const MapOfSets = AssociativeMap(RawKeys, NonqueryableKeys, SetValued, NonqueryableValues);

export const OrderedMultiKeyMap = AssociativeMap(OrderedKeysArray, NonqueryableKeys, RawValues, NonqueryableValues);
export const UnorderedMultiKeyMap = AssociativeMap(UnorderedKeysArray, NonqueryableKeys, RawValues, NonqueryableValues);
export const StructuredMultiKeyMap = AssociativeMap(StructuredKeys, NonqueryableKeys, RawValues, NonqueryableValues);
