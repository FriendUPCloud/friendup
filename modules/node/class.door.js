var mysql = mysql || require( 'mysql2' );

door = function(){  }
door.prototype.setDatabase = function( db )
{
	this.ndb = db;
}

door.prototype.setFriendConfig = function( fc )
{
	this.friendConfig = fc;
}


door.prototype.identify = function( type, sessionid )
{
	var promise = {};
	
	var safetype = mysql.realEscapeString( type );
	var safesession = mysql.realEscapeString( sessionid );
	this.ndb.execute( '\
		SELECT * FROM `Filesystem` f, `FUser` u \
		WHERE `Type`="' + safetype + '" AND u.SessionID="' + safesession + '" AND f.UserID = u.ID\
	', function( err, rows, fields )
	{
		if( promise.then )
		{
			if( err )
			{
				return promise.then( false );
			}
			return promise.then( rows[ 0 ] );
		}
	} );
	
	return promise;
}

door.prototype.about = function()
{
	return 'Hello';
}

// Prototype for directory views
door.prototype.directory = function()
{
}

// Finally, export class
module.exports = door;

	