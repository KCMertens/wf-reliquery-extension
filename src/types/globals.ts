import {Blueprint, BlueprintSet} from '@/types/types';

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
}
