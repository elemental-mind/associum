import { UnorderedKeyMapTests, OrderedKeyMapTests, StructuredKeyMapTests } from '../source/associatium.spec';

function runTests() {
    const unorderedTests = new UnorderedKeyMapTests();
    unorderedTests.should...();

    const orderedTests = new OrderedKeyMapTests();
    orderedTests.should...();

    const structuredTests = new StructuredKeyMapTests();
    structuredTests.should...();

    console.log("All tests successful");
}

runTests();