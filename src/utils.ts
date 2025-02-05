export function safeQuerySelector<T extends HTMLElement>(selector: string, parent?: HTMLElement) {
	const element = parent ? parent.querySelector<T>(selector) : document.querySelector<T>(selector);
	if (!element) {
		throw new Error(`Element not found: ${selector}${parent && " parent: " + parent}`);
	}
	return element;
}

export function weightedChoice<T>(items: { value: T; weight: number }[]): T {
	const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
	const randomWeight = Math.random() * totalWeight;
	let cumulativeWeight = 0;
	for (const item of items) {
		cumulativeWeight += item.weight;
		if (randomWeight < cumulativeWeight) {
			return item.value;
		}
	}
	throw new Error("Unexpected error");
}
