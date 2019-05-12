import {Blueprint, BlueprintSet} from '@/types/types';
import { createElement, insertAfter } from '@/utils/utils';
import { DuplicatePart } from './DuplicatePart';

export class DuplicateSet {
    private el: HTMLElement;
    private referenceSet: HTMLElement;


    constructor(private set: BlueprintSet) {
        this.referenceSet = sets[set];
        const el = this.el = tpl.wish.set.new();
        duplicateSets[set] = this.el as HTMLDivElement;

        el._('header')._('name').textContent = set;
        el._('header')._('wikilink').setAttribute("href", "//warframe.wikia.com/wiki/" + set.replace(" ", "_"));

        const img = this.referenceSet.querySelector('img')!.getAttribute('src');
        if (img) {
            el._('header')._('type').setAttribute('src', img)
        }

        // el.style.outline = '1px solid red';
        el.classList.toggle('vaulted', this.referenceSet.classList.contains('vaulted'));

        // todo dupe parts
        Array.of(...this.referenceSet.querySelectorAll('.item input'))
        .forEach(i => {
            const wants: string = i.getAttribute('name')!;
            const r = wants.match(/wants\[(.*)\]/)!;
            const bp: Blueprint = r[1] as Blueprint;

            new DuplicatePart(set, bp, true);
        });

        insertAfter(el, this.referenceSet);
    }
}