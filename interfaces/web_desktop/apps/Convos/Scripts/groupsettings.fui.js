/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIGroupsettings extends FUIInvitedialog
{
	constructor( options )
	{
		super( options );
		
		this.initialized = true;
	}
	
	getClassName()
	{
		return 'FUIInvitedialog FUIGroupsettings';
	}
	
	createTitle()
	{
		let t = document.createElement( 'div' );
		t.className = 'Title';
		t.innerHTML = '<span>' + ( this.options.title ? this.options.title : i18n( 'i18n_group_settings' ) ) + '</span><span class="Close"></span>';
		return t;
	}
	
	refreshAvatar()
	{
		let self = this;
		let std = {
			"method": "getroomavatar",
			"groupid": self.options.groupId
		};
		let i = new Image();
		i.src = '/system.library/module/?module=system&command=convos&args=' + encodeURIComponent( JSON.stringify( std ) ) + '&authid=' + Application.authId;
		i.onload = function()
		{
			let c = document.createElement( 'canvas' );
			let ctx = c.getContext( '2d' );
			c.width = this.naturalWidth;     // update canvas size to match image
			c.height = this.naturalHeight;
			ctx.drawImage( this, 0, 0 );       // draw in image
			c.toBlob( function( blob )
			{
				let a = new FileReader();
				a.onload = function(e)
				{
					document.querySelector( '.AvatarPreview' ).style.backgroundImage = 'url(' + e.target.result + ')';
					let overView = FUI.getElementByUniqueId( 'convos' );
					if( overView ) overView.redrawChannels();
				}
				a.readAsDataURL( blob );
			}, 'image/jpeg', 100 );
		};
	}
	
	setFormContents( element )
	{
		let self = this;
		
		let f = new File( 'Progdir:Markup/groupsettings.html' );
		
		let m = new Module( 'system' );
		m.onExecuted = function( me, md )
		{
			if( me == 'fail' ) 
			{
				console.log( 'Impossible no group error.' );
				return false; // TODO: Make some error
			}
			let grp = JSON.parse( md );
			f.replacements = {
				'room-name': grp.Name,
				'room-description': grp.Description,
				'room-status': grp.Status == '1' ? 'checked' : ''
			};
			f.i18n();
			f.load();
		}
		m.execute( 'convos', { method: 'get-group', cid: self.options.groupId } );
		
		f.onLoad = function( data )
		{
			element.innerHTML = data;
			element.classList.remove( 'Loading' );
			
			FUI.initialize();
			FUI.addCallback( 'toggle-private', function( dt )
			{ 
				let m = new Module( 'system' );
				m.execute( 'convos', { method: 'chatroom-status', status: dt == true ? '1' : '0', cid: self.options.groupId } );
			} );
			
			let groupName = ge( 'groupName' );
			let ogn = groupName.value;
			groupName.onkeyup = function()
			{
				if( Trim( this.value ) != Trim( ogn ) )
				{
					let newName = this.value;
					element.querySelector( '.nameChange' ).innerHTML = '<div class="Button IconButton fa-check"></div>';
					element.querySelector( '.nameChange' ).querySelector( '.Button' ).onclick = function()
					{
						let m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							if( e == 'ok' )
							{
								let overView = FUI.getElementByUniqueId( 'convos' );
								if( overView ) overView.redrawChannels();
								let mess = FUI.getElementByUniqueId( 'messages' );
								mess.setTopic( Trim( newName ) );
							}
						}
						m.execute( 'convos', { method: 'rename-chatroom', newname: Trim( newName ), cid: self.options.groupId } );
					}
				}
				else
				{
					element.querySelector( '.nameChange' ).innerHTML = '';
				}
			}
			let groupDesc = ge( 'groupDescription' );
			groupDesc.onkeyup = function()
			{
				if( this.time ) clearTimeout( this.time );
				this.time = setTimeout( function()
				{
					let m = new Module( 'system' );
					m.execute( 'convos', { method: 'room-description', desc: groupDesc.value, cid: self.options.groupId } );
				}, 250 );
			}
			
			let upload = self.domElement.querySelector( '.Upload' );
			upload.onclick = function()
			{
				let flags = {
					multiSelect: false,
					suffix: [ 'jpg', 'jpeg', 'png', 'gif' ],
					triggerFunction: function( arr )
					{
						if( arr && arr.length > 0 )
						{
							let m = new Module( 'system' );
							m.onExecuted = function( me, md )
							{
								if( me == 'ok' )
								{
									let res = JSON.parse( md );
									self.refreshAvatar();
								}
							}
							m.execute( 'convos', { method: 'setroomavatar', path: arr[ 0 ].Path, groupId: self.options.groupId } );
						}
					},
					path: false,
					rememberPath: true,
					type: 'load'
				};
			
				new Filedialog( flags );
			}
			
			self.refreshAvatar();
		}
	}
}

FUI.registerClass( 'groupsettings', FUIGroupsettings );
