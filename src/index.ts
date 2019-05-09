import '@/types/globals';

// import * as $ from 'jquery';
import {Blueprint, BlueprintSet} from '@/types/types';
import {dupes, dupeSets} from '@/config/dupes';

import { DuplicatePart } from './components/DuplicatePart';

import initGlobals from '@/utils/globals';
import { DuplicateSet } from './components/DuplicateSet';

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
}

const interval = setInterval(() => {
    if (document.querySelector('.list.box-container > .set.box') && document.querySelector('.wishlist.active')) {
        clearInterval(interval);
        main();
    }
}, 100);