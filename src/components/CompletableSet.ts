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

        completeCheckbox.addEventListener('change', e => {
            const checked = (e.target as HTMLInputElement).checked;
            this.save(checked);
            this.container.classList.toggle('completed', checked);
        });

        const checked = this.load();
        completeCheckbox.checked = checked;
        completeCheckbox.dispatchEvent(new Event('change'));

        completableSets.push(this);
    }

    load(): boolean {
        return JSON.parse(localStorage.getItem(this.key) || 'false');
    }

    save(t: boolean) {
        localStorage.setItem(this.key, JSON.stringify(t));
    }

    get key() { return completableKey(this.set, this.isDuplicate); }
}