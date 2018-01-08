/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	refreshSoftware();
}

function refreshSoftware( specificApp, appData )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'Software' ).innerHTML = '<h2>' + i18n( 'i18n_no_software' ) + '</h2>';
			return;
		}
		
		var finalList = [];
		var f = 0;
		var items = JSON.parse( d );
		
		var newSoftware = document.createElement( 'div' );
		newSoftware.id = 'Software';
		
		var str = '<div class="Tabs" id="SoftwareTabs">';
		
		var order = [ 'by_date', 'name', 'category' ]; //, 'rating'
		var icons = [ 'fa-calendar', 'fa-sort-alpha-asc', 'fa-folder-open-o' ]; //, 'fa-sort-amount-desc'
		
		for( var z in order )
		{
			str += '<div class="Tab IconSmall ' + icons[z] + '">' + i18n( 'i18n_page_' + order[z] ) + '</div>';
		}
		
		for( var z in order )
		{
			str += '<div class="Page HCont">';
			var soft;
			
			// Sort by name // and all others
			var out = [];
			for( var a = 0; a < items.length; a++ )
			{
				out.push( items[a].Name );
			}
			out.sort();
			var fin = [];
			for( var a = 0; a < out.length; a++ )
			{
				for( var b = 0; b < items.length; b++ )
				{
					if( items[b].Name == out[a] ) fin.push( items[b] );
				}
			}
			soft = fin;
			
			var header = '';
			
			if( order[z] == 'category' )
			{
				var out = [];
				for( var a = 0; a < soft.length; a++ )
				{
					soft[a].sortKey = soft[a].Category + '_'  + soft[a].Name;
					out.push( soft[a].sortKey );
				}
				out.sort();
				var fin = [];
				for( var a = 0; a < out.length; a++ )
				{
					for( var b = 0; b < soft.length; b++ )
					{
						if( soft[b].sortKey == out[a] )
							fin.push( soft[b] );
					}
				}
				soft = fin;
				
				var lastCat = '';
				header += '<div class="Padding BorderBottom MarginBottom" id="SortAlphaNumeric">';
				for( var hc = 0; hc < soft.length; hc++ )
				{
					if( soft[ hc ].Category != lastCat )
					{
						header += ( lastCat == '' ? '' : ' &nbsp;' ) + '<button onclick="document.getElementById(\'cat'+ soft[ hc ].Category +'\').scrollIntoView(true);" class="Button">'+ soft[ hc ].Category +'</button> ';
						lastCat = soft[ hc ].Category;
						soft[ hc ].jumpTarget = '<a id="cat'+ soft[ hc ].Category +'"></a>';
					}
				}
				header += '</div>';
			}
			else if( order[ z ] == 'by_date' )
			{
				header += '';
				
				// Sort by date
				var out = [];
				for( var a = 0; a < soft.length; a++ )
				{
					soft[a].sortKey = soft[a].DateModifiedUnix + '_'  + soft[a].Name;
					out.push( soft[a].sortKey );
				}
				out.sort();
				
				var fin = [];
				for( var a = out.length - 1; a > 0; a-- )
				{
					for( var b = 0; b < soft.length && b < 25; b++ )
					{
						if( soft[b].sortKey == out[a] )
							fin.push( soft[b] );
					}
				}
				soft = fin;
			}
			else
			{
				header += '<div class="Padding BorderBottom MarginBottom" id="SortCategory">';
				var lastLetter = '';
				for( var hc = 0; hc < soft.length; hc++ )
				{
					if( soft[ hc ].Name.substr(0,1).toUpperCase() != lastLetter )
					{
						header += ( lastLetter == '' ? '' : ' &nbsp;' ) + '<button onclick="document.getElementById(\'letter'+ soft[ hc ].Name.substr(0,1).toUpperCase() +'\').scrollIntoView(true);" class="Button">'+ soft[ hc ].Name.substr(0,1).toUpperCase() +'</button> ';
						lastLetter = soft[ hc ].Name.substr(0,1).toUpperCase();
						soft[ hc ].jumpTarget = '<a id="letter'+ soft[ hc ].Name.substr(0,1).toUpperCase() +'"></a>';
					}
				}
				header += '</div>';
			}
			
			str += header;
			str += '<div class="PageScroll">';
			for( var a = 0; a < soft.length; a++ )
			{
				var aa = a + 1;
				
				str += '<div class="HBox MarginBottom Padding" id="Product_' + f++ + '"">';
				
				finalList.push( soft[a] );
				
				if( soft[ a ].jumpTarget ) str +=  soft[ a ].jumpTarget;
				
				
				if( order[ z ] == 'by_date' )
				{
					str += '<p class="Layout"><strong>' + soft[a].DateModified.split( ' ' )[0].split( '-' ).join( '/' ) + '</strong></p>';
				
					str += '<h2>' + soft[a].Name + '</h2>';
				
					str += '<p class="Layout">';
					str += soft[a].Description ? soft[a].Description : i18n( 'i18n_no_desc' );
					str += '</p>';
				}
				else
				{
					str += '<p class="Layout"><strong>' + soft[a].Category + '</strong></p>';
				
					str += '<h2>' + soft[a].Name + '</h2>';
				
					str += '<p class="Layout">';
					str += soft[a].Description ? soft[a].Description : i18n( 'i18n_no_desc' );
					str += '</p>';
				}
				
				str += '<div class="TheButton BackgroundNegative Padding">';
			
				if( soft[a].Installed )
				{
					str += '<button class="Button IconSmall fa-times" id="app_' + aa + '" onclick="uninstall(\'' + soft[a].Name + '\',' + aa + ')"> ' + i18n( 'i18n_uninstall' ) + ' </button>';
				}
				else
				{
					str += '<button class="Button IconSmall fa-check" id="app_' + aa + '" onclick="install(\'' + soft[a].Name + '\',' + aa + ')"> ' + i18n( 'i18n_install' ) + ' </button>';
				}
			
				str += '</div>';

				str += '</div>';
			}	
			str += '</div>';
			
			str += '</div>';
		}
		
		// Get scrolltops
		var scrollTops = [];
		var eles = ge( 'Software' ).getElementsByClassName( 'PageScroll' );
		if( eles && eles.length )
		{
			for( var a = 0; a < eles.length; a++ )
			{
				scrollTops.push( eles[a].scrollTop );
			}
		}
		
		// Update
		newSoftware.innerHTML = str + '</div>';
		var pn = ge( 'Software' ).parentNode;
		pn.replaceChild( newSoftware, ge( 'Software' ) );
		
		// Try to load previews
		function delayedImageLoader( app, num )
		{
			var p = Ge( 'Product_' + num );
			if( p )
			{
				p.classList.add ( 'ProductImage' );
				var div = document.createElement( 'div' );
				div.className = 'Image';
				if( app.length && app.indexOf( '.png' ) > 0 )
				{
					div.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:' + app ) + ')';
				}
				else
				{
					div.style.backgroundImage = 'url(/system.library/module/?module=system&command=getapplicationpreview&application=' + app + '&authid=' + Application.authId + ')';
				}
				p.appendChild( div );
				return true;
			}
			return false;
		}
		for( var a = 0; a < finalList.length; a++ )
		{
			if( finalList[a].Preview )
			{
				delayedImageLoader( finalList[a].Name, a );
			}
			else
			{
				delayedImageLoader( 'package.png', a );
			}
		}
		
		InitTabs( 'SoftwareTabs' );
		
		// Set scrolltops
		eles = ge( 'Software' ).getElementsByClassName( 'PageScroll' );
		if( eles && eles.length && scrollTops.length )
		{
			for( var a = 0; a < eles.length; a++ )
			{
				if( scrollTops[ a ] >= 0 )
				{
					eles[a].scrollTop = scrollTops[ a ];
				}
			}
		}
	}
	m.execute( 'software' );
}

// Make sure the tab view resizes properly
// TODO: Remove when tab view is fixed!
window.addEventListener( 'resize', function( e )
{
	var eles = document.getElementsByClassName( 'TabActive' );
	if( eles && eles.length )
	{
		eles[0].click();
	}
} );


