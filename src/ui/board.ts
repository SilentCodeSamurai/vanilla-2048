import { Coordinates, Direction, TileMoveEvent, TileSpawnEvent } from "../types";

import { BaseUISection } from "./base";
import { TURN_ANIMATION_DURATION } from "../constants";
import { safeQuerySelector } from "../utils";

const MIN_FIELD_SIZE = 500;
const FIELD_PADDING = 40;
const EPIC_SHADOW_MIN_POWER = 11;

export class BoardUISection extends BaseUISection {
	private gameSize: number;

	private onMakeTurn: (direction: Direction) => void;
	private isActive: boolean;

	private touchStart: Coordinates | null = null;

	private get fieldSize() {
		return Math.min(window.innerWidth - FIELD_PADDING, MIN_FIELD_SIZE);
	}

	constructor({ gameSize, onMakeTurn }: { gameSize: number; onMakeTurn: (direction: Direction) => void }) {
		super();
		this.gameSize = gameSize;
		this.onMakeTurn = onMakeTurn;

		this.element = safeQuerySelector<HTMLDivElement>("#board");
		this.setBoardSize(this.fieldSize);
		this.isActive = false;

		window.addEventListener("resize", this.handleResize.bind(this));
		this.element.addEventListener("touchstart", this.handleTouchStart.bind(this));
		this.element.addEventListener("touchend", this.handleTouchEnd.bind(this));
		document.addEventListener("keydown", this.handleKeyDown.bind(this));
	}

	public show() {
		this.isActive = true;
		super.show();
	}

	public hide() {
		this.isActive = false;
		super.hide();
	}

	public updateGameSize(gameSize: number) {
		this.gameSize = gameSize;
		this.handleResize();
	}

	public addTile(event: TileSpawnEvent) {
		const tile = document.createElement("div");
		tile.classList.add("tile");
		tile.dataset.id = event.spawnedTile.id.toString();
		tile.style.transition = `transform ${TURN_ANIMATION_DURATION}ms cubic-bezier(.32,.74,.5,1.22), background-color 200ms ease-in-out, box-shadow 200ms ease-in-out`;
		tile.style.willChange = "transform, background-color, box-shadow";

		const shadow = document.createElement("div");
		shadow.classList.add("tile-shadow");
		if (event.spawnedTile.power < EPIC_SHADOW_MIN_POWER) {
			shadow.classList.add("hidden");
		}

		const value = document.createElement("span");
		value.textContent = (2 ** event.spawnedTile.power).toString();
		value.classList.add("tile-value");

		this.setTileSize(tile, this.fieldSize / this.gameSize);
		this.setTilePosition(tile, event.coordinates, this.gameSize, this.fieldSize);
		this.setTilePower(tile, event.spawnedTile.power);

		this.setTileValue(value, this.fieldSize / this.gameSize, event.spawnedTile.power);

		tile.appendChild(value);
		tile.appendChild(shadow);

		this.element.appendChild(tile);
	}

	public updateTilePower(tileId: number, power: number) {
		const tile = this.getTile(tileId);
		const tileValue = this.getTileValueElement(tile);
		this.setTilePower(tile, power);
		const tileSize = Number(tile.dataset.size);
		this.setTileValue(tileValue, tileSize, power);
		if (power >= EPIC_SHADOW_MIN_POWER) {
			const tileShadow = tile.querySelector(".tile-shadow") as HTMLDivElement;
			tileShadow.classList.remove("hidden");
		}
	}

	public moveTile(move: TileMoveEvent) {
		const tile = this.getTile(move.id);
		this.setTilePosition(tile, move.to, this.gameSize, this.fieldSize);
	}

	public removeTile(tileId: number) {
		const tile = this.getTile(tileId);
		tile.remove();
	}

	public clear() {
		this.element.innerHTML = "";
	}

	private getTile(tileId: number): HTMLDivElement {
		return safeQuerySelector<HTMLDivElement>(`[data-id="${tileId}"]`);
	}

	private getTileValueElement(tile: HTMLDivElement): HTMLSpanElement {
		return tile.querySelector(".tile-value") as HTMLSpanElement;
	}

	private setTileValue(tileValueElement: HTMLSpanElement, size: number, power: number) {
		tileValueElement.style.lineHeight = `${size}px`
		tileValueElement.style.fontSize = `${size / 2.2 - power}px`
		tileValueElement.textContent = (2 ** power).toString();
	}

	private setTileSize(tile: HTMLDivElement, size: number) {
		const tileSize = size - 10;
		tile.dataset.size = tileSize.toString();
		tile.style.width = `${tileSize}px`;
		tile.style.height = `${tileSize}px`;
	}

	private setTilePosition(tile: HTMLDivElement, position: Coordinates, gameSize: number, fieldSize: number) {
		tile.dataset.x = position.x.toString();
		tile.dataset.y = position.y.toString();
		tile.style.transform = `translate3d(${(position.x * fieldSize) / gameSize + 5}px, ${
			(position.y * fieldSize) / gameSize + 5
		}px, 0px) scale(1)`;
	}

	private setTilePower(tile: HTMLDivElement, power: number) {
		tile.dataset.power = power.toString();
		tile.style.backgroundColor = `var(--tile-${power})`;
		tile.style.boxShadow = `0 0 ${power / 2}px ${power / 2}px var(--tile-${power})`;
	}

	private setBoardSize(size: number) {
		this.element.style.width = `${size}px`;
		this.element.style.height = `${size}px`;
	}

	private handleResize() {
		this.setBoardSize(this.fieldSize);
		for (const tile of this.element.children) {
			if (!(tile instanceof HTMLDivElement)) continue;
			this.setTileSize(tile, this.fieldSize / this.gameSize);
			const x = Number(tile.dataset.x);
			const y = Number(tile.dataset.y);
			this.setTilePosition(tile, { x, y }, this.gameSize, this.fieldSize);
		}
	}

	private handleMakeTurn(direction: Direction) {
		if (!this.isActive) return;
		this.onMakeTurn(direction);
	}

	private handleKeyDown(event: KeyboardEvent) {
		const key = event.key;
		if (key.toLowerCase() === "r") return;
		if (!key.includes("Arrow")) return;
		const direction = key.replace("Arrow", "").toUpperCase();
		if (direction !== "LEFT" && direction !== "RIGHT" && direction !== "UP" && direction !== "DOWN") return;
		this.handleMakeTurn(direction);
	}

	private handleTouchStart(event: TouchEvent) {
		const target = event.target as HTMLElement | null;
		if (target?.tagName === "BUTTON") return;
		event.preventDefault();
		const touch = event.touches[0];
		const x = touch.clientX;
		const y = touch.clientY;
		this.touchStart = { x, y };
	}

	private handleTouchEnd(event: TouchEvent) {
		if (!this.touchStart) return;
		const touch = event.changedTouches[0];
		const x = touch.clientX;
		const y = touch.clientY;
		const deltaX = x - this.touchStart.x;
		const deltaY = y - this.touchStart.y;
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			if (deltaX > 0) {
				this.handleMakeTurn("RIGHT");
			} else {
				this.handleMakeTurn("LEFT");
			}
		} else {
			if (deltaY > 0) {
				this.handleMakeTurn("DOWN");
			} else {
				this.handleMakeTurn("UP");
			}
		}
	}
}
