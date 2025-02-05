declare global {
	interface Window {
		game: Game;
	}
}

import "./style.css";

import { DEFAULT_GAME_SIZE, TURN_ANIMATION_DURATION } from "./constants";
import { getSavedHighScore, setSavedHighScore } from "./storage";

import { BaseUISection } from "./ui/base";
import { BoardUISection } from "./ui/board";
import { Direction } from "./types";
import { GameOverMenuUISection } from "./ui/gameOverMenu";
import { GameOverlayUISection } from "./ui/gameOverlay";
import { GameRound } from "./round";
import { MainMenuUISection } from "./ui/mainMenu";
import { PauseMenuUISection } from "./ui/pauseMenu";

type ViewLabel = "MAIN_MENU" | "BOARD" | "PAUSE_MENU" | "GAME_OVER";

class Game {
	private gameSize: number;

	private round: GameRound | null = null;

	private mainMenu: MainMenuUISection;
	private gameOverlay: GameOverlayUISection;
	private board: BoardUISection;
	private pauseMenu: PauseMenuUISection;
	private gameOverMenu: GameOverMenuUISection;

	private turnBlocked: boolean = false;
	private turnQueue: Direction[] = [];

	constructor() {
		this.gameSize = DEFAULT_GAME_SIZE;

		this.mainMenu = new MainMenuUISection({
			onSizeSelectClick: this.changeGameSize.bind(this),
			onPlayClick: this.startNewGame.bind(this),
		});
		this.gameOverlay = new GameOverlayUISection({ onPauseClick: this.pauseGame.bind(this) });
		this.board = new BoardUISection({ gameSize: this.gameSize, onMakeTurn: this.handleMakeTurn.bind(this) });
		this.pauseMenu = new PauseMenuUISection({
			onResumeClick: this.pauseResumeGame.bind(this),
			onNewGameClick: this.pauseStartNewGame.bind(this),
		});
		this.gameOverMenu = new GameOverMenuUISection({
			onPlayAgainClick: this.startNewGame.bind(this),
			onOpenMainMenuClick: this.gameOverOpenMainMenu.bind(this),
		});
	}

	private changeGameSize(gameSize: number) {
		this.gameSize = gameSize;
		this.board.updateGameSize(gameSize);
	}

	private startNewGame() {
		this.round = new GameRound({ gameSize: this.gameSize });
		this.board.clear()

		const spawn = this.round.spawnTile();
		if (spawn) {
			this.board.addTile(spawn);
		}
		this.toggleView("BOARD");
	}

	private showGameOver(score: number) {
		let newHighScore = false;
		const savedHighScore = getSavedHighScore(this.gameSize);
		let highScore = savedHighScore;
		if (score > savedHighScore) {
			newHighScore = true;
			highScore = score;
			setSavedHighScore(this.gameSize, score);
		}
		this.gameOverMenu.setResult({ highScore, newHighScore });
		this.toggleView("GAME_OVER");
	}

	private handleMakeTurn(direction: Direction) {
		if (!this.round) return;

		if (this.turnBlocked) {
			this.turnQueue.push(direction);
			return;
		};

		this.turnBlocked = true;
		const { moves, mergers, totalScore: score, spawn, gameOver, turnsPlayed: turn } = this.round.makeTurn(direction);
		for (const move of moves) {
			this.board.moveTile(move);
		}
		
		setTimeout(() => {
			for (const merger of mergers) {
				this.board.removeTile(merger.id)
				this.board.updateTilePower(merger.withId, merger.newPower);
			}
			this.gameOverlay.update({ score, turn });
			if (spawn) {
				this.board.addTile(spawn);
			}
			if (gameOver) {
				this.showGameOver(score);
			}
			this.turnBlocked = false;

			if (this.turnQueue.length > 0) {
				const nextDirection = this.turnQueue.shift();
				if (nextDirection) {
					this.handleMakeTurn(nextDirection);
				}
			}
		}, TURN_ANIMATION_DURATION)
	}

	private pauseGame() {
		this.toggleView("PAUSE_MENU");
	}

	private pauseResumeGame() {
		this.toggleView("BOARD");
	}

	private pauseStartNewGame() {
		this.board.clear();
		this.round = null;
		this.toggleView("MAIN_MENU");
	}

	private gameOverOpenMainMenu() {
		this.toggleView("MAIN_MENU");
	}

	private toggleView(view: ViewLabel) {
		const views: Record<ViewLabel, Array<BaseUISection>> = {
			MAIN_MENU: [this.mainMenu],
			BOARD: [this.board, this.gameOverlay],
			PAUSE_MENU: [this.pauseMenu],
			GAME_OVER: [this.gameOverMenu],
		};

		for (const [key, value] of Object.entries(views)) {
			if (key === view) {
				value.forEach((v) => v.show());
			} else {
				value.forEach((v) => v.hide());
			}
		}
	}

	public showAllTilesDemo() {
		if (!this.round) return;
		const events = this.round.spawnAllTilesDemo();
		for (const event of events) {
			this.board.addTile(event);
		}
	}
}

window.addEventListener("load", () => {
	window.game = new Game();
});
