export interface AssociationAPI
{
    _toKeylet(value: any, createIfMissing: true): string;
    _toKeylet(value: any, createIfMissing?: false): string | undefined;
    _fromKeylet(keylet: any): string | undefined;

    _bindKeylets(keylets: string[]): void;
    _releaseKeylets(keylets: string[]): void;
}

export interface InterceptionAPI
{
    _interceptSet(normalizedKey: string[], normalizedValue: string[]): boolean;
    _interceptGet(normalizedKey: string[]): any;
    _interceptHas(normalizedKey: string[]): boolean;
    _interceptDelete(normalizedKey: string[]): boolean;
    _interceptClear(): void;
    _interceptKeys(): IterableIterator<any>;
    _interceptEntries(): IterableIterator<[any, any]>;
    _interceptValues(): IterableIterator<any>;
}

export interface KeyNormalizationAPI
{
    _encodeSettingKey(key: any): string[];
    _encodeRetrievalKey(key: any): string[];
    _encodeQueryKey(key: any extends Array<infer S> ? (S | undefined)[] : Partial<any>, keylets: string[], matchIndices: number[]): boolean;
    _decodeKey(keylets: string[]): any;
}

export interface ValueNormalizationAPI
{
    _encodeValue(value: any): string[];
    _decodeValue(keylets: string[]): any;
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

export interface ArrayValuedAPI<K, V> extends ValueIndexingAPI
{
    push(key: K, ...items: V[]): number;
    unshift(key: K, ...items: V[]): number;
    pop(key: K): V | undefined;
    shift(key: K): V | undefined;
    splice(key: K, start: number, deleteCount?: number, ...addedItems: V[]): V[];
    purge(key: K, item: V, occurence: "First" | "Last" | "All"): boolean;
    length(key: K): number | undefined;
}

export interface SetValuedAPI<K, V> extends ValueIndexingAPI
{
    fillSet(key: K, items: V[]): void;
    addToSet(key: K, item: V): boolean;
    deleteFromSet(key: K, item: V): boolean;
    hasInSet(key: K, item: V): boolean;
    clearSet(key: K): void;
    sizeOfSet(key: K): number | undefined;
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