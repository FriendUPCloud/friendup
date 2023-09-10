/*******************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

function resiz()
{
	// The iOS hack
	if( ge( 'theNotice' ) )
	{
		var ww = window.innerWidth;
		var hh = window.innerHeight;
		if( screen.width < ww )
		{
			ww = ww >> 1;
			hh = hh >> 1;
			ge( 'theNotice' ).style.width = ww + 'px';
			ge( 'theNotice' ).style.height = hh + 'px';
		}
	}
}

Application.run = function( msg, iface )
{
	refreshSoftware();
	//showNotice();
	resiz();
}

window.addEventListener( 'resize', resiz, false );

var globalSoftwareList = [];

var currentCat = '';

var slidePos = 0;
function nextSlide()
{
	if( ++slidePos >= slideCount )
		slidePos = 0;
	moveSlides();
}
function prevSlide()
{
	if( --slidePos < 0 )
		slidePos = slideCount - 1;
	moveSlides();
}
function moveSlides()
{
	var eles = ge( 'Slides' ).getElementsByClassName( 'Slide' )
	for( var a = 0; a < eles.length; a++ )
	{
		eles[a].style.left = ( -100 * slidePos ) + ( 100 * a ) + '%';
	}
}

var slideCount = 0;

var metadata = {}; // Metadata about apps

// Convert CamelCase to Camel Case
function camelcaseToSpaces( str )
{
	var pn = '';
	for( var z = 0; z < str.length; z++ )
	{
		var char = str.charAt( z );
		var next = z > 0 && str.charAt( z - 1 ).toUpperCase() == str.charAt( z - 1 );
		if( z > 0 && char.toUpperCase() == char && !next )
			pn += ' ';
		pn += char;
	}
	return pn;
}


function refreshSoftware( specificApp, appData, searchKeywords )
{
	// Prepare keywords
	if( searchKeywords )
	{
		// Keywords are split where "," and " " is synonymous
		searchKeywords = searchKeywords.split( ' ' ).join( ',' ).split( ',,' ).join( ',' ).split( ',' );
		for( var a in searchKeywords )
		{
			searchKeywords[ a ] = Trim( searchKeywords[ a ] );
		}
	}

	// List software callback
	function cbksoftware( e, d, ee, dd )
	{
		if( e != 'ok' )
		{
			ge( 'Software' ).innerHTML = '<h2>' + i18n( 'i18n_no_software' ) + '</h2>';
			return;
		}
		
		var finalList = [];
		var f = 0;
		var items = JSON.parse( d );
		
		var usersoftware = null;
		if( ee == 'ok' ) usersoftware = JSON.parse( dd );
		
		var newSoftware = document.createElement( 'div' );
		newSoftware.id = 'Software';
		
		var str = '<div class="Tabs Centered" id="SoftwareTabs">';
		
		var order = [ 'by_date', 'all', 'your_apps' ]; //, 'rating'
		var icons = [ 'fa-calendar', 'fa-sort-alpha-asc', 'fa-group' ]; //, 'fa-sort-amount-desc'
		
		for( var z in order )
		{
			str += '<div class="Tab IconSmall ' + icons[z] + '">' + i18n( 'i18n_page_' + order[z] ) + '</div>';
		}
		
		for( var z in order )
		{
			str += '<div class="Page HCont" id="page_' + order[ z ] + '">';
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
			
			globalSoftwareList = soft;
			
			// Filter by search keywords
			if( searchKeywords )
			{
				fin = {};
				for( var w in searchKeywords )
				{
					var word = searchKeywords[ w ].toLowerCase();
					for( var ka = 0; ka < soft.length; ka++ )
					{
						if( soft[ ka ].Name.toLowerCase().indexOf( word ) >= 0 )
						{
							fin[ soft[ ka ].Name ] = soft[ ka ];
						}
					}
				}
				soft = [];
				for( var ka in fin )
					soft.push( fin[ ka ] );
			}
			
			var header = '', sidelist = '';
			
			// All software list
			if( order[z] == 'your_apps' )
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
			}
			else if( order[z] == 'all' )
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
						var exc = '';
						if( hc == 0 )
						{
							exc = ' Orange';
							currentCat = soft[hc].Category;
						}
						header += ( lastCat == '' ? '' : ' &nbsp;' ) + '<button onclick="document.getElementById(\'cat'+ soft[ hc ].Category +'\').scrollIntoView(true); currentCat = \'' + soft[hc].Category + '\';" class="Button' + exc + '">'+ soft[ hc ].Category +'</button>';
						lastCat = soft[ hc ].Category;
					}
				}
				header += '</div>';
			}
			// Latest software list
			else if( order[ z ] == 'by_date' )
			{
				// Do the slideshow! -------------------------------------------
				header += '<div class="StageHeader">';
				header += '<div id="SlidesArrowLeft" class="MousePointer" onclick="prevSlide()"></div>';
				header += '<div id="SlidesArrowRight" class="MousePointer" onclick="nextSlide()"></div>';
				header += '<div id="Slides">';
				
				// Add slides
				var a = 0;
				for( var b in metadata )
				{
					if( !metadata[b].featured ) continue;
					var slideData = false;
					for( var c = 0; c < soft.length; c++ )
					{
						if( soft[c].Name == b )
						{
							slideData = soft[c];
							break;
						}
					}
					if( slideData )
					{
						var args = {
							application: slideData.Name,
							mode: 'featuredimage'
						};
						var featured = '/system.library/module/?module=system&command=applicationdetails&authid=' + Application.authId + '&args=' + encodeURIComponent( JSON.stringify( args ) );
					
						header += '<div class="Slide" id="Featured_' + b + '" onclick="details(\'' + slideData.Name + '\'); return cancelBubble(event)" style="left: ' + ( 100 * a ) + '%">';
						var pn = camelcaseToSpaces( slideData.Name );
						header += '<div class="Description">';
						header += '<p class="ProductName">' + pn + '</p>';
						header += '<p class="ProductDescription">' + ( 	
							slideData.LongDescription ? slideData.LongDescription : slideData.Description ) + '</p>';
						header += '</div>';
						header += '<div class="Image" style="background-image: url(\'' + featured + '\')"></div>';
						header += '</div>';
						slideCount++;
						a++;
					}
				}

				header += '</div>';
				header += '</div>';
				// End slideshow -----------------------------------------------
				
				// Sort by date
				var out = [];
				for( var a = 0; a < soft.length; a++ )
				{
					soft[a].sortKey = soft[a].DateModifiedUnix + '_'  + soft[a].Name;
					out.push( soft[a].sortKey );
				}
				
				out.sort();
				
				var fin = [];
				var c = 0;
				for( var a = out.length - 1; a >= 0 && c < 33; a-- )
				{
					for( var b = 0; b < soft.length && c < 33; b++ )
					{
						if( soft[b].sortKey == out[a] )
						{
							var dt = new Date( soft[b].DateModifiedUnix * 1000 );
							fin.push( soft[b] );
							c++;
						}
					}
				}
				soft = fin;
			}
			
			str += header;
			
			var extraClass = '';
			
			if( order[ z ] == 'all' )
			{
				extraClass = ' SideList';
			}
			
			str += '<div class="PageScroll' + extraClass + '">';
			var lcat = '';
			for( var a = 0; a < soft.length; a++ )
			{
				var aa = a + 1;
				
				if( order[z] == 'your_apps' )
				{
					if( !soft[a].Installed ) continue;
				}
				
				if( order[ z ] != 'by_date' )
				{
					if( lcat != soft[a].Category )
					{
						lcat = soft[a].Category;
						str += '<div class="CategoryDivider BorderBottom MarginBottom HRow" id="cat'+ lcat +'"><h2>' + lcat + '</h2></div>';
					}
				}
				
				str += '<div class="HBox MarginBottom Padding" id="Product_' + f++ + '"">';
				
				finalList.push( soft[a] );
				
				str += '<div class="Content ScrollBarSmall MousePointer" onclick="details(\'' + soft[a].Name + '\')">';
				
				var vis = metadata[ soft[a].Name ] ? metadata[ soft[a].Name ].visible : false;

				var pn = camelcaseToSpaces( soft[a].Name );
				if( order[ z ] == 'by_date' )
				{
					var ex = ''; //!vis ? ' Invisible' : '';
					str += '<p class="ProductName' + ex + '"><strong>' + pn + '</strong></p>';
				
					str += '<p class="Category">';
					str += soft[a].Category;
					str += '</p>';
				}
				else
				{
					var ex = ''; //!vis ? ' Invisible' : '';
					
					str += '<p class="ProductName' + ex + '"><strong>' + pn + '</strong></p>';
				
					str += '<p class="Category">';
					str += soft[a].Category;
					str += '</p>';
				}
				
				str += '<div class="Buttons">';
				
				if( soft[a].Installed )
				{
					str += '<button class="Green Glue Button IconSmall fa-play-circle" id="play_' + aa + '" onclick="execute(\'' + soft[a].Name + '\')"> ' + i18n( 'i18n_launch' ) + ' </button>';
					str += '<button class="Red Glue Button IconSmall fa-times" id="app_' + aa + '" onclick="uninstall(\'' + soft[a].Name + '\',' + aa + ')"> ' + i18n( 'i18n_uninstall' ) + ' </button>';
				}
				else
				{
					str += '<button class="Button IconSmall fa-arrow-circle-o-down" id="app_' + aa + '" onclick="install(\'' + soft[a].Name + '\',' + aa + '); return cancelBubble( event );"> ' + i18n( 'i18n_install' ) + ' </button>';
				}

				str += '</div>'; // end buttons

				str += '</div>';			

				str += '</div>';
			}	
			str += '</div>';
			
			if( sidelist )
				str += '<div id="SideList">' + sidelist + '</div>';
			
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
		
		var eles = ge( 'SortAlphaNumeric' ).getElementsByTagName( 'button' );
		for( var a = 0; a < eles.length; a++ )
		{
			eles[a].list = eles;
			eles[a].addEventListener( 'click', function( e )
			{
				if( e.button != 0 ) return;
				for( var b = 0; b < this.list.length; b++ )
				{
					if( this.list[b] == this )
					{
						this.classList.add( 'Orange' );
					}
					else
					{
						this.list[b].classList.remove( 'Orange' );
					}
				}
			} );
		}
		
		// Try to load previews
		function delayedImageLoader( app, num )
		{
			var p = Ge( 'Product_' + num );
			if( p )
			{
				p.classList.add ( 'ProductImage' );
				var div = document.createElement( 'div' );
				div.className = 'Image';
				let f = new Image();
				f.src = '/system.library/module/?module=system&command=getapplicationicon&application=' + app + '&authid=' + Application.authId;
				f.onerror = function()
				{
					p.parentNode.removeChild( p );
					div.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:' + app ) + 'url(' + getImageUrl( 'Progdir:icon.png' ) + ')';
				}
				f.onload = function()
				{
					p.classList.add( 'Showing' );
					div.style.backgroundImage = 'url(' + f.src + ')';
				}
				p.appendChild( div );
				return true;
			}
			return false;
		}
		for( var a = 0; a < finalList.length; a++ )
		{
			delayedImageLoader( finalList[a].Name, a );
		}
		
		InitTabs( ge( 'SoftwareTabs' ) );
		
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
	
	// Get metadata first
	var m = new Module( 'system' );
	m.onExecuted = function( me, md )
	{
		if( me == 'ok' )
		{
			metadata = {};
			try
			{
				var test = JSON.parse( md );
				for( var a = 0; a < test.length; a++ )
				{
					var k = test[ a ].Key.split( 'application_' )[1];
					if( !metadata[ k ] )
						metadata[ k ] = {};
					if( test[a].ValueString == 'Visible' )
						metadata[k].visible = test[ a ].ValueNumber;
					if( test[a].ValueString == 'Featured' )
						metadata[k].featured = test[ a ].ValueNumber;
				}
			}
			catch( e ){};
		}
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var mm = new Module( 'system' );
			mm.onExecuted = function( me, md )
			{
				// Do the thang!
				cbksoftware( e, d, me, md );
			}
			mm.execute( 'listuserapplications' );
		}
		m.execute( 'software', { 'type': 'repository' } );
	}
	m.execute( 'getmetadata', { search: 'application_', valueStrings: [ 'Visible', 'Featured' ] } );
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

function showNotice()
{
	if( ge( 'theNotice' ) ) return;
	
	var str = '<h2>Notice to users</h2><p>The Friend Marketplace is the prototype of the Friend Store. It is in a <strong>beta</strong> quality state, and is missing key functionality, polish and interface design. This application will improve over time.</p><p><button onclick="hideNotice()">I understand</button></p>';
	
	var d = document.createElement( 'div' );
	d.id = 'theNotice';
	d.innerHTML = '<div class="TheContent">' + str + '</div>';
	document.body.appendChild( d );
}

function hideNotice()
{
	if( ge( 'theNotice' ) )
	{
		document.body.removeChild( ge( 'theNotice' ) );
	}
}
