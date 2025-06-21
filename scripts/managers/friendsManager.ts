import api from "../helpers/api.js";

export class FriendsManager
{
    public static async sendFriendRequest(username: string)
    {
        try
        {
            const response = await api.post('/api/friends/sendRequest', 
            {
                username: username
            });
            const data = await response.json();
            if (data.success)
            {
                return true;
            }
            else
            {
                console.error('Error sending friend request:', data.message);
                return false;
            }
        }
        catch (error)
        {
            console.error('Exception in sendFriendRequest:', error);
            return false;
        }
    }

    public static async isFriend(username: string)
    {
        try
        {
            const response = await api.post('/api/friends/isFriend', 
            {
                username: username
            });
            const data = await response.json();
            return data.isFriend;
        }
        catch (error)
        {
            console.error('Exception in isFriend:', error);
            return false;
        }
    }

    public static async isRequesting(username: string)
    {
        try
        {
            const response = await api.post('/api/friends/isRequesting', 
            {
                username: username
            });
            const data = await response.json();
            return data.isRequesting;
        }
        catch (error)
        {
            console.error('Exception in isRequesting:', error);
            return false;
        }
    }

    public static async isRequested(username: string)
    {
        try
        {
            const response = await api.post('/api/friends/isRequested', 
            {
                username: username
            });
            const data = await response.json();
            return data.isRequested;
        }
        catch (error)
        {
            console.error('Exception in isRequested:', error);
            return false;
        }
    }

    public static async acceptFriendRequest(username: string)
    {
        try 
        {
            const response = await api.post('/api/friends/acceptRequest', 
            {
                username: username
            });
            const data = await response.json();
            if (data.success)
            {
                return true;
            }
            else
            {
                console.error('Error accepting friend request:', data.message);
                return false;
            }
        } 
        catch (error) 
        {
            console.error('Exception in acceptFriendRequest:', error);
            return false;
        }
    }

    public static async removeFriend(username: string)
    {
        try 
        {
            const response = await api.post('/api/friends/removeFriend', 
            {
                username: username
            });
            const data = await response.json();
            if (data.success)
            {
                return true;
            }
            else
            {
                console.error('Error removing friend:', data.message);
                return false;
            }
        } 
        catch (error) 
        {
            console.error('Exception in removeFriend:', error);
            return false;
        }
    }

    public static async cancelFriendRequest(username: string)
    {
        try
        {
            const response = await api.post('/api/friends/cancelRequest', 
            {
                username: username
            });
            const data = await response.json();
            if (data.success)
            {
                return true;
            }
        }
        catch (error) 
        {
            console.error('Exception in cancelFriendRequest:', error);
            return false;
        }
    }

    public static async refuseFriendRequest(username: string)
    {   
        try
        {
            const response = await api.post('/api/friends/refuseRequest', 
            {
                username: username
            });
            const data = await response.json();
            if (data.success)
            {
                return true;
            }
            else
            {
                console.error('Error refusing friend request:', data.message);
                return false;
            }
        }
        catch (error)
        {
            console.error('Exception in refuseFriendRequest:', error);
            return false;
        }
    }

    public static async isOnline(username: string)
    {
        const response = await api.post('/api/user/isOnline', { username: username });
        const data = await response.json();
        return data.isOnline;
    }
}