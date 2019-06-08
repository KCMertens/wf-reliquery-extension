import { BlueprintSet, Blueprint } from "@/types/types";

export function completableKey(s: BlueprintSet, isDuplucateSet: boolean) {
    return `${mainToken}/c/${isDuplucateSet ? 'd' : 'o'}/${s}`;
}

/** Duplicate parts in duplicate sets not supported */
export function duplicatePartKey(s: BlueprintSet, isDuplicateSet: boolean, p: Blueprint) {
    return `${mainToken}/s/${isDuplicateSet ? 'd' : 'o'}/${s}/${p}`;
}
