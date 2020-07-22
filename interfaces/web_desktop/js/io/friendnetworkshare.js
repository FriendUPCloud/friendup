/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * System interface with Friend Network
 * 
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/04/2018
 */
 
var Friend = window.Friend || {};

FriendNetworkShare =
{
	// If I need to save somne config
	configVersion: 1,
	loadConfigs: 
	{ 
	},
	saveConfigs: 
	{ 
	},

	// Initialization
	start: function()
	{
		var self = FriendNetworkShare;

		// At least called once!
		self.inUse = true;

		// Wait for Friend network to be connected
		var handle = setInterval( function()
		{
			FriendNetwork.isReady( { callback: isInit } );
		}, 100 );
		function isInit( message )
		{
			if ( message.ready )
			{				
				clearInterval( handle );
				doInit();
			}
		}

		// Performs the initialisation
		function doInit()
		{
			// Get general Friend Network settings
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
				
				self.userInformation = {};
				if ( fnet && fnet.activated )
				{
					self.activated = true;
					self.connected = true;

					// Load userInformations
					FriendNetwork.getUserInformation( { callback: continueLoad } );
					function continueLoad( message )
					{
						var userInformation = message.information;
						self.userInformation.image = userInformation.image;
						self.userInformation.name = userInformation.name;
						self.userInformation.fullName = userInformation.fullName;

						// Creates the widget
						self.initWidget();

						// Connectivity watchdog (can be left open in case of disconnection of the server)
						if ( !self.handleWatchDog )
						{
							self.handleWatchDog = setInterval( function()
							{
								self.watchDog();
							}, 500 );
						}
					}
				}
			};
			sm.execute( 'getsetting', { setting: 'friendNetwork' } );
		}
	},

	// Close the system
	close: function()
	{
		var self = FriendNetworkShare;
		if ( self.activated )
		{
			self.activated = false;
		
			// Remove main widget
			self.closeWidget();

			// Close 'Share folder' dialog
			self.onCancel();
		}
	},

	// Activates / Deactivates the system
	activate: function( activation )
	{
		if ( activation != this.activated )
		{
			if ( activation )
				this.start();
			else
				this.close();
		}
	},

	// Watch if the workspace is disconnected
	watchDog: function()
	{
		var self = FriendNetworkShare;
		var connected = Friend.User.ServerIsThere;
		if ( self.connected != connected )
		{
			self.connected = connected;
			if ( self.connected )
			{
				self.start();
			}
			else
			{
				self.close();
			}
		}
	},

	// Take into account changes in Friend Network configuration
	changeFriendNetworkSettings: function( fnet )
	{
		var self = FriendNetworkShare;

		// Set a timeout for the data to be saved on the server
		setTimeout( function()
		{
			self.close();
			self.activate( fnet.activated );
		}, 1000 );
	},

	// Widget - tray icon with an avatar inside
	initWidget: function()
	{
		var self = FriendNetworkShare;
		var widget =
		{
			name: 'Friend Network',
			className: 'Rounded',
			icon: self.userInformation.image,
			getBubbleText: self.getBubbleText
		};
		self.widgetIdentifier = Workspace.addTrayIcon( widget );
	},

	// Close the widget
	closeWidget: function()
	{
		if ( this.widgetIdentifier )
		{
			Workspace.removeTrayIcon( this.widgetIdentifier );
			this.widgetIdentifier = false;
		}
	},

	// Refresh widget bubble
	refreshWidget: function()
	{
		var self = FriendNetworkShare;
		if ( self.widgetIdentifier )
		{
			var widget = Workspace.getTrayIcon( self.widgetIdentifier );
			widget.bubble.innerHTML = '<div>' + self.getBubbleText() + '</div>';
		}
	},

	// Change the image of the widget
	refreshWidgetImage: function()
	{
		var self = FriendNetworkShare;
		if ( self.widgetIdentifier )
		{
			Workspace.setTrayIconImage( self.widgetIdentifier, self.userInformation.image );
		}
	},

	// Returnsd the HTML of the bubble
	getBubbleText: function( callback )
	{
		var self = FriendNetworkShare;

		var iconStop = '/webclient/gfx/fnetStopShare.png';
		var iconOpen = '/webclient/gfx/fnetOpenShare.png';
		var iconOpenSettings = '/webclient/gfx/fnetSettings.png';

		// If compact mode, display the friends in a grid
		var compact = '';
		
		// Information about you
		var you = '';
		for ( var s = 0; s < FriendNetworkDoor.shared.length; s++ )
		{
			var share = FriendNetworkDoor.shared[ s ];
			if ( share.type == 'drive' || share.type == 'folder' )
			{
				you += '<div class="HRow">\
							<div class="FloatLeft">\
								' + share.door.deviceName + ':' + share.door.path + '\
							</div>\
							<div class="FloatRight">\
								<span class="fa fa-folder-open-o" aria-hidden="true" style="font-size:16px" onclick="FriendNetworkShare.clickOpen(\'' + share.name + '\'); return cancelBubble( event );" data-tooltip="Open Directory">\
								<span class="fa fa-times" aria-hidden="true" style="font-size:16px" onclick="FriendNetworkShare.clickStop(\'' + share.name + '\'); return cancelBubble( event );" data-tooltip="Stop sharing">\
							</div>\
						</div>';
			}
		}
		if ( you != '' )
		{
			you =  '<div class="HRow">\
						<div class="FloatLeft">\
							<strong>You share with the community</strong>\
						</div>\
					</div>' + you;
		}
		html = '<div>\
					<div class="HRow">\
						<div class="FloatLeft">\
							<h3>Friend Network</h3>\
						</div>\
						<div class="FloatRight">\
							<span class="fa fa-cog" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkShare.openFriendNetworkSetup();" title="Open Friend Network settings."></span>\
						</div>\
					</div>' + compact + you + '\
					<div class="HRow">\
						<button type="button" onclick="FriendNetworkShare.addDirectory( \'onShare\', \'onCancel\' );">Share disk or directory</button>\
					</div>\
				</div>';
		return html;
	},

	// Open Friend Network settings
	openFriendNetworkSetup: function()
	{
		Workspace.accountSetup( 'friendNetwork' );
	},

	// Stop sharing a folder
	clickStop: function( name )
	{
		var self = FriendNetworkShare;
		FriendNetworkDoor.closeSharedDoor( name );
		self.refreshWidget();
	},

	// Open a local shared folder
	clickOpen: function( name )
	{
		var self = FriendNetworkShare;
		FriendNetworkDoor.openSharedDoor( name );
	},
	
	// Share a folder or drive: open a file selector then dialog
	addDirectory: function( onShare, onCancel )
	{
		var self = FriendNetworkShare;
		if ( !self.addView )
		{
			new Filedialog( false, function( path )
			{
				if ( path && typeof path == 'string' && path.indexOf( 'Mountlist:' ) < 0 )
				{
					self.addView = new View( 
					{
						title: i18n( 'Share a drive or a directory' ),
						width: 415,
						height: 320,
						resize: false
					} );

					// Creates a proposed name
					var name = path.split( ':' )[ 1 ];
					if ( name.length > 0 )
					{
						name = name.substring( 0, name.length - 1 );
						var pos = name.lastIndexOf( '/' );
						if ( pos >= 0 )
							name = name.substring( pos + 1 );
					}
					else
					{
						name = path.substring( 0, path.length - 1 );
					}

					self.addView.setContent( '\
						<div class="VContentTop Padding ScrollArea">\
							<table border="0" class="FullWidth">\
								<tr><td colspan="2"><b><strong>Sharing: "' + path + '"</strong></b></td></tr>\
								<tr><td colspan="2">&nbsp</td></tr>\
								<tr>\
									<td>Share name:</td>\
									<td><input type="text" size="40" id="name" value="' + name + '"></td>\
								</tr>\
								<tr>\
									<td>Description:</td>\
									<td><input type="text" size="40" id="description"></td>\
								</tr>\
								<tr>\
									<td>Password:</td>\
									<td><input type="password" size="40" id="password"></td>\
								</tr>\
								<tr><td colspan="2">&nbsp</td></tr>\
								<tr><td colspan="2"><b>Icon:</b></td></tr>\
								<tr>\
									<td><img src="/webclient/gfx/fnetDrive.png" style="width:64px;height:64px;" id="icon"></td>\
									<td>\
										<button class="IconSmall fa-save" type="button" id="icon" onclick="FriendNetworkShare.onChangeIcon()">\
											Change\
										</button>\
									</td>\
								</tr>\
							</table>\
						</div>\
						<div class="VContentBottom BorderTop Padding BackgroundDefault" style="height: 50px">\
							<button type="button" class="FloatRight Button IconSmall fa-times" onclick="FriendNetworkShare.' + onCancel +'()">\
								Cancel\
							</button>\
							<button type="button" class="Button IconSmall fa-check" onclick="FriendNetworkShare.' + onShare + '(\'' + path + '\')">\
								Share\
							</button>\
						</div>\
					' );
					var input = self.addView.getElementsByTagName( 'input' )[0];
					input.select();
				}
				else
				{
					Alert( 'Friend Network', 'Please select a directory.' );	
				}
			}, 'Mountlist:', 'path', '', 'Please choose the directory to share' );
		}
	},

	// User clicked on 'Cancel'
	onCancel: function()
	{
		var self = FriendNetworkShare;
		if ( self.addView )
		{
			self.addView.close();
			self.addView = false;
		}
	},

	// User has changed the icon
	onChangeIcon: function()
	{
		var self = FriendNetworkShare;
		var dialog = new Filedialog( self.addView, function( files )
		{
			var done = false;
			if ( files && files.length == 1 && files[ 0 ].Type == 'File')
			{
				var path = files[ 0 ].Path;
				if ( path.indexOf( '.png' ) >= 0 || path.indexOf( '.jpg' ) >= 0 )
				{
					var icon = self.getViewElement( self.addView, 'img', 'icon' ).value;
					icon.src = getImageUrl( files[ 0 ].Path );
					self.iconChanged = true;
					done = true;
				}
			}
			if ( !done )
			{
				Alert( 'Friend Network', 'Please choose an image file.' );	
			}
		}, 'Mountlist:', 'open', '', 'Please choose the icon' );
	},

	// User has clicked on 'Share'
	onShare: function( path )
	{
		var self = FriendNetworkShare;
		var doorName = self.getViewElement( self.addView, 'input', 'name' ).value;
		var description = self.getViewElement( self.addView, 'input', 'description' ).value;
		var password = self.getViewElement( self.addView, 'input', 'password' ).value;
		var door = ( new Door() ).get( path );
		if ( door )
		{
			FriendNetworkDoor.shareDoor( door, 
			{
				name: doorName, 
				description: description, 
				password: password, 
				callback: cb
			} );
			function cb( response, share )
			{
				self.refreshWidget();
			};
		}
		self.onCancel();
	},

	// Returns the user's icon
	getUserIcon: function()
	{
		return this.userInformation.image;
	},

	// Find an element in a view
	getViewElement: function( view, tag, id )
	{
		var elements = view.getElementsByTagName ( tag );
		for ( var e = 0; e < elements.length; e++ )
		{
			if ( elements[ e ].id == id )
				return elements[ e ];
		}
		return false;
	}
}	
