import { BlueprintSet } from "@/types/types";

export default function() {
    (window as any).sets = {};
    (window as any).duplicateSets = {};
    (window as any).duplicateParts = [];

    Array.of(...document.querySelectorAll('.set')).forEach((s: HTMLDivElement) => {
        const n = s.querySelector('.name');
        if (!n) return;

        const set= n.textContent as BlueprintSet;
        sets[set] = s;
    })
}
