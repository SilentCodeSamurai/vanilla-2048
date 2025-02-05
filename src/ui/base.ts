export abstract class BaseUISection {
	protected element!: HTMLDivElement;

	public show() {
		this.element.classList.remove("hidden");
	}

	public hide() {
		this.element.classList.add("hidden");
	}
}
