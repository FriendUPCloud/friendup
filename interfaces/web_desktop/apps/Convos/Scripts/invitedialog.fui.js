/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIInvitedialog extends FUIElement
{
	constructor( options )
	{
		super( options );
		
		this.initialized = true;
	}
	
	getClassName()
	{
		return 'FUIInvitedialog';
	}
	
	createTitle()
	{
		let t = document.createElement( 'div' );
		t.className = 'Title';
		t.innerHTML = '<span>' + ( this.options.title ? this.options.title : i18n( 'i18n_invite_contacts' ) ) + '</span><span class="Close"></span>';
		return t;
	}
	
	setFormContents( element )
	{
		let self = this;
		let f = new File( 'Progdir:Markup/invite.html' );
		f.replacements = { 'channel-name': this.options.channelName.split( /\s/ ).join( '-' ) };
		f.i18n();
		f.onLoad = function( data )
		{
			element.innerHTML = data;
			element.classList.remove( 'Loading' );
			
			let input = element.getElementsByTagName( 'input' );
			input[ 0 ].onkeyup = function( e )
			{
				let s = this;
				if( this.timeo )
					clearTimeout( this.timeo );
				this.timeo = setTimeout( function()
				{
					self.executeSearch( s.value, element.querySelector( '.SearchResults' ) );
				}, 100 );
			}
		}
		f.load();
	}
	
	attachDomElement()
	{
		super.attachDomElement();
		
		let self = this;
		
		this.domElement.className = this.getClassName();
		
		setTimeout( function()
		{
			self.domElement.classList.add( 'Showing' );
		}, 25 );
		
		let d = document.createElement( 'div' );
		d.className = 'Dia';
		this.domElement.appendChild( d );
		
		setTimeout( function()
		{
			d.classList.add( 'Showing' );
		}, 200 );
		
		let t = this.createTitle();
		d.appendChild( t );
		
		let r = document.createElement( 'div' );
		r.className = 'TheForm Loading';
		d.appendChild( r );
		this.setFormContents( r );
		
		this.domTitle = t;
		
		t.querySelector( '.Close' ).onclick = function()
		{
			self.destroy();
		}
		
		this.refreshDom();
	}
	
	executeSearch( query, res )
	{
		let self = this;
		
		let m = new Module( 'system' );
		m.onExecuted = function( me, md )
		{
			if( me == 'fail' )
			{
				res.innerHTML = '<p>You have no contact that matches your search query.</p>';
			}
			else
			{
				let JS = JSON.parse( md );
				if( JS.response == 1 )
				{
					res.innerHTML = '';
					for( let a = 0; a < JS.contacts.length; a++ )
					{
						let d = document.createElement( 'div' );
						d.classList = 'SearchResult Contact';
						d.innerHTML = '<div class="Name">' + JS.contacts[a].Fullname + '</div><div class="Button"><div class="Invite">' + i18n( 'i18n_invite_contact' ) + '</div></div>';
						res.appendChild( d );
						
						let b = d.querySelector( '.Button' );
						( function( ct, btn )
						{
							b.onclick = function()
							{
								self.executeInvite( ct, btn );
								btn.classList.add( 'Disabled' );
							}
						} )( JS.contacts[ a ], d );
					}
					return;
				}
				res.innerHTML = '<p>You have no contact that matches your search query.</p>';
			}
		}
		m.execute( 'convos', { method: 'contacts', filter: query } );
	}
	executeInvite( contact, btn )
	{
		let self = this;
		
		let m = new Module( 'system' );
		m.onExecuted = function( me, md )
		{
			if( me == 'fail' )
			{
				btn.classList.remove( 'Disabled' );
				btn.classList.add( 'Error' );
			}
			else
			{
				btn.classList.remove( 'Error' );
				
				// Notify user that we invited them!
				Application.SendUserMsg( {
					recipientId: contact.ID,
					message: {
						groupId: self.options.groupId,
						type: 'invite'
					}
				} );
			}
		}
		m.execute( 'convos', { method: 'invite', userId: contact.ID, groupId: this.options.groupId } );
	}
	
	destroy()
	{
		let self = this;
		
		this.domElement.classList.remove( 'Showing' );
		
		setTimeout( function()
		{
			self.domElement.parentNode.removeChild( self.domElement );
		}, 250 );
	}
	
	grabAttributes( domElement )
	{
		
	}
	
	refreshDom()
	{
		
	}
	
	
}

FUI.registerClass( 'invitedialog', FUIInvitedialog );

