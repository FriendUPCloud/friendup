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

// Set up sharing on a disk
Workspace.viewSharingOptions = function( path )
{
	let v = new View( {
		title: i18n( 'i18n_sharing_options' ) + ' ' + path,
		width: 640,
		height: 380
	} );
	let uniqueId = Math.round( Math.random() * 9999 ) + ( new Date() ).getTime();
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
			Workspace.refreshShareInformation( v );
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
				makeList( wrkg, us );
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
				<div class="MousePointer DropdownItem GroupEle Rounded Ellipsis PaddingSmall sw' + sw + '" gid="' + workgroups[a].Name + '">\
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
Workspace.refreshShareInformation = function( viewObject )
{
	let list = ge( 'sharedList_' + viewObject.uniqueId );
	
	if( viewObject.selectedItems.length )
	{
		let str = '<div class="List">';
		let mod = icmod = false;
		let sw = 2;
		for( let a = 0; a < viewObject.selectedItems.length; a++ )
		{
			sw = sw == 1 ? 2 : 1;
			if( viewObject.selectedItems[ a ].type != mod )
			{
				mod = viewObject.selectedItems[ a ].type;
				icmod = mod == 'user' ? 'IconSmall fa-user' : 'IconSmall fa-group';
				str += '<div class="Header PaddingSmall BorderBottom">' + i18n( 'i18n_list_header_' + mod ) + ':</div>';
				sw = 1;
			}
			str += '<div class="PaddingSmall sw' + sw + ' HRow ' + icmod + '">&nbsp;' + viewObject.selectedItems[ a ].name + '</div>';
		}
		str += '</div>';
		list.innerHTML = str;
	}
	else
	{
		list.innerHTML = '<div class="HRow sw1 Padding">' + i18n( 'i18n_file_not_shared' ) + '</div>';
	}

	/*let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			list.innerHTML = '<div class="HRow sw1 Padding">' + i18n( 'i18n_file_not_shared' ) + '</div>';
		}
	}
	m.execute( 'getfileshareinfo', { path: viewObject.path } );*/
	
};
