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
    static async isFriend(username) {
        const response = await api.post('/api/friends/isFriend', {
            username: username
        });
        const data = await response.json();
        return data.isFriend;
    }
    static async isRequesting(username) {
        const response = await api.post('/api/friends/isRequesting', {
            username: username
        });
        const data = await response.json();
        return data.isRequesting;
    }
    static async isRequested(username) {
        const response = await api.post('/api/friends/isRequested', {
            username: username
        });
        const data = await response.json();
        return data.isRequested;
    }
    static async acceptFriendRequest(username) {
        try {
            console.log('Sending acceptRequest for username:', username);
            const response = await api.post('/api/friends/acceptRequest', {
                username: username
            });
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            if (data.success) {
                console.log('Friend request accepted');
                return true;
            }
            else {
                console.error('Error accepting friend request:', data.message);
                return false;
            }
        }
        catch (error) {
            console.error('Exception in acceptFriendRequest:', error);
            return false;
        }
    }
}
