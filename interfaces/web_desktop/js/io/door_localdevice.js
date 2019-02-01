/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
*                                                                              *
* The Local Device Door is a special disk driver that uses the actual client   *
* device to store data, directory structures and the rest. It can be used to   *
* create unique disks that are entirely based on the client device.            *
*                                                                              *
* But the most compelling use is as a cache for the user's other disks. This   *
* means that each disk, no matter which one, can cache recent files and        *
* directory structures so that they can be used while offline, and then sync   *
* once the user is online again.                                               *
*                                                                              *
*******************************************************************************/

DoorLocalDevice = function( deviceName, flags, callback )
{
	// Internal variables
	this.syncDevice = null; // Can be Home: or another disk
	this.state = {
		syncing: false,
		loading: false,
		saving: false,
		initialized: false // once it has loaded from local storage
	};
	this.deviceName = deviceName;
	if( !this.deviceName )
	{
		if( callback ) callback( false, { message: 'Empty device name.', response: -1 } );
		return;
	}
	this.deviceStructure = {}; // Recursive cache
	this.syncQueue = []; // List of sync events to run once online
	
	if( flags )
	{
		if( flags.syncDevice )
		{
			if( Workspace.icons )
			{
				for( var a = 0; a < Workspace.icons.length; a++ )
				{
					if( Workspace.icons[ a ].Volume == flags.syncDevice )
					{
						this.syncDevice = flags.syncDevice;
						break;
					}
				}
			}
		}
	}
	
	this.ready = false;
	
	this.init();
}

// Check if system is online
DoorLocalDevice.prototype.checkOnline = function()
{
	if( 1 == 1 )
	{
		return true;
	}
	return false;
}

DoorLocalDevice.prototype.init = function( callback )
{
	this.storage = window.localStorage;
	this.devName = this.deviceName;
	if( this.devName.substr( this.devName.length - 1, 1 ) == ':' )
		this.devName = this.devName.substr( 0, this.devName.length - 1 );
	
	if( this.syncDevice && this.checkOnline() )
	{
		// Update local structure and call back
		// TODO:
		return;
	}
	
	// Get existing data
	this.deviceStructure = this.storage.get( 'DoorLocalDevice_' + devName );
	if( !this.deviceStructure )
	{
		this.storage.set( 'DoorLocalDevice_' + devName, JSON.stringify( {} ) );	
	}
	// 
	else
	{
		this.deviceStructure = JSON.parse( this.deviceStructure );
	}
	if( this.onReady )
	{
		this.onReady( true );
	}
}

// Get the files in a path
DoorLocalDevice.prototype.getDirectory = function( path, callback )
{
	if( !callback || !path ) return;
	
	// Return path contents
	if( this.deviceStructure[ 'paths' ] && this.deviceStructure[ 'paths' ][ path ] )
	{
		callback( true, this.deviceStructure[ 'paths' ][ path ] );
	}
	// Illegal path
	else
	{
		callback( false, null );
	}
}

DoorLocalDevice.prototype.read = function( path, callback )
{
	if( !callback || !path ) return;
	var pathstr = path.split( ':' )[1];

	
}

DoorLocalDevice.prototype.write = function( path, callback )
{
	
}

// Will delete a device from local storage and add to sync list if linked to 
// device
DoorLocalDevice.prototype.delete = function( path, callback )
{
}

// Make a directory
DoorLocalDevice.prototype.makeDirectory = function( path, callback )
{
	var self = this;
	if( this.deviceStructure[ 'paths' ][ path ] )
	{
		callback( false, { message: 'This directory already exists.', response: -1 } );
		return false;
	}
	if( path.substr( path.length - 1, 1 ) == '/' )
		path = path.substr( 0, path.length - 1 );
	var paths = path.split( ':' ).join( '/' ).split( '/' );
	var testPath = '';
	for( var a = 0; a < paths.length; a++ )
	{
		if( !paths[ a ].length ) break;
		testPath += paths[a] + a == 0 ? ':' : '/';
		if( a == paths.length - 1 && !this.deviceStructure[ 'paths' ][ testPath ] )
		{
			this.deviceStructure[ 'paths' ][ testPath ] = {
				permissions: {
					owner: 'arwed',
					groups: 'arwed',
					others: 'arwed'
				}
				files: []
			};
			// Silent syncing
			this.state.syncing = true;
			if( this.onSync )
				this.onSync( 'makedir', path );
			this.sync( function()
			{
				self.state.syncing = false;
				if( self.onSynced ) self.onSynced( 'makedir', path );
			} );
			// Tell system that the operation was successful
			callback( true, { message: 'Directory was created.', response, 1 );
			return true;
		}
		else if( a < paths.length - 1 && !this.deviceStructure[ 'paths' ][ testPath ] )
		{
			callback( false, { message: 'The parent directory does not exist.', response: -1 } );
			return false;
		}
	}
}

// Will sync when online, and callback with synchronized files
DoorLocalDevice.prototype.sync = function( callback )
{
}

