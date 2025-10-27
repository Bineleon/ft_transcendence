import type { GameState } from "./types";

export function attachGameInputs(state: GameState, opts: { root: HTMLElement;
                                                        onBothReady: () => void;
                                                        onPause: () => void;
                                                        onResume: () => void;
                                                    }) {
    function handleKeyDown(event: KeyboardEvent) {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;      // normaliser les touches  
        
        if (state.phase === 'WAITING') {
            if (key === state.controls.p1Ready) state.ready.p1 = true;
            if (key === state.controls.p2Ready) state.ready.p2 = true;
            if (state.ready.p1 && state.ready.p2) {
                opts.onBothReady();                                         // COUNTDOWN a mettre en place
            }
        }

        if (key === state.controls.pause) {
            if (state.phase === 'PLAYING') {
                state.phase = 'PAUSED';
                opts.onPause();
            } else if (state.phase === 'PAUSED') {
                state.phase = 'PLAYING';
                opts.onResume();
            }
        }
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}

