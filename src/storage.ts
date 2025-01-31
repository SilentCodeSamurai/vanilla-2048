export function getSavedHighScore(gameSize: number): number {
	const highScore = localStorage.getItem(`highScores-${gameSize}`);
	return highScore ? parseInt(highScore) : 0;
}

export function setSavedHighScore(gameSize: number, score: number) {
	localStorage.setItem(`highScores-${gameSize}`, score.toString());
}
