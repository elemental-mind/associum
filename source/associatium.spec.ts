import * as assert from 'assert';
import { OrderedMultiKeyMap, QueryableStructuredMultiKeyMap, StructuredMultiKeyMap, UnorderedMultiKeyMap, } from "./associatium.ts";
import type { MultikeyMapQueryResult } from "./mixins/queryability.ts";

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

        const results = map.query({ user: "u1" });
        const roles = results.map((result: MultikeyMapQueryResult<UserRole, number>) => result.key.role).sort();

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
}