import { BaseUISection } from "./base";
import { safeQuerySelector } from "../utils";

export class GameOverMenuUISection extends BaseUISection {
	private newHighScoreLabelElement: HTMLSpanElement;
	private oldHighScoreLabelElement: HTMLSpanElement;
	private highScoreElement: HTMLSpanElement;
	private playAgainButtonElement: HTMLButtonElement;
	private openMainMenuButtonElement: HTMLButtonElement;

	constructor({
		onPlayAgainClick,
		onOpenMainMenuClick,
	}: {
		onPlayAgainClick: () => void;
		onOpenMainMenuClick: () => void;
	}) {
		super();
		this.element = safeQuerySelector<HTMLDivElement>("#game-over-menu");
		this.newHighScoreLabelElement = safeQuerySelector<HTMLSpanElement>("#new-high-score-label", this.element);
		this.oldHighScoreLabelElement = safeQuerySelector<HTMLSpanElement>("#old-high-score-label", this.element);
		this.highScoreElement = safeQuerySelector<HTMLSpanElement>("#high-score", this.element);
		this.playAgainButtonElement = safeQuerySelector<HTMLButtonElement>("#play-again", this.element);
		this.openMainMenuButtonElement = safeQuerySelector<HTMLButtonElement>("#open-main-menu", this.element);

		this.playAgainButtonElement.addEventListener("click", onPlayAgainClick);
		this.openMainMenuButtonElement.addEventListener("click", onOpenMainMenuClick);
	}

	public setResult({ newHighScore, highScore }: { newHighScore: boolean; highScore: number }) {
		if (newHighScore) {
			this.newHighScoreLabelElement.classList.remove("hidden");
			this.oldHighScoreLabelElement.classList.add("hidden");
		} else {
			this.newHighScoreLabelElement.classList.add("hidden");
			this.oldHighScoreLabelElement.classList.remove("hidden");
		}
		this.highScoreElement.textContent = highScore.toString();
	}
}
