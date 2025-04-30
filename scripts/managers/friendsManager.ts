import api from "../helpers/api.js";

export class FriendsManager
{
    public static sendFriendRequest(username: string)
    {
        const response = api.post('/api/friends/sendRequest', 
        {
            username: username
        });
    }
}