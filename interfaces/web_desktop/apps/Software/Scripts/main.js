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

function refreshSoftware()
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
		
		var str = '<div class="Tabs" id="SoftwareTabs">';
		
		var order = [ 'name', 'category' ]; //, 'rating'
		var icons = [ 'fa-sort-alpha-asc', 'fa-folder-open-o' ]; //, 'fa-sort-amount-desc'
		
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
			for( var a = 0; a < soft.length; a++ )
			{
				str += '<div class="HBox GuiContainer MarginBottom Padding" id="Product_' + f++ + '"">';
				finalList.push( soft[a] );
				
				
				if( soft[ a ].jumpTarget ) str +=  soft[ a ].jumpTarget;
				
				str += '<p class="Layout"><strong>' + soft[a].Category + '</strong></p>';
				str += '<h2>' + soft[a].Name + '</h2>';
				str += '<p class="Layout Ellipsis">';
				str += soft[a].Description ? soft[a].Description : i18n( 'i18n_no_desc' );
				str += '</p>';
				
				str += '<div class="TheButton BackgroundNegative Padding">';
				if( soft[a].Installed )
				{
					str += '<button class="Button IconSmall fa-times" id="app_' + (a+1) + '" onclick="uninstall(\'' + soft[a].Name + '\',' + (a+1) + ')"> ' + i18n( 'i18n_uninstall' ) + ' </button>';
				}
				else
				{
					str += '<button class="Button IconSmall fa-check" id="app_' + (a+1) + '" onclick="install(\'' + soft[a].Name + '\',' + (a+1) + ')"> ' + i18n( 'i18n_install' ) + ' </button>';
				}
				str += '</div>';

				str += '</div>';
			}	
			str += '</div>';
		}
		
		ge( 'Software' ).innerHTML = str + '</div>';
		
		// Try to load previews
		function delayedImageLoader( app, num )
		{
			var p = Ge( 'Product_' + num );
			if( p )
			{
				p.classList.add ( 'ProductImage' );
				var img = document.createElement( 'img' );
				img.src = '/system.library/module/?module=system&command=getapplicationpreview&application=' + app + '&authid=' + Application.authId;
				p.appendChild( img );
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
		}
		
		InitTabs( 'SoftwareTabs' );
	}
	m.execute( 'software' );
}

function uninstall( nm, index )
{
	Confirm( i18n( 'i18n_are_you_sure_uninstall' ), i18n( 'i18n_are_you_sure_uninstall_ds' ), function( d )
	{
		if( d.data == true )
		{
			var m = new Module( 'system' );
			m.onExecuted = function()
			{
				refreshSoftware();
			}
			m.execute( 'uninstallapplication', { application: nm } );
		}
	} );
}

function install( nm, index )
{
	Confirm( i18n( 'i18n_are_you_sure_install' ), i18n( 'i18n_are_you_sure_install_ds' ), function( d )
	{
		if( d.data == true )
		{
			var m = new Module( 'system' );
			m.onExecuted = function()
			{
				refreshSoftware();
			}
			m.execute( 'installapplication', { application: nm } );
		}
	} );
}
