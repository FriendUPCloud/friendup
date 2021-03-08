/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	Friend.exportAPI( Application.applicationId, {}, function( response, data, extra )
	{
		getStorage();
		getUnmounted();
		
		var d = new Module( 'system' );
		d.onExecuted = function( r, c )
		{
			if( r == 'ok' )
			{
				try
				{
					var data = JSON.parse( c );
					refreshPalette( data.avatar_color );
				}
				catch( e )
				{
					refreshPalette();
				}
			}
			else
			{
				refreshPalette();
			}
		}
		d.execute( 'getsetting', { setting: 'avatar_color' } );
	} );
	
	// Clear / autoregenerate avatar
	ge( 'ClearAvatar' ).onclick = function( e )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var d = new Module( 'system' );
			d.onExecuted = function( r, c )
			{
				refreshAvatar();
				if( r == 'ok' )
				{
					try
					{
						var data = JSON.parse( c );
						refreshPalette( data.avatar_color );
					}
					catch( e )
					{
						refreshPalette();
					}
				}
				else
				{
					refreshPalette();
				}
			}
			d.execute( 'getsetting', { setting: 'avatar_color' } );
		}
		m.execute( 'getsetting', { setting: 'avatar', mode: 'reset' } );
	}
}

var palette = [ '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6', 
				'#34495E', '#E67E22', '#E74C3C', '#95A5A6' ];

var userCredentials = null;

function refreshPalette( col )
{
	var d = document.createElement( 'div' );
	for( var a = 0; a < palette.length; a++ )
	{
		var p = document.createElement( 'div' );
		p.className = 'Color';
		if( col && palette[ a ].toLowerCase() == col.toLowerCase() )
		{
			p.classList.add( 'Active' );
		}
		p.setAttribute( 'hex', palette[ a ] );
		p.onclick = function( e )
		{
			this.classList.add( 'Active' );
			for( var c = 0; c < this.parentNode.childNodes.length; c++ )
			{
				if( this.parentNode.childNodes[ c ] == this ) continue;
				else this.parentNode.childNodes[ c ].classList.remove( 'Active' );
			}
			var hex = this.getAttribute( 'hex' );
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				var d = new Module( 'system' );
				d.onExecuted = function( r, c )
				{
					refreshAvatar();
					if( r == 'ok' )
					{
						try
						{
							var data = JSON.parse( c );
							refreshPalette( data.avatar_color );
						}
						catch( e )
						{
							refreshPalette();
						}
					}
					else
					{
						refreshPalette();
					}
				}
				d.execute( 'getsetting', { setting: 'avatar_color' } );
			}
			m.execute( 'getsetting', { setting: 'avatar', color: hex, mode: 'reset' } );
		}
		p.style.backgroundColor = palette[ a ];
		d.appendChild( p );
	}
	d.className = 'PaletteContainer';
	if( !ge( 'UserPalette' ).querySelector( 'Color' ) )
	{
		ge( 'UserPalette' ).classList.add( 'Hidden' );
		setTimeout( function(){ ge( 'UserPalette' ).classList.remove( 'Hidden' ); ge( 'UserPalette' ).classList.add( 'Shown' ); }, 5 );
	}
	ge( 'UserPalette' ).innerHTML = '';
	ge( 'UserPalette' ).appendChild( d );
}

function refreshAvatar()
{
	// Avatar
	var avatar = ge( 'Avatar' );
	if( avatar )
	{
		var sm = new Module( 'system' );
		sm.onExecuted = function( e, d ) 
		{
			if( e == 'ok' )
			{
				if( d )
				{
					try
					{
						d = JSON.parse( d );
					}
					catch( e )
					{
						d = null;
					}
				}
			}
			if( d )
			{
				// Only update the avatar if it exists..
				var avSrc = new Image();
				avSrc.src = d.avatar;
				avSrc.onload = function()
				{
					var ctx = avatar.getContext( '2d' );
					ctx.drawImage( avSrc, 0, 0, 256, 256 );
				}
			}
		}
		sm.execute( 'getsetting', { setting: 'avatar' } );
	}
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
			getUnmounted();
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
			
			ge( 'UserAccFullname' ).value        = html_entity_decode( msg.FullName ? msg.FullName : '' );
			ge( 'UserAccUsername' ).value        = html_entity_decode( msg.Name );
			ge( 'UserAccEmail'    ).value        = msg.Email ? msg.Email : '';
			ge( 'UserAccTimezone'    ).value     = msg.Timezone ? msg.Timezone : '';
			
			InitTimezoneGui();
			
			userCredentials = ge( 'UserAccFullname' ).value.substr( 0, 1 );
			var m = 0;
			for( var c = 1; c < ge( 'UserAccFullname' ).value.length; c++ )
			{
				if( ge( 'UserAccFullname' ).value.substr( c, 1 ) == ' ' )
				{
					m = 1;
					continue;
				}
				if( m == 1 )
				{
					userCredentials += ge( 'UserAccFullname' ).value.substr( c, 1 );
					break;
				}
			}
			userCredentials = userCredentials.toUpperCase();
			
			
			if( ge( 'PublicKeyContainer' ) )
			{
				ge( 'PublicKeyContainer' ).style.display = 'inline';
				ge( 'PublicKeyContainer' ).style.position = 'absolute';
			}
			
			// TODO: Add support for unlocking key to display the actual key decrypted for use other places or just decrypted as default
			drawKeyList( msg.Keys );
			
			refreshAvatar();

			// Friend Network settings
			var self = this;
			self.friendNetwork = false;
			var m = new Module('system');
			m.onExecuted = function( e,d )
			{
				if ( e == 'ok' && parseInt( d ) == 1 )
				{
					self.friendNetwork = true;
				}				
				if ( self.friendNetwork )
				{
					var sm = new Module( 'system' );
					sm.onExecuted = function( e, d ) 
					{
						var fnet;
						if( e == 'ok' )
						{
							if( d )
							{
								try
								{
									d = JSON.parse( d );
									if ( d.friendNetwork != [] )
										fnet = d.friendNetwork;
								}
								catch( e )
								{
									d = null;
								}
							}
						}
						var activate                    = ge( 'fnetActivate' );
						var workgroup                   = ge( 'fnetWorkgroup' );
						var password                    = ge( 'fnetPassword' );
						var repeat                      = ge( 'fnetRepeatPassword' );
						var description                 = ge( 'fnetDescription' );
						var any                         = ge( 'fnetAcceptAny' );
						var downloadCheck               = ge( 'fnetDownloadCheck' );
						var downloadPath                = ge( 'fnetDownloadPath' );
						var mountDriveCheck             = ge( 'fnetMountDriveCheck' );
						var mountOnWorkspace            = ge( 'fnetMountOnWorkspaceCheck' );
						var fnetActivatePower           = ge( 'fnetActivatePower' );
						var fnetShareThisDevice         = ge( 'fnetShareThisDevice' );
						var fnetMaximumPercentage       = ge( 'fnetMaximumPercentage' );
						var fnetAllowPowerApplications  = ge( 'fnetAllowPowerApplications' );
						var fnetOptimalNumberOfMachines = ge( 'fnetOptimalNumberOfMachines' );
						var fnetMinimalNumberOfMachines = ge( 'fnetMinimalNumberOfMachines' );
						var fnetShareOnlyWithCommunity  = ge( 'fnetShareOnlyWithCommunity' );
						var fnetShareOnlyWithFriends    = ge( 'fnetShareOnlyWithFriends' );
						var fnetAskOnlyToFriends        = ge( 'fnetAskOnlyToFriends' );
						var fnetAskOnlyToCommunity      = ge( 'fnetAskOnlyToCommunity' );
						
						var pass = fnet ? fnet.password : '';
						if ( pass == 'public' || ( fnet && fnet.workgroup == 'friend' ) )
							pass = '';
						workgroup.placeholder = i18n( 'i18n_workgroupPlaceHolder' );

						if ( !fnet )
						{
							// Friend Network page
							activate.checked = false;
							workgroup.value = '';
							password.value = '';
							repeat.value = '';
							description.value = '';
							any.checked = false;
							downloadCheck.checked = true;
							mountDriveCheck.checked = true;
							mountOnWorkspace.checked = false;
							downloadPath.value = 'Home:Downloads'
						}
						else
						{
							// Friend Network page
							activate.checked = fnet.activated;
							workgroup.value = fnet.workgroup == 'friend' ? '' : fnet.workgroup;
							password.value = pass;
							repeat.value = pass;
							description.value = fnet.description;
							any.checked = fnet.acceptAny;
							downloadCheck.checked = ( typeof fnet.downloadPath != 'undefined' && fnet.downloadPath != '' ) ? true : false;
							mountDriveCheck.checked = ( typeof fnet.mountDrive != 'undefined' ) ? fnet.mountDrive : false;
							mountOnWorkspace.checked = ( typeof fnet.mountOnWorkspace != 'undefined' ) ? fnet.mountOnWorkspace : false;
							downloadPath.value = ( typeof fnet.downloadPath != 'undefined' && fnet.downloadPath != '' ) ? fnet.downloadPath : '';
							if ( !mountDriveCheck.checked )
								mountOnWorkspace.checked = false;
						}

						// Power sharing
						if( typeof fnet == 'undefined' || typeof fnet.powerSharing == 'undefined' )
						{	
							// Power sharing page
							fnetActivatePower.checked = false;
							fnetShareThisDevice.checked = true;
							fnetMaximumPercentage.value = '33';
							fnetAllowPowerApplications.checked = true;
							fnetOptimalNumberOfMachines.value = '1000';
							fnetMinimalNumberOfMachines.value = '1';					
							fnetShareOnlyWithFriends.checked = false;
							fnetShareOnlyWithCommunity.checked = true;					
							fnetAskOnlyToCommunity.checked = true;					
							fnetAskOnlyToFriends.checked = false;					
						}
						else
						{
							fnetActivatePower.checked = fnet.powerSharing.enabled;
							fnetShareThisDevice.checked = fnet.powerSharing.shareDevice;
							fnetMaximumPercentage.value = fnet.powerSharing.percentageShared;
							fnetAllowPowerApplications.checked = fnet.powerSharing.useHelpers;
							fnetOptimalNumberOfMachines.value = fnet.powerSharing.optimalNumberOfHelpers;
							fnetMinimalNumberOfMachines.value = fnet.powerSharing.minimalNumberOfHelpers;
							fnetShareOnlyWithCommunity.checked = fnet.powerSharing.shareOnlyWithCommunity;
							fnetShareOnlyWithFriends.checked = fnet.powerSharing.shareOnlyWithFriends;
							fnetAskOnlyToCommunity.checked = fnet.powerSharing.askOnlyToCommunity;
							fnetAskOnlyToFriends.checked = fnet.powerSharing.askOnlyToFriends;
						}
						activateFriendNetwork();
						clickFriendNetworkPower()
					};
					sm.execute( 'getsetting', { setting: 'friendNetwork' } );
				}
			};
			m.execute( 'checkfriendnetwork' );

			// Device information settings
			FriendNetworkFriends.getUniqueDeviceIdentifier( function( message )
			{
				var sm = new Module( 'system' );
				sm.onExecuted = function( e, d ) 
				{
					var infos;
					if( e == 'ok' )
					{
						if( d )
						{
							try
							{
								d = JSON.parse( d );
								if ( d[ message.identifier ] != [] )
									infos = d[ message.identifier ];
							}
							catch( e )
							{
								d = null;
							}
						}
					}
					if ( infos )
					{
						if(ge( 'fnetDeviceName' ) ) ge( 'fnetDeviceName' ).value = infos.name;
						if(ge( 'fnetDeviceDescription' ) ) ge( 'fnetDeviceDescription' ).value = infos.description;
						if(ge( 'fnetMountLocalCheck' ) ) ge( 'fnetMountLocalCheck' ).checked = infos.mountLocalDrives;
						if(ge( 'fnetDeviceAvatar' ) ) ge( 'fnetDeviceAvatar' ).src = infos.image;
					}
					else
					{
						FriendNetworkFriends.getDeviceInformation( '', function( message )
						{
							var infos = message.information;

							if ( infos.name && ge( 'fnetDeviceName' ))
								ge( 'fnetDeviceName' ).value = infos.name;
							else if( ge( 'fnetDeviceName' ) )
								ge( 'fnetDeviceName' ).value = infos.os;
								
							if ( infos.description && ge( 'fnetDeviceDescription' ) )
								ge( 'fnetDeviceDescription' ).value = infos.description ? infos.description : '';

							if ( infos.mountLocalDrives && ge( 'fnetMountLocalCheck' ) )
								ge( 'fnetMountLocalCheck' ).checked = infos.mountLocalDrives;
							else if( ge( 'fnetMountLocalCheck' ) )
								ge( 'fnetMountLocalCheck' ).checked = true;

							if( ge( 'fnetDeviceAvatar' ) ) ge( 'fnetDeviceAvatar' ).src = infos.icon;
						} );
					}
				};
				sm.execute( 'getsetting', { setting: message.identifier } );
			});
			break;
		
		case 'setkey':
			
			if( msg && msg.data )
			{
				displayPublicKey( msg.data );
			}
			
			break;
	}
}

function changeAvatar()
{
	var self = this;
	var description =
	{
		triggerFunction: function( item )
		{
			if ( item )
			{
				// Load the image
				var image = new Image();
				image.onload = function()
				{
					// Resizes the image
					var canvas = ge( 'Avatar' );
					var context = canvas.getContext( '2d' );
					context.drawImage( image, 0, 0, 256, 256 );
				}
				image.src = getImageUrl( item[ 0 ].Path );
			}
		},
		path: "Mountlist:",
		type: "load",
		title: i18n( 'i18n_fileselectoravatar' ),
		filename: ""
	}
	var d = new Filedialog( description );
}

function changeDeviceAvatar()
{
	var self = this;
	var description =
	{
		triggerFunction: function( item )
		{
			if ( item )
			{
				// Load the image
				var image = new Image();
				image.onload = function()
				{
					// Resizes the image to 128x128
					var canvas = document.createElement( 'canvas' );
					canvas.width = 128;
					canvas.height = 128;
					var context = canvas.getContext( '2d' );
					context.drawImage( image, 0, 0, 128, 128 );
					var data = canvas.toDataURL();

					// Sets the image
					ge( 'fnetDeviceAvatar' ).src = data;				
				}
				image.src = getImageUrl( item[ 0 ].Path );
			}
		},
		path: "Mountlist:",
		type: "load",
		title: i18n( 'i18n_fileselectoravatar' ),
		filename: ""
	}
	var d = new Filedialog( description );
}

function activateFriendNetwork()
{
	var activate = ge( 'fnetActivate' );
	ge( 'fnetWorkgroup' ).disabled = !activate.checked;
	ge( 'fnetPassword' ).disabled = !activate.checked;
	ge( 'fnetRepeatPassword' ).disabled = !activate.checked;
	ge( 'fnetAcceptAny' ).disabled = !activate.checked;
	ge( 'fnetDescription' ).disabled = !activate.checked;
	ge( 'fnetDownloadCheck' ).disabled = !activate.checked;
	this.downloadCheck( !activate.checked );
}

function downloadCheck( disable )
{
	var disabled = ( !ge( 'fnetDownloadCheck' ).checked ) || disable;
	ge( 'fnetDownloadPath' ).disabled = disabled;
	ge( 'fnetDownloadButton' ).disabled = disabled;
	if ( disabled )
		ge( 'fnetDownloadPath' ).value = '';
}

function mountDriveCheck( disable )
{
	var checked = ge( 'fnetMountDriveCheck' ).checked;
	if ( !checked )
		ge( 'fnetMountOnWorkspaceCheck' ).checked = false;
}

function downloadButton( disable )
{
	new Filedialog( false, function( path )
	{
		if ( path && typeof path == 'string' && path.indexOf( 'Mountlist:' ) < 0 )
		{
			ge( 'fnetDownloadPath' ).value = path;
		}
		else
		{
			Alert( i18n( 'i18n_friendNetwork' ), i18n( 'i18n_fnetPleaseChooseDirectory' ) );
		}
	}, 'Mountlist:', 'path', '', i18n( 'i18n_fnetPleaseChooseDirectory' ) );
}

function clickFriendNetworkPower()
{
	var enabled = !ge( 'fnetActivatePower' ).checked;

	// I love when it looks nice like that! :)
	ge( 'fnetShareThisDevice' ).disabled = enabled;
	ge( 'fnetMaximumPercentage' ).disabled = enabled;
	ge( 'fnetAllowPowerApplications' ).disabled = enabled;
	ge( 'fnetOptimalNumberOfMachines' ).disabled = enabled;
	ge( 'fnetMinimalNumberOfMachines' ).disabled = enabled;
	ge( 'fnetAskOnlyToCommunity' ).disabled = enabled;
	ge( 'fnetAskOnlyToFriends' ).disabled = enabled;
	ge( 'fnetShareOnlyWithCommunity' ).disabled = enabled;
	ge( 'fnetShareOnlyWithFriends' ).disabled = enabled;
}

function clickShareThisDevice()
{
	var enabled = !ge( 'fnetShareThisDevice' ).checked;

	ge( 'fnetMaximumPercentage' ).disabled = enabled;
	ge( 'fnetShareOnlyWithCommunity' ).disabled = enabled;
	ge( 'fnetShareOnlyWithFriends' ).disabled = enabled;
}

function clickAllowPowerApplications()
{
	var enabled = !ge( 'fnetAllowPowerApplications' ).checked;

	ge( 'fnetOptimalNumberOfMachines' ).disabled = enabled;
	ge( 'fnetMinimalNumberOfMachines' ).disabled = enabled;
	ge( 'fnetAskOnlyToCommunity' ).disabled = enabled;
	ge( 'fnetAskOnlyToFriends' ).disabled = enabled;
}

function drawKeyList( list )
{
	var str = '';
	
	if( list )
	{
		for( var i in list )
		{
			str += '<div class="HRow">' + 
				'<div class="HContent40 FloatLeft">' + 
					'<p class="Layout InputHeight">' + 
						'<strong>' + ( list[i].Name ? list[i].Name : list[i].RowType ) + ( list[i].Type ? ' (' + list[i].Type + ')' : '' ) + ':</strong>' +
					'</p>' + 
				'</div>' + 
				'<div class="HContent40 FloatLeft">' + 
					'<p class="Layout InputHeight">' + 
						'<input type="text" class="FullWidth" onclick="this.focus(); this.select();" value="' + list[i].Data + '" id="KeyID_' + list[i].ID + '" placeholder="{data}" readonly="readonly"/>' + 
					'</p>' + 
				'</div>' + 
				'<div class="HContent10 FloatLeft">' + 
					'<p class="Layout InputHeight">' + 
						'<button type="button" class="Button IconSmall fa-' + ( list[i].PublicKey ? 'lock' : 'unlock' ) + '" onclick="displayKey(\''+list[i].ID+'\',this)"></button>' + 
					'</p>' + 
				'</div>' +
				'<div class="HContent10 FloatLeft">' + 
					'<p class="Layout InputHeight">' + 
						'<button type="button" class="Button IconSmall fa-times" onclick="deleteKey( ' + list[i].ID + ' )"></button>' + 
					'</p>' + 
				'</div>' + 
			'</div>';
		}
	}

	if( ge( 'KeysList' ) )
	{
		var str = '<div class="List MarginBottom">';
		
		str += '<div class="HRow">\
					<div class="FloatLeft BorderRight Ellipsis PaddingSmall" style="width: 33.3%">\
					<strong>' + i18n( 'i18n_key_name' ) + ':</strong></div>\
					<div class="FloatLeft BorderRight Ellipsis PaddingSmall" style="width: 33.3%">\
					<strong>' + i18n( 'i18n_application' ) + ':</strong></div>\
					<div class="FloatLeft Ellipsis PaddingSmall" style="width: 33.4%">\
					<strong>'+ i18n( 'i18n_options' ) + ':</strong></div>\
				</div>';
	
		if( list )
		{	
			var sw = 0;
			for( var i in list )
			{
				sw = sw == 'sw2' ? 'sw1' : 'sw2';
				str += '<div class="HRow ' + sw + '">' + 
					'<div class="FloatLeft PaddingSmall BorderRight" style="width: 33.3%">' + list[i].Name + ( list[i].Type && list[i].Type != 'plain' ? ' (' + list[i].Type + ')' : '' ) + '</div>' + 
					'<div class="FloatLeft PaddingSmall BorderRight" style="width: 33.3%">' + ( list[i].ApplicationID > 0 ? ( list[i].Application ? list[i].Application : list[i].ApplicationID ) : ( list[i].ApplicationID == '-1' ? i18n( 'i18n_devices' ) : i18n( 'i18n_system_wide' ) ) ) + '</div>' + 
					'<div class="FloatLeft PaddingSmall" style="width: 33.4%"> ' + 
						'<button class="Accept Button IconSmall fa-edit" onclick="editKey(' + list[i].ID + ')"> Edit</button> ' + 
						'<button class="Danger Button IconSmall fa-minus" onclick="deleteKey(' + list[i].ID + ')"> Remove</button>' + 
					'</div>' +
				'</div>';
			}
		}
	
		str += '</div>';
	
		str += '<div>' + 
			'<button type="button" class="Button IconSmall fa-plus" onclick="editKey()"> ' + i18n( 'i18n_add_key' ) + '</button>' + 
			'<hr class="Divider"/><h3>' + i18n( 'i18n_your_public_key' ) + ':</h3>\
				<p>\
					<textarea class="FullWidth" value="" style="height: 120px" readonly="readonly" id="UserAccPublicKey" onclick="this.focus();this.select();"></textarea>\
				</p>'
		'</div>';
	
	
		ge( 'KeysList' ).innerHTML = str;
	}
}

function refreshUserKeys()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var data = false;
		
		if( e != 'ok' )
			return;
			
		data = JSON.parse( d );
		
		drawKeyList( data );
		
		Application.encryption.publickey( function( res, data )
		{
			if( res && data && data.publickey )
			{
				displayPublicKey( data.publickey );
			}
		} );
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
			'<div class="HContent30 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_key_name' ) + ':</label></div>' + 
			'<div class="HContent70 FloatLeft"><input class="FullWidth InputHeight" id="KeyName" type="text" value="' + ( data.Name ? data.Name : '' ) + '"/></div>' + 
		'</div>' + 
		'<div class="HRow PaddingBottom">' + 
			'<div class="HContent30 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_key_type' ) + ':</label></div>' + 
			'<div class="HContent70 FloatLeft">' + 
				'<select class="FullWidth InputHeight" id="KeyType">' + 
					'<option value="plain"' + ( !data.Type || data.Type == 'plain' ? ' selected="selected"' : '' ) + '>Plain</option>' + 
					'<option value="md5"' + ( data.Type && data.Type == 'md5' ? ' selected="selected"' : '' ) + '>MD5</option>' + 
					'<option value="sha256"' + ( data.Type && data.Type == 'sha256' ? ' selected="selected"' : '' ) + '>SHA256</option>' + 
					'<option value="rsa1024"' + ( data.Type && data.Type == 'rsa1024' ? ' selected="selected"' : '' ) + '>RSA1024</option>' + 
				'</select>' + 
			'</div>' + 
		'</div>' +
		'<div class="HRow PaddingBottom">' + 
			'<div class="HContent30 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_application' ) + ':</label></div>' + 
			'<div class="HContent70 FloatLeft">' + 
				'<select class="FullWidth InputHeight" id="KeyApplication"><option value="0">' + i18n( 'i18n_system_wide' ) + '</option><option value="-1">' + i18n( 'i18n_devices' ) + '</option></select>' + 
			'</div>' + 
		'</div>' + 
		'<div class="HRow PaddingBottom">' + 
			'<div class="HContent30 FloatLeft"><label class="FullWidth InputHeight">' + i18n( 'i18n_data' ) + ':</label></div>' + 
			'<div class="HContent70 FloatLeft">' + 
			'<input id="KeyPublic" type="hidden" value="' + ( data.PublicKey ? data.PublicKey : '' ) + '">' + 
			'<textarea class="FullWidth" style="height:100px" id="KeyData">' + ( data.Data ? data.Data : '' ) + '</textarea>' + 
			'</div>' + 
		'</div>' + 
		'<div class="HRow">' + 
			'<button class="Button IconSmall fa-gear" onclick="generateKey()"> ' + i18n( 'i18n_generate_key' ) + ' </button> ' + 
			'<div style="text-align: right; float: right">' +
			'<button class="Button IconSmall fa-remove" onclick="closeKey()"> ' + i18n( 'i18n_close' ) + ' </button> ' + 
			( data.PublicKey ? 
			'<button class="Button IconSmall fa-unlock" onclick="dataEncryption(this)"> ' + i18n( 'i18n_decrypt' ) + ' </button> ' 
			:
			'<button class="Button IconSmall fa-lock" onclick="dataEncryption(this)"> ' + i18n( 'i18n_encrypt' ) + ' </button> ' 
			) +
			'<button class="Button IconSmall fa-save" onclick="saveKey(' + ( id ? id : '' ) + ')"> ' + i18n( 'i18n_save' ) + ' </button> ' + 
			'</div>' + 
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
		Application.encryption.generateKeys( args.data, args.type, function( e, d )
		{
			//console.log( 'Return on callback: ', { e:e, d:d } );
			
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
	// What was this used for now again???
	if( ge( 'PublicKeyContainer' ) )
	{
		ge( 'UserAccPublicKey' ).value = key;
	}
	
	if( key && ge( 'UserAccPublicKey' ) )
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
				
				if( data &&OnWorkspace data.encrypted && data.publickey )
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
	if( !id ) return;
	Confirm( i18n( 'i18n_deleting_key' ), i18n( 'i18n_are_you_sure' ), function( res )
	{
		if( res.data )
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
	} );
}

function cancelDia()
{
	Application.sendMessage( { command: 'quit' } );
}

// Save settings
function saveDia()
{
	// Saves the avatar --------------------------------------------------------
	
	var canvas = ge( 'Avatar' );
	context = canvas.getContext( '2d' );
	var base64 = canvas.toDataURL();
	var ma = new Module( 'system' );
	ma.forceHTTP = true;
	ma.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			console.log( 'Avatar saving failed.' );
		}
		/*else
		{
			console.log( 'Saved avatar.' );
		}*/
	};
	ma.execute( 'setsetting', { setting: 'avatar', data: base64 } );
	//console.log( 'Saving dia!' );

	// Friend network settings -------------------------------------------------
	
	if( Application.friendNetwork )
	{
		// Save device information 
		var image = ge( 'fnetDeviceAvatar' );
		var canvas = document.createElement( 'canvas' );
		canvas.width = 128;
		canvas.height = 128;
		var context = canvas.getContext( '2d' );
		context.drawImage( image, 0, 0, 128, 128 );
		var image = canvas.toDataURL();
		var deviceName = ge( 'fnetDeviceName' ).value;
		var deviceDescription = ge( 'fnetDeviceDescription' ).value;
		var mountLocalDrives = ge( 'fnetMountLocalCheck' ).checked;

		var save = 
		{
			version: 1,
			image: image,
			name: deviceName,
			description: deviceDescription,
			mountLocalDrives: mountLocalDrives
		};
		
		FriendNetworkFriends.getUniqueDeviceIdentifier( function( message ) 
		{
			var me = new Module( 'system' );
			me.onExecuted = function( e, d )
			{
				if( e != 'ok' )
					console.log( 'Device information saving failed.' );
			};
			me.execute( 'setsetting', { setting: message.identifier, data: save } );
		} );
		
		// Save Friend Network settings...
		var activate = ge( 'fnetActivate' );
		var workgroup = ge( 'fnetWorkgroup' );
		var password = ge( 'fnetPassword' );
		var repeat = ge( 'fnetRepeatPassword' );
		var description = ge( 'fnetDescription' );
		var any = ge( 'fnetAcceptAny' );
		var downloadPath = ge( 'fnetDownloadPath' ).value;
		var downloadChecked = ge( 'fnetDownloadCheck' ).checked;
		var mountDriveChecked = ge( 'fnetMountDriveCheck' ).checked;
		var mountOnWorkspaceChecked = ge( 'fnetMountOnWorkspaceCheck' ).checked;
		
		if ( downloadPath == '' )
			downloadChecked = false;
		if ( workgroup == '' ) // Empty workgroup-> global 'friend' space
		{
			workgroup = 'friend';
			password = 'public';
		}
		if ( password.value != repeat.value )
		{
			Alert( i18n( 'i18n_account' ), i18n( 'i18n_passwordNoMatch' ) );
			return;
		}
	
		var fnet = 
		{
			configVersion: FriendNetworkFriends.configVersion,
			activated: activate.checked,
			workgroup: workgroup.value,
			password: ( password.value == '' ? 'public' : password.value ),
			acceptAny: any.checked,
			downloadPath: downloadChecked ? downloadPath : '',
			description: description.value,
			mountDrive: mountDriveChecked,
			mountOnWorkspace: mountOnWorkspaceChecked,
			powerSharing:
			{
				enabled: ge( 'fnetActivatePower' ).checked,
				shareDevice: ge( 'fnetShareThisDevice' ).checked,
				percentageShared: parseInt( ge( 'fnetMaximumPercentage' ).value ),
				shareOnlyWithCommunity: ge( 'fnetShareOnlyWithCommunity' ).checked,
				shareOnlyWithFriends: ge( 'fnetShareOnlyWithFriends' ).checked,
				useHelpers: ge( 'fnetAllowPowerApplications' ).checked,
				optimalNumberOfHelpers: parseInt( ge( 'fnetOptimalNumberOfMachines' ).value ),
				minimalNumberOfHelpers: Math.max( parseInt( ge( 'fnetMinimalNumberOfMachines' ).value ), 1 ),
				askOnlyToCommunity: ge( 'fnetAskOnlyToCommunity' ).checked, 
				askOnlyToFriends: ge( 'fnetAskOnlyToFriends' ).checked
			}
		};
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
				console.log( 'Friend Network saving failed.' );
			else
			{
				FriendNetworkShare.changeFriendNetworkSettings( fnet );
				FriendNetworkDoor.changeFriendNetworkSettings( fnet );
				FriendNetworkFriends.changeFriendNetworkSettings( fnet );
				FriendNetworkDrive.changeFriendNetworkSettings( fnet );
				Friend.Network.Power.changeFriendNetworkSettings( fnet );
			}
		};
		m.execute( 'setsetting', { setting: 'friendNetwork', data: fnet } );
	}
	
	// Credentials -------------------------------------------------------------
	
	// Get save object
	var obj = {
		fullname: ( ge( 'UserAccFullname' ).value ),
		name:     htmlentities( ge( 'UserAccUsername' ).value ),
 		email:    ge( 'UserAccEmail' ).value,
 		timezone: ge( 'UserAccTimezone' ).value
	};
	
	var nuserCredentials = ge( 'UserAccFullname' ).value.substr( 0, 1 );
	var m = 0;
	for( var c = 1; c < ge( 'UserAccFullname' ).value.length; c++ )
	{
		if( ge( 'UserAccFullname' ).value.substr( c, 1 ) == ' ' )
		{
			m = 1;
			continue;
		}
		if( m == 1 )
		{
			nuserCredentials += ge( 'UserAccFullname' ).value.substr( c, 1 );
			break;
		}
	}
	nuserCredentials = nuserCredentials.toUpperCase();
	
	// Shall we save new password
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
		
		if( nuserCredentials != userCredentials )
		{
			userCredentials = nuserCredentials;
			ge( 'ClearAvatar' ).click();
		}
	}
	obj.command = 'update';
	f.execute( 'user', obj );
	
	// Languages ---------------------------------------------------------------
	
	// Save language setting
	if( ge( 'UserLanguage' ).value != Application.language )
	{
		function updateLanguages()
		{
			Confirm( i18n( 'i18n_update_language_warning' ), i18n( 'i18n_update_language_desc' ), function( resp )
			{
				if( resp.data )
				{
					// Find right language for speech
					var langs = speechSynthesis.getVoices();
					var voice = false;
					for( var v = 0; v < langs.length; v++ )
					{
						if( langs[v].lang.substr( 0, 2 ) == ge( 'UserLanguage' ).value )
						{
							voice = {
								spokenLanguage: langs[v].lang,
								spokenAlternate: langs[v].lang // TODO: Pick an alternative voice - call it spokenVoice
							};
						}
					}
					
					var mt = new Module( 'system' );
					mt.onExecuted = function( e, d )
					{	
						var mo = new Module( 'system' );
						mo.onExecuted = function()
						{
							Application.sendMessage( { type: 'system', command: 'brutalsignout' } );
						}
						mo.execute( 'setsetting', { setting: 'locale', data: ge( 'UserLanguage' ).value } );
					}
					mt.execute( 'setsetting', { setting: 'language', data: voice } );
				}
				else
				{
					var opts = ge( 'UserLanguage' ).getElementsByTagName( 'option' );
					for( var a = 0; a < opts.length; a++ )
					{
						if( opts[a].value == Application.language )
							opts[a].selected = 'selected';
						else opts[a].selected = '';
					}
					return;
				}
			} );
		}
		if( speechSynthesis.getVoices().length <= 0 )
			setTimeout( function(){ updateLanguages(); }, 150 );
		else updateLanguages();
	}
	
	var mo = new Module( 'system' );
	mo.execute( 'setsetting', { setting: 'workspacemode', data: ge( 'UserMode' ).value } );
	
	// How do we run Friend ----------------------------------------------------
	
	var workspaceMode = ge( 'UserMode' );
	if( workspaceMode ) workspaceMode = workspaceMode.value;
	else workspaceMode = 'normal';
	Application.sendMessage( { type: 'system', command: 'setworkspacemode', mode: workspaceMode } );
}

function toggleChangePass()
{
	var ele = ge( 'passToggle' );
	var container = ge( 'ChangePassContainer' );
	if( container.classList.contains( 'closed' ) )
	{
		container.classList.remove( 'closed' );
		container.classList.add( 'opened' );
		ele.classList.add( 'Accept' );
		ge( 'UserCurrentPassword' ).focus();
	}
	else
	{
		ge( 'UserCurrentPassword' ).blur();
		container.classList.remove( 'opened' );
		container.classList.add( 'closed' );
		ele.classList.remove( 'Accept' );
	}
}

function getUnmounted()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'Unmounted' ).style.display = 'none';
			ge( 'StorageListUnmounted' ).innerHTML = '';
			return;
		}
		ge( 'Unmounted' ).style.display = 'block';
		var js = JSON.parse( d );
		var str = '';
		for( var a = 0; a < js.length; a++ )
		{
			str += '<div class="FloatLeft Disk MousePointer" onclick="editStorage(\'' + js[a].Name + '\')"><div class="Label Ellipsis">' + js[a].Name + '</div></div>';
		}
		ge( 'StorageListUnmounted' ).innerHTML = str;
	}
	m.execute( 'mountlist', { mounted: '0' } );
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
			var userLevel = parent.Workspace.userLevel.toLowerCase();
			for( var a = 0; a < js.length; a++ )
			{
				//console.log('storage device', JSON.stringify(js[a]));
				//dont let non-admins manage workgroup drives.
				if( js[a].Type == 'SQLWorkgroupDrive' && userLevel != 'admin')
					str += '<div class="FloatLeft Disk MousePointer NonEditableDisk" onclick="Notify({\'title\':\''+ i18n('i18n_account') + '\',\'text\':\'' + i18n('i18n_admin_managed_drive') + '\'})"><div class="Label Ellipsis">' + js[a].Name + '</div></div>';
				else if( js[a].Mounted != '0' )
					str += '<div class="FloatLeft Disk MousePointer" onclick="editStorage(\'' + js[a].Name + '\', false, \'mounted\' )"><div class="Label Ellipsis">' + js[a].Name + '</div></div>';
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
function editStorage( name, mode, mounted )
{
	if( !mounted ) mounted = '-';
	
	// Only one view window
	if( Application.editView ) return;
	
	var v = new View( {
		title: i18n( 'i18n_edit_storage' ),
		width: 460,
		height: 450
	} );
	
	var f = new File( 'Progdir:Templates/storage_edit.html' );
	f.replacements = { vid: Application.viewId, mode: 'edit', devname: name, mounted: mounted };
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

// Init the timezone gui! ------------------------------------------------------

var timezones = null;

// Africa,Europe etc
function InitTimezoneGui()
{
	if( !timezones )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			timezones = JSON.parse( d );
			InitTimezoneGui();
		}
		m.execute( 'gettimezones' );
		return;
	}
	
	var current = ge( 'UserAccTimezone' ).value.split( '/' );
	current = current[0];
	
	let cstr = '';
	let firstZone = null;
	cstr += '<select id="TimeZoneType" onchange="SetSubTimeZones( this.value )">';
	for( let a in timezones )
	{
		let sel = current == a ? ' selected="selected"' : '';
		cstr += '<option' + sel + ' value="' + a + '">' + a + '</option>';
		if( !firstZone )
			firstZone = a;
		if( current == a )
			firstZone = a;
	}
	cstr += '</select>';
	ge( 'TimeZoneSelectA' ).innerHTML = cstr;
	SetSubTimeZones( firstZone );
}

// Africa/Somewhere
function SetSubTimeZones( zone )
{
	var current = ge( 'UserAccTimezone' ).value.split( '/' );
	if( current.length > 1 )
		current = current[1];
	else current = false;
	
	let found = false;
	let cstr = '<select id="TimeZoneSubType" onchange="ge( \'UserAccTimezone\' ).value = ge( \'TimeZoneType\' ).value + \'/\' + ge( \'TimeZoneSubType\' ).value">';
	for( let a in timezones )
	{
		if( a == zone )
		{
			found = true;
			for( let b in timezones[ a ] )
			{
				let sel = current == timezones[ a ][ b ] ? ' selected="selected"' : '';
				cstr += '<option' + sel + ' value="' + timezones[ a ][ b ] + '">' + timezones[ a ][ b ] + '</option>';
			}
		}
	}
	cstr += '</select>';
	ge( 'TimeZoneSelectB' ).innerHTML = found ? cstr : '';
	ge( 'UserAccTimezone' ).value = ge( 'TimeZoneType' ).value + '/' + ge( 'TimeZoneSubType' ).value;
}

