/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var user = '';

/* Init connection window */
Application.oldSettings = false;
Application.run = function( msg )
{
	// Read our locale
	Locale.getLocale( function( data )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			Locale.importTranslations( d );
		}
		m.execute( 'getlocale', { type: 'DOSDrivers', locale: data.locale } );
	} );
	user = Application.userId;
}

/* Cancel the operation */
Application.cancel = function()
{
	this.sendMessage( { command: 'notify', method: 'closewindow' } );
}

Application.save = function()
{
	//if we have this device from earlier and its mounted... unmount it... otherwise just save
	if( ge('OriginalName') && Application.oldSettings && Application.oldSettings.Mounted == '1' )
	{


		var f = new Library( 'system.library' );
		f.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				Notify( { title: i18n('i18n_successfully_unmounted'), text: i18n('i18n_your_device_was') } );
				Application.saveChanges();
			}
			else
			{
				Notify( { title: i18n('i18n_failed_to_unmount'), text: i18n('i18n_could_not_unmount') } );
			}
		}


		var devname = ge('OriginalName').value;
	
		var args = {
			command: 'unmount',
			type: Application.oldSettings.Type,
			devname: Application.oldSettings.Name.split( ':' ).join ( '' ),
			path: Application.oldSettings.Path
		};

		if( Application.oldSettings.Type != 'Local' )
			args.module = 'system';

		f.execute( 'device', args );		
	}
	else
	{
		//new or unmounted drive...
		Application.saveChanges();
	}	
	

};

/* Save, then close */
Application.saveChanges = function()
{
	var data = {
		ID:       ge( 'FileSystemID' ).value,
		Name:     ge( 'Name'         ).value
	};
	
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
	if( ge( 'Type'      ) ) data.Type = ge( 'Type' ).value; else if( Application.oldSettings && Application.oldSettings.Type ) data.Type = Application.oldSettings.Type;
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
	
	if( ge( 'PublicKey' ) )
	{
		data.PublicKey = ge( 'PublicKey' ).value;
	}
	if( ge( 'EncryptedKey' ) )
	{
		data.EncryptedKey = ge( 'EncryptedKey' ).value;
	}
	
	if( ge( 'Key' ) )
	{
		var keys = [];
		
		var opt = ge( 'Key' ).getElementsByTagName( 'option' );
		
		if( opt && opt.length > 0 )
		{
			for( var a = 0; a < opt.length; a++ )
			{
				if( opt[a].value && opt[a].selected )
				{
					keys.push( opt[a].value );
				}
			}
		}
		
		data.KeysID = ( keys ? keys.join( ',' ) : '' );
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
		if( e == 'updated' )
		{
			Application.sendMessage( { command: 'refresh' } );
		}
		else if( e == 'ok' )
		{
			Application.sendMessage( { command: 'refresh' } );
			Application.cancel();
		}
		
		console.log( dat );
	}
	
	data.userid = user;

	if( ge( 'FileSystemID' ) && ge( 'FileSystemID' ).value > 0 )
	{
		m.execute( 'editfilesystem', data );
	}
	else
	{
		m.execute( 'addfilesystem', data );
	}
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'setinfo':
		
			var d = msg.info;
			var out = msg.types;
			var keys = msg.keys;
			user = msg.user;
			
			if( msg.info && msg.info.ID )
			{
				var conf = {};
				try
				{
					conf = JSON.parse( d.Config );
				}
				catch( e )
				{
				}
				Application.oldSettings = d;
				
				ge( 'FileSystemID' ).value = d.ID;
				ge( 'Name' ).value = d.Name;
				if( ge( 'OriginalName' ) ) ge( 'OriginalName' ).value = d.Name;
				if( ge( 'ShortDescription' ) ) ge( 'ShortDescription' ).value = d.ShortDescription;
				if( ge( 'Username' ) ) ge( 'Username' ).value = d.Username;
				if( ge( 'conf.Database' ) ) ge( 'conf.Database' ).value = conf.Database ? conf.Database : '';
				if( ge( 'conf.PublicKey' ) ) ge( 'conf.PublicKey' ).value = conf.PublicKey ? conf.PublicKey : '';
				if( ge( 'conf.ServerID' ) ) ge( 'conf.ServerID' ).value = conf.ServerID ? conf.ServerID : '';
				if( ge( 'Password' ) ) ge( 'Password' ).value = '********';
				if( ge( 'HashedPassword' ) ) ge( 'HashedPassword' ).value = '********';
				if( ge( 'Port' ) ) ge( 'Port' ).value = d.Port;
				if( ge( 'Server' ) ) ge( 'Server' ).value = d.Server;
				if( ge( 'Workgroup' ) ) ge( 'Workgroup' ).value = d.Workgroup;
				if( ge( 'Path' ) ) ge( 'Path' ).value = d.Path;
				if( ge( 'conf.Pollable' ) ) ge( 'conf.Pollable' ).checked = ( conf.Pollable == 'yes' ? 'checked' : '' );
				if( ge( 'conf.Invisible' ) ) ge( 'conf.Invisible' ).checked = ( conf.Invisible == 'yes' ? 'checked' : '' );
				if( ge( 'conf.Executable' ) ) ge( 'conf.Executable' ).value = conf.Executable ? conf.Executable : '';
				if( ge( 'conf.DiskSize' ) ) ge( 'conf.DiskSize' ).value = conf.DiskSize ? conf.DiskSize : '';
				
				if( d.Key && ge( 'EncryptedKey' ) && ge( 'PublicKey' ) )
				{
					// TODO: Add support for unlocking key to display the actual key decrypted for use other places or just decrypted as default
					
					ge( 'EncryptedKey' ).value = d.Key.Data;
					ge( 'PublicKey' ).value = d.Key.PublicKey;
				}
			}
			else
			{
				ge( 'FileSystemID' ).value = '';
				ge( 'Name' ).value = '';
				/*ge( 'ShortDescription' ).value = '';
				ge( 'Username' ).value = '';
				ge( 'Password' ).value = '';
				ge( 'Port' ).value = '';
				ge( 'Server' ).value = '';
				ge( 'Path' ).value = '';*/
			}
			
			if( ge( 'Types' ) )
			{
				out = '<option value="">' + i18n( 'i18n_select_dos_driver' ) + '</option>' + out;
				ge( 'Types' ).innerHTML = '<select id="Type" class="FullWidth" onchange="LoadDOSDriverGUI()">' + out + '</select>';
			}
			
			if( ge( 'Keys' ) )
			{
				var str = '<option value="">' + i18n( 'i18n_select_encryption_key' ) + '</option>' + ( keys ? keys : '' );
				ge( 'Keys' ).innerHTML = '<select id="Key" class="FullWidth" multiple>' + str + '</select>';
			}
			
			break;
		
		case 'setkey':
			
			if( msg.data && ge( 'EncryptedKey' ) && ge( 'PublicKey' ) )
			{
				setKey( msg.data );
			}
			
			break;
	}
}

function LoadDOSDriverGUI()
{
	var t = ge( 'Type' ).value;
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			i18nAddTranslations( d );
			var f = new File();
			f.i18n();
			for( var a in f.replacements )
				d = d.split( '{' + a + '}' ).join( f.replacements[a] );
			ge( 'GUI' ).innerHTML = d;
		}
		else
		{
			ge( 'GUI' ).innerHTML = '';
		}
	}
	m.execute( 'dosdrivergui', { type: ge( 'Type' ).value } );
}



function setCover()
{
	var flags = {
		type: 'load',
		title: i18n( 'i18n_choose_disk_cover' ),
		path: 'Mountlist:',
		triggerFunction: function( items )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					showDiskCover();
					return;
				}
				Alert( i18n( 'i18n_cant_show_disk_cover' ), i18n( 'i18n_cant_show_disk_desc' ) );
			}
			m.execute( 'setdiskcover', { disk: ge( 'Name' ).value, path: items[0].Path } );
		}
	};
	
	Filedialog( flags );
}

function encryptKey( mode )
{
	if( ge( 'Username' ) && ge( 'Username' ).value && ge( 'SecretPassword' ) && ge( 'SecretPassword' ).value )
	{
		// TODO: Add support for getting UniqueID instead of Username if it's required because of the TR system requirement
		
		switch( mode )
		{
			case 'treeroot':
				
				Application.sendMessage( {
					
					command: 'uniqueid', 
					path: 'https://store.openfriendup.net/authenticate/', 
					username: ge( 'Username' ).value
					
				} );
				
				break;
			
			default:
				
				Application.sendMessage( {
					
					command: 'encrypt',
					key: ( ge( 'Username' ).value + ':' + md5( ge( 'SecretPassword' ).value ) )
					
				} );
				
				break;
		}
	}
}

function setKey( data )
{
	if( data && ge( 'EncryptedKey' ) && ge( 'PublicKey' ) )
	{
		if( data.encrypted && data.publickey )
		{
			ge( 'EncryptedKey' ).value = data.encrypted;
			ge( 'PublicKey' ).value    = data.publickey;
		}
		else if( data.uniqueId )
		{
			Application.sendMessage( {
				
				command: 'encrypt',
				key: ( data.uniqueId + ':' + md5( ge( 'SecretPassword' ).value ) )
				
			} );
		}
	}
}
