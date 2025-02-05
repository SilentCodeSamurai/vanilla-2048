import { Board, Coordinates, Tile, TileMergerEvent, TileMoveEvent, TileSpawnEvent } from "./types";

import { SPAWN_TILE_POWERS } from "./constants";
import { weightedChoice } from "./utils";

type MakeTurnReturn = {
	moves: TileMoveEvent[];
	mergers: TileMergerEvent[];
	spawn: TileSpawnEvent | null;
	gameOver: boolean;
	totalScore: number;
	turnsPlayed: number;
};

export class GameRound {
	private gameSize: number;
	private gameSizeTileSpawnPowers: { value: number; weight: number }[];

	private board: Board;
	private lastSpawnedId: number = 0;
	private turnsPlayed: number = 0;
	private totalScore: number = 0;

	private generateBoard(): Board {
		return Array.from({ length: this.gameSize }, (_) => Array.from({ length: this.gameSize }, (_) => null));
	}

	constructor({ gameSize }: { gameSize: number }) {
		this.gameSize = gameSize;
		this.gameSizeTileSpawnPowers = SPAWN_TILE_POWERS[this.gameSize];

		this.board = this.generateBoard();
		this.lastSpawnedId = 0;
		this.turnsPlayed = 0;
	}

	public makeTurn(direction: "UP" | "RIGHT" | "DOWN" | "LEFT"): MakeTurnReturn {
		const moves: TileMoveEvent[] = [];
		const mergers: TileMergerEvent[] = [];

		if (direction === "LEFT") {
			for (let i = 0; i < this.gameSize; i++) {
				const row = this.board[i].slice();
				const getMoveCoords = (iteratingOverValue: number) => ({
					x: iteratingOverValue,
					y: i,
				});
				const { lineMoves, lineMergers, lineScore } = this.processLine(row, getMoveCoords);
				moves.push(...lineMoves);
				mergers.push(...lineMergers);

				this.totalScore += lineScore;
				this.board[i] = row;
			}
		} else if (direction === "RIGHT") {
			for (let i = 0; i < this.gameSize; i++) {
				const row = this.board[i].slice().reverse();
				const getMoveCoords = (iteratingOverValue: number) => ({
					x: this.gameSize - iteratingOverValue - 1,
					y: i,
				});
				const { lineMoves, lineMergers, lineScore } = this.processLine(row, getMoveCoords);
				moves.push(...lineMoves);
				mergers.push(...lineMergers);

				this.totalScore += lineScore;
				row.reverse();
				this.board[i] = row;
			}
		} else if (direction === "UP") {
			for (let i = 0; i < this.gameSize; i++) {
				const column = this.board.map((row) => row[i]);
				const getMoveCoords = (iteratingOverValue: number) => ({
					x: i,
					y: iteratingOverValue,
				});
				const { lineMoves, lineMergers, lineScore } = this.processLine(column, getMoveCoords);
				moves.push(...lineMoves);
				mergers.push(...lineMergers);

				this.totalScore += lineScore;
				for (let j = 0; j < this.gameSize; j++) {
					this.board[j][i] = column[j];
				}
			}
		} else if (direction === "DOWN") {
			for (let i = 0; i < this.gameSize; i++) {
				const column = this.board.map((row) => row[i]).reverse();
				const getMoveCoords = (iteratingOverValue: number) => ({
					x: i,
					y: this.gameSize - iteratingOverValue - 1,
				});
				const { lineMoves, lineMergers, lineScore } = this.processLine(column, getMoveCoords);
				moves.push(...lineMoves);
				mergers.push(...lineMergers);

				this.totalScore += lineScore;
				column.reverse();
				for (let j = 0; j < this.gameSize; j++) {
					this.board[j][i] = column[j];
				}
			}
		}

		let spawn = null;
		if (moves.length || mergers.length) {
			spawn = this.spawnTile();
			this.turnsPlayed++;
		}
		const gameOver = this.checkGameIsOver();
		return { moves, mergers, spawn, gameOver, totalScore: this.totalScore, turnsPlayed: this.turnsPlayed };
	}

	private processLine(
		line: Array<Tile | null>,
		getMoveCoords: (iteratingOverValue: number) => Coordinates
	): { lineMoves: TileMoveEvent[]; lineMergers: TileMergerEvent[]; lineScore: number } {
		const lineMoves: TileMoveEvent[] = [];
		const lineMergers: TileMergerEvent[] = [];
		let lineScore = 0;

		const seen = new Set();
		let lastOccupied = -1;

		for (let i = 0; i < line.length; i++) {
			const current = line[i];

			if (current !== null) {
				const { id, power } = current;

				const lastOccupiedElement = line[lastOccupied];

				if (
					lastOccupied >= 0 &&
					lastOccupiedElement !== null &&
					lastOccupiedElement.power === power &&
					!seen.has(lastOccupiedElement.id)
				) {
					// Move current to the merger target and update power
					const newPower = lastOccupiedElement.power + 1;
					line[i] = null;
					lastOccupiedElement.power = newPower;

					// Record results
					lineMergers.push({ id, withId: lastOccupiedElement.id, newPower });
					lineMoves.push({ id, to: getMoveCoords(lastOccupied) });
					lineScore += 2 ** newPower;

					seen.add(lastOccupiedElement.id);
				} else {
					// Move the current element to the left if possible
					if (lastOccupied + 1 < i) {
						lineMoves.push({ id, to: getMoveCoords(lastOccupied + 1) });
						line[lastOccupied + 1] = current;
						line[i] = null;
						lastOccupied++;
					} else {
						// If no move is needed, just update the last occupied position
						lastOccupied = i;
					}
				}
			}
		}

		return { lineMoves, lineMergers, lineScore };
	}

	private checkGameIsOver(): boolean {
		if (this.board.flatMap((row) => row).length < this.gameSize * this.gameSize) return false;
		for (let i = 0; i < this.gameSize; i++) {
			for (let j = 0; j < this.gameSize; j++) {
				const tile = this.board[i][j];
				const upper = this.board[i - 1]?.[j];
				const lower = this.board[i + 1]?.[j];
				const left = this.board[i][j - 1];
				const right = this.board[i][j + 1];
				if (tile === null) {
					return false;
				} else if (
					(upper && tile.power === upper.power) ||
					(lower && tile.power === lower.power) ||
					(left && tile.power === left.power) ||
					(right && tile.power === right.power)
				) {
					return false;
				}
			}
		}
		return true;
	}

	public spawnTile(): TileSpawnEvent | null {
		const tried = new Set();
		while (true) {
			const x = Math.floor(Math.random() * this.gameSize);
			const y = Math.floor(Math.random() * this.gameSize);
			const tile = this.board[y][x];
			if (tried.has(`${x},${y}`)) continue;
			if (tile !== null) {
				tried.add(`${x},${y}`);
			} else {
				const newTile: Tile = {
					id: ++this.lastSpawnedId,
					power: weightedChoice(this.gameSizeTileSpawnPowers),
				};
				this.board[y][x] = newTile;
				return { spawnedTile: newTile, coordinates: { x, y } };
			}
			if (tried.size === this.gameSize * this.gameSize) {
				return null;
			}
		}
	}

	public spawnAllTilesDemo(): TileSpawnEvent[] {
		let counter = 1;
		const events: TileSpawnEvent[] = [];
		for (let i = 0; i < this.gameSize; i++) {
			for (let j = 0; j < this.gameSize; j++) {
				if (this.board[i][j]) continue;
				if (counter === this.gameSize ** 2 - 1) break;
				const newTile = {
					id: this.lastSpawnedId++,
					power: counter,
				};
				const event: TileSpawnEvent = { spawnedTile: newTile, coordinates: { x: j, y: i } };
				events.push(event);
				this.board[i][j] = { id: this.lastSpawnedId++, power: counter };
				counter++;
			}
		}
		return events;
	}
}
