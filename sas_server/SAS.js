
const SessionList = require('./List.js');
const UserSession = require('./UserSession.js');

//
// SAS object
//

class SAS 
{
    constructor( con, id, type ) 
    {
        this.wsConnection = con;
        this.ID = id;
        this.type = type;
        this.sessionList = new SessionList();

        us = new UserSession();
        this.sessionList.add( us );
        console.log("SASID : " + this.ID + " - " + this.type );
    }

    getID()
    {
        return this.ID;
    }

    getWSConnection()
    {
        return this.wsConnection;
    }

    getType()
    {
        return this.type;
    }
}
