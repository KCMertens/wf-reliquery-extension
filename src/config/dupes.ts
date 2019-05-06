import {Blueprint} from '@/types/types';

const dupes: {
    [K in Blueprint]?: Blueprint[];
} = {
    "Akbolto Prime Blueprint": [
        "Akbolto Prime Barrel",
        "Akbolto Prime Receiver",
    ],
    "Akjagara Prime Receiver": [
        "Akjagara Prime Barrel",
        "Akjagara Prime Receiver",
    ]
};

export default dupes;
