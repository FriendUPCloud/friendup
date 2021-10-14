// Apps on startup
Friend.startupApps = {};

// Added to workspace
var WorkspaceInside = {
	// Tray icons
	trayIcons: {},
	workspaceInside: true,
	refreshDesktopIconsRetries: 0,
	websocketDisconnectTime: 0,
	currentViewState: 'inactive',
	// Did we load the wallpaper?
	wallpaperLoaded: false,
	// We only initialize once
	insideInitialized: false,
	readyToRun: false,
	// Onready functions
	onReadyList: [],
	// Switch to workspace
	getReadyToRun: function(){ return ( this.readyToRun ? 'true' : 'false' ); },
	switchWorkspace: function( num )
	{
		if( this.mode == 'vr' ) return;
		
		if( num > globalConfig.workspacecount ) return;
		if( ge( 'InputGrabber' ) )
			ge( 'InputGrabber' ).focus();
		let eles = ge( 'DoorsScreen' ).getElementsByClassName( 'VirtualWorkspaces' );
		if( eles.length )
		{
			let b = 0;
			let wsp = eles[0].childNodes;
			for( let a = 0; a < wsp.length; a++ )
			{
				if( !wsp[a].classList ) continue;
				if( wsp[a].classList.contains( 'Workspace' ) )
				{
					if( b == num )
					{
						Workspace.setWorkspace( b, eles[0] );
						if( ge( 'InputGrabber' ) )
							ge( 'InputGrabber' ).blur();
					}
					b++; 
				}
			}
		}
		if( ge( 'InputGrabber' ) )
			ge( 'InputGrabber' ).blur();
	},

	// Updates the text
	refreshTrayIconBubble: function( identifier )
	{
		if ( this.trayIcons[ identifier ] )
		{
			let struct = this.trayIcons[ identifier ];
			if ( struct.bubble && struct.getBubbleText )
			{
				struct.bubbleText = struct.getBubbleText();
				struct.bubble.innerHTML = '<div>' + struct.bubbleText + '</div>';
			}
		}
	},
	// Changes the icon
	setTrayIconImage: function( identifier, image )
	{
		if ( this.trayIcons[ identifier ] )
		{
			let ele = this.trayIcons[ identifier ].dom;

			// Support image icon
			let iconFile;
			if ( image.substr( 0, 5 ) == 'data:' )
				iconFile = image;
			else if( image.indexOf( ':' ) > 0 && image.substr( 0, 5 ) != 'http:' && image.substr( 0, 6 ) != 'https:' )
				iconFile = getImageUrl( image );
			// Support font-awesome classic
			else if( image.substr( 0, 3 ) == 'fa-' )
				structIcon = image;
			else
				iconFile = image;
			ele.style.backgroundImage = 'url(\'' + iconFile + '\')';
		}
	},
	addTrayIcon: function( struct )
	{
		if( !struct.name ) return false;
		for( let a in this.trayIcons )
		{
			if( this.trayIcons[ a ].name == struct.name ) return false;
		}
		if( !struct.icon )
			return false;

		let iconFile = structIcon = null;
		// Support image icon
		if ( struct.icon.substr( 0, 5 ) == 'data:' )
		{
			iconFile = struct.icon;
		}
		else if( struct.icon.indexOf( ':' ) > 0 && struct.icon.substr( 0, 5 ) != 'http:' && struct.icon.substr( 0, 6 ) != 'https:' )
		{
			iconFile = getImageUrl( struct.icon );
		}
		// Support font-awesome classic
		else if( struct.icon.substr( 0, 3 ) == 'fa-' )
		{
			structIcon = struct.icon;
		}
		else
		{
			iconFile = struct.icon;
		}

		// Base64 string

		let md5 = deps ? deps.MD5 : window.MD5;
		let uniqueId = md5( Math.random() * 9999 + struct.name + ( new Date() ).getTime() );
		let ele = document.createElement( 'div' );
		ele.className = 'TrayElement IconSmall';
		if ( typeof struct.className == 'string' )
			ele.className += ' ' + struct.className;
		
		// Add icon image
		if( iconFile )
		{
			ele.style.backgroundImage = 'url(\'' + iconFile + '\')';
			ele.style.backgroundSize = 'contain';
			ele.style.backgroundPosition = 'center';
			ele.style.backgroundRepeat = 'no-repeat';
		}
		// Add font-awesome classic
		else if( structIcon )
		{
			ele.className += ' ' + structIcon;
			ele.style.lineHeight = '25px';
		}
		
		if( struct.label )
		{
			ele.setAttribute( 'label', struct.label );
		}
		
		ge( 'Tray' ).appendChild( ele );
		
		if( struct.getBubbleText || struct.onOpenBubble || struct.onDrop )
		{
			struct.bubble = document.createElement( 'div' );
			struct.bubble.className = 'BubbleInfo';
			ele.struct = struct;
			ele.appendChild( struct.bubble );
			ele.onmouseover = function( e )
			{
				// Check if other elements are sticky
				for( let a = 0; a < this.childNodes.length; a++ )
				{
					if( this.childNodes[a].sticky )
						return;
				}
				
				this.open = true;
				if( struct.onOpenBubble )
					struct.onOpenBubble();
				let text = struct.getBubbleText();
				// Return if the bubble is set AND we have no new text then return
				if( struct.bubbleSet && text == this.bubbleText )
					return;
				this.bubbleText = text;
				struct.bubble.innerHTML = '<div>' + this.bubbleText + '</div>';
				struct.bubbleSet = true;
			};
			if ( struct.onDrop )
			{
				ele.ondrop = function( elements )
				{
					struct.onDrop( elements );
				};
			}
			// Look when the bubble is closing
			ele.onmouseout = function( e )
			{
				let node = e.target;
				let pnode = e.target.parentNode;
				if( !node || !pnode )
					return;
				if( pnode.className == 'BubbleInfo' )
					node = pnode.parentNode;

				if( node && node.open )
				{
					node.open = false;
					setTimeout( function()
					{
						if( node && !node.open )
						{
							if( struct.onCloseBubble )
								struct.onCloseBubble();
						}
					}, 500 );
				}
			}
		}
		else
		{
			ele.onmouseover = function( e )
			{
				if( struct.bubbleSet ) return;
				/*if( struct.application )
				{
				}
				else*/ if( struct.onmouseover )
				{
					struct.onmouseover( e );
				}
				struct.bubbleSet = true;
			}
		}
		ele.onclick = function( e )
		{
			/*if( struct.application )
			{
				struct.application.sendMessage( {
					
				} );
			}
			else*/ if( struct.onclick )
			{
				struct.onclick( e );
			}
		}
		
		struct.dom = ele;
		this.trayIcons[ uniqueId ] = struct;
		return uniqueId;
	},
	getTrayIcon: function( identifier )
	{
		return this.trayIcons[ identifier ];
	},
	// Remove tray icon from the Workspace
	removeTrayIcon: function( uniqueId )
	{
		if( !this.trayIcons[ uniqueId ] )
		{
			return false;
		}
		let ele = {};
		for( let a in this.trayIcons )
		{
			if( a == uniqueId ) 
			{
				// Remove dom node
				this.trayIcons[ a ].dom.parentNode.removeChild( this.trayIcons[ a ].dom );
				continue;
			}
			ele[ a ] = this.trayIcons[ a ];
		}
		this.trayIcons = ele;
	},
	// Clear all wallpapers
	clearWorkspaceWallpapers: function()
	{
		if( !this.workspaceWallpapers ) return;
		for( let a = 0; a < this.workspaceWallpapers.length; a++ )
		{
			this.workspaceWallpapers[a].parentNode.removeChild( this.workspaceWallpapers[a] );
		}
		this.workspaceWallpapers = [];
	},
	// Check workspace wallpapers
	checkWorkspaceWallpapers: function( loaded )
	{
		if( this.mode == 'vr' ) return;
		if( globalConfig.workspacecount <= 1 ) return;

		if( !Workspace.wallpaperLoaded && !loaded ) 
		{
			return;
		}
		
		// Check if we already have workspace wallpapers
		let o = []; // <- result after cleanup
		let co = [];
		let m = globalConfig.workspacecount;
		let scr = ge( 'DoorsScreen' ).screenObject;
		let url = Workspace.wallpaperImage;
		
		if( !url || !url.indexOf ) url = 'none';
		else
		{
			if( url.indexOf( ':' ) > 0 && url.indexOf( 'http' ) != 0 )
				url = getImageUrl( url );
		}
		
		let workspacePositions = [];
		let maxW = Workspace.screen.getMaxViewWidth();
		for( let a = 0; a < globalConfig.workspacecount; a++ )
		{
			workspacePositions.push( a * maxW );
		}
		for( let a in movableWindows )
		{
			let wo = movableWindows[a].windowObject;
			movableWindows[a].viewContainer.style.left = workspacePositions[ wo.workspace ] + 'px';
		}
		
		let image = url == 'none' ? url : ( 'url(' + url + ')' );
		
		for( let a = 0; a < m; a++ )
		{
			// Check if we already have wallpapers
			if( this.workspaceWallpapers && a < this.workspaceWallpapers.length )
			{
				// Reduction of superflous workspaces
				if( a >= globalConfig.workspacecount )
				{
					this.workspaceWallpapers[a].parentNode.removeChild(
						this.workspaceWallpapers[a]
					);
				}
				else o.push( this.workspaceWallpapers[a] );
				// Update background image
				this.workspaceWallpapers[a].style.backgroundImage = image;
				this.workspaceWallpapers[a].style.left = scr.div.offsetWidth * a + 'px';
				this.workspaceWallpapers[a].style.width = scr.div.offsetWidth + 'px';
				this.workspaceWallpapers[a].style.height = scr.contentDiv.offsetHeight + 'px';
			}
			// New entry
			else
			{
				let d = document.createElement( 'div' );
				d.className = 'WorkspaceWallpaper';
				d.style.left = scr.div.offsetWidth * a + 'px';
				d.style.width = scr.div.offsetWidth + 'px';
				d.style.height = scr.contentDiv.offsetHeight + 'px';
				d.style.backgroundImage = image;
				scr.contentDiv.appendChild( d );
				o.push( d );
			}
		}
		// Overwrite array
		this.workspaceWallpapers = o;
		
		if( loaded )
			Workspace.wallpaperLoaded = true;
	},
	// Invite a friend to the Workspace
	inviteFriend: function()
	{
		if( !Workspace.serverConfig || !Workspace.serverConfig.invitesEnabled )
			return;
		let version = 2;
		
		let self = this;
		let f = null;
		if( this.inviteView ) return this.inviteView.activate();
		// TODO: check permissions
		if( version == 1 )
		{
			f = new File( 'System:templates/invite_link.html' );
		}
		else
		{
			f = new File( 'System:templates/invite_gui.html' );
		}
		f.i18n();
		f.onLoad = function( data )
		{
			let v = new View( {
				title: i18n( 'i18n_invite_friend' ),
				width: ( version == 1 ? 470 : 580 ),
				height: ( version == 1 ? 204 : 600 )
			} );
			self.inviteView = v;
			v.onClose = function()
			{
				self.inviteView = null;
			}
			v.setContent( data );
			self.addInvite();
			self.inviteLoadWorkgroups( '', self.getInviteCallback( 'workgroups' ) );
			self.invitesGet( '', self.getInviteCallback( 'invites' ) );
			self.pendingInvitesGet( '', self.getInviteCallback( 'pending' ) );
		}
		f.load();
	},
	// Get the invite callback wanted
	getInviteCallback: function( type )
	{
		let version = 2;
		
		let self = this;
		if( type == 'workgroups' )
		{
			return function( data )
			{
				if( version == 2 )
				{
					if( self.inviteView && self.inviteView.content.querySelector( '.GroupList' ) )
					{
						try
						{
							if( !data ) data = [];
							
							data.push( { ID: 0, Name : 'None', Description: i18n( 'i18n_invite_to_no_group' ) } );
							
							let str = '<div class="Collections">';
							let sw = 1;
							let count = 0;
							
							for( let a in data )
							{
								let cl = '';
								if( data[a].ID == 0 )
									cl = ' None';
								str += '<div class="MousePointer sw' + sw + ' Collection' + ( data[a].ID == 0 ? ' Selected' : '' ) + '" value="' + data[a].ID + '">\
									<div class="Image' + cl + '"></div>\
									<div class="Name" title="' + data[a].Name + '">' + data[a].Name + '</div>\
									<div class="Description">' + ( data[a].Description ? data[a].Description : i18n( 'i18n_no_description_on_group' ) ) + '</div>\
									<div class="Buttons">\
										<input type="radio" name="groupid" value="' + data[a].ID + '"/>\
									</div>\
								</div>';
								sw = sw == 1 ? 2 : 1;
								count++;
							}
							
							str += '</div>';
							
							str += '<p class="BorderTop BorderBottom PaddingTop PaddingBottom MarginTop"><button type="button" class="Button IconSmall fa-plus manageGroups">' + i18n( 'i18n_manage_groups' ) + '</button></p>';
							
							
							self.inviteView.content.querySelector( '.GroupList' ).innerHTML = str;
							
							let collections = self.inviteView.content.getElementsByClassName( 'Collection' );
							
							if( collections.length > 0 )
							{
								for( let i = 0; i < collections.length; i++ )
								{
									collections[i].onclick = function()
									{
										let val = this.getAttribute( 'value' );
										for( let o = 0; o < collections.length; o++ )
											if( collections[o] != this )
												collections[o].classList.remove( 'Selected' );
										this.classList.add( 'Selected' );
										self.addInvite( val );
										self.invitesGet( val, self.getInviteCallback( 'invites' ) );
										self.pendingInvitesGet( val, self.getInviteCallback( 'pending' ) );	
									}
								}
							}
							
							self.inviteView.content.getElementsByClassName( 'manageGroups' )[0].onclick = function()
							{	
								Workspace.shell.execute( 'Launch Account tab=group' );	
							}
						}
						catch( e )
						{
							self.inviteView.content.querySelector( '.GroupList' ).innerHTML = '<p class="TextCenter">' + i18n( 'i18n_no_groups_available' ) + '</p>';
							console.log( e );
						}
					}
				}
				else
				{
					if( self.inviteView && self.inviteView.content.querySelector( '.MulSelect' ) )
					{
						try
						{
							let str = data;
							let ostr = '';
							if( !str.length )
							{
								self.inviteView.content.querySelector( '.MulSelect' ).innerHTML = '<option value="0">' + i18n( 'i18n_no_workgroups' ) + '</option>';
								return;
							}
							for( let a = 0; a < str.length; a++ )
							{
								ostr += '<option value="' + str[a].ID + '">' + str[a].Name + '</option>';
							}
							self.inviteView.content.querySelector( '.MulSelect' ).innerHTML = ostr;
						}
						catch( e )
						{
							self.inviteView.content.querySelector( '.MulSelect' ).innerHTML = '<option value="0">' + i18n( 'i18n_no_workgroups' ) + '</option>';
						}
					}
				}
			};
		}
		else if( type == 'invites' )
		{
			return function( data, gid )
			{
				if( !data )
				{
					data = [
						{
							Link: 'https://intranet.friendup.cloud/invite/372873827',
							ID: 12,
							Workgroups: [ { ID: 12, Name: 'Test' }, { ID: 13, Name: 'Flest' }, { ID: 14, Name: 'Vest' } ]
						},
						{
							Link: 'https://intranet.friendup.cloud/invite/654356',
							ID: 13,
							Workgroups: false
						},
						{
							Link: 'https://intranet.friendup.cloud/invite/8976987689',
							ID: 15,
							Workgroups: false
						},
						{
							Link: 'https://intranet.friendup.cloud/invite/876979',
							ID: 19,
							Workgroups: [ { ID: 712, Name: 'Io' }, { ID: 153, Name: 'Gopa' } ]
						}
					];
				}
				
				let str = '';
				for( let a = 0; a < data.length; a++ )
				{
					let details = '';
					for( let b = 0; b < data[a].Workgroups.length; b++ )
					{
						details += '<div class="Rounded BackgroundNegative Negative FloatLeft PaddingSmall MarginRight">' + data[a].Workgroups[b].Name + '</div>';
					}
					
					if( version == 1 || version == 2 )
					{
						if( version == 2 && data[a].Workgroups && ( !gid || gid == 0 ) )
						{
							continue;
						}
						
						str += '<div class="InviteBlock MarginBottom Rounded BackgroundLists Padding">\
							<div class="HRow">\
								<div class="FloatLeft Link HContent70"><input type="text" class="FullWidth LinkField" style="background: transparent; border: 0" value="' + data[a].Link + '"/></div><div class="Buttons HContent30 FloatLeft TextRight">\
									<button type="button" class="ImageButton IconSmall fa-send" onclick="Workspace.inviteByEmail(' + gid + ')"></button>\
									<button type="button" class="ImageButton IconSmall fa-clipboard" onclick="let sp = this.parentNode.parentNode.querySelector( \'.LinkField\' ); sp.select(); sp.setSelectionRange(0,9999999); document.execCommand(\'copy\');"></button>\
									<button type="button" class="ImageButton IconSmall fa-refresh" onclick="Workspace.refreshInvite(' + gid + ', ' + data[a].ID + ')"></button>\
								</div>\
							</div>\
						</div>';
					}
					else
					{
						str += '<div class="InviteBlock MarginBottom Rounded BackgroundLists Padding">\
							<div class="HRow">\
								<div class="FloatLeft Link HContent70"><input type="text" class="FullWidth LinkField" style="background: transparent; border: 0" value="' + data[a].Link + '"/></div><div class="Buttons HContent30 FloatLeft TextRight">\
									<button type="button" class="ImageButton IconSmall fa-clipboard" onclick="let sp = this.parentNode.parentNode.querySelector( \'.LinkField\' ); sp.select(); sp.setSelectionRange(0,9999999); document.execCommand(\'copy\');"></button>\
									<button type="button" class="ImageButton IconSmall fa-eye" onclick="let p = this.parentNode.parentNode.parentNode; if( p.classList.contains( \'Show\' ) ) { p.classList.remove( \'Show\' ); } else { p.classList.add( \'Show\' ); }"></button>\
									<button type="button" class="ImageButton IconSmall fa-trash" onclick="Workspace.removeInvite(' + gid + ', ' + data[a].ID + ')"></button>\
								</div>\
							</div>\
							<div class="HiddenDetails NoPadding\">\
								' + details + '\
								<br style="clear: both"/>\
							</div>\
						</div>';
					}
				}
				self.inviteView.content.querySelector( '.InviteList' ).innerHTML = str;
			}
		}
		else if( type == 'pending' )
		{
			return function( data, gid )
			{
				
				let str = '';
				
				if( data )
				{
					str += '<hr class="Divider"/><h2>' + i18n( 'i18n_pending_invites' ) + '</h2><div>';
					
					let sw = 1;
					
					for( let a in data )
					{
						if( data[a] )
						{
							if( data[a].EventID )
							{
								str += '<div class="HRow sw' + sw + '">\
									<div class="HContent80 FloatLeft Ellipsis PaddingSmall">\
										' + ( data[a].Fullname ? data[a].Fullname : data[a].Email ) + '\
									</div>\
									<div class="HContent20 FloatLeft Ellipsis PaddingSmall TextRight">\
										<button class="Button IconSmall fa-remove NoText" onclick="Workspace.removePendingInvite(\'' + gid + '\',\'' + data[a].EventID + '\')"></button>\
									</div>\
								</div>';
								sw = sw == 1 ? 2 : 1;
							}
							else if( data[a].InviteLinkID )
							{
								str += '<div class="HRow sw' + sw + '">\
									<div class="HContent80 FloatLeft Ellipsis PaddingSmall">\
										' + ( data[a].Fullname ? data[a].Fullname : data[a].Email ) + '\
									</div>\
									<div class="HContent20 FloatLeft Ellipsis PaddingSmall TextRight">\
										<button class="Button IconSmall fa-remove NoText" onclick="Workspace.removePendingInvite(\'' + gid + '\',false,\'' + data[a].InviteLinkID + '\')"></button>\
									</div>\
								</div>';
								sw = sw == 1 ? 2 : 1;
							}
						}
					}
					
					str += '</div>';
				}
				
				self.inviteView.content.querySelector( '.PendingList' ).innerHTML = str;
			}
		}
		return null;
	},
	// Re-generate a new refresh token
	refreshInvite( gid, id )
	{
		let self = this;
		
		self.removeInvite( gid, id, false, function(  )
		{
			
			self.addInvite( gid );
			
		} );
	},
	// Generate a invite
	addInvite: function( gid )
	{
		let self = this;
		

		let workgroups = [];
		
		if( gid > 0 )
		{
			workgroups.push( gid );
		}
		
		if( self.inviteView && self.inviteView.content.querySelector( '.MulSelect' ) )
		{
			let opts = self.inviteView.content.querySelector( '.MulSelect' ).getElementsByTagName( 'option' );
			
			if( opts.length > 0 )
			{
				for( let v in opts )
				{
					if( opts[v] && opts[v].selected && opts[v].value )
					{
						workgroups.push( opts[v].value );
					}
				}
			}
		}
		

		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				self.invitesGet( gid, self.getInviteCallback( 'invites' ) );
			}
			else
			{
				Alert( i18n( 'i18n_failed_generate_invite' ), i18n( 'i18n_failed_generate_invite_desc' ) );
			}
		}
		// TODO: Make support for workgroups ...

		m.execute( 'generateinvite', { workgroups: ( workgroups ? workgroups.join( ',' ) : '' ) } );
	},
	// Remove an invite
	removeInvite: function( gid, id, force, callback )
	{
		if( !id || !callback ) return;
		
		let self = this;
		
		if( force )
		{
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					if( callback )
					{
						return callback( e, d );
					}
				}
				else
				{
					Alert( i18n( 'i18n_failed_remove_invite' ), i18n( 'i18n_failed_remove_invite_desc' ) );
				}
			}
			m.execute( 'removeinvite', { ids: id } );
		}
		else
		{

			Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_confirm_delete' ), function( data )
			{
				if( data == true )
				{
					let m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							if( callback )
							{
								callback( e, d );
							}
							
							self.invitesGet( gid, self.getInviteCallback( 'invites' ) );
						}
						else
						{
							Alert( i18n( 'i18n_failed_remove_invite' ), i18n( 'i18n_failed_remove_invite_desc' ) );
						}
					}
					m.execute( 'removeinvite', { ids: id } );
				}
			} );
		}
	},
	// Remove pending invite
	removePendingInvite: function( gid, eventId, inviteId )
	{
		let self = this;
		
		if( eventId > 0 )
		{
			let b = new Module( 'system' );
			b.onExecuted = function( e, d )
			{
				self.pendingInvitesGet( gid, self.getInviteCallback( 'pending' ) );
			}
			b.execute( 'removependinginvite', { eventId: eventId } );
		}
		else if( inviteId > 0 )
		{
			self.removeInvite( gid, inviteId, true, function (  )
			{
				
				self.pendingInvitesGet( gid, self.getInviteCallback( 'pending' ) );
				
			} );
		}
	},
	// Send invites by email
	sendInvite: function(  )
	{
		
		function validateEmail( email )
		{
			const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test( email );
		}
		
		let self = this;
		
		let gid = ge( 'groupid' ).value;
		
		let email = ge( 'recipient' ).value;
		let tname = ge( 'recipientname' ).value;
		
		if( email.indexOf( '@' ) <= 0 || email.indexOf( '.' ) <= 0 || !validateEmail( email ) )
		{
			Alert( i18n( 'i18n_failed_to_send' ), i18n( 'i18n_email_error' ) );
			return false;
		}
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
			
			if( e == 'ok' )
			{
				CloseWindow();
				self.pendingInvitesGet( gid, self.getInviteCallback( 'pending' ) );
			}
			else
			{
				Alert( i18n( 'i18n_failed_to_send' ), i18n( 'i18n_unknown_error' ) );
				return false;
			}
		}
		
		if( gid > 0 )
		{
			m.execute( 'sendinvite', { workgroups: gid, email: email, fullname: tname } );
		}
		else
		{
			m.execute( 'sendinvite', { email: email, fullname: tname } );
		}
	},
	// Load workgroups for invite
	inviteLoadWorkgroups: function( keywords, callback )
	{
		if( !keywords ) keywords = '';
		if( !callback ) return;
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				return callback( false );
			}
			try
			{
				let str = JSON.parse( d );
				if( keywords.length > 0 )
				{
					keywords = keywords.split( ',' );
					let end = [];
					for( let a = 0; a < keywords.length; a++ )
					{
						for( let b = 0; b < str.length; b++ )
						{
							//if( str[b].Name.toLowerCase() == Trim( keywords[a] ).toLowerCase() )
							if( str[b].Name.toLowerCase().indexOf( Trim( keywords[a] ).toLowerCase() ) >= 0 )
							{
								if( !str[b].Description )
								{
									str[b].Description = i18n( 'i18n_no_description_on_group' );
								}
								end.push( str[b] );
							}
						}
					}
					return callback( end.length ? end : false );
				}
				
				return callback( str );
			}
			catch( e ){};
			callback( false );
		}
		m.execute( 'listworkgroups' );
	},
	// Get existing invites
	invitesGet: function( gid, callback )
	{
		if( !callback ) return;
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				return callback( false, gid );
			}
			try
			{
				let data = JSON.parse( d );
				return callback( data, gid );
			}
			catch(e){};
			callback( false, gid );
		}
		if( gid > 0 )
		{
			m.execute( 'getinvites', { groupId: gid } );
		}
		else
		{
			m.execute( 'getinvites' );
		}
	},
	// Get pending invites by group
	pendingInvitesGet: function( gid, callback )
	{
		if( !callback ) return;
		
		let p = new Module( 'system' );
		p.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				return callback( false, gid );
			}
			try
			{
				let data = JSON.parse( d );
				return callback( data, gid );
			}
			catch(e){};
			callback( false, gid );
		}
		p.execute( 'getpendinginvites', { groupId: ( gid ? gid : 0 ), listall: true } );
	},
	// Get pending invites by group
	inviteByEmail: function( gid )
	{
		let v = new View( {
			title: i18n( 'i18n_invite_user' ),
			width: 500,
			height: 140
		} );
		
		let t = new File( 'templates/invite_user.html' );
		t.replacements = {
			gid : ( gid ? gid : 0 )
		}
		t.i18n();
		t.onLoad = function( data )
		{
			v.setContent( data );
		}
		t.load();
	},
	// Initialize virtual workspaces
	initWorkspaces: function()
	{
		if( this.mode == 'vr' || isMobile || Workspace.isSingleTask ) return;
		
		if( globalConfig.workspacesInitialized )
		{
			globalConfig.workspacesInitialized = false;
			let el = ge( 'DoorsScreen' ).getElementsByClassName( 'VirtualWorkspaces' );
			if( el.length )
			{
				el[0].parentNode.removeChild( el[0] );
			}
		}
		if( !globalConfig.workspacesInitialized )
		{
			if( !this.screen ) return;
			
			this.screen.setFlag( 'vcolumns', globalConfig.workspacecount );
			if( globalConfig.workspacecount > 1 )
			{
				globalConfig.workspacesInitialized = true;
				if( typeof( globalConfig.workspaceCurrent ) == 'undefined' )
					globalConfig.workspaceCurrent = 0;
				ge( 'DoorsScreen' ).screenObject.contentDiv.style.transition = 'left 0.25s';
				if( !ge( 'DoorsScreen' ).screenObject.contentDiv.style.left )
					ge( 'DoorsScreen' ).screenObject.contentDiv.style.left = '0';
				let wp = document.createElement( 'wp' );
				let d = document.createElement( 'div' )
				d.className = 'VirtualWorkspaces';
				for( let a = 0; a < globalConfig.workspacecount; a++ )
				{
					let w = document.createElement( 'div' );
					w.className = 'Workspace';
					w.setAttribute( 'position', 'top_center' );
					( function( num ){
						CreateHelpBubble( w, false, false, { getText: function()
						{
							// Create a text representing the content in the virtual workspace
							let apps = {};
							let str = '';
							for( let a in movableWindows )
							{
								if( movableWindows[ a ].windowObject.workspace == num )
								{
									if( movableWindows[ a ].windowObject.applicationName )
									{
										if( !apps[ movableWindows[ a ].windowObject.applicationName ] || !apps[ movableWindows[ a ].windowObject.applicationName ].count )
										{
											apps[ movableWindows[ a ].windowObject.applicationName ] = {
												count: 0,
												string: movableWindows[ a ].titleString
											};
										}
										apps[ movableWindows[ a ].windowObject.applicationName ].count++;
									}
									else
									{
										str += movableWindows[ a ].titleString + "\n";
									}
								}
							}
							let o = '';
							for( let a in apps )
								o += ( apps[ a ].string + ( apps[ a ].count > 1 ? ( ' (' + apps[ a ].count + ')' ) : '' ) ) + "\n";
							return o + str;
						} } );
					} )( a );
					if( a == globalConfig.workspaceCurrent ) w.className += ' Active';
					
					// Check if the label is an icon or a number
					if( 
						globalConfig.workspace_labels && 
						typeof( globalConfig.workspace_labels ) == 'object' && 
						globalConfig.workspace_labels[ a ] && 
						globalConfig.workspace_labels[ a ] != '[' &&
						globalConfig.workspace_labels[ a ] != ']'
					)
					{
						w.innerHTML = '<span class="' + globalConfig.workspace_labels[ a ] + '"></span>';
						w.className += ' WithIcon';
					}
					else
					{
						w.innerHTML = '<span>' + ( a + 1 ) + '</span>';
					}
					w.ind = a;
					w.onmousedown = function( e )
					{
						Workspace.setWorkspace( this.ind, d, e );
					}
					d.appendChild( w );
				}
				ge( 'DoorsScreen' ).getElementsByClassName( 'Left' )[0].appendChild( d );
				
				Workspace.checkWorkspaceWallpapers();
				
				// Keep windows in the right place
				for( let c in movableWindows )
				{
					if( movableWindows[ c ].windowObject.workspace > globalConfig.workspacecount - 1 )
					{
						movableWindows[ c ].windowObject.sendToWorkspace( globalConfig.workspacecount - 1 );
					}
				}
				
				// We don't wanna show offscreen
				if( globalConfig.workspaceCurrent > globalConfig.workspacecount - 1 )
				{
					Workspace.setWorkspace( globalConfig.workspacecount - 1 );
				}
				
				PollTrayPosition();
			}
			// Put all on workspace 1
			else
			{
				for( let c in movableWindows )
				{
					movableWindows[ c ].windowObject.sendToWorkspace( 0 );
				}
				Workspace.setWorkspace( 0 );
			}
		}
		// Refresh our dynamic classes now..
		RefreshDynamicClasses();
	},
	setWorkspace: function( index, workspaceButtons, e )
	{
		if( !e ) e = window.event;
		
		// No need for change
		if( index == globalConfig.workspaceCurrent )
		{
			return;
		}
		
		if( !workspaceButtons )
		{
			let eles = ge( 'DoorsScreen' ).getElementsByClassName( 'VirtualWorkspaces' );
			if( eles.length )
			{
				workspaceButtons = eles[0];
			}
		}
		
		// Out of bounds!
		if( index != 0 && ( index < 0 || index >= globalConfig.workspacecount ) )
		{
			return;
		}
		
		globalConfig.workspaceCurrent = index;
		
		let cnt = 0;
		let d = workspaceButtons;
		if( d )
		{
			for( let z = 0; z < d.childNodes.length; z++ )
			{
				if( d.childNodes[z].className && d.childNodes[z].classList.contains( 'Workspace' ) )
				{
					if( cnt == index )
					{
						d.childNodes[z].classList.add( 'Active' );
					}
					else d.childNodes[z].classList.remove( 'Active' );
					cnt++;
				}
			}
		}
		ge( 'DoorsScreen' ).screenObject.contentDiv.style.left = '-' + ( 100 * index ) + '%';
		
		_DeactivateWindows();
		
		// Check if we have a preset window that should be activated
		let foundActive = false;
		if( typeof( virtualWorkspaces ) != 'undefined' && typeof( virtualWorkspaces[ index ] ) != 'undefined' )
		{
			if( virtualWorkspaces[ index ].activeWindow )
			{
				_ActivateWindowOnly( virtualWorkspaces[ index ].activeWindow );
				foundActive = true;
			}
		}
		
		// Activate next window on next screen
		if( !foundActive )
		{
			for( let c in movableWindows )
			{
				if( !movableWindows[c].windowObject ) continue;
			
				if( movableWindows[c].windowObject.workspace == index )
				{
					let pn = movableWindows[c].parentNode;
					if( pn.getAttribute( 'minimized' ) != 'minimized' )
					{
						_ActivateWindow( movableWindows[c] );
						break;
					}
				}
			}
		}
		return cancelBubble( e );
	},
	// Reposition and size
	repositionWorkspaceWallpapers: function()
	{
		if( this.mode == 'vr' ) return;
		
		let bbsize = 'auto ' + window.innerHeight + 'px';
		let eled = this.screen.div.getElementsByClassName( 'ScreenContent' );
		if( eled.length )
			eled[0].style.backgroundSize = 'cover';
		if( globalConfig.workspacecount > 1 )
		{
			let eles = eled[0].getElementsByClassName( 'WorkspaceWallpaper' );
			let pos = 0;
			let oh = eled[0].offsetHeight + 'px';
			let own = ge( 'DoorsScreen' ).offsetWidth;
			let ow = own + 'px';
			for( let a = 0; a < eles.length; a++ )
			{
				eles[a].style.left = pos + 'px';
				eles[a].style.width = ow;
				eles[a].style.height = oh;
				pos += own;
			}
		}
	},
	// Update position
	refreshWorkspaces: function()
	{
		// Check if something changed
		if( typeof( globalConfig.workspacepcount ) != 'undefined' )
		{
			if( globalConfig.workspacepcount != globalConfig.workspacecount )
			{
				if( globalConfig.workspaceCurrent > globalConfig.workspacecount - 1 )
				{
					Workspace.switchWorkspace( globalConfig.workspacecount - 1 );
				}
				this.clearWorkspaceWallpapers();
				this.initWorkspaces();
			}
		}
		globalConfig.workspacepcount = globalConfig.workspacecount;
	},
	nudgeWorkspacesWidget: function()
	{
		if( this.mode == 'vr' ) return;
		// Calculate correct position
		if( globalConfig.workspacecount > 1 && ge( 'DoorsScreen' ) )
		{
			let left = ge( 'DoorsScreen' ).getElementsByClassName( 'Left' )[0];
			let righ = ge( 'DoorsScreen' ).getElementsByClassName( 'Right' )[0];
			let swit = righ.getElementsByClassName( 'ScreenList' )[0];
			let extr = left.getElementsByClassName( 'Extra' )[0];
			let work = ge( 'DoorsScreen' ).getElementsByClassName( 'VirtualWorkspaces' )[0];
			if( work )
			{
				work.style.right = GetElementWidth( extr ) + GetElementWidth( swit ) - 2 + 'px';
			}
			PollTrayPosition();
		}
	},
	getWebSocketsState: function()
	{
		if( Workspace.readyToRun )
		{
			let res = ( Workspace.conn && Workspace.conn.ws && Workspace.conn.ws.ready ) ? 'open' : 'false';
			return res;
		}
		return 'false';
	},
	initWebSocket: function( callback )
	{
		// Not online!!
		if( !navigator.onLine ) return false;
		
		let self = this;
		function closeConn()
		{
			// Clean up previous
			if( self.conn )
			{
				try
				{
					if( self.conn.ws )
						self.conn.ws.cleanup();
				}
				catch( ez )
				{
					console.log( 'Conn is dead.', ez );
				}
				delete self.conn;
			}
		}
	
		// We're already open or connecting
		if( Workspace.conn && Workspace.conn.ws && Workspace.conn.ws.ready ) return;
		
		if( window.Friend && Friend.User && Friend.User.State != 'online' ) 
		{
			console.log( 'Cannot initialize web socket - user is offline.' );
			closeConn();
			return false;
		}
		
		if( !Workspace.sessionId && Workspace.userLevel )
		{
			return Friend.User.ReLogin();
		}
		
		// Not ready
		if( !Workspace.sessionId )
		{
			if( this.initWSTimeout )
				clearTimeout( this.initWSTimeout );
			this.initWSTimeout = setTimeout( function(){ Workspace.initWebSocket( callback ); }, 1000 );
			return this.initWSTimeout;
		}
		
		// Not needed here
		if( this.initWSTimeout )
		{
			clearTimeout( this.initWSTimeout );
			this.initWSTimeout = null;
		}
		
		let conf = {
			onstate: onState,
			onend  : onEnd
		};

        //we assume we are being proxied - set the websocket to use the same port as we do
        if( document.location.port == '')
        {
            conf.wsPort = ( document.location.protocol == 'https:' ? 443 : 80 )
            //console.log('webproxy set to be tunneled as well.');
        }
		
		// Reconnect if we already exist
		if( this.conn )
		{
			this.conn.connectWebSocket();
			console.log( '[initWebSocket] Reconnecting websocket.' );
		}
		else
		{
			if( typeof FriendConnection == 'undefined' )
			{
				return setTimeout( function(){ Workspace.initWebSocket( callback ); }, 250 );
			}
		
			this.conn = new FriendConnection( conf );
			this.conn.on( 'sasid-request', handleSASRequest ); // Shared Application Session
			this.conn.on( 'server-notice', handleServerNotice );
			this.conn.on( 'server-msg', handleServerMessage );
			this.conn.on( 'refresh', function( msg )
			{
				// Do a deep refresh
				Workspace.refreshDesktop( false, true );
			} );
			this.conn.on( 'icon-change', handleIconChange );
			this.conn.on( 'filesystem-change', handleFilesystemChange );
			this.conn.on( 'notification', handleNotifications );
		}
		
		// Reference for handler
		let selfConn = this.conn;

		function onState( e )
		{	
			if( e.type == 'error' || e.type == 'close' )
			{
				console.log( '[onState] The ws closed.' );
				if( !Workspace.wsChecker )
				{
					Workspace.wsChecker = setInterval( function()
					{
						if( !Workspace.conn || !Workspace.conn.ws || !Workspace.conn.ws.ws )
						{
							console.log( 'Looks like we do not have any websocket. Trying to create it.' );
							Workspace.initWebSocket();
						}
					}, 1600 );
				}
			}
			else if( e.type == 'ping' )
			{
				if( Friend.User )
					Friend.User.SetUserConnectionState( 'online' );
				
				if( Workspace.wsChecker )
				{
					clearInterval( Workspace.wsChecker )
					Workspace.wsChecker = null;
				}
				
				// Reattach
				if( !Workspace.conn && selfConn )
				{
					console.log( 'Reattaching conn!' );
					Workspace.conn = selfConn;
				}
			}
			else
			{
				if( e.type == 'open' )
				{
					if( callback )
					{
						callback();
						callback = null;
					}
				}
				else if( e.type == 'connecting' )
				{
					// ... we are connecting
				}
				if( e.type != 'connecting' && e.type != 'open' )
				{
					console.log( 'Strange onState: ', e );
				}
			}
		}

		function onEnd( e )
		{
			//console.log( 'Workspace.conn.onEnd', e );
			// We closed connection
			Friend.User.SetUserConnectionState( 'offline' );
		}

		function handleIconChange( e ){ console.log( 'icon-change event', e ); }
		function handleFilesystemChange( msg )
		{	
			// Prevent hitting the same thing over and over
			// Maximum two requests a second on the same path
			if( !Workspace.filesystemChangeTimeouts )
			{
				Workspace.filesystemChangeTimeouts = {};
			}
			
			// Clear cache
			if( msg && msg.devname && msg.path )
			{
				let ext4 = msg.path.substr( msg.path.length - 5, 5 );
				let ext3 = msg.path.substr( msg.path.length - 4, 4 );
				ext4 = ext4.toLowerCase();
				ext3 = ext3.toLowerCase();
				if( ext4 == '.jpeg' || ext3 == '.jpg' || ext3 == '.gif' || ext3 == '.png' )
				{
					let ic = new FileIcon();
					ic.delCache( msg.devname + ':' + msg.path );
				}
			}
			
			let t = msg.devname + ( msg.path ? msg.path : '' );
			if( Workspace.filesystemChangeTimeouts[ t ] )
			{
				clearTimeout( Workspace.filesystemChangeTimeouts[ t ] );
			}
			Workspace.filesystemChangeTimeouts[ t ] = setTimeout( function()
			{
				hcbk( msg );
			}, 250 );
			
			// Handle the actual filesystem change
			function hcbk()
			{
				if( msg.path || msg.devname )
				{
					let p = '';
					// check if path contain device
					if( msg.path.indexOf( ':' ) > 0 )
					{
						p = msg.path;
					}
					else
					{
						p = msg.devname + ':' + msg.path;
					}
					// Filename stripped!
					
					if( p.indexOf( '/' ) > 0 )
					{
						p = p.split( '/' );
						if( Trim( p[ p.length - 1 ] ) != '' )
							p[ p.length - 1 ] = '';
						p = p.join( '/' );
					}
					else
					{
						p = p.split( ':' );
						p = p[0] + ':';
					}
				
					if( Workspace.appFilesystemEvents )
					{
						// Check if we need to handle events for apps
						if( Workspace.appFilesystemEvents[ 'filesystem-change' ] )
						{
							let evList = Workspace.appFilesystemEvents[ 'filesystem-change' ];
							let outEvents = [];
							for( let a = 0; a < evList.length; a++ )
							{
								let found = false;
								if( evList[a].applicationId )
								{
									found = evList[a];
									let app = findApplication( evList[a].applicationId );
									if( app )
									{
										if( evList[a].viewId && app.windows[ evList[a].viewId ] )
										{
											app.windows[ evList[a].viewId ].sendMessage( {
												command: 'callback', type: 'callback', callback: evList[a].callback, path: msg.devname + ':' + msg.path
											} );
										}
										else
										{
											app.sendMessage( { 
												command: 'callback', type: 'callback', callback: evList[a].callback, path: msg.devname + ':' + msg.path
											} );
										}
									}
								}
								// App doesn't exist, flush event
								if( found )
								{
									outEvents.push( found );
								}
							}
							// Update events
							Workspace.appFilesystemEvents[ 'filesystem-change' ] = outEvents;
						}
					}
					
					Workspace.refreshWindowByPath( p );
					
					if( p.substr( p.length - 1, 1 ) == ':' )
					{
						//console.log( '[handleFilesystemChange] Refreshing desktop.' );
						Workspace.refreshDesktop();
					}
					return;
				}
				//console.log( '[handleFilesystemChange] Uncaught filesystem change: ', msg );
			}
		}
		
		// Handle incoming push notifications and server notifications ---------
		function handleNotifications( nmsg )
		{
			let messageRead = trash = false;
			
			//console.log( 'Handling notifications: ', nmsg );
			
			if( isMobile )
			{
				// TODO: Determine if this will ever occur. If the viewstate isn't active
				//       we will obviously not be running this Javascript?
				if( window.friendApp && Workspace.currentViewState != 'active' )
				{
					// Cancel push notification on the server
					let clickCallback = function()
					{
						// Tell that it was user initiated
						nmsg.notificationData.clicked = true;
						handleNotificationData( nmsg );
					}
					
					// Revert to push notifications on the OS side
					Notify( { title: nmsg.title, text: nmsg.text, notificationId: nmsg.notificationData.id }, null, clickCallback );
					return;
				}
			}
			
			handleNotificationData( nmsg );
			
			function handleNotificationData( msg )
			{
				// Check if we have notification data
				if( msg.notificationData )
				{
					/*if( !Workspace.debugNotificationLog )
					{
						Workspace.debugNotificationLog = {};
					}
					if( Workspace.debugNotificationLog[ msg.id ] )
					{
						Workspace.debugNotificationLog[ msg.id ]++;
						return;
					}
					else
					{
						Workspace.debugNotificationLog[ msg.id ] = 1;
					}*/
					
					// Application notification
					if( msg.notificationData.application )
					{
						// Function to set the notification as read...
						function notificationRead()
						{
							//console.log( 'Foo bar: ', msg.notificationData );
							if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
							{
								if( trash )
									clearTimeout( trash );
								messageRead = true;
								let l = new Library( 'system.library' );
								l.onExecuted = function( e, d ){
									//console.log( 'Did we tell fc that we read the notification?', e, d );
								};
								l.execute( 'mobile/updatenotification', { 
									notifid: msg.notificationData.id, 
									action: 1, 
									pawel: 3
								} );
							}
						}
					
						let appName = msg.notificationData.application;
					
						// Find application
						let apps = Workspace.applications;
						for( let a = 0; a < apps.length; a++ )
						{
							// Found the application
							if( apps[a].applicationName == appName )
							{
								// We read the notification!
								notificationRead();

								// Post!
								let amsg = {
									type: 'system',
									method: 'notification',
									callback: false,
									data: msg.notificationData
								};
								apps[ a ].contentWindow.postMessage( JSON.stringify( amsg ), '*' );
								
								mobileDebug( ' Send to appk: ' + JSON.stringify( amsg ), true );
								return;
							}
						}
					
						//console.log( 'Could not find application ' + appName );
					
						// Application not found? Start it!
						// Send message to app once it has started...
						function appMessage()
						{
							let app = false;
							for( let a = 0; a < apps.length; a++ )
							{
								// Found the application
								if( apps[ a ].applicationName == appName )
								{
									app = apps[ a ];
									break;
								}
							}
					
							// No application? Alert the user
							// TODO: Localize response!
							if( !app )
							{
								Notify( { title: i18n( 'i18n_could_not_find_application' ), text: i18n( 'i18n_could_not_find_app_desc' ) } );
								return;
							}
					
							let amsg = {
								type: 'system',
								method: 'notification',
								callback: addWrapperCallback( notificationRead ),
								data: msg.notificationData
							};
							app.contentWindow.postMessage( JSON.stringify( amsg ), '*' );
					
							mobileDebug( ' Send to appz: ' + JSON.stringify( amsg ), true );
							
							// Delete wrapper callback if it isn't executed within 1 second
							setTimeout( function()
							{
								if( !messageRead )
								{
									let trash = getWrapperCallback( amsg.callback );
									delete trash;
								}
							}, 1000 );
						}
						
						// TODO: If we are here, generate a clickable Workspace notification
						if( msg.notificationData.clicked )
						{
							mobileDebug( ' Startappz: ' + appName, true );
							Friend.startupApps[ appName ] = true;
							ExecuteApplication( appName, '', appMessage );
						}
						else
						{
							let t_title = appName + ' - ' + msg.notificationData.title;
							let t_txt = msg.notificationData.content;
							Notify( { title: t_title, text: t_txt, notificationId: msg.notificationData.id }, false, clickCallback );
							function clickCallback()
							{
								msg.notificationData.clicked = true;
								mobileDebug( ' Startappz: ' + appName, true );
								Friend.startupApps[ appName ] = true;
								ExecuteApplication( appName, '', appMessage );
							}
						}
					}
				}
			}
		}
	},
	// Notify all apps of a state change
	notifyAppsOfState: function( flags )
	{
		if( !flags || !flags.state ) return;
		
		let msg = {
			command: 'workspace-notify',
			state: flags.state
		};
		let apps = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
		for( let a = 0; a < apps.length; a++ )
		{
			// TODO: Have per application permissions here..
			// Not all applications should be able to send messages to
			// all other applications...
			msg.applicationId = apps[a].applicationId;
			apps[ a ].sendMessage( msg );
		}
	},
	checkFriendNetwork: function()
	{
		let self = this;
		if ( window.isMobile )
		{
			ClearCache(); 		// TODO: remove!
		}
		
		let m = new Module('system');
		m.onExecuted = function( e,d )
		{
			if ( e == 'ok' && parseInt( d ) == 1 )
			{
				console.log('init friend network');

				// connect to FriendNetwork
				if( Workspace.sessionId && window.FriendNetwork )
				{
					self.connectToFriendNetwork();
				}
			}
			else
			{
				//console.log( 'friend network not enabled' );
			}
		}
		m.execute( 'checkfriendnetwork' );
	},
	connectToFriendNetwork: function()
	{
		let self = this;
		this.friendNetworkEnabled = true;
		if ( !FriendNetwork.conn )
		{
			let host = document.location.hostname + ':6514';
			if ( 'http:' === document.location.protocol )
				host = 'ws://' + host;
			else
				host = 'wss://' + host;

			// Will get the information entered in Friend Network settings panel
			window.FriendNetwork.init( host, 'workspace', Workspace.sessionId, false );

			// Start Friend Network Services when Friend Network is established
			setTimeout( function()								// Nice! Makes a philosophical
			{													// sentence when read vertically! :)
				window.FriendNetworkDoor.start();				// Open the door...
				window.FriendNetworkFriends.start();			// Start making friends...
				window.FriendNetworkShare.start();				// Share!
				window.FriendNetworkDrive.start();				// It drives
				window.Friend.Network.Power.start();			// power!
			}, 1000 );											// Friend! Empowerment for everyone! (Y)
		}
	},
	closeFriendNetwork: function()
	{
		Friend.Network.Power.close();
		FriendNetworkDrive.close();
		FriendNetworkShare.close();
		FriendNetworkFriends.close();
		FriendNetworkDoor.close();
		FriendNetwork.close();
	},
	terminateSession: function( sess, dev, e )
	{
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_sure_you_want_terminate_session' ), function( data )
		{
			let f = new Library( 'system.library' );
			f.onExecuted = function( res )
			{
				Workspace.refreshExtraWidgetContents();
			}
			f.execute( 'user/killsession', { sessid: sess, deviceid: dev, username: Workspace.loginUsername } );
		} );
		return cancelBubble( e );
	},
	// Handle an interaction event on a queued event
	handleNotificationInteraction: function( eventId, response, uniqueId )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( {e:e,d:d} );
			if( e != 'ok' ) Alert( 'Error', d );
			if( e == 'ok' )
			{
				RemoveNotificationEvent( uniqueId );
				PollTray();
			}
		}
		m.execute( 'queuedeventresponse', {
			eventid: eventId,
			response: response
		} );
	},
	refreshExtraWidgetContents: function()
	{
		if( this.mode == 'vr' ) return;

		let self = this;

		if( Workspace.isSingleTask ) return;
		
		if( !this.refreshEWCTime )
		    this.refreshEWCTime = 0;
		let cand = ( new Date() ).getTime() / 1000;
		
		function doItCal( sessions )
		{
			let m = Workspace.widget ? Workspace.widget.target : ge( 'DoorsScreen' );
		    if( m == ge( 'DoorsScreen' ) )
			    m = ge( 'DoorsScreen' ).screenTitle.getElementsByClassName( 'Extra' )[0];
		    if( !m )
		    {
			    //console.log( 'Can not find widget!' );
			    return;
		    }
		    
			let closeBtn = '<div class="HRow"><p class="Layout"><button type="button" class="FloatRight Button fa-close IconSmall">' + i18n( 'i18n_close' ) + '</button></p></div>';

		    // Mobile launches calendar in a different way, so this 
		    // functionality is only for desktops
		    if( !isMobile && !Workspace.isSingleTask )
		    {
			    var wid = Workspace.widget ? Workspace.widget : m.widget;
			    if( wid )
			    {
				    wid.shown = true;
			    }

			    if( wid && !wid.initialized )
			    {
				    wid.initialized = true;
				    
				    self.createCalendar( wid, sessions );
			    }
			    else
			    {
				    if( m.calendar )
				    {
					    m.calendar.render();
					    m.sessions.innerHTML = d;
				    }
			    }
			    if( wid )
			    {
				    wid.autosize();
			    }
			    PollTrayPosition();
		    }
		}
		
		if( !Workspace.cachedSessionList || cand - this.refreshEWCTime > 30 )
		{
		    this.refreshEWCTime = cand;
		    
		    Workspace.getAnnouncements();
		    
		    let no = new Module( 'system' );
		    no.onExecuted = function( e, d )
		    {
		    	if( e == 'ok' )
		    	{
		    		let list = false;
		    		try
		    		{
		    			list = JSON.parse( d );
		    		}
		    		catch( e ){};
		    		if( !list ) return;
		    		for( let a = 0; a < list.length; a++ )
		    		{
		    			AddNotificationEvent( {
		    				title: list[a].Title,
		    				text: list[a].Message,
		    				time: list[a].Date,
		    				type: list[a].Type,
		    				eventId: list[a].ID,
		    				seen: false
		    			} );
		    		}
		    	}
		    }
		    no.execute( 'getqueuedevents' );
		    
		    let mo = new Library( 'system.library' );
		    mo.onExecuted = function( rc, sessionList )
		    {
			    let m = Workspace.widget ? Workspace.widget.target : ge( 'DoorsScreen' );
			    if( m == ge( 'DoorsScreen' ) )
				    m = ge( 'DoorsScreen' ).screenTitle.getElementsByClassName( 'Extra' )[0];
			    if( !m )
			    {
				    //console.log( 'Can not find widget!' );
				    return;
			    }
		    
			    var sessions = [];
			    if( rc == 'ok' )
			    {
				    if( typeof( sessionList ) == 'string' )
					    sessionList = JSON.parse( sessionList );

				    if( sessionList )
				    {
					    try
					    {
						    var exists = [];
						    for( let b = 0; b < sessionList.length; b++ )
						    {
							    if( sessionList[b].sessionid == Workspace.sessionId ) continue;
							    var sn = sessionList[b].deviceidentity.split( '_' );
							    var svn = sn[2] + ' ';

							    switch( sn[0] )
							    {
								    case 'touch':
									    svn += 'touch device';
									    break;
								    case 'wimp':
									    svn += 'computer';
									    break;
							    }
							    switch( sn[1] )
							    {
								    case 'iphone':
									    svn += '(iPhone)';
									    break;
								    case 'android':
									    svn += '(Android device)';
									    break;
							    }
							    var num = 0;
							    var found = false;
							    for( let c = 0; c < exists.length; c++ )
							    {
								    if( exists[c] == svn )
								    {
									    num++;
									    found = true;
								    }
							    }
							    exists.push( svn );
							    if( found ) svn += ' ' + (num+1) + '.';
							    sessions.push( '<p class="Relative FullWidth Ellipsis IconSmall fa-close MousePointer" onmousedown="Workspace.terminateSession(\'' +
								    sessionList[b].sessionid + '\', \'' + sessionList[b].deviceidentity + '\');">&nbsp;' + svn + '</p>' );
						    }
						    Workspace.cachedSessionList = sessions;
					    }
					    catch( e )
					    {
					    }
				    }
			    }

			    doItCal( sessions );
		    }
		    // FRANCOIS: get unique device IDs...
		    mo.execute( 'user/sessionlist', { username: Workspace.loginUsername } );
		}
		else
		{
			doItCal( Workspace.cachedSessionList ? Workspace.cachedSessionList : [] );
		}
		
		// For mobiles, we have a Friend icon at the top of the screen
		// Also add the app menu
		if( isMobile && !Workspace.topNavigation )
		{
			let topNavigation = document.createElement( 'div' );
			topNavigation.className = 'MobileTopNavigation';
			Workspace.topNavigation = topNavigation;
			Workspace.screen.contentDiv.parentNode.appendChild( topNavigation );
			topNavigation.onclick = function()
			{
				window.focus();
				
				if( ge( 'WorkspaceMenu' ) )
				{
					ge( 'WorkspaceMenu' ).classList.remove( 'Open' );
					document.body.classList.remove( 'WorkspaceMenuOpen' );
				}
				if( Workspace.widget )
					Workspace.widget.slideUp();
				
				// Store active window in mainwindow
				if( window._getAppByAppId )
				{
					if( window.currentMovable && currentMovable.applicationId )
					{
						let app = _getAppByAppId( currentMovable.applicationId );
						if( app.mainView )
						{
							if( currentMovable.windowObject != app.mainView )
							{
								app.mainView.lastActiveView = currentMovable;
							}
						}
					}
				}
				
				if( !Workspace.isSingleTask && Workspace.mainDock )
					Workspace.mainDock.closeDesklet();
				DefaultToWorkspaceScreen();
				_DeactivateWindows();
				Friend.GUI.reorganizeResponsiveMinimized();
				window.focus();
			}
			
			// App menu toggle
			let appMenu = document.createElement( 'div' );
			appMenu.className = 'MobileAppMenu';
			Workspace.appMenu = appMenu;
			Workspace.screen.contentDiv.parentNode.appendChild( appMenu );
			appMenu.onclick = function()
			{
				// Turn off openlock
				if( Workspace.mainDock )
					Workspace.mainDock.openLock = false;
				window.focus();
				
				if( ge( 'WorkspaceMenu' ) )
				{
					ge( 'WorkspaceMenu' ).classList.remove( 'Open' );
					document.body.classList.remove( 'WorkspaceMenuOpen' );
				}
				if( document.body.classList.contains( 'AppsShowing' ) )
				{
					if( !Workspace.isSingleTask && Workspace.mainDock )
						Workspace.mainDock.closeDesklet();
					Friend.GUI.reorganizeResponsiveMinimized();
				}
				else
				{
					if( !Workspace.isSingleTask && Workspace.mainDock )
						Workspace.mainDock.openDesklet();
				}
			}
		}
	},
	// Server announcements
	getAnnouncements: function()
	{
		// TODO: Re-enable later
	    return;
	    let ann = new Module( 'system' );
		ann.onExecuted = function( e, d )
		{
		    if( e == 'ok' )
		    {
		        console.log( 'We have an announcement!', d );
		        try
		        {
		            let annList = JSON.parse( d );
		            console.log( 'List: ', annList );
		        }
		        catch( e )
		        {
		            console.log( 'Could not read announcements.' );
		        }
		    }
		    else
		    {
		        console.log( 'No new announcements.' );
		    }
		}
		ann.execute( 'getannouncements', { deviceid: Workspace.deviceid } );
    },
	zapMobileAppMenu: function()
	{
		// Turn on openlock
		if( Workspace.mainDock )
		{
			Workspace.mainDock.openLock = true;
			if( document.body.classList.contains( 'AppsShowing' ) )
			{
				Workspace.mainDock.dom.style.display = 'none';
				setTimeout( function()
				{
					Workspace.mainDock.dom.style.display = '';
				}, 400 );
				if( !Workspace.isSingleTask )
					Workspace.mainDock.closeDesklet();
				Workspace.mainDock.dom.classList.remove( 'Open' );
			}
		}
	},
	// Close widgets and return to desktop..
	goToMobileDesktop: function()
	{
		if( Workspace.widget )
			Workspace.widget.slideUp();
		if( Workspace.mainDock && !Workspace.isSingleTask )
			Workspace.mainDock.closeDesklet();
		this.exitMobileMenu();
	},
	loadSystemInfo: function()
	{
		let f = new window.Library( 'system.library' );
		/*
			For whatever reason, it receives data on the error argument..
		*/
		f.onExecuted = function( e, d )
		{
			let str = JSON.stringify(e);
			Workspace.systemInfo = e;
		}
		f.forceHTTP = true;
		f.execute( 'admin', {command:'info'} );
	},
	// If we have stored a theme config for the current theme, use its setup
	// TODO: Move to a proper theme parser
	applyThemeConfig: function()
	{
		if( !this.themeData )
			return;
		
		if( this.themeStyleElement )
			this.themeStyleElement.innerHTML = '';
		else
		{
			this.themeStyleElement = document.createElement( 'style' );
			document.getElementsByTagName( 'head' )[0].appendChild( this.themeStyleElement );
		}
		
		let shades = [ 'dark', 'charcoal', 'synthwave' ];
		for( let c in shades )
		{
			let uf = shades[c].charAt( 0 ).toUpperCase() + shades[c].substr( 1, shades[c].length - 1 );
			if( this.themeData[ 'colorSchemeText' ] == shades[c] )
				document.body.classList.add( uf );
			else document.body.classList.remove( uf );
		}
		
		let iconeffect = [ 'shadow', 'box' ];
		for( let c in iconeffect )
		{
			let uf = iconeffect[c].charAt( 0 ).toUpperCase() + iconeffect[c].substr( 1, iconeffect[c].length - 1 );
			if( this.themeData[ 'iconEffectText' ] == iconeffect[c] )
				document.body.classList.add( uf );
			else document.body.classList.remove( uf );
		}
		
		if( this.themeData[ 'buttonSchemeText' ] == 'windows' )
			document.body.classList.add( 'MSW' );
		else document.body.classList.remove( 'MSW' );
		
		let str = '';
		
		for( let a in this.themeData )
		{
			if( !this.themeData[a] ) continue;
			let v = this.themeData[a];
			
			switch( a )
			{
				case 'colorTitleActive':
					str += `
html > body .View.Active > .Title,
html > body .View.Active > .LeftBar,
html > body .View.Active > .RightBar,
html > body .View.Active > .BottomBar
{
	background-color: ${v};
}
`;
					break;
				case 'colorButtonBackground':
					str += `
html > body .Button, html > body button,
html > body #DockWindowList .Task.Active, html > body #Statusbar .Task.Active
{
	background-color: ${v};
}
`;
					break;
				case 'colorWindowBackground':
					str += `
html > body, html body .View > .Content
{
	background-color: ${v};
}
`;
					break;
				case 'colorWindowText':
					str += `
html > body, html body .View > .Content, html > body .Tab
{
	color: ${v};
}
`;
					break;
				case 'colorFileToolbarBackground':
					str += `
html > body .View > .DirectoryToolbar
{
	background-color: ${v};
}
`;
					break;
				case 'colorFileToolbarText':
					str += `
html > body .View > .DirectoryToolbar button:before, 
html > body .View > .DirectoryToolbar button:after
{
	color: ${v};
}
`;
					break;
				case 'colorFileIconText':
					str += `
html > body .File a
{
	color: ${v};
}
`;
					break;
				case 'colorScrollBackground':
					str += `
body .View.Active ::-webkit-scrollbar,
body .View.Active.IconWindow ::-webkit-scrollbar-track
{
	background-color: ${v};
}
`;
					break;
				case 'colorScrollButton':
					str += `
html body .View.Active.Scrolling > .Resize,
body .View.Active ::-webkit-scrollbar-thumb,
body .View.Active.IconWindow ::-webkit-scrollbar-thumb
{
	background-color: ${v} !important;
}
`;
					break;
			}
		}
		this.themeStyleElement.innerHTML = str;
	},
	// NB: Start of workspace_inside.js ----------------------------------------
	refreshUserSettings: function( callback )
	{
		let b = new Module( 'system' );
		b.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				Workspace.serverConfig = JSON.parse( d );
			}
		}
		b.execute( 'sampleconfig' );
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			function initFriendWorkspace()
			{
				// Make sure we have loaded
				if( Workspace.mode != 'vr' && ( Workspace.screen && Workspace.screen.contentDiv ) )
					if( Workspace.screen.contentDiv.offsetHeight < 100 )
						return setTimeout( initFriendWorkspace, 50 );
						
				if( e == 'ok' && d )
				{
					Workspace.userSettingsLoaded = true;
					let dat = JSON.parse( d );
					if( dat.wallpaperdoors && dat.wallpaperdoors.substr )
					{
						if( dat.wallpaperdoors.substr(0,5) == 'color' )
						{
							Workspace.wallpaperImage = 'color';
							document.body.classList.remove( 'NoWallpaper' );
							document.body.classList.remove( 'DefaultWallpaper' );
						}
						else if( dat.wallpaperdoors.length )
						{
							Workspace.wallpaperImage = dat.wallpaperdoors;
							document.body.classList.remove( 'NoWallpaper' );
							document.body.classList.remove( 'DefaultWallpaper' );
						}
						else 
						{
							document.body.classList.add( 'DefaultWallpaper' );
							Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
						}
					}
					else
					{
						document.body.classList.add( 'NoWallpaper' );
					}
					// Check for theme specifics
					if( dat[ 'themedata_' + Workspace.theme ] )
					{
						Workspace.themeData = dat[ 'themedata_' + Workspace.theme ];
					}
					else
					{
						Workspace.themeData = false;
					}
					Workspace.applyThemeConfig();
					Workspace.loadSystemInfo();
					
					// Fallback
					if( !isMobile )
					{
						if( !dat.wizardrun )
						{
							if( !Workspace.WizardExecuted )
							{
								//ExecuteApplication( 'FriendWizard' );
								Workspace.WizardExecuted = true;
							}
						}
					}
					
					if( !Workspace.wallpaperImage || Workspace.wallpaperImage == '""' || Workspace.wallpaperImage === '' )
					{
						Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
					}
					
					if( dat.wallpaperwindows )
					{
						Workspace.windowWallpaperImage = dat.wallpaperwindows;
					}

					if( dat.language )
					{
						globalConfig.language = dat.language.spokenLanguage;
						globalConfig.alternateLanguage = dat.language.spokenAlternate ? dat.language.spokenAlternate : 'en-US';
					}
					if( dat.menumode )
					{
						globalConfig.menuMode = dat.menumode;
					}
					if( dat.focusmode )
					{
						globalConfig.focusMode = dat.focusmode;
						document.body.setAttribute( 'focusmode', dat.focusmode ); // Register for styling
					}
					if( dat.navigationmode )
					{
						globalConfig.navigationMode = dat.navigationmode;
					}
					if( dat.hiddensystem )
					{
						globalConfig.hiddenSystem = dat.hiddensystem;
					}
					if( window.isMobile )
					{
						globalConfig.viewList = 'separate';
					}
					else if( dat.windowlist )
					{
						globalConfig.viewList = dat.windowlist;
						document.body.setAttribute( 'viewlist', dat.windowlist ); // Register for styling
					}
					if( dat.scrolldesktopicons == 1 )
					{
						globalConfig.scrolldesktopicons = dat.scrolldesktopicons;
					}
					else globalConfig.scrolldesktopicons = 0;
					if( dat.hidedesktopicons == 1 )
					{
						globalConfig.hidedesktopicons = dat.scrolldesktopicons;
						document.body.classList.add( 'DesktopIconsHidden' );
					}
					else
					{
						globalConfig.hidedesktopicons = 0;
						document.body.classList.remove( 'DesktopIconsHidden' );
					}
					// Can only have workspaces on mobile
					// TODO: Implement dynamic workspace count for mobile (one workspace per app)
					if( dat.workspacecount >= 0 && !window.isMobile )
					{
						globalConfig.workspacecount = dat.workspacecount;
					}
					else
					{
						globalConfig.workspacecount = 1;
					}

					if( dat.workspacemode )
					{
						Workspace.workspacemode = dat.workspacemode;
					}
					else
					{
						Workspace.workspacemode = 'developer';
					}
				
					// Disable console log now..
					if( Workspace.workspacemode == 'normal' || Workspace.workspacemode == 'gamified' )
					{
						//console.log = function(){};
					}
					
					if( dat.workspace_labels )
					{
						globalConfig.workspace_labels = dat.workspace_labels;
					}
					else
					{
						globalConfig.workspace_labels = [];
					}
					
					// Make sure iOS has the correct information
					if( window.friendApp && window.webkit && window.friendApp.setBackgroundColor )
					{
						let col = '#34495E';
						switch( Workspace.themeData.colorSchemeText )
						{
							case 'charcoal':
								col = '#3b3b3b';
								break;
							default:
								break;
						}
						window.friendApp.setBackgroundColor( col );
					}
					
					// If we haven't refreshed, do it now
					if( !Workspace.desktopFirstRefresh )
					{
						Workspace.refreshDesktop();
					}
					
					// Do the startup sequence in sequence (only once)
					if( !Workspace.startupSequenceRegistered )
					{	
						Workspace.startupSequenceRegistered = true;
						
						// Reload the docks here
						Workspace.reloadDocks();
						
						
						// In single tasking mode, we just skip
						if( Workspace.isSingleTask )
						{
							// Oh! We wanted to start an application!
							if( GetUrlVar( 'app' ) )
							{
								let args = false;
								if( GetUrlVar( 'args' ) ) args = GetUrlVar( 'args' );
								ExecuteApplication( GetUrlVar( 'app' ), args );
							}
							ScreenOverlay.hide();
							PollTray();
							PollTaskbar();
							// Tell app we can show ourselves!
							if( window.friendApp && window.friendApp.reveal )
							{
								friendApp.reveal();
							}
													
							return;
						}
						
						/* We have a startup application! */
						
						Workspace.onReadyList.push( function()
						{
							let seq = dat.startupsequence;
							if( typeof( seq ) != 'object' )
							{
								try
								{
									seq = JSON.parse( seq );
								}
								catch( e )
								{
									seq = [];
								}
							}
							if( seq.length )
							{
								if( ScreenOverlay.debug )
									ScreenOverlay.setTitle( i18n( 'i18n_starting_your_session' ) );
								let l = {
									index: 0,
									func: function()
									{
										if( Workspace.getWebSocketsState() != 'open' )
										{
											//console.log( 'Waiting for websocket... ' + Math.random() );
											return setTimeout( function(){ l.func() }, 500 );
										}
										if( !ScreenOverlay.done && l.index < seq.length )
										{
											// Register for Friend DOS
											ScreenOverlay.launchIndex = l.index;
											let cmd = seq[ l.index++ ];
											if( cmd && cmd.length )
											{
												// Sanitize
												if( cmd.indexOf( 'launch' ) == 0 )
												{
													let appString = cmd.substr( 7, cmd.length - 7 );
													let appName = appString.split( ' ' )[0];
													let args = appString.substr( appName.length + 1, appString.length - appName.length + 1 );
													let found = false;
													for( let b = 0; b < Workspace.applications.length; b++ )
													{
														if( Workspace.applications[ b ].applicationName == appName )
														{
															found = true;
															break;
														}
													}
													if( !found && !Friend.startupApps[ appName ] )
													{
														let slot;
														if( ScreenOverlay.debug )
															slot = ScreenOverlay.addStatus( i18n( 'i18n_processing' ), cmd );											
														ScreenOverlay.addDebug( 'Executing ' + cmd );

														Workspace.shell.execute( cmd, function( res )
														{
															if( ScreenOverlay.debug )
															{
																ScreenOverlay.editStatus( slot, res ? 'Ok' : 'Error' );
																ScreenOverlay.addDebug( 'Done ' + cmd );
															}
															l.func();
															if( Workspace.mainDock && !Workspace.isSingleTask )
																Workspace.mainDock.closeDesklet();
														} );
													}
													// Just skip
													else
													{
														l.func();
													}
												}
												else
												{
													l.func();
												}
												return;
											}
										}
										// Hide overlay
										ScreenOverlay.hide();
										
										PollTray();
										PollTaskbar();
										l.func = function()
										{
											//
										}
										// We are done. Empty startup apps!
										Friend.startupApps = {};
									}
								}
								l.func();
							}
							else
							{
								// Hide overlay
								ScreenOverlay.hide();
								PollTray();
								PollTaskbar();
								// Tell app we can show ourselves!
								if( window.friendApp && window.friendApp.reveal )
								{
									friendApp.reveal();
								}
							}
						} );
					}
				}
				else
				{
					Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
					Workspace.windowWallpaperImage = '';
					document.body.classList.add( 'DefaultWallpaper' );
					// Tell app we can show ourselves!
					if( window.friendApp && window.friendApp.reveal )
					{
						friendApp.reveal();
					}
				}
				if( callback && typeof( callback ) == 'function' ) callback();
			}
			
			// Load application cache's and then init workspace
			loadApplicationBasics(
				initFriendWorkspace()
			);
		}
		m.forceHTTP = true;
		m.execute( 'getsetting', { settings: [ 
			'avatar', 'workspacemode', 'wallpaperdoors', 'wallpaperwindows', 'language', 
			'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
			'focusmode', 'hiddensystem', 'workspacecount', 
			'scrolldesktopicons', 'hidedesktopicons', 'wizardrun', 'themedata_' + Workspace.theme,
			'workspacemode', 'workspace_labels'
		] } );
	},
	// Called on onunload
	unloadFriendNetwork: function( e )
 	{
		// Close all connections
		if ( this.friendNetworkEnabled && !this.fnetCloseOn )
		{
			this.fnetCloseOn = true;
			Workspace.closeFriendNetwork();
			let self = this;
			setTimeout( function() 
			{
				let handle = setInterval( function()
				{
					self.fnetCloseOn = false;
					Workspace.connectToFriendNetwork();
					clearInterval( handle );
				}, 50 );
			}, 1000 )
		}
 	},
	// Do you want to leave?
	leave: function( e )
	{
		if( Workspace.noLeaveAlert == true )
		{
			return true;
		}
		if( !Workspace.sessionId ) return true;
		RemoveDragTargets();
		Workspace.unloadFriendNetwork();
		if( e )
		{
			e.returnValue = i18n( 'i18n_leave_question' )
			return e.returnValue;
		}
		return;
	},
	smenu: {
		dom: false,
		tree: false,
		visible: false
	},
	// Just reset the state of the start menu
	pollStartMenu: function()
	{
		this.toggleStartMenu( false );
	},
	toggleStartMenu: function( show, e )
	{	
		// Force state
		if( show === true )
		{
			this.smenu.visible = true;
			window.focus();
			if( window.WorkspaceMenu )
				WorkspaceMenu.close();
		}
		// Force hide / remove
		else if( show === false )
		{
			this.smenu.visible = false;
		}
		// Normal toggle behavior
		else
		{
			this.smenu.visible = this.smenu.visible ? false : true;
		}
		
		// Hide start menu when it's set to not show
		if( !this.smenu.visible )
		{
			if( this.smenu.dom )
			{
				let sm = this.smenu;
				this.smenu.dom.className = 'DockMenu';
				this.smenu.dom.style.height = '0px';
				this.smenu.dom.style.top = '0px';
				setTimeout( function()
				{
					if( sm.dom && sm.dom.parentNode )
					{
						sm.dom.parentNode.removeChild( sm.dom );
						sm.dom = false;
					}
				}, 250 );
			}
		}
		// Build start menu
		else
		{
			// Non clean
			if( this.smenu.dom && this.smenu.dom.parentNode )
				this.smenu.dom.parentNode.removeChild( this.smenu.dom );
			this.smenu.currentItem = false;
			
			let d = null;
			
			if( Workspace.mainDock )
			{
				d = document.createElement( 'div' );
				d.className = 'DockMenu';
			
				Workspace.mainDock.dom.appendChild( d );
				d.onclick = function( e )
				{
					Workspace.toggleStartMenu( false );
				};
				this.smenu.dom = d;
				this.smenu.dom.style.height = '0px';
				this.smenu.dom.style.top = '0px';

				d.addEventListener( 'contextmenu', function( e )
				{
					return cancelBubble( e );
				}, false );
			}

			// We don't show the menu at first, we need to build!
			let delayedBuildTime = false;
			let delayedBuildFunc = false;

			// Add menu items
			function buildMenu( path, dparent, depth )
			{
				if( !depth ) depth = 1;
				
				let dr = new Door().get( path );
				dr.getIcons( false, function( data )
				{
					// Create container
					let dd = document.createElement( 'div' );
					dd.className = 'DockSubMenu';
					dparent.appendChild( dd );

					// Calculate header
					let p = path.split( ':' );
					if( p.length > 1 && p[1].length )
					{
						p = p[1];
						if( p.charAt( p.length - 1 ) == '/' )
							p = p.substr( 0, p.length - 1 );
						if( p.indexOf( '/' ) > 0 )
						{
							p = p.split( '/' );
							p = p[ p.length - 1 ];
						}
						if( p.charAt( p.length - 1 ) == '/' )
							p = p.substr( 0, p.length - 1 );
						p += ':';
					}
					else
					{
						p = p[0] + ':';
					}
					
					// Control scrolling
					dd.onscroll = function()
					{
						this.scrollTopCached = this.scrollTop;
					}
					dd.onmousemove = function()
					{
						if( this.scrollTopCached )
							this.scrollTop = this.scrollTopCached;
					}
					// Done controlling scrolling

					let menuHeader = document.createElement( 'div' );
					menuHeader.className = 'DockMenuHeader';
					menuHeader.innerHTML = dparent.classList.contains( 'DockMenu' ) && Workspace.fullName ? Workspace.fullName : p;
					dd.appendChild( menuHeader );

					let topInfo = null;
					if( !Workspace.smenu.dom.parentNode )
						return;
					
					if( Workspace.smenu.dom.parentNode.classList.contains( 'Right' ) )
					{
						topInfo = 'Right';
					}
					else if( Workspace.smenu.dom.parentNode.classList.contains( 'Left' ) )
					{
						topInfo = 'Left';
					}
					else if( Workspace.smenu.dom.parentNode.classList.contains( 'Top' ) )
					{
						topInfo = 'Top';
					}

					// Add favorites
					if( dparent.classList.contains( 'DockMenu' ) && ge( 'desklet_0' ) )
					{
						let eles = ge( 'desklet_0' ).getElementsByClassName( 'Launcher' );
						let out = [];
						for( let b = 0; b < eles.length; b++ )
						{
							if( eles[b].classList.contains( 'Startmenu' ) ) continue;

							let nam = eles[b].getAttribute( 'data-displayname' ) ? eles[b].getAttribute( 'data-displayname' ) : eles[b].getElementsByTagName( 'span' )[0].innerHTML;
							let exe = eles[b].getAttribute( 'data-exename' ) ? eles[b].getAttribute( 'data-exename' ) : eles[b].getElementsByTagName( 'span' )[0].innerHTML;
							
							// Skip erroneous elements
							if( !exe || typeof( exe ) == 'undefined' || exe == 'undefined' ) continue;
							
							let im = eles[b].style.backgroundImage ? 
								eles[b].style.backgroundImage.match( /url\([\'|\"]{0,1}(.*?)[\'|\"]{0,1}\)/i ) : false;
							if( im && im[1] )
							{
								im = im[1];
							}
							else im = false;
							
							out.push( {
								Title: nam,
								Path: 'Mountlist:',
								Filename: exe,
								Type: 'Executable',
								Icon: im ? im : null
							} );
						}
						if( out.length )
						{
							out = ( [ { Title: i18n( 'i18n_favorites' ) + ':', Path: 'Mountlist:', Type: 'Header' } ] ).concat( out );
							out.push( { Title: i18n( 'i18n_menu' ) + ':', Path: 'Mountlist:', Type: 'Header' } );
							for( let a = 0; a < data.length; a++ )
							{
								out.push( data[a] );
							}
							data = out;
						}
					}
					
					// Duplicates patch
					let dupTest = [];
					
					// On the first depth, filter on some priority
					if( depth == 1 )
					{
						let frs = [];
						let out = [];
						let end = [];
						let filter = [ 'Software', 'Preferences', 'Settings' ];
						let i = 0;
						for( let a = 0; i < filter.length && a < data.length; a++ )
						{
							let pth = data[a].Path + '';
							if( pth.substr( pth.length - 1, 1 ) == '/' )
								pth = pth.substr( 0, pth.length - 1 );
							let last = pth.indexOf( '/' ) > 0 ? pth.split( '/' ).pop() : pth.split( ':' ).pop();
							if( last == filter[ i ] )
							{
								out.push( data[ a ] );
								i++;
								a = 0;
							}
						}
						for( let a = 0; a < data.length; a++ )
						{
							let found = false;
							for( let b = 0; b < filter.length; b++ )
							{
								if( filter[ b ] == data[ a ].Title )
								{
									found = true;
									break;
								}
							}
							if( !found ) 
							{
								if( data[ a ].Type == 'Directory' )
									end.push( data[ a ] );
								else frs.push( data[ a ] );
							}
						}
						data = frs.concat( out, end );
					}
					
					// Contains sub menus
					let ss = [];
					
					// Menu items
					for( let a = 0; a < data.length; a++ )
					{
						if( data[a].Type == 'Header' )
						{
							let s = document.createElement( 'div' );
							s.className = 'DockMenuSubHeader';
							s.innerHTML = data[a].Title;
							dd.appendChild( s );
							continue;
						}
						
						if( data[a].Type == 'Directory' )
						{
							data[a].Icon = '/iconthemes/friendup15/FolderGradient.svg';
						}
						
						let p = data[a].Path.split( ':' )[1];
						if( p == 'Repositories/' || p == 'Modules/' || p == 'Functions/' || p == 'Libraries/' || p == 'Devices/' )
							continue;
						let last = p.split( '/' ).pop();
						if( last == 'Preferences' )
							continue;
						
						let s = document.createElement( 'div' );
						s.className = 'DockMenuItem MousePointer ' + data[a].Type;
						s.addEventListener( 'mouseover', function( e )
						{
							let self = this;
							this.classList.add( 'Over' );
							let eles = this.parentNode.getElementsByClassName( 'DockMenuItem' );
							for( let z = 0; z < eles.length; z++ )
							{
								if( eles[z].parentNode != this.parentNode )
									continue;
								if( eles[z] != this )
								{
									eles[z].classList.remove( 'Over' );
								}
							}
							
							// Reposition sub menu
							let sub = this.querySelector( '.DockSubMenu' );
							if( sub )
							{
								let sc = Workspace.screen.contentDiv.offsetHeight;
								let ct = GetElementTop( this );
								let ch = sub.lastChild.offsetTop + sub.lastChild.offsetHeight;
								let at = 0;
								
								// Popped bottom
								if( ct + ch > sc )
								{
									let diff = ( ct + ch ) - sc;
									at -= diff;
									ct -= diff;
								}
								
								// Popped top
								if( ct < 0 )
								{
									let diff = -ct;
									at += diff;
									ct += diff;
								}
								
								// Popped bottom again
								if( ct + ch > sc )
								{
									ch -= ( ct + ch ) - sc;
									// Add scrolling!
									sub.classList.add( 'MaskedOverflow', 'ScrollbarSmall', 'SmoothScrolling' );
								}
								else
								{
									sub.style.marginTop = 0;
									sub.classList.remove( 'MaskedOverflow', 'ScrollbarSmall', 'SmoothScrolling' );
								}
								
								sub.style.top = at + 'px';
								sub.style.height = ch + 'px';
							}
							
							if( this.leaveTimeout )
								clearTimeout( this.leaveTimeout );
						} );
						s.addEventListener( 'mouseout', function( e )
						{
							let s = this;
							this.leaveTimeout = setTimeout( function()
							{
								s.classList.remove( 'Over' );
							}, 1000 );
						} );
						s.innerHTML = data[a].Title ? data[a].Title : data[a].Filename;
						
						if( !data[a].Icon && !data[a].IconFile )
							data[a].Icon = '/iconthemes/friendup15/File_Binary.svg';
						if( !data[a].IconFile )
							data[a].IconFile = '/iconthemes/friendup15/File_Binary.svg';
	
						if( data[a].Icon )
							s.innerHTML = '<span><img ondragstart="return cancelBubble( event )" src="' + data[a].Icon + '"/></span><span>' + s.innerHTML + '</span>';
						else if( data[a].IconFile )
						{
							let i = data[a].IconFile;
							if( i.indexOf( 'resources/' ) == 0 )
								i = i.substr( 9, i.length - 9 );
							s.innerHTML = '<span><img ondragstart="return cancelBubble( event )" src="' + i + '"/></span><span>' + s.innerHTML + '</span>';
							data[a].Icon = i;
						}
						
						// Sub menu
						if( data[a].Type == 'Directory' )
						{
							// Skip if we already added
							let found = false;
							for( let b = 0; b < dupTest.length; b++ )
							{
								if( dupTest[b] == data[a].Path )
								{
									found = true;
									break;
								}
							}
							if( found ) continue;
							dupTest.push( data[a].Path );
							buildMenu( data[a].Path, s, depth + 1 );
							s.onclick = function( e )
							{
								if( e.button != 0 ) return;
								let self = this;
								this.classList.add( 'Over' );
								let eles = this.parentNode.getElementsByClassName( 'DockMenuItem' );
								for( let z = 0; z < eles.length; z++ )
								{
									if( eles[z].parentNode != this.parentNode )
										continue;
									if( eles[z] != this )
									{
										eles[z].classList.remove( 'Over' );
									}
								}
								if( this.leaveTimeout )
									clearTimeout( this.leaveTimeout );
								return cancelBubble( e );
							}
						}
						else
						{
							// Missing filename from path..
							if( data[a].Path.indexOf( data[a].Filename ) < data[a].Path.length - data[a].Filename.length )
								data[a].Path += data[a].Filename;

							// Fetch executable
							let executable = data[a].Path.split( ':' )[1].split( '/' );
							if( executable.length ) executable = executable[ executable.length - 1 ];
							else executable = executable[0];
							s.executable = executable;

							if( !executable )
							{
								s.executable = data[a].Filename;
								if( s.executable.indexOf( '.' ) > 0 )
								{
									s.executable = data[a].Path + s.executable;
								}
								s.filename = data[a].Filename;
							}

							// Click action
							s.onclick = function( e )
							{
								if( e.button != 0 ) return;
								Workspace.toggleStartMenu( false );
								// PDFs
								if( !this.filename ) this.filename = this.executable;
								if( this.filename && this.filename.substr( this.filename.length - 4, 4 ) == '.pdf' )
								{
									let v = new View( {
										title: this.filename.split( '.pdf' )[0],
										width: 700,
										height: 600,
										fullscreenenabled: true
									} );
									v.setRichContentUrl( '/webclient/templates/userdocs/' + this.filename );
								}
								else
								{
									//copy and paste from Dock code to parse for arguments and workspace connections...
									let args = '';
									let executable = this.executable + '';
					
									if( executable.indexOf( ' ' ) > 0 )
									{
										let t = executable.split( ' ' );
										if( t[0].indexOf( ':' ) == -1)
										{
											args = '';
											for( let a = 1; a < t.length; a++ )
											{
												args += t[a];
												if( a < t.length - 1 )
													args += ' ';
											}
											executable = t[0];	
										}
									}
									
									ExecuteApplication( executable, args );
								}
							}
							// Drag fileinfo
							s.fi = {
								Filename: data[ a ].Filename,
								Title: data[ a ].Title ? data[ a ].Title : data[ a ].Filename,
								IconFile: data[a].Icon,
								Path: data[ a ].Path,
								Type: data[ a ].Type,
								MetaType: data[ a ].MetaType ? data[ a ].MetaType : false
							};
							s.onmousedown = function( e )
							{
								if( e.button != 0 ) return;
								this.slideX = 0;
								this.offX = e.clientX;
								this.offY = e.clientY;
								window.mouseDown = FUI_MOUSEDOWN_PICKOBJ;
							}
							s.onmousemove = function( e )
							{
								if( this.offX && this.offY )
								{
									let dx = this.offX - e.clientX;
									let dy = this.offY - e.clientY;
									let dist = Math.sqrt( ( this.offX * this.offX ) + ( this.offY * this.offY ) );;
									if( dist > 20 )
									{
										let n = CreateIcon( this.fi );
										mousePointer.pickup( n );
										this.offX = false;
										this.offY = false;
										window.mouseDown = null;
									}
									return cancelBubble( e );
								}
							}
						}
						dd.appendChild( s );
						ss.push( s );
					}

					if( dparent.classList.contains( 'DockMenu' ) )
					{
						let s2 = document.createElement( 'div' );
						s2.className = 'DockMenuItem MousePointer Executable';
						s2.innerHTML = '<span><img ondragstart="return cancelBubble( event )" src="/iconthemes/friendup15/Run.svg"/></span><span>' + i18n( 'menu_run_command' ) + '</span>';
						s2.onclick = function()
						{
							Workspace.toggleStartMenu( false );
							Workspace.showLauncher();
						}
						dd.appendChild( s2 );
						s2 = null;
					}

					function repositionStartMenu()
					{
						if( delayedBuildTime )
						{
							clearTimeout( delayedBuildTime );
							delayedBuildTime = null;
						}
						delayedBuildTime = setTimeout( function(){ delayedBuildFunc(); }, 25 );

						if( dparent.classList.contains( 'DockMenu' ) )
						{
							if( topInfo == 'Right' || topInfo == 'Left' )
							{
								dparent.style.top = 0;
								if( topInfo == 'Right' )
								{
									dparent.style.left = 0 - dd.offsetWidth + 'px';
								}
								else
								{
									dparent.style.left = dparent.parentNode.offsetWidth + 'px';
								}
							}
							else if( topInfo == 'Top' )
							{
								parent.style.top = parent.parentNode.offsetHeight + 'px';
							}
							else if( depth > 1 )
							{
								dd.style.bottom = '0px';
								dd.style.top = 'auto';
							}
							else
							{
								dparent.style.top = 0 - dd.offsetHeight + 'px';
							}
							dparent.style.height = dd.offsetHeight + 'px';
						}
						else if( ss )
						{
							for( let a = 0; a < ss.length; a++ )
							{
								let s = ss[ a ];
								
								if( topInfo == 'Right' || topInfo == 'Left' )
								{
									dd.style.top = '0';
									if( topInfo == 'Right' )
									{
										dd.style.left = 0 - s.offsetWidth + 'px';
									}
									else
									{
										dd.style.left = s.offsetWidth + 'px';
									}
								}
								else if( topInfo == 'Top' )
								{
									dd.style.top = s.style.top;
								}
								else if( depth > 1 )
								{
									dd.style.bottom = '0px';
									dd.style.top = 'auto';
								}
								else
								{
									dd.style.top = ( s.offsetHeight - dd.offsetHeight - 1 ) + 'px';
								}
							}
						}
					}
					repositionStartMenu();
				} );
			}

			// Delayed showing until we built the menu
			delayedBuildFunc = function()
			{
				setTimeout( function()
				{
					d.className = 'DockMenu Visible';
				}, 250 );
			}
			
			// Let's go!
			buildMenu( 'System:', d );
		}
	},
	// Reload docks and readd launchers
	reloadDocks: function()
	{
		if( !Workspace.mainDock ) return;
		if( Workspace.mode == 'vr' ) return;
		Workspace.docksReloading = true;
		
		let c = new Module( 'dock' );
		c.onExecuted = function( cod, dat )
		{
			if( cod == 'ok' && dat )
			{
				let dm = new Module( 'dock' );
				dm.onExecuted = function( c, conf )
				{
					try
					{
						Workspace.mainDock.readConfig( JSON.parse( conf ) );
					}
					catch( e )
					{
					}
					
					let elements = JSON.parse( dat );
					Workspace.cachedDockElements = elements;
					Workspace.refreshDocks();
					
					Workspace.mainDock.initialized();
					
					Workspace.docksReloading = null;
					
					ConstrainWindows();
					
					// Open the main dock first
					if( !Workspace.insideInitialized )
					{
						if( !Workspace.isSingleTask )
							Workspace.mainDock.openDesklet();
						Workspace.insideInitialized = true;
						forceScreenMaxHeight();
					}
					
					// Make sure to redraw icons fully
					setTimeout( function()
					{
						Workspace.redrawIcons( 1 );
					}, 100 );
				}
				dm.execute( 'getdock', { dockid: '0' } );
			}
			else
			{
				Workspace.docksReloading = null;
			}
		}
		c.execute( 'items', { sessionid: false } );
	},
	refreshDocks: function()
	{
		let elements = Workspace.cachedDockElements;
		
		Workspace.mainDock.clear();
		
		function getOnClickFn( appName )
		{
			return function()
			{
				ExecuteApplication( appName );
			}
		}

		function genFunc( fod )
		{
			return function()
			{
				Workspace.launchNativeApp( fod );
			}
		}

		// Clear tasks
		ge( 'Taskbar' ).innerHTML = '';
		ge( 'Taskbar' ).tasks = [];

		// Add start menu
		if( !isMobile && globalConfig.viewList == 'dockedlist' )
		{
			let img = 'startmenu.png';
			if( Workspace.mainDock.conf )
			{
				if( Workspace.mainDock.conf.size == '32' )
				{
					img = 'startmenu_32.png';
				}
				else if( Workspace.mainDock.conf.size == '16' )
				{
					img = 'startmenu_16.png';
				}
			}
			let ob = {
				type: 'startmenu',
				src: '/webclient/gfx/system/' + img,
				title: 'Start',
				className: 'Startmenu',
				click: function( e ){ Workspace.toggleStartMenu(); },
				noContextMenu: true
			}
			Workspace.mainDock.addLauncher( ob );
		}
		
		if( !elements || !elements.length ) return;
		for( let a = 0; a < elements.length; a++ )
		{
			let ele = elements[a];
			let icon = 'apps/' + ele.Name + '/icon.png';
			if( ele.Name.indexOf( ':' ) > 0 )
			{
				ext = ele.Name.split( ':' )[1];
				if( ext.indexOf( '/' ) > 0 )
				{
					ext = ext.split( '/' )[1];
				}
				ext = ext.split( '.' )[1];
				icon = '.' + ( ext ? ext : 'txt' );
			}
			
			if( ele.Icon )
			{
				ele.Icon = ele.Icon.split( /sessionid\=[^&]+/i ).join( 'sessionid=' + Workspace.sessionId );
				if( ele.Icon.indexOf( ':' ) > 0 )
					icon = getImageUrl( ele.Icon );
				else icon = ele.Icon;
			}
			
			let ob = {
				exe         : ele.Name,
				type        : ele.Type,
				src         : icon,
				workspace   : ele.Workspace - 1,
				opensilent  : ele.OpenSilent,
				displayname : ele.DisplayName,
				'title'     : ele.Title ? ele.Title : ele.Name
			};
			
			// For Linux apps..
			if( ele.Name.substr( 0, 7 ) == 'native:' )
			{
				let tmp = ob.exe.split( 'native:' )[1];
				ob.click = genFunc( tmp );
			}

			Workspace.mainDock.addLauncher( ob );
		}
		
		// Add desktop shortcuts too for mobile
		if( window.isMobile )
		{
			for( let a = 0; a < Workspace.icons.length; a++ )
			{
				if( Workspace.icons[a].Type == 'Executable' && Workspace.icons[a].MetaType == 'ExecutableShortcut' )
				{
					let el = Workspace.icons[a];
					let ob = {
						exe:  el.Filename,
						type: 'Executable',
						src:  el.IconFile,
						displayname: el.Title,
						title: el.Title
					};
					Workspace.mainDock.addLauncher( ob );
				}
			}
		}
		// File browser
		let fmenu = {
			click: function( e )
			{
				let u = CryptoJS.SHA1( ( new Date() ).getTime() + ( Math.random() * 999 ) + ( Math.random() * 999 ) + "" ).toString();
				if( isMobile )
				{
					OpenWindowByFileinfo( { Title: 'Mountlist', Path: 'Mountlist:', Type: 'Directory', MetaType: 'Directory' }, false, false, u );
				}
				else
				{
					OpenWindowByFileinfo( 
						{ Title: 'Home', Path: 'Home:', Type: 'Directory', MetaType: 'Directory' },
						false, false, u
					);
				}
				if( !Workspace.isSingleTask )
					Workspace.mainDock.closeDesklet();
			},
			type: 'Executable',
			displayname: i18n( 'i18n_files' ),
			src: isMobile ? '/iconthemes/friendup15/Folder_Smaller.svg' : '/iconthemes/friendup15/Folder.svg',
			title: i18n( 'i18n_files' ),
		};
		Workspace.mainDock.addLauncher( fmenu );
		
		// Make sure taskbar is polled
		if( !isMobile )
		{
			PollTaskbar();
		
			// Reload start menu
			// TODO: Remove the need for this hack
			Workspace.pollStartMenu( true );
		}
		
		// Make sure the tray position is there
		PollTrayPosition();
	},
	connectFilesystem: function( execute )
	{
		if( execute )
		{
			let info = {
				Name: ge( 'ConnectionGuiIntro' ).getElementsByTagName( 'input' )[0].value,
				Type: ge( 'ConnectionGuiIntro' ).getElementsByTagName( 'select' )[0].value
			};

			if( !info.Name || !info.Type )
			{
				ge( 'ConnectionGuiIntro' ).getElementsByTagName( 'input' )[0].focus();
				return false;
			}

			let inps = ge( 'ConnectionBoxGui' ).getElementsByTagName( '*' );
			for( let a = 0; a < inps.length; a++ )
			{
				// TODO: Support more input TYPES
				if( inps[a].nodeName == 'INPUT' )
				{
					info[inps[a].name] = inps[a].value;
				}
				else if( inps[a].nodeName == 'SELECT' )
				{
					info[inps[a].name] = inps[a].value;
				}
			}
			info.Mounted = '1';
			let m = new Module( 'system' );
			m.onExecuted = function()
			{
				Workspace.refreshDesktop();
			}
			m.execute( 'addfilesystem', info );

			Workspace.cfsview.close();
			return;
		}
		if( this.cfsview )
		{
			return false;
		}
		let v = new View( {
			title: i18n( 'i18n_connect_network_drive' ),
			width: 360,
			height: 400,
			id: 'connect_network_drive'
		} );
		v.onClose = function(){ Workspace.cfsview = false; }
		this.cfsview = v;
		let f = new File( 'System:templates/connect_netdrive.html' );
		f.onLoad = function( data )
		{
			v.setContent( data );
			Workspace.setFilesystemGUI( 'Shared' );
		}
		f.load();
	},
	setFilesystemGUI: function( type )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				ge( 'ConnectionBoxGui' ).innerHTML = d;
			}
			else
			{
				ge( 'ConnectionBoxGui' ).innerHTML = '<p class="Layout">You can not a drive of this type.</p>';
			}
		}
		m.execute( 'getfilesystemgui', { type: type } );
	},
	getBookmarks: function()
	{
		let bm = [
			{
				name: 'Friendos.com',
				command: function()
				{
					let w = window.open( 'http://friendos.com', '', '' );
				}
			},
			{
				divider: true
			},
			{
				name: i18n( 'menu_add_bookmark' ),
				command: function()
				{
					Workspace.addBookmark();
				}
			}
		];
		return bm;
	},
	// Reload system mimetypes
	reloadMimeTypes: function()
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				let s = JSON.parse( d );
				Workspace.mimeTypes = s.Mimetypes;
			}
		}
		m.execute( 'usersettings' );
	},
	// Refresh an open window by path
	// TODO: Make less aggressive! Use settimeouts f.ex. so we can abort multiple
	//       calls to refrash the same path
	refreshPaths: {},
	refreshWindowByPath: function( path, depth, callback )
	{
		let self = this;
		if( !depth ) depth = 0;
		
		// Don't allow many parents
		if( depth && depth > 1 ) return;

		// Remove file from filename (if any)
		// Paths end with /
		let fname = path + '';
		if( fname.substr( fname.length - 1, 1 ) != '/' )
		{
			let o = ''; var mod = 0;
			for( let b = fname.length - 1; b >= 0; b-- )
			{
				if( mod == 0 && ( fname.substr( b, 1 ) == '/' || fname.substr( b, 1 ) == ':' ) )
				{
					o = fname.substr( b, 1 ) + o;
					mod = 1;
				}
				else if( mod == 1 )
				{
					o = fname.substr( b, 1 ) + o;
				}
			}
			path = o;
		}

		// Delayed refreshing
		function executeRefresh( w, callback )
		{
			// Make sure that the view is unique
			let ppath = path + ':' + w.viewId;
			
			let timeout = 250;
			
			// Race condition, cancel existing..
			if( self.refreshPaths[ ppath ] )
			{
				timeout = 500;
				clearTimeout( self.refreshPaths[ ppath ].timeout );
				if( self.refreshPaths[ ppath ].finalTimeout )
					clearTimeout( self.refreshPaths[ ppath ].finalTimeout );
				self.refreshPaths[ ppath ].finalTimeout = null;;
			}
			
			// No time control yet? Set it up.
			if( !self.refreshPaths[ ppath ] )
			{
				self.refreshPaths[ ppath ] = {
					finalTimeout: null,
					timeout: null
				};
			}
			
			// Set up timed refresh on delay
			self.refreshPaths[ ppath ].timeout = setTimeout( function()
			{
				// Setup a new callback for running after the refresh
				let cbk = function()
				{
					if( !self.refreshPaths[ ppath ] )
					{
						if( w.directoryview )
							w.directoryview.toChange = true;
						//else console.log( 'What is this?', w );
						w.refresh();
					}
					else
					{
						// One extra refresh for safe keeping
						self.finalTimeout = setTimeout( function()
						{
							if( typeof( w.refresh ) != 'undefined' )
							{
								if( w.directoryview )
									w.directoryview.toChange = true;
								//else console.log( 'AAAAAAAARGH!', w );
								w.refresh();
								// Remove this one - now we are ready for the next call
							}
							delete self.refreshPaths[ ppath ];
						}, 350 );
					}
					
					// Run the actual callback
					if( callback ) callback();
				};
				// Do the actual refresh
				if( w.directoryview )
					w.directoryview.toChange = true;
				//else console.log( 'Hippopotomous: ', w );
				w.refresh( cbk );
			}, timeout );
		}

		// Check movable windows
		for( let a in movableWindows )
		{
			let mw = movableWindows[a];

			if( !mw.content ) continue;
			if( mw.content.fileInfo )
			{
				if( mw.content.fileInfo.Path.toLowerCase() == path.toLowerCase() && typeof mw.content.refresh == 'function' )
				{
					//console.log( 'Executing refresh!' );
					executeRefresh( mw.content, callback );
				}
			}
			// Dialogs
			else if( mw.windowObject && mw.windowObject.refreshView )
			{
				//console.log( 'This is a dialog?' );
				mw.windowObject.refreshView();
			}
		}

		// Also refresh parent if possible
		// We need this in case we copy to a sub path
		let p = path + '';
		let o = ''; var mod = 0;
		for( let b = p.length - 2; b >= 0; b-- )
		{
			if( mod == 0 && ( p.substr( b, 1 ) == '/' || p.substr( b, 1 ) == ':' ) )
			{
				o = p.substr( b, 1 ) + o;
				mod = 1;
			}
			else if( mod == 1 )
			{
				o = p.substr( b, 1 ) + o;
			}
		}
		if( o != path && o.length )
		{
			//console.log( 'What? -> ' + o );
			Workspace.refreshWindowByPath( o, depth + 1, callback );
		}
	},
	closeWindowByPath: function( path )
	{
		let fname = path + '';
		if( fname.substr( fname.length - 1, 1 ) != '/' )
		{
			//if we did not get a path to a directory we just refresh.... ;)
			Workspace.refreshWindowByPath( path, 0 );
			return;
		}

		// Also refresh parent first...
		let p = path + '';
		let o = ''; var mod = 0;
		for( let b = p.length - 2; b >= 0; b-- )
		{
			if( mod == 0 && ( p.substr( b, 1 ) == '/' || p.substr( b, 1 ) == ':' ) )
			{
				o = p.substr( b, 1 ) + o;
				mod = 1;
			}
			else if( mod == 1 )
			{
				o = p.substr( b, 1 ) + o;
			}
		}
		if( o != path && o.length )
		{
			Workspace.refreshWindowByPath( o, 1 );
		}

		for( let a in movableWindows )
		{
			if( !movableWindows[a] || !movableWindows[a].content ) continue;
			if( movableWindows[a].content.fileInfo )
			{
				if( movableWindows[a].content.fileInfo.Path.toLowerCase() == path.toLowerCase() )
				{
					CloseView( movableWindows[a] );
				}
			}
		}
	},
	// Disk notification!
	diskNotification: function( windowList, type )
	{
		console.log( 'Disk notification!', windowList, type );
	},
	refreshTheme: function( themeName, update, themeConfig )
	{
		let self = this;
		
		// Only on force or first time
		if( this.themeRefreshed && !update )
		{
			return;
		}

		// Check url var
		if( GetUrlVar( 'fullscreenapp' ) )
		{
			document.body.classList.add( 'FullscreenApp' );
		}

		if( Workspace.themeOverride ) themeName = Workspace.themeOverride.toLowerCase();

		document.body.classList.add( 'Loading' );

		if( !themeName ) themeName = 'friendup12';
		if( themeName == 'friendup' ) themeName = 'friendup12';
		
		themeName = themeName.toLowerCase();
		
		Workspace.theme = themeName;
		
		let m = new File( 'System:../themes/' + themeName + '/settings.json' );
		m.onLoad = function( rdat )
		{
			// Add resources for theme settings --------------------------------
			rdat = JSON.parse( rdat );
			// Done resources theme settings -----------------------------------
			
			Workspace.themeRefreshed = true;
			Workspace.refreshUserSettings( function() 
			{
				CheckScreenTitle();

				let h = document.getElementsByTagName( 'head' );
				if( h )
				{
					h = h[0];

					// Remove old one
					let l = h.getElementsByTagName( 'link' );
					for( let b = 0; b < l.length; b++ )
					{
						if( l[b].parentNode != h ) continue;
						l[b].href = '';
						l[b].parentNode.removeChild( l[b] );
					}
					// Remove scrollbars
					l = document.body.getElementsByTagName( 'link' );
					for( let b = 0; b < l.length; b++ )
					{
						if( l[b].href.indexOf( '/scrollbars.css' ) > 0 )
						{
							l[b].href = '';
							l[b].parentNode.removeChild( l[b] );
						}
					}

					// New css!
					let styles = document.createElement( 'link' );
					styles.rel = 'stylesheet';
					styles.type = 'text/css';
					styles.onload = function()
					{
						// We are inside (wait for wallpaper) - watchdog
						if( !Workspace.insideInterval )
						{
							let retries = 0;
							Workspace.insideInterval = setInterval( function()
							{
								// If we're in VR, just immediately go in, or when wallpaper loaded or when we waited 5 secs
								if( Workspace.mode == 'vr' || Workspace.wallpaperLoaded || retries++ > 100 )
								{
									clearInterval( Workspace.insideInterval );
									Workspace.insideInterval = null;
								
									// Set right classes
									document.body.classList.add( 'Inside' );
									document.body.classList.add( 'Loaded' );
									document.body.classList.remove( 'Login' );
									document.body.classList.remove( 'Loading' );
									
									document.title = Friend.windowBaseString;
									
									// Remove the overlay when inside
									if( Workspace.screen )
										Workspace.screen.hideOverlay();
								
									// Refresh widgets
									Workspace.refreshExtraWidgetContents();
								
									// Redraw now
									if( !isMobile )
										DeepestField.redraw();
									
									if( location.hash && location.hash.indexOf( 'clean' ) ) Workspace.goDialogShown = true;
									
									// Show about dialog
									if( !isMobile && window.go && !Workspace.goDialogShown )
									{
										AboutGoServer();
										Workspace.goDialogShown = true;
									}
									
									// Make sure we update icons...
									Workspace.redrawIcons( 1 );
									
									// Update locale for download applet
									if( ge( 'Tray' ) && ge( 'Tray' ).downloadApplet )
									{
										ge( 'Tray' ).downloadApplet.innerHTML = '<div class="BubbleInfo"><div>' + i18n( 'i18n_drag_files_to_download' ) + '.</div></div>';
									}
									// And the calendar applet
									if( ge( 'Tray' ) && ge( 'Tray' ).calendarApplet )
									{
										ge( 'Tray' ).calendarApplet.innerHTML = '<div class="BubbleInfo"><div>' + i18n( 'i18n_add_calendar_event' ) + '.</div></div>';
									}
									
									// New version of Friend?
									if( Workspace.loginUsername != 'go' )
									{
										if( !Workspace.friendVersion )
										{
											Workspace.upgradeWorkspaceSettings( function(){
												setTimeout( function()
												{
													let n = Notify( 
														{ 
															title: 'Your Workspace has been upgraded', 
															text: 'We have updated your settings to match the default profile of the latest update of Friend. This only happens on each major upgrade of the Friend Workspace.', 
															sticky: true
														}, 
														false, 
														function()
														{
															CloseNotification( n );
														} 
													);
												}, 1000 );
											} );
										}
									}
									
									// We are ready!
									Workspace.readyToRun = true;
									if( window.friendApp && friendApp.onWorkspaceReady )
									{
										friendApp.onWorkspaceReady();
									}
									else
									{
										Workspace.onReady();
									}
									Workspace.updateViewState( 'active' );
								}
							}, 50 );
						}
					
						// Flush theme info
						themeInfo.loaded = false;
					
						// Refresh them
						Workspace.initWorkspaces();
					
						// Redraw icons if they are delayed
						Workspace.redrawIcons();
					}

					if( themeName && themeName != 'default' )
					{
						AddCSSByUrl( '/themes/' + themeName + '/scrollbars.css' );
						styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"' + themeName + '"}' ) + '&sessionid=' + Workspace.sessionId;
					}
					else
					{
						AddCSSByUrl( '/themes/friendup12/scrollbars.css' );
						styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"friendup12"}' ) + '&sessionid=' + Workspace.sessionId;
					}

					// Add new one
					h.appendChild( styles );
					
					// Constrain all windows
					ConstrainWindows();
				}

				// Update running applications
				let taskIframes = ge( 'Tasks' ).getElementsByClassName( 'AppSandbox' );
				for( let a = 0; a < taskIframes.length; a++ )
				{
					let msg = {
						type: 'system',
						command: 'refreshtheme',
						theme: themeName
					};
					if( themeConfig )
						msg.themeData = themeConfig;
					taskIframes[a].ifr.contentWindow.postMessage( JSON.stringify( msg ), '*' );
				}
		
				// Flush theme info
				themeInfo.loaded = false;
			} );
		}
		m.load();
	},
	// Check for new desktop events too!
	checkDesktopEvents: function()
	{
		//we deactivate this for now... causing a lot of load on the server... and we dont use it yet
		return;

		if( typeof( this.icons ) != 'object' || !this.icons.length ) return;

		// TODO: Move to websocket event list
		let m = new Module( 'system' );
		m.onExecuted = function( r, data )
		{
			// Should only be run once!
			if( !data ) return;
			let events = JSON.parse( data );
			for( let a in events )
			{
				let jdata = events[a];
				if( a == 'Import' )
				{
					let w = new View( {
						title: 'File import',
						width: 640,
						height: 480,
						id: 'fileimport'
					} );
					Workspace.importWindow = w;
					let f = new File( 'System:templates/file_import.html' );
					f.onLoad = function( data )
					{
						if( !Workspace.importWindow ) return;

						let doorOptions = '';
						for( let ad = 0; ad < Workspace.icons.length; ad++ )
						{
							doorOptions += '<option value="' + Workspace.icons[ad].Door.Volume + '">' + Workspace.icons[ad].Door.Volume + '</option>';
						}

						if( !w || !w.setContent )
							return false;

						w.setContent( data.split( '{partitions}' ).join( doorOptions ) );
						let ml = '';
						for( let p = 0; p < jdata.length; p++ )
						{
							ml += '<div class="Padding MarginBottom Box"><div class="IconSmall fa-file"><div class="FloatRight"><input type="checkbox" file="' + jdata[p] + '"/></div>&nbsp;&nbsp;' + jdata[p] + '</div></div>';
						}
						ge( 'import_files' ).innerHTML = ml;
					}
					f.load();
				}
			}
		}
		m.execute( 'events' );
	},
	// Execute import of files
	executeFileImport: function()
	{
		let sels = ge('import_partitions').getElementsByTagName( 'option' );
		let inps = ge('import_files').getElementsByTagName( 'input' );
		let target = false;
		let files = [];
		for( let a = 0; a < sels.length; a++ )
		{
			if( sels[a].selected )
			{
				target = sels[a].value;
				break;
			}
		}
		for( let a  = 0; a < inps.length; a++ )
		{
			if( inps[a].checked )
			{
				files.push( inps[a].getAttribute( 'file' ) );
			}
		}
		if( target && files.length )
		{
			let m = new Module( 'files' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					if( Workspace.importWindow )
					{
						Workspace.importWindow.close();
						delete Workspace.importWindow;
					}
				}
				else
				{
					Ac2Alert( 'Something went wrong: ' + d );
				}
			}
			m.execute( 'import', { files: files, path: target } );
		}
		else
		{
			Ac2Alert( 'Please select files and a valid target door.' );
		}
	},
	// Remove element from dock
	removeFromDock: function( titl )
	{
		let m = new Module( 'dock' );
		m.onExecuted = function( e, d )
		{
			Workspace.reloadDocks();
		}
		m.execute( 'removefromdock', { name: titl } );
	},
	// Some "native" functions -------------------------------------------------
	// Get a list of the applications that are managed by Friend Core
	getNativeAppList: function( callback )
	{
		if( Workspace.interfaceMode != 'native' ) return false;
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( callback && typeof( callback ) == 'function' )
			{
				callback( e == 'ok' ? d : false );
			}
		}
		m.execute( 'list_apps' );
	},
	// Kill a running native app
	killNativeApp: function( appName, callback )
	{
		if( Workspace.interfaceMode != 'native' ) return false;
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( callback && typeof( callback ) == 'function' )
			{
				callback( e == 'ok' ? d : false );
			}
		}
		m.execute( 'kill_app', { appname: appName } );
	},
	pollNativeApp: function()
	{
		this.getNativeWindowList( false, function( data )
		{
			// Clean when no apps
			let clear = false;
			if( data == false )
				clear = true;

			// Remove apps that are gone
			let out = [];
			for( let a = 0; a < Workspace.applications.length; a++ )
			{
				// Skip normal apps
				if( !Workspace.applications[a].pid ) continue;

				let f = false;
				for( let b = 0; b < data.length; b++ )
				{
					if( data[b].pid && data[b].pid == Workspace.applications[a].pid )
					{
						f = true;
					}
				}
				// Keep apps
				if( f )
				{
					out.push( Workspace.applications[a] );
				}
			}
			Workspace.applications = out;

			// Clear all non normal apps (only natives with pid)
			if( clear )
			{
				out = [];
				for( let a = 0; a < Workspace.applications.length; a++ )
				{
					if( !Workspace.applications[a].pid )
						out.push( Workspace.applications[a] );
				}
				Workspace.applications = out;
				clearInterval( Workspace.nativeAppPolling );
				Workspace.nativeAppPolling = false;
			}
		} );
	},
	// Just refresh the desktop ------------------------------------------------
	refreshDesktop: function( callback, forceRefresh )
	{
		// Need to wait
		if( !this.userSettingsLoaded ) return;
		this.desktopFirstRefresh = true;
		
		let self = this;
		
		// Get those dynamic classes
		RefreshDynamicClasses( {} );
		
		// Check some images we need to preload and preload them
		if( !window.preloader )
			window.preloader = [];
		let imgOffline = GetThemeInfo( 'OfflineIcon' );
		if( !Workspace.iconsPreloaded && this.mode != 'vr' )
		{
			let imgs = [];
			imgs.push( imgOffline.backgroundImage );
			function preloadAndRemove( n )
			{
				if( !n ) return;
			
				let t = false;
				let i = new Image();
				i.src = n;
				let out = [];
				for( let a = 0; a < window.preloader.length; a++ )
				{
					if( window.preloader[a].src == i.src )
					{
						document.body.removeChild( window.preloader[a] );
					}
					else out.push( window.preloader[a] );
				}
				window.preloader = out;
				document.body.appendChild( i );
				window.preloader.push( i );
			}
			for( let a = 0; a < imgs.length; a++ )
			{
				if( imgs[a] && imgs[a].length )
				{
					if( imgs[a].indexOf( 'url(' ) == 0 )
					{
						imgs[a] = imgs[a].split( 'url(' )[1].split( ')' );
						imgs[a].pop(); imgs[a] = imgs[a].join( ')' );
					}
					imgs[a] = imgs[a].split( '"' ).join( '' );
				}
				preloadAndRemove( imgs[a] );
			}
			Workspace.iconsPreloaded = true;
		}
		
		// Oh yeah, update windows
		for( let a in movableWindows )
		{
			if( movableWindows[a].content.redrawBackdrop )
			{
				movableWindows[a].content.redrawBackdrop();
			}
			// Move windows!
			if( movableWindows[ a ].windowObject.workspace > ( globalConfig.workspacecount - 1 ) )
			{
				movableWindows[a].windowObject.sendToWorkspace( globalConfig.workspacecount - 1 );
			}
		}
		
		this.getMountlist( function( data )
		{	
			// Something went wrong - don't show an empty workspace
			// We always have one entry, the system disk
			if( data.length <= 1 )
			{
				return;
			}
			
			if( callback && typeof( callback ) == 'function' ) callback( data );

			// make drive list behave like a desklet... copy paste som code back and forth ;)
			if( !window.setupDriveClicks )
			{
				window.setupDriveClicks = function( delayed )
				{
					if( !window.driveClicksSetup )
					{
						// TODO: Remove this and implement a real fix for this race condition!
						// without having a delay, it finds the eles nodes, but not a .length and no data on the array members...
						if( !delayed ) return setTimeout( "setupDriveClicks(1)", 50 );

						// Drive clicks for mobile
						let ue = navigator.userAgent.toLowerCase();
						if( !window.isMobile )
							return;

						window.driveClicksSetup = true;
					}
				}
			}

			// We haven't started with wallpaper yet. Just pass
			if( typeof( self.wallpaperImage ) == 'undefined' )
			{
				return;
			}
			// Recall wallpaper
			else if( Workspace.mode != 'vr' && self.wallpaperImage != 'color' )
			{
			    if( typeof( self.wallpaperImage ) == undefined )
			    {
			        return setTimeout( function(){ Workspace.refreshDesktop( callback, forceRefresh ) }, 25 );
			    }
				let eles = self.screen.div.getElementsByClassName( 'ScreenContent' );
				if( eles.length )
				{
					let ext = false;
					let found = false;
					if( self.wallpaperImage )
					{
						// Check if we have a loadable image!
						let p = self.wallpaperImage.split( ':' )[0];
						for( let a = 0; a < self.icons.length; a++ )
						{
							if( self.icons[a].Title == p )
							{
								found = true;
							}
						}
					
						// Load image
						if( self.wallpaperImage.indexOf( '.' ) > 0 )
						{
							ext = self.wallpaperImage.split( '.' );
							ext = ( ( ext[ ext.length - 1 ] ) + "" ).toLowerCase();
						}
					}

					// Remove prev
					let v = eles[0].parentNode.getElementsByTagName( 'video' );
					for( let z = 0; z < v.length; z++ ) 
					{
						v[ z ].parentNode.removeChild( v[ z ] );
					}
					
					// Check extension
					switch( ext )
					{
						// Movie wallpaper!
						case 'mp4':
						case 'avi':
						case 'ogg':
						case 'webm':
							// Add new video
							function setTheThing( o )
							{
								o.loop = false;
								o.preload = true;
								o.className = 'VideoBackground';
								o.src = getImageUrl( self.wallpaperImage );
							}
							let m = document.createElement( 'video' ); setTheThing( m );
							let c = document.createElement( 'video' ); setTheThing( c );
							m.autoplay = true;
							c.autoplay = false;
							c.style.visibility = 'hidden';
							m.addEventListener( 'ended', function()
							{
								c.style.visibility = 'visible';
								c.play();
								m.style.visibility = 'hidden';
								m.src = c.src;
							}, false );
							c.addEventListener( 'ended', function()
							{
								m.style.visibility = 'visible';
								m.play();
								c.style.visibility = 'hidden';
								c.src = m.src;
							}, false );
							eles[0].style.backgroundImage = '';
							eles[0].parentNode.appendChild( m );
							eles[0].parentNode.appendChild( c );
							Workspace.wallpaperLoaded = true;
							break;
						default:
							Workspace.wallpaperLoaded = false;
							let src = found ? getImageUrl( self.wallpaperImage ) : '/webclient/gfx/theme/default_login_screen.jpg';
							let workspaceBackgroundImage = new Image();
							workspaceBackgroundImage.onload = function()
							{
								// Let's not fill up memory with new wallpaper images
								if( Workspace.prevWallpaper )
								{
									let o = [];
									for( let c = 0; c < Workspace.imgPreload.length; c++ )
									{
										if( Workspace.imgPreload[c].src != Workspace.prevWallpaper )
											o.push( Workspace.imgPreload[c] );
									}								
									Workspace.imgPreload = o;
								}
								Workspace.imgPreload.push( this );
								Workspace.prevWallpaper = this.src;
								
								// Set the background size on wallpaper element
								eles[0].style.backgroundSize = 'cover';
								
								setupDriveClicks();
								this.done = true;
								
								Workspace.wallpaperImageObject = workspaceBackgroundImage;
								Workspace.wallpaperLoaded = src;
								
								// Mobile is not using multiple workspaces
								if( !isMobile && globalConfig.workspacecount > 1 )
								{
									// Check series of wallpaper elements
									Workspace.checkWorkspaceWallpapers( true );
								}
								else
								{
									// Set the wallpaper
									eles[0].style.backgroundImage = 'url(' + this.src + ')';
								}
							};
							
							workspaceBackgroundImage.src = src;
							
							if( workspaceBackgroundImage.width > 0 && workspaceBackgroundImage.height > 0 && workspaceBackgroundImage.onload )
							{
								workspaceBackgroundImage.onload();
							}
							
							Workspace.wallpaperImageObject = workspaceBackgroundImage;
							
							// If this borks up in 5 seconds, bail!
							setTimeout( function()
							{
								if( 
									typeof( Workspace.wallpaperImageObject ) != 'undefined' && 
									!Workspace.wallpaperImageObject.done && 
									typeof Workspace.wallpaperImageObject.onload == 'function' 
								)
								{
									Workspace.wallpaperImageObject.onload();
								}
								else
								{
									setupDriveClicks();
									Workspace.wallpaperImageObject.done = true;
									Workspace.wallpaperLoaded = true;
								}
							}, 5000 );
							break;
					}
				}
			}
			// We have no wallpaper...
			else if( Workspace.mode == 'standard' || Workspace.mode == 'default' )
			{
				let eles = self.screen.div.getElementsByClassName( 'ScreenContent' );
				if( eles.length )
				{
					eles[0].style.backgroundImage = '';
					setupDriveClicks();
				}
				Workspace.wallpaperLoaded = true;
				Workspace.checkWorkspaceWallpapers();
			}
			else if( Workspace.mode == 'vr' )
			{
				Workspace.wallpaperLoaded = true;
			}
			else
			{
				//console.log( 'Wallpaper: What happened and which mode? ' + Workspace.mode );
			}

		}, forceRefresh );
	},
	// Get a door by path
	getDoorByPath: function( path )
	{
		if( !path ) return false;
		if( d = ( new Door() ).get( path ) )
			return d;
		return false;
	},
	refreshDormantDisks: function( callback )
	{
		let found = false;

		// Check dormant
		if( DormantMaster )
		{
			let disks = DormantMaster.getDoors();
			let found = [];
			for( let a in disks )
			{
				if( disks[ a ].Filename != 'System:' ) found.push( disks[ a ] );
			}
			if( found.length <= 0 ) found = false;
		}
		let dom = false;

		let tray = ge( 'Tray' );
		
		// Insert applet if not there
		if( tray )
		{
			let eles = tray.getElementsByTagName( 'div' );
			for( let a = 0; a < eles.length; a++ )
			{
				if( eles[a].classList && eles[a].classList.contains( 'Disks' ) )
				{
					dom = eles[a];
					break;
				}
			}
		}

		if( ( !found || ( found && !found.length ) ) && dom )
		{
			dom.parentNode.removeChild( dom );
			return;
		}
		// DOM elements
		else if( !dom && found && tray )
		{
			dom = document.createElement( 'div' );
			dom.className = 'Disks TrayElement IconSmall';
			dom.bubble = document.createElement( 'div' );
			dom.bubble.className = 'BubbleInfo List';
			dom.appendChild( dom.bubble );
			tray.appendChild( dom );
		}
		else if( dom )
		{
			dom.bubble = dom.getElementsByTagName( 'div' )[0];
		}
		else
		{
			return;
		}

		// List
		let d = document.createElement( 'div' );
		let str = ''; var sw = 2;
		for( let a = 0; a < found.length; a++ )
		{
			if( found[a].Filename == 'System:' ) continue;
			sw = sw == 1 ? 2 : 1;
			let dd = document.createElement( 'div' );
			dd.className = 'sw' + sw;
			dd.innerHTML = found[a].Title;
			dd.f = found[a];
			dd.onclick = function( e )
			{
				OpenWindowByFileinfo( this.f );
				return cancelBubble( e );
			}
			d.appendChild( dd );
		}

		dom.bubble.innerHTML = '';
		dom.bubble.appendChild( d );
	},
	// Fetch mountlist from database
	getMountlist: function( callback, forceRefresh, addDormant )
	{
		let t = this; // Reference to workspace
		
		// Just in case
		if( window.friendApp )
			window.friendApp.reveal();
		
		if( !Friend.dosDrivers )
		{
			let d = new Module( 'system' );
			d.onExecuted = function( res, dat )
			{
				if( res != 'ok' )
				{
					doGetMountlistHere();
					return;
				}
				let types = null;
				try
				{
					let types = JSON.parse( dat );
					Friend.dosDrivers = {};
					for( let a = 0; a < types.length; a++ )
					{
						Friend.dosDrivers[ types[ a ].type ] = types[a];
					}
				}
				catch( e )
				{
					Friend.dosDrivers = null;
				}
				doGetMountlistHere();
			}
			d.execute( 'types', { mode: 'all' } );
		}
		else
		{
			doGetMountlistHere();
		}
		
		// Get the mountlist
		function doGetMountlistHere()
		{
			let mo = new Module( 'system' );
			mo.onExecuted = function( returnCode, shortcuts )
			{
				let vi = new Module( 'system' );
				vi.onExecuted = function( rco, visList )
				{
					let visStruct = null;
					if( rco == 'ok' )
					{
						try
						{
							let tmp = JSON.parse( visList );
							visStruct = {};
							for( let z = 0; z < tmp.length; z++ )
								visStruct[ tmp[ z ].Filesystem ] = tmp[ z ];
						}
						catch( e )
						{
							//console.log( 'Bad json in vislist..' );
						}
					}
					else
					{
						//console.log( 'No vislist..' );
					}
					let m = new Library( 'system.library' )
					m.onExecuted = function( e, dat )
					{
						// New icons to list
						let newIcons = [];
					
						// Add system on top (after Ram: if it exists)
						newIcons.push( {
							Title:	   'System',
							Volume:    'System:',
							Path:	   'System:',
							Type:	   'Door',
							Handler:   'built-in',
							Driver:    'Dormant',
							MetaType:  'Directory',
							IconClass: 'SystemDisk',
							ID:	       'system', // TODO: fix
							Mounted:   true,
							Visible:   globalConfig.hiddenSystem == true ? false : true,
							Door:	   Friend.DoorSystem
						} );
				
						// Did we get a new list of disks from the server?
						if( returnCode == 'ok' )
						{
							// Check shortcuts and add them to the desktop
							let shorts = JSON.parse( shortcuts );
							for( let a = 0; a < shorts.length; a++ )
							{
								if( !shorts[ a ] )
								{
									continue;
								}
							
								if( shorts[ a ].substr( 0, 16 ) == 'DesktopShortcut:' )
								{
									let path = shorts[ a ].substr( 16, shorts[ a ].length - 16 );
									let ind = path.indexOf( ':' );
									let num = StrPad( path.substr( 0, ind ), 10, '0' );
									path = path.substr( ind + 1, path.length - ( ind + 1 ) );
								

									// Link to a repository?
									let iconFile = '';
									if( path.substr( -11, 11 ) == ':repository' )
									{
										path = path.substr( 0, path.length - 11 );
										iconFile = '/system.library/module/?module=system&command=repoappimage&i=' + GetFilename( path ) + '&sessionid=' + Workspace.sessionId;
									}
								
									let fn = GetFilename( path );
								
									newIcons.push( {
										Title: fn,
										Filename: path,
										Path: path,
										IconFile: iconFile,
										Type: path.substr( path.length - 1, 1 ) == '/' ? 'Directory' : 'File',
										SortPriority: num,
										Handler: 'built-in',
										MetaType: 'Shortcut',
										Visible: true
									} );
								}
								else
								{
									let pair = shorts[a].split( ':' );
									// Shift camelcase
									let literal = '';
									for( let c = 0; c < pair[0].length; c++ )
									{
										if( c > 0 && pair[0].charAt(c).toUpperCase() == pair[0].charAt(c) )
										{
											literal += ' ';
										}
										literal += pair[0].charAt( c );
									}
						
									// Add custom icon
									newIcons.push( {
										Title: literal,
										Filename: pair[0],
										Type: 'Executable',
										IconFile: '/' + pair[1],
										Handler: 'built-in',
										Driver: 'Shortcut',
										MetaType: 'ExecutableShortcut',
										SortPriority: 0,
										ID: shorts[a].toLowerCase(),
										Mounted: true,
										Visible: true,
										IconClass: literal.split( ' ' ).join( '_' ),
										Door: 'executable'
									} );
								}
							}
						}

						// Add DormantDrives to the list (automount)
						let dormantDoors = DormantMaster.getDoors();
						for ( let d = 0; d < dormantDoors.length; d++ )
						{
							let dormantDoor = dormantDoors[ d ];
							if ( dormantDoor.AutoMount )
							{
								newIcons.push( 
								{
									Title: dormantDoor.Title,
									Volume: dormantDoor.Volume,
									Path: dormantDoor.Path,
									Type: dormantDoor.Type,
									Handler: dormantDoor.Handler,
									Driver: dormantDoor.Drive,
									MetaType: dormantDoor.MetaType,
									IconClass: 'SystemDisk',
									SortPriotity: 0,
									ID: 'local', // TODO: fix
									Mounted:  true,
									Visible: true,
									Door: dormantDoor,
									Dormant: dormantDoor.Dormant
								} );						
							}
						}

						// Redraw icons when tested for disk info
						function testDrive( o, d )
						{
							if( !d ) return;
						
							// Check disk info
							if( d.dosAction )
							{
								d.dosAction( 'info', { path: o.Volume + 'disk.info' }, function( io )
								{
									let res = io.split( '<!--separate-->' );
									if( res[0] == 'ok' )
									{
										let response = false;
										try
										{
											response = JSON.parse( res[1] );
										}
										catch( k ){};
										if( !response || ( response && response.response == 'File or directory do not exist' ) ) return;
								
										let fl = new File( o.Volume + 'disk.info' );
										fl.onLoad = function( data )
										{
											if( data.indexOf( '{' ) >= 0 )
											{
												try
												{
													let dt = JSON.parse( data );
													if( dt && dt.DiskIcon )
													{
														o.IconFile = getImageUrl( o.Volume + dt.DiskIcon );
														t.redrawIcons();
													}
												}
												catch( e ){}
											}
										}
										fl.load();
									}
								} );
							}
						}

						// Friend disks
						let rows;
						try
						{
							rows = JSON.parse( dat );
						}
						catch( e )
						{
							rows = false;
						}
					
						// Check the friend disks
						let foundHome   = false;
						let foundShared = false;
						let fixCount = 0;
						
						if( rows && rows.length )
						{
							for ( let a = 0; a < rows.length; a++ )
							{
								let r = rows[a];
								if( r.Config.indexOf( '{' ) >= 0 )
								{
									try
									{
										r.Config = JSON.parse( r.Config );
									}
									catch( e )
									{
										console.log( r.Title + ' config did not parse.' );
									}
								}
							
								// Check if these drives are found
								if( rows[a].Name == 'Home' )
								{
									foundHome = true;
									fixCount++;
								}
								else if( rows[a].Name == 'Shared' )
								{
									foundShared = true;
									fixCount++;
								}
							
								// Doesn't exist, go on
								let o = false;

								let d;

								d = ( new Door() ).get( r.Name + ':' );
								d.permissions[0] = 'r';
								d.permissions[1] = 'w';
								d.permissions[2] = 'e';
								d.permissions[3] = 'd';

								let nam = r.Name.split( ':' ).join( '' );

								// Get the visstruct thingie
								if( r.Visible != 'false' )
									r.Visible = true;
								else r.Visible = false;
								if( visStruct && typeof( visStruct[ nam ] ) != 'undefined' )
									r.Visible = visStruct[ nam ].Visibility == 'visible' ? true : false;
								
								o = {
									Title: nam,
									Volume: nam + ':',
									Path: nam + ':',
									SortPriority: 0,
									Handler: r.FSys,
									Type: 'Door',
									MetaType: 'Directory',
									ID: r.ID,
									Mounted: true,
									Driver: r.Type,
									Door: d,
									Visible: r.Visible,
									Config: r.Config,
									Execute: r.Execute
								};

								// We need volume information
								d.Volume = o.Volume;

								// Add new disk to list
								newIcons.push( o );
							}
						}
					
						// Check new icons with old icons
						let hasNew = false;
						let checks = [];
						for( let a = 0; a < newIcons.length; a++ )
						{
							let ni = newIcons[ a ];
							let found = false;
							for( let b = 0; b < t.icons.length; b++ )
							{
								let ti = t.icons[ b ];
							
								if( ti.Title == ni.Title )
								{
									found = true;
								
									// Set hasNew if the config changed
									// TODO: Do other config tests
						
									if( ti.Visible != ni.Visible )
									{
										hasNew = true;
									}
									else if( !ti.Config && ti.Config )
									{
										hasNew = true;
									}
									else if( ni.Config && ti.Config && ni.Config.visibility != ti.Config.visibility )
									{
										hasNew = true;
									}
								}
							}
							if( !found )
							{
								checks.push( a );
								hasNew = true;
							}
						}
					
						// If we increased the amount of icons, it means we have new
						if( newIcons.length != t.icons.length )
							hasNew = true;

						// Something changed!
						if( hasNew || forceRefresh )
						{
							t.icons = newIcons;
							t.redrawIcons();
							if( checks.length )
							{
								for( let a = 0; a < checks.length; a++ )
								{
									let check = checks[ a ];
									if( t.icons[ check ].Execute )
									{
										ExecuteJSXByPath( t.icons[ check ].Volume + t.icons[ check ].Execute );
										t.icons[ check ].Execute = false;
									}
									testDrive( t.icons[ check ], t.icons[check ].Door );
								}
							}
						}
						else
						{
							if( forceRefresh ) t.redrawIcons();
						}
					
						// Do the callback thing
						if( callback && typeof( callback ) == 'function' )
						{
							callback( t.icons );
						}

						// Check for new events
						t.checkDesktopEvents();
						
						function checkIt()
						{
							fixCount--;
							if( fixCount == 0 )
							{
								t.redrawIcons( true );
							}
						}
						if( !foundHome )
						{
							t.mountDrive( 'Home', checkIt );
						}
						if( !foundShared )
						{
							t.mountDrive( 'Shared', checkIt );
						}
					}
					m.execute( 'device/list' );
				}
				//vi.forceSend = true;
				vi.execute( 'devicesettings' );
			}
			//mo.forceSend = true;
			mo.execute( 'workspaceshortcuts' );
		}

		return true;
	},
	// Mount a drive
	mountDrive: function( deviceName, cbk )
	{
		let l = new Library( 'system.library' );
		l.onExecuted = function( e, d )
		{
			cbk( e, d );
		};
		l.execute( 'device/mount', { devname: deviceName } );
	},
	redrawIcons: function()
	{
		if( !this.screen ) return;

		if( !document.body.classList.contains( 'Loaded' ) )
		{
			return;
		}
	
		// The desktop always uses the same fixed values :)
		let wb = this.screen.contentDiv;
		if( wb && wb.redrawIcons )
		{
			wb.onselectstart = function( e ) { return cancelBubble ( e ); };
			wb.ondragstart = function( e ) { return cancelBubble ( e ); };
			wb.directoryview.toChange = true;
			wb.redrawIcons( this.getIcons(), 'vertical' );
		}
		
		if ( RefreshDesklets ) RefreshDesklets();
		
		// Check dormant too
		let dormants = DormantMaster.getDoors();

		// Cleanup windows of filesystems that are unmounted
		let close = [];
		for( let a in movableWindows )
		{
			let w = movableWindows[a];
			if( w.content ) w = w.content;
			
			if( !w.fileInfo ) continue;

			// Find volume from path
			let vol = w.fileInfo.Path.split( ':' )[0];
			
			if( vol != 'Mountlist:' )
			{
				let pureVol = vol.split( ':' )[0];
				let found = false;
				for( let b in this.icons )
				{
					// TODO: The colon thing... :)
					if( vol && pureVol == this.icons[b].Title.split( ':' )[0] )
					{
						found = true;
						break;
					}
				}
				// Check dormant
				for( let b in dormants )
				{
					// TODO: The colon thing... :)
					if( vol && pureVol == dormants[b].Title.split( ':' )[0] )
					{
						found = true;
						break;
					}
				}
				// Clean up!
				if( !found )
				{
					let s = w;
					if( s.content ) s = s.content;
					close.push( w );
				}
			}
		}
		// Close windows that are destined for it
		if( close.length )
		{
			for( let a = 0; a < close.length; a++ )
			{
				CloseWindow( close[a] );
			}
		}
	},
	getIcons: function()
	{
		if( !this.icons || !this.icons.length || !this.icons.concat )
			return false;
		return this.icons;
	},
	// Create a new web link!
	weblink: function( path )
	{
		let p = currentMovable.content.fileInfo.Path;

		function wpop( data )
		{
			let v = new View( {
				title: i18n( 'i18n_create_web_link' ),
				width: 400,
				height: 250
			} );

			let f = new File( '/webclient/templates/weblink.html' );
			f.replacements = { val_name: '', val_link: '', val_notes: '', val_path: p };
			if( data )
			{
				for( let a in data )
				{
					f.replacements[ 'val_' + a ] = data[a];
				}
			}
			f.i18n();
			f.onLoad = function( data )
			{
				v.setContent( data );
			}
			f.load();
		}
		if( path )
		{
			let f = new File( path );
			f.onLoad = function( data )
			{
				try
				{
					let j = JSON.parse( data );
					wpop( j );
				}
				catch( e )
				{
				}
			}
			f.load();
		}
		else
		{
			wpop();
		}
	},
	// Save a web link
	saveWebLink: function( pele, win )
	{
		let eles = [];
		let inp = pele.getElementsByTagName( 'input' );
		let txt = pele.getElementsByTagName( 'textarea' );
		for( let a = 0; a < inp.length; a++ ) eles.push( inp[a] );
		for( let a = 0; a < txt.length; a++ ) eles.push( txt[a] );
		let f = {};
		for( let a = 0; a < eles.length; a++ )
		{
			if( !eles[a].getAttribute( 'name' ) ) continue;
			f[ eles[a].getAttribute( 'name' ) ] = eles[a].value;
		}
		if( f.name && f.name.length )
		{
			let fl = new File( f.path + f.name.split( /[\s]/ ).join( '_' ) + '.url' );
			fl.save( JSON.stringify( f ) );
		}
		CloseView( win );
	},
	// New directory dialog
	newDirectory: function ()
	{
		if( window.currentMovable )
		{
			let directoryWindow = window.currentMovable;

			if( !HasClass( window.currentMovable, 'Active' ) )
				return false;

			if( Workspace.newDir )
				return Workspace.newDir.activate();
			
			let d;
			
			if( !window.isMobile && !Workspace.isSingleTask )
			{
				d = new View( {
					id: 'makedir',
					width: 325,
					height: 100,
					title: i18n( 'i18n_make_a_new_container' )
				} );
			}
			else
			{
				d = new Widget( {
					width: 'full',
					height: 'full',
					above: true,
					animate: true,
					transparent: true
				} );
			}
			
			Workspace.newDir = d;
			d.onClose = function()
			{
				Workspace.newDir = null;
			}

			if( window.isMobile )
			{
				d.setContent( '\
				<div class="Dialog">\
					<div class="VContentTop BackgroundDefault Padding ScrollArea">\
						<div>\
							<p><strong>' + i18n( 'i18n_name' ) + ':</strong></p>\
						</div>\
						<div class="Padding">\
							<div class="HRow">\
								<div class="HContent100 FloatLeft">\
									<p class="Layout InputHeight"><input class="FullWidth MakeDirName" type="text" value="' + i18n( 'i18n_new_container' ) + '"/></p>\
								</div>\
							</div>\
						</div>\
					</div>\
					<div class="VContentBottom BorderTop ColorToolbar BackgroundToolbar TextRight Padding" style="height: 50px">\
						<button type="button" class="Button fa-remove IconSmall CancelButton">\
							' + i18n( 'i18n_cancel' ) + '\
						</button>\
						<button type="button" class="Button fa-folder IconSmall NetContainerButton">\
							' + i18n( 'i18n_create_container' ) + '\
						</button>\
					</div>\
				</div>' );
			}
			else
			{
				d.setContent( '\
				<div class="ContentFull">\
					<div class="VContentTop BorderBottom" style="bottom: 50px;">\
						<div class="Padding">\
							<div class="HRow">\
								<div class="HContent25 FloatLeft">\
									<p class="Layout InputHeight"><strong>' + i18n( 'i18n_name' ) + ':</strong></p>\
								</div>\
								<div class="HContent75 FloatLeft">\
									<p class="Layout InputHeight"><input class="FullWidth MakeDirName" type="text" value="' + i18n( 'i18n_new_container' ) + '"/></p>\
								</div>\
							</div>\
						</div>\
					</div>\
					<div class="VContentBottom Padding" style="height: 50px">\
						<button type="button" class="Button fa-folder IconSmall NetContainerButton">\
							' + i18n( 'i18n_create_container' ) + '\
						</button>\
					</div>\
				</div>' );
			}

			let inputField  = d.getByClass( 'MakeDirName' )[0];
			let inputButton = d.getByClass( 'NetContainerButton' )[0];
			let can = d.getByClass( 'CancelButton' )[0];
			if( can ) can.onclick = function(){ d.close(); }

			let fi = directoryWindow.content.fileInfo;
			let dr;

			if ( fi.Dormant && fi.Dormant.dosAction )
				dr = fi.Dormant;
			else
				dr = fi.Door ? fi.Door : Workspace.getDoorByPath( fi.Path );
			let i = fi.ID
			let p = fi.Path;

			inputButton.onclick = function()
			{
				if( inputField.value.length > 0 )
				{
					// Make sure we have a correct path..
					let ll = p.substr( p.length - 1, 1 );
					if( ll != '/' && ll != ':' )
						p += '/';

					dr.dosAction( 'makedir', { path: p + inputField.value, id: i }, function()
					{
						if( directoryWindow && directoryWindow.content )
						{
							let dw = directoryWindow;
							if( !dw.activate )
							{
								if( dw.windowObject )
									dw = dw.windowObject;
							}
							if( dw.activate )
							{
								dw.activate();
								// Refresh now
								if( directoryWindow.content )
								{
									if( directoryWindow.content.directoryview )
										directoryWindow.content.directoryview.toChange = true;
									directoryWindow.content.refresh();
								}
								else 
								{
									if( directoryWindow.directoryview )
										directoryWindow.directoryview.toChange = true;
									directoryWindow.refresh();
								}
							}
							d.close();
						}
					} );
				}
				else
				{
					inputField.focus();
				}
			}

			inputField.onkeydown = function( e )
			{
				let w = e.which ? e.which : e.keyCode;
				if ( w == 13 ) inputButton.onclick ();
			}

			inputField.focus();
			inputField.select();
		}
	},
	// Rename active file
	renameFile: function()
	{
		if ( window.currentMovable && window.currentMovable.content )
		{
			let rwin = window.currentMovable;
			let eles = rwin.content.getElementsByTagName( 'div' );
			let sele = false;
			for( let a = 0; a < eles.length; a++ )
			{
				if( eles[a].className.indexOf( ' Selected' ) < 0 )
					continue;
				sele = eles[a];
				break;
			}
			if( !sele )
				return;

			// Get name of file
			let nam = EntityDecode( sele.fileInfo.Filename );

			// Find out which type it is
			let icons = rwin.content.icons;
			let icon = false;
			for( let a = 0; a < icons.length; a++ )
			{
				if( ( icons[a].Title && icons[a].Title == nam ) || ( icons[a].Filename && icons[a].Filename == nam ) )
				{
					icon = icons[a];
					break;
				}
			}

			if( icon )
			{
				// There can be only one!
				if( Workspace.renameWindow )
				{
					Workspace.renameWindow.close();
					Workspace.renameWindow = false;
				}
				
				

				let w;
				if( window.isMobile || Workspace.isSingleTask )
				{
					w = new Widget( {
						width: 'full',
						height: 'full',
						above: true,
						animate: true,
						transparent: true
					} );
				}
				else
				{
					w = new View( {
						title: i18n( 'rename_file' ),
						width: 320,
						height: 100,
						resize: false
					} );
				}

				Workspace.renameWindow = w;

				if( window.isMobile )
				{
					w.setContent( '\
						<div class="Dialog">\
							<div class="VContentTop BackgroundDefault Padding ScrollArea">\
								<div><p><strong>' + i18n( 'new_name' ) + ':</strong></p></div>\
								<div class="HRow">\
									<div class="HContent100 FloatLeft"><input type="text" class="InputHeight FullWidth" value="' + nam + '"></div>\
								</div>\
							</div>\
							<div class="Padding VContentBottom BorderTop ColorToolbar BackgroundToolbar TextRight" style="height: 50px">\
								<button type="button" class="Button IconSmall fa-remove">\
									' + i18n( 'i18n_cancel' ) + '\
								</button>\
								<button type="button" class="Button IconSmall fa-edit">\
									' + i18n( 'rename_file' ) + '\
								</button>\
							</div>\
						</div>\
					' );
				}
				else
				{
					w.setContent( '\
						<div class="ContentFull LayoutButtonbarBottom">\
							<div class="VContentTop Padding">\
								<div class="HRow MarginBottom">\
									<div class="HContent30 FloatLeft"><p class="InputHeight"><strong>' + i18n( 'new_name' ) + ':</strong></p></div>\
									<div class="HContent70 FloatLeft"><input type="text" class="InputHeight FullWidth" value="' + nam + '"></div>\
								</div>\
							</div>\
							<div class="VContentBottom Padding BackgroundDefault BorderTop">\
								<button type="button" class="Button IconSmall fa-edit">\
									' + i18n( 'rename_file' ) + '\
								</button>\
							</div>\
						</div>\
					' );
				}

				let dom = window.isMobile ? w.dom : w;
				let inp = dom.getElementsByTagName( 'input' )[0];
				let btn = dom.getElementsByTagName( 'button' );
				let clb = null;
				if( !window.isMobile )
				{
					btn = btn[0];
				}
				else
				{
					clb = btn[0];
					btn = btn[1];
				}

				btn.onclick = function()
				{
					Workspace.executeRename( dom.getElementsByTagName( 'input' )[0].value, icon, rwin );
				}
				if( clb )
				{
					clb.onclick = function()
					{
						w.close();
					}
				}
				inp.select();
				inp.focus();
				
				inp.onkeydown = function( e )
				{
					let wh = e.which ? e.which : e.keyCode;
					if( wh == 13 )
					{
						btn.click();
					}
				}
			}
		}
	},
	// copy current file selection into virtual clipboard
	copyFiles: function()
	{
		if ( window.currentMovable && window.currentMovable.content )
		{
			let rwin = window.currentMovable;
			let eles = rwin.content.getElementsByTagName( 'div' );
			let selected = [];

			for( let a = 0; a < eles.length; a++ )
			{
				if( eles[a].className.indexOf( ' Selected' ) < 0 )
					continue;

				// Make a copy (we might not have the source view window open anymore!)
				let eleCopy = document.createElement( eles[a].tagName );
				eleCopy.innerHTML = eles[a].innerHTML;
				eleCopy.fileInfo = eles[a].fileInfo;
				eleCopy.window = { fileInfo: rwin.content.fileInfo, refresh: rwin.refresh };

				selected.push( eleCopy );
			}
			//only act if we have something to do afterwards...
			if( selected.length > 0 )
			{
				Friend.workspaceClipBoardMode = 'copy';
				Friend.workspaceClipBoard = selected;
			}
			
			WorkspaceMenu.show();
		}
	},
	// paste from virtual clipboard
	pasteFiles: function( e )
	{
		if( !e ) e = window.event;
		
		let cme = window.currentMovable;
		let clp = Friend.workspaceClipBoard;
		if( cme && clp && clp.length > 0 && typeof cme.drop == 'function' )
		{
			e = {};
			e.ctrlKey = ( Friend.workspaceClipBoardMode == 'copy' ? true : false );
			
			let clip = Friend.workspaceClipBoard;
			
			// Make sure we don't overwrite existing files!
			let destPath = currentMovable.content.fileInfo.Path;
			let destFinf = currentMovable.content.fileInfo;
			let doCopy = false;
			
			// Use menu context for file info path (folder icon etc)
			function isDirectoryElement( ele )
			{
				if( !ele.classList ) return false;
				if( ele.classList.contains( 'Directory' ) || ele.classList.contains( 'Icon' ) )
				{
					while( !ele.fileInfo && ele != document.body )
					{
						ele = ele.parentNode;
					}
					if( ele == document.body ) return false;
					return ele;
				}
				if( ele.classList.contains( 'Column' ) )
				{
					let p = ele.parentNode;
					if( p.fileInfo )
					{
						return p;
					}
				}
				return false;
			}
			let mc = false;
			if( Workspace.menuContext && ( mc = isDirectoryElement( Workspace.menuContext ) ) )
			{
				let fi = null;
				
				// Use the context menu file info, and sanitize it!
				// The Path may include the filename
				destPath = mc.fileInfo.Path;
				if( destPath.substr( -1, 1 ) != '/' )
				{
				    if( destPath.indexOf( '/' ) > 0 )
				    {
				        destPath = destPath.split( '/' );
				        destPath.pop();
				        destPath = destPath.join( '/' );
				        destPath += '/';
				    }
				}
				else if( destPath.substr( -1, 1 ) != ':' && !destPath.indexOf( '/' ) )
				{
				    if( destPath.indexOf( ':' ) > 0 )
				    {
			            destPath = destPath.split( ':' );
			            destPath.pop();
			            destPath = destPath.join( ':' );
			            destPath += ':';
			        }
				}
				destFinf = {};
				for( let a in mc.fileInfo )
				{
				    destFinf[ a ] = mc.fileInfo[ a ];
				}
				destFinf.Path = destPath;
				doCopy = true;
			}
			
			Workspace.menuContext = null;
			
			let d = new Door( destPath );
			d.getIcons( destFinf, function( items )
			{
				for( let a = 0; a < items.length; a++ )
				{
					for( let b = 0; b < clip.length; b++ )
					{
						let copy = 0;
						if( items[ a ].Filename == clip[ b ].fileInfo.Filename )
						{
							let found = false;
							do
							{
								found = false;
								let str = 'Copy ' + ( copy > 0 ? ( copy + ' ' ) : '' );
								str += 'of ' + items[ a ].Filename;
							
								let p = clip[ b ].fileInfo.Path;
								let f = clip[ b ].fileInfo.Filename;
							
								// Files
								if( clip[ b ].fileInfo.MetaType == 'File' )
								{
									let dn = f;
									p = p.substr( 0, p.length - dn.length ) + str;
									clip[ b ].fileInfo.NewPath = p;
								}
								// Directory
								else
								{
									let dn = f + '/';
									p = p.substr( 0, p.length - dn.length ) + str + '/';
									clip[ b ].fileInfo.NewPath = p;
								}
								
								// Set the safe new filename
								clip[ b ].fileInfo.NewFilename = str;
							
								// Still found?
								for( let c = 0; c < items.length; c++ )
								{
									if( items[ c ].Filename == str )
									{
										found = true;
										copy++;
										break;
									}
								}
							}
							while( found );
						}
					}
				}
				if( !e ) e = {};
				let cliplen = clip.length;
				for( let b = 0; b < clip.length; b++ )
				{	
					let spath = clip[b].fileInfo.Path;
					let lastChar = spath.substr( -1, 1 );
					let sh = new Shell( 0 );
					let source = spath.split( ' ' ).join( '\\ ' );
					let destin = ( destPath ).split( ' ' ).join( '\\ ' );
					let fn = ( clip[b].fileInfo.NewFilename ? clip[b].fileInfo.NewFilename : clip[b].fileInfo.Filename );
					fn = fn.split( ' ' ).join( '\\ ' );
					let copyStr = 'copy ' + source + ' to ' + destin + fn;
					sh.parseScript( copyStr, function()
					{
						if( cliplen-- == 0 )
						{
							Notify( { title: i18n( 'i18n_copy_operation' ), text: i18n( 'i18n_copying_files_complete' ) } );
						}
						delete sh;
					}  );
				}
			} );
		}
	},
	// Use a door and execute a filesystem function, rename
	executeRename: function( nam, icon, win )
	{	
		let ic = new FileIcon();
		
		let target = icon.Path;
		if( target.indexOf( '/' ) > 0 )
		{
			target = target.split( '/' );
			target.pop();
			target = target.join( '/' ) + '/' + nam;
		}
		else
		{
			target = target.split( ':' )[0] + ':' + nam;
		}
		
		ic.delCache( icon.Path );
		ic.delCache( target );
		
		if ( icon.Dormant )
		{
			if ( icon.Dormant.dosAction )
			{
				icon.Dormant.dosAction( 'rename', 
					{
						newname: nam,
						path: icon.Path
					}, 
					function( result, data )
					{
						// Try to rename .info file
						icon.Dormant.dosAction( 'rename', 
							{
								newname: nam + '.info',
								path: icon.Path + '.info'
							},
							function( rr, dd )
							{
								if( win && win.content.refresh )
								{
									if( win.content.directoryview )
										win.content.directoryview.toChange = true;
									win.content.refresh();
								}
								if( Workspace.renameWindow )
									Workspace.renameWindow.close();
							} 
						);
					} 
				);
			}
			else
			{
				Notify( { title: i18n( 'i18n_cannotRename' ), text: i18n( 'i18n_noWritePermission' ) } );
				if( Workspace.renameWindow )
					Workspace.renameWindow.close();
			}
			return;
		}
		let d = new Door( icon.Path );
		d.dosAction( 'rename', 
			{
				newname: nam,
				path: icon.Path
			},
			function( result, data)
			{
				// Try to rename .info file
				d.dosAction( 'rename',
					{
						newname: nam + '.info',
						path: icon.Path + '.info'
					},
					function( rr, dd )
					{
						if( win && win.content.refresh )
						{
							if( win.content.directoryview )
								win.content.directoryview.toChange = true;
							win.content.refresh();
						}
						if( Workspace.renameWindow )
							Workspace.renameWindow.close();
					}
				);
			}
		);
	},
	renderPermissionGUI: function( conf, keyStr )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, da )
		{
			let perms = '';
			let filesystemoptions = '';

			// Default permissions
			// TODO: Make dynamic in a config file or something..
			let permissionPool = [
				'Module System',
				'Module Files',
				'Door All'
			];
			let hasPermissions = [ false, false, false ];

			if( !conf )
			{
				conf = { permissions: hasPermissions };
			}
			else if( !conf.permissions )
			{
				conf.permissions = hasPermissions;
			}

			// Add needed
			for( let b = 0; b < permissionPool.length; b++ )
			{
				for( let a = 0; a < conf.permissions.length; a++ )
				{
					if( permissionPool[b] == conf.permissions[a][0] )
					{
						hasPermissions[b] = true;
					}
				}
			}

			// List out options for permissions
			for( let a = 0; a < permissionPool.length; a++ )
			{
				let row = Trim( permissionPool[a] ).split( ' ' );
				let ch = hasPermissions[a] == true ? ' checked="checked"' : '';
				switch( row[0].toLowerCase() )
				{
					case 'door':
						perms += '<p>';
						perms += '<input type="checkbox" permission="' + row.join( ' ' ) + '" ' + ch + '/> ';
						perms += '<label>' + i18n('grant_door_access' ) + '</label> ';
						perms += '<select><option value="all">' +
							i18n( 'all_filesystems' ) + '</option>' + filesystemoptions + '</select>';
						perms += '.</p>';
						break;
					case 'module':
						perms += '<p><input type="checkbox" permission="' + row.join( ' ' ) + '" ' + ch + '/> ';
						perms += '<label>' + i18n('grant_module_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					case 'service':
						perms += '<p><input type="checkbox" permission="' + row.join( ' ' ) + '" ' + ch + '/> ';
						perms += '<label>' + i18n('grant_service_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					default:
						continue;
				}
			}

			if( ge( 'Permissions' + keyStr ) )
			{
				ge( 'Permissions' + keyStr ).innerHTML = perms;
			}

			// Check the security domains
			let domains = [];
			if( e == 'ok' )
			{
				try
				{
					let data = JSON.parse( da );
					domains = data.domains;
				}
				catch( e )
				{
					domains = [];
				}
			}
			if( ge( 'SecurityDomains' + keyStr ) )
			{
				let s = document.createElement( 'select' );
				s.innerHTML = '';
				for( let a = 0; a < domains.length; a++ )
				{
					let o = document.createElement( 'option' );
					if( Trim( domains[a] ) == conf.domain )
						o.selected = 'selected';
					o.innerHTML = Trim( domains[a] );
					o.value = Trim( domains[a] );
					s.appendChild( o );
				}
				ge( 'SecurityDomains' + keyStr ).innerHTML = '';
				ge( 'SecurityDomains' + keyStr ).appendChild( s );
			}
		}
		m.execute( 'securitydomains' );
	},
	seed: 0,
	setMimetype: function( filename, executable )
	{
		let ext = filename.split( '.' );
		ext = '.' + ext[ ext.length - 1 ].toLowerCase();
		let m = new Module( 'system' );
		m.onExecuted = function()
		{
			Workspace.reloadMimeTypes();
		}
		m.execute( 'setmimetype', { type: ext, executable: executable } );
	},
	// Show file info dialog
	fileInfo: function( iconOriginal )
	{
		if( !iconOriginal ) iconOriginal = this.getActiveIcon();
		
		let icon = {};
		for( let c in iconOriginal )
			icon[ c ] = iconOriginal[ c ];
	
		
		if( icon )
		{
			// Check volume icon
			if( icon.Type == 'Door' && ( ( !icon.Filesize && icon.Filesize != 0 ) || isNaN( icon.Filesize ) ) )
			{
				if( !icon.Path && icon.Volume )
				{
					icon.Path = icon.Volume;
					if( icon.Path.substr( icon.Path.length - 1, 1 ) != ':' )
						icon.Path += ':';
				}
				
				let m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					let o = d;
					if( typeof( o ) != 'object' )
						o = d && d.indexOf( '{' ) >= 0 ? JSON.parse( d ) : {};
					if( o && o.Filesize && o.Filesize > 0 )
					{
						icon.Filesize = o.Filesize;
						icon.UsedSpace = o.Used;
					}
					// This shouldn't happen!
					else
					{
						icon.Filesize = 0;
						icon.UsedSpace = 0;
					}

					Workspace.fileInfo( icon );
				}
				m.execute( 'volumeinfo', { path: icon.Path } );
				return;
			}

			// Normal file or directory icon
			let w = new View( {
				title: ( icon.Type == 'Door' ? i18n( 'i18n_volumeicon_information' ) : i18n( 'i18n_icon_information' ) ) +
					' "' + ( icon.Filename ? icon.Filename : icon.Title ) + '"',
				width: 640,
				height: 350
			} );
			this.seed++;

			let prot = '';
			let bits = {
				readable:   [0, 0, 0],
				writable:   [0, 0, 0],
				deletable:  [0, 0, 0],
				executable: [0, 0, 0]
			};

			// Header
			prot += '<div class="HRow"><div class="FloatLeft HContent30">&nbsp;</div><div class="FloatLeft HContent70 IconInfoSkewed">';
			prot += '<div class="FloatLeft HContent30 TextCenter MarginBottom">' + i18n( 'owner' ) + ':</div>';
			prot += '<div class="FloatLeft HContent30 TextCenter MarginBottom">' + i18n( 'group' ) + ':</div>';
			prot += '<div class="FloatLeft HContent30 TextCenter MarginBottom">' + i18n( 'others' ) + ':</div>';
			prot += '</div></div>';

			// Gui
			for( let z in bits )
			{
				prot += '<div class="HRow">';
				prot += '<div class="FloatLeft HContent30">' + i18n( z ) + ':</div>';
				prot += '<div class="FloatLeft HContent70">';
				for( let oz in [ 'self', 'group', 'others' ] )
				{
					prot += '<div class="FloatLeft HContent30 TextCenter"><input type="checkbox" name="' + z + '_' + oz + '"/></div>';
				}
				prot += '</div>';
				prot += '</div>';
			}

			// Human filesize
			let fbtype = '';
			let ustype = '';

			icon.UsedSpace = parseInt( icon.UsedSpace );
			icon.Filesize = parseInt( icon.Filesize );

			if( isNaN( icon.Filesize ) ) icon.Filesize = 0;
			if( isNaN( icon.UserSpace ) ) icon.UserSpace = 0;

			if( icon.UsedSpace )
			{
				icon.UsedSpace = Friend.Utilities.humanFileSize( icon.UsedSpace );
			}
			icon.Filesize = Friend.Utilities.humanFileSize( icon.Filesize );
			
			let shareFile = 'iconinfo.html';
			if( icon.Path.indexOf( 'Shared:' ) == 0 )
				shareFile = 'iconinfo_noshare.html';
			
			// Load template
			let filt = ( icon.Type == 'Door' ? 'iconinfo_volume.html' : shareFile );
			if( icon.Path && icon.Path.split( ':' )[0] == 'System' )
				filt = 'iconinfo_system.html';
				
			if( icon.Path && icon.Path.substr( icon.Path.length - 5, 5 ).toLowerCase() != '.info' )
			{
				let finfo = icon.Path;
				if( icon.Path.substr( icon.Path.length - 1, 1 ) == '/' )
				{
					finfo = icon.Path.substr( 0, icon.Path.length - 1 ) + '.dirinfo';
				}
				else
				{
					finfo += '.info';
				}
				let mi = new File( finfo );
				mi.onLoad = function( fd )
				{
					if ( !fd ) fd = '';
					fd = fd.split( '<!--separate-->' )[0];
					let data = false;
					if( fd.length && fd.indexOf( '{' ) >= 0 )
					{
						data = JSON.parse( fd );
					}
					ca( data );
				}
				mi.load();
			}
			else
			{
				ca();
			}
			
			// Activate form functionality on icon information
			function ca( datajson )
			{
				let fdt = {};
				fdt.IconImage = { Title: i18n( 'i18n_icon_image' ), Name: 'Icon', Type: 'text', Length: i18n( 'i18n_icon_image' ).length };
				if( typeof( datajson ) == 'object' )
				{
					datajson.IconImage = fdt.IconImage;
					fdt = datajson;
				}
				let fdt_out = '';
				let sel = '';
				let i = 0;
				for( let a in fdt )
				{
					if( !fdt[a].Title ) fdt[a].Title = a;
					fdt_out += '<option value="' + a + '" encoding="' + fdt[a].Encoding + '" type="' + fdt[a].Type + '">' + fdt[a].Title + '</option>';
				}

				let ext = '';
				if( icon.Filename )
				{
					ext = icon.Filename.split( '.' ); ext = ext[ ext.length - 1 ].toLowerCase();
				}

				let f = new File( '/webclient/templates/' + filt );
				f.replacements = {
					filename: icon.Filename ? icon.Filename : ( icon.Title.split( ':' )[0] ),
					filesize: icon.Filesize + '' + fbtype + ( icon.UsedSpace ? ( ' (' + icon.UsedSpace + '' + ustype + ' ' + i18n( 'i18n_used_space' ) + ')' ) : '' ),
					filedate: icon.DateModified,
					path: icon.Path,
					protection: prot,
					Cancel: i18n( 'i18n_cancel' ),
					Save: i18n( 'i18n_save' ),
					Notes: i18n( 'i18n_notes' ),
					iconnotes: icon.Notes ? icon.Notes : '',
					sharename: i18n( 'i18n_sharename' ),
					sharewith: i18n( 'i18n_sharewith'),
					hideShares: icon.Type == 'File' ? '' : 'display: none',
					public_disabled: '',
					instance: ( icon.Filename ? icon.Filename : ( icon.Title.split( ':' )[0] ) ).split( /[^a-z]+/i ).join( '' ),
					info_fields: fdt_out,
					ext: '.' + ext
				};
				f.i18n();
				if( icon.Path )
				{
					if( icon.Path.substr( icon.Path.length - 1, 1 ) != ':' )
					{
						f.replacements.i18n_volume_information = i18n( 'i18n_file_information' );
						f.replacements.i18n_volume_name = i18n( 'i18n_filename' );
						f.replacements.i18n_volume_size = i18n( 'i18n_filesize' );
					}
				}
				f.onLoad = function( d )
				{
					// Check file permissions!
					let dn = icon.Path ? icon.Path.split( ':' )[ 0 ] : icon.Title;
					let pt = icon.Path ? icon.Path : '';

					// File on Dormant drive?
					if ( icon.Dormant )
					{
						icon.Dormant.getFileInformation( icon.Path, function( infos )
						{
							setInformation( infos );
						} );
						return;
					} 

					let sn = new Library( 'system.library' );
					sn.onExecuted = function( returnCode, returnData )
					{
						// If we got an OK result, then parse the return data (json data)
						let rd = false;
						if( returnCode == 'ok' )
							rd = JSON.parse( returnData );
						// Else, default permissions
						else
						{
							rd = [
								{
									access: '-rwed',
									type: 'user'
								},
								{
									access: '-rwed',
									type: 'group'
								},
								{
									access: '-rwed',
									type: 'others'
								}
							];
						}
						let vi = new Module( 'system' );
						vi.onExecuted = function( er, dr )
						{
							setInformation( rd, er == 'ok' ? dr : false );
						}
						vi.execute( 'devicesettings', { filesystem: dn } );
					}
					sn.execute( 'file/access', { devname: dn, path: pt } ); 

					function setInformation( rd, vsettings )
					{
						if( vsettings )
						{
							try
							{
								vsettings = JSON.parse( vsettings );
							}
							catch( e ){};
						}
						
						w.setContent( d.split( '!!' ).join( Workspace.seed ) );

						Workspace.iconInfoDataField( w.getWindowElement(), true );

						let eles = w.getWindowElement().getElementsByTagName( 'div' );
						let da = false;
						for( let a = 0; a < eles.length; a++ )
						{
							if( eles[a].classList.contains( 'DropArea' ) )
							{
								da = eles[a];
								break;
							}
						}
						let visibility = false;
						let inp = w.getWindowElement().getElementsByTagName( 'input' );
						let visval = icon.Config && icon.Config.visibility ? icon.Config.visibility : 'visible';
						
						if( visval == 'visible' )
						{
							// From settings
							if( vsettings && vsettings.Visibility )
								visval = vsettings.Visibility;
						}
						
						for( let a = 0; a < inp.length; a++ )
						{
							if( inp[a].name == 'visibility' )
							{
								if( inp[a].value == visval )
									inp[a].checked = 'checked';
								else inp[a].checked = '';
							}
						}
						
						// Set disk icon
						if( da )
						{
							da.style.height = '90px';
							da.style.maxWidth = '110px';
							da.style.backgroundRepeat = 'no-repeat';
							da.style.backgroundPosition = 'center';
							da.style.backgroundSize = '64px auto';
							da.style.backgroundImage = 'url(' + icon.IconFile + ')';
							w.getWindowElement().icons = [ { domNode: da } ];
							da.drop = function( ele )
							{
								if( ele.length )
								{
									if( ele[0].fileInfo )
									{
										let s = ele[0].fileInfo.Path.split( '.' );
										switch( s[s.length-1].toLowerCase() )
										{
											case 'png':
											case 'jpg':
											case 'jpeg':
											case 'gif':
												da.style.transform = '';
												da.style.webkitTransform = '';
												let f = new File( ele[0].fileInfo.Path.split( ':' )[0] + ':disk.info' );
												f.onSave = function( e )
												{
													Workspace.refreshDesktop( false, true );
													da.style.backgroundImage = 'url(' + getImageUrl( ele[0].fileInfo.Path ) + ')';
												}
												f.save(
													'{"DiskIcon":"' + ele[0].fileInfo.Path.split( ':' )[1] + '"}',
													ele[0].fileInfo.Path.split( ':' )[0] + ':disk.info'
												);
												break;
										}
									}
								}
							}
						}

						// Bring up volume permissions
						if( icon.Type == 'Door' )
						{
							Workspace.refreshDesktop( function()
							{
								let pth = icon.deviceName ? ( icon.deviceName + ':' ) : icon.Path;

								let dr = ( new Door() ).get( pth );
								if( dr.Config )
								{
									let conf = dr.Config;
									if( typeof( dr.Config ) == 'string' && dr.Config.indexOf( '{' ) >= 0 )
										conf = JSON.parse( dr.Config );
									Workspace.renderPermissionGUI( conf, f.replacements.instance );
								}
								else Workspace.renderPermissionGUI( false, f.replacements.instance );
							} );
						}

						// Hide form elements that are not ment for normal files
						let isFile = icon.Type.toLowerCase() != 'directory';
						eles = w.getElementsByTagName( 'div' );
						for( let a = 0; a < eles.length; a++ )
						{
							if( eles[a].className.indexOf( 'FileInfo' ) >= 0 && !isFile )
							{
								eles[a].style.display = 'none';
							}
						}

						// The permission inputs
						let permInputs = {
							user: '-----',
							group: '-----',
							others: '-----'
						};
						let permSettings = {
							user: '',
							group: '',
							others: ''
						};
						let permOrder = { 'a': 0, 'r': 1, 'w': 2, 'e': 3, 'd': 4 };
						for( let an = 0; an < rd.length; an++ )
						{
							// First time
							if( rd[an].type && !permSettings[rd[an].type] )
							{
								permSettings[rd[an].type] = rd[an].access.toLowerCase();
							}
							// Merge permissions
							else
							{
								let slot = permSettings[rd[an].type];
								for( let az = 0; az < rd[an].access.length; az++ )
								{
									if( slot[az] == '-' && rd[an].access[az] != '-' )
										slot[az] = rd[an].access[az];
								}
								permSettings[rd[an].type] = slot.toLowerCase();
							}
						}
						// Now we're ready to find these permissions!

						// Setup public / private file
						let inps = w.getElementsByTagName( 'input' );
						let sels = w.getElementsByTagName( 'select' );
						eles = [];
						for( let n = 0; n < inps.length; n++ )
							eles.push( inps[n] );
						for( let n = 0; n < sels.length; n++ )
							eles.push( sels[n] );
						
						for( let a in eles )
						{
							// Skip non numeric element keys!
							if( isNaN( parseInt( a ) ) ) continue;

							let attrname = eles[a].getAttribute( 'name' );

							// User permission
							if( attrname && (
								attrname.substr( 0, 5 ) == 'PUser' ||
								attrname.substr( 0, 6 ) == 'PGroup' ||
								attrname.substr( 0, 7 ) == 'POthers'
							) )
							{
								let letr = attrname.substr( attrname.length - 1, 1 ).toLowerCase();
								let mode = attrname.substr( 1, attrname.length - 2 ).toLowerCase();
								eles[a].checked = permSettings[ mode ].indexOf( letr ) >= 0 ? 'checked' : '';
							}
							// Open with (mimetype integration)
							else if( attrname == 'MimetypeIntegration' )
							{
								( function( ele ) {
									let mn = new Module( 'system' );
									mn.onExecuted = function( re, rd )
									{
										try
										{
											let appForMimetype;
											let extension = icon.Filename.split( '.' );
											extension = '.' + extension[ extension.length - 1 ].toLowerCase();
											let apps = JSON.parse( rd );
											for( let mi = 0; mi < apps.length; mi++ )
											{
												for( let ty = 0; ty < apps[mi].types.length; ty++ )
												{
													if( apps[mi].types[ty] == extension )
													{
														appForMimetype = apps[mi].executable;
														break;
													}
												}
											}
											let m = new Module( 'system' );
											m.onExecuted = function( e, d )
											{
												if( ele )
												{
													try
													{
														let apps = JSON.parse( d );
														let str = '<option value="">Friend Workspace</option>';
														for( let j = 0; j < apps.length; j++ )
														{
															let ex = '';
															if( apps[j].Name == appForMimetype )
																ex = ' selected="selected"';
															str += '<option' + ex + ' value="' + apps[j].Name + '">' + apps[j].Name + '</option>';
														}
														ele.innerHTML = str;
													}
													catch( e )
													{
														ele.innerHTML = '<option value="">No applications available.</option>';
													}
												}
											}
											m.execute( 'listuserapplications' );
										}
										catch( e )
										{
											ele.innerHTML = '<option value="">Unrecognizable file format.</option>';
										}
									}
									mn.execute( 'getmimetypes' );
								} )( eles[ a ] );
							}
							// The public file functionality
							else if( attrname == 'PublicLink' )
							{
								if( icon.SharedLink )
								{
									eles[a].value = icon.SharedLink;
									eles[a].disabled = '';
								}
								else
								{
									eles[a].disabled = 'disabled';
									eles[a].value = '';
								}
							}
							else if( attrname == 'IsPublic' )
							{
								if( icon.Shared && icon.Shared == 'Public' )
								{
									eles[a].checked = 'checked';
								}
								eles[a].onSave = function( e )
								{
									let p = icon.Path;
									if( p.indexOf( '/' ) > 0 )
									{
										p = p.split( '/' );
										p.pop();
										p = p.join( '/' );
										p += '/';
									}
									else if( p.indexOf( ':' ) > 0 )
									{
										p = p.split( ':' )[0];
										p += ':';
									}

									// Set file public
									if( this.checked )
									{
										let m = new Library( 'system.library' );
										m.onExecuted = function( e, d )
										{
											let ele = ( new Door().get( p ) );
											ele.getIcons( false, function( icons, path, test )
											{
												// Update link
												let ic = false;
												for( let b = 0; b < icons.length; b++ )
												{
													if( icons[b].Type != 'File' ) continue;
													if( icons[b].Path == icon.Path )
													{
														ic = icons[b];
														break;
													}
												}
												if( !ic ) return Workspace.refreshWindowByPath( path );;
												for( let b = 0; b < eles.length; b++ )
												{
													if( eles[b].getAttribute( 'name' ) == 'PublicLink' )
													{
														if( ic.SharedLink )
														{
															eles[b].value = ic.SharedLink;
															eles[b].disabled = '';
														}
														else
														{
															eles[b].disabled = 'disabled';
															eles[b].value = '';
														}
													}
												}
												Workspace.refreshWindowByPath( path );
											} );
										}
										m.execute( 'file/expose', { path: icon.Path } );
									}
									// Set file private
									else
									{
										let m = new Library( 'system.library' );
										m.onExecuted = function( e )
										{
											if( e != 'ok' )
											{
												this.checked = true;
											}
											let ele = ( new Door().get( p ) );
											ele.getIcons( false, function( icons, path, test )
											{
												// Update link
												let ic = false;
												for( let b = 0; b < icons.length; b++ )
												{
													if( icons[b].Type != 'File' ) continue;
													if( icons[b].Path == icon.Path )
													{
														ic = icons[b];
														break;
													}
												}
												if( !ic ) return Workspace.refreshWindowByPath( path );;
												for( let b = 0; b < eles.length; b++ )
												{
													if( eles[b].getAttribute( 'name' ) == 'PublicLink' )
													{
														if( ic.SharedLink )
														{
															eles[b].value = ic.SharedLink;
															eles[b].disabled = '';
														}
														else
														{
															eles[b].disabled = 'disabled';
															eles[b].value = '';
														}
													}
												}
												Workspace.refreshWindowByPath( path );
											} );
										}
										m.execute( 'file/conceal', { path: icon.Path } );
									}
								}
							}
						}
						
						// Initialize tab system
						InitTabs( ge( 'IconInfo_' + Workspace.seed ) );
						
						// Check buttons
						let btn = ge( 'IconInfo_' + Workspace.seed ).getElementsByTagName( 'button' );
						let sharingOptions = null;
						for( let aa = 0; aa < btn.length; aa++ )
						{
							if( btn[aa].getAttribute( 'name' ) == 'sharingOptions' )
							{
								sharingOptions = btn[ aa ];
							}
						}
						
						// Check sharing options
						if( sharingOptions )
						{
							sharingOptions.onclick = function( e )
							{
								Workspace.viewSharingOptions( icon.Path );
							}
						}
					}
				}
				f.load();
			}
		}
		else
		{
			console.log( i18n( 'please_choose_an_icon' ) );
		}
	},
	// Set data field on icon info select element
	iconInfoDataField: function( selement, find )
	{
		// Find view object using search
		if( find == true )
		{
			// We should now have a view
			if( selement.nodeName == 'DIV' )
			{
				selement = selement.getElementsByTagName( 'select' );
				let fnd = false;
				if( selement.length )
				{
					for( let z = 0; z < selement.length; z++ )
					{
						// Found the correct select element
						if( selement[z].classList && selement[z].classList.contains( 'IconInfoSelect' ) )
						{
							selement = selement[z];
							fnd = true;
							break;
						}
					}
				}
				if( !fnd )
				{
					return false;
				}
			}
		}
		else find = false;

		// Get the container of the input field / data value
		let part = selement.parentNode.parentNode.parentNode;
		let targ = false;
		let eles = part.getElementsByTagName( 'div' );
		for( let a = 0; a < eles.length; a++ )
		{
			if( eles[a].classList && eles[a].classList.contains( 'FieldInfo' ) )
			{
				targ = eles[a];
				break;
			}
		}

		// Find the current element
		let opts = selement.getElementsByTagName( 'option' );
		let opt = false;
		for( let a = 0; a < opts.length; a++ )
		{
			if( opts[a].selected || ( find && a == 0 ) )
			{
				opts[a].selected = 'selected';
				opt = opts[a];
				break;
			}
		}

		if( targ && opt )
		{
			if( opt.getAttribute( 'type' ) )
			{
				let m = new Library( 'system.library' );
				m.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						switch( opt.getAttribute( 'type' ).toLowerCase() )
						{
							case 'string':
								targ.innerHTML = '<input type="text" class="FullWidth InputHeight" value="' + d + '"/>';
								break;
							case 'text':
								targ.innerHTML = '<textarea class="FullWidth" style="height: 180px">' + d + '</textarea>';
								break;
							case 'image/jpeg':
							case 'image/jpg':
							case 'image/gif':
							case 'image/png':
								let encoding = opt.getAttribute( 'encoding' );
								if( encoding == 'base64' )
								{
									targ.innerHTML = '<img width="100%" height="auto" src="data:' + opt.getAttribute( 'type' ).toLowerCase() + ';base64,' + d + '"/>';
								}
								else
								{
									targ.innerHTML = i18n( 'i18n_non_compatible_field_information' );
								}
								break;
							default:
								targ.innerHTML = i18n( 'i18n_no_field_information' );
								break;
						}
					}
					else
					{
						targ.innerHTML = i18n( 'i18n_no_field_information' );
					}
				}
				m.forceHTTP = true;
				m.execute( 'file/infoget', { key: opt.getAttribute( 'value' ), path: opt.parentNode.getAttribute( 'path' ) } );
			}
			else
			{
				targ.innerHTML = i18n( 'i18n_no_field_information' );
			}
		}
	},
	// element from which to get the window, and inst for instance id
	saveFileInfo: function( ele, inst )
	{
		// Find window object...
		while( !ele.viewId )
		{
			if( ele == document.body ) return false;
			ele = ele.parentNode;
		}

		// TODO: Use dos commands instead! 'protect' and 'rename' and 'info'!
		// Create a module object
		let l = new Module( 'system' );

		// Ok, so now we can get all input fields etc..
		let args = {};
		let inps = ele.getElementsByTagName( 'input' );
		let texts = ele.getElementsByTagName( 'textarea' );
		let out = [];
		for( let b in texts ) out.push( texts[b] );
		for( let b in inps )
		{
			if( isNaN( parseInt( b ) ) ) continue;
			if( inps[b].onSave ) inps[b].onSave();
			out.push( inps[b] );
		}

		// Add arguments
		for( let a = 0; a < out.length; a++ )
		{
			// Skip permission inputs
			if( out[a].getAttribute && out[a].getAttribute( 'permission' ) )
				continue;
			if( out[a].type == 'radio' )
			{
				if( out[a].checked )
					args[out[a].name] = out[a].value;
			}
			else
			{
				args[out[a].name] = out[a].type == 'checkbox' ? ( out[a].checked ? '1' : '0' ) : out[a].value;
			}
		}

		// Permissions now
		let permissions = ge( 'Permissions' + inst );
		let perms = '';
		if( permissions && ( perms = permissions.getElementsByTagName( 'input' ) ) )
		{
			let permopts = [];
			for( let a = 0; a < perms.length; a++ )
			{
				if( !perms[ a ].checked ) continue;
				let par = perms[a].parentNode.nodeName;
				if( par != 'P' )
					continue;
				if( perms[a].getAttribute( 'permission' ) )
					permopts.push( [ perms[a].getAttribute( 'permission' ) ] );
				let select = perms[a].parentNode.getElementsByTagName( 'select' );
			}
			args.Permissions = permopts;
		}
		// Ok, different set of permissions
		else
		{
			// The permission inputs
			let permInputs = { user: '-----', group: '-----', others: '-----' };
			let permOrder = { 'a': 0, 'r': 1, 'w': 2, 'e': 3, 'd': 4 };
			// Now we're ready to find these permissions!

			// Setup public / private file
			for( let h in inps )
			{
				// Skip non numeric element keys!
				if( !inps[h].getAttribute ) continue;

				let attrname = inps[h].getAttribute( 'name' );

				// User permission
				if( attrname && (
					attrname.substr( 0, 5 ) == 'PUser' ||
					attrname.substr( 0, 6 ) == 'PGroup' ||
					attrname.substr( 0, 7 ) == 'POthers'
				) )
				{
					let letr = attrname.substr( attrname.length - 1, 1 ).toLowerCase();
					let mode = attrname.substr( 1, attrname.length - 2 ).toLowerCase();
					let indx = permOrder[ letr ];

					// Javascript's wonderful way of changing a single character.. Whooopie
					permInputs[ mode ] = permInputs[mode].substr( 0, indx  ) +
						( inps[h].checked ? letr : '-' ) +
						permInputs[mode].substr( indx + 1, permInputs[mode].length - indx );
				}
			}

			// Update permissions
			let perm = {};
			if( Trim( permInputs.user ) )
				perm.user = Trim( permInputs.user );
			if( Trim( permInputs.group ) )
				perm.group = Trim( permInputs.group );
			if( Trim( permInputs.others ) )
				perm.others = Trim( permInputs.others );
			perm.path = args.Path;

			// Is this a dormant drive?
			let drive = args.Path.split( ':' )[ 0 ] + ':';
			let done = false;
			let doors = DormantMaster.getDoors();
			if( doors )
			{
				for( let d in doors )
				{
					let door = doors[ d ];
					if( door.Title == drive )
					{
						if ( door.Dormant )
						{
							done = true;
							door.Dormant.setFileInformation( perm, function( response )
							{
							} );
						}
					}
				}
			}
			// Normal drive
			if ( !done )
			{
				let la = new Library( 'system.library' );
				la.onExecuted = function(){};
				la.execute( 'file/protect', perm );
			}
		}

		// Security domain
		let sdomain = ge( 'SecurityDomains' + inst );
		if( sdomain )
		{
			let sel = sdomain.getElementsByTagName( 'select' );
			if( sel && sel[0] )
			{
				args.Domains = sel[0].value;
			}
		}
		
		// Execute module action
		l.onExecuted = function( r, d )
		{
			// A disk
			if( args.visibility )
			{
				let m = new Library( 'system.library' );
				m.onExecuted = function()
				{
					Workspace.refreshDesktop( false, true );
					CloseWindow( ele );
				}
				m.execute( 'device/refresh', { devname: args.Filename } );
			}
			else
			{
			    CloseWindow( ele );
			}
			
		}
		l.execute( 'fileinfo', args );

	},
	// Just get active icon, no arguments
	getActiveIcon: function()
	{
		let icon = false;
		if( window.currentMovable )
		{
			let w = window.currentMovable;
			if ( w.content ) w = w.content;
			if ( w.icons )
			{
				for( let a = 0; a < w.icons.length; a++ )
				{
					if( w.icons[a].selected )
					{
						icon = w.icons[a];
						break;
					}
				}
			}
		}
		else if( this.directoryView )
		{
			let eles = this.screen.contentDiv.icons;
			for( let a = 0; a < eles.length; a++ )
			{
				if( eles[a].selected )
				{
					icon = eles[a];
					break;
				}
			}
		}
		return icon;
	},
	// Just refresh before calling a callback
	refreshFileInfo: function( callback )
	{
		let icon = this.getActiveIcon();
		if( !icon ) return;

		if( icon.Type == 'Door' )
		{
			let m = new Library( 'system.library' );
			m.onExecuted = function()
			{
				Workspace.getMountlist( callback, false );
			}
			m.execute( 'device/refresh', { devname: icon.Volume.split( ':' )[0] } );
			return;
		}
		callback();
	},
	closeFileInfo: function( ele )
	{
		// Find window object...
		while( !ele.fileInfo && ele.className.indexOf( 'Content' ) < 0 )
		{
			if( ele == document.body ) return false;
			ele = ele.parentNode;
		}
		// Close it!
		CloseView( ele );
	},
	uploadFile: function( id )
	{
		if( !Workspace.sessionId ) return;

		if( id )
		{
			let form = ge( id );

			let uppath = ge( 'fileUpload' ).path ? ge( 'fileUpload' ).path.value : '';

			// Find target frame
			let resultfr = ge( 'fileUploadFrame' );

			// Need target frame to complete job
			if( resultfr && uppath.length )
			{
				// We are busy!
				if( form.classList.contains( 'Busy' ) )
				{
					return;
				}
				ge( 'uploadFeedback' ).parentNode.classList.add( 'Busy' );
				form.submit();
				form.classList.add( 'Busy' );
				let f = function( e )
				{
					form.classList.remove( 'Busy' );
					ge( 'uploadFeedback' ).parentNode.classList.remove( 'Busy' );
					
					let check = new Library( 'system.library' );
					check.onExecuted = function( ee, dd )
					{
						if( ee == 'ok' )
						{
							for( let a in movableWindows )
							{
								let w = movableWindows[a];
								if( w.content ) w = w.content;
								if( w.fileInfo )
								{
									if( w.fileInfo.Path == uppath )
									{
										Workspace.diskNotification( [ w ], 'refresh' );
									}
								}
							}
						
							console.log( 'UPLOAD COMPLETED ' + ee, dd );
							Notify( { title: i18n( 'i18n_upload_completed' ), text: i18n( 'i18n_upload_completed_description' ) } );
							if( typeof Workspace.uploadWindow.close == 'function' ) Workspace.uploadWindow.close();
							Workspace.refreshWindowByPath( uppath );
						}
						else
						{
							console.log( 'ERROR UPLOAD ' + dd );
							Notify( { title: i18n( 'i18n_upload_failed' ), text: i18n( 'i18n_upload_failed_description' ) } );
						}
					
						resultfr.removeEventListener( 'load', f );
					}
					check.execute( 'file/info', { path: uppath + uploadFileField.value.split( '\\' ).pop() } );
					
					ge( 'uploadFileField' ).value = '';
				};
				resultfr.addEventListener( 'load', f );
			}
			return;
		}

		if( this.uploadWindow )
		{
			return this.uploadWindow.activate();
		}

		let fi = false;
		if( currentMovable && currentMovable.content.fileInfo )
			fi = currentMovable.content.fileInfo.Path;
		
		let w = new View( {
			title: i18n( 'i18n_choose_file_to_upload' ),
			width: 370,
			'min-width': 370,
			height: 160,
			'min-height': 160,
			id: 'fileupload',
			resize: true,
			screen: Workspace.screen
		} );
		
		this.uploadWindow = w;
		w.onClose = function()
		{
			Workspace.uploadWindow = null;
		}
		
		let f = new File( '/webclient/templates/file_upload.html' );
		f.i18n()
		f.onLoad = function( data )
		{
			w.setContent( data );
			if( fi )
			{
				let eles = w.getElementsByTagName( 'input' );
				for( let v = 0; v < eles.length; v++ )
				{
					if( eles[v].name && eles[v].name == 'path' )
					{
						eles[v].value = fi;
						break;
					}
				}
			}
			ge( 'uploadFileField' ).addEventListener('change', Workspace.uploadFileChanged );
			ge( 'fileUpload' ).sessionid.value = Workspace.sessionId;
		}
		f.load();
	},
	uploadFileChanged: function(e)
	{
		let listString = '';
		let uploadSize = 0;
		
		if( !e.target.files ) return; // should not happen...
		for( i = 0; i < e.target.files.length; i++ )
		{
			listString += ( listString != '' ? ', ' : '' ) + e.target.files[i].name;
			uploadSize += parseInt( e.target.files[i].size );
		}
		ge('uploadFileFileDisplay').innerHTML = i18n('i18n_selected_files') + ': ' + listString + ' (' + i18n('i18n_in_total') + ' ' + Friend.Utilities.humanFileSize( uploadSize ) + ')';

		let oh = Workspace.uploadWindow.getFlag('height');
		oh += parseInt( ge('uploadFileFileDisplay').clientHeight ) + 12;

		Workspace.uploadWindow.setFlag('min-height',oh);
	},
	findUploadPath: function()
	{
		if( !Workspace.sessionId ) return;

		if( this.fupdialog ) return;
		
		let inps = currentMovable.content.getElementsByTagName( 'input' );
		let path = 'Home:Downloads/';
		for( let a = 0; a < inps.length; a++ )
		{
			if( inps[a].name == 'path' )
			{
				path = inps[a].value;
				break;
			}
		}
		
		let flags = {
			path: path,
			triggerFunction: function( arr )
			{
				if( Workspace.fupdialog )
				{
					let fu = ge( 'fileUpload' );
					if( fu )
					{
						if( arr == 'Mountlist:' || !arr )
						{
							arr = 'Home:';
						}
						fu.path.value = arr;
					}
					Workspace.fupdialog = false;
				}
			},
			type: 'path',
			mainView: window.currentMovable ? currentMovable.windowObject : null
		};
		this.fupdialog = new Filedialog( flags );
		return;
	},
	// Simple logout..
	logout: function()
	{
		Friend.User.Logout();
	},
	externalLogout: function()
	{
		let wl = new View( {
			title: 'Logout',
			width: 370,
			'min-width': 370,
			height: 170,
			'min-height': 170,
			'max-height': 170,
			id: 'fileupload',
			screen: Workspace.screen
		} );

		wl.setRichContentUrl( Workspace.logoutURL, '', false, false, function(){
			wl.close();
			Workspace.logoutURL = false;
			if( typeof friendApp != 'undefined' && typeof friendApp.exit == 'function')
			{
				setTimeout( 'Workspace.logout()', 1000 );
			}
			else
			{
				Workspace.logout();
			}
		});
	},
	// Pick the prev window
	handleBackButton: function()
	{
		if( !this.mobileViews )
		{
			this.mobileViews = {
				prev: null,
				application: currentMovable ? currentMovable.applicationId : false
			};
		}
		
		// Just close app menu
		if( Workspace.appMenu && document.body.classList.contains( 'AppsShowing' ) )
		{
			return Workspace.appMenu.onclick();
		}
		
		// Update view history with current application id
		if( currentMovable )
		{
			let cm = currentMovable;
			FocusOnNothing();
			if( cm.applicationId )
			{
				// Tell the application
				cm.windowObject.sendMessage( {
					command: 'mobilebackbutton'
				} );
				// Check with standard functionality
				if( window._getAppByAppId )
				{
					let app = _getAppByAppId( cm.applicationId );
					if( app.mainView == cm.windowObject )
					{
						if( !cm.windowObject.mobileBack.classList.contains( 'Showing' ) )
						{
							Workspace.appMenu.onclick();
						}
						else
						{
							_ActivateWindow( app.mainView.content.parentNode );
						}
						return;
					}
				}
				// Just go back
				if( cm.windowObject.parentView )
				{
					cm.windowObject.parentView.activate();
					return;
				}
				if( app.mainView )
				{
					app.mainView.activate();
					return;
				}
				this.mobileViews.application = cm.applicationId;
			}
			else if( cm.content.directoryview )
			{
				if( cm.content.fileInfo.Path == 'Mountlist:' )
				{
					if( cm.windowObject.dialog )
					{
						return cm.windowObject.close();
					}
					else
					{
						return Workspace.appMenu.onclick();
					}
				}
				return cm.content.directoryview.buttonUp.onclick();
			}
			// Just go back
			else if( cm.windowObject.parentView )
			{
				let pv = cm.windowObject.parentView.windowObject;
				pv.activate();
				// Delayed close other
				setTimeout( function()
				{
					cm.windowObject.close();
				}, 750 );
				return;
			}
		}
		for( let a = 0; a < Friend.GUI.view.viewHistory.length; a++ )
		{
			let fg = Friend.GUI.view.viewHistory[ a ];
			let pg = Friend.GUI.view.viewHistory[ a - 1 ];
			// Not the same app, just revert
			if( fg.applicationId != this.mobileViews.application )
				break;
			if( a > 0 && currentMovable == fg && ( !this.mobileViews.prev || this.mobileViews.prev != pg ) )
			{
				this.mobileViews.prev = fg;
				_ActivateWindow( pg );
				return;
			}
		}
	},
	// Get a list of all applications ------------------------------------------
	listApplications: function()
	{
		let out = [];
		for( let a = 0; a < this.applications.length; a++ )
		{
			out.push( {
				name: this.applications[a].applicationName,
				id: this.applications[a].applicationId,
				applicationNumber: this.applications[a].applicationNumber
			} );
		}
		return out;
	},
	// Check if an icon with type .{type} was selected
	selectedIconByType: function( type )
	{
		let c = currentMovable && currentMovable.content && currentMovable.content.directoryview ?
			currentMovable.content.directoryview : false;
		if( !c ) return false;

		let ic = currentMovable.content.icons;
		if( !ic )
		{
			ic = Workspace.screen.contentDiv.icons;
		}
		for( let a = 0; a < ic.length; a++ )
		{
			let t = ic[a].Filename ? ic[a].Filename : ic[a].Title;
			if( t )
			{
				let s = t.split( '.' );
				s = s[s.length-1];
				if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
				{
					if( s.toLowerCase() == type.toLowerCase() )
						return true;
				}
			}
		}
		return false;
	},
	// Open folder (tree directory)
	openFolder: function( event )
	{
		Notify( { title: i18n( 'i18n_zip_start' ), text: i18n( 'i18n_zip_startdesc' ) } );
		let ic = currentMovable.content.icons;
		let f = [];
		let dest = false;
		let icon;
		for( let a = 0; a < ic.length; a++ )
		{
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				if( !dest )
				{
					dest = ic[a].Path;
					icon = ic[a];
				}
				f.push( ic[a].Path );
			}
		}
		if( dest && f.length )
		{
			FriendDOS.getFileInfo( dest, function( e, d )
			{
				if( !e )
				{
					return dcallback( false, { response: 'Could not get file information.' } );
				}
				else
				{
					if( !e )
						return dcallback( false, { response: 'Could not get file information.' } );
					else
					{
						let fileInfo;
						try
						{
							fileInfo = JSON.parse( d );
						} catch( e ) {}
						if ( fileInfo )
						{
							icon.domNode.noRun = true;
							OpenWindowByFileinfo( fileInfo, event, icon.domNode, false );
						}
					}
				}
			} );
		}
	},
	// Compress files
	zipFiles: function()
	{
		let zipPath = currentMovable.content.fileInfo.Path;
		
		let ic = currentMovable.content.icons;
		let f = [];
		let dest = false;
		for( let a = 0; a < ic.length; a++ )
		{
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				if( !dest ) dest = ic[a].Path;
				f.push( ic[a].Path );
			}
		}
		
		if( dest && f.length )
		{
			Notify( { title: i18n( 'i18n_zip_start' ), text: i18n( 'i18n_zip_startdesc' ) } );
			
			// Files
			if( dest.indexOf( '.' ) > 0 && dest.substr( dest.length - 1, 1 ) != '/' )
			{
				dest = dest.split( '.' );
				dest.pop();
				dest = dest.join( '.' )
			}
			// Folders
			else
			{
				if( dest.substr( dest.length - 1, 1 ) == '/' )
				{
					dest = dest.substr( 0, dest.length - 1 );
				}
			}
			dest += '.zip';

			let files = f.join( ';' );
			let s = new Library( 'system.library' );
			s.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					let p = ic[0].Path;
					if( p.indexOf( '/' ) > 0 )
					{
						p = p.split( '/' );
						p.pop();
						p = p.join( '/' );
					}
					else if( p.indexOf( ':' ) > 0 )
					{
						p = p.split( ':' )[0] + ':';
					}
					let lastChar = p.substr( 0, p.length - 1 );
					if( lastChar != ':' && lastChar != ':' ) p += '/';
					Workspace.refreshWindowByPath( p );
					Notify( { title: i18n( 'i18n_zip_completed' ), text: i18n( 'i18n_zip_comdesc' ) + ': ' + dest } );
				}
				else
				{
					Notify( { title: i18n( 'i18n_zip_not_completed' ), text: i18n( 'i18n_zip_not_comdesc' ) + ': ' +  dest } );
				}
			}
			let lpath = dest;

			if( lpath.lastIndexOf( '/' ) > 0 )
			{
				lpath = lpath.slice( 0, lpath.lastIndexOf( '/' )+1 );
			}
			else if( lpath.lastIndexOf( ':' ) > 0 )
			{
				lpath = lpath.slice( 0, lpath.lastIndexOf( ':' )+1 );
			}
			
			s.execute( 'file/compress', { source: zipPath, files: files, archiver: 'zip', destination: dest, path: lpath } );
		}
		else
		{
			Notify( { title: i18n( 'i18n_zip_start_none' ), text: i18n( 'i18n_zip_startdesc_none' ) } );
		}
	},
	// Decompress files
	unzipFiles: function()
	{
		let ic = currentMovable.content.icons;
		let f = [];
		for( let a = 0; a < ic.length; a++ )
		{
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				f.push( { Filename: ic[a].Filename, Path: ic[a].Path, Type: ic[a].Type } );
			}
		}
		if( f.length )
		{
			Notify( { title: i18n( 'i18n_unzip_start' ), text: i18n( 'i18n_unzip_startdesc' ) } );
			for( let a = 0; a < f.length; a++ )
			{
				let s = new Library( 'system.library' );
				s.file = f[a].Path;
				s.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						let res = null, progress = null;
						try {
							res = JSON.parse( d );
						} catch( e ) {
							console.log( 'file/decompress - failed to parse return data', d );
						}
						if ( res && res.PID )
							progress = new Progress( res.PID, Workspace.conn );
						else console.log( 'file/decompress - invalid return data', res );

						let p = ic[0].Path;
						if( p.indexOf( '/' ) > 0 )
						{
							p = p.split( '/' );
							p.pop();
							p = p.join( '/' );
						}
						else if( p.indexOf( ':' ) > 0 )
						{
							p = p.split( ':' )[0] + ':';
						}
						let lastChar = p.substr( 0, p.length - 1 );
						if( lastChar != ':' && lastChar != ':' ) p += '/';
						Workspace.refreshWindowByPath( p );

						Notify( { title: i18n( 'i18n_unzip_completed' ), text: i18n( 'i18n_unzip_comdesc' ) + ': ' + decodeURIComponent( this.file ) } );
					}
					else
					{
						Notify( { title: i18n( 'i18n_unzip_failed' ), text: i18n( 'i18n_unzip_failed_desc' ) + ': ' + decodeURIComponent( this.file ) } );
					}
				}
				s.execute( 'file/decompress', { path: f[a].Path, archiver: 'zip', detachtask : true } );
			}
		}
		else
		{
			Notify( { title: i18n( 'i18n_unzip_start_none' ), text: i18n( 'i18n_unzip_startdesc_none' ) } );
		}
	},
	// Refresh Doors menu recursively ------------------------------------------
	refreshMenu: function( prohibitworkspaceMenu, activeElement = false )
	{	
		// Current has icons?
		let iconsAvailable = currentMovable && currentMovable.content && currentMovable.content.directoryview ? true : false;
		let volumeIcon = false;

		if( iconsAvailable && typeof currentMovable.content.checkSelected == 'function' ) {  currentMovable.content.checkSelected(); }
		else if( !currentMovable && currentScreen.screen._screen.icons )
			currentScreen.screen.contentDiv.checkSelected();

		let iconsSelected = Friend.iconsSelectedCount > 0;
		
		let iconsInClipboard = ( Friend.workspaceClipBoard && Friend.workspaceClipBoard.length > 0 );

		let canUnmount = false;
		let cannotWrite = false;
		let dormant = false;
		let canBeShared = false;
		let shareIcon = null;
		let downloadIcon = null;
		let directoryIcon = false;
		let sharableFile = false;
		let sharedVolume = false;
		let fileIcon = false;
		let shareCount = 0;
		let finf = activeElement ? activeElement.fileInfo : false;
		let isHomeDrive = finf && finf.Volume && finf.Volume == 'Home:' ? true : false;
		let isSharedDrive = finf && finf.Volume && finf.Volume == 'Shared:' ? true : false;
		
		if( iconsSelected )
		{
			canUnmount = true;
			
			let ics = currentMovable && currentMovable.content ? currentMovable.content.icons : currentScreen.screen._screen.icons;
			for( let a in ics )
			{
				if( ics[a].domNode && ics[a].domNode.classList )
				{
					if( ics[a].domNode.classList.contains( 'Selected' ) )
					{
						if( ics[a].Type == 'Door' )
						{
							volumeIcon = true;
						}
						
						if ( ics[ a ].Type == 'File' || ics[ a ].Type == 'Directory' )
						{
							if( ics[ a ].Type == 'File' )
							{
								fileIcon = ics[ a ];
								sharableFile = true;
							}
							else sharableFile = false;
							
							let drive = ics[ a ].Path.split( ':' )[ 0 ];
						
							// Share option only if Friend Network is on and not in the system disk
							if ( Workspace.friendNetworkEnabled )
							{
								if ( FriendNetworkShare.activated )
								{
									if ( drive != 'System' )
									{
										shareIcon = ics[ a ];
										shareCount++;
										canBeShared = true;
										if( ics[a].Type == 'Directory' )
											directoryIcon = true;
									}
								}
							}
							
							if( drive != 'System' )
								downloadIcon = ics[a];

							// File or directory on a Dormant drive? Check if write-only
							if ( ics[ a ].Dormant )
							{
								dormant = true;
								if ( !ics[ a ].Dormant.dosActions )
									cannotWrite = false;
							}
						}
						
						if( ics[ a ].Path )
						{
							if( ics[ a ].Path.indexOf( 'Shared:' ) == 0 )
							{
								sharableFile = false;
								sharedVolume = true;
							}
						}
						
						if( ics[a].Volume == 'System:' )
						{
							canUnmount = false;
						}
					}
				}
			}
		}
		if ( shareCount > 1 )
			canBeShared = false;
		
		// This will override these things
		if( isHomeDrive || isSharedDrive )
		{
			canUnmount = false;
		}

		// Init menu -----------------------------------------------------------
		let tools = '';
		if( typeof( this.menu['tools'] ) != 'undefined' )
		{
			tools = this.menu['tools'].join ( "\n" );
		}

		// We got windows?
		let windowsOpened = false;
		for( let a in movableWindows )
		{
			windowsOpened = true;
			break;
		}

		let cnt = null;
		let systemDrive = false;
		if( currentMovable )
		{
			currentMovable.content;
			if( cnt ) systemDrive = cnt && cnt.fileInfo && cnt.fileInfo.Volume == 'System:';
		}
		
		let sConf = Workspace.serverConfig;
		
		// Setup Doors menu
		this.menu = [
			{
				name: i18n( 'menu_system' ),
				icon: 'MenuSystem',
				items:
				[
					{
						name:	i18n( 'menu_about' ),
						command: function(){ AboutFriendUP(); }
					},
					{
						name:	i18n( 'my_account' ),
						command: function(){ Workspace.accountSetup(); }
					},
					( sConf && sConf.invitesEnabled ? {
						name:	i18n( 'invite_a_friend' ),
						command: function(){ Workspace.inviteFriend(); }
					} : false ),
					{
						name:	i18n( 'menu_examine_system' ),
						command: function()
						{ 
							let d = false;
							for( let a = 0; a < Workspace.icons.length; a++ )
							{
								if( Workspace.icons[a].Volume == 'System:' )
								{
									d = Workspace.icons[a];
									break;
								}
							}
							if( d )
							{
								OpenWindowByFileinfo( d, false );
							}
						},
						invisible: !( Workspace.userLevel == 'admin' )
					},
					{
						divider: true
					},
					{
						name:   i18n( 'i18n_search_files' ),
						command: function(){ Workspace.showSearch();  }
					},
					{
						divider: true
					},
					{
						name:	i18n( 'menu_refresh_desktop' ),
						command: function(){ Workspace.refreshDesktop( false, true ); }
					},
					!( window.friendApp || window.isSettopBox ) ? {
						name:	i18n( 'menu_fullscreen' ),
						command: function(){ Workspace.fullscreen(); }
					}: false,
					{
						divider: true
					},
					{
						name:	i18n( 'menu_run_command' ),
						command: function(){ Workspace.showLauncher(); }
					},
					{
						name:	i18n( 'menu_new_shell' ),
						command: function(){ ExecuteApplication( 'FriendShell' ); }
					},
					{
						name:	i18n( 'menu_upload_file' ),
						command: function(){ Workspace.uploadFile(); }
					},
					{
						divider: true
					},
					{
						name:	(typeof friendApp != 'undefined' && typeof friendApp.exit == 'function' ?  i18n('menu_exit') : i18n( 'menu_log_out' ) ),
						command: function(){ 
							if( window.friendBook )
							{
								// Just leave!
								Workspace.leave = function(){};
								Workspace.doLeave = function(){};
								window.close();
							}
							else 
							{
								Workspace.logout();
							} 
						}
					}
				]
			},
			/*{
				name: i18n( 'menu_edit' ),
				items:
				[
					{
						name: i18n( 'menu_clear_clipboard' ),
						command: function()
						{
							ClipboardSet( '' );
						}
					}
				]
			},*/
			{
				name: i18n( 'menu_icons' ),
				icon: 'MenuFile',
				items:
				[
					{
						name:	i18n( 'menu_copy' ),
						command: function() { Workspace.copyFiles(); },
						disabled: !iconsSelected || volumeIcon || systemDrive
					},
					{
						name:	i18n( 'menu_paste' ),
						command: function( e ) { Workspace.pasteFiles( e ); },
						disabled: sharedVolume || !iconsInClipboard || systemDrive || cannotWrite
					},
					{
						name:	i18n( 'menu_new_weblink' ),
						command: function() { Workspace.weblink(); },
						disabled: sharedVolume || !iconsAvailable || systemDrive || dormant
					},
					{
						name:	i18n( 'menu_new_directory' ),
						command: function() { Workspace.newDirectory(); },
						disabled: sharedVolume || !iconsAvailable || systemDrive || cannotWrite
					},
					{
						name:	i18n( 'menu_show_icon_information' ),
						command: function(){ Workspace.refreshFileInfo( function(){ Workspace.fileInfo(); } ) },
						disabled: !iconsSelected
					},
					{
						name:	i18n( 'menu_edit_filename' ),
						command: function() { Workspace.renameFile(); },
						disabled: sharedVolume || ( !iconsSelected || volumeIcon || systemDrive || cannotWrite )
					},
					{
						name:	i18n( 'menu_zip' ),
						command: function() { Workspace.zipFiles(); },
						disabled: sharedVolume || ( !iconsSelected || volumeIcon || systemDrive || cannotWrite || dormant )
					},
					{
						name:	i18n( 'menu_unzip' ),
						command: function() { Workspace.unzipFiles(); },
						disabled: sharedVolume || !iconsSelected || !Workspace.selectedIconByType( 'zip' ) || systemDrive || cannotWrite || dormant
					},
					//{
					//	name:	i18n( 'menu_openfolder' ),
					//	command: function( event ) { Workspace.openFolder( event ); },
					//	disabled: ( !iconsSelected || volumeIcon  || systemDrive )
					//},
					{
						name:	sharedVolume ? i18n( 'menu_unshare' ) : i18n( 'menu_delete' ),
						command: function() { Workspace.deleteFile( sharedVolume ? 'unshare' : false ); },
						disabled: ( !iconsSelected || volumeIcon ) || systemDrive || cannotWrite
					},
					// Add sharing
					{
						name: i18n( 'menu_share_file' ),
						command: function()
						{
							Workspace.viewSharingOptions( fileIcon.Path );
						},
						disabled: !( sharableFile && !sharedVolume )
					},
					// Add sharing
					{
						name: i18n( 'menu_share_info' ),
						command: function()
						{
							currentMovable.content.directoryview.ShowShareDialog( [ fileIcon.domNode ], 'shareinfo' );
						},
						disabled: ( sharableFile && !sharedVolume ) || volumeIcon || fileIcon.Type != 'File' || !fileIcon.ExternPath || fileIcon.Owner != Workspace.userId
					},
					{
						divider: true
					},
					{
						name:   i18n( 'menu_unmount_filesystem' ),
						command: function(){
							let s = ge( 'DoorsScreen' );
							let p = false;
							if( s && s.screen && s.screen._screen.icons )
							{
								let ics = s.screen._screen.icons;
								for( let a = 0; a < ics.length; a++ )
								{
									if( ics[a].domNode.className.indexOf( ' Selected' ) > 0 )
									{
										p = ics[a].Path;
										break;
									}
								}
							}
							// For the path
							if( p )
							{
								let f = new FriendLibrary( 'system.library' );
								f.onExecuted = function( e, d )
								{ 
									if( e != 'ok' )
									{
										let js = null;
										try{ js = JSON.parse( d ); } catch( e2 ){};
										let response = js.response;
										if( !response || typeof( response ) == 'undefined' )
										{
											if( js.errorcode )
											{
												response = 'Server returned error ' + js.errorcode;
											}
										}
										else
										{
											response = 'Server responded: ' + response;
											if( js.errorcode )
												response += ' (error code ' + js.errorcode + ')';
										}
										return Notify( { title: i18n( 'Error unmounting' ), text: response } );
									}
									Workspace.refreshDesktop( false, true ); 
								}
								let args = {
									command: 'unmount',
									devname: p.split( ':' ).join ( '' ),
									path: p
								};
								f.execute( 'device', args );
							}
						},
						disabled: !volumeIcon || !canUnmount
					},
					{
						name:   i18n( 'menu_close_idle_connections' ),
						command: function(){
							if( DeepestField && DeepestField.connections )
							{
								let df = DeepestField;
								for( let a in df.connections )
								{
									let d = df.connections[a];
									d.object.close(); // Close connection
									if( d && d.parentNode )
									{
										try
										{
											d.parentNode.removeChild( d );
										}
										catch( e )
										{
										}
									}
								}
							}
						},
						disabled: isMobile || _cajax_process_count <= 0
					},
					{
						name:	i18n( 'menu_share' ),
						command: function() { FriendNetworkShare.sharePath( shareIcon.Path, shareIcon.Type ); },
						disabled: ( !iconsSelected || volumeIcon ) || systemDrive || cannotWrite || !canBeShared
					},
					{
						name:	i18n( 'menu_download' ),
						command: function() { 
							// Find icon for download
							if( currentMovable )
							{
								let selPath = [];
								let dv = currentMovable.content;
								if( dv )
								{
									for( let a = 0; a < dv.icons.length; a++ )
									{
										let ic = dv.icons[a];
										if( ic.domNode && ic.domNode.fileInfo && ic.domNode.fileInfo.Type == 'File' && ic.selected )
										{
											selPath.push( ic.domNode.fileInfo.Path );
										}
									}
								}
								if( selPath.length >= 1 )
								{
									for( let a = 0; a < selPath.length; a++ )
									{
										Workspace.download( selPath[a] ); 
									}
								}
								else
								{
									Notify( { title: i18n( 'i18n_could_not_download' ), text: i18n( 'i18n_file_cannot_be_downloaded' ) } );
								}
							}
						},
						disabled: ( !iconsSelected || volumeIcon || systemDrive || dormant || directoryIcon )
					}
				]
			},
			{
				name: i18n( 'menu_window' ),
				icon: 'MenuWindow',
				items:
				[
					/*{
						name:	i18n( 'menu_open_parent_directory' ),
						command: function(){ Workspace.openParentDirectory(); },
						disabled: !iconsAvailable || volumeIcon
					},*/
					// New directoryview
					currentMovable && currentMovable.content && currentMovable.content.directoryview ? {
						name: i18n( 'menu_new_window' ),
						command: function(){ Workspace.newDirectoryView(); }
					} : false,
					{
						name:	i18n( 'menu_refresh_directory' ),
						command: function(){ Workspace.refreshDirectory(); },
						disabled: !iconsAvailable
					},
					isMobile ? false : {
					
						name:   i18n( 'menu_hide_all_views' ),
						command: function(){ Workspace.hideAllViews(); },
						disabled: !windowsOpened
					},
					isMobile ? false : {
						name:   i18n( 'menu_hide_inactive_views' ),
						command: function(){ Workspace.hideInactiveViews(); },
						disabled: !windowsOpened
					},
					currentMovable && currentMovable.content && currentMovable.content.directoryview ? {
						name: i18n( currentMovable.content.directoryview.showHiddenFiles ? i18n( 'menu_hide_hidden_files' ) : i18n( 'menu_show_hidden_files' ) ),
						command: function(){ Workspace.toggleHiddenFiles(); }
					} : false,
					/*{
						name:	i18n( 'menu_open_directory' ),
						command: function(){ Workspace.openDirectory(); },
						disabled: !iconsSelected
					},*/
					!isMobile && iconsAvailable ? {
						name: i18n( 'menu_show_as' ),
						items:
						[
							{
								name:	 i18n( 'menu_show_as_icons' ),
								command: function(){ Workspace.viewDirectory( 'iconview' ); }
							},
							{
								name:	 i18n( 'menu_show_as_compact' ),
								command: function(){ Workspace.viewDirectory( 'compact' ); }
							},
							{
								name:	 i18n( 'menu_show_as_gallery' ),
								command: function(){ Workspace.viewDirectory( 'imageview' ); }
							},
							{
								name:	 i18n( 'menu_show_as_list' ),
								command: function(){ Workspace.viewDirectory( 'listview' ); }
							}/*,
							{
								name:	i18n( 'menu_show_as_columns' ),
								command: function(){ Workspace.viewDirectory('columnview'); }
							}*/
						]
					} : false,
					/*{
						name:	i18n( 'menu_snapshot' ),
						items:
						[
							{
								name:	i18n( 'menu_snapshot_all' ),
								command: function(){ SaveWindowStorage(); }
							}
						]
					},*/
					{
						name:	i18n( 'menu_close_window' ),
						command: function(){ CloseWindow( window.currentMovable ); if( isMobile ) Workspace.exitMobileMenu(); },
						disabled: !windowsOpened || !window.currentMovable
					}
				]
			},
			{
				name: i18n( 'menu_help' ),
				items: [
					{
						name: i18n( 'menu_help_tutorials' ),
						command: function(){ ShowAllTutorials(); }
					},
					{
						name: i18n( 'menu_help_bug' ),
						command: function(){ window.open( 'https://github.com/FriendUPCloud/friendup/issues', '', '' ); }
					},
					{
						name: i18n( 'menu_help_manual' ),
						command: function(){ window.open( 'https://docs.friendos.com/docs/end-user-documentation/', '', '' ); }
					}
				]
			}
			/*,
			{
				name: i18n( 'menu_bookmarks' ),
				items: Workspace.getBookmarks()
			}*/
		];
		
		// Generate
		if( !prohibitworkspaceMenu )
		{
			WorkspaceMenu.generate( false, this.menu );
		}

		/*
		TODO: Enable when they work!
		this.menu.push( {
			name: i18n( 'menu_workspheres' ),
			items: [
				{
					name: i18n( 'i18n_worksphere_all' ),
					command: 'worksphere_all'
				},
				{
					name: i18n( 'i18n_worksphere_add' ),
					command: 'worksphere_add'
				}
			]
		} );*/
	},
	// Downloads a file by path to the client computer
	download: function( path, format )
	{
		let lastChar = path.substr( path.length - 1, 1 );
		if( lastChar == ':' || lastChar == '/' )
		{
			return Notify( { title: i18n( 'i18n_could_not_download' ), text: i18n( 'i18n_download_wrong_type' ) } );
		}
		let fn = path.split( ':' )[1];
		if( fn.indexOf( '/' ) > 0 )
			fn = fn.split( '/' ).pop();
		
		let dowloadURI = document.location.protocol +'//'+ document.location.host +'/system.library/file/read/' + fn + '?mode=rs&sessionid=' + Workspace.sessionId + '&path='+ encodeURIComponent( path );
		
		if( format )
		{
			dowloadURI += '&download=' + encodeURIComponent( format );
		}
		else
		{
			dowloadURI += '&download=1';
		}
		
		//check if we are inside one of our apps with a custom download handler....
		if( typeof( friendApp ) != 'undefined' && typeof friendApp.download == 'function' )
		{
			friendApp.download( dowloadURI );			
		}
		else
		{
			let i = document.createElement( 'iframe' );
			i.src = dowloadURI;
			i.onload = function()
			{
				setTimeout( function()
					{
						document.body.removeChild( i );
					}
				, 250 );
			}
			document.body.appendChild( i );			
		}
	},
	// Show the backdrop
	backdrop: function()
	{
		let screens = document.getElementsByClassName( 'Screen' );
		function timeoutScreen( s )
		{
			setTimeout( function()
			{
				s.style.transition = '';
			}, 550 );
		}
		for( let a = 0; a < screens.length; a++ )
		{
			screens[a].style.transition = 'transform 0.5s';
			screens[a].style.transform = 'translate3d(0,' + ( window.innerHeight - 32 + 'px' ) + ',0)';
			timeoutScreen( screens[a] );
		}
	},
	viewDirectory: function( mode )
	{
		if ( !window.currentMovable )
			return false;
		if ( !window.currentMovable.content.directoryview )
			return false;
		
		window.currentMovable.content.directoryview.changed = true;
		window.currentMovable.content.directoryview.listMode = mode;
		
		// Save window storage
		let uid = window.currentMovable.content.uniqueId;
		let d = GetWindowStorage( uid );
		d.listMode = mode;
		
		// Refresh toggle group
		let eles = window.currentMovable.getElementsByClassName( 'ToggleGroup' );
		if( eles )
		{
			eles[0].checkActive( mode );
		}
		
		SetWindowStorage( uid, d );
		if( window.currentMovable.content.directoryview )
			window.currentMovable.content.directoryview.toChange = true;
		window.currentMovable.content.refresh();
	},
	showContextMenu: function( menu, e, extra )
	{
		let tr = e.target ? e.target : e.srcElement;

		if( tr == window )
			tr = document.body;
		
		this.menuContext = tr;
		
		// Check if we need to activate
		let iconWindow = false;
		let isFileMenu = false;
		if( tr )
		{
			let p = tr.parentNode.parentNode;
			if( p )
			{
				while( p && p != document.body && ( !p.classList || !p.classList.contains( 'View' ) ) )
				{
					p = p.parentNode;
				}
				if( p && p.classList && p.classList.contains( 'View' ) )
				{
					_ActivateWindow( p );
					if( p.content && p.content.directoryview )
						iconWindow = p.content;
				}
			}
		}
		
		// Always refresh menu when we have a targtt
		if( e && e.target )
		{
			let tmp = e.target;
			while( tmp != document.body )
			{
				if( tmp.classList && tmp.classList.contains( 'File' ) )
					break;
				tmp = tmp.parentNode;
			}
			if( tmp != document.body && tmp.classList.contains( 'File' ) )
			{
				isFileMenu = true;
				Workspace.refreshMenu( true, tmp );
				menu = Workspace.menu;
			}
		}
		
		// Item uses system default
		if( tr.defaultContextMenu ) 
		{
			return false;
		}
		
		let findView = false;
		let el = tr;
		if( el )
		{
			while( el != document.body && el )
			{
				if( el.classList && el.classList.contains( 'Content' ) )
					break;
				if( el.classList && el.classList.contains( 'View' ) )
				{
					findView = el;
					break;
				}
				else if( el.classList && el.classList.contains( 'Task' ) )
				{
					findView = el.view;
					break;
				}
				el = el.parentNode;
			}
		}

		// Check for the window context menu
		if( !menu && tr.classList && findView )
		{
			menu = [];
			function addWSMenuItem( m, a )
			{
				m.push( {
					name: i18n( 'menu_move_view_to_workspace_' + ( a + 1 ) ),
					command: function()
					{
						findView.windowObject.sendToWorkspace( a );
					}
				} );
			}
			
			// For multiple workspaces
			if( globalConfig.workspacecount > 1 )
			{
				for( let a = 0; a < globalConfig.workspacecount; a++ )
				{
					addWSMenuItem( menu, a );
				}
			}
			
			menu.push( {
				name: i18n( 'menu_close_window' ),
				command: function()
				{
					findView.windowObject.close();
				}
			} );
		}
		// Screen menu
		else if( !menu && ( tr.classList.contains( 'ScreenContent' ) || tr.parentNode.classList.contains( 'ScreenContent' ) ) )
		{
			menu = [
				{
					name: i18n( 'menu_look_and_feel' ),
					command: function()
					{
						ExecuteApplication( 'Looknfeel' );
					}
				},				{
					name: i18n( 'menu_edit_wallpaper' ),
					command: function()
					{
						ExecuteApplication( 'Wallpaper' );
					}
				},
				{
					name: i18n( 'menu_add_storage' ),
					command: function()
					{
						ExecuteApplication( 'Account', 'addstorage' );
					}
				},
				{
					name: i18n( 'menu_refresh_desktop' ),
					command: function()
					{
						Workspace.refreshDesktop();
					}
				}
			];
		}
		else if( !menu || isFileMenu )
		{
			// Make sure the menu is up to date
			let t = tr;
			if( iconWindow )
				t = iconWindow;
			else
			{
				while( t && !( t.classList && t.classList.contains( 'Content' ) ) && t.parentNode != document.body )
				{
					t = t.parentNode;
				}
			}
			if( t )
			{
				if( t.checkSelected )
					t.checkSelected();
			}
			
			for( let z = 0; z < Workspace.menu.length; z++ )
			{
				if( Workspace.menu[z].name == i18n( 'menu_icons' ) )
				{
					menu = Workspace.menu[z].items;
					break;
				}
			}
		}

		if( menu )
		{
			// Allow a 300 ms delay for mouseup'ing
			Workspace.contextMenuAllowMouseUp = false;
			setTimeout( function()
			{
				Workspace.contextMenuAllowMouseUp = true;
			}, 300 );
			
			// Applications uses global X&Y coords
			if( extra && extra.applicationId )
			{
				e.clientY = windowMouseY;
				e.clientX = windowMouseX;
			}
			
			if( isTablet || isMobile )
			{
				if( e.touches )
				{
					e.clientX = e.touches[0].clientX;
					e.clientY = e.touches[0].clientY;
				}
			}
			
			let flg = {
				width: 200,
				height: 100,
				top: e.clientY,
				left: e.clientX,
				transparent: true
			}
			let v = false;
			
			if( Workspace.iconContextMenu )
			{
				v = Workspace.iconContextMenu;
			}
			else v = Workspace.iconContextMenu = new Widget( flg );
			
			this.contextMenuShowing = v;
			
			v.dom.innerHTML = '';
			let menuout = document.createElement( 'div' );
			menuout.className = 'MenuItems';
			setTimeout( function()
			{
				// Position and open
				let lch = menuout.childNodes;
				let cand = menuout.lastChild;
				for( let z = 0; z < lch.length; z++ )
				{
					if( !lch[ z ].classList.contains( 'Disabled' ) )
						cand = lch[ z ];
				}
				menuout.style.height = ( cand.offsetTop + cand.offsetHeight ) + 'px';
				menuout.classList.add( 'Open' );
				
				// Keep the vertical position by the limit
				let limit = currentScreen.screen.contentDiv.offsetHeight;
				if( GetElementTop( v.dom ) + parseInt( menuout.style.height ) > limit )
				{
					v.setFlag( 'top', limit - parseInt( menuout.style.height ) );
				}
			}, 50 );
			
			let head = document.createElement( 'p' );
			head.className = 'MenuHeader';
			// Custom header?
			if( extra && extra.header )
			{
				head.innerHTML = extra.header;
			}
			else
			{
				head.innerHTML = i18n( 'menu_icons' );
			}
			menuout.appendChild( head );

			
			// Check current file
			if( window.currentMovable && currentMovable.content && currentMovable.content.icons )
			{
				let thisicon = false;
				if( tr )
				{
					thisicon = tr;
					while( thisicon.classList && !thisicon.classList.contains( 'File' ) && thisicon.parentNode && thisicon != document.body )
					{
						thisicon = thisicon.parentNode;
					}
					if( thisicon.fileInfo )
					{
						let sharedVolume = false;
						if( thisicon.fileInfo.Path.indexOf( 'Shared:' ) == 0 )
							sharedVolume = true;
						
						if( thisicon.fileInfo.Filename )
						{
							if( !sharedVolume && thisicon.fileInfo.Type == 'Directory' )
							{
								menu.push( {
									name: i18n( 'menu_add_bookmark' ),
									command: function()
									{
										let m = new Module( 'system' );
										m.onExecuted = function( e, d )
										{
											if( e == 'ok' )
											{
												if( currentMovable && currentMovable.content && currentMovable.content.fileBrowser )
												{
													currentMovable.content.fileBrowser.refresh();
												}
											}
										}
										m.execute( 'addbookmark', { path: thisicon.fileInfo.Path, name: thisicon.fileInfo.Filename } );
									}
								} );
							}
							else if( thisicon.fileInfo.ExportFormats )
							{
								if( thisicon.fileInfo.ExportFormats.length > 0 )
								{
									
									menu.push( {
										divider: true
									} );
									
									for( var i in thisicon.fileInfo.ExportFormats )
									{
										
										if( thisicon.fileInfo.ExportFormats[i] && thisicon.fileInfo.ExportFormats[i].Name && thisicon.fileInfo.ExportFormats[i].Type )
										{
											menu.push( {
												name: i18n( 'menu_download_as' ) + ' ' + thisicon.fileInfo.ExportFormats[i].Name,
												args: { Type: thisicon.fileInfo.ExportFormats[i].Type },
												command: function( e, args )
												{
													Workspace.download( thisicon.fileInfo.Path, args.Type );
												}
											} );
										}
									
									}
									
								}
							}
							else
							{
								let ext = thisicon.fileInfo.Filename.split( '.' ).pop();
								if( ext )
								{
									switch( ext.toLowerCase() )
									{
										case 'jpg':
										case 'jpeg':
										case 'png':
										case 'gif':
											menu.push( {
												name: i18n( 'menu_set_as_wallpaper' ),
												command: function()
												{
													let m = new Module( 'system' );
													m.onExecuted = function()
													{
														Workspace.wallpaperImage = thisicon.fileInfo.Path;
														Workspace.refreshDesktop();
													}
													m.execute( 'setsetting', { setting: 'wallpaperdoors', data: thisicon.fileInfo.Path } );
												}
											} );
											break;
										case 'fpkg':
											if( Workspace.userLevel == 'admin' )
											{
												menu.push( {
													name: i18n( 'menu_install_package' ),
													command: function()
													{
														let m = new Module( 'system' );
														m.onExecuted = function( e, d )
														{
															if( e != 'ok' )
															{
																Notify( { title: i18n( 'i18n_failed_install_package' ), text: i18n( 'i18n_package_failed' ) + ': ' + thisicon.fileInfo.Filename } );
															}
															else
															{
																Notify( { title: i18n( 'i18n_package_installed' ), text: i18n( 'i18n_package' ) + ': ' + thisicon.fileInfo.Filename + ', ' + i18n( 'i18n_was_installed' ) } );
															}
														}
														m.execute( 'installpackage', { path: thisicon.fileInfo.Path } );
													}
												} );
											}
											break;
									}
								}
							}
						}
					}
				}
			}
			
			let menuitemCount = 0;
			for( let z = 0; z < menu.length; z++ )
			{
				if( menu[z].divider ) continue;
				let p = document.createElement( 'p' );
				p.className = 'MousePointer MenuItem';
				if( menu[z].disabled )
				{
					p.className += ' Disabled';
				}
				else
				{
					menuitemCount++;
					if( extra && extra.applicationId )
					{
						( function( m ){
							p.cmd = function( e )
							{
								let app = findApplication( extra.applicationId );
								if( extra.viewId && app.windows[ extra.viewId ] )
								{
									app.windows[ extra.viewId ].sendMessage( { command: m.command, data: m.data } );
								}
								else app.postMessage( { command: m.command, data: m.data }, '*' );
							}
						} )( menu[ z ] );
					}
					else
					{
						p.cmd = menu[z].command;
					}
					if( menu[z].args )
					{
						p.args = menu[z].args;
					}
					p.onclick = function( event )
					{
						if( !v.shown ) return;
						let self = this;
						if( this.cmd && typeof( this.cmd ) == 'function' )
						{
							// Give a small timeout to allow for mouseup
							setTimeout( function()
							{
								if( self.args )
								{
									self.cmd( event, self.args );
								}
								else
								{
									self.cmd( event );
								}
							}, 50 );
						}
						menuout.classList.add( 'Closing' );
						menuout.classList.remove( 'Open' );
						setTimeout( function()
						{
							v.hide();
						}, 150 );
						Workspace.contextMenuShowing = false;
						return cancelBubble( event );
					}
					// Mouse up on context menus has timeout
					p.onmouseup = function( event )
					{
						if( event.button == 2 )
						{
							if( Workspace.contextMenuAllowMouseUp )
							{ 
								if( !v.shown ) return;
								Workspace.contextMenuShowing = false;
								if( this.cmd && typeof( this.cmd ) == 'function' )
								{
									this.cmd( event );
								}
								menuout.classList.add( 'Closing' );
								menuout.classList.remove( 'Open' );
								setTimeout( function()
								{
									v.hide();
								}, 150 );
								return cancelBubble( event );
							}
						}
					}
				}
				p.innerHTML = menu[z].name;
				menuout.appendChild( p );
			}
			if( menuitemCount )
			{
				v.dom.appendChild( menuout );
			
				// Show the thing
				v.setFlag( 'height', v.dom.lastChild.offsetHeight + v.dom.lastChild.offsetTop );
				v.setFlag( 'left', flg.left );
				v.setFlag( 'top', flg.top );
				v.raise();
				v.show();
			}
		}
		return true;
	},
	newDirectoryView: function()
	{
		let c = window.currentMovable;
		if( !c ) return;
		let dv = c.content.fileInfo;
		if( !dv ) return;
		OpenWindowByFileinfo( dv, false, false, true );
	},
	toggleHiddenFiles: function()
	{
		let c = window.currentMovable;
		if( !c ) return;
		let dv = c.content.directoryview;
		dv.showHiddenFiles = dv.showHiddenFiles ? false : true;
		if( c.content.directoryview )
			c.content.directoryview.toChange = true;
		c.content.refresh();
	},
	searchAll: function( args )
	{
		this.searchStop();
		if( this.searchView )
		{
			let w = this.searchView; this.searchPath = false;
			w.searchPath = false;
			w.setFlag( 'title', i18n( 'i18n_search_files' ) );
			let f = new File( 'templates/search.html' );
			f.replacements = {
				searchAll: 'hidden'
			};
			f.i18n();
			f.onLoad = function( data )
			{
				w.setContent( data, function()
				{
					ge( 'WorkspaceSearchKeywords' ).focus();
					if( ge( 'WorkspaceSearchStop' ) )
						ge( 'WorkspaceSearchStop' ).style.display = 'none';
				} );
				
			}
			f.load();
		}
	},
	showSearch: function( args, targetView )
	{
		if( !Workspace.sessionId ) return;
		if( !targetView ) targetView = false;
		
		if( args ) args = args.split( '::' ).join( ':' );

		let tit = '';
		if( args && args.indexOf( ':' ) > 0 )
		{
			tit += ' ' + i18n( 'i18n_search_in' ) + ' ' + args;
		}

		let w;

		if( this.searchView )
		{
			this.searchStop();
			w = this.searchView;
			if( w )
			{
				w.setFlag( 'title', i18n( 'i18n_search_files' ) + tit );
				w.activate();
				w.toFront();
			}
			else
			{ 
				return;
			}
		}
		else
		{
			w = new View( {
				title: i18n( 'i18n_search_files' ) + tit,
				'min-width': 480,
				'min-height': 92,
				height: 92,
				id: 'workspace_search'
			} );
		}
		
		w.targetView = targetView;

		w.resize = function( none )
		{
			let oh = ge( 'SearchFullContent' ).parentNode.offsetHeight;
			ge( 'WorkspaceSearchResults' ).style.maxHeight = oh - 20 - ge( 'SearchGuiContainer' ).offsetHeight - 10 + 'px';
			ge( 'WorkspaceSearchResults' ).style.overflow = 'auto';
		}
		
		w.onClose = function()
		{
			Workspace.searchStop();
			Workspace.searchView = null;
		}
		
		w.addEvent( 'resize', function( e )
		{
			w.resize( true );
		} );
		
		this.searchView = w;

		w.searchPath = args && args.indexOf( ':' ) > 0 ? args : false;

		let f = new File( 'templates/search.html' );
		f.replacements = {
			searchAll: w.searchPath ? 'visible' : 'hidden'
		};
		f.i18n();
		f.onLoad = function( data )
		{
			w.setContent( data, function()
			{
				ge( 'WorkspaceSearchKeywords' ).focus();
				if( ge( 'WorkspaceSearchStop' ) )
					ge( 'WorkspaceSearchStop' ).style.display = 'none';
			} );
		}
		f.load();
	},
	maxSearchProcesses: 5,
	// Do the actual searching
	searchExecute: function()
	{
		if( !this.searchView ) return;
		let self = this;

		// Abort existing search runs!
		CancelCajaxOnId( 'workspace_search' );

		ge( 'WorkspaceSearchResults' ).innerHTML = '';
		this.searching = true;
		this.searchPaths = [];
		this.queuedSearches = [];
		this.searchMatches = [];
		let keyz = ge( 'WorkspaceSearchKeywords' ).value.split( ',' ).join( ' ' ).split( ' ' );
		this.searchKeywords = [];
		for( let a = 0; a < keyz.length; a++ )
		{
			if( !Trim( keyz[a] ) ) continue;
			this.searchKeywords.push( Trim( keyz[a] ) );
		}
		if( !this.searchKeywords.length ) return;

		ge( 'WorkspaceSearchStop' ).style.width = '';
		ge( 'WorkspaceSearchStop' ).style.display = '';
		ge( 'WorkspaceSearchStop' ).style.visibility = 'visible';
		ge( 'WorkspaceSearchAll' ).style.display = 'none';
		ge( 'WorkspaceSearchGo' ).style.display = 'none';

		let searchProcesses = 0;
		let maxSearchProcesses = this.maxSearchProcesses;
		
		let insensitive = ge( 'SearchCaseSensitive' ).checked ? false : true;
		let doSearch = function( path )
		{
			// Abort!
			if( !Workspace.searching ) return;

			if( typeof( path ) == 'undefined' )
			{
				return;
			}

			// Don't search this twice
			for( let y = 0; y < Workspace.searchPaths.length; y++ )
			{
				if( Workspace.searchPaths[y] == path )
				{
					return;
				}
			}
			
			// Respect limit
			if( searchProcesses > maxSearchProcesses )
			{
				self.queuedSearches.push( path );
				//console.log( '  - Too many processes (' + searchProcesses + ') - waiting with ' + path );
				return;
			}

			// Go!
			Workspace.searchPaths.push( path );
			searchProcesses++;
			let d = ( new Door() ).get( path );
			if( !d || !d.getIcons )
			{
				searchProcesses--;
				if( searchProcesses == 0 )
				{
					Workspace.searchStop( 'check', doSearch );
				}
				return;
			}
			d.cancelId = 'workspace_search';
			d.getIcons( false, function( data )
			{
				if( !data.length )
				{
					searchProcesses--;
					if( searchProcesses == 0 )
					{
						Workspace.searchStop( 'check', doSearch );
					}
					return;
				}
				for( let u = 0; u < data.length; u++ )
				{
					// Don't search hidden files, Don't register them twice
					let idnt = data[u].Filename ? data[u].Filename : data[u].Title;
					if( idnt.substr( 0, 1 ) == '.' ) continue;
					
					// Match all keywords
					for( let b = 0; b < Workspace.searchKeywords.length; b++ )
					{
						let found = false;

						let searchKey = Workspace.searchKeywords[b];

						// Case insensitive search
						if( insensitive )
						{
							searchKey = searchKey.toLowerCase();
							idnt = idnt.toLowerCase();
						}

						if( idnt.indexOf( searchKey ) >= 0 )
						{
							for( let y = 0; y < Workspace.searchPaths.length; y++ )
							{
								if( Workspace.searchPaths[y] == data[u].Path )
								{
									found = true;
									break;
								}
							}
							if( !found )
								Workspace.searchMatches.push( data[u] );
							else Workspace.searchPaths.push( data[u].Path );
						}
						// Recurse
						if( !found )
						{
							if( data[u].Type == 'Directory' || data[u].Type == 'Door' || data[u].Type == 'Dormant' )
							{
								doSearch( data[u].Path );
							}
						}
					}
				}
				Workspace.searchRefreshMatches();
				searchProcesses--;
				if( searchProcesses == 0 )
				{
					Workspace.searchStop( 'check', doSearch );
				}
			} );
		}
		
		if( this.searchView.searchPath )
		{
			doSearch( this.searchView.searchPath );
		}
		else
		{
			// Search by disks
			this.getMountlist( function( data )
			{
				let p = 0;
				for( ; p < data.length; p++ )
				{
					doSearch( data[p].Path );
				}
			});
		}
	},
	searchRefreshMatches: function()
	{
		let self = this;
		
		if( !ge( 'WorkspaceSearchResults' ) ) return false;

		if( !this.searching ) return;

		ge( 'WorkspaceSearchResults' ).classList.add( 'BordersDefault', 'List', 'SmoothScrolling' );
		
		// Lock click buttons for 250ms when scrolling
		if( isMobile )
		{
			if( typeof( this.searchScrolling ) == 'undefined' )
				this.searchScrolling = false;
		
			ge( 'WorkspaceSearchResults' ).onscroll = function( e )
			{
				if( self.searchTimeout )
				{
					clearTimeout( self.searchTimeout );
					self.searchTimeout = null;
				}
				self.searchTimeout = setTimeout( function()
				{
					self.searchTimeout = null;
					self.searchScrolling = false;
				}, 250 );
				self.searchScrolling = true;
			}
		}

		for( let a = 0; a < this.searchMatches.length; a++ )
		{
			let m = this.searchMatches[a];
			if( !m || !m.Path ) continue;
			if( m.added ) continue;
			if( m.Path.substr( m.Path.length - 5, 5 ) == '.info' ) continue;
			let sw = a % 2 + 1;
			let d = document.createElement( 'div' );
			this.searchMatches[a].added = d;
			d.className = 'HRow Padding sw' + sw;
			let icon = '<div class="File Tiny MousePointer"><div class="Icon"><div class="Directory"></div></div></div>';
			d.innerHTML = '<div class="Ellipsis Layout PaddingLeft PaddingRight">' + icon + ' <span class="MarginLeft MousePointer">' + this.searchMatches[a].Path + '</span></div>';

			// Create FileInfo
			let ppath = m.Path;
			let fname = '';
			let title = '';
			if( ppath.indexOf( '/' ) > 0 )
			{
				ppath = ppath.split( '/' );
				ppath.pop();
				fname = ppath[ppath.length-1];
				title = fname;
				ppath = ppath.join( '/' ) + '/';
			}
			else if ( ppath.indexOf( ':' ) > 0 )
			{
				ppath = ppath.split( ':' )[0] + ':';
				fname = false;
				title = ppath.split( ':' )[0];
			}
			// Something is wrong with this fucker!
			else continue;

			// Manual evaluation
			let o = {
				Filename: fname,
				Title: title,
				Path: ppath,
				Filesize: false,
				ID: false,
				Shared: false,
				SharedLink: false,
				DateModified: false,
				DateCreated: false,
				added: false
			};
			for( let b in m )
				if( !o[b] && !( o[b] === false ) ) o[b] = m[b];
			
			let ext = ( fname ? fname : title ).split( '.' ); ext = ext[ ext.length - 1 ];
			let cls = GetIconClassByExtension( ext, o )
			
			o.Type = o.Path.substr( o.Path.length - 1, 1 ) != ':' ? 'Directory' : 'Door'; // TODO: What about dormant?
			o.MetaType = o.Type; // TODO: If we use metatype, look at this
			
			
			ge( 'WorkspaceSearchResults' ).appendChild( d );
			d.onmouseover = function( e )
			{
				this.classList.add( 'Selected' );
			}
			d.onmouseout = function( e )
			{
				this.classList.remove( 'Selected' );
			}

			let method = isMobile ? 'ontouchend' : 'onclick';
			let folder = d.querySelector( '.File' );
			let theFil = d.getElementsByTagName( 'span' )[0];
			folder.folder = o;
			folder[ method ] = function()
			{
				if( self.searchScrolling )
					return;
				let tr = self.searchView.targetView;
				if( !tr || ( tr && !tr.parentNode.parentNode.parentNode ) )
				{
					self.searchView.targetView = null;
				}
				OpenWindowByFileinfo( this.folder, false, false, true, self.searchView.targetView  );
			}
			theFil.file = m;
			if( !isMobile )
			{
				theFil.onmouseover = function()
				{
					this.style.textDecoration = 'underline';
				}
				theFil.onmouseout = function()
				{
					this.style.textDecoration = '';
				}
			}
			theFil[ method ] = function()
			{
				if( self.searchScrolling )
					return;
				OpenWindowByFileinfo( this.file, false );
			}
		}

		if( ge( 'SearchFullContent' ).offsetHeight < 400 )
		{
			if( this.searchView.getFlag( 'height' ) < 400 )
				this.searchView.setFlag( 'height', 400 );
		}
		this.searchView.resize();
	},
	searchStop: function( reason, callback )
	{
		// We stopped because we have finished all active processes
		// Check queue
		if( reason && reason == 'check' && Workspace.queuedSearches.length > 0 )
		{
			let copy = [];
			for( let a = 0; a < Workspace.queuedSearches.length; a++ )
			{
				copy.push( Workspace.queuedSearches[a] );
			}
			Workspace.queuedSearches = [];
			if( copy.length > 0 )
			{
				for( let a = 0; a < copy.length; a++ )
					callback( copy[ a ] );
				return;
			}
		}
		
		// Abort existing search runs!
		CancelCajaxOnId( 'workspace_search' );
		
		this.searching = false;
		if( ge( 'WorkspaceSearchStop' ) )
			ge( 'WorkspaceSearchStop' ).style.display = 'none';
		if( ge( 'WorkspaceSearchGo' ) )
			ge( 'WorkspaceSearchGo' ).style.display = '';
		if( ge( 'WorkspaceSearchAll' ) )
			ge( 'WorkspaceSearchAll' ).style.display = '';
	},
	hideLauncherError: function()
	{
		if( Workspace.launcherWindow && Workspace.launcherWindow.setFlag )
		{
			Workspace.launcherWindow.setFlag( 'max-height', 80 );
			Workspace.launcherWindow.setFlag( 'height', 80 );
			ge( 'launch_error' ).innerHTML = '';
		}
	},
	launch: function( app, hidecallback )
	{
		let args = false;
		if( app.indexOf( ' ' ) > 0 )
		{
			app = app.split( ' ' );
			args = '';
			for( let a = 0; a < app.length; a++ )
				args += ( a > 0 ? ' ' : '' ) + app[a];
			app = app[0];
		}
		
		// Error handling
		function cbk( message )
		{
			if( !message || ( message && !message.error ) )
			{
				return hidecallback();
			}
			let ww = Workspace.launcherWindow;
			if( ww && ge( 'launch_error' ) )
			{
				ww.setFlag( 'max-height', 140 );
				ww.setFlag( 'height', 140 );
				ge( 'launch_error' ).innerHTML = '<p id="launchErrorWarning" class="Danger Rounded PaddingSmall">' + message.errorMessage + '</p>';
				let b = document.createElement( 'span' );
				b.className = 'FloatRight IconSmall fa-remove';
				b.innerHTML = '&nbsp;';
				ge( 'launchErrorWarning' ).appendChild( b );
				b.onclick = function()
				{
					ww.setFlag( 'max-height', 80 );
					ww.setFlag( 'height', 80 );
					ge( 'launch_error' ).innerHTML = '';
				}
			}
			if( message.error == 2 )
				return true;
			return false;
		}
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) 
			{
				ExecuteApplication( app, args, cbk );
				return;
			}
			try
			{
				let js = JSON.parse( d );
				for( let a = 0; a < js.length; a++ )
				{
					if( js[a].Name.toLowerCase() == app.toLowerCase() )
					{
						return ExecuteApplication( js[a].Name, args, cbk );
					}
				}
				ExecuteApplication( app, args, cbk );
			}
			catch( e )
			{
				ExecuteApplication( app, args, cbk );
			}
		}
		m.execute( 'listuserapplications' );
	},
	showLauncher: function()
	{
		if( !Workspace.sessionId ) return;
		let selfw = this;

		if( this.launcherWindow )
		{
			return this.launcherWindow.activate();
		}
		let w = new View( {
			title: i18n( 'menu_execute_command' ),
			width: 320,
			height: 80,
			'min-height': 80,
			'max-height': 80,
			resize: false,
			id: 'launcherview'
		} );
		
		w.onClose = function()
		{
			Workspace.launcherWindow = null;
		}
		
		let f = new File( 'templates/runcommand.html' );
		f.replacements = {
			'execute' : i18n( 'cmd_execute' ),
			'run_command' : i18n( 'menu_execute_command' )
		};
		f.onLoad = function( data )
		{
			w.setContent( data );
			if( Workspace.lastExecuted )
			{
				ge( 'WorkspaceRunCommand' ).value = Workspace.lastExecuted;
			}
			if( ge( 'WorkspaceRunCommand' ) )
			{
				ge( 'WorkspaceRunCommand' ).addEventListener( 'keydown', function( e )
				{
					let wh = e.which ? e.which : e.keyCode;
					if( wh == 27 )
					{
						Workspace.hideLauncher();
						return cancelBubble( e );
					}
				} );
				ge( 'WorkspaceRunCommand' ).select();
				ge( 'WorkspaceRunCommand' ).focus();
			}
			else
			{
				if( w.setContent ) w.close();
				selfw.launcherWindow = null;
			}
		}
		f.load();
		this.launcherWindow = w;
	},
	hideLauncher: function()
	{
		if( !this.launcherWindow ) return;
		this.launcherWindow.close();
		this.launcherWindow = false;
	},
	hideAllViews: function()
	{
		for( let a in movableWindows )
		{
			if( movableWindows[ a ].minimize )
				movableWindows[ a ].minimize.onclick();
		}
		PollTaskbar();
		if( Workspace.mainDock )
			Workspace.mainDock.refresh();
	},
	//
	hideInactiveViews: function()
	{
		let v = currentMovable;
		for( let a in movableWindows )
		{
			if( movableWindows[ a ] != v )
			{
				if( movableWindows[ a ].minimize )
					movableWindows[ a ].minimize.onclick();
			}
		}
		PollTaskbar();
		if( Workspace.mainDock )
			Workspace.mainDock.refresh();
	},
	// Force update
	refreshDirectory: function()
	{
		if( window.currentMovable && window.currentMovable.content )
		{
			if( window.currentMovable.content.directoryview )
				window.currentMovable.content.directoryview.toChange = true;
			window.currentMovable.content.refresh();
		}
	},
	openParentDirectory: function( e )
	{
		let f = window.currentMovable;
		if( !f ) return;
		let p = f.content.fileInfo;
		let path = p.Path;

		// Remove trailing path
		if( path.substr( path.length - 1, 1 ) == '/' )
			path = path.substr( 0, path.length - 1 );
		// Get parent directory
		if( path.split( ':' ).length > 1 )
		{
			path = path.split( ':' );
			if( path[1].indexOf( '/' ) > 0 )
			{
				path[1] = path[1].split( '/' );
				path[1].pop();
				path[1] = path[1].join ( '/' );
			}
			else
			{
				path[1] = '';
			}
			path = path.join ( ':' );

			// Create fileinfo
			let d = {};
			for( let a in p ) d[a] = p[a];
			d.Path = path;

			// Open the window
			OpenWindowByFileinfo( d, e );
		}
	},
	// Deepest field population
	updateTasks: function()
	{
		if( !isMobile )
			DeepestField.redraw();
	},
	fullscreen: function( ele, e )
	{
		// Fullscreen enabled?
		if(
		  !document.fullscreenEnabled &&
		  !document.webkitFullscreenEnabled &&
		  !document.mozFullScreenEnabled &&
		  !document.msFullscreenEnabled
		)
		{
			return false;
		}

		let el = ele ? ele : ( document.documentElement ? document.documentElement : document.body );
		let toggle = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
		if( !toggle )
		{
			if( el.requestFullscreen )
				el.requestFullscreen();
			else if( el.webkitRequestFullScreen )
				el.webkitRequestFullScreen();
			else if( el.webkitRequestFullscreen )
				el.webkitRequestFullscreen();
			else if( el.mozRequestFullscreen )
				el.mozRequestFullScreen();
			else if( el.msRequestFullscreen )
				el.msRequestFullscreen();
			el.fullscreenEnabled = true;
		}
		else
		{
			if( document.exitFullScreen )
				document.exitFullScreen();
			else if( document.webkitCancelFullscreen )
				document.webkitCancelFullscreen();
			else if( document.webkitCancelFullScreen )
				document.webkitCancelFullScreen();
			else if( document.mozCancelFullScreen )
				document.mozCancelFullScreen();
			else if( document.mozCancelFullScreen )
				document.mozCancelFullScreen();
			el.fullscreenEnabled = false;
		}
		this.fullscreenObject = el.fullscreenEnabled ? el : null;
	},
	// Set up user account
	accountSetup: function( args )
	{
		ExecuteApplication( 'Account', args );
	},
	flushSession: function()
	{
		Workspace.sessionId = '';
	},
	// Upgrade settings (for new versions)
	upgradeWorkspaceSettings: function( cb )
	{
		let a1 = new Module( 'system' );
		a1.onExecuted = function( a1r, a1d )
		{
			if( !a1r || a1r == 'fail' ) return;
			try
			{
				let response = JSON.parse( a1d );
				if( response.response == 1 )
				{
					Workspace.refreshTheme( response.themeName, true, response.themeConfig );
					Workspace.reloadDocks();
					Workspace.refreshDesktop( cb, true );
				}
			}
			catch( e )
			{}
		}
		a1.execute( 'upgradesettings' );
	},
	handlePasteEvent: function( evt )
	{
		let pastedItems = ( evt.clipboardData || evt.originalEvent.clipboardData ).items;
		for( let i in pastedItems )
		{
			let item = pastedItems[i];
			if( item.kind === 'file' )
			{
			
				let blob = item.getAsFile();
				filetype = ( blob.type == '' ? 'application/octet-stream' : blob.type );
				
				Workspace.uploadBlob = blob;
				//console.log('Upload this file...',filetype,blob);
				
				let m = new Library( 'system.library' );
				m.onExecuted = function( e, d )
				{
					//we have a downloads dir in home
					if( e == 'ok' )
					{
						Workspace.uploadPastedFile( Workspace.uploadBlob );
					}
					else
					{
						//no downloads dir - try to make one
						let m2 = new Library( 'system.library' );
						m2.onExecuted = function( e, d )
						{
							//home drive found. create directory
							if( e == 'ok' )
							{
								let door = Workspace.getDoorByPath( 'Home:Downloads/' );
								door.dosAction( 'makedir', { path: 'Home:Downloads/' }, function( result )
								{
									let res = result.split( '<!--separate-->' );
									if( res[0] == 'ok' )
									{
										Workspace.uploadPastedFile( Workspace.uploadBlob );
									}
									// Failed - alert user
									else
									{
										Notify( { title: i18n( 'i18n_paste_error' ), text: i18n( 'i18n_could_not_create_downloads' ) } );
										return;
									}
								});
							
							}
							else
							{
								Notify( { title: i18n( 'i18n_paste_error' ), text: i18n( 'i18n_no_home_drive' ) } );
								return;
							}
						};						
						m2.execute( 'file/dir', { path: 'Home:' } );
					}
				}
				m.execute( 'file/dir', { path: 'Home:Downloads/' } );

			} // if file item
		} // each pasted iteam
	},
	uploadPastedFile: function( file )
	{
		//get directory listing for Home:Downloads - create folder if it does not exist...
		let j = new cAjax ();
		
		let updateurl = '/system.library/file/dir?wr=1'
		updateurl += '&path=' + encodeURIComponent( 'Home:Downloads' );
		updateurl += '&sessionid=' + encodeURIComponent( Workspace.sessionId );
		
		j.open( 'get', updateurl, true, true );
		j.onload = function ()
		{
			let content;
			// New mode
			if ( this.returnCode == 'ok' )
			{
				try
				{
					content = JSON.parse( this.returnData || 'null' );
				}
				catch ( e ){};
			}
			// Legacy mode..
			// TODO: REMOVE FROM ALL PLUGINS AND MODS!
			else
			{
				try
				{
					content = JSON.parse( this.responseText() || 'null' );
				}
				catch ( e ){}
			}
		
			if( content )
			{
				let newfilename = file.name;
				let i = 0;
				while( DirectoryContainsFile( newfilename, content ) )
				{
					i++;
					
					//find a new name
					let tmp = file.name.split('.');
					let newfilename = file.name;
					if( tmp.length > 1 )
					{
						let suffix = tmp.pop();
						newfilename = tmp.join( '.' );
						newfilename += '_' + i + '.' + suffix;
					}
					else
					{
						newfilename += '_' + i;
					}
					if( i > 10000 )
					{
						Notify( {
							title: i18n( 'i18n_paste_error' ),
							text: 'Really unexpected error. You have pasted many many files. Please cleanup your Home:Download directory.'
						} );
						return; // no endless loop please	
					}
				}
				Workspace.uploadFileToDownloadsFolder( file, newfilename );
			}
			else
			{
				Notify(	{
					title: i18n( 'i18n_paste_error' ),
					text: 'Really unexpected error. Contact your Friend OS administrator.'
				} );
			}
		}
		j.send();


	}, // end of uploadPastedFile
	uploadFileToDownloadsFolder: function( file, filename )
	{
		// Setup a file copying worker
		let uworker = new Worker( 'js/io/filetransfer.js' );

		// Remember current window
		let curr = window.currentMovable;

		// Open window
		let w = new View( {
			title:  i18n( 'i18n_copying_files' ),
			width:  320,
			height: 100,
			id:     'fileops'
		} );

		let uprogress = new File( 'templates/file_operation.html' );

		uprogress.connectedworker = uworker;
		let groove = false, bar = false, frame = false, progressbar = false, progress = false;

		//upload dialog...
		uprogress.onLoad = function( data )
		{
			data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
			w.setContent( data );

			w.connectedworker = this.connectedworker;
			w.onClose = function()
			{
				if( this.connectedworker ) this.connectedworker.postMessage( {'terminate':1} );
				
				// If we have prev current
				if( curr )
				{
					_ActivateWindow( curr );
					_WindowToFront( curr );
				}
			}

			uprogress.myview = w;

			// Setup progress bar
			let eled = w.getWindowElement().getElementsByTagName( 'div' );
			for( let a = 0; a < eled.length; a++ )
			{
				if( eled[a].className )
				{
					let types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar', 'Info', 'Progress' ];
					for( let b = 0; b < types.length; b++ )
					{
						if( eled[a].className.indexOf( types[b] ) == 0 )
						{
							switch( types[b] )
							{
								case 'ProgressBar': progressbar    = eled[a]; break;
								case 'Groove':      groove         = eled[a]; break;
								case 'Frame':       frame          = eled[a]; break;
								case 'Bar':         bar            = eled[a]; break;
								case 'Info':		uprogress.info = eled[a]; break;
								case 'Progress':    progress       = eled[a]; break;
							}
							break;
						}
					}
				}
			}


			//activate cancel button... we assume we only hav eone button in the template
			let cb = w.getWindowElement().getElementsByTagName( 'button' )[0];

			cb.mywindow = w;
			cb.onclick = function( e )
			{
				uworker.terminate(); // End the copying process
				this.mywindow.close();
			}

			// Only continue if we have everything
			if( progressbar && groove && frame && bar )
			{
				progressbar.style.position = 'relative';
				frame.style.width = '100%';
				frame.style.height = '40px';
				groove.style.position = 'absolute';
				groove.style.width = '100%';
				groove.style.height = '30px';
				groove.style.top = '0';
				groove.style.left = '0';
				progress.style.position = 'absolute';
				progress.style.top = '0';
				progress.style.left = '0';
				progress.style.width = '100%';
				progress.style.height = '30px';
				progress.style.textAlign = 'center';
				progress.style.zIndex = 2;
				bar.style.position = 'absolute';
				bar.style.width = '2px';
				bar.style.height = '30px';
				bar.style.top = '0';
				bar.style.left = '0';

				// Preliminary progress bar
				bar.total = 1;
				bar.items = 1;
				uprogress.bar = bar;
			}
			uprogress.loaded = true;
			uprogress.setProgress( 0 );
		}

		// For the progress bar
		uprogress.setProgress = function( percent, wri, tot )
		{
			// only update display if we are loaded...
			// otherwise just drop and wait for next call to happen ;)
			if( uprogress.loaded )
			{
				uprogress.bar.style.width = Math.floor( Math.max(1,percent ) ) + '%';
				progress.innerHTML = Math.floor( percent ) + '%' + ( wri ? ( ' ' + humanFilesize( wri ) + '/' + humanFilesize( tot ) ) : '' );
			}
			if( percent == 100 )
			{
				uprogress.done = true;
				if( uprogress.info )
					uprogress.info.innerHTML = '<div id="transfernotice" style="padding-top:10px;">' +
						'Storing file in destination folder...</div>';
			}
		};

		// show notice that we are transporting files to the server....
		uprogress.setUnderTransport = function()
		{
			if( uprogress.done ) return;
			if( uprogress.info )
				uprogress.info.innerHTML = '<div id="transfernotice" style="padding-top:10px;">' +
					'Transferring files to target volume...</div>';
			uprogress.myview.setFlag( 'height', 125 );
		}

		// An error occurred
		uprogress.displayError = function( msg )
		{
			if( uprogress.info )
				uprogress.info.innerHTML = '<div style="color:#F00; padding-top:10px; font-weight:700;">'+ msg +'</div>';
			uprogress.myview.setFlag( 'height', 140 );
		}

		// Error happened!
		uworker.onerror = function( err )
		{
			console.log( 'Upload worker error #######' );
			console.log( err );
			console.log( '###########################' );
		};
		uworker.onmessage = function( e )
		{
			if( e.data['progressinfo'] == 1 )
			{
				if( e.data['uploadscomplete'] == 1 )
				{
					w.close();
					Notify({'title':i18n('i18n_pasted_file'),'text':i18n('i18n_pasted_to_downloads') + '(' + filename +')' });
					return true;
				}
				else if( e.data['progress'] )
				{
					let tot = -1;
					
					// Do we get extra information?
					if( e.data[ 'bytesWritten' ] )
					{
						uprogress.setProgress( e.data['progress'], e.data[ 'bytesWritten' ], e.data[ 'bytesTotal' ] );
					}
					// No extra information
					else
					{
						uprogress.setProgress( e.data['progress'] );
					}
					
					if( e.data['filesundertransport'] && e.data['filesundertransport'] > 0 )
					{
						uprogress.setUnderTransport();
					}
				}

			}
			else if( e.data['error'] == 1 )
			{
				uprogress.displayError(e.data['errormessage']);
			}
			else
			{
				console.log('Unhandles message from filetransfer worker',e);
			}

		}

		uprogress.load();

		//hardcoded pathes here!! TODO!
		
		
		let fileMessage = {
			'session': Workspace.sessionId,
			'targetPath': 'Home:Downloads/',
			'targetVolume': 'Home',
			'files': [ file ],
			'filenames': [ filename ]
		};
		uworker.postMessage( fileMessage );		
	},
	updateViewState: function( newState )
	{
		let self = this;

		// Don't update if not changed
		if( this.currentViewState == newState )
		{
			// Starts sleep timeout again (five minutes without activity sleep)
			this.sleepTimeout();
			return;
		}
		
		if( window.Module && !Workspace.sessionId )
		{
			if( this.updateViewStateTM )
				return;
			this.updateViewStateTM = setTimeout( function(){ 
				Workspace.updateViewState( newState );
				self.updateViewStateTM = null;
			}, 250 );
			if( Workspace.loginCall )
			{
				Workspace.loginCall.destroy();
				Workspace.loginCall = null;
			}
			Friend.User.ReLogin();
			return; 
		}
		
		//mobileDebug( 'Starting update view state.' + newState, true );
		
		if( newState == 'active' )
		{
			Workspace.nudgeWorkspacesWidget();
			
			document.body.classList.add( 'ViewStateActive' );

			// Tell all windows
			if( window.friendApp )
			{
				let appsNotified = {};
				for( let a in movableWindows )
				{
					let win = movableWindows[ a ];
					if( win.applicationId )
					{
						// Notify window
						win.windowObject.sendMessage( {
							command: 'notify',
							method: 'wakeup',
							value: 'active'
						} );
						// Notify application too
						if( !appsNotified[ win.applicationId ] )
						{
							for( let b = 0; b < Workspace.applications.length; b++ )
							{
								if( Workspace.applications[ b ].applicationId == win.applicationId )
								{
									Workspace.applications[ b ].sendMessage( {
										command: 'notify',
										method: 'wakeup',
										value: 'active'
									} );
									appsNotified[ win.applicationId ] = true;
									break;
								}
							}
						}
					}
				}
			}
			// IMPORTANT:
			// Sleep in 5 minutes
			if( this.sleepingTimeout )
				clearTimeout( this.sleepingTimeout );
			Workspace.sleeping = false;
			Workspace.sleepingTimeout = null;
		}
		else
		{
			document.body.classList.remove( 'ViewStateActive' );
			document.body.classList.remove( 'Activating' );
			
			if( !Workspace.conn || !Workspace.conn.ws )
			{
				Workspace.initWebSocket();
			}
		}
		this.sleepTimeout();
		this.currentViewState = newState;
	},
	sleepTimeout: function()
	{
		// IMPORTANT: Only for desktops!
		// Sleep in 5 minutes
		if( !window.friendApp )
		{
			if( this.sleepingTimeout )
				return;
			this.sleepingTimeout = setTimeout( function()
			{
				Workspace.sleeping = true;
				Workspace.sleepingTimeout = null;
				Workspace.updateViewState( 'inactive' );
			}, 1000 * 60 * 5 );
		}
	},
	// Execute when everything is ready
	onReady: function()
	{
		if( this.onReadyList.length )
		{
			// Don't  run it twice
			Workspace.onReady = function(){
				return Workspace.receivePush( false, true );
			};
			
			for( let a = 0; a < this.onReadyList.length; a++ )
			{
				this.onReadyList[ a ]();
			}
			this.onReadyList = [];
		}

		//
		//if we dont have a sessionid we will need to wait a bit here...
		//

		if( typeof friendApp != 'undefined' && typeof friendApp.exit == 'function')
		{
			// if this is mobile app we must register it
			// if its already registered FC will not do it again
			let version = null;
			let platform = null;
			let appToken = null;
			let deviceID = null;
			//var appToken = friendApp.appToken ? friendApp.appToken : false;

			if( typeof friendApp.get_version == 'function' )
			{
				version = friendApp.get_version();
			}
			if( typeof friendApp.get_platform == 'function' )
			{
				platform = friendApp.get_platform();
			}
			if( typeof friendApp.get_app_token == 'function' )
			{
				appToken = friendApp.get_app_token();
			}
			if( typeof friendApp.get_deviceid == 'function' )
			{
				deviceID = friendApp.get_deviceid();
			}

			//console.log('onReady called a bunch of friendApp functions with our sessionid ' + Workspace.sessionId );

			if( appToken != null )	// old applications which do not have appToken will skip this part
			{
				let l = new Library( 'system.library' );
				l.forceSend = true;
				l.onExecuted = function( e, d )
				{
					if( e != 'ok' )
					{
						console.log( 'Failed to create uma.' );
					}
				}
				l.execute( 'mobile/createuma', { sessionid: Workspace.sessionId, apptoken: appToken, deviceid: deviceID, appversion: version, platform: platform } );
			}
		}
		return true;
	},
	Tasklist: function( e )
	{
		if( this.taskw )
		{
			refreshTaskList();
			return this.taskw.activate();
		}
		this.taskw = new View( {
			title: i18n( 'i18n_manage_tasks' ),
			width: 400,
			height: 500
		} );
		this.taskw.onClose = function()
		{
			if( Workspace.taskw )
			{
				if( Workspace.taskw.int )
				{
					clearInterval( Workspace.taskw.int );
					Workspace.taskw.int = null;
				}
			}
			Workspace.taskw = null;
		}
		function refreshTaskList()
		{
			let listArea = ge( 'TasklistTasks' );
			if( !listArea ) return;
			let current = listArea.getElementsByClassName( 'ListTask' );
			// Add new
			let adders = [];
			for( let a in Workspace.applications )
			{
				let tid = Workspace.applications[ a ].id;
				found = false;
				for( let b = 0; b < current.length; b++ )
				{
					if( current[ b ].getAttribute( 'TaskID' ) == tid )
					{
						found = true;
						break;
					}
				}
				if( !found )
				{
					adders.push( Workspace.applications[ a ] );
				}
			}
			let sw = 2;
			for( let a = 0; a < adders.length; a++ )
			{
				sw = sw == 1 ? 2 : 1;
				let d = document.createElement( 'div' );
				d.className = 'ListTask HRow Padding sw' + sw;
				d.setAttribute( 'TaskID', adders[ a ].id )
				d.innerHTML = '<div class="HContent80 FloatLeft">' + adders[ a ].applicationName + '</div>' +
					'<div class="HContent20 FloatLeft TextRight">' +
						'<span class="MousePointer IconSmall fa-remove" onclick="Workspace.killByTaskId(\'' + adders[a].id + '\')"> </span>' +
					'</div></div>';
				if( listArea.childNodes.length )
					listArea.insertBefore( d, listArea.firstChild );
				else listArea.appendChild( d );
			}
			// Remove non existent
			let removers = [];
			current = listArea.getElementsByClassName( 'ListTask' );
			for( let a = 0; a < current.length; a++ )
			{
				let found = false;
				for( let b in Workspace.applications )
				{
					if( current[ a ].getAttribute( 'TaskID' ) == Workspace.applications[ b ].id )
					{
						found = true;
						break;
					}
				}
				if( !found )
				{
					removers.push( current[ a ] );
				}
			}
			for( let a = 0; a < removers.length; a++ )
			{
				listArea.removeChild( removers[ a ] );
			}
		}
		this.taskw.int = setInterval( function()
		{
			refreshTaskList();
		}, 500 );
		this.taskw.setContent( '<div class="ContentFull ScrollArea List" id="TasklistTasks"></div>' );
	},
	killByTaskId: function( id )
	{
		let self = this;
		for( let a in Workspace.applications )
			if( Workspace.applications[ a ].id == id )
				Workspace.applications[ a ].quit();
		setTimeout( function()
		{
			self.Tasklist();
		}, 250 );
	}
};

// Application messaging start -------------------------------------------------
ApplicationMessagingNexus = {
	ports: {},
	// Opens a message port on application
	open: function( appid, callback )
	{
		let fapp = false;
		for( let a = 0; a < Workspace.applications.length; a++ )
		{
			if( Workspace.applications[ a ].applicationId == appid )
			{
				fapp = Workspace.applications[ a ];
				break;
			}
		}
		if( fapp )
		{
			this.ports[ appid ] = {
				hash: CryptoJS.SHA1( appid ).toString(),
				app: fapp
			};
		}
		// Call back
		if( callback )
		{
			callback( fapp ? true : false );
		}
	},
	// Closes a messageport on application
	close: function( appid, callback )
	{
		let found = false;
		let newl = {};
		for( let a in this.ports )
		{
			if( a == appid )
			{
				found = this.ports[ a ];
			}
			else
			{
				newl[ a ] = this.ports[ a ];
			}
		}
		if( found )
		{
			this.ports = newl;
			if( found.app.sendMessage )
			{
				found.app.sendMessage( {
					type: 'applicationmessage',
					command: 'closed'
				} );
			}
		}
		// Callback
		if( callback )
		{
			callback( found ? true : false );
		}
	}
};
// Application messaging end ---------------------------------------------------

Doors = Workspace;

// Triggered on mouse leaving
function DoorsOutListener( e )
{
	if ( e.relatedTarget == null )
	{
		movableMouseUp( e );
	}
	// Keep alive!
	Workspace.updateViewState( 'active' );
}
function DoorsLeaveListener( e )
{
	movableMouseUp( e );
	
	// Keep alive!
	Workspace.updateViewState( 'active' );
}
function DoorsKeyUp( e )
{
	Workspace.shiftKey = e.shiftKey;
	Workspace.ctrlKey = e.ctrlKey;
	Workspace.altKey = e.altKey;
	Workspace.metaKey = e.metaKey;
	
	// Hide task switcher
	if( e.which == 91 || ( !Workspace.shiftKey && !Workspace.ctrlKey ) )
	{
		if( window.DeepestField )
			DeepestField.selectTask();	
	}
}
function DoorsKeyDown( e )
{
	// Keep alive!
	Workspace.updateViewState( 'active' );

	let w = e.which ? e.which : e.keyCode;
	let tar = e.target ? e.target : e.srcElement;
	Workspace.shiftKey = e.shiftKey;
	Workspace.ctrlKey = e.ctrlKey;
	Workspace.altKey = e.altKey;
	Workspace.metaKey = e.metaKey;
	
	if( e.ctrlKey || e.metaKey )
	{
		if( w == 65 )
		{
			if( currentMovable && currentMovable.content.directoryview )
			{
				currentMovable.content.directoryview.SelectAll();
				return cancelBubble( e );
			}
		}
		else if( w == 77 || w == 27 )
		{
			Workspace.toggleStartMenu();
			return cancelBubble( e );
		}
	}
	
	// Start menu key navigation
	if( Workspace.smenu.visible )
	{
		let m = Workspace.smenu;
		let move = false;
		switch( e.which )
		{
			case 38:
				move = 'up';
				break;
			case 40:
				move = 'down';
				break;
			case 37:
				move = 'right';
				break;
			case 39:
				move = 'left';
				break;
			case 13:
				move = 'enter';
				break;
		}
		if( move )
		{
			// Cycle
			if( !m.currentItem )
			{
				let cm = m.dom.getElementsByTagName( '*' )[0];
				if( !cm )
					return;
				let itms = cm.getElementsByClassName( 'DockMenuItem' );
				if( move == 'up' )
				{
					for( let a = 0; a < itms.length; a++ )
					{
						if( itms[a].parentNode != cm ) continue;
					}
					m.currentItem = itms[ a - 1 ];
				}
				else if( move == 'down' )
				{
					m.currentItem = itms[0];
				}
			}
			// Cycle
			else
			{
				let itms = m.currentItem.parentNode.getElementsByClassName( 'DockMenuItem' );
				if( move == 'enter' )
				{
					m.currentItem.onclick( e );
				}
				else if( move == 'left' )
				{
					let ts = m.currentItem.getElementsByClassName( 'DockMenuItem' );
					for( let a = 0; a < ts.length; a++ )
					{
						if( ts[a].parentNode != ts[0].parentNode ) continue;
						m.currentItem = ts[a];
					}
				}
				else if( move == 'right' )
				{
					m.currentItem = m.currentItem.parentNode.parentNode;
				}
				else if( move == 'up' )
				{
					let sameLevel = [];
					for( let a = 0; a < itms.length; a++ )
					{
						if( itms[a].parentNode != m.currentItem.parentNode )
							continue;
						sameLevel.push( itms[a] );
					}
					for( let a = 0; a < sameLevel.length; a++ )
					{
						if( sameLevel[a] == m.currentItem )
						{
							if( a > 0 )
							{
								m.currentItem = sameLevel[ a - 1 ];
								break;
							}
							else
							{
								m.currentItem = sameLevel[ sameLevel.length - 1 ];
								break;
							}
						}
					}
				}
				else if( move == 'down' )
				{
					let sameLevel = [];
					for( let a = 0; a < itms.length; a++ )
					{
						if( itms[a].parentNode != m.currentItem.parentNode )
							continue;
						sameLevel.push( itms[a] );
					}
					for( let a = 0; a < sameLevel.length; a++ )
					{
						if( sameLevel[a] == m.currentItem )
						{
							if( a < sameLevel.length - 1 )
							{
								m.currentItem = sameLevel[ a + 1 ];
								break;
							}
							else
							{
								m.currentItem = sameLevel[ 0 ];
								break;
							}
						}
					}
				}
			}
			if( m.currentItem )
			{
				let itms = Workspace.smenu.dom.getElementsByTagName( '*' );
				for( let a = 0; a < itms.length; a++ )
				{
					if( itms[a] != m.currentItem )
					{
						if( itms[a].classList ) itms[a].classList.remove( 'Active' );
					}
				}
				let t = m.currentItem;
				while( t && t != Workspace.smenu )
				{
					if( t.classList && t.classList.contains( 'DockMenuItem' ) )
						t.classList.add( 'Active' );
					t = t.parentNode;
				}
			}
		}
	}
	
	// Check keys on directoryview ---------------------------------------------
	if( window.currentMovable && currentMovable.content && currentMovable.content.directoryview )
	{
		if( w == 113 || w == 27 )
		{
			let icons = currentMovable.content.icons;
			let dvi = currentMovable.content.directoryview;
			for( let a = 0; a < icons.length; a++ )
			{
				if( icons[a].domNode && icons[a].domNode.classList.contains( 'Selected' ) )
				{
					// Abort editing
					if( w == 27 )
					{
						for( let b = 0; b < icons.length; b++ )
						{
							if( icons[b].domNode )
							{
								icons[b].domNode.classList.remove( 'Selected' );
								icons[b].domNode.classList.remove( 'Editing' );
								if( icons[b].editField )
								{
									icons[b].editField.parentNode.removeChild( icons[b].editField );
									icons[b].editField = null;
								}
							}
						}
						return cancelBubble( e );
					}
					// Aha, F2!
					icons[a].domNode.classList.add( 'Editing' );
					let input = document.createElement( 'textarea' );
					input.className = 'Title';
					icons[a].editField = input;
					input.value = icons[a].Filename ? icons[a].Filename : icons[a].fileInfo.Filename;
					input.dom = dvi.listMode == 'listview' ? icons[a].domNode.querySelector( '.Column' ) : icons[a].domNode;
					icons[a].domNode.input = input;
					input.ico = icons[a];
					input.onkeydown = function( e )
					{
						clearTimeout( Workspace.editing );
						Workspace.editing = setTimeout( function()
						{
							Workspace.editing = false;
						}, 100 );
						if( e.which == 13 )
						{
							Workspace.executeRename( this.value, this.ico, currentMovable );
							this.ico.editField = null;
							this.dom.input = null;
							let s = this;
							setTimeout( function()
							{
								try
								{
									s.dom.removeChild( s );
								}
								catch( error )
								{
									/* .. */
								}
							}, 5 );
						}
					}
					input.onmousedown = function( e )
					{
						this.selectionEnd = 0;
						this.selectionStart = 0;
						return cancelBubble( e );
					}
					input.onmouseup = function( e )
					{
						return cancelBubble( e );
					}
					input.onblur = function()
					{
						this.onkeydown( { which: 13 } );
						return;
					}
					setTimeout( function()
					{
						input.select();
						input.focus();
					}, 50 );
					icons[a].domNode.appendChild( input );
				}
			}
		}
	}
	
	if( ( e.shiftKey && e.ctrlKey ) || e.metaKey )
	{
		if( globalConfig && globalConfig.workspacecount > 1 )
		{
			switch( w )
			{
				// ws 1
				case 49:
					Workspace.switchWorkspace( 0 );
					return cancelBubble( e );
				// ws 1
				case 50:
					Workspace.switchWorkspace( 1 );
					return cancelBubble( e );
				// ws 1
				case 51:
					Workspace.switchWorkspace( 2 );
					return cancelBubble( e );
				// ws 1
				case 52:
					Workspace.switchWorkspace( 3 );
					return cancelBubble( e );
				// ws 1
				case 53:
					Workspace.switchWorkspace( 4 );
					return cancelBubble( e );
				// ws 1
				case 54:
					Workspace.switchWorkspace( 5 );
					return cancelBubble( e );
				// ws 1
				case 55:
					Workspace.switchWorkspace( 6 );
					return cancelBubble( e );
				// ws 1
				case 56:
					Workspace.switchWorkspace( 7 );
					return cancelBubble( e );
				// ws 1
				case 57:
					Workspace.switchWorkspace( 8 );
					return cancelBubble( e );		
				// App cycling
				case 32:
					if( window.DeepestField )
						DeepestField.showTasks();
					break;
			}
		}
	}
	else if( e.ctrlKey && w == 32 )
	{
		if( window.DeepestField )
			DeepestField.showTasks();
	}

	if( !w || !e.ctrlKey )
	{
		switch( w )
		{
			// Escape means try to close the view
			case 27:
				// Inputs don't need to close the view
				if( tar && ( tar.nodeName == 'INPUT' || tar.nodeName == 'SELECT' || tar.nodeName == 'TEXTAREA' ) )
				{
					tar.blur();
					return;
				}
				if( mousePointer.elements.length )
				{
					mousePointer.elements = [];
					mousePointer.dom.innerHTML = '';
					mousePointer.drop();
					if( currentMovable && currentMovable.content )
					{
						if( currentMovable.content.refresh )
						{
							if( currentMovable.content.directoryview )
								currentMovable.content.directoryview.toChange = true;
							currentMovable.content.refresh();
						}
					}
					return;
				}
				if( currentMovable )
				{
					if( currentMovable.content )
					{
						if( currentMovable.content.windowObject )
						{
							// Not possible to send message?
							if( !currentMovable.content.windowObject.sendMessage( { type: 'view', method: 'close' } ) )
							{
								CloseView( currentMovable );
							}
						}
						else
						{
							CloseView( currentMovable );
						}
					}
					else
					{
						CloseView( currentMovable );
					}
				}
				break;
			default:
				//console.log( 'Clicked: ' + w );
				break;
		}
		return;
	}

	switch( w )
	{
		// Run command
		case 69:
			Workspace.showLauncher();
			return cancelBubble( e );
			break;
		default:
			//console.log( w );
			break;
	}
}

// TODO: Reevalute if we even need this
/*// Traps pasting to clipboard
document.addEventListener( 'paste', function( evt )
{
	if( typeof friend != undefined && typeof Friend.pasteClipboard == 'function' ) 
		Friend.pasteClipboard( evt );
} );

// paste handler. check Friend CB vs System CB.

function friendWorkspacePasteListener( evt )
{
	let mimetype = '';
	let cpd = '';

	if( !evt.clipboardData )
	{
		return true;
	}
	else if( evt.clipboardData.types.indexOf( 'text/plain' ) > -1 )
	{
		mimetype = 'text/plain';
	}

	//we only do text handling here for now
	if( mimetype != '' )
	{
		cpd = evt.clipboardData.getData( mimetype );

		//console.log('compare old and new',cpd,Friend.prevClipboard,Friend.clipboard);
		if( Friend.prevClipboard != cpd )
		{
			Friend.prevClipboard = Friend.clipboard;
			Friend.clipboard = cpd;
		}
	}
	return true;
}*/

function WindowResizeFunc()
{
	Workspace.redrawIcons();
	Workspace.repositionWorkspaceWallpapers();
	if( isMobile && Workspace.widget )
		Workspace.widget.setFlag( 'width', window.innerWidth );
	for( let a in movableWindows )
	{
		if( movableWindows[a].content && movableWindows[a].content.redrawIcons )
			movableWindows[a].content.redrawIcons();
	}
}

function InitWorkspaceEvents()
{
	if( window.attachEvent )
	{
		window.attachEvent( 'onmouseout', DoorsOutListener, false );
		window.attachEvent( 'onmouseleave', DoorsLeaveListener, false );
		window.attachEvent( 'onresize', WindowResizeFunc, false );
		window.attachEvent( 'onkeydown', DoorsKeyDown, false );
		window.attachEvent( 'onkeyup', DoorsKeyUp, false );
	}
	else
	{
		// Track fullscreen
		window.addEventListener( 'fullscreenchange', function( e )
		{
			// Add class when needed
			if( document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement )
				document.body.classList.add( 'Fullscreen' );
			else document.body.classList.remove( 'Fullscreen' );
		}, false );
		window.addEventListener( 'mouseout', DoorsOutListener, false );
		window.addEventListener( 'mouseleave', DoorsLeaveListener, false );
		window.addEventListener( 'resize', WindowResizeFunc, false );
		window.addEventListener( 'keydown', DoorsKeyDown, false );
		window.addEventListener( 'keyup', DoorsKeyUp, false );
		//window.addEventListener( 'paste', friendWorkspacePasteListener, false);
	}
}

function InitWorkspaceNetwork()
{
	let wsp = Workspace;
	
	if( wsp.workspaceNetworkInitialized ) return;
	wsp.workspaceNetworkInitialized = true;
	
	// Establish a websocket connection to the core
	if( !wsp.conn && wsp.sessionId && window.FriendConnection )
	{
		wsp.initWebSocket();
	}

	wsp.checkFriendNetwork();
	
	if( window.PouchManager && !this.pouchManager )
		this.pouchManager = new PouchManager();
}

// Voice -----------------------------------------------------------------------

function ExecuteVoiceCommands( e )
{
	alert( e.target.form.q.value );
}

// -----------------------------------------------------------------------------


// Popup an About FriendUP dialog...
function AboutFriendUP()
{
	if( !Workspace.sessionId ) return;
	let v = new View( {
		title: i18n( 'i18n_title_about_friendos' ) + ' Hydrogen4',
		width: 540,
		height: 560,
		id: 'about_friendup'
	} );

	// Check for app token
	let token = '';
	if( isMobile && window.friendApp )
	{
		token = friendApp.get_app_token();
		if( token && token.length )
		{
			token = '<div class="item"><span class="label">App token</span><span class="value"> ' + token + '</span></div>';
		}
	}
	
	let s = new Module( 'system' );
	s.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			let json = false;
			try
			{
				json = JSON.parse( d );
			}
			catch( e ){};
			if( json && json.useAboutTemplate === '1' )
			{
				setData( json.liveAboutTemplate );
				return;
			}
		}
		setData();
	}
	s.execute( 'getserverglobals' );

	function setData( str )
	{
		if( !str ) str = false;
		
		v.setRichContentUrl( str ? str : '/webclient/templates/about.html', false, null, null, function()
		{
			let buildInfo = '<div id="buildInfo">no build information available</div>';
			if( Workspace.systemInfo && Workspace.systemInfo.FriendCoreBuildDate )
			{
				buildInfo = '<div id="buildInfo">';
				buildInfo += '	<div class="item"><span class="label">Build date</span><span class="value">'+ Workspace.systemInfo.FriendCoreBuildDate +'</span></div>';
				if( Workspace.systemInfo.FriendCoreBuildDate ) buildInfo += '	<div class="item"><span class="label">Version</span><span class="value">'+ Workspace.systemInfo.FriendCoreVersion +'</span></div>';
				if( Workspace.systemInfo.FriendCoreBuild ) buildInfo += '	<div class="item"><span class="label">Build</span><span class="value">'+ Workspace.systemInfo.FriendCoreBuild +'</span></div>';

				// Add app token
				if( token ) buildInfo += token;
			
				// Add device ID
				if( window.friendApp )
				{
					let ver = friendApp.get_version();
					if( ver )
					{
						buildInfo += '    <div class="item"><span class="label">Mobile App Version</span><span class="value">'+ ver +'</span></div>';
					}
					let devId = friendApp.get_deviceid();
					if( devId )
					{
						buildInfo += '    <div class="item"><span class="label">DeviceID</span><span class="value">'+ devId +'</span></div>';
					}
				}

				buildInfo += '<div style="clear: both"></div></div>';
			}

			let aboutFrame = ge( 'about_friendup' ).getElementsByTagName( 'iframe' )[ 0 ];
			if( aboutFrame.contentWindow.document.getElementById( 'fc-info' ) )
			{
				aboutFrame.contentWindow.document.getElementById( 'fc-info' ).innerHTML = buildInfo;
			}
			aboutFrame.setAttribute( 'scrolling', 'yes' );

		} );
	}
}

// Clear cache
function ClearCache()
{
	let m = new FriendLibrary( 'system.library' );
	m.execute( 'clearcache' );
	
	if( typeof friendApp != 'undefined' && typeof friendApp.clear_cache == 'function')
	{
		friendApp.clear_cache();
	}
}

// -----------------------------------------------------------------------------

// Shows eula

function ShowEula( accept, cbk )
{
	if( accept )
	{
		let m = new Module( 'system' );
		m.addVar( 'sessionid', Workspace.sessionId );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				let eles = document.getElementsByTagName( 'div' );
				for( let a = 0; a < eles.length; a++ )
				{
					if( eles[a].className == 'Eula' )
						eles[a].parentNode.removeChild( eles[a] );
				}
				setTimeout( function()
				{
					Workspace.refreshDesktop( false, true );
				}, 500 );
			}
		}
		m.execute( 'setsetting', {
			setting: 'accepteula',
			data:    'true'
		} );

		//call device refresh to make sure user get his devices...
		let dl = new FriendLibrary( 'system.library' );
		dl.addVar( 'visible', true );
		//dl.forceSend = true;
		dl.onExecuted = function( e, d )
		{
			//console.log( 'First login. Device list refreshed.', e, d );
		};
		dl.execute( 'device/refreshlist' );
		return;
	}


	let d = document.createElement( 'div' );
	d.className = 'Eula';
	d.id = 'EulaDialog';
	document.body.appendChild( d );

	// Using a configurable eula document
	if( Workspace.euladocument )
	{
		let n = new Module( 'system' );
		n.onExecuted = function( e, data )
		{
			if( e == 'ok' )
			{
				d.innerHTML = '<div class="EulaText SmoothScrolling"><div>' + data + '</div></div>\
				<div class="EulaInfo">\
		<div>\
			<button type="button" class="Button IconSmall fa-cross" onclick="document.location.href=\'http://duckduckgo.com\';">\
				I decline\
			</button>\
			\
			<button type="button" class="Button IconSmall fa-accept" onclick="ShowEula(true)">\
				I accept\
			</button>\
		</div>\
	</div>';
				// Tell app we can show ourselves!
				if( window.friendApp && window.friendApp.reveal )
				{
					friendApp.reveal();
				}
			}
		}
		n.execute( 'geteuladocument' );
	}
	// Using the Friend OS standard eula
	else
	{
		let f = new File( 'System:templates/eula.html' );
		f.onLoad = function( data )
		{
			d.innerHTML = data;
			// Tell app we can show ourselves!
			if( window.friendApp && window.friendApp.reveal )
			{
				friendApp.reveal();
			}		
		}
		f.load();
	}
}



// SAS ID
function handleSASRequest( e )
{
	let title = 'Shared app invite from ' + e.owner;
	Confirm( title, e.message, confirmBack );

	function confirmBack( res )
	{
		if ( res )
			accept( e );
		else deny( e.sasid );
	}

	function accept( data )
	{
		ExecuteApplication( e.appname, JSON.stringify( e ) );
	}

	function deny( sasid )
	{
		let dec = {
			path : 'system.library/sas/decline/',
			data : {
				sasid : sasid,
			},
		};
		Workspace.conn.request( dec, unBack );
		function unBack( res )
		{
			console.log( 'Workspace.handleSASRequest - req denied, decline, result', res );
		}
	}
}

function handleServerMessage( e )
{
	if( e.message && e.appname )
	{
		let apps = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
		for( let a = 0; a < apps.length; a++ )
		{
			// TODO: Have per application permissions here..
			// Not all applications should be able to send messages to
			// all other applications...
			if( apps[a].applicationDisplayName == e.appname )
			{
				let nmsg = {
					command: 'notify',
					applicationId: apps[a].applicationId,
					authId: e.message.authId,
					method: 'servermessage',
					message: e.message
				};				
				apps[a].contentWindow.postMessage( nmsg, '*' );
			}
		}
	}
	else
	{
		let msg = {
			title : 'Unhandled server message',
			text : 'The server could not interpret incoming message.'
		};
		Notify( msg );
	}
}

/*
	handle notification that comes from another user via websocket
*/
function handleServerNotice( e )
{
	//check if the message is parsable JSON... if it is, we might have received a msg for an app
	let tmp = false;
	try{
		tmp = JSON.parse( e.message );
		if( tmp && tmp.msgtype )
		{
			handleNotificationMessage( tmp )
			return;
		}
	}
	catch(e)
	{
		//nothing to show here... continue walking
	}
	
	
	let msg = {
		title : 'Server notice - from: ' + e.username,
		text : e.message,
	};
	Notify( msg, notieBack, clickCallback );

	function notieBack( e )
	{
		console.log( 'handleServerNotice - Notify callback', e );
	}

	function clickCallback( e )
	{
		console.log( 'handleServerNotice - Click callback', e );
	}
}

function handleNotificationMessage( msg )
{
	if( !msg || !msg.msgtype ) return;
	switch( msg.msgtype )
	{
		case 'applicationmessage':
			let w=false;
			for( let a in movableWindows )
			{
				w = movableWindows[a].windowObject;
				if( w && w.viewId && w.viewId == msg.targetapp )
				{
					w.sendMessage({'command': msg.applicationcommand});
				}

			}
			break;
	}
}

for( let a in WorkspaceInside )
	Workspace[a] = WorkspaceInside[a];
delete WorkspaceInside;
checkForFriendApp();
InitDynamicClassSystem();

document.addEventListener( 'paste', function( evt )
{
	Workspace.handlePasteEvent( evt );
} );

// Push notification integration and other app events --------------------------
if( window.friendApp )
{
	// Receive a click from an app bubble (notification on app side)
	Workspace.receiveAppBubbleClick = function( cid )
	{
		// Run the click callback
		let func = getWrapperCallback( cid );
		if( func )
		{
			func();
		}
	}
}

// Friendchat / presence live events handler
Workspace.receiveLive = function( viewId, jsonEvent ) {
	const self = this;
	let event = null;
	
	try 
	{
		event = JSON.parse( jsonEvent );
	}
	catch( ex )
	{
		console.log( 'Workspace.receiveLive - error parsing json', {
			error     : ex,
			jsonEvent : jsonEvent,
		} );
		return;
	}
	
	console.log( 'receiveLive', {
		viewId : viewId,
		json   : jsonEvent,
		event  : event,
	} );
	
	const appName = 'FriendChat';
	
	// find friendchat app
	let chat = null;
	
	console.log( 'all apps', Workspace.applications );
	
	Workspace.applications.some( app => {
		console.log( 'looking for chat', {
			app  : app,
			name : app.applicationName,
		} );
		if ( app.applicationName != appName )
			return false;
		
		chat = app;
		return true;
	} );
	
	if( !chat )
	{
		console.log( 'receiveLive - chat not found' );
		return;
	}
	
	// send event
	const msg = {
		type   : 'native-view',
		viewId : viewId,
		data   : event,
	};
	chat.contentWindow.postMessage( msg, '*' );
}

Workspace.pushTrashcan = {};

// Receive push notification (when a user clicks native push notification on phone)
Workspace.receivePush = function( jsonMsg, ready )
{
	//console.log( 'Workspace.receivePush', jsonMsg );
	if( !isMobile ) return 'mobile';
	let msg = jsonMsg ? jsonMsg : ( window.friendApp && typeof friendApp.get_notification == 'function' ? friendApp.get_notification() : false );

	// we use 1 as special case for no push being here... to make it easier to know when to launch startup sequence... maybe not ideal, but works
	if( msg == false || msg == 1 ) 
	{
		if( !ready && this.onReady ) this.onReady();
		return 'nomsg';
	}
	try
	{
		//mobileDebug( 'Push notify... (state ' + Workspace.currentViewState + ')' );
		msg = JSON.parse( msg );
	}
	catch( e )
	{
		// Do nothing for now...
	}
	if( !msg ) 
	{
		if( !ready && this.onReady ) this.onReady();
		return 'nomsg';
	}
	
	// Disregard already handled notifications.
	if( msg.notifid )
	{
		if( this.pushTrashcan[ msg.notifid ] )
		{
			//console.log( 'Already processed notifid ' + msg.notifid );
			return;
		}
		this.pushTrashcan[ msg.notifid ] = true;
	}
		
	// Clear the notifications now... (race cond?)
	if( window.friendApp )
		friendApp.clear_notifications();
	
	let messageRead = trash = false;
	
	// Display message
	if( !msg.clicked && ( msg.title||msg.text ) )
	{
		// Revert to push notifications on the OS side
		Notify( { title: msg.title, text: msg.text }, null, handleClick );
		if( !ready && this.onReady ) this.onReady();
		return 'ok';
	}
	// "Click"
	else
	{
		handleClick();
	}
	
	function handleClick()
	{
		//console.log( 'handleClick ??' );
		if( !msg.application || msg.application == 'null' ) 
		{
			if( !ready && Workspace.onReady ) Workspace.onReady();
			return 'noapp';
		}
	
		//check if extras are base 64 encoded... and translate them to the extra attribute which shall be JSON
		if( msg.extrasencoded && msg.extrasencoded.toLowerCase() == 'yes' )
		{
			try
			{
				if( msg.extras ) msg.extra = JSON.parse( atob( msg.extras ).split(String.fromCharCode(92)).join("") );
			}
			catch( e )
			{}
		}
	
		// Check existing applications
		for( let a = 0; a < Workspace.applications.length; a++ )
		{
			if( Workspace.applications[ a ].applicationName == msg.application )
			{
				// Need a "message id" to be able to update notification
				// on the Friend Core side
				if( msg.notifid )
				{
					if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
					{
						//console.log( '[receivePush] We are updating push notification with Friend Core with ' + msg.notifid + ' it was seen...' );
						// Function to set the notification as read...
						let l = new Library( 'system.library' );
						l.onExecuted = function(){};
						l.execute( 'mobile/updatenotification', { 
							notifid: msg.notifid, 
							action: 1,
							pawel: 1
						} );
					}
					else
					{
						//console.log( '[receivePush] We are azleep! Server may push us again with this ' + msg.notifid );
					}
				}
				else
				{
					//console.log( 'No message id...', msg );
				}
			
				mobileDebug( ' Sendtoapp2: ' + JSON.stringify( msg ), true );
				let app = Workspace.applications[a];
				//console.log( 'push to app', [ msg, app ]);
				app.contentWindow.postMessage( JSON.stringify( { 
					type: 'system',
					method: 'pushnotification',
					callback: false,
					data: msg
				} ), '*' );
				
				if( !ready && Workspace.onReady ) Workspace.onReady();
				
				return 'ok';
			}
		}
		
		// Function to set the notification as read...
		function notificationRead()
		{
			if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
			{
				messageRead = true;
				let l = new Library( 'system.library' );
				l.onExecuted = function(){};
				l.execute( 'mobile/updatenotification', { 
					notifid: msg.notifid, 
					action: 1,
					pawel: 2
				} );
			}
		}
	
		// Application not found? Start it!
		// Send message to app once it has started...
		function appMessage()
		{
			let app = false;
			let apps = Workspace.applications;
			
			//too early?
			if( !apps ) return;
			
			for( let a = 0; a < apps.length; a++ )
			{
				// Found the application
				if( apps[ a ].applicationName == msg.application )
				{
					app = apps[ a ];
					break;
				}
			}
			
			// No application? Alert the user
			// TODO: Localize response!
			if( !app )
			{
				// No notification here... we got weird message in our new android app but everything worked...
				if( Workspace.onReady ) Workspace.onReady();
				return;
			}
		
			if( !app.contentWindow ) 
			{
				Notify( { title: i18n( 'i18n_could_not_find_application' ), text: i18n( 'i18n_could_not_find_app_desc' ) } );
				if( Workspace.onReady ) Workspace.onReady();
				return;
			}
		
			let amsg = {
				type: 'system',
				method: 'pushnotification',
				callback: addWrapperCallback( notificationRead ),
				data: msg
			};
		
			mobileDebug( ' Sendtoapp: ' + JSON.stringify( msg ) );
		
			app.contentWindow.postMessage( JSON.stringify( amsg ), '*' );
		
			// Delete wrapper callback if it isn't executed within 1 second
			setTimeout( function()
			{
				if( !messageRead )
				{
					getWrapperCallback( amsg.callback );
				}
			}, 1000 );
			
			if( !ready && Workspace.onReady ) Workspace.onReady();
		}
	
		mobileDebug( 'Start app ' + msg.application + ' and ' + _executionQueue[ msg.application ], true );
		Friend.startupApps[ msg.application ] = true;
		ExecuteApplication( msg.application, '', appMessage );
	}

	return 'ok';
}

// TODO: Remove me after test
document.addEventListener( 'visibilitychange' , function(){
	if( document.hidden )
	{
		Workspace.updateViewState( 'inactive' );
	} 
	else 
	{
		Workspace.updateViewState( 'active' );
	}
}, false );

// Make sure to register if the document is active
if( document.hidden )
{
	Workspace.updateViewState( 'inactive' );
}
else
{
	Workspace.updateViewState( 'active' );
}

/*  Debug blob: */
/*if( isMobile  )
{
	let debug = document.createElement( 'div' );
	debug.style.backgroundColor = 'rgba(255,255,255,0.5)';
	debug.style.bottom = '0px';
	debug.style.width = '100%';
	debug.style.height = '120px';
	debug.style.left = '0px';
	debug.style.color = 'black';
	debug.style.position = 'absolute';
	debug.style.zIndex = 10000000;
	debug.style.pointerEvents = 'none';
	debug.innerHTML = '<span>thomasdebug v01</span>';
	window.debugDiv = debug;
	document.body.appendChild( debug );
}*/

var mobileDebugTime = null;
function mobileDebug( str, clear )
{
	//console.log( 'mobileDebug', str );
	if( !isMobile ) return;
	if( !window.debugDiv ) return;
	if( mobileDebugTime ) clearTimeout( mobileDebugTime );
	if( clear )
	{
		window.debugDiv.innerHTML = '';
	}
	//console.log( '[mobileDebug] ' + str );
	window.debugDiv.innerHTML += str + '<br>';
	mobileDebugTime = setTimeout( function()
	{
		window.debugDiv.innerHTML = '';
		mobileDebugTime = null;
	}, 15000 );
}

// Cache the app themes --------------------------------------------------------
// TODO: Test loading different themes

_applicationBasics = {};
function loadApplicationBasics( callback )
{
	// Don't do in login
	if( Workspace.loginPrompt )
	{
		if( callback )
			callback();
		return;
	}
	
	// Preload basic scripts
	let a_ = new File( '/webclient/js/apps/api.js' );
	a_.onLoad = function( data )
	{
		_applicationBasics.apiV1 = URL.createObjectURL( new Blob( [ data ], { type: 'text/javascript' } ) );
	}
	a_.load();
	let sb_ = new File( '/themes/friendup12/scrollbars.css' );
	sb_.onLoad = function( data )
	{
		if( _applicationBasics.css )
			_applicationBasics.css += data;
		else _applicationBasics.css = data;
	}
	sb_.load();
	// Preload basic scripts
	let c_ = new File( '/system.library/module/?module=system&command=theme&args=%7B%22theme%22%3A%22friendup12%22%7D&sessionid=' + Workspace.sessionId );
	c_.onLoad = function( data )
	{
		if( _applicationBasics.css )
			_applicationBasics.css += data;
		else _applicationBasics.css = data;
	}
	c_.load();
	
	let js = '/webclient/' + [ 'js/oo.js',
	'js/api/friendappapi.js',
	'js/utils/engine.js',
	'js/utils/tool.js',
	'js/utils/json.js',
	'js/io/cajax.js',
	'js/io/appConnection.js',
	'js/io/coreSocket.js',
	'js/gui/treeview.js' ].join( ';/webclient/' );
	let j_ = new File( js );
	j_.onLoad = function( data )
	{
		_applicationBasics.js = data;
		if( callback )
		{
			try
			{
				callback();
			}
			catch( e )
			{
			}
		}
	}
	j_.load();
};

