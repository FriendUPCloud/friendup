/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
*                                                                              *
* Sharing files with other users and workgroups.                               *
*                                                                              *
*******************************************************************************/

Workspace.sharingDialogs = {};

// Set up sharing on a disk
Workspace.viewSharingOptions = function( path )
{
	let v = new View( {
		title: i18n( 'i18n_sharing_options' ) + ' ' + path,
		width: 640,
		height: 380
	} );
	
	let uniqueId = Math.round( Math.random() * 9999 ) + ( new Date() ).getTime();
	this.sharingDialogs[ uniqueId ] = v;
	v.uniqueId = uniqueId;
	v.path = path;
	v.dIndex = 0;
	v.selectedItems = [];
	v.content.onclick = function( e )
	{
		if( v.dropDown )
		{
			v.selectedItems = [];
			let eles = v.dropDown.getElementsByClassName( 'DropdownItem' );
			for( let c = 0; c < eles.length; c++ )
			{
				if( eles[ c ].classList.contains( 'Active' ) )
				{
					if( eles[ c ].classList.contains( 'UserEle' ) )
					{
						v.selectedItems.push( {
							type: 'user',
							id: eles[ c ].getAttribute( 'uid' ),
							name: Trim( eles[ c ].innerHTML )
						} );
					}
					else
					{
						v.selectedItems.push( {
							type: 'group',
							id: eles[ c ].getAttribute( 'gid' ),
							name: Trim( eles[ c ].innerHTML )
						} );
					}
				}
			}
			v.dropDown.classList.remove( 'Showing' );
			Workspace.refreshShareInformation( v, function()
			{
				if( v.doApply )
				{
					Workspace.saveFileShareInfo( v.uniqueId );
				}
			} );
		}
	}
	
	function kdListen( e )
	{
		if( window.currentMovable && currentMovable.windowObject == v )
		{
			var eles = v.content.getElementsByClassName( 'DropdownItem' );
		}
	};
	v.content.addEventListener( 'keydown', kdListen );
	
	v.onclose = function()
	{
		v.content.removeEventListener( 'keydown', kdListen );
		let out = {};
		for( var a in Workspace.sharingDialogs )
		{
			if( a != uniqueId )
				out[ a ] = Workspace.sharingDialogs[ a ];
		}
		Workspace.sharingDialogs = out;
	}
	
	let f = new File( '/webclient/templates/iconinfo_sharing_options.html' );
	f.replacements = {
		uniqueId: uniqueId
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			Workspace.setSharingGui( v );
		} );
	}
	f.load();
};
Workspace.saveFileShareInfo = function( uniqueId )
{
	if( !this.sharingDialogs[ uniqueId ] ) return;
	let self = this;
	let d = this.sharingDialogs[ uniqueId ];
	
	let drp = null;
	if( drp = d._window.getElementsByClassName( 'Dropdown' ) )
	{
		if( drp[0].classList.contains( 'Showing' ) )
		{
			d.doApply = true;
			return;
		}
	}
	
	let o = new Module( 'system' );
	o.onExecuted = function( e )
	{
		if( e == 'ok' )
		{
			d.close();
		}
		else
		{
			Alert( i18n( 'i18n_nothing_shared' ), i18n( 'i18n_please_select_users_groups' ) );                                                                                                                                                                                                                                        
			return;
		}
	}
	o.execute( 'setfileshareinfo', { path: d.path, items: d.finalItems } );
};
Workspace.setSharingGui = function( viewObject )
{
	Workspace.refreshShareInformation( viewObject );
	
	let searchF = ge( 'dropdownfield_' + viewObject.uniqueId );
	let dropDown = ge( 'dropdown_' + viewObject.uniqueId );
	viewObject.dropDown = dropDown;
	dropDown.onclick = function( e ){ return cancelBubble( e ); }
	searchF.onkeyup = function( e )
	{
		// Arrow down/up
		let eles = dropDown.getElementsByClassName( 'DropdownItem' );
		if( eles.length && ( e.which == 40 || e.which == 38 || e.which == 13 ) )
		{
			if( e.which == 13 )
			{
				if( eles[ viewObject.dIndex ] )
				{
					if( eles[ viewObject.dIndex ].classList.contains( 'Active' ) )
					{
						eles[ viewObject.dIndex ].classList.remove( 'Active' );
					}
					else
					{
						eles[ viewObject.dIndex ].classList.add( 'Active' );
					}
				}
			}
			else if( e.which == 40 )
			{
				viewObject.dIndex++;
				if( viewObject.dIndex >= eles.length ) viewObject.dIndex = 0;
			}
			else if( e.which == 38 )
			{
				viewObject.dIndex--;
				if( viewObject.dIndex < 0 ) viewObject.dIndex = eles.length - 1;
			}
		
			for( let c = 0; c < eles.length; c++ )
			{
				if( c == viewObject.dIndex )
				{
					eles[ c ].classList.add( 'Selected' );
					dropDown.scrollTop = ( eles[ c ].offsetTop + ( eles[ c ].offsetHeight >> 1 ) ) - ( dropDown.offsetHeight >> 1 ) ;
				}
				else
				{
					eles[ c ].classList.remove( 'Selected' );
				}
			}
			
			viewObject.content.focus();
			return cancelBubble( e );
		}
		// Done arrow down/up
		
		if( Trim( this.value ) == '' )
		{
			dropDown.classList.remove( 'Showing' );
			setTimeout( function()
			{
				dropDown.innerHTML = '';
			}, 300 );
			return;
		}
		
		let keys = searchF.value.split( ',' ).join( ' ' ).split( ' ' );
		for( let a in keys ) keys[ a ] = keys[ a ].toLowerCase();
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			let wrkg = [];
			if( e == 'ok' )
			{
				wrkg = JSON.parse( d );
			}
			let m2 = new Module( 'system' );
			m2.onExecuted = function( e2, d2 )
			{
				let us = [];
				if( e2 == 'ok' )
				{
					us = JSON.parse( d2 );
				}
				
				let finw = [];
				let finu = [];
				
				// Filter output..
				for( let a in wrkg )
				{
					for( let c in keys )
					{
						if( !Trim( keys[ c ] ) ) continue;
						
						if( wrkg[ a ].Name.toLowerCase().indexOf( keys[ c ] ) >= 0 )
						{
							finw.push( wrkg[ a ] );
							break;
						}
					}
				}
				for( let a in us )
				{
					for( let c in keys )
					{
						if( !Trim( keys[ c ] ) ) continue;
						
						if( ( us[ a ].Fullname && us[ a ].Fullname.toLowerCase().indexOf( keys[ c ] ) >= 0 ) || us[ a ].Name.toLowerCase().indexOf( keys[ c ] ) >= 0 )
						{
							finu.push( us[ a ] );
							break;
						}
					}
				}
				
				// Add filtered list
				makeList( finw, finu );
			}
			m2.execute( 'listconnectedusers' );
		}
		m.execute( 'workgroups' );
	}
	function makeList( workgroups, users )
	{
		let str = '';
		let sw = 2;
		let items = 0;
		if( workgroups.length )
		{
			str += '<p class="Layout"><strong>' + i18n( 'i18n_workgroups' ) + ':</strong></p>';
			for( let a in workgroups )
			{
				sw = sw == 1 ? 2 : 1;
				str += '\
				<div class="MousePointer DropdownItem GroupEle Rounded Ellipsis PaddingSmall sw' + sw + '" gid="' + workgroups[a].ID + '">\
					' + workgroups[a].Name + '\
				</div>';
				items++;
			}
		}
		if( users.length )
		{
			str += '<p class="Layout"><strong>' + i18n( 'i18n_users' ) + ':</strong></p>';
			for( let a in users )
			{
				sw = sw == 1 ? 2 : 1;
				str += '\
				<div class="MousePointer DropdownItem UserEle Rounded Ellipsis PaddingSmall sw' + sw + '" uid="' + users[a].ID + '">\
					' + users[a].Fullname + '\
				</div>';
				items++;
			}
		}
		if( dropDown && dropDown.parentNode )
		{
			dropDown.innerHTML = str;
			let eles = dropDown.getElementsByClassName( 'DropdownItem' );
			for( let c = 0; c < eles.length; c++ )
			{
				eles[ c ].onclick = function( e )
				{
					if( this.classList.contains( 'Active' ) )
						this.classList.remove( 'Active' );
					else
						this.classList.add( 'Active' );
					return cancelBubble( e );
				}
			}
			dropDown.classList.add( 'Showing', 'BackgroundDefault', 'BordersDefault' );
		}
		else
		{
			dropDown.classList.remove( 'Showing', 'BackgroundDefault', 'BordersDefault' );
		}
	}
};
Workspace.refreshShareInformation = function( viewObject, callback )
{
	let list = ge( 'sharedList_' + viewObject.uniqueId );
	let items = {
		group: [],
		user: []
	};
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		// Try to parse existing members
		if( e == 'ok' )
		{
			try
			{
				d = JSON.parse( d );
				for( let c = 0; c < d.length; c++ )
				{
					items[ d[ c ].type ].push( d[ c ] );
				}
			}
			catch( e ){};
		}
		
		// Get current members
		for( let c = 0; c < viewObject.selectedItems.length; c++ )
		{
			items[ viewObject.selectedItems[ c ].type ].push( viewObject.selectedItems[ c ] );
		}
	
		// Set the final items..
		viewObject.finalItems = items;
	
		if( items.group.length || items.user.length )
		{
			let str = '<div class="List">';
			let mod = icmod = false;
			for( let b in items )
			{
				if( items[ b ].length )
				{
					str += '<div class="Header PaddingSmall BorderBottom">' + i18n( 'i18n_list_header_' + b ) + ':</div>';
					icmod = b == 'user' ? 'IconSmall fa-user' : 'IconSmall fa-group';
					let sw = 2;
					let idt = b == 'user' ? 'uid' : 'gid';
					for( let a = 0; a < items[ b ].length; a++ )
					{
						let idn = items[ b ][ a ].id;
						sw = sw == 1 ? 2 : 1;
						str += '<div ' + idt + '="' + idn + '" class="PaddingSmall sw' + sw + ' HRow ' + icmod + '"><button class="IconSmall IconButton fa-remove FloatRight">&nbsp;</button>&nbsp;' + items[ b ][ a ].name + '</div>';
					}
				}
			}
			str += '</div>';
			list.innerHTML = str;
			let buttons = list.getElementsByTagName( 'button' );
			for( let c = 0; c < buttons.length; c++ )
			{
				( function( bt )
				{
					bt.onclick = function()
					{
						let n = null;
						let m = new Module( 'system' );
						m.onExecuted = function( me, md )
						{
							Workspace.refreshShareInformation( viewObject );
						}
						if( n = this.parentNode.getAttribute( 'uid' ) )
						{
							m.execute( 'removefileshareinfo', { userid: n, path: viewObject.path } );
						}
						else if( n = this.parentNode.getAttribute( 'gid' ) )
						{
							m.execute( 'removefileshareinfo', { groupid: n, path: viewObject.path } );
						}
					}
				} )( buttons[ c ] );
			}
		}
		else
		{
			list.innerHTML = '<div class="HRow sw1 Padding">' + i18n( 'i18n_file_not_shared' ) + '</div>';
		}
		if( callback ) callback();
	}
	m.execute( 'getfileshareinfo', { path: viewObject.path } );
	
};
