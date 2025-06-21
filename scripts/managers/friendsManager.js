import api from "../helpers/api.js";
export class FriendsManager {
    static async sendFriendRequest(username) {
        try {
            const response = await api.post('/api/friends/sendRequest', {
                username: username
            });
            const data = await response.json();
            if (data.success) {
                return true;
            }
            else {
                console.error('Error sending friend request:', data.message);
                return false;
            }
        }
        catch (error) {
            console.error('Exception in sendFriendRequest:', error);
            return false;
        }
    }
    static async isFriend(username) {
        try {
            const response = await api.post('/api/friends/isFriend', {
                username: username
            });
            const data = await response.json();
            return data.isFriend;
        }
        catch (error) {
            console.error('Exception in isFriend:', error);
            return false;
        }
    }
    static async isRequesting(username) {
        try {
            const response = await api.post('/api/friends/isRequesting', {
                username: username
            });
            const data = await response.json();
            return data.isRequesting;
        }
        catch (error) {
            console.error('Exception in isRequesting:', error);
            return false;
        }
    }
    static async isRequested(username) {
        try {
            const response = await api.post('/api/friends/isRequested', {
                username: username
            });
            const data = await response.json();
            return data.isRequested;
        }
        catch (error) {
            console.error('Exception in isRequested:', error);
            return false;
        }
    }
    static async acceptFriendRequest(username) {
        try {
            const response = await api.post('/api/friends/acceptRequest', {
                username: username
            });
            const data = await response.json();
            if (data.success) {
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
    static async removeFriend(username) {
        try {
            const response = await api.post('/api/friends/removeFriend', {
                username: username
            });
            const data = await response.json();
            if (data.success) {
                return true;
            }
            else {
                console.error('Error removing friend:', data.message);
                return false;
            }
        }
        catch (error) {
            console.error('Exception in removeFriend:', error);
            return false;
        }
    }
    static async cancelFriendRequest(username) {
        try {
            const response = await api.post('/api/friends/cancelRequest', {
                username: username
            });
            const data = await response.json();
            if (data.success) {
                return true;
            }
        }
        catch (error) {
            console.error('Exception in cancelFriendRequest:', error);
            return false;
        }
    }
    static async refuseFriendRequest(username) {
        try {
            const response = await api.post('/api/friends/refuseRequest', {
                username: username
            });
            const data = await response.json();
            if (data.success) {
                return true;
            }
            else {
                console.error('Error refusing friend request:', data.message);
                return false;
            }
        }
        catch (error) {
            console.error('Exception in refuseFriendRequest:', error);
            return false;
        }
    }
    static async isOnline(username) {
        const response = await api.post('/api/user/isOnline', { username: username });
        const data = await response.json();
        return data.isOnline;
    }
}
