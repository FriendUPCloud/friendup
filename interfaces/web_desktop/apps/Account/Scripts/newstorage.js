/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	var mode = ge( 'mode' ).value;
	var devname = ge( 'devname' ).value;
	
	if( devname == 'Home' )
	{
		ge( 'mounter' ).parentNode.innerHTML = '&nbsp';
		ge( 'deleter' ).style.display = 'none';
	}
	else
	{
		if( ge( 'mountedDisk' ).value == 'mounted' )
		{
			ge( 'mounter' ).innerHTML = '&nbsp;' + i18n( 'i18n_unmount_disk' );
		}
	}
	
	if( typeof( mode ) != 'undefined' && mode == 'edit' )
	{
		// Don't show unloaded form
		document.body.classList.add( 'LoadingForm' );
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var js = JSON.parse( d );
				return storageForm( js.Type, js.id, js );
			}
			
			// Oops!
			CloseView();
		}
		m.execute( 'filesystem', {
			userid: Application.userId,
			devname: devname
		} );
		return;
	}
	this.refresh();
}

Application.refresh = function()
{
	var s = new Module( 'system' );
	s.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			return;
		}
		
		var str = '';
		var list = JSON.parse( d );
		
		for( let a = 0; a < list.length; a++ )
		{
			if( list[a].type == 'SharedDrive' ) continue;
			let style = '';
			if( list[a].hasIcon == 'true' )
			{
				let image = '/system.library/module/?module=system&command=getdosdrivericon&dosdriver=' + list[a].type + '&authid=' + Application.authId;
				style = ' style="background-image: url(' + image + ')"';
			}
			else
			{
				let image = '/iconthemes/friendup/beta-disk.png';
				style = ' style="background-position: center; background-image: url(' + image + ')"';
			}
			str += '<div class="MousePointer DosDriverContainer" onclick="storageForm(\'' + list[a].type + '\',false)"><div class="DosDriver Rounded"' + style + '><div class="Label Ellipsis">' + ( list[a].short ? list[a].short : list[a].type ) + '</div></div></div>';
		}
		ge( 'Types' ).innerHTML = str;
	}
	s.execute( 'types' );
}


function doTheClose()
{
	Application.sendMessage( {
		command: 'closeStorageWin',
		destinationViewId: ge( 'vid' ).value
	} );
}

function storageForm( type, id, data )
{
	var ft = new Module( 'system' );
	ft.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			i18nAddTranslations( d )
		}
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var scripts = [];
			
			if( e == 'ok' )
			{
				// collect scripts
				
				var scr;
				while ( scr = d.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
				{
					d = d.split( scr[0] ).join( '' );
					scripts.push( scr[1] );
				}
				
				var mch;
				var i = 0;
				while( ( mch = d.match( /\{([^}]*?)\}/ ) ) )
				{
					d = d.split( mch[0] ).join( i18n( mch[1] ) );
				}
		
				// Fix to add more space
				d = d.split( 'HRow' ).join( 'MarginBottom HRow' );
			}
			else
			{
				d = '';
			}
		
			if( d )
			{
				d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
		
				if( ge( 'mode' ).value == 'edit' )
				{
					ge( 'FormHeading' ).innerHTML = '<h2 class="MarginBottom PaddingBottom BorderBottom">' + 
						i18n( 'i18n_edit_storage' ) + '</h2>' ;
				}
				else
				{
					ge( 'FormHeading' ).innerHTML = '<h2 class="MarginBottom PaddingBottom BorderBottom">' + 
						i18n( 'i18n_add_a' ) + ' ' + type + ' ' + i18n( 'i18n_disk' ) + '</h2>' ;
				}
			}
			
			ge( 'GUI' ).innerHTML = d + '<input type="hidden" id="Type" value="' + type + '"/>';
			
			ge( 'Form' ).classList.add( 'open' );
			
			if( ge( 'Types' ) )
			{
				ge( 'Types' ).classList.add( 'closed' );
			}
			
			if( ge( 'CButton' ) )
			{
				ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_back' );
				ge( 'CButton' ).disabled = '';
				ge( 'CButton' ).oldOnclick = ge( 'CButton' ).onclick;
				
				// Return!!
				ge( 'CButton' ).onclick = function()
				{
					if( ge( 'Types' ) )
					{
						ge( 'Types' ).classList.remove( 'closed' );
					}
					ge( 'Form' ).classList.remove( 'open' );
					ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_cancel' );
					ge( 'CButton' ).onclick = ge( 'CButton' ).oldOnclick;
				}
			}
			
			// We are in edit mode..
			if( data )
			{
				if( typeof( data[ 'ID' ] ) != 'undefined' )
					ge( 'diskId' ).value = data[ 'ID' ];
				
				var fields = [
					'Name', 'Server', 'ShortDescription', 'Port', 'Username', 
					'Password', 'Path', 'Type', 'Workgroup', 'PrivateKey'
				];
				for( var a = 0; a < fields.length; a++ )
				{
					if( ge( fields[ a ] ) && typeof( data[ fields[ a ] ] ) != 'undefined' )
					{
						ge( fields[ a ] ).value = data[ fields[ a ] ];
					}
				}
				// Do we have conf?
				if( data.Config )
				{
					data.Config = JSON.parse( data.Config );
					for( var a in data.Config )
					{
						if( ge( 'conf.' + a ) )
							ge( 'conf.' + a ).value = data.Config[ a ];
					}
				}
			}
			
			verifyForm( null, 'show' );
			
			// Run scripts at the end ...
			if( scripts )
			{
				for( var key in scripts )
				{
					if( scripts[key] )
					{
						eval( scripts[key] );
					}
				}
			}
			
			// Show loaded form
			document.body.classList.remove( 'LoadingForm' );
		}
		m.execute( 'dosdrivergui', { type: type, id: id } );
	}
	ft.execute( 'dosdrivergui', { component: 'locale', type: type, language: Application.language } );
}

// Disable a file system
function deleteFilesystem()
{
	Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_remove' ), function( r )
	{
		if( r && r.data == true )
		{
			var devname = ge( 'devname' ).value;
			unmountFilesystem( devname, function( e )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						Application.sendMessage( { command: 'notify', method: 'closeview' } );
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
						Application.sendMessage( { command: 'refresh', destinationViewId: ge( 'vid' ).value } );
						return;
					}
					try
					{
						var r = JSON.parse( d );						
						Notify( { title: 'An error occured', text: r.message } );
					}
					catch( e )
					{
						Notify( { title: 'An error occured', text: 'Could not delete this disk.' } );
					}
					return;
				}
				m.execute( 'deletefilesystem', { devname: devname } );
			} );
		}
	} );
}

// Unmount a file system
function unmountFilesystem( devname, callback )
{
	var f = new Library( 'system.library' );
	
	f.onExecuted = function( e, d )
	{	
		if( callback ) callback( e );
	}
	
	var args = {
		command: 'unmount',
		devname: devname
	};
	
	f.execute( 'device', args );
}

function mountDisk( devname )
{
	var f = new Library( 'system.library' );
	
	f.onExecuted = function( e, d )
	{	
		Application.sendMessage( { command: 'refresh', destinationViewId: ge( 'vid' ).value } );
		Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
		setTimeout( function()
		{
			CloseView();
		}, 5 );
	}
	
	var the_mount_command = ge( 'mountedDisk' ).value == 'mounted' ? 'unmount' : 'mount'
	var args = {
		devname: devname,
		sessionid: parent.Workspace.sessionid
	};
	
	f.execute( 'device/' + the_mount_command, args );
}

function verifyForm( typing, mode )
{	
	var optionals = [ 'ShortDescription' ];
	var inps = ge( 'Form' ).getElementsByTagName( 'input' );
	var texs = ge( 'Form' ).getElementsByTagName( 'textarea' );
	var out = [];
	for( var a = 0; a < inps.length; a++ )
	{
		if( inps[a].getAttribute( 'optional' ) ) optionals.push( inps[a].id );
		out.push( inps[a] );
	}
	for( var a = 0; a < texs.length; a++ )
	{
		if( texs[a].getAttribute( 'optional' ) ) optionals.push( texs[a].id );
		out.push( texs[a] );
	}
	for( var b = 0; b < out.length; b++ )
	{
		// Opts?
		var opt = false;
		for( var a = 0; a < optionals.length; a++ )
		{
			if( optionals[a] == out[b].id )
			{
				opt = true;
				break;
			}
		}
		out[b].onkeyup = function()
		{ 
			verifyForm( true );
		};
		if( !opt && !out[b].value )
		{
			if( !typing )
				out[b].focus();
			if( ge( 'AddButton' ) )
			{
				ge( 'AddButton' ).disabled = 'disabled';
				ge( 'AddButton' ).classList.add( 'Disabled' );
			}
			return false;
		}
	}
	
	if( ge( 'AddButton' ) )
	{
		ge( 'AddButton' ).disabled = '';
		ge( 'AddButton' ).classList.remove( 'Disabled' );
	}
	
	// Submit!
	if( !typing && !mode )
	{
		addDisk();
	}
}

/* Save, then close */
function addDisk()
{
	var data = { Name: ge( 'Name' ).value };
	if( ge( 'Server'    ) ) data.Server = ge( 'Server' ).value;
	if( ge( 'ShortDescription' ) ) data.ShortDescription = ge( 'ShortDescription' ).value;
	if( ge( 'Port'      ) ) data.Port = ge( 'Port' ).value;
	if( ge( 'Username'  ) ) data.Username = ge( 'Username' ).value;
	// Have password and password is not dummy
	if( ge( 'Password'  ) && ge( 'Password' ).value != '********' )
		data.Password = ge( 'Password' ).value;
	// Have hashed password and password is not dummy
	else if( ge( 'HashedPassword' ) && ge( 'HashedPassword' ).value != '********' )
		data.Password = 'HASHED' + Sha256.hash( ge( 'HashedPassword' ).value );
	if( ge( 'Path'      ) ) data.Path = ge( 'Path' ).value;
	if( ge( 'Type'      ) ) data.Type = ge( 'Type' ).value;
	if( ge( 'Workgroup' ) ) data.Workgroup = ge( 'Workgroup' ).value;
	if( ge( 'conf.Pollable' ) )
	{
		data.Pollable = ge( 'conf.Pollable' ).checked ? 'yes' : 'no';
		ge( 'conf.Pollable' ).value = ge( 'conf.Pollable' ).checked ? 'yes' : 'no';
	}
	if( ge( 'conf.Invisible' ) )
	{
		data.Invisible = ge( 'conf.Invisible' ).checked ? 'yes' : 'no';
		ge( 'conf.Invisible' ).value = ge( 'conf.Invisible' ).checked ? 'yes' : 'no';
	}
	if( ge( 'conf.Executable' ) )
		data.Invisible = ge( 'conf.Executable' ).value;
	
	if( ge( 'PrivateKey' ) )
	{
		data.PrivateKey = ge( 'PrivateKey' ).value;
	}
	if( ge( 'EncryptedKey' ) )
	{
		data.EncryptedKey = ge( 'EncryptedKey' ).value;
	}
	
	// Custom fields
	var inps = document.getElementsByTagName( 'input' );
	var txts = document.getElementsByTagName( 'textarea' );
	for( var a = 0; a < txts.length; a++ )
	{
		if( txts[a].id.substr( 0, 5 ) == 'conf.' )
		{
			data[txts[a].id] = txts[a].value;
		}
	}
	for( var a = 0; a < inps.length; a++ )
	{
		if( inps[a].id.substr( 0, 5 ) == 'conf.' )
		{
			data[inps[a].id] = inps[a].value;
		}
	}
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, dat )
	{
		if( e != 'ok' ) 
		{
			Notify( { title: i18n( 'i18n_disk_error' ), text: i18n( 'i18n_failed_to_edit' ) } );
			return;
		}
		else
		{
			Notify( { title: i18n( 'i18n_disk_success' ), text: i18n( 'i18n_disk_edited' ) } );
		}
		remountDrive( data, function()
		{
			Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
			Application.sendMessage( { command: 'notify', method: 'closeview' } );
			Application.sendMessage( { command: 'refresh', destinationViewId: ge( 'vid' ).value } );
		} );
	}
	// Edit?
	if( ge( 'mode' ).value == 'edit' )
	{
		data.ID = ge( 'diskId' ).value;
		m.execute( 'editfilesystem', data );
	}
	// Add new...
	else
	{
		m.execute( 'addfilesystem', data );
	}
}

// Unmounts partition
function remountDrive( data, callback )
{
	var f = new Library( 'system.library' );
	
	f.onExecuted = function( e, d )
	{	
		var f2 = new Library( 'system.library' );

		f2.onExecuted = function( e, d )
		{
			callback();
		}

		var args = {
			command: 'mount',
			devname: data.Name
		};

		f2.execute( 'device', args );
	}
	
	var args = {
		command: 'unmount',
		devname: ge( 'devname' ).value
	};
	
	f.execute( 'device', args );
}

