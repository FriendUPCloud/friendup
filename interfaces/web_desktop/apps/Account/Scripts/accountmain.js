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

Application.run = function( msg, iface )
{
	getStorage();
	getApplications();
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'refresh':
			getStorage();
			getApplications();
			break;
		case 'closeStorageWin':
			if( this.storageView )
			{
				this.storageView.close();
				this.storageView = false;
			}
			break;
		case 'userinfo':
			
			Application.userInfo = msg;
			this.id = msg.ID;
			ge( 'UserAccFullname' ).value        = html_entity_decode( ( msg.FullName ? msg.FullName : '')  );
			ge( 'UserAccUsername' ).value        = html_entity_decode( msg.Name );
			ge( 'UserAccPhone' ).value           = '';
			ge( 'UserAccEmail' ).value           = ( msg.Email ? msg.Email : '' );
			
			if( ge( 'PublicKeyContainer' ) )
			{
				ge( 'PublicKeyContainer' ).style.display = 'inline';
			}
			
			if( msg.Keys && ge( 'KeyStorage' ) )
			{
				var str = '';
				
				// TODO: Add support for unlocking key to display the actual key decrypted for use other places or just decrypted as default
				
				for( var i in msg.Keys )
				{
					//str += '<div class="HRow">' + 
					//	'<div>' + 
					//		'<p class="Layout">' + 
					//			'<label>' + ( msg.Keys[i].Type ? msg.Keys[i].Type : msg.Keys[i].RowType ) + ':</label>' + 
					//			'<input type="text" onclick="this.focus();this.select();" value="' + msg.Keys[i].Data + '" id="KeyID_' + msg.Keys[i].ID + '" placeholder="{data}" readonly="readonly"/>' + 
					//		'</p>' + 
					//	'</div>' + 
					//'</div>';
					
					str += '<div class="HRow">' + 
						'<div class="HContent40 FloatLeft">' + 
							'<p class="Layout InputHeight">' + 
								'<strong>' + ( msg.Keys[i].Type ? msg.Keys[i].Type : msg.Keys[i].RowType ) + ':</strong>' +
							'</p>' + 
						'</div>' + 
						'<div class="HContent40 FloatLeft">' + 
							'<p class="Layout InputHeight">' + 
								'<input type="text" class="FullWidth" onclick="this.focus();this.select();" value="' + msg.Keys[i].Data + '" id="KeyID_' + msg.Keys[i].ID + '" placeholder="{data}" readonly="readonly"/>' + 
							'</p>' + 
						'</div>' + 
						'<div class="HContent10 FloatLeft">' + 
							'<p class="Layout InputHeight" style="padding-left:10px;">' + 
								'<button type="button" class="Button IconSmall fa-lock" onclick="displayKey(\''+msg.Keys[i].ID+'\',this)"></button>' + 
							'</p>' + 
						'</div>' +
						'<div class="HContent10 FloatLeft">' + 
							'<p class="Layout InputHeight" style="padding-left:10px;">' + 
								'<button type="button" class="Button IconSmall fa-times" onclick="deleteKey('+msg.Keys[i].ID+')"></button>' + 
							'</p>' + 
						'</div>' + 
					'</div>';
				}
				
				ge( 'KeyStorage' ).style.display = 'block';
				ge( 'Keys' ).innerHTML = str;
			}
			
			break;
		
		case 'setkey':
			
			if( msg && msg.data.data )
			{
				displayPublicKey( msg.data.data );
			}
			
			break;
	}
}

function displayPublicKey( key )
{
	if( ge( 'PublicKeyContainer' ) )
	{
		ge( 'UserAccPublicKey' ).value = key;
	}
}

function displayKey( id, ele )
{
	if( ge( 'KeyID_' + id ) && ge( 'KeyID_' + id ).value && ele )
	{
		if( ele.className.indexOf( ' fa-lock' ) >= 0 )
		{
			decryptKey( ge( 'KeyID_' + id ).value, id, ele );
		}
		else
		{
			encryptKey( ge( 'KeyID_' + id ).value, id, ele );
		}
	}
}

function decryptKey( key, id, ele )
{
	if( ge( 'KeyID_' + id ) && ge( 'KeyID_' + id ).value && ele )
	{
		Application.sendMessage( {
			
			command: 'decrypt',
			key: key 
			
		} );
		
		ele.className = ele.className.split( ' fa-lock' ).join( ' fa-unlock' );
	}
}

function encryptKey( key, id, ele )
{
	if( ge( 'KeyID_' + id ) && ge( 'KeyID_' + id ).value && ele )
	{
		/*Application.sendMessage( {
			
			command: 'encrypt',
			key: key 
			
		} );*/
		
		ele.className = ele.className.split( ' fa-unlock' ).join( ' fa-lock' );
	}
}

function deleteKey( id )
{
	console.log( 'soon deleting keyid: ' + id );
}

function cancelDia()
{
	Application.sendMessage( { command: 'quit' } );
}

function saveDia()
{
	// Get save object
	var obj = {
		fullname: htmlentities( ge( 'UserAccFullname' ).value ),
		name:     htmlentities( ge( 'UserAccUsername' ).value ),
 		email:    ge( 'UserAccEmail' ).value
	};
	
	//shall we save new password
	if( ge( 'UserAccPassword' ).value != '' )
	{
		if( ge( 'UserAccPassword' ).value == ge( 'UserAccPasswordConfirm' ).value )
		{
			
			if( '{S6}' + Sha256.hash ( 'HASHED' + Sha256.hash(ge( 'UserCurrentPassword' ).value) ) == Application.userInfo.Password )
			{
				obj.password = '{S6}' + Sha256.hash ( 'HASHED' + Sha256.hash(ge( 'UserAccPassword' ).value) );
				Application.userInfo.Password = obj.password;
				ge('PassError').innerHTML = '';
			}
			else
			{
				ge('PassError').innerHTML = i18n('<span>The password you entered is wrong.</span>');
				ge( 'UserCurrentPassword' ).focus();
				return false;				
			}
		}
		else
		{
			ge('PassError').innerHTML = i18n('<span>New password confirmation does not match new password.</span>');
			ge( 'UserAccPassword' ).focus();
			return false;	
		}
	}

	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		ge( 'UserAccPasswordConfirm' ).value = ge( 'UserAccPassword' ).value = ge( 'UserCurrentPassword' ).value = '';
		Application.sendMessage( { command: 'saveresult', result: e, data: obj } );		

	}
	
	obj.command ='update';
	f.execute( 'user', obj );
}

function toggleChangePass()
{
	var container = document.getElementById('ChangePassContainer');
	if(  container.getAttribute('class') == 'opened')
	{
		container.setAttribute('class','closed');	
	}
	else
	{
		container.setAttribute('class','opened');	
	}
}

function getStorage()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'StorageList' ).innerHTML = '<em>' + i18n( 'i18n_no_storage' ) + '</em>';
		}
		else
		{
			var js = JSON.parse( d );
			var str = '';
			for( var a = 0; a < js.length; a++ )
			{
				if( js[a].Mounted != '0' )
					str += '<div class="FloatLeft Disk"><div class="Label Ellipsis">' + js[a].Name + ':</div></div>';
			}
			str += '<div onclick="addStorage()" class="MousePointer FloatLeft BigButton IconSmall fa-plus"><div class="Label Ellipsis">' + i18n( 'i18n_add_storage' ) + '</div></div>';
			ge( 'StorageList' ).innerHTML = str;
		}
	}
	m.execute( 'mountlist' );
}

// Add new storage please!
function addStorage()
{
	// Only one view window
	if( Application.storageView ) return;
	
	var v = new View( {
		title: i18n( 'i18n_add_storage' ),
		width: 460,
		height: 450
	} );
	
	var f = new File( 'Progdir:Templates/storage.html' );
	f.replacements = { vid: Application.viewId };
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	v.onClose = function()
	{
		Application.storageView = false;
	}
	
	Application.storageView = v;
}

function getApplications()
{
	var m = new Module( 'system' )
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'Applist' ).innerHTML = '<div class="sw1 Columns"><div class="HContent40 BorderRight FloatLeft Ellipsis"><strong>' + i18n( 'i18n_no_apps' ) + '</strong></div><div class="HContent60 FloatLeft Ellipsis">' + i18n( 'i18n_no_apps_desc' ) + '</div></div>';
			return;
		}
		var str = '';
		var js = JSON.parse( d );
		var sw = 2;
		for( var a = 0; a < js.length; a++ )
		{
			sw = sw == 1 ? 2 : 1;
			str += '<div class="sw' + sw + ' IconSmall fa-archive" style="padding-left: 8px">&nbsp;' + js[a].Name + '</div>';
		}
		ge( 'Applist' ).innerHTML = str;
		
		return
	}
	m.execute( 'listuserapplications' );
}


function getAppsNow()
{
	Application.sendMessage( { type: 'system', command: 'executeapplication', executable: 'Software' } );
}

