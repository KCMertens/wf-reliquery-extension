import {Blueprint, BlueprintSet} from '@/types/types';
import { createElement, insertAfter } from '@/utils/utils';

export class DuplicatePart {
    private el: HTMLElement;
    private checkbox: HTMLInputElement;
    private setcontainer: HTMLElement;

    constructor(private set: BlueprintSet, private id: Blueprint) {
        this.setcontainer = sets[set];

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

        const originalElement = this.setcontainer.querySelector(`input[name="wants[${id}]"]`)!.closest('.item')!;
        insertAfter(this.el, originalElement);
    }

    private get checked(): boolean {
        return this.checkbox.checked;
    }
}