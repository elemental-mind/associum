# Associum

Associum provides multi-key maps built on top of `Map` with full TypeScript support.

A vanilla map just compares its keys by reference, and does not reason about the structure of the given key. Associum's multi-key-maps solve this problem without falling back to serializing the whole key object, which would be memory-inefficient and make queries hard.

If you ever wanted to associate `["plant", "edible", "leafy"] => "spinach"` or `{concept: "mobility", subconcept: "car", data: "manufacturers"} => ["Mercedes", "BMW", "Toyota", "GM", "Ford"]` this library provides the tools to make these associations and query them.

## Main Features

- **Multiple Indexing Options**: Support for unordered arrays, ordered arrays, or records (string-value pairs) as composite keys.
- **Queryability**: Optional mixin enabling partial key queries for flexible lookups (adds ~1KB to bundle size).
- **Map Compatibility**: Extends the built-in `Map`, preserving standard methods while enhancing key interpretation.
- **Memory Efficient**: Uses unique keylet IDs for subkeys with per-instance management and reference-counted garbage collection, achieving memory usage comparable to a vanilla `Map`.
- **Lightweight**: Tree-shakeable; base unordered variant ~200 bytes minified + gzipped (varies with build).
- **Type Safe**: Comprehensive TypeScript generics for keys and values.
- **Universal**: Compatible with browsers, Node.js, Deno, and other JS environments.
- **Instance Isolated**: Self-contained keylet registry per map prevents interference across instances.
- **Key Safety**: All indexing rejects `undefined` keys to ensure valid composites.

## Installation & Use

Install via npm:

```bash
npm install associum
```

Import and use like a standard `Map`, selecting the appropriate type:

```typescript
import { UnorderedMultiKeyMap } from 'associum';

const multiKeyMap = new UnorderedMultiKeyMap<string[], any>();

multiKeyMap.set(["a", "c", "b"], 123);

if (multiKeyMap.has(["a", "b", "c"]))
  console.log(multiKeyMap.get(["b", "a", "c"])); // 123
```

## Concepts

### Keys

Associum supports three key types:

#### Unordered Keys
Unordered keys are arrays where the order of elements doesn't matter. When you set a value with `["A", "B"]`, you can retrieve it with either `["A", "B"]` or `["B", "A"]`. This is useful when the combination of values is important, but not their sequence.

```typescript
const map = new UnorderedMultiKeyMap<string[], number>();
map.set(["plant", "edible", "leafy"], 1);
console.log(map.get(["leafy", "plant", "edible"])); // 1
```

#### Ordered Keys
Ordered keys are arrays where the order of elements matters. When you set a value with `["A", "B"]`, you can only retrieve it with the exact same order `["A", "B"]`. This is useful when sequence is important.

```typescript
const map = new OrderedMultiKeyMap<string[], number>();
map.set(["concept", "mobility", "car"], 1);
console.log(map.get(["concept", "mobility", "car"])); // 1
console.log(map.get(["mobility", "concept", "car"])); // undefined
```

#### Structured Keys
Structured keys are objects where the first level of properties acts as the key. This provides a more semantic way to define keys with named properties.

```typescript
const map = new StructuredMultiKeyMap<{concept: string, subconcept: string, data: string}, string[]>();
map.set({concept: "mobility", subconcept: "car", data: "manufacturers"}, ["Mercedes", "BMW", "Toyota"]);
console.log(map.get({concept: "mobility", subconcept: "car", data: "manufacturers"})); // ["Mercedes", "BMW", "Toyota"]
```

**Note**: `undefined` values are not allowed for setting any type of key; attempts to set such keys throw an error.

### Querying

Associum provides optional queryability that allows you to retrieve entries based on partial key matches. This feature is available through queryable variants of each map type.

#### Querying Unordered Keys
With queryable unordered maps, you can find entries that contain specific key values regardless of their position in the array.

```typescript
const map = new QueryableUnorderedMultiKeyMap<string[], number>();
map.set(["plant", "edible", "leafy"], 1);
map.set(["plant", "edible", "root"], 2);
map.set(["animal", "mammal", "domestic"], 3);

// Find entries with "plant" and "edible"
const results = map.queryIndexedWith(["plant", "edible"]);
// [{ key: ["plant", "edible", "leafy"], value: 1 }, { key: ["plant", "edible", "root"], value: 2 }]
```

**Note**: Unordered maps do not support positional `query`; use `queryIndexedWith` for subset matches.

#### Ordered Querying
Match specific positions with wildcards (`undefined`). Use `query`.

```typescript
const map = new QueryableOrderedMultiKeyMap<string[], number>();
map.set(["concept", "mobility", "car"], 1);
map.set(["concept", "housing", "apartment"], 2);
map.set(["concept", "mobility", "bike"], 3);

// Match position 0="concept", 1="mobility"
const results = map.query(["concept", "mobility", undefined]);
// [{ key: ["concept", "mobility", "car"], value: 1 }, { key: ["concept", "mobility", "bike"], value: 3 }]
```

Supports prefix/suffix matching via wildcards.

#### Querying Structured Keys
With queryable structured maps, you can find entries that match specific property values, omitting properties you don't care about.

```typescript
const map = new QueryableStructuredMultiKeyMap<{user: string, role: string, department: string}, number>();
map.set({user: "u1", role: "admin", department: "IT"}, 1);
map.set({user: "u1", role: "editor", department: "Marketing"}, 2);
map.set({user: "u2", role: "admin", department: "IT"}, 3);

// Find all entries where user is "u1"
const results = map.query({user: "u1"});
// [{ key: {user: "u1", role: "admin", department: "IT"}, value: 1 }, { key: {user: "u1", role: "editor", department: "Marketing"}, value: 2 }]
```

Field order is fixed per instance based on first usage.

## Examples

### Basic Usage

#### UnorderedMultiKeyMap
```typescript
import { UnorderedMultiKeyMap } from 'associum';

// Create a map where key order doesn't matter
const plantMap = new UnorderedMultiKeyMap<string[], string>();

// Set values
plantMap.set(["plant", "edible", "leafy"], "spinach");
plantMap.set(["plant", "edible", "root"], "carrot");
plantMap.set(["plant", "inedible", "decorative"], "poison ivy");

// Get values - order doesn't matter
console.log(plantMap.get(["edible", "plant", "leafy"])); // "spinach"
console.log(plantMap.get(["plant", "root", "edible"])); // "carrot"

// Check existence
console.log(plantMap.has(["decorative", "plant", "inedible"])); // true

// Delete
plantMap.delete(["plant", "inedible", "decorative"]);
console.log(plantMap.has(["plant", "inedible", "decorative"])); // false
```

#### OrderedMultiKeyMap
```typescript
import { OrderedMultiKeyMap } from 'associum';

// Create a map where key order matters
const conceptMap = new OrderedMultiKeyMap<string[], string[]>();

// Set values
conceptMap.set(["concept", "mobility", "car", "manufacturers"], ["Mercedes", "BMW", "Toyota", "GM", "Ford"]);
conceptMap.set(["concept", "mobility", "bike", "manufacturers"], ["Giant", "Trek", "Specialized"]);
conceptMap.set(["concept", "housing", "apartment", "types"], ["studio", "1BR", "2BR", "penthouse"]);

// Get values - order matters
console.log(conceptMap.get(["concept", "mobility", "car", "manufacturers"])); // ["Mercedes", "BMW", "Toyota", "GM", "Ford"]
console.log(conceptMap.get(["mobility", "concept", "car", "manufacturers"])); // undefined

// Check existence
console.log(conceptMap.has(["concept", "housing", "apartment", "types"])); // true
```

#### StructuredMultiKeyMap
```typescript
import { StructuredMultiKeyMap } from 'associum';

// Create a map with object keys
const userMap = new StructuredMultiKeyMap<{user: string, role: string, department: string}, number>();

// Set values
userMap.set({user: "u1", role: "admin", department: "IT"}, 1);
userMap.set({user: "u1", role: "editor", department: "Marketing"}, 2);
userMap.set({user: "u2", role: "admin", department: "IT"}, 3);

// Get values
console.log(userMap.get({user: "u1", role: "admin", department: "IT"})); // 1
console.log(userMap.get({user: "u1", role: "admin"})); // undefined (requires full key)

// Check existence
console.log(userMap.has({user: "u2", role: "admin", department: "IT"})); // true
```

### Advanced Usage with Querying

#### QueryableUnorderedMultiKeyMap
```typescript
import { QueryableUnorderedMultiKeyMap } from 'associum';

const tagMap = new QueryableUnorderedMultiKeyMap<string[], string>();

tagMap.set(["frontend", "react", "javascript"], "React");
tagMap.set(["frontend", "vue", "javascript"], "Vue");
tagMap.set(["frontend", "angular", "typescript"], "Angular");
tagMap.set(["backend", "node", "javascript"], "Node.js");
tagMap.set(["backend", "django", "python"], "Django");

// Query for frontend JavaScript frameworks
const jsFrameworks = tagMap.queryIndexedWith(["frontend", "javascript"]);
// [{ key: ["frontend", "react", "javascript"], value: "React" }, { key: ["frontend", "vue", "javascript"], value: "Vue" }]

// All frontend tech
const frontendTech = tagMap.queryIndexedWith(["frontend"]);
// Includes React, Vue, Angular
```

#### QueryableOrderedMultiKeyMap
```typescript
import { QueryableOrderedMultiKeyMap } from 'associum';

const pathMap = new QueryableOrderedMultiKeyMap<string[], string>();

pathMap.set(["api", "v1", "users", "GET"], "Get all users");
pathMap.set(["api", "v1", "users", "POST"], "Create user");
pathMap.set(["api", "v1", "users", ":id", "GET"], "Get user by ID");
pathMap.set(["api", "v1", "posts", "GET"], "Get all posts");
pathMap.set(["api", "v1", "posts", "POST"], "Create post");

// All user endpoints (prefix match)
const userEndpoints = pathMap.query(["api", "v1", "users"]);
// [{ key: ["api", "v1", "users", "GET"], value: "Get all users" }, ... , { key: ["api", "v1", "users", ":id", "GET"], value: "Get user by ID" }]

// All GET endpoints under v1 (positions 0,1,3)
const getEndpoints = pathMap.query(["api", "v1", undefined, "GET"]);
// Matches ["api", "v1", "users", "GET"], ["api", "v1", "posts", "GET"] (note: :id example requires adjustment for length)
```

**Note**: For variable-length keys, wildcards work on specified positions; shorter keys may not match trailing wildcards.

#### QueryableStructuredMultiKeyMap
```typescript
import { QueryableStructuredMultiKeyMap } from 'associum';

const productMap = new QueryableStructuredMultiKeyMap<{
    category: string,
    subcategory: string,
    brand: string,
    model: string
}, number>();

// Set values
productMap.set({category: "electronics", subcategory: "phones", brand: "Apple", model: "iPhone 13"}, 999);
productMap.set({category: "electronics", subcategory: "phones", brand: "Samsung", model: "Galaxy S21"}, 899);
productMap.set({category: "electronics", subcategory: "laptops", brand: "Apple", model: "MacBook Pro"}, 1999);
productMap.set({category: "clothing", subcategory: "shirts", brand: "Nike", model: "Sport Shirt"}, 49);

// Query for all Apple products
const appleProducts = productMap.query({brand: "Apple"});
// Returns entries for iPhone 13 and MacBook Pro

// Query for all electronic phones
const phones = productMap.query({category: "electronics", subcategory: "phones"});
// Returns entries for iPhone 13 and Galaxy S21
```
## API

### Map Classes

#### UnorderedMultiKeyMap<K extends any[], V>
A multi-key map where the order of elements in the key array doesn't matter.

```typescript
const map = new UnorderedMultiKeyMap<string[], number>();
```

#### OrderedMultiKeyMap<K extends any[], V>
A multi-key map where the order of elements in the key array matters.

```typescript
const map = new OrderedMultiKeyMap<string[], number>();
```

#### StructuredMultiKeyMap<K extends Record<string, any>, V>
A multi-key map that uses objects as keys, where the first level of properties acts as the key.

```typescript
const map = new StructuredMultiKeyMap<{user: string, role: string}, number>();
```

#### QueryableUnorderedMultiKeyMap<K extends any[], V>
A queryable version of UnorderedMultiKeyMap that supports partial key lookups.

```typescript
const map = new QueryableUnorderedMultiKeyMap<string[], number>();
```

#### QueryableOrderedMultiKeyMap<K extends any[], V>
A queryable version of OrderedMultiKeyMap that supports partial key lookups.

```typescript
const map = new QueryableOrderedMultiKeyMap<string[], number>();
```

#### QueryableStructuredMultiKeyMap<K extends Record<string, any>, V>
A queryable version of StructuredMultiKeyMap that supports partial key lookups.

```typescript
const map = new QueryableStructuredMultiKeyMap<{user: string, role: string}, number>();
```

### Methods

All map classes extend the built-in JavaScript Map class and provide the following methods:

#### set(key: K, value: V): this
Sets a value for the specified key.

```typescript
map.set(["A", "B"], 1);
map.set({user: "u1", role: "admin"}, 1);
```

#### get(key: K): V | undefined
Returns the value associated with the specified key, or undefined if the key doesn't exist.

```typescript
const value = map.get(["A", "B"]);
const value = map.get({user: "u1", role: "admin"});
```

#### has(key: K): boolean
Returns a boolean indicating whether an element with the specified key exists.

```typescript
const exists = map.has(["A", "B"]);
const exists = map.has({user: "u1", role: "admin"});
```

#### delete(key: K): boolean
Removes the element with the specified key. Returns true if an element existed and has been removed, or false if the element does not exist.

```typescript
const deleted = map.delete(["A", "B"]);
const deleted = map.delete({user: "u1", role: "admin"});
```

#### clear(): void
Removes all elements from the map.

```typescript
map.clear();
```

#### keys(): MapIterator<K>
Returns a new iterator object that contains the keys for each element in the map.

```typescript
for (const key of map.keys()) {
    console.log(key);
}
```

#### entries(): MapIterator<[K, V]>
Returns a new iterator object that contains [key, value] pairs for each element in the map.

```typescript
for (const [key, value] of map.entries()) {
    console.log(key, value);
}
```

#### values(): MapIterator<V>
Returns a new iterator object that contains the values for each element in the map.

```typescript
for (const value of map.values()) {
    console.log(value);
}
```

### Query Methods (Queryable variants only)

#### query(keyTemplate: Partial<K>): MultikeyMapQueryResult<K, V>[]
Returns an array of entries that match the partial key template.

For OrderedMultiKeyMap:
```typescript
const results = map.query(["A", undefined]); // Matches keys where first element is "A"
```

For StructuredMultiKeyMap:
```typescript
const results = map.query({user: "u1"}); // Matches keys where user property is "u1"
```

#### queryIndexedWith(keys: any[]): MultikeyMapQueryResult<K, V>[]
Returns an array of entries that contain all of the specified key values, regardless of their position (UnorderedMultiKeyMap only).

```typescript
const results = map.queryIndexedWith(["A", "B"]); // Matches keys containing both "A" and "B"
```

## License

MIT