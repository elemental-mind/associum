import * as assert from 'assert';
import { OrderedMultiKeyMap, QueryableStructuredMultiKeyMap, StructuredMultiKeyMap, UnorderedMultiKeyMap, } from "./associum.ts";
import type { MapQueryResult } from './multikeyMap.ts';

export class UnorderedKeymapTests
{
    shouldSetAndGet()
    {
        const map = new UnorderedMultiKeyMap<string[], number>();
        map.set(["A", "B"], 2);

        assert.equal(map.get(["A", "B"]), 2);
        assert.equal(map.get(["B", "A"]), 2);
        assert.equal(map.get(["A", "A"]), undefined);
    }

    shouldHave()
    {
        const map = new UnorderedMultiKeyMap<string[], number>();
        map.set(["X", "Y"], 5);

        assert.ok(map.has(["Y", "X"]));
        assert.ok(map.has(["X", "Y"]));
    }

    shouldDelete()
    {
        const map = new UnorderedMultiKeyMap<string[], number>();
        map.set(["X", "Y"], 5);

        // Test deletion with keys in reverse order
        const deletedReverse = map.delete(["Y", "X"]);

        assert.ok(deletedReverse);
        assert.equal(map.has(["X", "Y"]), false);
        assert.equal(map.has(["Y", "X"]), false);

        // Reset for testing deletion with keys in order
        map.set(["X", "Y"], 5);

        // Test deletion with keys in original order
        const deletedInOrder = map.delete(["X", "Y"]);

        assert.ok(deletedInOrder);
        assert.equal(map.has(["X", "Y"]), false);
        assert.equal(map.has(["Y", "X"]), false);
    }

    shouldOverrideExistingKey()
    {
        const map = new UnorderedMultiKeyMap<string[], number>();
        map.set(["A", "B"], 1);

        assert.equal(map.get(["A", "B"]), 1);
        assert.equal(map.get(["B", "A"]), 1);

        // Override with same key in same order
        map.set(["A", "B"], 2);

        assert.equal(map.get(["A", "B"]), 2);
        assert.equal(map.get(["B", "A"]), 2);

        // Override with same key in different order
        map.set(["B", "A"], 3);

        assert.equal(map.get(["A", "B"]), 3);
        assert.equal(map.get(["B", "A"]), 3);
    }

    shouldHandleEmptyStringKeys()
    {
        const map = new UnorderedMultiKeyMap<string[], number>();
        map.set(["", "B"], 4);

        assert.equal(map.get(["", "B"]), 4);
        assert.equal(map.get(["B", ""]), 4);
        assert.equal(map.get(["B"]), undefined);
    }

    shouldHandleZeroKeys()
    {
        const map = new UnorderedMultiKeyMap<(string | number)[], string>();
        map.set([0, "A"], "zero-key");

        assert.equal(map.get([0, "A"]), "zero-key");
        assert.equal(map.get(["A", 0]), "zero-key");
        assert.equal(map.get(["A"]), undefined);
    }

    shouldRejectSparseArrays()
    {
        const map = new UnorderedMultiKeyMap<string[], number>();
        const sparse = [] as string[];
        sparse[1] = "B";
        sparse[3] = "D";

        assert.throws(() => map.set(sparse, 9));

        const retreievalSparse = [] as string[];
        retreievalSparse[1] = "B";
        retreievalSparse[3] = "D";

        assert.throws(() => map.get(retreievalSparse));
    }

    shouldIterateKeys()
    {
        const map = new UnorderedMultiKeyMap<(string | number)[], number>();
        map.set(["A", "B"], 1);
        map.set(["B", "C"], 2);
        map.set(["", 0], 3);

        assert.deepStrictEqual([...map.keys()], [["A", "B"], ["B", "C"], ["", 0]]);
    }

    shouldIterateValues()
    {
        const emptyMap = new UnorderedMultiKeyMap<string[], number>();
        assert.deepStrictEqual(Array.from(emptyMap.values()), []);

        const map = new UnorderedMultiKeyMap<(string | number)[], number>();
        map.set(["A", "B"], 1);
        map.set(["B", "C"], 2);
        map.set(["", 0], 3);

        assert.deepStrictEqual([...map.values()], [1, 2, 3]);
    }

    shouldIterateEntries()
    {
        const emptyMap = new UnorderedMultiKeyMap<string[], number>();
        assert.deepStrictEqual(Array.from(emptyMap.entries()), []);

        const map = new UnorderedMultiKeyMap<(string | number)[], number>();
        map.set(["A", "B"], 1);
        map.set(["B", "C"], 2);
        map.set(["", 0], 3);

        assert.deepStrictEqual(
            [...map.entries()],
            [
                [["A", "B"], 1],
                [["B", "C"], 2],
                [["", 0], 3]
            ]);
    }
}

export class OrderedKeyMapTests
{
    shouldSetAndGet()
    {
        const map = new OrderedMultiKeyMap<string[], number>();
        map.set(["A", "B"], 1);

        assert.equal(map.get(["A", "B"]), 1);
        assert.equal(map.get(["B", "A"]), undefined);
    }

    shouldHave()
    {
        const map = new OrderedMultiKeyMap<string[], number>();
        map.set(["X", "Y"], 5);

        assert.ok(map.has(["X", "Y"]));
        assert.equal(map.has(["Y", "X"]), false);
    }

    shouldDelete()
    {
        const map = new OrderedMultiKeyMap<string[], number>();
        map.set(["X", "Y"], 5);

        const deleted = map.delete(["X", "Y"]);

        assert.ok(deleted);
        assert.equal(map.has(["X", "Y"]), false);
    }

    shouldOverrideExistingKey()
    {
        const map = new OrderedMultiKeyMap<string[], number>();
        map.set(["A", "B"], 1);

        assert.equal(map.get(["A", "B"]), 1);

        map.set(["A", "B"], 2);

        assert.equal(map.get(["A", "B"]), 2);
    }

    shouldHandleEmptyStringKeys()
    {
        const map = new OrderedMultiKeyMap<string[], number>();
        map.set(["", "B"], 7);

        assert.equal(map.get(["", "B"]), 7);
        assert.equal(map.get(["B", ""]), undefined);
    }

    shouldHandleZeroKeys()
    {
        const map = new OrderedMultiKeyMap<(string | number)[], string>();
        map.set([0, "A"], "zero-key");

        assert.equal(map.get([0, "A"]), "zero-key");
        assert.equal(map.get(["A", 0]), undefined);
        assert.equal(map.get(["A"]), undefined);
    }

    shouldRejectSparseArrays()
    {
        const map = new OrderedMultiKeyMap<string[], number>();
        assert.throws(() => map.set(["A", , , "D"], 5));
    }

    shouldIterateKeys()
    {
        const emptyMap = new OrderedMultiKeyMap<string[], number>();
        assert.deepStrictEqual(Array.from(emptyMap.keys()), []);

        const map = new OrderedMultiKeyMap<(string | number)[], number>();
        map.set(["A", "B"], 1);
        map.set(["B", "C"], 2);
        map.set(["", 0], 3);

        assert.deepStrictEqual([...map.keys()], [["A", "B"], ["B", "C"], ["", 0]]);
    }

    shouldIterateValues()
    {
        const emptyMap = new OrderedMultiKeyMap<string[], number>();
        assert.deepStrictEqual(Array.from(emptyMap.values()), []);

        const map = new OrderedMultiKeyMap<(string | number)[], number>();
        map.set(["A", "B"], 1);
        map.set(["B", "C"], 2);
        map.set(["", 0], 3);

        assert.deepStrictEqual([...map.values()], [1, 2, 3]);
    }

    shouldIterateEntries()
    {
        const emptyMap = new OrderedMultiKeyMap<string[], number>();
        assert.deepStrictEqual(Array.from(emptyMap.entries()), []);

        const map = new OrderedMultiKeyMap<(string | number)[], number>();
        map.set(["A", "B"], 1);
        map.set(["B", "C"], 2);
        map.set(["", 0], 3);

        assert.deepStrictEqual(
            [...map.entries()],
            [
                [["A", "B"], 1],
                [["B", "C"], 2],
                [["", 0], 3]
            ]);
    }
}

export class StructuredKeyMapTests
{
    shouldSetAndGet()
    {
        type UserRole = { user: string; role: string; };
        const map = new StructuredMultiKeyMap<UserRole, number>();

        map.set({ user: "u1", role: "admin" }, 1);

        assert.equal(map.get({ user: "u1", role: "admin" }), 1);
        assert.equal(map.get({ user: "u1", role: "guest" }), undefined);
    }

    shouldQueryPartial()
    {
        type UserRole = { user: string; role: string; };
        const map = new QueryableStructuredMultiKeyMap<UserRole, number>();

        map.set({ user: "u1", role: "admin" }, 1);
        map.set({ user: "u1", role: "editor" }, 0);
        map.set({ user: "u2", role: "admin" }, 1);

        const results = map.queryKeysMatching({ user: "u1" });
        const roles = results.map((result: MapQueryResult<UserRole, number>) => result.key.role).sort();

        assert.equal(roles.length, 2);
        assert.equal(roles.join(","), "admin,editor");
    }

    shouldDelete()
    {
        type UserRole = { user: string; role: string; };
        const map = new StructuredMultiKeyMap<UserRole, number>();

        map.set({ user: "u3", role: "viewer" }, 0);

        assert.ok(map.has({ user: "u3", role: "viewer" }));

        const deleted = map.delete({ user: "u3", role: "viewer" });

        assert.ok(deleted);
        assert.equal(map.has({ user: "u3", role: "viewer" }), false);
    }

    shouldHave()
    {
        type UserRole = { user: string; role: string; };
        const map = new StructuredMultiKeyMap<UserRole, number>();

        map.set({ user: "u1", role: "admin" }, 1);

        assert.ok(map.has({ user: "u1", role: "admin" }));
        assert.equal(map.has({ user: "u1", role: "guest" }), false);
    }

    shouldOverrideExistingKey()
    {
        type UserRole = { user: string; role: string; };
        const map = new StructuredMultiKeyMap<UserRole, number>();

        map.set({ user: "u1", role: "admin" }, 1);

        assert.equal(map.get({ user: "u1", role: "admin" }), 1);

        map.set({ user: "u1", role: "admin" }, 0);

        assert.equal(map.get({ user: "u1", role: "admin" }), 0);
    }

    shouldHandleEmptyStringsAndZeroValues()
    {
        type UserRole = { user: string; role: string; level: number; };
        const map = new StructuredMultiKeyMap<UserRole, number>();

        map.set({ user: "", role: "", level: 0 }, 7);

        assert.equal(map.get({ user: "", role: "", level: 0 }), 7);
        assert.equal(map.get({ user: "", role: "", level: 1 }), undefined);
        assert.equal(map.get({ user: "", role: "guest", level: 0 }), undefined);

        map.set({ user: "u1", role: "admin", level: 0 }, 9);

        assert.equal(map.get({ user: "u1", role: "admin", level: 0 }), 9);
        assert.equal(map.get({ user: "u1", role: "admin" }), undefined);
    }

    shouldIterateKeys()
    {
        type UserRole = { user: string; role: string; level: number; };

        const emptyMap = new StructuredMultiKeyMap<UserRole, number>();
        assert.deepStrictEqual(Array.from(emptyMap.keys()), []);

        const map = new StructuredMultiKeyMap<UserRole, number>();
        map.set({ user: "u1", role: "admin", level: 0 }, 10);
        map.set({ user: "u2", role: "editor", level: 1 }, 11);
        map.set({ user: "", role: "guest", level: 0 }, 12);

        const expectedKeys = [
            { user: "u1", role: "admin", level: 0 },
            { user: "u2", role: "editor", level: 1 },
            { user: "", role: "guest", level: 0 },
        ];

        assert.deepStrictEqual([...map.keys()], expectedKeys);
    }

    shouldIterateValues()
    {
        type UserRole = { user: string; role: string; level: number; };

        const emptyMap = new StructuredMultiKeyMap<UserRole, number>();
        assert.deepStrictEqual(Array.from(emptyMap.values()), []);

        const map = new StructuredMultiKeyMap<UserRole, number>();
        map.set({ user: "u1", role: "admin", level: 0 }, 10);
        map.set({ user: "u2", role: "editor", level: 1 }, 11);
        map.set({ user: "", role: "guest", level: 0 }, 12);

        assert.deepStrictEqual([...map.values()], [10, 11, 12]);
    }

    shouldIterateEntries()
    {
        type UserRole = { user: string; role: string; level: number; };

        const emptyMap = new StructuredMultiKeyMap<UserRole, number>();
        assert.deepStrictEqual(Array.from(emptyMap.entries()), []);

        const map = new StructuredMultiKeyMap<UserRole, number>();
        map.set({ user: "u1", role: "admin", level: 0 }, 10);
        map.set({ user: "u2", role: "editor", level: 1 }, 11);
        map.set({ user: "", role: "guest", level: 0 }, 12);

        assert.deepStrictEqual([...map.entries()], [
            [{ user: "u1", role: "admin", level: 0 }, 10],
            [{ user: "u2", role: "editor", level: 1 }, 11],
            [{ user: "", role: "guest", level: 0 }, 12],
        ]);
    }
}