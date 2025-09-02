# Identigenium

A TypeScript library for generating unique, incremental ASCII/string based IDs using configurable character sets. It's super tiny and tree-shakeable (142 bytes minified and brotlied just using IncrementalIDProvider).

## Features

- **Incremental ID Generation**: Generate IDs that increment through a custom character set
- **Custom Character Sets**: Use predefined ASCII character sets or define your own
- **Prefix Support**: Add custom prefixes to generated IDs
- **Configurable ID Counter**: Persist and resume ID generation state through saving and reinstating the ID generation counter.

## Installation

```bash
npm install identigenium
```

## Usage

### Incremental IDs

```typescript
import { IncrementalIDProvider } from 'identigenium';

//Each caracter is a possible "digit" - here a, b, c are possible digits
//Once digits are exhausted a new digit will be added to the ID and least significant digit will be started over
const provider = new IncrementalIDProvider('abc');
console.log(provider.generateID()); // 'a'
console.log(provider.generateID()); // 'b'
console.log(provider.generateID()); // 'c'
console.log(provider.generateID()); // 'aa'
console.log(provider.generateID()); // 'ab'
console.log(provider.generateID()); // 'ac'
console.log(provider.generateID()); // 'ba'
//...
console.log(provider.generateID()); // 'cc'
console.log(provider.generateID()); // 'aaa'
//...
console.log(provider.generateID()); // 'acc'
console.log(provider.generateID()); // 'baa'
//...
console.log(provider.generateID()); // 'ccc'
console.log(provider.generateID()); // 'aaaa'
```

>Note: You must make sure your string of chars is a set of unique characters (or use one of the predefined sets, see below). This is not checked by the library to keep it slim at runtime.

### Incremental IDs with Prefix

```typescript
import { IncrementalIDProvider } from 'identigenium';

const provider = new IncrementalIDProvider('abc', 'ID-');
console.log(provider.generateID()); // 'ID-a'
console.log(provider.generateID()); // 'ID-b'
console.log(provider.generateID()); // 'ID-c'
```

### Start from given ID with ConfigurableIDProvider

```typescript
import { ConfigurableIDProvider } from 'identigenium';

//Acts like it has already emitted 3 IDs, thus at the char with index 3
const provider = new ConfigurableIDProvider('abcxyz', 3);
console.log(provider.generateID()); // 'x'
console.log(provider.generateID()); // 'y'
console.log(provider.generateID()); // 'z'
console.log(provider.idCounter);      //  6
```

### Dynamic Counter Adjustment

```typescript
import { ConfigurableIDProvider } from 'identigenium';

const provider = new ConfigurableIDProvider('abcxyz', 0);
console.log(provider.generateID()); // 'a'
console.log(provider.generateID()); // 'b' idEpoch is now 2

provider.idCounter = 4;               // Continue emitting as if another 2 IDs had been generated (4 in total)

console.log(provider.generateID()); // 'y'
```

## Predefined Character Sets

The library provides several predefined character sets under the `identigenium/sets` import:

```typescript
import {
  UpperChars,      // 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  LowerChars,      // 'abcdefghijklmnopqrstuvwxyz'
  Chars,           // LowerChars + UpperChars
  Numbers,         // '0123456789'
  AlphaNumeric,    // Chars + Numbers
  Base64,          // AlphaNumeric + '+/'
  Base64URL,       // AlphaNumeric + '-_'
  Braces,          // '<{[()]}>'
  Slashes,         // '\\/'
  Separators,      // ',.:;?!'
  Quotes,          // '\'"'
  Miscellaneous,   // '@#%$|^~_+-*='
  SpecialChars     // Various special characters
} from 'identigenium/sets';
```

### Example with Predefined Sets

```typescript
import { IncrementalIDProvider } from 'identigenium';
import { AlphaNumeric } from 'identigenium/sets';

const provider = new IncrementalIDProvider(AlphaNumeric);
console.log(provider.generateID()); // '0'
console.log(provider.generateID()); // '1'
// ...
console.log(provider.generateID()); // '9'
console.log(provider.generateID()); // 'a'
console.log(provider.generateID()); // 'b'
```

> Note: When using the number set '0123456789' don't expect IDs to follow numerical ordering. Each char is taken as a literal digit, resulting in a generation sequence of ..., '9', '00', '01', ..., '99', '000', '001', ... as from a string standpoint '1' !== '01' !== '001'.

## API Reference

### IDSource Interface

Interface for an ID source that provides unique identifiers. Both the incremental and the configurable provider implement this interface

```typescript
interface IDSource {
  idStream: Generator<string, string, void>;
  generateID(): string;
}
```

#### Properties

- **`idStream`**: `Generator<string, string, void>` - A generator that yields unique string IDs. Can be used to iterate and generate IDs.
  - **Example:**
    ```typescript
    // Using for-of loop
    for (const id of idSource.idStream) {
      console.log(id);
    }
    ```
  - **Example:**
    ```typescript
    // Using next().value
    const nextId = idSource.idStream.next().value;
    console.log(nextId);
    ```

#### Methods

- **`generateID()`**: `string` - Generates and returns a new unique ID string.

### IncrementalIDProvider

An incremental ID provider that generates unique identifiers using a specified character set and optional prefix. IDs are generated incrementally starting from the first character in the set, then progressing through combinations of increasing length.

```typescript
class IncrementalIDProvider implements IDSource {
  constructor(permittedCharacters: string, prefix?: string);
  idStream: Generator<string, string, void>;
  generateID(): string;
}
```

#### Constructor

- **`new IncrementalIDProvider(permittedCharacters: string, prefix?: string)`**
  - `permittedCharacters`: A string containing all allowed characters for ID generation. MUST be a string of unique characters; this is not checked.
  - `prefix`: An optional prefix to prepend to all generated IDs (default: "")

#### Properties

- **`idStream`**: `Generator<string, string, void>`

#### Methods

- **`generateID()`**: `string`

### ConfigurableIDProvider

A configurable ID provider that generates unique identifiers using a specified character set, prefix, and starting counter value. This provider allows for customizable ID generation with support for resuming from a specific counter position.

```typescript
class ConfigurableIDProvider implements IDSource {
  constructor(permittedCharacters: string, startIDCounterWith?: number, prefix?: string);
  idCounter: number;
  idStream: Generator<string, string, void>;
  generateID(): string;
}
```

#### Constructor

- **`new ConfigurableIDProvider(permittedCharacters: string, startWithCounter?: number, prefix?: string)`**
  - `permittedCharacters`: A string containing all allowed characters for ID generation. MUST be a string of unique characters; this is not checked.
  - `startWithCounter`: The initial counter value to start ID generation from (default: 0)
  - `prefix`: An optional prefix to prepend to all generated IDs (default: "")

#### Properties

- **`idCounter`**: `number` - Gets or sets the number of already generated IDs. Returns the current counter value representing the number of IDs generated so far.
- **`idStream`**: `Generator<string, string, void>`

#### Methods

- **`generateID()`**: `string`

## License

MIT