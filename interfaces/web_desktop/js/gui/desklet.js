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

var __desklets = [];

// A desklet that can be moved around on top of a div
GuiDesklet = function ( pobj, width, height, pos, px, py )
{
	this.margin = 4;
	
	// Make a unique div id
	this.makeUniqueId = function ()
	{
		var id = 'desklet_';
		var num = 0;
		while ( ge ( id + num ) )
		{
			num++;
		}
		return id + num;
	}
	
	this.width = width;
	this.height = height;
	this.pos = pos;
	
	// Initial layout
	this.conf = {
		width: width,
		height: height,
		position: pos,
		dockx: px,
		docky: py
	};
	
	var self = this; // Reference for other scopes
	
	// Setup desklets array on parent object
	if ( !pobj.desklets ) pobj.desklets = [];
	if ( !pobj.refreshDesklets )
	{
		pobj.refreshDesklets = function ()
		{
			for ( var a = 0; a < this.desklets.length; a++ )
				this.desklets[a].refresh ();
		}
	}
	this.desktop = pobj;
	
	// Create dom node
	this.dom = document.createElement ( 'div' );
	this.dom.className = 'Desklet';
	this.dom.id = this.makeUniqueId ();
	this.desktop.appendChild ( this.dom );
	this.dom.events = [];
	this.dom.desklet = this;
	this.addEvent = function( eve, func )
	{
		if( typeof( this.dom.events ) == 'undefined' )
			this.dom.events = [];
		if( typeof( this.dom.events[eve] ) == 'undefined' )
			this.dom.events[eve] = [];
	}
	
	// Add events --------------------------------------------------------------
	
	this.dom.onmousedown = function ( e )
	{
		if( !e ) e = window.event;
		if( typeof ( this.events['mousedown'] ) != 'undefined' )
		{
			for( var a = 0; a < this.events['mousedown'].length; a++ )
			{
				this.events['mousedown'][a]( e );
			}
		}
	}
	this.dom.onclick = function ( e )
	{
		if ( !e ) e = window.event;
		if ( typeof ( this.events['click'] ) != 'undefined' )
		{
			for ( var a = 0; a < this.events['click'].length; a++ )
			{
				this.events['click'][a]( e );
			}
		}
		// TODO: make it work! And only on mobile!
		if( window.isMobile )
		{
			if( !this.mobileClicked )
			{
				this.desklet.openDesklet();
				this.mobileClicked = true;
			}
			else
			{
				this.desklet.closeDesklet();
				this.mobileClicked = false;
			}
		}
		else
		{
		}
	}
	// For touch devices
	this.dom.addEventListener( 'touchstart', function( e )
	{
		this.onclick( e );
	}, false );
	this.dom.onmouseup = function ( e )
	{
		if ( !e ) e = window.event;
		if ( typeof ( this.events['mouseup'] ) != 'undefined' )
		{
			for ( var a = 0; a < this.events['mouseup'].length; a++ )
			{
				this.events['mouseup'][a]( e );
			}
		}
	}
	this.dom.onmousemove = function ( e )
	{
		if ( !e ) e = window.event;
		if ( typeof ( this.events['mousemove'] ) != 'undefined' )
		{
			for ( var a = 0; a < this.events['mousemove'].length; a++ )
			{
				this.events['mousemove'][a]( e );
			}
		}
	}
	
	// Done events -------------------------------------------------------------
	
	// For mobile version ------------------------------------------------------
	
	this.openDesklet = function( e )
	{
		// New drivepanel alike method! (2017!!
		if( !Workspace.appPanel )
		{
			Workspace.appPanel = ge( 'DoorsScreen' ).getElementsByClassName( 'ScreenContent' )[0].getElementsByTagName( 'div' )[0];
		}
		var dp = Workspace.appPanel;
		
		// Create disposable menu
		var menu = new FullscreenMenu();
		var items = this.dom.getElementsByClassName( 'Launcher' );
		for( var a = 0; a < items.length; a++ )
		{
			var iconItem = document.createElement( 'div' );
			iconItem.className = 'File';
			iconItem.onclick = items[a].onclick;
			iconItem.innerHTML = '' +
				'<div class="Icon"><div class="Door" style="background-image: ' + items[a].style.backgroundImage.split( '"' ).join( '\'' ) + '">' + 
				'</div></div>';
			menu.addMenuItem( {
				text: items[a].getAttribute( 'title' ),
				clickItem: iconItem
			} );
		}
		menu.show( i18n( 'i18n_run_application' ) );
	
		return cancelBubble( e );
		
		/* Old method */
		
		if( Workspace && typeof Workspace.closeDrivePanel == 'function' )
			Workspace.closeDrivePanel();
		
		this.mobileClicked = true;
		
		/* count content + calc our "optimal" dimensions + position ourselves */
		var items = this.dom.getElementsByClassName('Launcher');
		var itemWidth = this.width; // - (this.margin*2);
		var itemHeight = itemWidth; // squared items for now....
		
		var margin2 = this.margin * 2;
		var screenSpaceH = ge ( 'DoorsScreen' ).offsetWidth - margin2;
		var screenSpaceV = ge ( 'DoorsScreen' ).offsetHeight - margin2 - 80;
				
		//console.log( 'Data....', screenSpaceH, screenSpaceV, itemHeight, itemWidth,	'Items amount/list', items.length, items );		
		
		var colsAvailable = Math.floor( screenSpaceH / itemWidth ) - 1;
		var rowsNeeded = Math.ceil( items.length / colsAvailable );
		
		if( rowsNeeded * itemHeight > screenSpaceV )
		{
			// we need scrolling
		}
		
		//we center us on the screen
		this.dom.style.height = Math.ceil(rowsNeeded * itemHeight + this.margin*2) + 'px';
		this.dom.style.top = Math.floor( ( screenSpaceV - rowsNeeded * itemHeight) / 2) + 64 + 'px';
			
		var myWidth = Math.min( Math.floor( screenSpaceH ), ( Math.floor( itemWidth * colsAvailable ) + (this.margin*2) + 12 ) );
		
		this.dom.style.width = myWidth + 'px';
		this.dom.style.left = Math.floor( ( screenSpaceH - myWidth ) / 2 ) + 'px';
		this.dom.style.right = 'auto';
		
		// determine y pos
		this.dom.className = 'Desklet Open';
	}
	
	this.closeDesklet = function()
	{
		this.dom.className = 'Desklet';
		this.dom.style.bottom = '10px';
		this.dom.style.right = '10px';
		this.dom.style.left = 'auto';
		this.dom.style.top = '100%';
		this.dom.style.width = '64px';
		this.dom.style.height = 'auto';
	}
	
	// End mobile version ------------------------------------------------------
	
	// Overwritable render function --------------------------------------------
	
	this.render = function ( forceRefresh )
	{
		// Setup the container for the launcher icons
		this.dom.style.position = 'absolute';
		
		// Move window list
		var viewList = false;
		for( var a = 0; a < this.dom.childNodes.length; a++ )
		{
			if( this.dom.childNodes[a].className == 'ViewList' )
			{
				viewList = this.dom.childNodes[a];
				break;
			}
		}
		if( viewList )
		{
			this.dom.removeChild( viewList );
			this.dom.appendChild( viewList );
		}
		
		var items = [];
		for( var a = 0; a < this.dom.childNodes.length; a++ )
		{
			if( this.dom.childNodes[a].className == 'ViewList' ) continue;
			items.push( this.dom.childNodes[a] );
		}
		if( this.viewList ) 
		{
			for( var a = 0; a < this.viewList.childNodes.length; a++ )
				items.push( this.viewList.childNodes[a] );
		}
		
		var itemWidth = this.conf && this.conf.size ? this.conf.size : 56;
		var itemHeight = this.conf && this.conf.size ? this.conf.size : 56;
		var margin = 8;
		
		var pos = this.conf.layout;
		var position = this.conf.position;
		
		if( position != 'fixed' )
		{
			switch( pos )
			{
				case 'left_center':
				case 'left_top':
				case 'left_bottom':
				case 'right_center':
				case 'right_top':
				case 'right_bottom':
				default:
					this.direction = 'vertical';
					break;
				case 'top_left':
				case 'top_center':
				case 'top_right':
				case 'bottom_left':
				case 'bottom_center':
				case 'bottom_right':
					this.direction = 'horizontal';
					break;
			}
	
			if( window.isMobile )
			{
				/* we can only have one for now.... */
				this.dom.style.bottom = '10px';
				this.dom.style.right = '10px';
				this.dom.style.top = '100%';
				this.dom.style.width = '64px';
				this.dom.style.height = 'auto';
			}
		}
		// Fixed!
		else
		{
			this.dom.style.top = this.conf.docky + 'px';
			this.dom.style.left = this.conf.dockx + 'px';
		}
		
		//if window gets bigger we want to snap back to one row.
		if( forceRefresh ) this.iconrows = 1;
		
		if( window.isMobile )
		{
			this.closeDesklet();
			return;
		}		
		
		// Do the rendering of icons
		var sh = ge( 'DoorsScreen' )[ this.direction == 'vertical' ? 'offsetHeight' : 'offsetWidth' ] - 40; // TODO: 40 is the titlebar, make dynamic
		var availSpace = sh - 80;
		var calcLength = ( ( ( this.direction == 'vertical' ? itemHeight : itemWidth ) + margin ) * items.length ) - margin;
		var blocks = Math.ceil( calcLength / availSpace ); // TODO: Make dynamic
		if( blocks < 1 ) blocks = 1;
		
		var currBlock = 0;
		var len = 0;
		var itemUnit = ( this.direction == 'vertical' ? itemHeight : itemWidth ) + margin;
		var maxLength = availSpace;
		var x = margin, y = margin, maxLen = 0;
		var cols = rows = 1;
		for( var a = 0; a < items.length; a++ )
		{
			var cn = items[a];
			cn.style.position = 'absolute';
			cn.style.left = x + 'px';
			cn.style.top = y + 'px';
			if( cn.className != 'ViewList' )
			{
				cn.style.width = itemWidth + 'px';
				cn.style.height = itemHeight + 'px';
			}
			// Window list is a special bastard!
			else
			{
				cn.style.width = 'auto';
				cn.style.height = 'auto';
				continue;
			}
			
			if( this.direction == 'vertical' )
			{
				y += itemHeight + margin;
			}
			else
			{
				x += itemWidth + margin;
			}
			len += itemUnit;
			
			if( len > maxLen )
				maxLen = len;
			
			if( len >= maxLength && a != items.length - 1 )
			{
				len = 0;
				if( this.direction == 'vertical' )
				{
					x += itemWidth + margin;
					y = margin;
					cols++;
				}
				else
				{
					x = margin;
					y += itemHeight + margin;
					rows++;
				}
			}
		}
		
		// Size of container
		if( this.direction == 'vertical' )
		{
			this.pixelHeight = maxLen + margin;
			this.dom.style.width = margin + Math.floor( cols * ( itemWidth + margin ) ) + 'px';
			this.dom.style.height = this.pixelHeight + 'px';
		}
		else
		{
			this.pixelWidth = maxLen + margin;
			this.dom.style.width = this.pixelWidth + 'px';
			this.dom.style.height = margin + Math.floor( rows * ( itemHeight + margin ) ) + 'px';
			
		}
		
		// Position of container
		if( position != 'fixed' )
		{
			var th = 32; // TODO: Set dynamic title bar height
			var midScreenH = ( ( this.dom.parentNode.offsetHeight - th ) * 0.5 ) + th;
			
			this.dom.style.left = 'auto';
			this.dom.style.top = 'auto';
			this.dom.style.right = 'auto';
			this.dom.style.bottom = 'auto';
			this.dom.setAttribute( 'position', pos );
			switch( pos )
			{
				case 'left_center':
					this.dom.style.left = '0px';
					this.dom.style.top = Math.floor( midScreenH - ( this.pixelHeight * 0.5 ) ) + 'px';
					break;
				case 'left_top':
					this.dom.style.left = '0px';
					this.dom.style.top = '32px'; // TODO: Dynamic!
					break;
				case 'left_bottom':
					this.dom.style.left = '0px';
					this.dom.style.bottom = '0px';
					break;
				default:
				case 'right_center':
					this.dom.style.right = '0px';
					this.dom.style.top = Math.floor( midScreenH - ( this.pixelHeight * 0.5 ) ) + 'px';
					break;
				case 'right_top':
					this.dom.style.right = '0px';
					this.dom.style.top = '32px'; // TODO: Dynamic!
					break;
				case 'right_bottom':
					this.dom.style.right = '0px';
					this.dom.style.bottom = '0px';
					break;
				case 'top_center':
					this.dom.style.top = '32px'; // TODO: Dynamic!
					this.dom.style.left = Math.floor( ( this.dom.parentNode.offsetWidth * 0.5 ) - ( this.pixelWidth * 0.5 ) ) + 'px';
					break;
				case 'top_left':
					this.dom.style.top = '32px'; // TODO: Dynamic!
					this.dom.style.left = '0px';
					break;
				case 'top_right':
					this.dom.style.top = '32px'; // TODO: Dynamic!
					this.dom.style.right = '0px';
					break;
				case 'bottom_center':
					this.dom.style.bottom = '0px';
					this.dom.style.left = Math.floor( ( this.dom.parentNode.offsetWidth * 0.5 ) - ( this.pixelWidth * 0.5 ) ) + 'px';
					break;
				case 'bottom_left':
					this.dom.style.bottom = '0px';
					this.dom.style.left = '0px';
					break;
				case 'bottom_right':
					this.dom.style.bottom = '0px';
					this.dom.style.right = '0px';
					break;
			}
		}
	}
	// End render --------------------------------------------------------------
	this.toggleViewVisibility = function( ele, state )
	{
		if( ele.views )
		{
			var cnt = 0;
			for( var a in ele.views )
				cnt++;
			if( cnt > 0 )
			{
				if( state ) ele.state = state;
				else ele.state = ele.state == 'hidden' ? 'visible' : 'hidden';
				
				for( var i in ele.views )
				{
					var s = ele.views[i].windowObject.getFlag( 'screen' );
					if( s.div.id != 'DoorsScreen' ) continue;
					if( ele.views[i].windowObject.getFlag( 'invisible' ) ) continue;
					ele.views[i].windowObject.setFlag( 'hidden', ele.state == 'hidden' ? true : false );
					_WindowToFront( ele.views[i] );
				}
				if( ele.state == 'hidden' )
				{
					ele.classList.add( 'Minimized' );
				}
				else
				{
					ele.classList.remove( 'Minimized' );
				}
				return true;
			}
		}
		return false;
	}
	
	this.toggleExecutable = function( ele, state )
	{
		if( typeof( ele ) != 'object' )
		{
			for( var a = 0; a < this.dom.childNodes.length; a++ )
			{
				if( this.dom.childNodes[a].executable && this.dom.childNodes[a].executable == ele )
				{
					ele = this.dom.childNodes[a];
					break;
				}
			}
		}
		var found = false;
		for( var a = 0; a < Workspace.applications.length; a++ )
		{
			var ap = Workspace.applications[a];
			if( ap.applicationName != ele.executable )
				continue;
			if( !ap.windows ) continue;
			
			// TODO: Animation before hiding!
			var st = 'idle';
			for( var w in ap.windows )
			{
				var s = ap.windows[w].getFlag( 'screen' );
				if( s.div.id != 'DoorsScreen' ) continue;
				
				if( st == 'idle' )
					st = ap.windows[w].getFlag( 'hidden' );
				if( ap.windows[w].getFlag( 'invisible' ) ) continue;
				ap.windows[w].setFlag( 'hidden', st ? false : true );
				if( st )
				{
					_WindowToFront( ap.windows[w]._window );
					_ActivateWindowOnly( ap.windows[w]._window.parentNode );
					ele.classList.remove( 'Minimized' );
				}
				else ele.classList.add( 'Minimized' );
			}
			return true;
		}
		return false;
	}
	
	this.addLauncher = function ( o )
	{
		var dk = this;
		if ( o.src && ( o.click || o.exe ) )
		{
			var div = document.createElement ( 'div' );
			div.className = 'Launcher';
			div.style.width = this.width - ( this.margin * 2 ) + 'px';
			div.style.backgroundSize = 'contain';
			div.style.height = this.width - ( this.margin * 2 ) + 'px';
			div.executable = o.exe;
			
			// Running apps
			for( var a in Workspace.applications )
			{
				if( Workspace.applications[ a ].applicationName == o.exe )
				{
					div.classList.add( 'Running' );
					break;
				}
			}
			
			if( o.src.indexOf( ':' ) > 0 && o.src.substr( 0, 4 ) != 'http' )
				o.src = getImageUrl( o.src );
			
			if( o.src == '.url' )
			{
				function loadIco( u )
				{
					var f = new File( u.exe );
					f.onLoad = function( data )
					{
						try
						{
							var json = JSON.parse( data );
							if( json.link )
							{
								div.onclick = function()
								{
									window.open( json.link, '_blank' );
								}
								var s = json.link.split( '://' );
								s[1] = s[1].split( '/' );
								s = s[0] + '://' + s[1] + '/favicon.ico';
							
								var j = new Image();
								j.onload = function()
								{
									div.innerHTML = '<div style="position: absolute; top: 50%; left: 50%"><img style="position: absolute; left: -' + ( j.width * .5 ) + 'px; top: -' + ( j.height * .5 ) + 'px" src="' + j.src + '"/></div>';
								}
								j.src = s;
								console.log( s );
							}
						}
						catch( e ){};
					}
					f.load();
				}
				loadIco( o );
				
				div.style.backgroundImage = '';
				var d = document.createElement( 'div' );
				d.className = 'File';
				d.innerHTML = '<div class="Icon"><div style="background-size: contain" class="TypeWebUrl"></div></div>';
				div.appendChild( d );
			}
			else if( o.src.substr( 0, 1 ) == '.' )
			{
				div.style.backgroundImage = '';
				var d = document.createElement( 'div' );
				var t = o.src.substr( 1, o.src.length - 1 ).toUpperCase();
				d.className = 'File';
				d.innerHTML = '<div class="Icon"><div class="Type' + t + '"></div></div>';
				div.appendChild( d );
			}
			else
			{
				div.style.backgroundImage = 'url(' + o.src + ')';
			}
			if( o.click ) div.onclick = o.click;
			else div.onclick = function( e )
			{
				// We got views? Just manage them
				if( dk.toggleViewVisibility( this ) ) return;
				
				var args = '';
				var executable = o.exe + '';

				if( executable.indexOf( ' ' ) > 0 )
				{
					var t = executable.split( ' ' );
					if( t[0].indexOf( ':' ) == -1)
					{
						args = '';
						for( var a = 1; a < t.length; a++ )
						{
							args += t[a];
							if( a < t.length - 1 )
								args += ' ';
						}
						executable = t[0];	
					}
				}
				
				// Extension
				if( executable.indexOf( ':' ) > 0 )
				{
					var l = executable.split( ':' )[1];
					if( l.indexOf( '/' ) > 0 )
					{
						l = l.split('/');
						l = l[l.length-1];
					}
					
					if( l.length > 1 )
					{
						var ext = l;
						ext = '.' + ext[ext.length-1].toLowerCase();
		
						// Check mimetypes
						for( var a in Workspace.mimeTypes )
						{
							var mt = Workspace.mimeTypes[a];

							for( var b in mt.types )
							{
								if( ext == mt.types[b].toLowerCase() )
								{
									return ExecuteApplication( mt.executable, executable );
								}
							}
						}
					}
				}
				
				var docked = globalConfig.viewList == 'docked';
				
				// If not a single instance app, execute
				if( !docked && !friend.singleInstanceApps[ executable ] || o.exe.indexOf( ' ' ) > 0 )
				{
					ExecuteApplication( executable, args );
				}
				// Just minimize apps if you find them, if not execute
				else
				{
					if( dk.toggleExecutable( div ) ) return;
					
					// If we didn't find the app, execute
					ExecuteApplication( executable, args );
				}
				
				// Close it for mobile
				if( window.isMobile )
				{
					self.closeDesklet();
					self.dom.mobileClicked = false;
				}
			}
			div.addEventListener( 'touchstart', div.onclick );
			if ( o.title )
				div.setAttribute( 'title', o.title ? o.title : o.src );
			this.dom.appendChild( div );
			this.refresh ();
			return true;
		}
		return false;
	}
	this.readConfig = function( conf )
	{
		if( conf.options ) this.conf = conf.options;
		this.render();
	}
	// Clear!
	this.clear = function()
	{
		var eles = this.dom.childNodes;
		var keep = []; // elements to keep
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].className == 'ViewList' )
			{
				keep.push( eles[a] );
			}
		}
		this.dom.innerHTML = '';
		for( var a = 0; a < keep.length; a++ )
		{
			this.dom.appendChild( keep[a] );
		}
	}
	// Standard refresh function
	this.refresh = function ()
	{
		this.render( true );
	}
	this.dom.drop = function( eles )
	{
		var dropped = 0;
		
		for( var a = 0; a < eles.length; a++ )
		{
			var el = eles[a];
			var fi = eles[a].fileInfo;
			
			var element = false;
			
			// Executable files
			if( el.fileInfo && el.Title && el.fileInfo.Type == 'Executable' )
			{
				element = {
					title: fi.Title,
					exe: fi.Title ? fi.Title : fi.Filename,
					src: fi.IconFile,
					application: fi.Title ? fi.Title : fi.Filename,
					type: 'executable'
				};
			}
			// Normal files
			else if( el.fileInfo && el.Title && el.fileInfo.Type == 'File' )
			{
				element = {
					title: fi.Title ? fi.Title : fi.Filename,
					exe: el.fileInfo.Path,
					src: fi.Title ? fi.Title : fi.Filename,
					application: el.fileInfo.Path,
					type: 'file'
				};
			}
			
			// Add to launcher
			if( self.addLauncher( element ) )
			{				
				var m = new Module( 'dock' );
				var w = this.view;
				m.onExecuted = function( r, dat )
				{
					// Refresh dock noe more time
					Workspace.reloadDocks();
				}
				m.execute( 'additem', { type: element.type, application: element.application, shortdescription: '' } );
				dropped++;
			}
		}
		return false;
	}
}
function CreateDesklet ( pobj, width, height, pos, px, py )
{
	var d = new GuiDesklet ( pobj, width, height, pos, px, py );
	__desklets.push ( d );
	return d;
}

function RefreshDesklets()
{
	for ( var a = 0; a < __desklets.length; a++ )
	{
		__desklets[a].render ( true );
	}
}

function closeDesklets()
{
	if( !window.isMobile ) return; 
	
	for ( var a = 0; a < __desklets.length; a++ )
		__desklets[a].closeDesklet();
}
if ( window.addEventListener )
	window.addEventListener ( 'resize', RefreshDesklets );
else window.attachEvent ( 'onresize', RefreshDesklets );

