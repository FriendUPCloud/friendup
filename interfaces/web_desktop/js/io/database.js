/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
	Design:
	
	A Database object will attach itself to System:Devices/Databases/
	Here, it should be possible to interact with it using the Workspace
	or Friend Shell.
	The object also has a Javascript API which will be available to
	api.js by proxy - using the same function calls as available in this
	class.
	
	cd System:Devices/Database/MyDatabase/     | Enters database
	list                                       | Lists tables
	dir Books/                                 | Lists records
	info Books/1908754                         | Gets table description
	infoget Books/1908754 Title                | Gets Title column from record
	delete Books/1908754                       | Deletes a book
	echo "Alice in Wonderland" > Books/1908754 in Title | Updates Title
	
	A Database directory has a special flag on it, and allows you to disconnect
	it with the context menu. You will also be able to connect to a new 
	database the same way. If doing Icon Info using the GUI, you will be able
	to edit record information.
*/

friendUP = window.friendUP || {};

friendUP.databases = [];

// Create a database object
Database = function( options )
{
	// Set options
	this.options = {};
	for( var a in options )
	{
		switch( a )
		{
			case 'username':
			case 'password':
			case 'hostname':
			case 'key':
			case 'database':
			case 'port':
				this.options[ a ] = options[ a ];
				break;
			case 'type':
				switch( options[ a ] )
				{
					case 'sqlite':
					case 'server_mysql':
						this.options[ a ] = options[ a ];
						break;						
					default:
						break;
				}
				break;
			default:
				break;
		}
	}
}

// Open a connection to a database
Database.prototype.Open = function( callback )
{
	var self = this;
	
	var m = new Module( 'database' );
	m.onExecuted = function( e, d )
	{
		try { if( d ) d = JSON.parse( d ); } catch( e ){};
		
		if( e != 'ok' )
		{
			Notify( { title: 'Database connection failed', text: d.message } );
		}
		// On success, register global reference
		for( var a = 0; a < friendUP.databases.length; a++ )
		{
			if( friendUP.databases[ a ] == self ) 
			{
				e = 'fail';
				break;
			}
		}
		if( e == 'ok' )
		{
			friendUP.databases.push( this );
		}
		if( callback )
			callback( e == 'ok' ? d : false );
	}
	m.execute( 'open', { options: this.options } );
}

// Find a record in a database
/*
	Definition:
	
	{
		table: 'Books',
		order: {                              <- // optional - TODO
			title: 'DESC',
			date: 'ASC'
		},
		definition: {
			id: '> 3',
			title: 'Alice in Wonderland',
			date: '>= 28-01-80 13:37:00'
		},
		join: [                               <- // optional - TODO
			{
				alias: 'a',
				definition: ...
			}	
		]
	}
*/
Database.prototype.Find = function( definition, callback )
{
	var m = new Module( 'database' );
	m.onExecuted = function( e, d )
	{
		try { if( d ) d = JSON.parse( d ); } catch( e ){};
		
		if( e != 'ok' )
		{
			Notify( { title: 'Database query failed', text: d.message } );
		}
		if( callback )
			callback( e == 'ok' ? d : false );
	}
	m.execute( 'find', { definition: definition, options: this.options } );
}

Database.prototype.Update = function( definition, callback ){};
Database.prototype.Delete = function( definition, callback ){};
Database.prototype.CreateTable = function( definition, callback ){};
Database.prototype.DeleteTable = function( definition, callback ){};
Database.prototype.CreateDatabase = function( definition, callback ){};
Database.prototype.DeleteDatabase = function( definition, callback ){};
Database.prototype.SetPermissions = function( definition, callback ){};

// Close a database connection and remove global reference
Database.prototype.Close = function()
{
	var o = [];
	for( var a = 0; a < friendUP.databases.length; a++ )
	{
		if( friendUP.databases[ a ] != this )
			o.push( friendUP.databases[ a ] );
	}
	friendUP.databases = o;
	delete this;
}

