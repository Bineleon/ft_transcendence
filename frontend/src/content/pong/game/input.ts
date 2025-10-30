import type { GameController } from "../controller";

export function attachGameInputs(gameController: GameController): () => void {
    function handleKeyDown(event: KeyboardEvent) {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;      // normaliser les touches
        const phase = gameController.state.phase;

        switch (phase) {
            case 'WAITING':
                if (key === gameController.state.controls.p1Ready) {
                    gameController.state.ready.p1 = true;
                    gameController.view.overlay.replaceChildren(gameController.domOverlay.bindHTMLElement("WAITING", gameController.state));
                }
                if (key === gameController.state.controls.p2Ready) {
                    gameController.state.ready.p2 = true;
                    gameController.view.overlay.replaceChildren(gameController.domOverlay.bindHTMLElement("WAITING", gameController.state));
                }
                if (gameController.state.ready.p1 && gameController.state.ready.p2) {
                    gameController.setPhase("COUNTDOWN");
                }
                return; // sortie immédiate

            case 'PLAYING':
                if (key === gameController.state.controls.pause) {
                    gameController.state.ready.paused = true;
                    gameController.setPhase("PAUSED");
                }
                return;

            case 'PAUSED':
                if (key === gameController.state.controls.pause) {
                    gameController.state.ready.paused = false;
                    gameController.setPhase("COUNTDOWN");
                }
                return;

            default:
                return;
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}


