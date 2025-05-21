import { setupGameList } from "./gameList.js";
import { setupNews } from "./news.js";
export async function setupStore() {
    setupNews();
    setupGameList();
}
