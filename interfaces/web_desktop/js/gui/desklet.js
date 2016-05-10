/*******************************************************************************
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
*******************************************************************************/

var __desklets = [];

// A desklet that can be moved around on top of a div
GuiDesklet = function ( pobj, width, height, pos, px, py )
{
	this.margin = 4;
	this.iconrows = 1;
	
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
	
	var self = this;
	
	if ( !pobj.desklets )
		pobj.desklets = new Array ();
	if ( !pobj.refreshDesklets )
	{
		pobj.refreshDesklets = function ()
		{
			for ( var a = 0; a < this.desklets.length; a++ )
			{
				this.desklets[a].refresh ();
			}
		}
	}
	this.desktop = pobj;
	this.dom = document.createElement ( 'div' );
	this.dom.className = 'Desklet';
	this.dom.id = this.makeUniqueId ();
	this.dom.style.width = width + 'px';
	this.dom.style.height = height + 'px';
	
	switch ( pos )
	{
		default:
		case 'right':
			this.dom.style.position = 'absolute';
			this.dom.style.right = '5px';
			this.dom.style.top = Math.floor ( pobj.offsetHeight * 0.5 - ( height * 0.5 ) ) + 'px';
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
	
	this.desktop.appendChild ( this.dom );
	this.dom.events = new Array();
	this.dom.desklet = this;
	this.addEvent = function ( eve, func )
	{
		if ( typeof ( this.dom.events ) == 'undefined' )
			this.dom.events = new Array ();
		if ( typeof ( this.dom.events[eve] ) == 'undefined' )
			this.dom.events[eve] = new Array ();
	}
	// Add events ---------------------------------------------------------------
	this.dom.onmousedown = function ( e )
	{
		if ( !e ) e = window.event;
		if ( typeof ( this.events['mousedown'] ) != 'undefined' )
		{
			for ( var a = 0; a < this.events['mousedown'].length; a++ )
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
	
	this.openDesklet = function()
	{
		if(Workspace && typeof Workspace.closeDrivePanel == 'function' ) Workspace.closeDrivePanel();
		
		this.mobileClicked = true;
		
		/* count content + calc our "optimal" dimensions + position ourselves */
		var items = this.dom.getElementsByClassName('Launcher');
		var itemWidth = this.width; // - (this.margin*2);
		var itemHeight = itemWidth; // squared items for now....
		
		var screenSpaceH = ge ( 'DoorsScreen' ).offsetWidth - (this.margin*2);
		var screenSpaceV = ge ( 'DoorsScreen' ).offsetHeight - (this.margin*2) - 80;
				
		//console.log( 'Data....', screenSpaceH, screenSpaceV, itemHeight, itemWidth,	'Items amount/list', items.length, items );		
		
		var colsAvailable = Math.floor( screenSpaceH / itemWidth ) - 1;
		var rowsNeeded = Math.ceil( items.length / colsAvailable );
		
		if( rowsNeeded * itemHeight > screenSpaceV )
		{
			// we need scrolling
			console.log('we need scrolling here....');
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
	
	// Done events --------------------------------------------------------------
	// Overwritable render function
	this.render = function ()
	{
		var h = this.margin;
		var iconheight = false;
		for ( var a = 0; a < this.dom.childNodes.length; a++ )
		{
			var cn = this.dom.childNodes[a];
			if ( cn.className == 'Launcher' )
			{
				switch ( this.pos )
				{
					case 'right':
					case 'left':
						if( !iconheight )iconheight = cn.offsetHeight;
						h += cn.offsetHeight;
						h += this.margin
						break;
					case 'top':
					case 'bottom':
						break;
				}
			}
		}
		
		
		if( window.isMobile )
		{
			this.closeDesklet();
		}		
		else
		{
			//all icons have the same dimensions... so we just 
			h = Math.ceil( this.dom.childNodes.length / this.iconrows ) * iconheight + Math.ceil( this.dom.childNodes.length * this.margin / this.iconrows ) + this.margin;	
			
			if( h < window.innerHeight - 60 )
			{
				this.dom.style.top = Math.floor ( ( ge ( 'DoorsScreen' ).offsetHeight * 0.5 ) - ( h * 0.5 ) ) + 'px';
				this.dom.style.height = h + 'px';				
			} 
			else
			{
				this.iconrows++;
				this.dom.style.width = (this.iconrows * this.width) + 'px';
				this.render(); 		
			}
		}
	}
	this.addLauncher = function ( o )
	{
		if ( o.src && ( o.click || o.exe ) )
		{
			var div = document.createElement ( 'div' );
			div.className = 'Launcher';
			div.style.width = this.width - ( this.margin * 2 ) + 'px';
			div.style.height = this.width - ( this.margin * 2 ) + 'px';
			if( o.src.substr( 0, 1 ) == '.' )
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
				// Extension
				if( o.exe.indexOf( ':' ) > 0 )
				{
					var l = o.exe.split( ':' )[1];
					if( l.indexOf( '/' ) > 0 )
					{
						l = l.split( '/' );
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
									return ExecuteApplication( mt.executable, o.exe );
								}
							}
						}
					}
				}
				ExecuteApplication( o.exe );
			}
			if ( o.title )
				div.setAttribute ( 'title', o.title ? o.title : o.src );
			this.dom.appendChild ( div );
			this.refresh ();
			return true;
		}
		return false;
	}
	// Clear!
	this.clear = function()
	{
		this.dom.innerHTML = '';
	}
	// Standard refresh function
	this.refresh = function ()
	{
		this.render ();
	}
	this.dom.drop = function( eles )
	{
		var dropped = 0;
		for( var a = 0; a < eles.length; a++ )
		{
			var el = eles[a];
			
			if( el.fileInfo && el.Title && el.fileInfo.Type == 'Executable' )
			{
				var fi = eles[a].fileInfo;
				var o = {
					title: fi.Title,
					exe: fi.Title ? fi.Title : fi.Filename,
					src: fi.IconFile
				};
				if( self.addLauncher( o ) )
				{				
					var m = new Module( 'dock' );
					var w = this.view;
					m.onExecuted = function( r, dat )
					{
						//
					}
					m.execute( 'additem', { type: 'executable', application: o.exe, shortdescription: '' } );
					dropped++;
				}
			}
			// Add a normal file
			if( el.fileInfo && el.Title && el.fileInfo.Type == 'File' )
			{
				var fi = eles[a].fileInfo;
				var o = {
					title: fi.Title ? fi.Title : fi.Filename,
					exe: el.fileInfo.Path,
					src: fi.Title ? fi.Title : fi.Filename
				};
				if( self.addLauncher( o ) )
				{				
					var m = new Module( 'dock' );
					var w = this.view;
					m.onExecuted = function( r, dat )
					{
						//
					}
					m.execute( 'additem', { type: 'file', application: el.fileInfo.Path, shortdescription: '' } );
					dropped++;
				}
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

function RefreshDesklets ()
{
	for ( var a = 0; a < __desklets.length; a++ )
		__desklets[a].render ();
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

