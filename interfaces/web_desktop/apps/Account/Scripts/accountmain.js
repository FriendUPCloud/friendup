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
		case 'addstorage':
			addStorage( 'quitonclose' );
			break;
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
			
			if( ge( 'KeyStorage' ) )
			{
				var str = '';
				
				// TODO: Add support for unlocking key to display the actual key decrypted for use other places or just decrypted as default
				
				//console.log( 'msg.Keys: ', msg.Keys );
				
				if( msg.Keys )
				{
					for( var i in msg.Keys )
					{
						str += '<div class="HRow">' + 
							'<div class="HContent40 FloatLeft">' + 
								'<p class="Layout InputHeight">' + 
									'<strong>' + ( msg.Keys[i].Name ? msg.Keys[i].Name : msg.Keys[i].RowType ) + ( msg.Keys[i].Type ? ' (' + msg.Keys[i].Type + ')' : '' ) + ':</strong>' +
								'</p>' + 
							'</div>' + 
							'<div class="HContent40 FloatLeft">' + 
								'<p class="Layout InputHeight">' + 
									'<input type="text" class="FullWidth" onclick="this.focus(); this.select();" value="' + msg.Keys[i].Data + '" id="KeyID_' + msg.Keys[i].ID + '" placeholder="{data}" readonly="readonly"/>' + 
								'</p>' + 
							'</div>' + 
							'<div class="HContent10 FloatLeft">' + 
								'<p class="Layout InputHeight" style="padding-left:10px;">' + 
									'<button type="button" class="Button IconSmall fa-' + ( msg.Keys[i].PublicKey ? 'lock' : 'unlock' ) + '" onclick="displayKey(\''+msg.Keys[i].ID+'\',this)"></button>' + 
								'</p>' + 
							'</div>' +
							'<div class="HContent10 FloatLeft">' + 
								'<p class="Layout InputHeight" style="padding-left:10px;">' + 
									'<button type="button" class="Button IconSmall fa-times" onclick="deleteKey( ' + msg.Keys[i].ID + ' )"></button>' + 
								'</p>' + 
							'</div>' + 
						'</div>';
					}
				}
				
				ge( 'KeyStorage' ).style.display = 'block';
				ge( 'Keys' ).innerHTML = str;
			}
			
			
			
			if( ge( 'KeysList' ) )
			{
				var str = '<table class="FullWidth PaddingBottom">';
					
				str += '<tr>' + 
					'<td class="PaddingBottom" style="width: 33%"><strong>' + i18n( 'i18n_key_name' ) + '</strong></td>' + 
					'<td class="PaddingBottom" style="width: 33%"><strong>' + i18n( 'i18n_application' ) + '</strong></td>' + 
					'<td class="PaddingBottom" style="width: 33%"><strong>'+ i18n( 'i18n_options' ) + '</strong></td>' +
				'</tr>';
				
				if( msg.Keys )
				{
					for( var i in msg.Keys )
					{
						str += '<tr>' + 
							'<td>' + msg.Keys[i].Name + ( msg.Keys[i].Type && msg.Keys[i].Type != 'plain' ? ' (' + msg.Keys[i].Type + ')' : '' ) + '</td>' + 
							'<td>' + ( msg.Keys[i].ApplicationID > 0 ? ( msg.Keys[i].Application ? msg.Keys[i].Application : msg.Keys[i].ApplicationID ) : ( msg.Keys[i].ApplicationID == '-1' ? i18n( 'i18n_devices' ) : i18n( 'i18n_system_wide' ) ) ) + '</td>' + 
							'<td> ' + 
								'<span onclick="editKey(' + msg.Keys[i].ID + ')"> Edit </span> ' + 
								'<span onclick="deleteKey(' + msg.Keys[i].ID + ')"> Remove </span> ' + 
							'</td>' +
						'</tr>';
					}
				}
				
				str += '</table>';
				
				str += '<div>' + 
					'<button type="button" class="Button IconSmall " onclick="editKey()">' + i18n( 'i18n_add_key' ) + '</button>' + 
				'</div>';
				
				ge( 'KeysList' ).innerHTML = str;
			}
			
			break;
		
		case 'setkey':
			
			if( msg && msg.data )
			{
				displayPublicKey( msg.data );
			}
			
			break;
	}
}

function refreshUserKeys()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var data = false;
		
		if( e == 'ok' )
		{
			data = JSON.parse( d );
		}
		
		if( ge( 'KeyStorage' ) )
		{
			var str = '';
			
			// TODO: Add support for unlocking key to display the actual key decrypted for use other places or just decrypted as default
			
			if( data )
			{
				for( var i in data )
				{
					str += '<div class="HRow">' + 
						'<div class="HContent40 FloatLeft">' + 
							'<p class="Layout InputHeight">' + 
								'<strong>' + ( data[i].Name ? data[i].Name : data[i].RowType ) + ( data[i].Type ? ' (' + data[i].Type + ')' : '' ) + ':</strong>' +
							'</p>' + 
						'</div>' + 
						'<div class="HContent40 FloatLeft">' + 
							'<p class="Layout InputHeight">' + 
								'<input type="text" class="FullWidth" onclick="this.focus();this.select();" value="' + data[i].Data + '" id="KeyID_' + data[i].ID + '" placeholder="{data}" readonly="readonly"/>' + 
							'</p>' + 
						'</div>' + 
						'<div class="HContent10 FloatLeft">' + 
							'<p class="Layout InputHeight" style="padding-left:10px;">' + 
								'<button type="button" class="Button IconSmall fa-' + ( data[i].PublicKey ? 'lock' : 'unlock' ) + '" onclick="displayKey(\''+data[i].ID+'\',this)"></button>' + 
							'</p>' + 
						'</div>' +
						'<div class="HContent10 FloatLeft">' + 
							'<p class="Layout InputHeight" style="padding-left:10px;">' + 
								'<button type="button" class="Button IconSmall fa-times" onclick="deleteKey(' + data[ i ].ID + ')"></button>' + 
							'</p>' + 
						'</div>' + 
					'</div>';
				}
			}
			
			ge( 'Keys' ).innerHTML = str;
		}
		
		if( ge( 'KeysList' ) )
		{
			var str = '<table class="FullWidth PaddingBottom">';
			
			str += '<tr>' + 
				'<td class="PaddingBottom" style="width:33%"><strong>' + i18n( 'i18n_key_name' ) + '</strong></td>' + 
				'<td class="PaddingBottom" style="width:33%"><strong>' + i18n( 'i18n_application' ) + '</strong></td>' + 
				'<td class="PaddingBottom" style="width:33%"><strong>'+ i18n( 'i18n_options' ) + '</strong></td>' +
			'</tr>';
			
			if( data )
			{
				for( var i in data )
				{
					str += '<tr>' + 
						'<td>' + data[i].Name + ( data[i].Type && data[i].Type != 'plain' ? ' (' + data[i].Type + ')' : '' ) + '</td>' + 
						'<td>' + ( data[i].ApplicationID > 0 ? ( data[i].Application ? data[i].Application : data[i].ApplicationID ) : ( data[i].ApplicationID == '-1' ? i18n( 'i18n_devices' ) : i18n( 'i18n_system_wide' ) ) ) + '</td>' + 
						'<td> ' + 
							'<span onclick="editKey(' + data[i].ID + ')"> Edit </span> ' + 
							'<span onclick="deleteKey(' + data[i].ID + ')"> Remove </span> ' + 
						'</td>' +
					'</tr>';
				}
			}
			
			str += '</table>';
			
			str += '<div>' + 
				'<button type="button" class="Button IconSmall " onclick="editKey()">' + i18n( 'i18n_add_key' ) + '</button>' + 
			'</div>';
			
			ge( 'KeysList' ).innerHTML = str;
		}
		
	}
	m.execute( 'keys' );	
}

function editKey( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var data = {};
		
		if( e == 'ok' )
		{
			try
			{
				data = JSON.parse( d );
			}
			catch( e )
			{
				console.log( { e:e, d:d } );
			}
		}
		
		//console.log( { e:e, data:data } );
		
		var str = '' + 
		'<div class="HRow PaddingBottom">' + 
			'<div class="HContent40 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_key_name' ) + ':</label></div>' + 
			'<div class="HContent60 FloatLeft"><input class="FullWidth InputHeight" id="KeyName" type="text" value="' + ( data.Name ? data.Name : '' ) + '"/></div>' + 
		'</div>' + 
		'<div class="HRow PaddingBottom">' + 
			'<div class="HContent40 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_key_type' ) + ':</label></div>' + 
			'<div class="HContent60 FloatLeft">' + 
				'<select class="FullWidth InputHeight" id="KeyType">' + 
					'<option value="plain"' + ( !data.Type || data.Type == 'plain' ? ' selected="selected"' : '' ) + '>Plain</option>' + 
					'<option value="md5"' + ( data.Type && data.Type == 'md5' ? ' selected="selected"' : '' ) + '>MD5</option>' + 
					'<option value="sha256"' + ( data.Type && data.Type == 'sha256' ? ' selected="selected"' : '' ) + '>SHA256</option>' + 
					'<option value="rsa1024"' + ( data.Type && data.Type == 'rsa1024' ? ' selected="selected"' : '' ) + '>RSA1024</option>' + 
				'</select>' + 
			'</div>' + 
		'</div>' +
		'<div class="HRow PaddingBottom">' + 
			'<div class="HContent40 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_application' ) + ':</label></div>' + 
			'<div class="HContent60 FloatLeft">' + 
				'<select class="FullWidth InputHeight" id="KeyApplication"><option value="0">' + i18n( 'i18n_system_wide' ) + '</option><option value="-1">' + i18n( 'i18n_devices' ) + '</option></select>' + 
			'</div>' + 
		'</div>' + 
		'<div class="HRow PaddingBottom">' + 
			'<div class="HContent40 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_data' ) + ':</label></div>' + 
			'<div class="HContent60 FloatLeft">' + 
			'<input id="KeyPublic" type="hidden" value="' + ( data.PublicKey ? data.PublicKey : '' ) + '">' + 
			'<textarea class="FullWidth" style="height:100px" id="KeyData">' + ( data.Data ? data.Data : '' ) + '</textarea>' + 
			'</div>' + 
		'</div>' + 
		'<div class="HRow">' + 
			'<button class="Button" onclick="generateKey()"> ' + i18n( 'i18n_generate_key' ) + ' </button> ' + 
			'<button class="FloatRight" onclick="closeKey()"> ' + i18n( 'i18n_close' ) + ' </button> ' + 
			( data.PublicKey ? 
			'<button class="FloatRight Button IconSmall fa-unlock" onclick="dataEncryption(this)"> ' + i18n( 'i18n_decrypt' ) + ' </button> ' 
			:
			'<button class="FloatRight Button IconSmall fa-lock" onclick="dataEncryption(this)"> ' + i18n( 'i18n_encrypt' ) + ' </button> ' 
			) +
			'<button class="FloatRight" onclick="saveKey(' + ( id ? id : '' ) + ')"> ' + i18n( 'i18n_save' ) + ' </button> ' + 
		'</div>';
		
		ge( 'KeysList' ).innerHTML = str;
		
		refreshApplicationList( data.ApplicationID );
	}
	m.execute( 'keys', { id: ( id ? id : false ) } );
}

function closeKey()
{
	refreshUserKeys();
}

function saveKey( id )
{
	if( ge( 'KeyName' ) && ge( 'KeyApplication' ) && ge( 'KeyData' ) && ge( 'KeyPublic' ) )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e: e, d: d } );
		
			if( e == 'ok' )
			{
				refreshUserKeys();
			}
		}
		m.execute( 'userkeysupdate', { 
			id: ( id ? id : '' ), 
			type: ( ge( 'KeyType' ).value ? ge( 'KeyType' ).value : '' ),
			name: ge( 'KeyName' ).value, 
			app: ge( 'KeyApplication' ).value,  
			key: ge( 'KeyData' ).value, 
			publickey: ge( 'KeyPublic' ).value, 
			signature: '' 
		} );
	}
}

function generateKey()
{
	var args = {
		type: ge( 'KeyType' ).value,
		data: ge( 'KeyData' ).value
	};	
	
	if( args.type == 'rsa1024' || args.type == 'md5' || args.type == 'sha256' )
	{
		/*Application.sendMessage( { type: 'encryption', algo: args.type, command: 'generatekeys', args: args }, function( data )
		{
			
			console.log( 'Return on callback: ', data );
			
			if( data && ( data.key || data.keys ) )
			{
				if( data.keys && data.keys.privatekey )
				{
					ge( 'KeyData' ).value = data.keys.privatekey;
				}
				else if( data.key )
				{
					ge( 'KeyData' ).value = data.key;
				}
			}
		
		} );*/
		
		Application.encryption.generateKeys( args.data, args.type, function( e, d )
		{
			console.log( 'Return on callback: ', { e:e, d:d } );
			
			if( e == 'ok' && d )
			{
				if( typeof d.privatekey != 'undefined' )
				{
					ge( 'KeyData' ).value = d.privatekey;
				}
				else
				{
					ge( 'KeyData' ).value = d;
				}
			}
			
		} );
		
	}
}

function generateKeypair()
{
	//
	
	if( ge( 'NewKeyName' ).value )
	{
		if( ge( 'NewKeyPassword' ).value != ge( 'NewKeyPasswordConfirm' ).value )
		{
			Alert( i18n( 'i18n_password_mismatch' ), i18n( 'i18n_pass_mis_desc' ) );
			return;
		}
		var args = {
			type: ge( 'NewKeyType' ).value,
			username: ge( 'NewKeyName' ).value,
			password: ( ge( 'NewKeyPassword' ).value ? ge( 'NewKeyPassword' ).value : '' ),
			encoded: true 
		};
		
		if( args.type == 'rsa1024' || args.type == 'md5' || args.type == 'sha256' )
		{
			Application.sendMessage( { type: 'encryption', algo: args.type, command: 'generatekeys', args: args }, function( data )
			{
			
				//console.log( 'Return on callback: ', data );
				
				if( data && ( data.key || data.keys ) )
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						//console.log( { e: e, d: d } );
					
						if( e == 'ok' )
						{
							//console.log( 'refresh list' );
							refreshUserKeys();
						}
					}
					m.execute( 'userkeysupdate', { name: args.username, type: args.type, key: ( data.key ? data.key : data.keys.privatekey ), signature: '' } );
				}
			
			} );
		}
		else
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				//console.log( { e: e, d: d } );
				
				if( e == 'ok' )
				{
					// TODO: Editing key is not implemented yet, so no need for it yet ...
					//ClearKeyCache( d );
					
					//console.log( 'refresh list' );
					refreshUserKeys();
				}
			}
			m.execute( 'userkeysupdate', { name: args.username, type: args.type, key: args.password } );
		}
	
	}
	
}

function refreshApplicationList( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			try
			{
				d = JSON.parse( d );
			}
			catch( e )
			{
				console.log( { e:e, d:d } );
			}
			
			var str = '<option value="0">' + i18n( 'i18n_system_wide' ) + '</option><option value="-1"' + ( id == '-1' ? ' selected="selected"' : '' ) + '>' + i18n( 'i18n_devices' ) + '</option>';
			
			if( d )
			{
				for( i in d )
				{
					var s = ( id && id == d[i].ApplicationID ? ' selected="selected"' : '' );
					str += '<option value="' + d[i].ApplicationID + '"' + s + '>' + d[i].Name + '</option>';
				}
			}
			
			if( ge( 'KeyApplication' ) )
			{
				ge( 'KeyApplication' ).innerHTML = str;
			}
			
			//console.log( { e:e, d:d } );
			
		}
	}
	m.execute( 'listuserapplications' );
}

function ClearKeyCache( keyid, callback )
{
	if( keyid )
	{
		var f = new Library( 'system.library' );
		f.onExecuted = function( res )
		{
			if( callback ) return callback( true );
		}
		f.execute( 'user/updatekey', { keyid: keyid } );
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

function dataEncryption( ele )
{
	if( ge( 'KeyData' ) && ge( 'KeyData' ).value && ele )
	{
		if( ele.className.indexOf( ' fa-lock' ) >= 0 )
		{
			/*Application.sendMessage( { type: 'encryption', command: 'encrypt', args: { key: ge( 'KeyData' ).value } }, function( data )
			{
				//console.log( data );
				
				if( data && data.encrypted && data.publickey )
				{
					ge( 'KeyPublic' ).value = data.publickey;
					ge( 'KeyData' ).value = data.encrypted;
					ele.className = ele.className.split( ' fa-lock' ).join( '' ) + ' fa-unlock';
					ele.innerHTML = ( ' ' + i18n( 'i18n_decrypt' ) + ' ' );
				}
			} );*/
			
			Application.encryption.encrypt( ge( 'KeyData' ).value, function( e, d )
			{
				//console.log( { e:e, d:d } );
				
				if( e == 'ok' && d.encrypted && d.publickey )
				{
					ge( 'KeyPublic' ).value = d.publickey;
					ge( 'KeyData' ).value = d.encrypted;
					ele.className = ele.className.split( ' fa-lock' ).join( '' ) + ' fa-unlock';
					ele.innerHTML = ( ' ' + i18n( 'i18n_decrypt' ) + ' ' );
				}
			} );
		}
		else
		{
			/*Application.sendMessage( { type: 'encryption', command: 'decrypt', args: { key: ge( 'KeyData' ).value } }, function( data )
			{
				//console.log( data );
				
				if( data && data.decrypted )
				{
					ge( 'KeyPublic' ).value = '';
					ge( 'KeyData' ).value = data.decrypted;
					ele.className = ele.className.split( ' fa-unlock' ).join( '' ) + ' fa-lock';
					ele.innerHTML = ( ' ' + i18n( 'i18n_encrypt' ) + ' ' );
				}
			} );*/
			
			Application.encryption.decrypt( ge( 'KeyData' ).value, function( e, d )
			{
				//console.log( { e:e, d:d } );
				
				if( e == 'ok' && d.decrypted )
				{
					ge( 'KeyPublic' ).value = '';
					ge( 'KeyData' ).value = d.decrypted;
					ele.className = ele.className.split( ' fa-unlock' ).join( '' ) + ' fa-lock';
					ele.innerHTML = ( ' ' + i18n( 'i18n_encrypt' ) + ' ' );
				}
			} );
		}
	}
}

function decryptKey( key, id, ele )
{
	if( ge( 'KeyID_' + id ) && ge( 'KeyID_' + id ).value && ele )
	{
		Application.sendMessage( { type: 'encryption', command: 'decrypt', args: { key: key } }, function( data )
		{
			if( data && data.decrypted )
			{
				//console.log( 'decrypted: ' + data.decrypted );
				
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					//console.log( { e: e, d: d } );
					
					if( e == 'ok' )
					{
						ge( 'KeyID_' + id ).value = data.decrypted;
				
						ele.className = ele.className.split( ' fa-lock' ).join( ' fa-unlock' );
						
						//console.log( 'refresh list' );
					}
				}
				m.execute( 'userkeysupdate', { id: id, key: data.decrypted } );
			}
		} );
	}
}

function encryptKey( key, id, ele )
{
	if( ge( 'KeyID_' + id ) && ge( 'KeyID_' + id ).value && ele )
	{
		Application.sendMessage( { type: 'encryption', command: 'encrypt', args: { key: key } }, function( data )
		{
			if( data && data.encrypted && data.publickey )
			{
				//console.log( 'encrypted: ' + data.encrypted + ' [] ' + data.publickey );
				
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					//console.log( { e: e, d: d } );
					
					if( e == 'ok' )
					{
						ge( 'KeyID_' + id ).value = data.encrypted;
				
						ele.className = ele.className.split( ' fa-unlock' ).join( ' fa-lock' );
						
						//console.log( 'refresh list' );
					}
				}
				m.execute( 'userkeysupdate', { id: id, key: data.encrypted, publickey: data.publickey } );
			}
		} );
	}
}

function deleteKey( id )
{
	if( id && confirm( 'Are you really sure?' ) )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e: e, d: d } );
			
			if( e == 'ok' )
			{
				//console.log( 'refresh list' );
				
				refreshUserKeys();
			}
		}
		m.execute( 'userkeysdelete', { id: id } );
	}
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
					str += '<div class="FloatLeft Disk MousePointer" onclick="editStorage(\'' + js[a].Name + '\')"><div class="Label Ellipsis">' + js[a].Name + ':</div></div>';
			}
			str += '<div onclick="addStorage()" class="MousePointer FloatLeft BigButton IconSmall fa-plus"><div class="Label Ellipsis">' + i18n( 'i18n_add_storage' ) + '</div></div>';
			ge( 'StorageList' ).innerHTML = str;
		}
	}
	m.execute( 'mountlist', { mounted: '1' } );
}

// Add new storage please!
function addStorage( mode )
{
	// Only one view window
	if( Application.storageView ) return;
	
	var v = new View( {
		title: i18n( 'i18n_add_storage' ),
		width: 460,
		height: 450
	} );
	
	var f = new File( 'Progdir:Templates/storage.html' );
	f.replacements = { vid: Application.viewId, mode: 'add' };
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	v.onClose = function()
	{
		Application.storageView = false;
		if( mode == 'quitonclose' )
			Application.quit();
	}
	
	Application.storageView = v;
}

// Edit storage please!
function editStorage( name, mode )
{
	// Only one view window
	if( Application.editView ) return;
	
	var v = new View( {
		title: i18n( 'i18n_edit_storage' ),
		width: 460,
		height: 450
	} );
	
	var f = new File( 'Progdir:Templates/storage_edit.html' );
	f.replacements = { vid: Application.viewId, mode: 'edit', devname: name };
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	v.onClose = function()
	{
		Application.editView = false;
		if( mode == 'quitonclose' )
			Application.quit();
	}
	
	Application.editView = v;
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

