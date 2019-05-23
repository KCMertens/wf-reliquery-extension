import { BlueprintSet } from "@/types/types";
import { createElement, insertAfter } from "@/utils/utils";
import { completableKey } from '@/components/componentUtils';

export class CompletableSet {
    private container: HTMLDivElement;

    constructor(private set: BlueprintSet, private isDuplicate: boolean) {
        const container = this.container = isDuplicate ? duplicateSets[set] : sets[set];

        const wikilink = container.querySelector('.wikilink') as HTMLAnchorElement;

        const completeCheckbox = createElement('<input type="checkbox" class="completed" title="Set completed">') as HTMLInputElement;
        insertAfter(completeCheckbox, wikilink);

        const storageKey = completableKey(set, isDuplicate);
        completeCheckbox.addEventListener('change', e => {
            const checked = (e.target as HTMLInputElement).checked
            localStorage.setItem(storageKey, JSON.stringify(checked));
            this.container.classList.toggle('completed', checked);
        })

        {
            const checked = JSON.parse(localStorage.getItem(storageKey) || 'false');
            completeCheckbox.checked = checked;
            completeCheckbox.dispatchEvent(new Event('change'));
        }
    }

}