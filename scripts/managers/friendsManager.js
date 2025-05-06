import api from "../helpers/api.js";
import { showNotification } from "../helpers/notifications.js";
export class FriendsManager {
    static async sendFriendRequest(username) {
        const response = await api.post('/api/friends/sendRequest', {
            username: username
        });
        const data = await response.json();
        if (data.success) {
            console.log('Friend request sent');
            return true;
        }
        else {
            console.error('Error sending friend request:', data.message);
            return false;
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
                if (data.message === 'Friend request is no longer valid') {
                    console.log('Friend request is no longer valid');
                    showNotification(username + ' is no longer requesting to be your friend');
                    return false;
                }
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
            console.log('Sending removeFriend request for username:', username);
            const response = await api.post('/api/friends/removeFriend', {
                username: username
            });
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            if (data.success) {
                console.log('Friend removed successfully');
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
                console.log('Friend request cancelled successfully');
                return true;
            }
        }
        catch (error) {
            console.error('Exception in cancelFriendRequest:', error);
            return false;
        }
    }
    static async refuseFriendRequest(username) {
        const response = await api.post('/api/friends/refuseRequest', {
            username: username
        });
        const data = await response.json();
        if (data.success) {
            console.log('Friend request refused successfully');
            return true;
        }
        else {
            console.error('Error refusing friend request:', data.message);
            return false;
        }
    }
}
