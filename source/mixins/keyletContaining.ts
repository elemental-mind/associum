import { IDProvider } from "identigenium";
import { AlphaNumeric } from "identigenium/sets";
import { keyletUseCountPrefix, stringEscapePrefix } from "../constants.ts";

export type KeyletContainerAPI = InstanceType<ReturnType<typeof KeyletContaining>>;

export function KeyletContaining<TBase extends new (...args: any[]) => Map<any, any>>(Base: TBase)
{
    return class KeyletContainerMixin extends Base
    {
        idProvider = new IDProvider(AlphaNumeric);

        clear(): void
        {
            super.clear();
            this.idProvider = new IDProvider(AlphaNumeric);
        }

        resolveKeylet(key: any): string | undefined
        {
            const normalizedKeyletAccessor = typeof key === "string" ? stringEscapePrefix + key : key;
            return super.get(normalizedKeyletAccessor);
        }

        getOrCreateKeylet(key: any)
        {
            const normalizedKeyletAccessor = typeof key === "string" ? stringEscapePrefix + key : key;

            const currentKeylet = super.get(normalizedKeyletAccessor);
            if (currentKeylet) return currentKeylet;

            const newKeylet = this.idProvider.generateID();
            super.set(normalizedKeyletAccessor, newKeylet);
            super.set(newKeylet, key);
            super.set(keyletUseCountPrefix + newKeylet, 0);

            return newKeylet;
        }

        bindKeylets(keylets: string[])
        {
            for (const keylet of keylets)
            {
                const keyletCountAccessor = keyletUseCountPrefix + keylet;
                super.set(keyletCountAccessor, super.get(keyletCountAccessor)! + 1);
            }
        }

        freeKeylets(keylets: string[])
        {
            for (const keylet of keylets)
            {
                const keyletCountAccessor = keyletUseCountPrefix + keylet;
                const currentCount = super.get(keyletCountAccessor)!;

                if (currentCount > 1) 
                {
                    super.set(keyletCountAccessor, currentCount - 1);
                }
                else
                {
                    const key = super.get(keylet)!;
                    super.delete(typeof key === "string" ? stringEscapePrefix + key : key);
                    super.delete(keylet);
                    super.delete(keyletCountAccessor);
                }
            }
        }
    };
}
