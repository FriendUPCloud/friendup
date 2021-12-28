
//
// User session object
//

class UserSession 
{
    constructor( con, sessionid ) 
    {
        this.wsConnection = con;
        this.sessionID = sessionid;
        console.log("UserSession : " + this.sessionID  );
    }

    getID()
    {
        return this.sessionID;
    }

    getWSConnection()
    {
        return this.wsConnection;
    }
}
