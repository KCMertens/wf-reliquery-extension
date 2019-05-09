import {Blueprint, BlueprintSet} from '@/types/types';
import { createElement, insertAfter } from '@/utils/utils';

export class DuplicateSet {
    private el: HTMLElement;
    private referenceSet: HTMLElement;


    constructor(private set: BlueprintSet) {
        this.referenceSet = sets[set];

        const el = this.el = tpl.wish.set.new();
        el._('header')._('name').textContent = set;
        el._('header')._('type')

        el.style.outline = '1px solid red';

        insertAfter(el, this.referenceSet);
    }

    // private get checked(): boolean {
    //     return this.cb.checked;
    // }
}