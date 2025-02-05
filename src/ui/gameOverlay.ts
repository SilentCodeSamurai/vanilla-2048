import { BaseUISection } from "./base";
import { safeQuerySelector } from "../utils";

export class GameOverlayUISection extends BaseUISection {
	private scoreElement: HTMLSpanElement;
	private turnElement: HTMLSpanElement;
	private pauseButtonElement: HTMLButtonElement;

	constructor({ onPauseClick }: { onPauseClick: () => void }) {
		super();
		this.element = safeQuerySelector<HTMLDivElement>("#game-overlay");
		this.scoreElement = safeQuerySelector<HTMLSpanElement>("#score", this.element);
		this.turnElement = safeQuerySelector<HTMLSpanElement>("#turn", this.element);
		this.pauseButtonElement = safeQuerySelector<HTMLButtonElement>("#pause", this.element);
		this.pauseButtonElement.addEventListener("click", onPauseClick);
	}

	public update({ score, turn }: { score?: number; turn?: number }) {
		if (score !== undefined) {
			this.scoreElement.textContent = score.toString();
		}
		if (turn !== undefined) {
			this.turnElement.textContent = turn.toString();
		}
	}
}
