import { BaseUISection } from "./base";
import { safeQuerySelector } from "../utils";

export class PauseMenuUISection extends BaseUISection {
	private resumeButtonElement: HTMLButtonElement;
	private newGameButtonElement: HTMLButtonElement;

	constructor({ onResumeClick, onNewGameClick }: { onResumeClick: () => void; onNewGameClick: () => void }) {
		super();
		this.element = safeQuerySelector<HTMLDivElement>("#pause-menu");
		this.resumeButtonElement = safeQuerySelector<HTMLButtonElement>("#resume", this.element);
		this.newGameButtonElement = safeQuerySelector<HTMLButtonElement>("#new-game", this.element);

		this.resumeButtonElement.addEventListener("click", onResumeClick);
		this.newGameButtonElement.addEventListener("click", onNewGameClick);
	}
}
