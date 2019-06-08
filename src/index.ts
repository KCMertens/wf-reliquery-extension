import URI from 'urijs';

import '@/types/globals';
import '@/style/style.scss';

import { Blueprint, BlueprintSet } from '@/types/types';
import { dupes, dupeSets} from '@/config/dupes';

import { DuplicatePart } from './components/DuplicatePart';

import initGlobals from '@/utils/globals';
import { DuplicateSet } from '@/components/DuplicateSet';
import { CompletableSet } from '@/components/CompletableSet';
import { createElement, insertAfter } from '@/utils/utils';

const shareQueryKey = 'extension-info';

function main() {
    initGlobals();

    for(const [set, dupedParts] of Object.entries(dupes) as Array<[BlueprintSet, Blueprint[]]>) {
        dupedParts.forEach(bp => new DuplicatePart(set, bp));
    }

    for (const set of dupeSets) {
        new DuplicateSet(set);
    }

    Object.keys(sets).forEach((s: BlueprintSet) => new CompletableSet(s, false));
    Object.keys(duplicateSets).forEach((s: BlueprintSet) => new CompletableSet(s, true));

    // @ts-ignore
    const originalRenderReliquary = renderReliquary;

    // @ts-ignore
    renderReliquary = function renderReliquery(tokenArray: Array<{wants: Blueprint[]}>) {
        const joinedWants = new Set<Blueprint>();
        tokenArray.forEach(data => data.wants.forEach(v => joinedWants.add(v)))
        duplicateParts.filter(p => p.isChecked()).forEach(p => joinedWants.add(p.id));

        listCompletedRelics(joinedWants);

        originalRenderReliquary(tokenArray.map(data => ({
            ...data,
            wants: Array.of(...joinedWants.keys())
        })));
    };

    const shareButtonContainer = createElement(`<div class="button-set"></div>`);
    const shareButton = createElement(`<div class="share">Share</div>`);
    shareButton.addEventListener('click', () => {
        var el = document.createElement('textarea');
        // Set value (string to be copied)
        el.value = getShareUrl();
        // Set non-editable to avoid focus and move outside of view
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        // Select text inside element
        el.select();
        // Copy text to clipboard
        document.execCommand('copy');
        // Remove temporary element
        document.body.removeChild(el);

        shareButton.textContent = ' Copied! '
        setTimeout(() => { shareButton.textContent = 'Share' }, 3000);
    });

    (document.getElementById('settings') as HTMLDivElement).appendChild(shareButtonContainer);
    shareButtonContainer.appendChild(shareButton);
}

function getShareUrl() {
    const completableSetState = completableSets.map(set => ({ [set.key.replace(mainToken, '')]: set.load() })).reduce((all, cur) => Object.assign(all, cur), {});
    const duplicatePartState = duplicateParts.map(part => ({ [part.key.replace(mainToken, '')]: part.load()})).reduce((all, cur) => Object.assign(all, cur), {});

    const completeState = Object.assign({}, completableSetState, duplicatePartState);
    const value = btoa(JSON.stringify(completeState));

    return new URI().addSearch({ [shareQueryKey]: value }).toString();
}

function listCompletedRelics(wants: Set<Blueprint>) {
    const old = document.querySelector('#completedrelics');
    if (old) { old.parentElement!.removeChild(old); }

    const completedRelics = Object.values(relicData.relics).filter(r => {
        return r.rewards.every(rw => !wants.has(rw.name));
    })
    // @ts-ignore (boolean as int is valid)
    .sort((l, r) => r.vaulted !== l.vaulted ? l.vaulted - r.vaulted : l.name.localeCompare(r.name));

    const types = ['Lith', 'Meso', 'Neo', 'Axi'];
    const el = createElement(`
        <div id="completedrelics">
            <ul style="list-style: none;">${types.map((s, i) => `<li><a data-target="completed-${s}" class="${i === 0 ? 'active': ''}">${s}</a></li>`).join('')}</ul>
            ${
                types.map((t, i) => `
                    <div class="completed-relics-tab ${i === 0 ? 'active': ''}" id="completed-${t}">
                        <table>
                        ${
                            completedRelics
                            .filter(r => r.name.startsWith(t))
                            .map(r => `
                                <tr>
                                    <td>${r.name}</td><td> ${relicData.relics[r.name].vaulted ? '(v)' : ''}</td>
                                </tr>`
                            )
                            .join('')
                        }
                        </table>
                    </div>
                `).join('')
            }
        </div>
    `)

    const tabs = Array.of(...el.querySelectorAll('a[data-target]')) as HTMLAnchorElement[];
    const tabContents = Array.of(...el.querySelectorAll('.completed-relics-tab')) as HTMLDivElement[];
    tabs.forEach(tab => {
        const targetId = tab.dataset.target as string;
        const thisTabContent = tabContents.find(e => e.id === targetId)!

        tab.addEventListener('click', function(e: Event) {
            tabs.forEach(t => t.classList.toggle('active', t === tab));
            tabContents.forEach(t => t.classList.toggle('active', t === thisTabContent));
        })
    })

    insertAfter(el, document.querySelector('.reliquary .legend')!);
}

let loaded = false;
declare var unsafeWindow: Window;
let originalSetTabImpl: (tab: string) => void = (unsafeWindow as any).setTab;
let setTabImpl = async function(tab: string) {
    originalSetTabImpl(tab);
    if (!loaded && tab !== 'welcome') {
        loaded = true;
        main();
    }
}
if (!originalSetTabImpl) {
    // add interceptor
    Object.defineProperty(unsafeWindow, 'setTab', {
        get() {
            return originalSetTabImpl ? setTabImpl : originalSetTabImpl;
        },
        set(v: any) {
            originalSetTabImpl = v;
        },
        configurable: false,
        enumerable: true,
    })
} else {
    (unsafeWindow as any).setTab = setTabImpl;
}

// load initial query param state
const uri = new URI();
const queryParams = uri.search(true);
debugger;
if (queryParams[shareQueryKey]) {
    const state = JSON.parse(atob(queryParams[shareQueryKey]));
    const mainToken = uri.segmentCoded()[0];
    if (mainToken && !mainToken.includes(',')) {
        Object.entries(state).forEach(([key, value]) => {
            localStorage.setItem(mainToken + key, JSON.stringify(value))
        });
    }

    history.replaceState(history.state, "", new URI().removeSearch(shareQueryKey).toString());
}
