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
				}
				a.readAsDataURL( blob );
			}, 'image/jpeg', 100 );
		};
	}
	
	setFormContents( element )
	{
		let self = this;
		
		let f = new File( 'Progdir:Markup/groupsettings.html' );
		f.replacements = {
			'room-name': this.options.channelName,
			'room-description': this.options.description
		};
		f.i18n();
		f.onLoad = function( data )
		{
			element.innerHTML = data;
			element.classList.remove( 'Loading' );
			
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
		f.load();
	}
}

FUI.registerClass( 'groupsettings', FUIGroupsettings );
