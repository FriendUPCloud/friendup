/**
 * Prerequisite requirements
 *
 * sudo node -g install mysql2
 * sudo node -g install ini
 *
 */

// Standard output
function output( str )
{
	process.stdout.write( str );
}

/* not really a php die... but close */
function die( str )
{
	output( str );
	if( fm ) fm.closeDatabaseConnection();
	return;
}

/* debug output... */
function debug( str )
{
	var debuglocation = 'node_debug.log';
	if( !fs.existsSync( debuglocation ) ) fs.writeFileSync(debuglocation,'# new debug log\n');
	fs.appendFile(debuglocation,  str + '\n', (err) => {
	  if (err) throw err;
	  
	});
}


// Read ini config file
var fs  = require( 'fs'  ),
	ini = require( 'ini' );
	
var atob = atob || require( 'atob' );
var mysql = mysql || require( 'mysql2' );
var config = ini.parse( fs.readFileSync( 'cfg/cfg.ini', 'UTF-8' ) );


// Read incoming request:
var rawArgs = process.argv.slice(2);
if( !rawArgs || !rawArgs.length )
{
	console.log( 'fail<!--separate-->{"response":"Could not read arguments."}' );
	return;
}

rawArgs = rawArgs[0].split( '&' );
var args = {};
for( var a = 0; a < rawArgs.length; a++ )
{
	var pair = rawArgs[a].split( '=' );
	args[ pair[ 0 ] ] = pair[ 1 ];
}

//do base 64 decode right here...
var base64id = '<!--base64-->';
for(var prop in args) {
    if(args.hasOwnProperty(prop))
    {
	    if(args[prop].indexOf( base64id ) == 0 ) args[prop]= atob( args[prop].substr( base64id.length ) )
    }
}
// Done reading incoming request.

// check for session.

if( typeof( args.sessionid ) == 'undefined' ) { console.log( 'fail<!--separate-->{"response":"No session provider."}' ); return; }


// placeholder for our frienduser
var frienduser = false;


/* we need to split everything into a coupl of functions as node does mysql async (wtf?) */
function findDriveName()
{
	var driveidentifier = '';
	
	//console.log('our args...',args);
	
	if( typeof( args.type ) == 'undefined' )
	{
		var drive = '';
		if( typeof( args.devname ) !== 'undefined' ) drive = args.devname
		else if( typeof( args.fileInfo ) !== 'undefined' && typeof( args.fileInfo.Path ) != 'undefined' ) drive = args.fileInfo.Path.substr( 0, args.fileInfo.Path.indexOf(':' ) );
		else if( typeof( args.volume ) !== 'undefined' ) drive = args.volume.substr( 0, args.volume.indexOf(':' ) );
		else if( typeof( args.from ) !== 'undefined' ) drive = args.from.substr( 0, args.from.indexOf(':' ) );
		else if( typeof( args.path ) !== 'undefined' ) drive = args.path.substr( 0, args.path.indexOf(':' ) );
		else if( typeof( args.args ) !== 'undefined' && typeof( args.args.path ) != 'undefined' ) drive = args.args.path.substr( 0, args.args.path.indexOf(':' ) );
		else if( typeof( args.directory ) !== 'undefined' ) drive = args.directory.substr( 0, args.directory.indexOf(':' ) );
		else if( typeof( args.args ) !== 'undefined' && typeof( args.args.args ) != 'undefined' && typeof( args.args.args.path != 'undefined' )) drive = args.args.args.path.substr( 0, args.args.args.path.indexOf(':' ) );

		if( drive == '' )
		{
			if( typeof( args.fileInfo) != 'undefined' && typeof( args.fileInfo.ID ) != 'undefined' ) driveidentifier = 'ID = \'' + mysql.realEscapeString( parseInt( args.fileInfo.ID ) ) + '\'';
		}
		else
		{
			driveidentifier = 'LOWER(f.Name)=LOWER(\'' + mysql.realEscapeString( drive ) + '\')';					
		}

		if( driveidentifier == '' ) { die( 'fail<!--separate-->{"response":"Could not determine drive name."}' );	return; }
	}
	else
	{
		driveidentifier = 'f.Type=\''+ mysql.realEscapeString( args.type ) +'\'';
	}

	var sql = 'SELECT * FROM `Filesystem` f WHERE ( f.UserID=\'' + frienduser.ID + '\' OR f.GroupID IN ( SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g WHERE g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND ug.UserID = \'' + frienduser.ID + '\' ) ) AND ' + driveidentifier + ' LIMIT 1';
	
	fm.connection.execute( sql, function( err, rows, fields )
	{
		if( err ) { die('fail<!--separate-->{"response":"Could not find drive"}'); return }
		if( rows ) args.type = rows[0].Type;
		
		createDoor();
	});

}

function createDoor()
{
	var door = require( '../../devices/DOSDrivers/' + args.type + '/dosdriver.js' );

	if( typeof( door.setFriendConfig ) != 'function' )
	{
			die( 'ok<!--separate-->{"response":"Failed to load DOS driver at '+ '../../devices/DOSDrivers/' + args.type + '/dosdriver.js' +'. :: '+ JSON.stringify(door) +' :: "}' );
			return;
	}
	
	door.setFriendConfig( config );
	door.setDatabase( fm.getDatabase() );

	// Identify drive
	door.identify( args.type, args.sessionid ).then = function( identified )
	{
		if( !identified )
		{
			die( 'ok<!--separate-->{"response":"Failed to load DOS driver."}' );
			return;
		}
		
		// Register the row structure
		door.filesystem = identified;

		debug('got here! 2b' + typeof( door[ args.command ] ) );

		// Execute command if found
		if( typeof( door[ args.command ] ) == 'function' )
		{
			debug('we will call this now! ' + args.command);
			try
			{
				door[ args.command ]( args, function( bool2, res )
				{
					debug('callback came back!' + JSON.stringify(res));

					// Output result
					die( ( bool2 ? 'ok' : 'fail' ) + '<!--separate-->' + res );
						return;
					} );
				return;
			}
			catch( e )
			{
				debug('we got an error!!! ' + JSON.stringify( e ) );

				// We couldn't execute the function
				die( 'fail<!--separate-->{"response":"System call failed: ' + e +'"}' );
				return;
			}	
		}
		
		// We couldn't understand the action.
		die( 'fail<!--separate-->{"response":"Uncaught system call."}' );
	};
}

/* set up module, connect to db and try to find matching door. */
var fm = require('./class.friendModule.js');
if( config )
{
	fm.openDatabaseConnection( config.DatabaseUser ).then = function( bool )
	{
		// we have our db
		if( bool )
		{
			
			//fill our user object with user data or stop it :)
			var usersql = 'SELECT u.* FROM FUser u, FUserSession us WHERE us.UserID = u.ID AND ( SUBSTRING(u.SessionID,1,32)=\'' + mysql.realEscapeString( args.sessionid ) + '\' OR u.SessionID = \''+ mysql.realEscapeString( args.sessionid ) +'\' OR us.SessionID = \''  + mysql.realEscapeString( args.sessionid ) + '\' );';
			fm.connection.execute( usersql, function( err, rows, fields )
			{
				if( err ) { die('fail<!--separate-->{"response":"Could not find user '+ err +' // ::' + usersql + '::"}'); return }
				if( rows && rows[0] )
				{
					frienduser = rows[0];
				}
				else
				{
					die('fail<!--separate-->{"response":"Could not find user '+ err +' // ::' + usersql + '::"}');
					return;
				}
				findDriveName();
			});
		}
		else
		{
			die( 'fail<!--separate-->{"response":"Could not connect to database."}' );
			return;
		}
	}
}