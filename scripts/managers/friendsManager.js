import api from "../helpers/api.js";
export class FriendsManager {
    static sendFriendRequest(username) {
        const response = api.post('/api/friends/sendRequest', {
            username: username
        });
    }
}
