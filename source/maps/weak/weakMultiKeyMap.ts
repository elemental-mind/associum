import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";

export class WeakMultiKeyMap
{
    static idProvider = new IDProvider(AlphaNumeric);
    static keyletRegistry = new WeakMap<any, string>();
}