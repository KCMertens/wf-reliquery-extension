import '@/types/globals';

// import * as $ from 'jquery';
import {Blueprint, BlueprintSet} from '@/types/types';

let sets: {
    [K in BlueprintSet]?: {
        /** List of bpIds, might contains dupes if more than one is required */
        blueprints: Blueprint[];
    }
} = {};

import dupes from '@/config/dupes';

let uuid = (() => {
    let i = 0;
    return (key: string) => `${key}_${i++}`;
})();

function main() {
    for(const [bp, dupedParts] of Object.entries(dupes) as Array<[Blueprint, Blueprint[]]>) {
        dupedParts.forEach(bp => {
            const id = uuid(bp);
            wishlistMap[bp].append(`<label for="${id}" style="outline: 1px solid red;"><input type="checkbox" value="${bp}" id="${id}"> ${bp} (duplicate)</label>`);
        });
    }
}

const interval = setInterval(() => {
    if (document.querySelector('.list.box-container > .set.box') != null) {
        clearInterval(interval);
        main();
    }
}, 100);