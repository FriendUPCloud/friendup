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
		initTokens();
		
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
	
	refreshGroups( ge( 'groupSearcher' ).value );
	
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


function findGroups()
{
	refreshGroups( ge( 'groupSearcher' ).value );
}

function refreshGroups( keys )
{
	if( !keys ) keys = '';
	
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		let list = null;
		if( e != 'ok' )
		{
			return ge( 'GroupList' ).innerHTML = '<p class="TextCenter">' + i18n( 'i18n_no_groups_available' ) + '</p>\
			<p class="BorderTop PaddingTop MarginTop TextCenter">\
				<button type="button" class="Button IconSmall fa-plus" onclick="createGroup()">\
					' + i18n( 'i18n_create_group' ) + '\
				</button>\
			</p>';
		}
		try
		{
			list = JSON.parse( d );
		}
		catch( e )
		{
			return ge( 'GroupList' ).innerHTML = '<p class="TextCenter">' + i18n( 'i18n_failed_reading_groups' ) + '</p>';
		}
		
		// Filter on keywords
		if( keys.length )
		{
			let out = {};
			for( let a in list )
			{
				if( list[a].Name.toLowerCase().indexOf( keys.toLowerCase() ) >= 0 )
					out[a] = list[a];
			}
			list = out;
		}
		
		let sw = 1;
		let count = 0;
		
		let str = '<h2 class="PaddingLeft MarginTop">' + i18n( 'i18n_your_groups' ) + '</h2>';
		str += '<div class="Collections PaddingSmall">';
		
		for( let a in list )
		{
			// TODO: Make sure we can get our descriptions!
			if( !list[a].description )
				list[a].description = '';
			str += '<div class="MousePointer sw' + sw + ' Collection" onclick="editGroup(\'' + list[a].ID + '\')">\
				<div class="Image"></div>\
				<div class="Name" title="' + list[a].Name + '"><span>' + list[a].Name + '</span></div>\
				<div class="Description">' + ( list[a].Description ? list[a].Description : i18n( 'i18n_no_description' ) ) + '</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
			count++;
		}
		
		str += '</div>';
		
		if( Application.getUserLevel() != 'admin' && count >= 3 )
		{
			str += '<p class="BorderTop PaddingTop MarginTop">\
				<button type="button" class="Button IconSmall fa-plus Disabled" disabled="disabled">\
					' + i18n( 'i18n_create_group_disabled' ) + '\
				</button>\
			</p>';
		}
		else
		{
			str += '<p class="BorderTop PaddingTop MarginTop">\
				<button type="button" class="Button IconSmall fa-plus" onclick="createGroup()">\
					' + i18n( 'i18n_create_group' ) + '\
				</button>\
			</p>';
		}
	
		ge( 'GroupList' ).innerHTML = str;
	}
	m.execute( 'listworkgroups' );
	
	let n = new Module( 'system' );
	n.onExecuted = function( e, d )
	{
		
		if( e != 'ok' ) { ge( 'OtherGroups' ).innerHTML = ''; return; }
		try
		{
			d = JSON.parse( d );
		}
		catch( e ){ ge( 'OtherGroups' ).innerHTML = ''; return; }
		
		let str = '<hr class="Divider"/>';
		
		str += '<div class="Padding"><h2>' + i18n( 'i18n_other_groups' ) + '</h2><div class="List">';
		str += '<div class="HRow">\
				<div class="PaddingSmall FloatLeft HContent35"><strong>' + i18n( 'i18n_group_name' ) + '</strong></div>\
				<div class="PaddingSmall FloatLeft HContent35"><strong>' + i18n( 'i18n_owner' ) + '</strong></div>\
				<div class="PaddingSmall FloatLeft HContent20"><strong>' + i18n( 'i18n_reason' ) + '</strong></div>\
				<div class="PaddingSmall FloatLeft HContent10 TextRight"></div>\
			</div>';
		let sw = 2;
		for( let a = 0; a < d.length; a++ )
		{
			let button = '<button type="button" class="Button IconSmall fa-remove NoText IconButton" title="' + i18n( 'i18n_leave_group' ) + '" onclick="leaveGroup(\'' + d[a].ID + '\')"></button>';
			let reason = '';
			// Cannot remove yourself from Admin administrated groups
			if( d[a].Level == 'Admin' && d[a].IsInvite == 0 )
			{
				button = '';
				reason = i18n( 'i18n_added_by_admin' );
			}
			
			sw = sw == 1 ? 2 : 1;
			str += '<div class="HRow sw' + sw + '">\
				<div class="PaddingSmall FloatLeft HContent35 Ellipsis">' + d[a].Name + '</div>\
				<div class="PaddingSmall FloatLeft HContent35 Ellipsis">' + d[a].Invitor + '</div>\
				<div class="PaddingSmall FloatLeft HContent20 Ellipsis">' + reason + '</div>\
				<div class="PaddingSmall FloatLeft HContent10 TextRight">' + button + '</div>\
			</div>';
		}
		str += '</div></div>';
		ge( 'OtherGroups' ).innerHTML = str;
	}
	n.execute( 'listworkgroups', { mode: 'invites' } );
}

function leaveGroup( gid )
{
	Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_leave_warning' ), function( data )
	{
		if( data.data == true )
		{
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					refreshGroups( ge( 'groupSearcher' ).value );
				}
			}
			m.execute( 'leavegroup', { groupId: gid } );
		}
	} );
}

let mviews = {};

function createGroup()
{
	let v = new View( {
		title: i18n( 'i18n_create_group' ),
		width: 500,
		height: 200
	} );
	
	let vid = v.getViewId()
	
	mviews[ vid ] = v;
	
	let f = new File( 'Progdir:Templates/group.html' );
	f.replacements = {
		ID: '',
		Description: '',
		Name: '',
		Hidden: 'Hidden',
		DeleteCl: ' Hidden'
	};
	f.i18n();
	f.onLoad = function( d )
	{
		v.setContent( d );
	}
	f.load();
	
	v.onClose = function()
	{
		let out = {};
		for( let a in mviews )
		{
			if( a != vid ) out[ a ] = mviews[ a ];
		}
		mviews = out;
	}
}

function editGroup( id )
{
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			return;
		}
		let gr = JSON.parse( d );
		
		let v = new View( {
			title: i18n( 'i18n_edit_group' ),
			width: 500,
			height: 500
		} );
		
		let vid = v.getViewId()
	
		mviews[ vid ] = v;
		
		let f = new File( 'Progdir:Templates/group.html' );
		f.replacements = {
			ID: id,
			Description: gr.Description ? gr.Description : '',
			Name: gr.Name,
			Hidden: 'Showing',
			DeleteCl: ' Showing'
		};
		f.i18n();
		f.onLoad = function( d )
		{
			v.setContent( d );
		}
		f.load();
	}
	m.execute( 'workgroupget', { id: id } );
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
					ctx.drawImage( avSrc, 0, 0, 128, 128 );
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
		case 'resizeGroupWindow':
			if( mviews[ msg.viewId ] )
			{
				mviews[ msg.viewId ].setFlag( 'height', 500 );
			}
			break;
		case 'refreshInvites':
			if( mviews )
			{
				for( var i in mviews )
				{
					if( mviews[i] )
					{
						mviews[i].sendMessage( { command: 'refreshInvites' } );
					}
				}
			}
			break;
		case 'refreshgroups':
			refreshGroups( ge( 'groupSearcher' ).value );
			break;
		case 'addstorage':
			addStorage( 'quitonclose' );
			break;
		case 'refresh':
			getStorage();
			getUnmounted();
			initTokens();
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
			
			if( ge( 'UserAccPasswordButton' ) && msg.UserType && ( msg.UserType == 'External' || msg.UserType == 'Doorman' ) )
			{
				ge( 'UserAccPasswordButton' ).innerHTML = '<input type="password" class="FullWidth InputHeight" value="********************" disabled="disabled"/>';	
			}
			
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
					context.drawImage( image, 0, 0, 128, 128 );
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
	if( ge( 'UserAccPassword' ).value != '' && ge( 'UserAccPassword' ).value != '******' )
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
			if( js[a].Name == 'Home' )
				js[a].Type = 'Home';
			str += '<div class="FloatLeft Disk MousePointer ' + js[a].Type + '" onclick="editStorage(\'' + js[a].Name + '\')"><div class="Label Ellipsis">' + js[a].Name + '</div></div>';
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
				if( js[a].Name == 'Home' )
					js[a].Type = 'Home';
				if( js[a].Name == 'Shared' ) continue;
				if( js[a].Type == 'SQLWorkgroupDrive' && userLevel != 'admin')
					str += '<div class="FloatLeft Disk MousePointer NonEditableDisk ' + js[a].Type + '" onclick="Notify({\'title\':\''+ i18n('i18n_account') + '\',\'text\':\'' + i18n('i18n_admin_managed_drive') + '\'})"><div class="Label Ellipsis">' + js[a].Name + '</div></div>';
				else if( js[a].Mounted != '0' )
					str += '<div class="FloatLeft Disk MousePointer ' + js[a].Type + '" onclick="editStorage(\'' + js[a].Name + '\', false, \'mounted\' )"><div class="Label Ellipsis">' + js[a].Name + '</div></div>';
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

const ns = {};
function initTokens()
{
	if ( null == Application.tabTokens )
		Application.tabTokens = new ns.TabTokens();
	else
		Application.tabTokens.refresh();
}

ns.TabTokens = function()
{
	const self = this;
	self.items = {};
	self.itemIds = [];
	self.list = null;
	
	self.init();
}

// Public

ns.TabTokens.prototype.refresh = function()
{
	const self = this;
	const list = [ self.list.children ];
	console.log( 'TabTokens.update', {
		items : self.items,
		list  : list,
	});
	
	self.populate();
}

// Pri<ate

ns.TabTokens.prototype.statuses = [
	'SECURED_HOST_STATUS_ALLOWED',
	'SECURED_HOST_STATUS_BLOCKED',
]

ns.TabTokens.prototype.init = function()
{
	const self = this;
	self.list = ge( 'TokenList' );
	self.inputHost = ge( 'ServerTokenHost' );
	self.inputStatus = ge( 'ServerTokenStatus' );
	self.inputUID = ge( 'ServerTokenUID' );
	self.addBtn = ge( 'ServerTokenCreate' );
	self.setStatusOptions();
	self.populate();
	self.addBtn.addEventListener(
		'click',
		e => self.handleAddClick(),
		false
	);
}

ns.TabTokens.prototype.getReadableStatus = function( statusNum )
{
	const self = this;
	const index = window.parseInt( statusNum, 10 );
	if ( index !== index ) // NaN test
		return 'ur nan';
	
	const status = self.statuses[ index ];
	if ( null == status )
		return 'no u';
	
	const tail = status.split( '_' )[ 3 ];
	const i18str = 'i18n_' + tail;
	const plain = i18n( i18str );
	return plain;
}

ns.TabTokens.prototype.getIsWhitelisted = function( statusNum )
{
	const self = this;
	console.log( 'getIsWhitelisted', statusNum );
	const status = window.parseInt( statusNum, 10 );
	if ( status !== status ) // NaN test
		return false;
	
	if ( 1 == status )
		return true;
	else
		return false;
}

ns.TabTokens.prototype.setStatusOptions = function( selectEl, select )
{
	const self = this;
	console.log( 'setStatusOptions', [ select, self.statuses ]);
	const html = self.statuses
		.map( ( s, i ) => buildOption( s, i ))
		.join( '');
		
	console.log( 'html', html );
	if ( null == selectEl )
		self.inputStatus.innerHTML = html;
	else
		selectEl.innerHTML = html;
	
	function buildOption( status, index )
	{
		const str = self.getReadableStatus( index );
		let selected = '';
		if ( index === select )
			selected = 'selected="selected"';
		
		const html = '<option '
			+ selected
			+ ' value="'
			+ status
			+ '">'
			+ str
			+ '</option>';
		
		return html;
	}
}

ns.TabTokens.prototype.handleAddClick = async function()
{
	const self = this;
	const host = get( self.inputHost );
	const statusStr = get( self.inputStatus );
	const uid = get( self.inputUID );
	if ( null == host )
		return;
	
	const status = self.resolveStatus( statusStr );
	console.log( 'addClick', [ host, status, uid ]);
	const created = await self.createHost( host, status, uid );
	if ( null == created ) {
		console.log( 'TabTokens.create failed', created );
		return;
	}
	console.log( 'created', JSON.stringify( created ));
	self.add( created );
	
	function get( input ) {
		console.log( 'get', input );
		if ( null == input )
			return null;
		
		let value = input.value;
		if ( !value || !value.trim )
			return null;
		
		value = value.trim();
		if ( !value )
			return null;
		
		return value;
	}
}

ns.TabTokens.prototype.handleRemoveClick = async function( hostId )
{
	const self = this;
	console.log( 'removeClick', hostId );
	const res = await self.removeHost( hostId );
	console.log( 'remove res', res );
	self.remove( hostId );
}

ns.TabTokens.prototype.handleAllowClick = async function( hostId )
{
	const self = this;
	const conf = self.items[ hostId ];
	console.log( 'handleAllowClick', [ hostId, conf ]);
	const el = conf.el;
	const allowInput = el.querySelector( '.ServerTokenStatus input' );
	console.log( 'allowInput', allowInput );
	const allow = allowInput.checked;
	console.log( 'allow', allow );
	let status = 2;
	if ( allow )
		status = 1;
	
	const res = await self.updateHost( hostId, status );
	console.log( 'res', res );
}

ns.TabTokens.prototype.handleEditClick = async function( hostId )
{
	const self = this;
	console.log( 'handleEditClick', hostId );
	const conf = self.items[ hostId ];
	if ( null == conf ) {
		console.log( 'handleEditClick, no conf', [ hostId, self.items ]);
		return;
	}
	
	const currEl = conf.el;
	const editEl = self.buildEditRow( conf );
	self.insertRow( editEl, currEl );
	currEl.parentNode.removeChild( currEl );
	conf.el = editEl;
	self.bindEditRow( editEl );
}

ns.TabTokens.prototype.handleSaveClick = async function( hostId ) {
	const self = this;
	const conf = self.items[ hostId ];
	console.log( 'handleSaveClick', conf );
	const el = conf.el;
	const select = el.querySelector( '.ServerTokenStatus' );
	const statusStr = select.value;
	const status = self.resolveStatus( statusStr );
	console.log( 'handleSaveClick - status', [ statusStr, status ] );
	const res = await self.updateHost( hostId, status );
	console.log( 'handleSaveClick - res', res );
	conf.status = res.status;
	self.switchToDisplayRow( hostId );
}

ns.TabTokens.prototype.handleCancelClick = async function( hostId ) {
	const self = this;
	console.log( 'handleCancelClick', hostId );
	self.switchToDisplayRow( hostId );
}

ns.TabTokens.prototype.switchToDisplayRow = function( hostId ) {
	const self = this;
	const conf = self.items[ hostId ];
	console.log( 'switchToDisplayRow', conf );
	if ( null == conf )
		return;
	
	const currEl = conf.el;
	const displayEl = self.buildDisplayRow( conf );
	self.insertRow( displayEl, currEl );
	currEl.parentNode.removeChild( currEl );
	conf.el = displayEl;
	self.bindDisplayRow( displayEl );
}

ns.TabTokens.prototype.populate = async function()
{
	const self = this;
	const fresh = await self.getHosts();
	const freshIds = fresh.map( r => self.getId( r.ip ));
	const remove = self.itemIds.filter( currId => {
		return !freshIds.some( fId => currId === fId );
	});
	console.log( 'pop', {
		freshIds : freshIds,
		currIds  : self.itemIds,
		remove   : remove,
	});
	
	remove.forEach( hId => self.remove( hId ));
	fresh.forEach( conf => self.add( conf ));
}

ns.TabTokens.prototype.resolveStatus = function( statusStr ) {
	const self = this;
	if ( null == statusStr )
		return 0;
	
	let status = self.statuses.indexOf( statusStr );
	if ( -1 === status )
		status = 0;
	
	return status;
}

ns.TabTokens.prototype.add = function( conf )
{
	const self = this;
	console.log( 'add', conf );
	const id = self.getId( conf.ip );
	conf.id = id;
	const rowEl = self.buildDisplayRow( conf );
	conf.el = rowEl;
	self.items[ id ] = conf;
	self.itemIds.push( id );
	self.insertRow( rowEl );
	//self.list.appendChild( rowEl );
	
	self.bindDisplayRow( rowEl );
}

ns.TabTokens.prototype.insertRow = function( insertEl, beforeEl ) {
	const self = this;
	console.log( 'insertRow', [ insertEl, beforeEl ]);
	self.list.insertBefore( insertEl, beforeEl );
}

ns.TabTokens.prototype.buildDisplayRow = function( conf, onClick ) {
	const self = this;
	console.log( 'buildRow', conf );
	//const status = self.getReadableStatus( conf.status );
	const checked = self.getIsWhitelisted( conf.status );
	const toggleId = 'toggle_' + conf.id;
	const toggle = buildToggle(
		toggleId,
		'allowToggle',
		conf.ip,
		onClick,
		checked,
		'string',
	);
	console.log( 'buildDispRow - toggle', toggle );
	const html = '<div id="'
		+ conf.id
		+ '" class="TokenRow Padding flexnes">'
			+ '<div class="ServerTokenIP">'
				+ conf.ip
			+ '</div>'
			+ '<div class="ServerTokenStatus flexnes">'
				+ i18n( 'i18n_ALLOWED' )
				+ ' '
				+ toggle
			+ '</div>'
			+ '<div class="ServerTokenActions flexnes">'
				+ '<button class="ServerTokenEdit hidden">'
					+ '<i class="fa fa-fw fa-edit"></i>'
				+ '</button>'
				+ '<button class="ServerTokenRemove">'
					+ i18n( 'i18n_remove' )
				+ '</button>'
			+ '</div>'
		+ '</div>';
	
	const wrap = document.createElement( 'div' );
	wrap.innerHTML = html;
	const el = wrap.firstChild;
	return el;
}

ns.TabTokens.prototype.buildEditRow = function( conf ) {
	const self = this;
	console.log( 'buildEditRow', conf );
	//const statusEl = self.getReadableStatus( conf.status );
	const html = '<div id="'
		+ conf.id
		+ '" class="TokenRow Padding flexnes">'
			+ '<div class="ServerTokenIP">'
				+ conf.ip
			+ '</div>'
			+ '<select class="ServerTokenStatus InputHeight">'
			+ '</select>'
			+ '<div class="ServerTokenActions flexnes">'
				+ '<button class="ServerTokenSave">'
					+ '<i class="fa fa-fw fa-save"></i>'
				+ '</button>'
				+ '<button class="ServerTokenCancel">'
					+ '<i class="fa fa-fw fa-close"></i>'
				+ '</button>'
			+ '</div>'
		+ '</div>';
	
	const wrap = document.createElement( 'div' );
	wrap.innerHTML = html;
	const el = wrap.firstChild;
	const statusEl = el.querySelector( '.ServerTokenStatus' );
	self.setStatusOptions( statusEl, conf.status );
	return el;
}

ns.TabTokens.prototype.bindDisplayRow = function( el ) {
	const self = this;
	const id = el.id;
	console.log( 'bindDisplay', [ el, id ]);
	const allowToggle = el.querySelector( '.ServerTokenStatus input' );
	const editBtn = el.querySelector( '.ServerTokenEdit' );
	const remBtn = el.querySelector( '.ServerTokenRemove' );
	
	allowToggle.addEventListener(
		'click',
		e => self.handleAllowClick( id ),
		false
	);
	
	editBtn.addEventListener(
		'click',
		e => self.handleEditClick( id ),
		false
	);
	
	remBtn.addEventListener(
		'click',
		e => self.handleRemoveClick( id ),
		false
	);
}

ns.TabTokens.prototype.bindEditRow = function( el ) {
	const self = this;
	const id = el.id;
	console.log( 'bindEditRow', [ el, id ]);
	const status = el.querySelector( '.ServerTokenStatus' );
	const saveBtn = el.querySelector( '.ServerTokenSave' );
	const cancelBtn = el.querySelector( '.ServerTokenCancel' );
	
	saveBtn.addEventListener(
		'click',
		e => self.handleSaveClick( id ),
		false
	);
	
	cancelBtn.addEventListener(
		'click',
		e => self.handleCancelClick( id ),
		false
	);
}

ns.TabTokens.prototype.remove = function( hostId )
{
	const self = this;
	console.log( 'remove', {
		id   : hostId,
		conf : self.items[ hostId ],
	});
	const conf = self.items[ hostId ];
	delete self.items[ hostId ];
	const el = conf.el;
	if ( null != el )
		el.parentNode.removeChild( el );
	
	self.itemIds = Object.keys( self.items );
}

ns.TabTokens.prototype.getId = function( host )
{
	const self = this;
	const id = host.split( '.' ).join( '_' );
	console.log( 'id', id );
	return id;
}

ns.TabTokens.prototype.createHost = async function( host, status, userId )
{
	const self = this;
	return new Promise(( resolve, reject ) => {
		const id = self.getId( host );
		console.log( 'create, id', id );
		const conf = self.items[ id ];
		if ( null != conf ) {
			console.log( 'TabTokens.createHost, host already exists', {
				host  : host,
				id    : id,
				items : self.items,
			});
			resolve( null );
			return;
		}
		
		const userId = window.Application.userId;
		const args = {
			ip     : host,
			status : status,
			userid : userId,
		};
		
		console.log( 'createHost, args', args );
		const create = new Library( 'system.library' );
		create.execute( 'security/createhost', args );
		create.onExecuted = createBack;
		
		function createBack( res, yep )
		{
			console.log( 'createBack', [ res, yep ]);
			if ( 'success' == res.result )
				resolve( res.host );
			else
				resolve( null );
		}
	});
}

ns.TabTokens.prototype.getHosts = async function()
{
	const self = this;
	return new Promise(( resolve, reject ) => {
		const get = new Library( 'system.library' );
		get.execute( 'security/listhosts' );
		get.onExecuted = hostsBack;
		
		function hostsBack( res, yep )
		{
			console.log( 'hostsBack', [ res, yep ]);
			resolve( res.hosts );
		}
	});
}

ns.TabTokens.prototype.updateHost = async function( hostId, status )
{
	const self = this;
	return new Promise(( resolve, reject ) => {
		const conf = self.items[ hostId ];
		if ( null == status )
			status = 0;
		
		console.log( 'updateHost', [ hostId, status, conf ]);
		if ( null == conf ) {
			console.log( 'updateHost', {
				hostId : hostId,
				items  : self.items,
			});
			throw new Error( 'TabTokens.updateHost, invalid hostId ^^^' );
		}
		
		const args = {
			ip     : conf.ip,
			userid : conf.userId || window.Application.userId,
			status : status,
		};
		console.log( 'updateHost, args', args );
		const update = new Library( 'system.library' );
		update.execute( 'security/updatehost', args );
		update.onExecuted = updateBack;
		
		function updateBack( res, yep )
		{
			console.log( 'updateBack', [ res, yep ]);
			if ( 'success' == res.result )
				resolve( res.host );
			else
				resolve( null );
		}
	});
}

ns.TabTokens.prototype.removeHost = async function( hostId )
{
	const self = this;
	return new Promise(( resolve, reject ) => {
		const conf = self.items[ hostId ];
		if ( null == conf ) {
			console.log( 'TabTokens.remove - not found', {
				hostId : hostId,
				items  : self.items,
			});
			resolve( false );
			return;
		}
		
		const args = {
			ip : conf.ip,
		};
		console.log( 'removeHost args', args );
		const remove = new Library( 'system.library' );
		remove.execute( 'security/deletehost', args );
		remove.onExecuted = removeBack;
		
		function removeBack( res, yep )
		{
			console.log( 'removeBack', [ res, yep ]);
			if ( 'success' == res.result )
				resolve( hostId );
			else
				resolve( false );
		}
	});
}


// returns a toggle checkbox
// id        : dom ID
// className : optional class name if something specific is needed
// name      : input name
// onclick   : callback for click events
// checked   : initial state
// mode      : 'string' to have the widged returned as a string instead of a DOM element
function buildToggle( id, className, name, onclick, checked, mode )
{
	console.log( 'buildToggle', [
		id,
		className,
		name,
		onclick,
		checked,
		mode
	]);
	
	className = className || '';
	if ( 'string' == mode )
		return buildString();
	else
		return buildElement();
	
	function buildElement() {
		const d = document.createElement( 'label' );
		d.className = className;
		
		const i = document.createElement( 'input' );
		i.type = 'checkbox';
		i.className = 'CustomToggleInput ';
		i.id = id;
		if( name )
			i.name = name;
		
		if( checked )
			i.checked = true;
		
		if( onclick )
			i.onclick = onclick;
		
		/*
		if( value )
			i.value = value;
		*/
		d.appendChild( i );
		
		const l = document.createElement( 'label' );
		l.className = 'CustomToggleLabel';
		l.setAttribute( 'for', id );
		
		d.appendChild( l );
		
		return d;
	}
	
	function buildString()
	{
		name = name || '';
		checked = checked || '';
		const str = 
			'<label class="' + className + '">'
				+ '<input type="checkbox"'
					+ 'class="CustomToggleInput"'
					+ 'id="' + id + '"'
					+ 'name="' + name + '"'
					+ ( onclick ? ' onclick="' + onclick + '"':'')
					+ ( checked ? 'checked' : '' )
				+'>'
				+ '<label class="CustomToggleLabel" for="' + id + '"></label>';
			+ '</label>';
		
		return str;
	}
}