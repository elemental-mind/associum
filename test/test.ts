import { UnorderedKeymapTests, OrderedKeyMapTests, StructuredKeyMapTests } from "../source/associum.spec.ts";

function run()
{
    const unordered = new UnorderedKeymapTests();
    unordered.shouldSetAndGet();
    unordered.shouldHave();
    unordered.shouldDelete();
    unordered.shouldOverrideExistingKey();
    unordered.shouldHandleEmptyStringKeys();
    unordered.shouldHandleZeroKeys();
    unordered.shouldRejectSparseArrays();
    unordered.shouldIterateKeys();
    unordered.shouldIterateValues();
    unordered.shouldIterateEntries();

    const ordered = new OrderedKeyMapTests();
    ordered.shouldSetAndGet();
    ordered.shouldHave();
    ordered.shouldDelete();
    ordered.shouldOverrideExistingKey();
    ordered.shouldHandleEmptyStringKeys();
    ordered.shouldHandleZeroKeys();
    ordered.shouldRejectSparseArrays();
    ordered.shouldIterateKeys();
    ordered.shouldIterateValues();
    ordered.shouldIterateEntries();

    const structured = new StructuredKeyMapTests();
    structured.shouldSetAndGet();
    structured.shouldQueryPartial();
    structured.shouldDelete();
    structured.shouldHave();
    structured.shouldOverrideExistingKey();
    structured.shouldHandleEmptyStringsAndZeroValues();
    structured.shouldIterateKeys();
    structured.shouldIterateValues();
    structured.shouldIterateEntries();

    console.log("All tests passed");
}

run();