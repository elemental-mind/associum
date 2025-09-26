# Associum

Associum provides multi-key maps built on top of `Map` with TypeScript support.

A vanilla map just compares its keys by reference, and does not reason about the structure of the given key. Associum's multi-key-maps solve this problem without falling back to serializing the whole key object, which would be memory-inefficient and make queries hard.

If you ever wanted to associate `["plant", "edible", "leafy"] => "spinach"` or `{concept: "mobility", subconcept: "car", data: "manufacturers"} => ["Mercedes", "BMW", "Toyota", "GM", "Ford"]` this library provides the tools to make these associations and query them.

## Main Features

- **Multiple Indexing Options**: Use `unordered arrays`, `ordered arrays` or `records ( a set of string-value-pairs)` as keys to index a value.
- **Queryability**: Optional queryability to retrieve entries where keys contain certain values or follow a certain structure (increases bundle size).
- **Drop in Map replacement**: Extends the build-in JS-Map type, but alters how keys are interpreted. 
- **Memory efficient**: Whereas other solutions use nested maps, this one stores subkeys into a global index shared across all instances resulting in memory use equivalent to a vanilla Map.
- **Lightweight**:  Tree-shakeable with the unordered variant just shy of 175 bytes minified and bzipped.
- **Type Safety**: Full TypeScript support
- **Works everywhere**: Works in the browser, Node.js, Deno, etc.

## Installation & Use

First install:

```bash
npm install associum
```
Then import and pick respective Map type you want to use. Use like a normal Map:

```typescript
import { UnorderedMultiKeyMap } from 'associum';

const multiKeyMap = new UnorderedMultiKeyMap<string[], any>();

multiKeyMap.set(["a", "c", "b"], 123);

if(multiKeyMap.has(["a", "b", "c"]))
  console.log(multiKeyMap.get(["b", "a", "c"])) // 123
```

## Concepts

### Keys

Associum supports three types of keys, each with different characteristics:

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

### Querying

Associum provides optional queryability that allows you to retrieve entries based on partial key matches. This feature is available through queryable variants of each map type.

#### Querying Unordered Keys
With queryable unordered maps, you can find entries that contain specific key values regardless of their position in the array.

```typescript
const map = new QueryableUnorderedMultiKeyMap<string[], number>();
map.set(["plant", "edible", "leafy"], 1);
map.set(["plant", "edible", "root"], 2);
map.set(["animal", "mammal", "domestic"], 3);

// Find all entries containing "plant" and "edible"
const results = map.queryIndexedWith(["plant", "edible"]);
// Returns entries for both ["plant", "edible", "leafy"] and ["plant", "edible", "root"]
```

#### Querying Ordered Keys
With queryable ordered maps, you can find entries that match specific values at specific positions, using `undefined` for positions you don't care about.

```typescript
const map = new QueryableOrderedMultiKeyMap<string[], number>();
map.set(["concept", "mobility", "car"], 1);
map.set(["concept", "housing", "apartment"], 2);
map.set(["concept", "mobility", "bike"], 3);

// Find all entries with "concept" at position 0 and "mobility" at position 1
const results = map.query(["concept", "mobility", undefined]);
// Returns entries for both ["concept", "mobility", "car"] and ["concept", "mobility", "bike"]
```

#### Querying Structured Keys
With queryable structured maps, you can find entries that match specific property values, omitting properties you don't care about.

```typescript
const map = new QueryableStructuredMultiKeyMap<{user: string, role: string, department: string}, number>();
map.set({user: "u1", role: "admin", department: "IT"}, 1);
map.set({user: "u1", role: "editor", department: "Marketing"}, 2);
map.set({user: "u2", role: "admin", department: "IT"}, 3);

// Find all entries where user is "u1"
const results = map.query({user: "u1"});
// Returns entries for both u1's admin and editor roles
```

Querying increases the bundle size but provides powerful lookup capabilities for complex data relationships.
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
console.log(userMap.get({user: "u1", role: "admin"})); // undefined (incomplete key)

// Check existence
console.log(userMap.has({user: "u2", role: "admin", department: "IT"})); // true
```

### Advanced Usage with Querying

#### QueryableUnorderedMultiKeyMap
```typescript
import { QueryableUnorderedMultiKeyMap } from 'associum';

const tagMap = new QueryableUnorderedMultiKeyMap<string[], string>();

// Set values
tagMap.set(["frontend", "javascript", "framework"], "React");
tagMap.set(["frontend", "javascript", "framework"], "Vue");
tagMap.set(["frontend", "typescript", "framework"], "Angular");
tagMap.set(["backend", "javascript", "runtime"], "Node.js");
tagMap.set(["backend", "python", "framework"], "Django");

// Query for entries containing specific tags
const jsFrameworks = tagMap.queryIndexedWith(["javascript", "framework"]);
// Returns entries for React, Vue

const frontendTech = tagMap.queryIndexedWith(["frontend"]);
// Returns entries for React, Vue, Angular
```

#### QueryableOrderedMultiKeyMap
```typescript
import { QueryableOrderedMultiKeyMap } from 'associum';

const pathMap = new QueryableOrderedMultiKeyMap<string[], string>();

// Set values
pathMap.set(["api", "v1", "users", "GET"], "Get all users");
pathMap.set(["api", "v1", "users", "POST"], "Create user");
pathMap.set(["api", "v1", "users", ":id", "GET"], "Get user by ID");
pathMap.set(["api", "v1", "posts", "GET"], "Get all posts");
pathMap.set(["api", "v1", "posts", "POST"], "Create post");

// Query for all user endpoints
const userEndpoints = pathMap.query(["api", "v1", "users"]);
// Returns entries for GET users, POST users, GET users/:id

// Query for all GET endpoints
const getEndpoints = pathMap.query(["api", "v1", undefined, undefined, "GET"]);
// Returns entries for GET users, GET users/:id, GET posts
```

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