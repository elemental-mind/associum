export class StringListIntersector
{
    stringOccurences = Object.create(null);
    intersectionUnitCount = 0;

    addToIntersection(listOfUniqueStrings: string[])
    {
        for (const entry of listOfUniqueStrings)
            this.stringOccurences[entry] = (this.stringOccurences[entry] ?? 0) + 1;

        this.intersectionUnitCount++;
    }

    computeIntersection()
    {
        const intersection = [] as string[];
        for (const entry in this.stringOccurences)
            //If the entry has occured in all calls (each adding a intersectionUnit) to addIntersection, it is part of the intersection.
            //If a string was missing in at least one call to addIntersection, its occurence count will be less than intersectionUnitCount and thus will not be part of the intersection.
            if (this.stringOccurences[entry] === this.intersectionUnitCount) intersection.push(entry);
        return intersection;
    }
}