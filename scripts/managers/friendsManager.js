import api from "../helpers/api.js";
export class FriendsManager {
    static async sendFriendRequest(username) {
        const response = await api.post('/api/friends/sendRequest', {
            username: username
        });
        const data = await response.json();
        if (data.success) {
            console.log('Friend request sent');
        }
        else {
            console.error('Error sending friend request:', data.message);
        }
    }
}
