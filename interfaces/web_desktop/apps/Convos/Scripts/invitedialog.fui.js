/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIInviteDialog extends FUIElement
{
	constructor( options )
	{
		super( options );
		
		this.initialized = true;
	}
	
	attachDomElement()
	{
		super.attachDomElement();
		
		let self = this;
		
		this.domElement.className = 'FUIInvitedialog';
		
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
		
		let t = document.createElement( 'div' );
		t.className = 'Title';
		t.innerHTML = '<span>' + ( this.options.title ? this.options.title : i18n( 'i18n_invite_contacts' ) ) + '</span><span class="Close"></span>';
		d.appendChild( t );
		
		let r = document.createElement( 'div' );
		r.className = 'TheForm Loading';
		d.appendChild( r );
				
		let f = new File( 'Progdir:Markup/invite.html' );
		f.replacements = { 'channel-name': this.options.channelName.split( /\s/ ).join( '-' ) };
		f.i18n();
		f.onLoad = function( data )
		{
			r.innerHTML = data;
			r.classList.remove( 'Loading' );
			
			let input = r.getElementsByTagName( 'input' );
			input[ 0 ].onkeyup = function( e )
			{
				let s = this;
				if( this.timeo )
					clearTimeout( this.timeo );
				this.timeo = setTimeout( function()
				{
					self.executeSearch( s.value );
				}, 100 );
			}
		}
		f.load();
		
		this.domTitle = t;
		
		t.querySelector( '.Close' ).onclick = function()
		{
			self.destroy();
		}
		
		this.refreshDom();
	}
	
	executeSearch = function( query )
	{
		console.log( 'Hey: ' + query );
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

FUI.registerClass( 'invitedialog', FUIInviteDialog );

