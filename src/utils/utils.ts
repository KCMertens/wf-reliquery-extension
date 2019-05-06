type MapOf<T> = {
	[key: string]: T;
};

type KeysOfType<Base, Condition> = keyof Pick<Base, {
	[Key in keyof Base]: Base[Key] extends Condition ? Key : never
}[keyof Base]>;

export function makeMapReducer<T>(k: KeysOfType<T, string>): (m: MapOf<T>, t: T) => MapOf<T> {
	return (acc: MapOf<T>, v: T): MapOf<T> => {
		const kv = v[k] as any as string;
		acc[kv] = v;
		return acc;
	};
}

export function reductio<T>(t: T[]|undefined|null, k: KeysOfType<T, string>): MapOf<T> {
	return t ? t.reduce(makeMapReducer<T>(k), {}) : {};
}
