import {Blueprint, BlueprintSet} from '@/types/types';

export const dupes: {
    [K in BlueprintSet]?: Blueprint[];
} = {
    "Akbolto Prime": [
        "Akbolto Prime Barrel",
        "Akbolto Prime Receiver",
    ],
    "Akjagara Prime": [
        "Akjagara Prime Barrel",
        "Akjagara Prime Receiver",
    ],
};

export const dupeSets: BlueprintSet[] = [
    "Bronco Prime",
];
