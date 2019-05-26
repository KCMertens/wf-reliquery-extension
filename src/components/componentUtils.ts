import { BlueprintSet, Blueprint } from "@/types/types";

export function completableKeyOld(s: BlueprintSet, isDuplucateSet: boolean) {
    return `c/${isDuplucateSet ? 'd' : 'o'}/${s}`;
}

export function completableKey(s: BlueprintSet, isDuplucateSet: boolean) {
    return `${mainToken}/${completableKeyOld(s, isDuplucateSet)}`;
}

/** Duplicate parts in duplicate sets not supported */
export function duplicatePartKeyOld(s: BlueprintSet, isDuplicateSet: boolean, p: Blueprint) {
    return `s/${isDuplicateSet ? 'd' : 'o'}/${s}/${p}`;
}

/** Duplicate parts in duplicate sets not supported */
export function duplicatePartKey(s: BlueprintSet, isDuplicateSet: boolean, p: Blueprint) {
    return `${mainToken}/${duplicatePartKeyOld(s, isDuplicateSet, p)}`;
}
