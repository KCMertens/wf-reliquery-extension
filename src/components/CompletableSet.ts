import { BlueprintSet } from "@/types/types";
import { createElement, insertAfter } from "@/utils/utils";
import { completableKey } from '@/components/componentUtils';
import { inherits } from "util";


const addedStyles = document.createElement('style');
addedStyles.innerHTML = `
.set.completed {
    opacity: 0.5;
    border-image: linear-gradient(to bottom, gold, transparent 35%, transparent 90%, gold) 1!important;
}

.set.completed:hover {
    box-shadow: 0px 0px 15px 2px gold!important;
}

.set.completed .name {
    color: gold!important;
}
`
document.body.appendChild(addedStyles);

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