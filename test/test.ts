import { UnorderedKeymapTests, OrderedKeyMapTests, StructuredKeyMapTests } from "../source/associatium.spec";

function run()
{
    const unordered = new UnorderedKeymapTests();
    unordered.shouldSetAndGet();
    unordered.shouldHave();
    unordered.shouldDelete();
    unordered.shouldOverrideExistingKey();

    const ordered = new OrderedKeyMapTests();
    ordered.shouldSetAndGet();
    ordered.shouldHave();
    ordered.shouldDelete();
    ordered.shouldOverrideExistingKey();

    const structured = new StructuredKeyMapTests();
    structured.shouldSetAndGet();
    structured.shouldQueryPartial();
    structured.shouldDelete();
    structured.shouldHave();
    structured.shouldOverrideExistingKey();

    console.log("All tests invoked");
}

run();