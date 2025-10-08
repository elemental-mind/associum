import { AssociativeMap } from "./associativeMap.ts";
import { AssociationContainer } from "./mixins/base/associationContainer.ts";
import type { KeyIndexingAPI, KeyQueryAPI, MapQueryResult, OrderedQueryableKeysAPI, StructuredQueryableKeysAPI, UnorderedQueryableKeysAPI } from "./mixins/interfaces.ts";
import { OrderedIndex, StructuredIndex, UnorderedIndex } from "./mixins/keys/normalization.ts";
import { NonqueryableKeys, QueryableKeys } from "./mixins/keys/queryability.ts";
import { RawValued } from "./mixins/values/normalization.ts";
import { QueryableValues } from "./mixins/values/queryability.ts";

const SampleComposition = AssociativeMap(UnorderedIndex, QueryableKeys, RawValued, QueryableValues);
const test = new SampleComposition<string, number>();



function TypedReturn<T extends typeof OrderedIndex | typeof UnorderedIndex>(
    param: T
) : T extends typeof OrderedIndex ? string : number
{
    return {} as any;
}

const something = TypedReturn(UnorderedIndex);