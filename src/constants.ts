export const TURN_ANIMATION_DURATION = 160;
export const DEFAULT_GAME_SIZE = 4;
export const SPAWN_TILE_POWERS: Record<number, {value: number; weight: number}[]> = {
    3: [
        { value: 1, weight: 8 },
        { value: 2, weight: 2 },
    ],
    4: [
        { value: 1, weight: 6},
        { value: 2, weight: 3 },
        { value: 3, weight: 1 },
    ],
    5: [
        { value: 1, weight: 4 },
        { value: 2, weight: 4 },
        { value: 3, weight: 2 },
    ],
}