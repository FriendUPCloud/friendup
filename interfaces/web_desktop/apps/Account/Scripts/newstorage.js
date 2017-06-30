/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	this.refresh();
}

Application.refresh = function()
{
	var s = new Module( 'system' );
	s.onExecuted = function( e, d )
	{
		console.log( e );
		if( e != 'ok' )
		{
			return;
		}
		
		var str = '';
		var list = JSON.parse( d );
		
		for( var a = 0; a < list.length; a++ )
		{
			var style = '';
			if( list[a].hasIcon == 'true' )
			{
				var image = '/system.library/module/?module=system&command=getdosdrivericon&dosdriver=' + list[a].type + '&authid=' + Application.authId;
				style = ' style="background-image: url(' + image + ')"';
			}
			else
			{
				var image = '/iconthemes/friendup/80/flat/disk.png';
				style = ' style="background-size: 80px; background-position: center; background-image: url(' + image + ')"';
			}
			str += '<div class="MousePointer DosDriverContainer" onclick="storageForm(\'' + list[a].type + '\',false)"><div class="DosDriver Rounded"' + style + '><div class="Label Ellipsis">' + list[a].type + '</div></div></div>';
		}
		ge( 'Types' ).innerHTML = str;
	}
	console.log( 'Getting types' );
	s.execute( 'types' );
}


function doTheClose()
{
	Application.sendMessage( {
		command: 'closeStorageWin',
		destinationViewId: ge( 'vid' ).value
	} );
}

function storageForm( type, id )
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
			if( e == 'ok' )
			{
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
		
			d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
		
			ge( 'FormHeading' ).innerHTML = '<h2 class="MarginBottom PaddingBottom BorderBottom">' + i18n( 'i18n_add_a' ) + ' ' + type + ' ' + i18n( 'i18n_disk' ) + '</h2>' ;
			ge( 'GUI' ).innerHTML = d + '<input type="hidden" id="Type" value="' + type + '"/>';
			ge( 'Form' ).classList.add( 'open' );
			ge( 'Types' ).classList.add( 'closed' );
			ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_back' );
			ge( 'CButton' ).disabled = '';
			ge( 'CButton' ).oldOnclick = ge( 'CButton' ).onclick;
			// Return!!
			ge( 'CButton' ).onclick = function()
			{
				ge( 'Types' ).classList.remove( 'closed' );
				ge( 'Form' ).classList.remove( 'open' );
				ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_cancel' );
				ge( 'CButton' ).onclick = ge( 'CButton' ).oldOnclick;
			}
			verifyForm();
		}
		m.execute( 'dosdrivergui', { type: type } );
	}
	ft.execute( 'dosdrivergui', { component: 'locale', type: type, language: Application.language } );
}

function verifyForm( typing )
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
		out[b].onkeyup = function(){ verifyForm( true ); }
		if( !opt && !out[b].value )
		{
			if( !typing )
				out[b].focus();
			ge( 'AddButton' ).disabled = 'disabled';
			ge( 'AddButton' ).classList.add( 'Disabled' );
			return false;
		}
	}
	
	ge( 'AddButton' ).disabled = '';
	ge( 'AddButton' ).classList.remove( 'Disabled' );
	
	// Submit!
	if( !typing )
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
	
	if( ge( 'PublicKey' ) )
	{
		data.PublicKey = ge( 'PublicKey' ).value;
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
		if( e != 'ok' ) return;
		
		remountDrive( data, function()
		{
			Application.sendMessage( { command: 'refresh', destinationViewId: ge( 'vid' ).value } );
			Application.sendMessage( { command: 'closeStorageWin', destinationViewId: ge( 'vid' ).value } );
			Application.sendMessage( { command: 'refreshdoors' } );
		} );
	}
	m.execute( 'addfilesystem', data );
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
		devname: data.Name
	};
	
	f.execute( 'device', args );
}

