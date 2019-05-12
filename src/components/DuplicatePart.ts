import {Blueprint, BlueprintSet} from '@/types/types';
import { createElement, insertAfter } from '@/utils/utils';
import { duplicatePartKey } from './componentUtils';

export class DuplicatePart {
    private el: HTMLElement;
    private checkbox: HTMLInputElement;
    private setcontainer: HTMLElement;

    constructor(private set: BlueprintSet, private id: Blueprint, isDuplicateSet: boolean = false) {
        const originalSetContainer = sets[set];
        this.setcontainer = isDuplicateSet ? duplicateSets[set] : originalSetContainer;

        const displayName = this.set && id.startsWith(this.set)
        ? id.slice(this.set.length+1).replace(' Blueprint', '')
        : id;

        this.el = createElement(`
            <div class="item">
                <label style="outline: 1px solid red;">
                    <input type="checkbox">
                    <span>${displayName} (duplicate)</span>
                </label>
                </div>
        `)
        this.checkbox = this.el.querySelector('input')!;

        const originalElement = isDuplicateSet ? null : this.setcontainer.querySelector(`input[name="wants[${id}]"]`)!.closest('.item')!;
        originalElement ? insertAfter(this.el, originalElement) : this.setcontainer.append(this.el);


        // TODO
        const storageKey = duplicatePartKey(set, isDuplicateSet, id);
        this.checkbox.addEventListener('change', e => {
            const checked = (e.target as HTMLInputElement).checked
            localStorage.setItem(storageKey, JSON.stringify(checked));
            this.el.classList.toggle('wanted', checked);
        })

        {
            const checked = JSON.parse(localStorage.getItem(storageKey) || 'false');
            this.checkbox.checked = checked;
            this.checkbox.dispatchEvent(new Event('change'));
        }
    }
}