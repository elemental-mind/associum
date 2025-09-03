export class StringListIntersector
{
    intersectionCountObject = Object.create(null);
    listCount = 0;

    addToIntersection(listOfUniqueStrings: string[])
    {
        for (const entry of listOfUniqueStrings)
            this.intersectionCountObject[entry] = (this.intersectionCountObject[entry] ?? 0) + 1;

        this.listCount++;
    }

    computeIntersection()
    {
        const intersection = [] as string[];
        for (const entry in this.intersectionCountObject)
            if (this.intersectionCountObject[entry] === this.listCount) intersection.push(entry);
        return intersection;
    }
}