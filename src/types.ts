export type Direction = "UP" | "RIGHT" | "DOWN" | "LEFT";

export type Coordinates = {
	x: number;
	y: number;
};

export type Tile = {
	id: number;
	power: number;
};

export type Board = Array<Array<Tile | null>>;

export type TileMoveEvent = {
	id: number;
	to: Coordinates;
};

export type TileMergerEvent = {
	id: number;
	withId: number;
	newPower: number;
};

export type TileSpawnEvent = {
	spawnedTile: Tile;
	coordinates: Coordinates;
};
