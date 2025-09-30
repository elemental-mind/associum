export interface AssociationAPI
{
    toKeylet(value: any, createIfMissing: true): string;
    toKeylet(value: any, createIfMissing?: false): string | undefined;
    fromKeylet(keylet: any): string | undefined;

    bindKeylets(keylets: string[]): void;
    releaseKeylets(keylets: string[]): void;
}

export interface InterceptionAPI
{
    interceptSet(normalizedKey: string[], normalizedValue: string[]): boolean;
    interceptGet(normalizedKey: string[]): any;
    interceptHas(normalizedKey: string[]): boolean;
    interceptDelete(normalizedKey: string[]): boolean;
    interceptClear(): void;
    interceptKeys(): IterableIterator<any>;
    interceptEntries(): IterableIterator<[any, any]>;
    interceptValues(): IterableIterator<any>;
}

export interface KeyNormalizationAPI<K>
{
    encodeSettingKey(key: K): string[];
    encodeRetrievalKey(key: K): string[];
    encodeQueryKey(key: K extends Array<infer S> ? (S | undefined)[] : Partial<K>, keylets: string[], matchIndices: number[]): boolean;

    decodeKey(keylets: string[]): any;
}

export interface ValueNormalizationAPI<V>
{
    normalizeValue(value: V): string[];

    decodeValue(keylets: string[]): any;
}

export interface MapQueryResult<K, V>
{
    key: K;
    value: V;
};

export enum KeyIndexType
{
    None,
    Unordered,
    Ordered,
    Structured,
}

export interface KeyIndexingAPI
{
    readonly keyIndexType: KeyIndexType;
}

export interface KeyQueryAPI
{
    readonly keysQueryable: boolean;
}

export interface OrderedQueryableKeysAPI<TKeys extends TKey[], TKey, TValue> extends UnorderedQueryableKeysAPI<TKeys, TKey, TValue>
{
    queryKeysMatching(keyTemplate: (TKey | undefined)[]): MapQueryResult<TKeys, TValue>[];
}

export interface StructuredQueryableKeysAPI<TKeys extends Record<string, TKey>, TKey, TValue> extends UnorderedQueryableKeysAPI<TKeys, TKey, TValue>
{
    queryKeysMatching(keyTemplate: Partial<TKeys>): MapQueryResult<TKeys, TValue>[];
}

export interface UnorderedQueryableKeysAPI<TKeys, TKey, TValue> extends KeyQueryAPI
{
    queryKeysIndexedWith(keys: TKey[]): MapQueryResult<TKeys, TValue>[];
}

export enum ValueIndexType
{
    None,
    Array,
    Set
}

export interface ValueIndexingAPI
{
    readonly valueIndexType: ValueIndexType;
}

export interface ValueQueryAPI
{
    readonly valuesQueryable: boolean;
}

export interface QueryableValuesAPI<TKeys, TKey, TValue> extends ValueQueryAPI
{
    queryValuesContaining(values: TKey[]): MapQueryResult<TKeys, TValue>;
}

export interface QueryableCollectionValuesAPI<TKeys, TKey, TValue> extends QueryableValuesAPI<TKeys, TKey, TValue>
{
    queryValuesMatching(valueTemplate: (TValue | undefined)[]): MapQueryResult<TKeys, TValue>;
}