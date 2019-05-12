import '@/types/globals';

// import * as $ from 'jquery';
import {Blueprint, BlueprintSet} from '@/types/types';
import {dupes, dupeSets} from '@/config/dupes';

import { DuplicatePart } from './components/DuplicatePart';

import initGlobals from '@/utils/globals';
import { DuplicateSet } from './components/DuplicateSet';
import { CompletableSet } from './components/CompletableSet';

function main() {
    initGlobals();

    for(const [set, dupedParts] of Object.entries(dupes) as Array<[BlueprintSet, Blueprint[]]>) {
        dupedParts.forEach(bp => {
            new DuplicatePart(set, bp);
        });
    }

    for (const set of dupeSets) {
        new DuplicateSet(set);
    }

    Object.keys(sets).forEach((s: BlueprintSet) => new CompletableSet(s, false));
    Object.keys(duplicateSets).forEach((s: BlueprintSet) => new CompletableSet(s, true));

    // @ts-ignore
    const originalRenderReliquary = renderReliquary;

    // @ts-ignore
    renderReliquary = function(tokenArray: Array<{wants: Blueprint[]}>) {
        originalRenderReliquary(tokenArray.map(data => {
            const joinedWants = new Set<Blueprint>();

            data.wants.forEach(v => joinedWants.add(v));
            duplicateParts.filter(p => p.isChecked()).forEach(p => joinedWants.add(p.id));

            return {
                ...data,
                wants: Array.of(...joinedWants.keys())
            }
        }));
    };
}

const interval = setInterval(() => {
    if (document.querySelector('.list.box-container > .set.box') && document.querySelector('.wishlist.active')) {
        clearInterval(interval);
        main();
    }
}, 100);