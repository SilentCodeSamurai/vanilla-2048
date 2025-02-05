import { BaseUISection } from "./base";
import { safeQuerySelector } from "../utils";

export class MainMenuUISection extends BaseUISection {
	private size3ButtonElement: HTMLButtonElement;
	private size4ButtonElement: HTMLButtonElement;
	private size5ButtonElement: HTMLButtonElement;
	private playButtonElement: HTMLButtonElement;

	constructor({
		onSizeSelectClick,
		onPlayClick,
	}: {
		onSizeSelectClick: (size: number) => void;
		onPlayClick: () => void;
	}) {
		super();
		this.element = safeQuerySelector<HTMLDivElement>("#main-menu");
		this.size3ButtonElement = safeQuerySelector<HTMLButtonElement>("#size-3", this.element);
		this.size4ButtonElement = safeQuerySelector<HTMLButtonElement>("#size-4", this.element);
		this.size5ButtonElement = safeQuerySelector<HTMLButtonElement>("#size-5", this.element);
		this.playButtonElement = safeQuerySelector<HTMLButtonElement>("#play", this.element);

		this.size3ButtonElement.addEventListener("click", () => {
			this.switchSelectedSize(3);
			onSizeSelectClick(3);
		});
		this.size4ButtonElement.addEventListener("click", () => {
			this.switchSelectedSize(4);
			onSizeSelectClick(4);
		});
		this.size5ButtonElement.addEventListener("click", () => {
			this.switchSelectedSize(5);
			onSizeSelectClick(5);
		});
		this.playButtonElement.addEventListener("click", onPlayClick);
	}

	private switchSelectedSize(size: number) {
		if (size === 3) {
			this.size3ButtonElement.classList.add("selected");
			this.size4ButtonElement.classList.remove("selected");
			this.size5ButtonElement.classList.remove("selected");
		} else if (size === 4) {
			this.size3ButtonElement.classList.remove("selected");
			this.size4ButtonElement.classList.add("selected");
			this.size5ButtonElement.classList.remove("selected");
		} else if (size === 5) {
			this.size3ButtonElement.classList.remove("selected");
			this.size4ButtonElement.classList.remove("selected");
			this.size5ButtonElement.classList.add("selected");
		} else {
			throw new Error("Invalid size");
		}
	}
}
