import '@/types/globals';

// import * as $ from 'jquery';
import {Blueprint, BlueprintSet} from '@/types/types';
import {dupes, dupeSets} from '@/config/dupes';

import { DuplicatePart } from './components/DuplicatePart';

import initGlobals from '@/utils/globals';
import { DuplicateSet } from './components/DuplicateSet';
import { CompletableSet } from './components/CompletableSet';
import { createElement, insertAfter } from './utils/utils';

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
        const joinedWants = new Set<Blueprint>();
        tokenArray.forEach(data => data.wants.forEach(v => joinedWants.add(v)))
        duplicateParts.filter(p => p.isChecked()).forEach(p => joinedWants.add(p.id));

        listCompletedRelics(joinedWants);

        originalRenderReliquary(tokenArray.map(data => ({
            ...data,
            wants: Array.of(...joinedWants.keys())
        })));
    };
}


function listCompletedRelics(wants: Set<Blueprint>) {
    const old = document.querySelector('#completedrelics');
    if (old) { old.parentElement!.removeChild(old); }


    const completedRelics = Object.values(relicData.relics).filter(r => {
        return r.rewards.every(rw => !wants.has(rw.name));
    })
    .map(r => r.name);

    const types = ['Lith', 'Meso', 'Neo', 'Axi'];
    const el = createElement(`
        <div id="completedrelics">
            <ul style="list-style: none;">${types.map((s, i) => `<li><a data-target="completed-${s}">${s}</a></li>`).join('')}</ul>
            ${
                types.map((t, i) => `
                    <div class="completed-relics-tab" id="completed-${t}" style="display:${i === 0 ? 'block': 'none'}">
                        ${
                            completedRelics.filter(r => r.startsWith(t)).sort().map(r => `<div>${r} ${relicData.relics[r].vaulted ? '(v)' : ''}</div>`).join('')
                        }
                    </div>
                `).join('')
            }
        </div>
    `)

    Array.of(...el.querySelectorAll('a[data-target]')).forEach((e: HTMLElement) => {
        const targetId = e.dataset.target;
        e.addEventListener('click', event => {
            document.querySelectorAll('.completed-relics-tab').forEach((el: HTMLDivElement) => el.style.display = el.id === targetId ? 'block' : 'none');
        })
    })

    insertAfter(el, document.querySelector('.reliquary .legend')!);
}

const interval = setInterval(() => {
    if (document.querySelector('.list.box-container > .set.box') && document.querySelector('.wishlist.active')) {
        clearInterval(interval);
        main();
    }
}, 100);