import "./style.css";

import { Coordinates, Direction, FieldState } from "./types";
import { calculateTurn, checkIfGameIsOver, getFreeCoordinates } from "./utils";
import { getSavedHighScore, setSavedHighScore } from "./storage";

import { TURN_ANIMATION_DURATION } from "./constants";

const scoreElement = document.getElementById("score") as HTMLSpanElement;
const turnElement = document.getElementById("turn") as HTMLSpanElement;
const boardElement = document.getElementById("board") as HTMLDivElement;

const menuElement = document.getElementById("menu") as HTMLDivElement;
const menu3x3ButtonElement = document.getElementById("3x3") as HTMLButtonElement;
const menu4x4ButtonElement = document.getElementById("4x4") as HTMLButtonElement;
const menu5x5ButtonElement = document.getElementById("5x5") as HTMLButtonElement;
const menuPlayButtonElement = document.getElementById("menu-play") as HTMLButtonElement;

const gameOverElement = document.getElementById("game-over") as HTMLDivElement;
const newHighScoreElement = document.getElementById("new-high-score") as HTMLSpanElement;
const oldHighScoreElement = document.getElementById("old-high-score") as HTMLSpanElement;
const highScoreElement = document.getElementById("high-score") as HTMLSpanElement;
const gameOverPlayAgainButtonElement = document.getElementById("game-over-play-again") as HTMLButtonElement;
const gameOverOpenMenuButtonElement = document.getElementById("game-over-open-menu") as HTMLButtonElement;

const pauseButtonElement = document.getElementById("pause") as HTMLButtonElement;
const pauseMenuElement = document.getElementById("pause-menu") as HTMLDivElement;
const pauseMenuNewGameButtonElement = document.getElementById("pause-menu-new-game") as HTMLButtonElement;
const pauseMenuContinueButtonElement = document.getElementById("pause-menu-continue") as HTMLButtonElement;

let gameSize = 4;
let turn = 0;
let score = 0;

let fieldState: FieldState = { tiles: [] };

let animating = false;

let latestTileId = 0;
let fieldSize = 400;
let touchStart: { x: number; y: number } | null = null;

function showMenu() {
	menuElement.classList.remove("hidden");
}

function hideMenu() {
	menuElement.classList.add("hidden");
}

function setGameSize(size: number) {
	gameSize = size;
}

function showGameOver() {
	gameOverElement.classList.remove("hidden");
}

function hideGameOver() {
	gameOverElement.classList.add("hidden");
}

function setScore(score: number) {
	scoreElement.textContent = score.toString();
}

function scorePoints(scoreToAdd: number) {
	score += scoreToAdd;
	setScore(score);
}

function setTurn(turn: number) {
	turnElement.textContent = turn.toString();
}

function setHighScore(score: number) {
	highScoreElement.textContent = score.toString();
}

function showNewHighScore() {
	newHighScoreElement.classList.remove("hidden");
}

function hideNewHighScore() {
	newHighScoreElement.classList.add("hidden");
}

function showOldHighScore() {
	oldHighScoreElement.classList.remove("hidden");
}

function hideOldHighScore() {
	oldHighScoreElement.classList.add("hidden");
}

function showPauseMenu() {
	pauseMenuElement.classList.remove("hidden");
	pauseButtonElement.classList.add("hidden");
}

function hidePauseMenu() {
	pauseMenuElement.classList.add("hidden");
}

function incrementTurn() {
	turn += 1;
	setTurn(turn);
}

function resetInfo() {
	score = 0;
	turn = 0;
	setScore(score);
	setTurn(turn);
}

function clearField() {
	for (const tile of fieldState.tiles) {
		const tileElement = getTile(tile.id)!;
		boardElement.removeChild(tileElement);
	}
	fieldState.tiles = [];
	latestTileId = 0;
}

const startNewGame = () => {
	hideGameOver();
	clearField();
	resetInfo();
	hidePauseMenu();
	hideMenu();
	spawnTile();
	pauseButtonElement.classList.remove("hidden");
	boardElement.focus();
};

const continueGame = () => {
	hidePauseMenu();
	pauseButtonElement.classList.remove("hidden");
	boardElement.focus();
};

function gameOver() {
	const savedHighScore = getSavedHighScore(gameSize);
	if (score > savedHighScore) {
		setHighScore(score);
		setSavedHighScore(gameSize, score);
		hideOldHighScore();
		showNewHighScore();
	} else {
		setHighScore(savedHighScore);
		hideNewHighScore();
		showOldHighScore();
	}
	showGameOver();
}

function setTileSize(tile: HTMLDivElement) {
	const size = fieldSize / gameSize;
	tile.style.width = `${size - 10}px`;
	tile.style.height = `${size - 10}px`;
}

function setTilePosition(tile: HTMLDivElement, coordinates: Coordinates) {
	tile.style.transform = `translate3d(${(coordinates.x * fieldSize) / gameSize + 5}px, ${
		(coordinates.y * fieldSize) / gameSize + 5
	}px, 0px) scale(1)`;
}

function setTilePower(tile: HTMLDivElement, power: number) {
	tile.dataset.power = power.toString();
	tile.style.backgroundColor = `var(--tile-${power})`;
	tile.style.boxShadow = `0 0 ${power}px 1px var(--tile-${power})`;
}

function spawnTile() {
	const coordinates = getFreeCoordinates(fieldState, gameSize);
	if (!coordinates) {
		throw new Error("Tile spawn error: No free coordinates");
	}

	const id = ++latestTileId;
	const power = Math.random() < 0.7 ? 1 : 2;

	const tile = document.createElement("div");
	tile.classList.add("tile");
	tile.dataset.id = id.toString();
	tile.style.transition = `transform ${TURN_ANIMATION_DURATION}ms cubic-bezier(.32,.74,.5,1.22), background-color 200ms ease-in-out, box-shadow 200ms ease-in-out`;

	setTileSize(tile);
	setTilePosition(tile, coordinates);
	setTilePower(tile, power);

	const shadow = document.createElement("div");
	shadow.classList.add("tile-shadow");
	shadow.classList.add("hidden");

	const value = document.createElement("span");
	value.textContent = (2 ** power).toString();
	value.classList.add("tile-value");

	tile.appendChild(value);
	tile.appendChild(shadow);

	fieldState.tiles.push({
		id,
		coordinates,
		power,
	});
	boardElement.appendChild(tile);
	scorePoints(2 ** power);
}

function getTile(id: number): HTMLDivElement | null {
	return boardElement.querySelector(`.tile[data-id="${id}"]`);
}

function makeTurn(direction: Direction) {
	if (animating) return;
	const { newFieldState, newMergers, fieldChanged } = calculateTurn(gameSize, fieldState, direction);

	for (let i = 0; i < newFieldState.tiles.length; i++) {
		const newTile = newFieldState.tiles[i];
		const oldTile = fieldState.tiles.find((tile) => tile.id === newTile.id);
		if (!oldTile) continue;
		if (oldTile.coordinates.x !== newTile.coordinates.x || oldTile.coordinates.y !== newTile.coordinates.y) {
			const tileElement = getTile(newTile.id)!;
			setTilePosition(tileElement, newTile.coordinates);
		}
	}
	if (fieldChanged) {
		fieldState = newFieldState;
		animating = true;
		setTimeout(() => {
			const removedTileIds: number[] = [];
			for (const merger of newMergers) {
				const toTile = fieldState.tiles.find((tile) => tile.id === merger.toId);
				const fromTile = fieldState.tiles.find((tile) => tile.id === merger.fromId);
				if (!toTile || !fromTile) continue;

				removedTileIds.push(merger.fromId);
				const fromTileElement = getTile(fromTile.id)!;
				boardElement.removeChild(fromTileElement);

				toTile.power++;
				const toTileElement = getTile(toTile.id)!;
				setTilePower(toTileElement, toTile.power);
				scorePoints(2 ** toTile.power);

				const value = toTileElement.querySelector(".tile-value")!;
				value.textContent = (2 ** toTile.power).toString();
			}
			fieldState.tiles = fieldState.tiles.filter((tile) => !removedTileIds.includes(tile.id));
			spawnTile();
			if (checkIfGameIsOver(fieldState, gameSize)) {
				gameOver();
			}
			incrementTurn();
			animating = false;
		}, TURN_ANIMATION_DURATION);
	}
}

const handleKeyDown = (event: KeyboardEvent) => {
	const key = event.key;
	if (key.toLowerCase() === "r") return;
	if (!key.includes("Arrow")) return;
	const direction = key.replace("Arrow", "").toUpperCase();
	if (direction !== "LEFT" && direction !== "RIGHT" && direction !== "UP" && direction !== "DOWN") return;
	makeTurn(direction);
};

const handleTouchStart = (event: TouchEvent) => {
	const target = event.target as HTMLElement | null;
	if (target?.tagName === "BUTTON") return;
	event.preventDefault();
	const touch = event.touches[0];
	const x = touch.clientX;
	const y = touch.clientY;
	touchStart = { x, y };
};

const handleTouchEnd = (event: TouchEvent) => {
	if (!touchStart) return;
	const touch = event.touches[0];
	const x = touch.clientX;
	const y = touch.clientY;
	const deltaX = x - touchStart.x;
	const deltaY = y - touchStart.y;
	if (Math.abs(deltaX) > Math.abs(deltaY)) {
		if (deltaX > 0) {
			makeTurn("RIGHT");
		} else {
			makeTurn("LEFT");
		}
	} else {
		if (deltaY > 0) {
			makeTurn("DOWN");
		} else {
			makeTurn("UP");
		}
	}
};

const handleResize = () => {
	const width = window.innerWidth;
	const newFieldSize = Math.min(width - 40, 500)
	fieldSize = newFieldSize;
	boardElement.style.width = `${newFieldSize}px`;
	boardElement.style.height = `${newFieldSize}px`;
	for (const tile of fieldState.tiles) {
		const tileElement = getTile(tile.id)!;
		setTileSize(tileElement);
		setTilePosition(tileElement, tile.coordinates);
	}
}

menuPlayButtonElement.addEventListener("click", startNewGame);
menu3x3ButtonElement.addEventListener("click", () => {
	setGameSize(3);
	menu3x3ButtonElement.classList.add("selected");
	menu4x4ButtonElement.classList.remove("selected");
	menu5x5ButtonElement.classList.remove("selected");
});
menu4x4ButtonElement.addEventListener("click", () => {
	setGameSize(4);
	menu3x3ButtonElement.classList.remove("selected");
	menu4x4ButtonElement.classList.add("selected");
	menu5x5ButtonElement.classList.remove("selected");
});
menu5x5ButtonElement.addEventListener("click", () => {
	setGameSize(5);
	menu3x3ButtonElement.classList.remove("selected");
	menu4x4ButtonElement.classList.remove("selected");
	menu5x5ButtonElement.classList.add("selected");
});

gameOverPlayAgainButtonElement.addEventListener("click", startNewGame);
gameOverOpenMenuButtonElement.addEventListener("click", () => {
	hideGameOver();
	showMenu();
});

pauseButtonElement.addEventListener("click", showPauseMenu);
pauseMenuNewGameButtonElement.addEventListener("click", () => {
	hidePauseMenu();
	showMenu();
});
pauseMenuContinueButtonElement.addEventListener("click", continueGame);

boardElement.addEventListener("keydown", handleKeyDown);
boardElement.addEventListener("touchstart", handleTouchStart);
boardElement.addEventListener("touchend", handleTouchEnd);

window.addEventListener("resize", handleResize);

handleResize();
