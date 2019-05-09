import {Blueprint, BlueprintSet} from '@/types/types';

type TemplateInstance<K, T> = HTMLElement&{
    /** Toggle class "hidden" */
    showIf(cond: boolean): void;
    /** Toggle class "hidden" */
    hideIf(cond: boolean): void;
    /** Toggle class "hidden" */
    show(): void;
    /** Toggle class "hidden" */
    hide(): void;

    /** Get a child template */
    _<N extends keyof T>(name: N): TemplateInstance<N, T[N]>;

    /** Key of this element in its template parent */
    _key: K;
};

type BaseTemplate<K, T> = {
    _node: HTMLElement;
    new: () => TemplateInstance<K, T>
}
type TemplateShape = {
    wish: {
        item: {
            label: {
                check: {},
                text: {}
            }
        }
        set: {
            header: {
                name: {}
                wikilink: {}
                type: {}
            }
            parts: {}
        }
    }
    nav: {
        // don't care about this
    }
}
type TemplateHelper<P> = {
    [K in keyof P]: BaseTemplate<K, P[K]>&TemplateHelper<P[K]>
}
type Template = TemplateHelper<TemplateShape>;

var a: Template;


declare global {
    /** Contains every blueprint + forma */
    const wishlistMap: {
        [K in Blueprint]: HTMLElement;
    };

    /** Object.values(wishlistMap) */
    const wishlistNodes: HTMLElement[];

    /** Checked blueprints */
    let wishlistedItems: Blueprint[];

    /** Contains some mappings... not all sets however? */
    const partNamesWithoutBlueprint: {
        [K in Blueprint]?: BlueprintSet;
    }

    /** List of guids/user ids? Always only contains mainToken */
    const tokenList: string[];

    /** User ID */
    const mainToken: string;

    /** Data per user, always contains only the main user entry */
    const tokenData: {
        [mainToken: string]: {
            /** Dunno, always empty? */
            forma: any[];
            /** Equal to mainToken */
            guid: string;
            /** Always empty? */
            has: string[];
            /** Always empty? */
            mastered: string[];
            /** Friendly user name */
            name: string;
            private: boolean;
            /** Share key? */
            public_key: string;
            /** Equal to wishlistedItems */
            wants: Blueprint[];
        }
    }

    const tpl: Template;

    //----------------------------
    // Own globals below this line
    //----------------------------

    const sets: {
        [K in BlueprintSet]: HTMLDivElement;
    }
}
