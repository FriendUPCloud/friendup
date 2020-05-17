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
	var v = new View( {
		title: i18n( 'i18n_sharing_options' ) + ' ' + path,
		width: 640,
		height: 380
	} );
	var uniqueId = Math.round( Math.random() * 9999 ) + ( new Date() ).getTime();
	var f = new File( '/webclient/templates/iconinfo_sharing_options.html' );
	f.replacements = {
		uniqueId: uniqueId
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
		
		var elements = {};
		
		var ele = ge( 'element_' + uniqueId );
		var el = ele.getElementsByTagName( 'input' );
		for( var a = 0; a < el.length; a++ )
		{
			if( !el[ a ].getAttribute( 'name' ) ) continue;
			elements[ el[ a ].getAttribute( 'name' ) ] = el[ a ];
		}
		el = ele.getElementsByTagName( 'button' );
		for( var a = 0; a < el.length; a++ )
		{
			if( !el[ a ].getAttribute( 'name' ) ) continue;
			elements[ el[ a ].getAttribute( 'name' ) ] = el[ a ];
		}
		elements.apply_sharing.onclick = function( e )
		{
		}
		elements.sharing_with.onkeydown = function( e )
		{
			var self = this;
			var w = e.which ? e.which : e.keyCode;
			if( w == 38 || w == 40 || w == 13 )
			{
				return;
			}
			// Typing something else? Break bond with wid
			if( this.value != this.getAttribute( 'punch' ) )
			{
				this.setAttribute( 'wid', '' );
				this.setAttribute( 'punch', '' );
			}
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					ele.showDropdown( self, i18n( 'i18n_no_users_found' ) );
					return;
				}
				var wList = null;
				try
				{
					wList = JSON.parse( d );
				}
				catch( e )
				{
					ele.showDropdown( self, i18n( 'i18n_error_in_userlist' ) );
					return;
				}
				var str = '';
				for( var a = 0; a < wList.length; a++ )
				{
					if( wList[ a ].Name.indexOf( self.value ) >= 0 )
					{
						var wname = wList[ a ].Name.split( self.value ).join( '<em>' + self.value + '</em>' );
						str += '<p class="MarginTop" wid="' + wList[ a ].ID + '">' + wname + '</p>';
					}
				}
				if( !str )
				{
					str = i18n( 'i18n_no_users_found' );
				}
				ele.showDropdown( self, str, 'p' );
			}
			m.execute( 'workgroups' );
		}
		ele.showDropdown = function( trigger, content, tagSelector )
		{
			if( !ele.dropdown )
			{
				var d = document.createElement( 'div' );
				ele.dropdown = d;
				d.className = 'Padding Borders BackgroundHeavier Rounded';
				ele.appendChild( d );
				d.style.position = 'absolute';
				d.style.top = trigger.offsetTop + trigger.offsetHeight + 'px';
				d.style.left = trigger.offsetLeft + 'px';
				d.style.width = trigger.offsetWidth + 'px';
				d.style.maxHeight = '200px';
				d.style.overflow = 'auto';
				d.style.transition = 'opacity 0.25s';
				d.style.opacity = 0;
				setTimeout( function(){ d.style.opacity = 1; }, 50 );
				d.onmouseout = function()
				{
					if( this.tm ) return;
					d.style.opacity = 0;
					this.tm = setTimeout( function()
					{
						ele.removeChild( d );
						ele.dropdown = null;
					}, 500 );
				}
				d.onmouseover = function()
				{
					d.style.opacity = 1;
					clearTimeout( this.tm );
					this.tm = null;
				}
				trigger.onblur = function()
				{
					d.onmouseout();
				}
			}
			ele.dropdown.innerHTML = content;
			if( tagSelector )
			{
				var eles = ele.dropdown.getElementsByTagName( tagSelector );
				for( var a = 0; a < eles.length; a++ )
				{
					eles[ a ].onclick = function()
					{
						trigger.value = this.innerText;
						trigger.setAttribute( 'wid', this.getAttribute( 'wid' ) );
						trigger.setAttribute( 'punch', this.innerText );
						ele.dropdown.onmouseout();
						trigger.focus();
						trigger.select();
					}
				}
			}
		}
	}
	f.load();
};
