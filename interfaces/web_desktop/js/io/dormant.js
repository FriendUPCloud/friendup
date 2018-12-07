/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Class to abstract exposed functions in an application
Dormant = function( path )
{
	// If we're opening a Dormant connection to the server to allow 
	// Dormant functionality, maintain a web socket to the access node
	if ( path.toLowerCase() == 'self:' )
	{
		
	}
	// Else, we're using a Dormant function on another application/resource
	else
	{
		// Not loaded yet
		this.loaded = false;
		// Init dormant object
		var m = new Module( 'System' );
		m.dormant = this;
		m.onExecuted = function()
		{
			var data = JSON.parse ( this.data );
			if( data.length )
			{
				for( var a = 0; a < data.length; a++ )
				{
					var dt = data[a];
					switch( dt.type )
					{
						// Create vararg function
						// TODO: Differenciate between async resources and sync resources
						//       Explanation: some dormant functions are instant (same client)
						//                    determined on path
						case 'function':
							this.dormant[dt.name] = function()
							{
								var resource = new Object();
								resource.loaded = false;
								var ms = new Module( 'System' );
								ms.onExecuted = function( e, d )
								{
									resource.loaded = true;
									resource.data = JSON.parse( ms.data );
								}
								ms.execute( 'dormant_function', JSON.stringify( [ dt.name, arguments ] ) );
								return resource;
							};
							break;
						case 'attribute':
							this.dormant[dt.name] = JSON.parse( dt.data );
							break;
					}
				}
			}
			this.loaded = true;
		}
		m.execute( 'dormant', path );
	}
}

// Global dormant object
DormantMaster = 
{
	appDoors: [],
	events: {}, // Events from all applications, based on type
	// Add an application to the dormant master
	addAppDoor: function( dormantDoorObject )
	{
		// Variables for an unique appdoor name
		var num = 0;
		var nam = dormantDoorObject.title;
		var namnum = nam;
		var found;
		
		// Check appdoor name
		do
		{
			found = false;
			for( var a in this.appDoors )
			{
				// Found one! Make a new unique name and retry
				if( this.appDoors[a].title == namnum )
				{
					namnum = nam + '.' + ++num;
					found = true;
					break;
				}	
			}
		}
		while( found );
		
		// Add door object with unique volume name
		dormantDoorObject.title = namnum;
		this.appDoors.push( dormantDoorObject );
		if( typeof( Workspace ) != 'undefined' ) 
		{
			if( Workspace.refreshDormantDisks )
				Workspace.refreshDormantDisks();
		}
	},
	// Get all doors
	getDoors: function( callback )
	{
		var doors = [];
		for ( var a = 0; a < this.appDoors.length; a++ )
		{
			if( this.appDoors[a].getDoor )
			{
				doors.push( this.appDoors[a].getDoor() );
			}
		}
		if( callback )
			return callback( doors );
		return doors;
	},
	delAppDoor: function( doorOrTitle )
	{
		var newd = [];
		for ( var a = 0; a < this.appDoors.length; a++ )
		{
			var found = false;
			if ( typeof doorOrTitle == 'object' )
			{
				if ( this.appDoors[ a ] == doorOrTitle )
					found = true;
			}
			else
			{
				if ( this.appDoors[ a ].title == doorOrTitle )
					found = true;
			}
			if ( found )
			{
				for ( var b = 0; b < this.appDoors[a].windows.length; b++ )
				{
					var wd = this.appDoors[a].windows[b];
					if ( wd.close )
						wd.close();
					else CloseWindow( wd );
				}
				continue;
			}
			newd.push( this.appDoors[a] );
		}
		this.appDoors = newd;
		if( typeof( Doors ) != 'undefined' ) Workspace.refreshDormantDisks();
		return true;
	},
	delAppDoorByAppId: function( appid )
	{
		var dout = [];
		for( var a = 0; a < this.appDoors.length; a++ )
		{
			if( this.appDoors[a].applicationId && this.appDoors[a].applicationId == appid )
			{
				return this.delAppDoor( this.appDoors[a].title );
			}
		}
		return false;
	},
	// Flush events by appname
	delApplicationEvents: function( appname )
	{
		var out = {};
		for( var a in this.events )
		{
			if( a != appname )
				out[a] = this.events[a];
		}
		this.events = out;
	},
	/*
		Adds an event
		{
			applicationId:
			applicationName:
			eventName:
			callbackId:
			removeWhenPolled:
		}
	*/
	addEvent: function( eventObject )
	{
		if( typeof( this.events[ eventObject.applicationName ] ) == 'undefined' )
		{
			this.events[ eventObject.applicationName ] = {};
		}
		var e = this.events[ eventObject.applicationName ];
		if( typeof( e.events ) == 'undefined' )
			e.events = {};
		if( typeof( e.events[ eventObject.eventName ] ) == 'undefined' )
		{
			e.events[ eventObject.eventName ] = [];
		}
		e.events[ eventObject.eventName ].push( eventObject );
	},
	/*
		Lets an application poll an event, to see if it is there.
		If it is there, it triggers the event.
		TODO: Only allow application with this ID to do it!
		{
			eventName:
			applicationName:
			applicationId:
			viewId:
			callbackId:
		}
	*/
	pollEvent: function( obj )
	{
		if( typeof( this.events[ obj.applicationName ] ) == 'undefined' )
		{
			// Support callbacks
			if( obj.applicationId && obj.callbackId )
			{
				// Call back result
				var mesg = {};
				for( var a in obj ) mesg[a] = obj[a];
				mesg.type = 'dormantmaster';
				mesg.method = 'callback';
				mesg.data = 'undefined event';
				var app = _getAppByAppId( obj.applicationId );
				if( app && app.contentWindow )
					app.contentWindow.postMessage( JSON.stringify( mesg ), '*' );
			}
			return false;
		}
		var evs = this.events[ obj.applicationName ].events;
		if( typeof( evs[ obj.eventName ] ) == 'undefined' )
		{
			// Support callbacks
			if( obj.applicationId && obj.callbackId )
			{
				// Call back result
				var mesg = {};
				for( var a in obj ) mesg[a] = obj[a];
				mesg.type = 'dormantmaster';
				mesg.method = 'callback';
				mesg.data = 'undefined event';
				var app = _getAppByAppId( obj.applicationId );
				if( app && app.contentWindow )
					app.contentWindow.postMessage( JSON.stringify( mesg ), '*' );
			}
			return false;
		}
		// Trigger the events
		var newL = [];
		var eveList = evs[ obj.eventName ];
		for( var a = 0; a < eveList.length; a++ )
		{
			var object = eveList[a];
			
			// Call back to this application with the event call
			if( object.applicationId && object.callbackId )
			{
				// Call back result
				var mesg = {};
				for( var a in object ) mesg[a] = object[a];
				var app = _getAppByAppId( object.applicationId );
				if( app && app.contentWindow )
				{
					mesg.method = 'callback';
					mesg.command = 'dormantmaster';
					mesg.data = obj.data;
					app.contentWindow.postMessage( JSON.stringify( mesg ), '*' );
				}
			}
			if( !object.removeWhenPolled )
			{
				newL.push( object );
			}
			else
			{
				//console.log( 'Removing one time event ' + object.applicationName );
			}
		}
		// Remove ones that are one off events
		evs[ obj.eventName ] = newL;
	}
}

// Just get the iframe object
function _getAppByAppId( appid )
{
	var t = ge( 'Tasks' );
	for( var a = 0; a < t.childNodes.length; a++ )
	{
		if( !t.childNodes[a].ifr ) continue;
		if( t.childNodes[a].ifr.applicationId == appid )
			return t.childNodes[a].ifr;
	}
	return false;
}

