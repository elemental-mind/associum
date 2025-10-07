# Prototype/Mixin Architecture

As this library is mixin heavy it's easy to lose overview of what's going on.

For memory efficiency we use a sophisticated prototype architecture instead of separate map instances.

We use a base map and store lots of different information in it - but index them under string keys with different prefixes.

Let's look at an example. One problem for example is that when we give a subkey an ID we need to track how often it's used in order to free it again once it is not used anywhere anymore. We could write a mixin like so:

```typescript
class InefficientUseTrackingMixin extends BaseMap
{
    keyletUseCount = new Map<string, number>();

    increaseUseCount(keylet: string)
    {
        this.keyletUseCount.set(keylet, x);
    }
}
```
However, this leads to an inefficient instantiation process (every mixin has a function invocation and instantiation process of another map) and to a higher memory payload. If every mixin had its own maps tracking stuff, we might end up having x different maps for each actual map we create.
But we already have a map at our disposal - and as keylets are mostly only 2-3 ASCII chars, which map to one byte, due to byte alignment in JS engines it's virtually free to add another character ("ab" has the same mem payload as "$ab"). Yes, we trade off access time, but string creation is so cheap and fast, it's negligable.

So instead we whish to store things like so:
```typescript
const useCountPrefix = #;

class EfficientUseTrackingMixin extends BaseMap
{
    increaseUseCount(keylet: string)
    {
        //We store everything in the base map, but with a prefix
        super.set(useCountPrefix + keylet, x);
    }
}
```

The problem is that different mixins alter the entry creation/destruction/lookup process, and would of course like to tap into/override set. But we need to keep super.set routed to the base map at all times (except on the consumer facing first facade).

We hence introduce different tracks in our prototype architecture.
We divert the original calls to our internal method names, which can then be intercepted - freeing every Mixin to use super.set etc... to access the underlying map unintercepted.

![Prototype Architecture Diagram](../media/prototype.drawio.svg)

This way each mixin is free to use `super.set` etc. and know that it's accessing the base map, and can call `super.interceptSet` for other mixins to intercept.

When looking at a concrete example take this use case for example:

`Map.set(["A", "B"], 1);` should result in (quotes omitted for brevity):
```vb
// keylets to value mapping
a => A
b => B
c => 1

// value to keylets mapping (string values are escaped with % to differentiate them from keylets)
%A => a
%B => b
1 => c

//keylet usage count
#a => 1
#b => 1
#c => 1

//keylet indexing (in which entries are which keylets used)
&a => a_b
&b => a_b

//value indexing (in which entries are which value keylets used)
~c => a_b

//entries (keylet composites to value keylets)
$a_b => c
```