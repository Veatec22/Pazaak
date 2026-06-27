/**
 * Barrel for the menu screens (now split into `src/components/menu/*`). Kept so existing
 * imports — `App.tsx` and `Board.tsx` import from `./Lobby` / `../Lobby` — stay unchanged.
 * The `lobby.css` import lives here so the menu styles load wherever any of these render.
 */
import './lobby.css';

export { MainMenu } from './components/menu/MainMenu';
export { MultiplayerMenu } from './components/menu/MultiplayerMenu';
export { ShareBar } from './components/menu/ShareBar';
export { SinglePlayerMenu } from './components/menu/SinglePlayerMenu';
export { TopBar } from './components/menu/TopBar';
export { WaitingRoom } from './components/menu/WaitingRoom';
