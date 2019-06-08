import {Blueprint, BlueprintSet} from '@/types/types';
import { createElement, insertAfter } from '@/utils/utils';
import { duplicatePartKey } from './componentUtils';

export class DuplicatePart {
    public el: HTMLElement;
    public checkbox: HTMLInputElement;
    public setcontainer: HTMLElement;

    constructor(
        public set: BlueprintSet,
        public id: Blueprint,
        public isDuplicateSet: boolean = false
    ) {
        const originalSetContainer = sets[set];
        this.setcontainer = isDuplicateSet ? duplicateSets[set] : originalSetContainer;

        const displayName = this.set && id.startsWith(this.set)
        ? id.slice(this.set.length+1).replace(' Blueprint', '')
        : id;

        this.el = createElement(`
            <div class="item">
                <label>
                    <input type="checkbox">
                    <span>${displayName}</span>
                </label>
            </div>
        `)
        this.checkbox = this.el.querySelector('input')!;

        const originalElement = isDuplicateSet ? null : this.setcontainer.querySelector(`input[name="wants[${id}]"]`)!.closest('.item')!;
        originalElement ? insertAfter(this.el, originalElement) : this.setcontainer.append(this.el);


        // TODO
        this.checkbox.addEventListener('change', e => {
            const checked = (e.target as HTMLInputElement).checked;
            this.save(checked);
            this.el.classList.toggle('wanted', checked);
        });

        const checked = this.load<boolean>();
        this.checkbox.checked = checked;
        this.checkbox.dispatchEvent(new Event('change'));

        duplicateParts.push(this);
    }

    load<T>(): T {
        return JSON.parse(localStorage.getItem(duplicatePartKey(this.set, this.isDuplicateSet, this.id)) || 'false');
    }

    save<T>(t: T) {
        localStorage.setItem(duplicatePartKey(this.set, this.isDuplicateSet, this.id), JSON.stringify(t));
    }

    isChecked() {
        return this.checkbox.checked;
    }

}