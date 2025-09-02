# Goals

A unified library for multi-key maps.

# Use Cases

## Ordered Multi-Key maps

```ts
const omap: MultiKeyMap<string, number> = ...; // ordered impl
omap.set(["A", "B"], 1);
omap.get(["A", "B"]); // 1
omap.get(["B", "A"]); // undefined
```

## Unordered Multi-Key maps

```ts
const umap: MultiKeyMap<string, number> = ...; // unordered impl
umap.set(["A", "B"], 2);
umap.get(["B", "A"]); // 2
```

## Structured Key maps
```ts
type UserRole = { user: string; role: string };
const smap: StructuredMultiKeyMap<UserRole, boolean> = ...;
smap.set({ user: "u1", role: "admin" }, true);
smap.get({ user: "u1", role: "admin"}) //true
smap.query({ user: "u1" }); // all entries with user=u1
```

# Memory management

All map types should support weak and strong references - analog to Map and WeakMap

# Implementation

Nested Maps must be avoided. Low memory overhead as goal.

