import { AssociativeMap } from './associativeMap.ts';
import { RawIndex, UnorderedIndex, OrderedIndex, StructuredIndex } from './mixins/keys/normalization.ts';
import { NonqueryableKeys, QueryableKeys } from './mixins/keys/queryability.ts';
import { RawValued, ArrayValued, SetValued } from './mixins/values/normalization.ts';
import { NonqueryableValues, QueryableValues } from './mixins/values/queryability.ts';
import type { MapQueryResult } from './mixins/interfaces.ts';

export class KeyTypeConstraintsTests
{
    rawIndexAllowsAnyKey()
    {
        const RawMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        // Valid: any key type
        const map1: InstanceType<typeof RawMapCtor> = new RawMapCtor<string, number>();
        const map2: InstanceType<typeof RawMapCtor> = new RawMapCtor<string[], number>();
        const map3: InstanceType<typeof RawMapCtor> = new RawMapCtor<{ a: string; }, number>();
    }

    unorderedIndexRequiresArrayKey()
    {
        const UnorderedMapCtor = AssociativeMap(UnorderedIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        new UnorderedMapCtor<string[], number>();
        //@ts-expect-error
        new UnorderedMapCtor<string, number>();
    }

    orderedIndexRequiresArrayKey()
    {
        const OrderedMapCtor = AssociativeMap(OrderedIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        new OrderedMapCtor<string[], number>();
        //@ts-expect-error
        new OrderedMapCtor<string, number>();
    }

    structuredIndexRequiresObjectKey()
    {
        const StructuredMapCtor = AssociativeMap(StructuredIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        new StructuredMapCtor<{ a: string; }, number>();
        //@ts-expect-error
        new StructuredMapCtor<string, number>();
    }
}

export class ValueTypeConstraintsTests
{
    rawValuedAllowsAnyValue()
    {
        const RawMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        new RawMapCtor<string, number>();
        new RawMapCtor<string, string[]>();
        new RawMapCtor<string, Set<string>>();
    }

    arrayValuedRequiresArrayValue()
    {
        const ArrayMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, ArrayValued, NonqueryableValues);
        // Valid
        new ArrayMapCtor<string, string[]>();
        //@ts-expect-error
        new ArrayMapCtor<string, string>();
        //@ts-expect-error
        new ArrayMapCtor<string, Set<string>>();
    }

    setValuedRequiresSetValue()
    {
        const SetMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, SetValued, NonqueryableValues);
        // Valid
        new SetMapCtor<string, Set<string>>();
        // Invalid
        //@ts-expect-error
        new SetMapCtor<string, string>();
        //@ts-expect-error
        new SetMapCtor<string, string[]>();
    }
}

export class KeyQueryFunctionTypingTests
{
    nonQueryableKeysNoQueryMethods()
    {
        const NonQueryMapCtor = AssociativeMap(UnorderedIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        const map = new NonQueryMapCtor<string[], number>();
        // No query methods available
        //@ts-expect-error
        map.queryKeysIndexedWith(['a']);
        //@ts-expect-error
        map.queryKeysMatching(['a']);
    }

    queryableUnorderedKeysHasIndexedQuery()
    {
        const QueryUnorderedMapCtor = AssociativeMap(UnorderedIndex, QueryableKeys, RawValued, NonqueryableValues);
        const map = new QueryUnorderedMapCtor<string[], number>();
        // Available
        const results: MapQueryResult<string[], number> = map.queryKeysIndexedWith(['key']);
        //@ts-expect-error
        map.queryKeysMatching(['key']);
    }

    queryableOrderedKeysHasPartialAndMatchingQuery()
    {
        const QueryOrderedMapCtor = AssociativeMap(OrderedIndex, QueryableKeys, RawValued, NonqueryableValues);
        const map = new QueryOrderedMapCtor<string[], number>();
        // Available: unordered + ordered
        const results1: MapQueryResult<string[], number> = map.queryKeysIndexedWith(['key']);
        const results2: MapQueryResult<string[], number> = map.queryKeysMatching(['key', undefined]);
        //@ts-expect-error
        map.queryKeysMatching({ a: 'key' });
    }

    queryableStructuredKeysHasPartialAndMatchingQuery()
    {
        const QueryStructuredMapCtor = AssociativeMap(StructuredIndex, QueryableKeys, RawValued, NonqueryableValues);
        const map = new QueryStructuredMapCtor<{ a: string; }, number>();
        // Available: unordered + structured
        const results1: MapQueryResult<{ a: string; }, number> = map.queryKeysIndexedWith(['key']);
        const results2: MapQueryResult<{ a: string; }, number> = map.queryKeysMatching({ a: 'key' });
        //@ts-expect-error
        map.queryKeysMatching(['key', undefined]);
    }
}

export class ValueQueryFunctionTypingTests
{
    nonQueryableValuesNoQueryMethods()
    {
        const NonQueryValueMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        const map = new NonQueryValueMapCtor<string, number>();
        // No value query methods
        //@ts-expect-error
        map.queryValuesContaining([42]);
        //@ts-expect-error
        map.queryValuesMatching([42]);
    }

    queryableRawValuesHasContainingQuery()
    {
        const QueryRawValueMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, RawValued, QueryableValues);
        const map = new QueryRawValueMapCtor<string, number>();
        // Available for raw: containing (exact match since single)
        const results: MapQueryResult<string, number> = map.queryValuesContaining([42]);
        //@ts-expect-error
        map.queryValuesMatching([42]);
    }

    queryableArrayValuesHasMatchingQuery()
    {
        const QueryArrayValueMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, ArrayValued, QueryableValues);
        const map = new QueryArrayValueMapCtor<string, string[]>();
        // Available: containing + matching
        const results1: MapQueryResult<string, string[]> = map.queryValuesContaining(['val1']);
        const results2: MapQueryResult<string, string[]> = map.queryValuesMatching(['val1', undefined]);
    }

    queryableSetValuesHasMatchingQuery()
    {
        const QuerySetValueMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, SetValued, QueryableValues);
        const map = new QuerySetValueMapCtor<string, Set<string>>();
        // Available: containing + matching (though set order irrelevant)
        const results1: MapQueryResult<string, Set<string>> = map.queryValuesContaining(['val1']);
        const results2: MapQueryResult<string, Set<string>> = map.queryValuesMatching(['val1']);
    }
}

export class ValueStructureFunctionTypingTests
{
    rawValuedNoCollectionMethods()
    {
        const RawValueMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, RawValued, NonqueryableValues);
        const map = new RawValueMapCtor<string, number>();
        // No array/set methods
        //@ts-expect-error
        map.push('key', 1);
        //@ts-expect-error
        map.addToSet('key', 1);
    }

    arrayValuedHasArrayMethods()
    {
        const ArrayValueMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, ArrayValued, NonqueryableValues);
        const map = new ArrayValueMapCtor<string, string[]>();
        // Available array methods, return number (length)
        const pushLen: number = map.push('key', 'new');
        const popItem: string | undefined = map.pop('key');
        const spliceRes: string[] = map.splice('key', 0, 1, 'replaced');
        const length: number | undefined = map.length('key');
        // No set methods
        //@ts-expect-error
        map.addToSet('key', 'item');
    }

    setValuedHasSetMethods()
    {
        const SetValueMapCtor = AssociativeMap(RawIndex, NonqueryableKeys, SetValued, NonqueryableValues);
        type SetMap = InstanceType<typeof SetValueMapCtor<string, Set<string>>>;
        const map = new SetValueMapCtor<string, Set<string>>();
        // Available set methods
        const added: boolean = map.addToSet('key', 'new');
        const has: boolean = map.hasInSet('key', 'new');
        const deleted: boolean = map.deleteFromSet('key', 'new');
        const size: number | undefined = map.sizeOfSet('key');
        // No array methods
        //@ts-expect-error
        map.push('key', 'item');
    }
}