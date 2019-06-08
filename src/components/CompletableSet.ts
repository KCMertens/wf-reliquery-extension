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

        const checked = this.load<boolean>();
        completeCheckbox.checked = checked;
        completeCheckbox.dispatchEvent(new Event('change'));
    }

    load<T>(): T {
        return JSON.parse(localStorage.getItem(completableKey(this.set, this.isDuplicate)) || 'false');
    }

    save<T>(t: T) {
        localStorage.setItem(completableKey(this.set, this.isDuplicate), JSON.stringify(t));
    }
}