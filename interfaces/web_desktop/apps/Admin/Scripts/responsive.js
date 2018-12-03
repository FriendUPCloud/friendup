/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Engine for creating responsive, page based UI

Friend = window.Friend || {};

Friend.responsive = {
	pages: [],
	pagesById: {},
	pageActive: null,
	init()
	{
		var d = document.getElementsByTagName( '*' );
		for( var a = 0; a < d.length; a++ )
		{
			// Page!
			if( d[a].classList && d[a].classList.contains( 'Responsive-Page' ) )
			{
				if( !Friend.responsive.pageActive )
				{
					Friend.responsive.pageActive = d[a];
				}
				Friend.responsive.pages.push( d[a] );
				if( !d[a].id )
				{
					var id = 'Responsive-Page-';
					var idnum = 1;
					while( ge( id + idnum ) )
					{
						idnum++;
					}
					d[a].id = id + idnum;
				}
				Friend.responsive.pages.push( d[a] );
				Friend.responsive.pagesById( d[a].id ) = d[a];
			}
		}
	},
	// Set active page by dom element or id
	setPage( element )
	{
		var self = this;
		
		if( typeof( element ) == 'string' )
		{
			element = ge( element );
			if( !element ) return;
		}
		
		for( var a = 0; a < self.pages.length; a++ )
		{
			if( self.pages[ a ] != element )
			{
				self.pages[ a ].classList.remove( 'Responsive-Page-Active' );
			}
		}
		element.classList.add( 'Responsive-Page-Active' );
	}
};
