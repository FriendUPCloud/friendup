/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Some important flags for GUI elements ------------------------------------ */

var DEFAULT_SANDBOX_ATTRIBUTES = 'allow-same-origin allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox';
var FUI_MOUSEDOWN_RESIZE  =  2;
var FUI_MOUSEDOWN_WINDOW  =  1;
var FUI_MOUSEDOWN_SCREEN  =  3;
var FUI_MOUSEDOWN_SCROLLV = 10;
var FUI_WINDOW_MARGIN     =  3;
var FUI_MOUSEDOWN_PICKOBJ = 11;

/* Done important flags for GUI elements ------------------------------------ */

var movableHighestZindex = 99;
var movableWindowCount = 0;
var movableWindows = [];
var windowMouseX = -1;
var windowMouseY = -1;
var mousePointer = 
{
	prevMouseX: -1,
	prevMouseY: -1,
	elements: [],
	dom: false,
	testPointer: function ()
	{
		if( !ge( 'MousePointer' ) )
		{
			var d = document.createElement( 'div' );
			d.id = 'MousePointer';
			d.style.position = 'absolute';
			d.style.zIndex = 10000;
			d.style.opacity = 0.7;
			d.style.whiteSpace = 'nowrap';
			document.body.appendChild( d );
			this.dom = d;
		}
	},
	move: function( e )
	{
		if ( !e ) e = window.event;
		var tar = e.target ? e.target : e.srcElement;
		
		// If we have elements, it means we have icons!
		if ( this.elements.length )
		{
			// Make sure we don't have problems with iframes!
			CoverWindows();
			
			// Object moved over
			var mover = false;
			var moveWin = false;
			
			// Get mouse coords
			if( window.isTablet || window.isMobile )
			{
				windowMouseX = e.touches[0].pageX;
				windowMouseY = e.touches[0].pageY;
			}
			else
			{
				windowMouseX = e.clientX;
				windowMouseY = e.clientY;
			}
			
			// Skew them
			if( ge( 'DoorsScreen' ).screenOffsetTop )
				windowMouseY -= ge( 'DoorsScreen' ).screenOffsetTop;
			
			// Check move on window
			var z = 0;
			for ( var a in movableWindows )
			{
				var wn = movableWindows[a];
				var wnZ = parseInt ( wn.style.zIndex );
				if ( 
					wn.offsetTop < windowMouseY && 
					wn.offsetLeft < windowMouseX &&
					wn.offsetTop + wn.offsetHeight > windowMouseY &&
					wn.offsetLeft + wn.offsetWidth > windowMouseX && 
					wnZ >= z
				)
				{
					moveWin = false;
					if( wn.content && wn.content.fileBrowser )
					{
						if( !wn.content.fileBrowser.dom.classList.contains( 'Hidden' ) )
						{
							var fb = wn.content.fileBrowser.dom;
							if( windowMouseX < wn.offsetLeft + fb.offsetWidth && windowMouseY < wn.offsetTop + fb.offsetHeight )
							{
								moveWin = wn.content.fileBrowser;
							}
						}
					}
					if( !moveWin )
					{
						moveWin = wn;
					}
					z = wnZ;
				}
			}
			if( moveWin )
			{
				// Roll over filebrowser
				if( moveWin && moveWin.dom && moveWin.dom.classList.contains( 'FileBrowser' ) )
				{
					if( moveWin.rollOver )
					{
						moveWin.rollOver( this.elements );
					}
				}
				// Add mouse actions on window ->
				if( moveWin.windowObject && moveWin.windowObject.sendMessage )
				{
					moveWin.windowObject.sendMessage( {
						command: 'inputcoordinates',
						data: { x: windowMouseX - moveWin.content.offsetLeft - moveWin.offsetLeft, y: windowMouseY - moveWin.content.offsetTop - moveWin.offsetTop }
					} );
				}
			}
			
			// Check screens and view windows
			var screens = [];
			var screenl = ge( 'Screens' );
			for( var a = 0; a < screenl.childNodes.length; a++ )
			{
				if( screenl.childNodes[a].tagName == 'DIV' && screenl.childNodes[a].classList && screenl.childNodes[a].classList.contains( 'Screen' ) )
				{
					screens.push( screenl.childNodes[a].screen._screen );
				}
			}
			var ars = [];
			for( var a in movableWindows )
				ars.push( movableWindows[a] );
			ars = ars.concat( screens );
		
			for( var c in ars )
			{
				var isListView = false;
				var isScreen = false;
				var w = ars[c].icons ? ars[c] : ars[c].content;
				if( !w || !w.icons ) continue; // No icons? Skip!
				
				var sctop = 0;

				// Listview counts from a different element
				var iconArea = w;
				if( w.directoryview && w.directoryview.listMode == 'listview' )
				{
					iconArea = w.querySelector( '.ScrollArea' );
					sctop = [ iconArea ];
					isListView = true;
				}
				else
				{
					if( !w.classList.contains( 'ScreenContent' ) )
					{
						sctop = w.getElementsByClassName( 'Scroller' );
					}
					// We're checking screen icons
					else
					{
						isScreen = true;
					}
				}
				
				var scleft = 0;
				if( sctop && sctop.length ) 
				{
					scleft = sctop[0].scrollLeft;
					sctop = sctop[0].scrollTop;
				}
				else sctop = 0;
			
				var my = windowMouseY - GetElementTop( iconArea ) + sctop;
				var mx = windowMouseX - GetElementLeft( iconArea ) + scleft;
				
				// Add file browser offset
				if( w.fileBrowser && !isListView )
				{
					if( !w.fileBrowser.dom.classList.contains( 'Hidden' ) )
					{
						var fb = w.fileBrowser.dom;
						mx -= fb.offsetWidth;
					}
				}
				
				var hoverIcon = false;
				
				for( var a = 0; a < w.icons.length; a++ )
				{
					var ic = w.icons[a].domNode;
					var icon = w.icons[a];
			
					// Exclude elements dragged
					var found = false;
					for( var b = 0; b < this.dom.childNodes.length; b++ )
					{
						if( ic == this.dom.childNodes[b] )
							found = true;
					}
					if( found ) 
					{
						continue;
					}
					// Done exclude
					
					if( ic )
					{
						if( 
							!hoverIcon && 
							!mover &&
							( isScreen || ( moveWin && w == moveWin.content ) ) &&
							ic.offsetTop < my && ic.offsetLeft < mx &&
							ic.offsetTop + ic.offsetHeight > my &&
							ic.offsetLeft + ic.offsetWidth > mx
						)
						{
							hoverIcon = true;
							ic.classList.add( 'Selected' );
							ic.selected = true;
							if( ic.fileInfo )
								ic.fileInfo.selected = true;
						}
						else if( !mover || mover != icon )
						{
							ic.classList.remove( 'Selected' );
							ic.selected = false;
							if( ic.fileInfo )
								ic.fileInfo.selected = false;
						}
					}
				}
			}
			// Register roll out!
			for( var a in window.movableWindows )
			{
				var wd = window.movableWindows[a];
				if( ( !mover && wd.rollOut ) || ( wd != moveWin && wd.rollOut ) )
					wd.rollOut( e );
			}
			
			// Assign!
			this.mover = mover ? mover : moveWin;
			if( this.mover.rollOver )
				this.mover.rollOver( this.elements );
		}
		// We have a candidate for dragging / etc
		else if( this.candidate && this.candidate.condition )
		{
			this.candidate.condition( e );
		}
	},
	stopMove: function ( e )
	{
		for ( var a in window.movableWindows )
		{
			var wn = window.movableWindows[a];
			if ( wn.rollOut ) wn.rollOut ( e );
		}
	},
	clear: function()
	{
		this.elements = [];
		this.dom.innerHTML = '';	
	},
	drop: function ( e )
	{
		if ( !e ) e = window.event;
		var tar = e.target ? e.target : e.srcElement;
		if ( this.elements.length )
		{
			var dropper = false;
			
			// Check drop on tray icon
			var titems = ge( 'Tray' ).childNodes;
			for( var a = 0; a < titems.length; a++ )
			{
				var tr = titems[a];
				var l = GetElementLeft( tr ); // left
				var t = GetElementTop( tr ); // bottom
				var r = l + tr.offsetWidth; // right
				var b = t + tr.offsetHeight; // bottom
				if( windowMouseX >= l && windowMouseX < r && windowMouseY >= t && windowMouseY < b )
				{
					dropper = tr;
					var objs = [];
					for( var k = 0; k < this.elements.length; k++ )
					{
						var e = this.elements[k];
						if ( e.fileInfo.getDropInfo ) {
							var info = e.fileInfo.getDropInfo();
							objs.push( info );
						} 
						else 
						{
							objs.push( {
								Path: e.fileInfo.Path,
								Type: e.fileInfo.Type,
								Filename: e.fileInfo.Filename ? e.fileInfo.Filename : e.fileInfo.Title,
								Filesize: e.fileInfo.fileSize,
								Icon: e.fileInfo.Icon
							} );
						}
					}
					if( dropper.ondrop )
					{
						dropper.ondrop( objs );
					}
					break;
				}
			}

			// Check screens and view windows
			var screens = [];
			var screenl = ge( 'Screens' );
			for( var a = 0; a < screenl.childNodes.length; a++ )
			{
				if( screenl.childNodes[a].tagName == 'DIV' && screenl.childNodes[a].classList && screenl.childNodes[a].classList.contains( 'Screen' ) )
				{
					screens.push( screenl.childNodes[a].screen._screen );
				}
			}
			var ars = [];
			for( var a in movableWindows )
			{
				// Don't check minimized windows
				if( movableWindows[a].parentNode.getAttribute( 'minimized' ) ) continue;
				ars.push( movableWindows[a] );
			}
			ars = ars.concat( screens );
			
			var dropped = 0;
			var dropWin = 0;
			var skipDropCheck = false;
			
			// Check drop on view
			if( !dropper )
			{
				var z = 0;
				for ( var a in ars )
				{
					var wn = ars[a];
					var wnZ = parseInt ( wn.style.zIndex );
					if( isNaN( wnZ ) ) wnZ = 0;
					if ( 
						wn.offsetTop < windowMouseY && wn.offsetLeft < windowMouseX &&
						wn.offsetTop + wn.offsetHeight > windowMouseY &&
						wn.offsetLeft + wn.offsetWidth > windowMouseX &&
						wnZ >= z
					)
					{
						dropWin = wn;
						z = wnZ;
					}
				}
				if( dropWin )
				{
					if( dropWin.content && dropWin.content.windowObject && dropWin.content.windowObject.refreshing ) return;
					// Did we drop on a file browser?
					if( dropWin.content && dropWin.content.fileBrowser )
					{
						var fb = dropWin.content.fileBrowser.dom;
						if( windowMouseX < dropWin.offsetLeft + fb.offsetWidth && windowMouseY < dropWin.offsetTop + fb.offsetHeight )
						{
							dropper = dropWin.content.fileBrowser;
							skipDropCheck = true;
						}
					}
					if( !skipDropCheck && !dropped && ( dropWin.icons || dropWin.content ) )
					{
						dropper = dropWin;
					}
				}
			}
			
			if( !skipDropCheck )
			{
				// Find what we dropped on
				for( var c in ars )
				{
					var isListView = false;
					var isScreen = false;
					var w = ars[c].icons ? ars[c] : ars[c].content;
					if( !w || !w.icons ) continue; // No icons? Skip!
				
					// If we have a dropped on view, skip icons on other views
					if( dropper && ( w != dropper.content && w != dropper ) )
						continue;
				
					var sctop = 0;

					// Listview counts from a different element
					var iconArea = w;
					if( w.directoryview && w.directoryview.listMode == 'listview' )
					{
						iconArea = w.querySelector( '.ScrollArea' );
						sctop = [ iconArea ];
						isListView = true;
					}
					else
					{
						if( !w.classList.contains( 'ScreenContent' ) )
						{
							sctop = w.getElementsByClassName( 'Scroller' );
						}
						// We're checking screen icons
						else
						{
							isScreen = true;
						}
					}
				
					var scleft = 0;
					if( sctop && sctop.length ) 
					{
						scleft = sctop[0].scrollLeft;
						sctop = sctop[0].scrollTop;
					}
					else sctop = 0;
					
					var my = windowMouseY - GetElementTop( iconArea ) + sctop;
					var mx = windowMouseX - GetElementLeft( iconArea ) + scleft;
				
					// Add file browser offset
					if( w.fileBrowser && !isListView )
					{
						if( !w.fileBrowser.dom.classList.contains( 'Hidden' ) )
						{
							var fb = w.fileBrowser.dom;
							mx -= fb.offsetWidth;
						}
					}
				
					// Drop on icon
					for ( var a = 0; a < w.icons.length; a++ )
					{
						var ic = w.icons[a].domNode;
				
						if( ic )
						{
							// Exclude elements dragged
							var found = false;
							for( var b = 0; b < this.dom.childNodes.length; b++ )
							{
								if( ic == this.dom.childNodes[b] )
									found = true;
							}
							if( found ) continue;
							// Done exclude
							
							var icon = w.icons[a];
							
							// Hit icon!
							if( 
								ic.offsetTop < my && ic.offsetLeft < mx &&
								ic.offsetTop + ic.offsetHeight > my &&
								ic.offsetLeft + ic.offsetWidth > mx
							)
							{
								dropper = icon;
								break;
							}
						}
					}
				}
			
				// Check drop on desklet
				if( !dropper || ( dropper.classList && dropper.classList.contains( 'ScreenContent' ) ) )
				{
					var z = 0;
					var dropWin = 0;
					for( var a = 0; a < __desklets.length; a++ )
					{
						var wn = __desklets[a].dom;
						var wnZ = parseInt ( wn.style.zIndex );
						if( isNaN( wnZ ) ) wnZ = 0;
						if ( 
							wn.offsetTop < windowMouseY && wn.offsetLeft < windowMouseX &&
							wn.offsetTop + wn.offsetHeight > windowMouseY &&
							wn.offsetLeft + wn.offsetWidth > windowMouseX &&
							wnZ >= z
						)
						{
							dropWin = wn;
							z = wnZ
						}
						else
						{
						}
					}
					if ( dropWin && dropWin.drop )
					{
						dropper = dropWin;
					}
				}
			}
			
			if( dropper )
			{
				// Assume the drop was handled correctly
				var dropResult = true;
				
				// Check if dropper object has a drop method, and execute it
				// with the supplied elements
				if( dropper.drop )
				{
					dropResult = dropped = dropper.drop( this.elements, e, dropWin.content );
				}
				else if( dropper.domNode && dropper.domNode.drop )
				{
					dropResult = dropper.domNode.drop( this.elements, e );
				}
				else if( dropper.domNode && dropper.domNode.file && dropper.domNode.file.drop )
				{
					dropResult = dropper.domNode.file.drop( this.elements, e );
				}
				else
				{
					var objs = [];
					for( var k = 0; k < this.elements.length; k++ )
					{
						var e = this.elements[k];
						if( e.fileInfo )
						{
							if( e.fileInfo.getDropInfo )
							{
								var info = e.fileInfo.getDropInfo();
								objs.push( info );
							}
							else
							{
								objs.push( {
									Path: e.fileInfo.Path,
									Type: e.fileInfo.Type,
									Filename: e.fileInfo.Filename ? e.fileInfo.Filename : e.fileInfo.Title,
									Filesize: e.fileInfo.fileSize,
									Icon: e.fileInfo.Icon
								});
							}
						}
					}
					if( dropper.windowObject )
					{
						dropper.windowObject.sendMessage( { command: 'drop', data: objs } );
					}
				}
			}
			
			// We didn't drop anything, or there was an error..
			if( dropped <= 0 )
			{
				if( window.currentMovable )
				{
					if( window.currentMovable.content && window.currentMovable.content.refresh )
						window.currentMovable.content.refresh();
				}
				// We dropped on a screen
				if( objs && dropper && dropper.classList.contains( 'ScreenContent' ) )
				{
					// We dropped on the Workspace screen
					if( dropper == Workspace.screen.contentDiv )
					{
						// Check if we can place desktop shortcuts
						var files = [];
						for( var a = 0; a < objs.length; a++ )
						{
							if( objs[ a ].Type == 'Executable' )
							{
								files.push( ':' + objs[ a ].Filename );
							}
							else if( objs[ a ].Type == 'Door' || objs[ a ].Type == 'Dormant' )
								continue;
							else
							{
								files.push( objs[ a ].Path );
							}
						}
						
						// Create desktop shortcuts
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							if( e == 'ok' )
							{
								Workspace.refreshDesktop( false, true );
							}
						}
						m.execute( 'createdesktopshortcuts', { files: files } );
					}
				}
			}
			
			
			// Redraw icons
			Workspace.redrawIcons();
			
			if( window.currentMovable && currentMovable.content && currentMovable.content.refresh )
				currentMovable.content.refresh();
			
			// Place back again
			if( !dropped || !dropper )
			{
				for( var a = 0; a < this.elements.length; a++ )
				{
					if( this.elements[a].ondrop )
						this.elements[a].ondrop( dropper );
					if( this.elements[a].oldParent )
					{
						var ea = this.elements[a];
						ea.oldParent.appendChild( ea );
						ea.style.top = ea.oldStyle.top;
						ea.style.left = ea.oldStyle.left;
						ea.style.position = ea.oldStyle.position;
						ea.oldStyle = null;
					}
					else this.dom.removeChild( this.elements[a] );
				}
			}
			// Remove
			else
			{
				for( var a = 0; a < this.elements.length; a++ )
				{
					if( this.elements[a].ondrop )
						this.elements[a].ondrop( dropper );
					this.dom.removeChild( this.elements[a] );
				}
			}
			this.elements = [];
			this.dom.innerHTML = '';
			
			if( w )
			{
				if( w.refreshIcons )
				{
					w.refreshIcons();
				}
			}
			
			Workspace.refreshDesktop();
		}
		this.mover = false;
	},
	clone: function ( ele )
	{
		this.testPointer ();
	},
	pickup: function ( ele, e )
	{
		// Do not allow pickup for mobile
		if( window.isMobile ) return;
		
		if( !e ) e = window.event;
		var ctrl = e && ( e.ctrlKey || e.shiftKey || e.command );
		
		var target = false;
		if( e ) target = e.target || e.srcElement;
		
		this.testPointer ();
		
		// Check multiple (pickup multiple)
		var multiple = false;
		if ( ele.window )
		{
			if( ele.window.windowObject && ele.window.windowObject.refreshing ) return;
			if( !ele.window.parentNode.classList.contains( 'Active'  ))
				_ActivateWindowOnly( ele.window.parentNode );
			
			for( var a = 0; a < ele.window.icons.length; a++ )
			{
				var ic = ele.window.icons[a];
				if( !ic.domNode ) continue;
				
				if( ic.domNode.className.indexOf ( 'Selected' ) > 0 )
				{
					var el = ic.domNode;
					multiple = true;
					el.oldStyle = {};
					el.oldStyle.top = el.style.top;
					el.oldStyle.left = el.style.left;
					el.oldStyle.position = el.style.position;
					el.style.top = el.offsetTop + 'px';
					el.style.left = el.offsetLeft + 'px';
					el.style.position = 'absolute';
					el.oldParent = el.parentNode;
					if( typeof ele.window.icons[a+1] != 'undefined' )
						el.sibling = ele.window.icons[a+1].domNode;
					if( el.parentNode )
					{
						el.parentNode.removeChild( el );
					}
					this.dom.appendChild( el );
					this.elements.push( el );
				}
			}
			// Align with top left corner
			var maxx = 99999;
			var maxy = 99999;
			var elements = this.elements;
			for( var a = 0; a < elements.length; a++ )
			{
				if( parseInt( elements[ a ].style.left ) < maxx )
					maxx = parseInt( elements[ a ].style.left );
				if( parseInt( elements[ a ].style.top ) < maxy )
					maxy = parseInt( elements[ a ].style.top );
			}
			for( var a = 0; a < elements.length; a++ )
			{
				elements[ a ].style.left = parseInt( elements[ a ].style.left ) - maxx + 'px';
				elements[ a ].style.top = parseInt( elements[ a ].style.top ) - maxy + 'px';
			}
		}
		// Pickup single
		if ( !multiple )
		{
			ele.oldStyle = {};
			ele.oldStyle.top = ele.style.top;
			ele.oldStyle.left = ele.style.left;
			ele.oldStyle.position = ele.style.position;
			ele.style.top = 'auto';
			ele.style.left = 'auto';
			ele.style.position = 'relative';
			if( ele.parentNode )
			{
				if( ele.oldParent )
					ele.oldParent.ele = ele.parentNode;
				ele.parentNode.removeChild( ele );
			}
			this.dom.appendChild( ele );
			this.elements.push( ele );
		}
	},
	poll: function ( e )
	{
		if( !this.elements || !this.elements.length )
		{
			if( this.dom )
				this.dom.parentNode.removeChild ( this.dom );
			this.dom = false;
		}
		else if( this.dom )
		{
			if( this.dom.firstChild )
			{
				this.dom.style.top = windowMouseY - ( this.dom.firstChild.offsetHeight >> 1 ) + 'px';
				this.dom.style.left = windowMouseX - ( this.dom.firstChild.offsetWidth >> 1 ) + 'px';
			}
			window.mouseDown = 5;
			ClearSelectRegion();
		}
	}
};

// Get information about theme
var themeInfo = { 
	loaded: false,
	dynamicClasses: {
		WindowSnapping: function( e )
		{
			var hh = Workspace && Workspace.screen ? ( Workspace.screen.getMaxViewHeight() + 'px' ) : '0';
			var winw = window.innerWidth + 'px';
			var ww = Math.floor( window.innerWidth * 0.5 ) + 'px';
			return `
html .View.SnapLeft
{
	left: 0 !important;
	top: 0;
	height: ${hh} !important;
	width: ${ww} !important;
}
html .View.SnapRight
{
	left: calc(${winw} - ${ww}) !important;
	top: 0;
	height: ${hh} !important;
	width: ${ww} !important;
}
`;
		}
	}
};

// Secure drop widget for apps
// TODO: Complete this one once the browser is ready for it. Not used now.
// This one is connected to the "securefiledrop" flag on windows
function addSecureDropWidget( windowobject, objects )
{
	var w = new Widget( {
		top: windowMouseY - 180,
		left: windowMouseX - 150,
		width: 300,
		height: 230,
		raised: true,
		rounded: true
	} );
	
	windowobject.toFront();
	
	var f = new File( 'System:templates/securefiledrop.html' );
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			for( var a = 0; a < objects.length; a++ )
			{
				var url = getImageUrl( objects[ a ].Path )
				var im = new Image();
				var o = objects[ a ];
				fetch( url )
				.then( res => res.blob() )
				.then( blob => {
					var fn = GetFilename( o.Path );
					var fil = new File( [ blob ], fn, blob );
					var ic = new FileIcon( o, { type: 'A', nativeDraggable: true } );
					url = url.split( '/read' ).join( '/read/' + fn );
					ic.file.id = 'directoryfile_draggable_' + a;
					ic.file.setAttribute( 'data-downloadurl', url );
					ic.file.href = url;
					ic.file.style.position = 'relative';
					ic.file.style.float = 'left';
					ic.file.style.display = 'block';
					ic.file.style.marginLeft = '10px';
					ic.file.setAttribute( 'download', url );
					ic.file.addEventListener( 'dragstart', e => {
						e.dataTransfer.dropEffect = 'copy';
						e.dataTransfer.effectAllowed = 'copy';
						var ext = 'bin';
						if( fn.indexOf( '.' ) >= 0 )
							ext = fn.split( '.' )[1].toUpperCase();
						var ctype = 'application/octet-stream';
						switch( ctype )
						{
							case 'jpg':
							case 'jpeg':
								ctype = 'image/jpeg';
								break;
							case 'png':
							case 'bmp':
							case 'gif':
								ctype = 'image/' + ext;
								break;
							default:
								break;
						}
						// TODO: Make items.add work
						//e.dataTransfer.items.add( [ fil ], ctype, { type: 'custom' } );
						e.dataTransfer.setData( 'DownloadURL', [ ctype + ':' + fn + ':' + url ] );
					} );
					ic.file.addEventListener( 'dragend', function( e )
					{
						w.close();
						//console.log( e );
					}, false );
					w.dom.querySelector( '.Iconlist' ).appendChild( ic.file );
				} );
			}
		} );
	}
	f.load();
	
	window.mouseDown = null;
}

//check if we run inside an app and do some magic
function checkForFriendApp()
{
// just disabled to do not loose compatybility
/*
	//if we dont have a sessionid we will need to wait a bit here...
	if( !Workspace.sessionId )
	{
		console.log('waiting for valid session...' + Workspace.sessionId );
		setTimeout(checkForFriendApp, 500);
		return;
	}

	if( typeof friendApp != 'undefined' && typeof friendApp.exit == 'function')
	{
		// if this is mobile app we must register it
		// if its already registered FC will not do it again
		var version = null;
		var platform = null;
		var appToken = null;
		var deviceID = null;
		//var appToken = friendApp.appToken ? friendApp.appToken : false;

		if( typeof friendApp.get_version == 'function' )
		{
			version = friendApp.get_version();
		}

		if( typeof friendApp.get_platform == 'function' )
		{
			platform = friendApp.get_platform();
		}

		if( typeof friendApp.get_app_token == 'function' )
		{
			appToken = friendApp.get_app_token();
		}
		if( typeof friendApp.get_deviceid == 'function' )
		{
			deviceID = friendApp.get_deviceid();
		}

		console.log('call ' + Workspace.sessionId );

		var l = new Library( 'system.library' );
		l.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{

			}
		}
		if( appToken != null )	// old applications which do not have appToken will skip this part
		{
			l.execute( 'mobile/createuma', { sessionid: Workspace.sessionId, apptoken: appToken, deviceid: deviceID, appversion: version, platform: platform } );
		}
	}
*/
}

// Refresh programmatic classes
function RefreshDynamicClasses( e )
{
	if( !themeInfo.dynamicClasses ) return;
	var str = '';
	for( var a in themeInfo.dynamicClasses )
	{
		str += themeInfo.dynamicClasses[ a ]( e );
	}
	themeInfo.dynCssEle.innerHTML = str;
}
function InitDynamicClassSystem()
{
	var dynCss = document.createElement( 'style' );
	document.body.appendChild( dynCss );
	themeInfo.dynCssEle = dynCss;
	var ls = [ 'resize', 'mousedown', 'mouseup', 'touchstart', 'touchend' ];
	for( var a = 0; a < ls.length; a++ )
		window.addEventListener( ls[a], RefreshDynamicClasses );
	RefreshDynamicClasses( {} );
}

function GetThemeInfo( property )
{
	if( !Workspace.loginUsername ) return false;
	if( !themeInfo.loaded )
	{
		themeInfo.loaded = true;
		// Flush old rules
		var sheet = false;
		for( var a = 0; a < document.styleSheets.length; a++ )
		{
			if( document.styleSheets[a].href && document.styleSheets[a].href.indexOf( 'theme' ) > 0 )
			{
				sheet = document.styleSheets[a];
				break;
			}
		}
		if( sheet )
		{
			for( var a = 0; a < sheet.cssRules.length; a++ )
			{
				var rule = sheet.cssRules[a];
				var key = false;
				var qualifier = false; // What qualifies this as the final rule
				// TODO: Add all important keys here!
				switch( rule.selectorText )
				{
					case '.ScreenContentMargins':
						key = 'ScreenContentMargins';
						break;
					case '.Screen > .TitleBar > .Left .Extra .Offline':
					case 'html .Screen > .TitleBar > .Left .Extra .Offline':
						key = 'OfflineIcon';
						qualifier = 'backgroundImage';
						break;
					case '.Screen > .TitleBar':
						key = 'ScreenTitle';
						break;
					case '.View > .LeftBar':
						key = 'ViewLeftBar';
						break;
					case '.View > .RightBar':
						key = 'ViewRightBar';
						break;
					case '.View > .Title':
						key = 'ViewTitle';
						break;
					case '.View > .BottomBar':
						key = 'ViewBottom';
						break;
					default: 
						//console.log( 'Unhandled css selector: ' + rule.selectorText );
						break;
				}
				// Test if the theme info property has already qualified, and skip it if so
				var qualifierTest = themeInfo[ key ] && ( 
					qualifier && 
					typeof( themeInfo[ key ][ qualifier ] ) != 'undefined' && 
					themeInfo[ key ][ qualifier ].length 
				);
				if( qualifierTest )
				{
					continue;
				}
				if( key ) themeInfo[ key ] = rule.style;
			}
		}
	}
	if( themeInfo[ property ] )
		return themeInfo[ property ];
	return false;
}

// Cover windows with overlay
function CoverWindows()
{
	for ( var a in movableWindows )
	{
		if( movableWindows[a].moveoverlay )
		{
			movableWindows[a].moveoverlay.style.height = '100%';
			movableWindows[a].moveoverlay.style.pointerEvents = '';
		}
	}
}
// Expose windows / remove overlay
function ExposeWindows()
{
	for ( var a in movableWindows )
	{
		if( movableWindows[a].content.groupMember ) continue;
		if( movableWindows[a].moveoverlay )
		{
			movableWindows[a].moveoverlay.style.height = '0%';
			movableWindows[a].moveoverlay.style.pointerEvents = 'none';
		}
		movableWindows[a].memorize();
	}
}
// Cover screens with overlay
function CoverScreens( sticky )
{
	// Disable all screen overlays
	var screenc = ge ( 'Screens' );
	var screens = screenc.getElementsByTagName( 'div' );
	for( var a = 0; a < screens.length; a++ )
	{
		if( !screens[a].className ) continue;
		if( screens[a].parentNode != screenc ) continue;
		screens[a]._screenoverlay.style.display = '';
		screens[a]._screenoverlay.style.pointerEvents = '';
	}
}

// Cover screens other than current one
function CoverOtherScreens()
{
	// Disable all screen overlays
	var screenc = ge ( 'Screens' );
	var screens = screenc.getElementsByTagName ( 'div' );
	for( var a = 0; a < screens.length; a++ )
	{
		if( !screens[a].className ) continue;
		if( screens[a].parentNode != screenc ) continue;
		if( currentScreen && screens[a] == currentScreen )
			continue;
		screens[a]._screenoverlay.style.display = '';
		screens[a]._screenoverlay.style.pointerEvents = 'none';
	}
}

// Expose screens / remove overlay
function ExposeScreens()
{
	// Disable all screen overlays
	var screenc = ge ( 'Screens' );
	var screens = screenc.getElementsByTagName ( 'div' );
	for( var a = 0; a < screens.length; a++ )
	{
		if( !screens[a].className ) continue;
		if( screens[a].parentNode != screenc ) continue;
		screens[a]._screenoverlay.style.display = 'none';
		screens[a].moveoverlay.style.pointerEvents = 'none';
		screens[a]._screenoverlay.style.display = 'none';
		screens[a].moveoverlay.style.pointerEvents = 'none';
	}
}

// Find a movable window by title string
function FindWindowById ( id )
{
	for ( var i in movableWindows )
	{
		if ( i == id )
		{
			if ( movableWindows[i].windowObject )
				return movableWindows[i].windowObject;
			return movableWindows[i];
		}
	}
	return false;
}

function GuiCreate ( obj )
{
	var str = '';
	for ( var a = 0; a < obj.length; a++ )
	{
		switch( typeof ( obj[a] ) )
		{
			case 'function':
				if ( typeof ( obj[a+1] ) != 'undefined' )
				{
					str += obj[a] ( obj[a+1] );
					a++;
				}
				break;
			case 'string':
				str += obj[a];
				break;
			case 'array':
				str += GuiCreate ( obj[a], _level+1 );
				break;
		}
	}
	return str;
}

function GuiColumns( data )
{
	var widths = data[0];
	var content = data[1];
	var str = '<table class="GuiColums"><tr>';
	for ( var a = 0; a < widths.length; a++ )
	{
		if ( widths[a].indexOf ( '%' ) < 0 && widths[a].indexOf ( 'px' ) < 0 )
			widths[a] += 'px';
		str += '<td style="width: ' + widths[a] + '">' + GuiCreate ( [ content[a] ] ) + '</td>';
	}
	str += '</tr></table>';
	return str;
}

function GuiContainer( obj )
{
	return '<div class="GuiContainer"><div class="GuiContent">' + GuiCreate ( obj ) + '</div></div>';
}

// Init popup box on an element on roll over -----------------------------------
var _epObject = {
	target : false,
	l : -1000,
	t : -1000,
	datas : new Array ()
};
function InitElementPopup( pdiv, actionurl, forceupdate, immediateDisplay )
{
	if ( !pdiv ) return;
	if ( !immediateDisplay ) immediateDisplay = false;
	pdiv.triggerElementPopup = true;
	
	if ( !pdiv.loadData )
	{
		pdiv.actionData = actionurl;
		pdiv.checkElementPopup = function ()
		{
			this.d = ge( 'ElementPopup' );
			if ( !this.d )
			{
				this.d = document.createElement ( 'div' );
				this.d.className = 'Popup';
				this.d.id = 'ElementPopup';
				this.d.style.top = '-10000px';
				this.d.style.left = '-10000px';
				this.d.style.visibility = 'hidden';
				document.body.appendChild( this.d );
				_epObject.target = this;
			}
			return this.d;
		}
		pdiv.loadData = function ( showAfterLoad )
		{
			if ( !this.actionData ) return;
			this.checkElementPopup();
			if ( !forceupdate && _epObject.datas[this.actionData] )
			{	
				this.activate ( this.actionData );
				this.show ();
			}
			else
			{
				var k = new cAjax ();
				k.open ( 'get', this.actionData, true );
				k.pdiv = pdiv;				this.show ();

				k.onload = function ( e )
				{
					var r = this.responseText ();
					if ( r.indexOf ( 'login.css' ) < 0 && r.length > 0 )
					{
						this.pdiv.setData ( r, this.pdiv.actionData );
						if ( showAfterLoad )
							this.pdiv.show ();
						this.pdiv.activate ( this.pdiv.actionData );
					}
				}
				k.send ();
			}
		}
		pdiv.setData = function ( data, action, e )
		{
			_epObject.datas[action] = data;
		}
		pdiv.activate = function ( action, e )
		{
			if ( !e ) e = window.event;
			if ( !_epObject.datas ) return;
			if ( !_epObject.datas[action] ) return;
			this.d.innerHTML = _epObject.datas[action];
			this.d.height = this.d.offsetHeight;
			RepositionPopup ( e );
		}
		pdiv.onmouseover = function ()
		{
			this.loadData ();
		}
		pdiv.show = function ( e )
		{
			var d = this.checkElementPopup();
			d.style.opacity = 1;
			d.style.filter = 'alpha(opacity=100)';
			d.style.visibility = 'visible';
			if ( !d.style.top || !d.style.left )
			{
				RepositionPopup ( e );
			}
		}
	}
	pdiv.loadData ( immediateDisplay ? true : false );
	
	DelEvent ( ElementPopupMover );
	AddEvent ( 'onmousemove', ElementPopupMover );
}

var __windowHeightMargin = 25;

function RepositionPopup( e, test )
{
	if ( !e ) e = window.event;
	if ( !e ) return;
	var l = 0; var t = 0;
	var target = document.body;
	var trg = _epObject.target; // wanted target
	var mx = windowMouseX;
	var my = windowMouseY;

	l = _epObject.l;
	t = _epObject.t;
	if ( e )
	{
		var ll = mx;
		if ( !isNaN ( ll ) )
		{
			l = ll;
			t = my;
			_epObject.l = l;
			_epObject.t = t;
			// FIXME: Study when we need this one (scroll offset!
			//t -= document.body.scrollTop;
			//l -= document.body.scrollLeft;
			target = e.target ? e.target : e.srcElement; // mouse target
		}
	}
	el = ge( 'ElementPopup' );
	if( !el ) return;

	// Get popup height
	var height = false;
	if ( !height ) height = el.height;
	if ( !height ) return;
	
	var wh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	var ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	wh -= __windowHeightMargin;
	
	var mdl = GetTitleBarG ();
	var minTop = mdl ? mdl.offsetHeight : 0;

	var w = el.offsetWidth + 20;
	var h = el.offsetHeight + 20;
	l -= el.offsetWidth >> 1;
	t -= height + 20;
	
	// Constrain to page
	if ( t + h > wh ) t -= ( t + h ) - wh;
	if ( l + w > ww ) l -= ( l + w ) - ww;
	if ( l < 0 ) l = 0;
	if ( t < minTop )
		t = my + 20;

	var st = document.body.scrollTop;
	
	if ( t < minTop && l == 0 )
	{
		t = -1000;
		l = -1000;
	}
	
	el.style.top = t + st + 'px';
	el.style.left = l + 'px';
	
}

// Move popup 
function ElementPopupMover ( e, init )
{
	if ( !e ) e = window.event;
	var el = false; var target; var trg;
	if ( e )
	{
		target = e.target ? e.target : e.srcElement; // mouse target
		trg = _epObject.target; // wanted target
	}
	if ( ( el = ge( 'ElementPopup' ) ) )
	{
		var isover = false; var test = target;
		if ( !init )
		{
			while ( test != trg.parentNode && test != document.body  )
			{
				if ( test == trg ) { isover = true; break; }
				if( !test ) return false;
				test = test.parentNode;
			}
		}
		if ( init || isover == true )
		{
			if ( el.tm )
			{
				clearTimeout ( el.tm );
				el.tm = false;
			}
			RepositionPopup( e );
		}
		// We're moving over another popup!
		else if ( target.triggerElementPopup )
		{
			RepositionPopup( e );
		}
		else
		{
			RemoveElementPopup( 1 ); // Totally remove
		}
	}
}

function RemoveElementPopup( close )
{
	var e = ge('ElementPopup' );
	if ( !e ) return;
	if ( e.tm ) clearTimeout ( e.tm );
	e.tm = false;
	if( close )
	{
		e.parentNode.removeChild ( e );
	}
	else
	{
		e.style.opacity = 0;
		e.style.filter = 'alpha(opacity=0)';
	}
}

/* Make select box table ---------------------------------------------------- */

function NewSelectBox ( divobj, height, multiple )
{
	if ( !divobj ) return false;
	
	var cont = document.createElement ( 'div' );
	cont.className = 'SelectBox';
	
	var table = document.createElement ( 'table' );
	table.className = 'SelectBox ' + ( multiple ? 'Checkboxes' : 'Radioboxes' );
	
	var opts = divobj.getElementsByTagName ( 'div' );
	var sw = 1;
	
	for ( var a = 0; a < opts.length; a++ )
	{
		var tr = document.createElement ( 'tr' );
		tr.className = 'sw' + sw + ( opts[a].className ? ( ' ' + opts[a].className ) : '' );
		if ( opts[a].title ) tr.title = opts[a].title;
		
		var spl = opts[a].innerHTML.split ( "\t" );
		var inpid = divobj.id + '_input_'+(a+1);
		for ( var b = 0; b < spl.length; b++ )
		{
			var td = document.createElement ( 'td' );
			td.innerHTML = '<label for="'+inpid+'">'+spl[b]+'</label>';
			tr.appendChild ( td );
		}
		
		var td = document.createElement ( 'td' );
		
		val = opts[a].getAttribute ( 'value' );
		
		if ( multiple )
		{
			td.innerHTML = '<input value="' + val + '" id="' + inpid + '" onclick="_NewSelectBoxCheck(\''+divobj.id+'\',this)" type="checkbox" name="' + divobj.id + '"/>';
		}
		else
		{
			td.innerHTML = '<input value="' + val + '" id="' + inpid + '" onclick="_NewSelectBoxRadio(\''+divobj.id+'\',this)" type="radio" name="' + divobj.id + '"/>';
		}
		
		tr.appendChild ( td );
		table.appendChild ( tr );
		tr.onselectstart = function () 
		{
			return false;
		}
		sw = sw == 1 ? 2 : 1;
	}
	cont.appendChild ( table );
	
	// Replace earlier container
	cont.id = divobj.id;
	divobj.parentNode.replaceChild ( cont, divobj );
	
	// Adjust height
	var rheight = 0;
	rheight = cont.getElementsByTagName ( 'td' )[0].offsetHeight;
	cont.style.minHeight = rheight * height + 'px';
	
}

function _NewSelectBoxCheck ( pid, ele )
{
	var pel
	if ( typeof ( pid ) == 'string' )
		pel = ge ( pid );
	else pel = pid;
	if ( !pel ) return false;
	var els = pel.getElementsByTagName ( 'tr' );
	for ( var a = 0; a < els.length; a++ )
	{
		var inp = els[a].getElementsByTagName ( 'input' )[0];
		if ( inp.checked )
			els[a].className = els[a].className.split ( ' checked' ).join ( '' ) + ' checked';
		else els[a].className = els[a].className.split ( ' checked' ).join ( '' );
	}
}

// Rules for forcing screen dimensions
function forceScreenMaxHeight()
{
	if( isMobile )
	{
		// Nothing yet
	}
}

// Gets values from a SelectBox - multiple select returns array, otherwise string
function GetSelectBoxValue( pel )
{
	if ( !pel ) return false;
	var inputs = pel.getElementsByTagName ( 'input' );
	var table = pel.getElementsByTagName ( 'table' )[0];
	if ( table.className.indexOf ( 'Checkboxes' ) > 0 )
	{
		var res = new Array ();
		for ( var a = 0; a < inputs.length; a++ )
		{
			if ( inputs[a].checked )
			{
				res.push ( inputs[a].getAttribute ( 'value' ) );
			}
		}
		return res;
	}
	else if ( table.className.indexOf ( 'Radioboxes' ) > 0 )
	{
		for ( var a = 0; a < inputs.length; a++ )
		{
			if ( inputs[a].checked )
			{
				return inputs[a].getAttribute ( 'value' );
			}
		}
	}
	return false;
}

function _NewSelectBoxRadio ( pid, ele )
{
	var pel
	if ( typeof ( pid ) == 'string' )
		pel = ge ( pid );
	else pel = pid;
	if ( !pel ) return false;
	var els = pel.getElementsByTagName ( 'tr' );
	for ( var a = 0; a < els.length; a++ )
	{
		var inp = els[a].getElementsByTagName ( 'input' )[0];
		if ( inp.checked )
		{
			els[a].className = els[a].className.split ( ' checked' ).join ( '' ) + ' checked';
		}
		else els[a].className = els[a].className.split ( ' checked' ).join ( '' );
	}
}

/* For movable windows ------------------------------------------------------ */

var dragDistance = 0;
var dragDistanceX = 0, dragDistanceY = 0;

// Moves windows on mouse move
movableListener = function( e, data )
{
	if( !e ) e = window.event;
	var ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var wh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	var x, y;
	if( ( typeof( e.touches ) != 'undefined' && typeof( e.touches[0] ) != 'undefined' ) && ( window.isTablet || window.isMobile || isTouchDevice() ) )
	{
		x = e.touches[0].pageX;
		y = e.touches[0].pageY;
	}
	else
	{
		x = e.clientX ? e.clientX : e.pageX;
		y = e.clientY ? e.clientY : e.pageY;
	}
	var sh = e.shiftKey || e.ctrlKey;
	
	// Injection
	if( data )
	{
		if( data.mouseX ) x = data.mouseX;
		if( data.mouseY ) y = data.mouseY;
	}
	
	windowMouseX = x;
	windowMouseY = y;
	
	// Keep alive!
	if( window.Workspace )
	{
		Workspace.updateViewState( 'active' );
	}
	
	mousePointer.poll();
	mousePointer.move( e );
	
	if( window.mouseDown && window.mouseMoveFunc ) 
	{
		window.mouseMoveFunc( e );
	}
	else if( window.currentMovable )
	{
		// Some defaults
		var minW = 160;
		var minH = 100;
		var maxW = 1000000;
		var maxH = 1000000;
		var st = document.body.scrollTop;
		if ( window.currentMovable.content && window.currentMovable.windowObject.flags )
		{
			if ( window.currentMovable.windowObject.flags['min-width'] >= 100 )
				minW = window.currentMovable.windowObject.flags['min-width'];
			if ( window.currentMovable.windowObject.flags['max-width'] >= 100 )
				maxW = window.currentMovable.windowObject.flags['max-width'];
			if ( window.currentMovable.windowObject.flags['min-height'] >= 100 )
				minH = window.currentMovable.windowObject.flags['min-height'];
			if ( window.currentMovable.windowObject.flags['max-height'] >= 100 )
				maxH = window.currentMovable.windowObject.flags['max-height'];
		}
		
		// Clicking on the window title
		var mx = x - ( window.currentMovable.offx ? window.currentMovable.offx : 0 );
		var my = y - ( window.currentMovable.offy ? window.currentMovable.offy : 0 );
		
		var lockY = false;
		var lockX = false;
		
		
		// 8 px grid + snapping
		if( e.shiftKey )
		{	
			// Mouse coords changed
			if( window.mouseDown )
			{	
				if( mousePointer.prevMouseX != x || mousePointer.prevMouseY != y )
				{
					// Window snapping! Attach to window
					if( currentMovable )
					{
						// Check current movable intersections
						var directionY = windowMouseY - mousePointer.prevMouseY;
						var directionX = windowMouseX - mousePointer.prevMouseX;
						if( directionX != 0 || directionY != 0 )
						{
							var direction = directionX < 0 ? 'left' : 'right';
							if( Math.abs( directionY ) > Math.abs( directionX ) )
							direction = directionY < 0 ? 'up' : 'down';
				
							if( currentMovable.shiftX !== false )
							{
								clx = currentMovable.shiftX;
								cly = currentMovable.shiftY;
								dragDistance = Math.sqrt( Math.pow( clx - x, 2 ) + Math.pow( cly - y, 2 ) );
								dragDistanceX = clx - x;
								dragDistanceY = cly - y;
							}
				
							var curWinRight  = currentMovable.offsetLeft + currentMovable.offsetWidth;
							var curWinLeft   = currentMovable.offsetLeft;
							var curWinTop    = currentMovable.offsetTop;
							var curWinBottom = currentMovable.offsetTop + currentMovable.offsetHeight;
							
							var snapInfo = {
								view: false,
								direction: false,
								z: 0
							};
							
							for( var z in movableWindows )
							{
								var mw = movableWindows[ z ];

								if( mw.snapObject ) continue; // Can't snap to snapped windows
								if( mw == currentMovable ) continue;
								if( mw.parentNode && mw.parentNode && mw.parentNode.getAttribute( 'minimized' ) == 'minimized' ) 
									continue;
						
								var mWR = mw.offsetLeft + mw.offsetWidth;
								var mWL = mw.offsetLeft;
								var mWT = mw.offsetTop;
								var mWB = mw.offsetTop + mw.offsetHeight;
								var doSnap = false;
						
								// Snap to the right
								if( direction == 'right' && ( !currentMovable.snap || currentMovable.snap == 'right' ) )
								{
									if( curWinRight > mWL && curWinRight <= mWL + 20 && ( ( curWinTop >= mWT && curWinTop <= mWB ) || ( curWinBottom >= mWT && curWinBottom <= mWB ) ) )
									{
										if( parseInt( mw.style.zIndex ) > snapInfo.z )
										{
											snapInfo.view = mw;
											snapInfo.direction = 'right';
											snapInfo.extra = mWL;
											snapInfo.z = parseInt( mw.style.zIndex );
										}
									}
								}
								// Snap to the left
								else if( direction == 'left' && ( !currentMovable.snap || currentMovable.snap == 'left' ) )
								{
									if( curWinLeft < mw.offsetWidth + mWL && curWinLeft >= mw.offsetWidth + mWL - 20 && ( ( curWinTop >= mWT && curWinTop <= mWB ) || ( curWinBottom >= mWT && curWinBottom <= mWB ) ) )
									{
										if( parseInt( mw.style.zIndex ) > snapInfo.z )
										{
											snapInfo.view = mw;
											snapInfo.direction = 'left';
											snapInfo.extra = mWR;
											snapInfo.z = parseInt( mw.style.zIndex );
										}
									}
								}
								else if( direction == 'up' && ( !currentMovable.snap || currentMovable.snap == 'up' ) )
								{
									if( curWinTop >= mWB - 20 && curWinTop < mWB && ( ( curWinLeft >= mWL && curWinLeft <= mWR ) || ( curWinRight >= mWL && curWinRight <= mWR ) ) )
									{
										if( parseInt( mw.style.zIndex ) > snapInfo.z )
										{
											snapInfo.view = mw;
											snapInfo.direction = 'up';
											snapInfo.extra = mWB;
											snapInfo.z = parseInt( mw.style.zIndex );
										}
									}
								}
								else if( direction == 'down' &&  ( !currentMovable.snap || currentMovable.snap == 'down' ) )
								{
									if( curWinBottom >= mWT && curWinBottom <= mWT + 20 && ( ( curWinLeft >= mWL && curWinLeft <= mWR ) || ( curWinRight >= mWL && curWinRight <= mWR ) ) )
									{
										if( parseInt( mw.style.zIndex ) > snapInfo.z )
										{
											snapInfo.view = mw;
											snapInfo.direction = 'down';
											snapInfo.extra = mWT;
											snapInfo.z = parseInt( mw.style.zIndex );
										}
									}
								}
							}
							
							if( snapInfo.view )
							{
								if( currentMovable.shiftX === false )
								{
									currentMovable.shiftX = x;
									currentMovable.shiftY = y;
								}
								
								var mw = snapInfo.view;
								
								if( snapInfo.direction == 'right' )
								{
									if( snapInfo.extra - currentMovable.offsetWidth < 0 )
									{
										currentMovable.style.width = mWL + 'px';
									}
									currentMovable.style.left = snapInfo.extra - currentMovable.offsetWidth + 'px';
									currentMovable.snap = 'right';
									currentMovable.snapObject = snapInfo.view;
							
									doSnap = true;
									lockX = true;
								}
								else if( snapInfo.direction == 'left' )
								{
									if( snapInfo.extra + currentMovable.offsetWidth > Workspace.screen.getMaxViewWidth() )
									{
										currentMovable.style.width = Workspace.screen.getMaxViewWidth() - snapInfo.extra + 'px';
									}
									currentMovable.style.left = snapInfo.extra + 'px';
									currentMovable.snap = 'left';
									currentMovable.snapObject = snapInfo.view;
							
									doSnap = true;
									lockX = true;
								}
								else if( snapInfo.direction == 'up' )
								{
									if( snapInfo.extra + currentMovable.offsetHeight > Workspace.screen.getMaxViewHeight() )
									{
										currentMovable.style.height = Workspace.screen.getMaxViewHeight() + 'px';
									}
									currentMovable.style.top = snapInfo.extra + 'px';
									currentMovable.snap = 'up';
									currentMovable.snapObject = snapInfo.view;
							
									doSnap = true;
									lockY = true;
								}
								else if( snapInfo.direction == 'down' )
								{
									if( snapInfo.extra - currentMovable.offsetHeight < 0 )
									{
										currentMovable.style.height = snapInfo.extra + 'px';
									}
									currentMovable.style.top = snapInfo.extra - currentMovable.offsetHeight + 'px';
									currentMovable.snap = 'down';
									currentMovable.snapObject = mw;
							
									doSnap = true;
									lockY = true;
								}
								
								// Do we snap?
								if( doSnap )
								{
									var cx = mw.offsetLeft - currentMovable.offsetLeft;
									var cy = mw.offsetTop - currentMovable.offsetTop;
									currentMovable.snapCoords = { 
										x: cx,
										y: cy,
										mx: windowMouseX - cx,
										my: windowMouseY - cy
									};
									
									if( !mw.attached )
									{
										mw.attached = [ currentMovable ];
									}
									else
									{
										var found = false;
										for( var a in mw.attached )
										{
											if( mw.attached[ a ] == currentMovable )
											{
												found = true;
												break;
											}
										}
										if( !found )
											mw.attached.push( currentMovable );
									}
									mw.setAttribute( 'attach_' + direction, 'attached' );
									
									// Unsnap
									currentMovable.unsnap = function()
									{
										// Unsnap
										this.snap = null;
										this.snapDistanceX = 0;
										this.snapDistanceY = 0;
										this.snapCoords = null;
										this.removeAttribute( 'viewsnap' );
			
										// Clean up snap object attached list and detach
										if( this.snapObject && this.snapObject.attached )
										{
											var o = [];
											var left = right = up = down = false
											for( var a = 0; a < this.snapObject.attached.length; a++ )
											{
												var att = this.snapObject.attached[ a ];
												if( att != this )
												{
						
													o.push( att );
													if( att.snap == 'right' )
														right = true;
													else if( att.snap == 'left' )
														left = true;
													else if( att.snap == 'up' )
														up = true;
													else if( att.snap == 'down' )
														down = true;
												}
											}
											this.snapObject.attached = o;
											if( !up )
												this.snapObject.removeAttribute( 'attach_up' );
											if( !down )
												this.snapObject.removeAttribute( 'attach_down' );
											if( !left )
												this.snapObject.removeAttribute( 'attach_left' );
											if( !right )
												this.snapObject.removeAttribute( 'attach_right' );
											this.snapObject = null;
										}
										this.unsnap = null;
										
										PollTaskbar();
									}
									
									PollTaskbar();
								}
							}
						}
					}
				}
				// We are in snapped mode
				if( currentMovable.snap )
				{
					currentMovable.setAttribute( 'viewsnap', currentMovable.snap );
					
					if( currentMovable.snapObject )
					{
						var mw = currentMovable.snapObject;
						currentMovable.snapCoords.x = mw.offsetLeft - currentMovable.offsetLeft;
						currentMovable.snapCoords.y = mw.offsetTop - currentMovable.offsetTop;
					
						var dir = currentMovable.snap;
					
						if( dir == 'right' || dir == 'left' )
						{
							lockX = true;
						
							if( ( dir == 'left' /*&& dragDistanceX > 150*/ ) || ( dir == 'right' /*&& dragDistanceX < -150*/ ) )
							{
								currentMovable.style.top = currentMovable.snapObject.style.top;
								currentMovable.style.height = currentMovable.snapObject.style.height;
								lockY = true;
								currentMovable.setAttribute( 'hardsnap', 'hardsnap' );
							}
							else
							{
								currentMovable.removeAttribute( 'hardsnap' );
							}
						}
						else
						{
							lockY = true;
						
							if( ( dir == 'up' /*&& dragDistanceY > 150 */) || ( dir == 'down' /*&& dragDistanceY < -150 */) )
							{
								currentMovable.style.left = currentMovable.snapObject.style.left;
								currentMovable.style.width = currentMovable.snapObject.style.width;
								lockX = true;
								currentMovable.setAttribute( 'hardsnap', 'hardsnap' );
							}
							else
							{
								currentMovable.removeAttribute( 'hardsnap' );
							}
						}
					}
				}
			}
		}
		else
		{
			if( window.currentMovable )
			{
				currentMovable.shiftX = false;
				currentMovable.shiftY = false;
			}
		}
		
		mousePointer.prevMouseX = windowMouseX;
		mousePointer.prevMouseY = windowMouseY;
		
		// Tell other processes that we're snapping or not
		if( lockY || lockX )
		{
			currentMovable.snapping = true;
		}
		else
		{
			currentMovable.snapping = false;
		}
		
		// Moving a window..
		if( !isMobile && window.mouseDown == 1 )
		{
			if( ( !lockX && !lockY ) && currentMovable.snap && currentMovable.unsnap && currentMovable.shiftKey )
				currentMovable.unsnap();
			
			var w = window.currentMovable;

			// Make sure the inner overlay is over screens
			if( window.currentScreen )
			{
				window.currentScreen.moveoverlay.style.display = '';
				window.currentScreen.moveoverlay.style.height = '100%';
			}
				
			// Move the window!
			if( w && w.style )
			{
				// Move sticky widgets!
				if( w.windowObject && w.windowObject.widgets )
				{
					var wds = w.windowObject.widgets;
					for( var z = 0; z < wds.length; z++ )
					{
						var vx = mx + ( isNaN( wds[z].tx ) ? 0 : wds[z].tx );
						var vy = my + ( isNaN( wds[z].ty ) ? 0 : wds[z].ty );
						if( vx < 0 ) vx = 0;
						else if( vx + wds[z].dom.offsetWidth >= wds[z].dom.parentNode.offsetWidth )
							vx = wds[z].dom.parentNode.offsetWidth - wds[z].dom.offsetWidth;
						if( vy < 0 ) vy = 0;
						else if( vy + wds[z].dom.offsetHeight >= wds[z].dom.parentNode.offsetHeight )
							vy = wds[z].dom.parentNode.offsetHeight - wds[z].dom.offsetHeight;
						wds[z].dom.style.right = 'auto';
						wds[z].dom.style.bottom = 'auto';
						if( !lockX )
							wds[z].dom.style.left = vx + 'px';
						if( !lockY )
							wds[z].dom.style.top = vy + 'px';
					}
				}
				
				if( !w.getAttribute( 'moving' ) )
					w.setAttribute( 'moving', 'moving' );
								
				// Move the window
				ConstrainWindow( w, 
					lockX ? currentMovable.offsetLeft : mx, 
					lockY ? currentMovable.offsetTop : my 
				);

				// Do the snap!
				if( !isMobile )
				{
					var tsX = w.offsetLeft;
					var tsY = w.offsetTop;
					if( windowMouseY > 0 )
					{
						var snapOut = false;
						var hw = window.innerWidth * 0.1;
						var rhw = window.innerWidth - hw;
						if( windowMouseX > hw && windowMouseX < rhw )
						{
							snapOut = true;
						}
						else
						{
							if( tsX == 0 )
							{
								w.classList.remove( 'SnapRight' );
								if( !w.classList.contains( 'SnapLeft' ) )
								{
									w.classList.add( 'SnapLeft' );
									RefreshDynamicClasses();
									if( w.content && w.content.refresh )
										w.content.refresh();
								}
							}
							else if( tsX + w.offsetWidth == window.innerWidth )
							{
								w.classList.remove( 'SnapLeft' );
								if( !w.classList.contains( 'SnapRight' ) )
								{
									w.classList.add( 'SnapRight' );
									RefreshDynamicClasses();
									if( w.content && w.content.refresh )
										w.content.refresh();
								}
							}
							else
							{
								snapOut = true;
							}
						}
						if( snapOut )
						{
							var cn = w.classList.contains( 'SnapLeft' ) || w.classList.contains( 'SnapRight' );
							if( cn )
							{
								w.classList.remove( 'SnapLeft' );
								w.classList.remove( 'SnapRight' );
								RefreshDynamicClasses();
								if( w.content && w.content.refresh )
									w.content.refresh();
							}
						}
					}
				}
			}
			
			// Do resize events
			CoverWindows(); CoverScreens();
			if( w.content && w.content.events )
			{
				if( typeof( w.content.events['move'] ) != 'undefined' )
				{
					for( var a = 0; a < w.content.events[ 'move' ].length; a++ )
					{
						w.content.events[ 'move' ][ a ]();
					}
				}
			}
			return cancelBubble ( e );
		}
		// Mouse down on a resize gadget
		else if( window.mouseDown == 2 )
		{ 
			
			var w = window.currentMovable;
			var r = w.resize;
			var t = w.titleBar;
			var l = w.leftbar;
			var x = w.rightbar;
			
			// Set normal mode
			r.mode = 'normal';
			r.window.removeAttribute( 'maximized' );
			_removeWindowTiles( w );
			// Done normal mode
			
			var rx = ( windowMouseX - r.offx ); // resizex
			var ry = ( windowMouseY - r.offy ); // resizey
			
			// 8 px grid
			if( e.shiftKey )
			{
				rx = Math.floor( rx / 8 ) << 3;
				ry = Math.floor( ry / 8 ) << 3;
			}
			
			if( !w.getAttribute( 'moving' ) )
				w.setAttribute( 'moving', 'moving' );
			
			var resizeX = r.wwid - w.marginHoriz + rx;
			var resizeY = r.whei - w.marginVert + ry;
			
			if( w.snap )
			{
				if( w.snap == 'up' || w.snap == 'down' )
				{
					resizeX = w.offsetWidth;
				}
				if( w.snap == 'left' || w.snap == 'right' )
				{
					resizeY = w.offsetHeight;
				}
			}
			
			ResizeWindow( w, resizeX, resizeY );
			
			// Do resize events (and make sure we have the overlay to speed things up)
			CoverWindows();
			if( w.content.events )
			{
				if( typeof(w.content.events['resize']) != 'undefined' )
				{
					for( var a = 0; a < w.content.events['resize'].length; a++ )
					{
						w.content.events['resize'][a]();
					}
				}
			}
			return cancelBubble( e );
		}
	}
	// Mouse down on desktop (regions)
	if( !window.isMobile && window.mouseDown == 4 && window.regionWindow )
	{
		// Prime
		if( window.regionWindow.directoryview )
		{
			var scrl = window.regionWindow.directoryview.scroller;
			if( !scrl.scrolling )
			{
				scrl.scrollTopStart  = scrl.scrollTop;
				scrl.scrollLeftStart = scrl.scrollLeft;
				scrl.scrolling       = true;
			}
			// Draw
			if( DrawRegionSelector( e ) )
			{		
				return cancelBubble( e );
			}
		}
		return false;
	}
}

// Draw the region selector with a possible offset!
function DrawRegionSelector( e )
{
	var sh = e.shiftKey || e.ctrlKey;
	
	// Create region selector if it doesn't exist!
	if( !ge( 'RegionSelector' ) )
	{
		var d = document.createElement( 'div' );
		d.id = 'RegionSelector';
		window.regionWindow.appendChild( d );
	}
	
	// Extra offset in content window
	var mx = windowMouseX; var my = windowMouseY;
	var diffx = 0;		   var diffy = 0; 
	var ex = 0; var ey = 0;
	var eh = 0; var ew = 0;
	var rwc = window.regionWindow.classList;
	var scrwn = window.regionWindow.directoryview ? window.regionWindow.directoryview.scroller : false;
	
	// In icon windows or new screens
	
	if ( rwc && ( rwc.contains( 'Content' ) || rwc.contains( 'ScreenContent' ) ) )
	{	
		// Window offset
		ex = -window.regionWindow.parentNode.offsetLeft;
		ey = -window.regionWindow.parentNode.offsetTop;
		
		// Some implications per theme accounted for
		if( rwc.contains( 'Content' ) )
		{
			var top = window.regionWindow.windowObject;
			if( top ) ey -= window.regionWindow.windowObject._window.parentNode.titleBar.offsetHeight;
			var bor = GetThemeInfo( 'ScreenContentMargins' );
			if( bor ) ey += parseInt( bor.top );
		}
		
		// Scrolling down / left? Add to mouse scroll
		eh += window.regionWindow.scrollTop;
		ew += window.regionWindow.scrollLeft;
		
		if( rwc.contains( 'Content' ) )
		{
			_ActivateWindow( window.regionWindow.parentNode, false, e );
		}
		else
		{
			_DeactivateWindows();
		}
			
		// Do we have a scroll area?
		if( scrwn )
		{
			diffy = scrwn.scrollTopStart - scrwn.scrollTop;
			diffx = scrwn.scrollLeftStart - scrwn.scrollLeft;
		
			// If mouse pointer is far down, do some scrolling
			var ty = my - window.regionWindow.parentNode.offsetTop;
			var tx = mx - window.regionWindow.parentNode.offsetLeft;
			
			if( ty < 40 )
				scrwn.scrollTop -= 10;
			else if ( ty - 30 > scrwn.offsetHeight - 30 )
				scrwn.scrollTop += 10;
		}
	}
	
	var d = ge( 'RegionSelector' );
	if( !d ) return;
	
	// Coordinate variables
	var wx = mx,				   wy = my;
	var dw = wx - window.regionX + ew - diffx; 
	var dh = wy - window.regionY + eh - diffy;
	var ox = diffx,				oy = diffy;
	
	// If we're selecting leftwards
	if ( dw < 0 )
	{
		ox = dw + diffx;
		dw = -dw;
	}
	// If we're selecting rightwards
	if ( dh < 0 )
	{
		oy = dh + diffy;
		dh = -dh;
	}
	if ( !dw || !dh ) return;
	
	// Set variables, all things considered!
	var dx = window.regionX + ox + ex;
	var dy = window.regionY + oy + ey;
	var odx = dx, ody = dy;
	
	// Some offset in windows or screens
	dy -= window.regionWindow.offsetTop;
	dx -= window.regionWindow.offsetLeft;
	
	// Check screen offset top
	if( window.regionWindow.windowObject )
	{
		if( window.regionWindow.windowObject.flags.screen )
		{
			var s = window.regionWindow.windowObject.flags.screen;
			if( s.div.screenOffsetTop )
			{
				dy -= s.div.screenOffsetTop;
			}
		}
	}
	
	// Set dimensions!
	d.style.width = dw + 'px';
	d.style.height = dh + 'px';
	d.style.top = dy + 'px';
	d.style.left = dx + 'px';
	
	// check icons
	if ( window.regionWindow )
	{
		var imx = dx;
		var imy = dy;
		
		// Scrolled window..
		var scroller = regionWindow.directoryview.scroller;
		if ( scroller && scroller.style )
		{
			var scr = parseInt ( scroller.scrollTop );
			if ( isNaN ( scr )) scr = 0;
			imy += scr;
		}
		
		var icos = regionWindow.icons;
		if ( icos )
		{
			var exOffx = 0;
			var exOffy = 0;
			
			if( regionWindow.windowObject )
			{
				if( regionWindow.fileBrowser )
				{
					if( !regionWindow.fileBrowser.dom.classList.contains( 'Hidden' ) )
					{
						imx -= regionWindow.fileBrowser.dom.offsetWidth;
					}
				}
			}
			
			for ( var a = 0; a < icos.length; a++ )
			{
				var ics = icos[a].domNode;
				// Coords on icon
				if( ics )
				{
					var ix1 = ics.offsetLeft + exOffx;
					var iy1 = ics.offsetTop + exOffy;
					var ix2 = ics.offsetWidth+ix1 + exOffx;
					var iy2 = ics.offsetHeight+iy1 + exOffy;
			
					// check overlapping icon
					var overlapping = ix1 >= imx && iy1 >= imy && ix2 <= imx+dw && iy2 <= imy+dh;
					// check intersecting icon on a horizontal line
					var intersecting1 = ix1 >= imx && ix2 <= imx+dw && ( ( imy >= iy1 && imy <= iy2 ) || ( imy+dh >= iy2 && imy <= iy2 ) );
					// check intersecting icon on a vertical line
					var intersecting2 = iy1 >= imy && iy2 <= imy+dh && ( ( imx >= ix1 && imx <= ix2 ) || ( imx+dw >= ix2 && imx <= ix2 ) );
					// check top left corner
					var intersecting3 = ix1 < imx && iy1 < imy && ix2 >= imx && iy2 >= imy;
					// check top right corner
					var intersecting4 = ix1 < imx+dw && iy1 < imy+dh && ix2 > imx && iy2 >= imy+dh;
					// check bottom left corner
					var intersecting5 = ix1 >= imx && ix2 >= imx+dw && iy2 <= imy+dh && ix1 <= imx+dw && iy2 >= imy;
					// check bottom right corner
					var intersecting6 = ix1 >= imx && iy1 >= imy && ix2 >= imx+dw && iy2 >= imy+dh && ix1 < imx+dw && iy1 < imy+dh;
					// Combine all
					var intersecting = intersecting1 || intersecting2 || intersecting3 || intersecting4 || intersecting5 || intersecting6;
				
					if( overlapping || intersecting )
					{
						ics.classList.add( 'Selected' );
						ics.fileInfo.selected = 'multiple';
						ics.selected = 'multiple';
						icos[a].selected = 'multiple';
					}
					else if( !sh )
					{
						ics.classList.remove( 'Selected' );
						ics.fileInfo.selected = false;
						ics.selected = false;
						icos[a].selected = false;
					}
				}
			}
		}
	}
}


// Gui modification / editing
function AbsolutePosition( div, left, top, width, height )
{
	div.style.position = 'absolute';
	if ( left )
		div.style.left = left;
	if ( top ) 
		div.style.top = top;
	if ( width )
		div.style.width = width;
	if ( height )
		div.style.height = height;
}

// Make a table list with checkered bgs
function MakeTableList( entries, headers )
{
	var str = '<table class="List" style="width: 100%">';
	var cols = 0;
	if ( headers )
	{
		str += '<tr>';
		for ( var a = 0; a < headers.length; a++ )
		{
			str += '<td>' + headers[a] + '</td>';
		}
		str += '</tr>';
		cols = headers.length;
	}
	if ( cols <= 0 )
		cols = entries[0].length;
	var sw = 1;
	for ( var a = 0; a < entries.length; a++ )
	{
		str += '<tr class="sw' + sw + '">';
		for ( var b = 0; b < cols; b++ )
		{
			str += '<td>' + entries[a][b] + '</td>';
		}
		sw = sw == 1 ? 2 : 1;
		str += '</tr>';
	}
	return str;
}

var workbenchMenus = new Array ();
function SetMenuEntries ( menu, entries )
{
	if ( typeof ( workbenchMenus[menu] ) == 'undefined' ) 
		workbenchMenus[menu] = new Array ();
	workbenchMenus[menu].push ( entries );
	if ( typeof ( RefreshWorkspaceMenu ) != 'undefined' )
		RefreshWorkspaceMenu ();
}

// Deep remove events
function cancelMouseEvents( e )
{
	window.mouseMoveFunc = false;
	window.mouseDown = false;
	window.fileMenuElement = null;
	window.mouseReleaseFunc = false;
	window.mouseDown = 0;
	return cancelBubble( e );
}

// Just register we left the building
movableMouseUp = function( e )
{
	if( !e ) e = window.event;
	
	var target = e.target ? e.target : e.srcElement;
	
	// For mobile
	if( isMobile )
	{
		if( 
			!( target.classList && target.classList.contains( 'View' ) ) &&
			!( target.classList && target.classList.contains( 'ViewIcon' ) )
		)
		{
			_removeMobileCloseButtons();
		}
	}

	window.fileMenuElement = null;
	window.mouseDown = false;
	if( window.currentMovable ) currentMovable.snapping = false;
	window.mouseMoveFunc = false;
	mousePointer.candidate = null;
	document.body.style.cursor = '';
	
	// Execute the release function
	if( window.mouseReleaseFunc )
	{
		window.mouseReleaseFunc();
		window.mouseReleaseFunc = false;
	}
	
	// If we have a current movable window, stop "moving"
	if( window.currentMovable )
	{
		window.currentMovable.removeAttribute( 'moving' );
		// Remove where we shiftclicked
		window.currentMovable.shiftX = false;
		window.currentMovable.shiftY = false; 
	}
	
	if( WorkspaceMenu.open || 
		( 
			target && target.classList && ( 
				target.classList.contains( 'ScreenContent' ) ||
				target.classList.contains( 'Scroller' ) ||
				target.classList.contains( 'Content' ) ||
				target.classList.contains( 'MoveOverlay' ) ||
				target.classList.contains( 'ScreenOverlay' )
			) 
		) 
	)
	{
		if( !isMobile )
		{
			WorkspaceMenu.close();
		}
	
		// Hide start menu
		if( Workspace.toggleStartMenu )
			Workspace.toggleStartMenu( false );
	}
	
	for( var a in movableWindows )
	{
		var m = movableWindows[a];
		m.removeAttribute( 'moving' );
	}
	
	ExposeScreens(); 
	ExposeWindows();
	
	// Workbench menu is now hidden (only miga style)
	if( Workspace && Workspace.menuMode == 'miga' )
	{
		WorkspaceMenu.hide( e );
		WorkspaceMenu.close();
	}
	
	// If we selected icons, clear the select region
	
	ClearSelectRegion();
	
	// Execute drop function on mousepointer (and stop moving!)
	mousePointer.drop( e );	
	mousePointer.stopMove( e );
	RemoveDragTargets();
	
	if( e.button == 0 )
	{
		if( Workspace.iconContextMenu )
		{
			Workspace.iconContextMenu.dom.querySelector( '.MenuItems' ).classList.add( 'Closing' );
			Workspace.iconContextMenu.dom.querySelector( '.MenuItems' ).classList.remove( 'Open' );
			setTimeout( function()
			{
				Workspace.iconContextMenu.hide();
			}, 150 );
		}
	}
	
	if( window.regionWindow && window.regionWindow.directoryview )
	{
		var scrl = window.regionWindow.directoryview.scroller;
		if( scrl )
		{
			scrl.scrolling = false;
		}
	}
}

// Remove all droptarget states
function RemoveDragTargets()
{
	var s = ge( 'DoorsScreen' );
	if( s )
	{
		// Make sure this is triggered to roll out of drop target
		if( s.classList.contains( 'DragTarget' ) )
			s.classList.remove( 'DragTarget' );
	}
}

var _screenTitleTimeout = null;

// Check the screen title of active window/screen and check menu
var prevScreen = prevWindow = false;
function CheckScreenTitle( screen, force )
{	
	var testObject = screen ? screen : window.currentScreen;
	if( !testObject && !force ) return;
	
	// Orphan node!
	if( window.currentMovable && !( window.currentMovable.parentNode && window.currentMovable.parentNode.parentNode ) )
		window.currentMovable = null;
	
	// If nothing changed, don't change
	if( prevScreen && prevWindow && !force )
	{
		if( prevScreen == testObject )
		{
			if( prevWindow == window.currentMovable )
				return;
		}
	}
	
	// Remember current state
	prevWindow = window.currentMovable;
	prevScreen = testObject;
		
	Friend.GUI.reorganizeResponsiveMinimized();
	
	// Set screen title
	var csc = testObject.screenObject;
	if( !csc ) return;
	
	// Set the screen title if we have a window with application name
	var wo = window.currentMovable ? window.currentMovable.windowObject : false;
	// Fix screen
	if( wo && !wo.screen && wo.flags.screen ) wo.screen = wo.flags.screen;
	// Check screen
	if( wo && wo.screen && wo.screen != csc )
	{
		wo = false; // Only movables on current screen
	}
	// Check dom node
	if( wo && wo.parentNode && !wo.parentNode.parentNode )
		wo = false;
	
	var hasScreen = ( !csc || ( wo && testObject.screenObject == wo.screen ) || ( wo && !wo.screen && isDoorsScreen ) );
	
	var isDoorsScreen = testObject.id == 'DoorsScreen';	
	
	// Clear the delayed action
	if( _screenTitleTimeout )
	{
		clearTimeout( _screenTitleTimeout );
		csc.contentDiv.parentNode.classList.remove( 'ChangingScreenTitle' );
		_screenTitleTimeout = null;
	}
	
	// Get app title
	if( wo && wo.applicationName && hasScreen )
	{
		var wnd = wo.applicationDisplayName ? wo.applicationDisplayName : wo.applicationName;
		if( !csc.originalTitle )
		{
			csc.originalTitle = csc.getFlag( 'title' );
		}
		
		// Don't do it twice
		if( wnd != csc.getFlag( 'title' ) )
		{
			csc.contentDiv.parentNode.classList.add( 'ChangingScreenTitle' );
			_screenTitleTimeout = setTimeout( function()
			{
				setTitleAndMoveMenu( csc, wnd );
				_screenTitleTimeout = setTimeout( function()
				{
					csc.contentDiv.parentNode.classList.remove( 'ChangingScreenTitle' );
				}, 70 );
			}, 70 );
		}
		else
		{
			setTitleAndMoveMenu( csc, wnd );
		}
	}
	// Just use the screen (don't do it twice)
	else if( csc.originalTitle && csc.getFlag( 'title' ) != csc.originalTitle )
	{
		csc.contentDiv.parentNode.classList.add( 'ChangingScreenTitle' );
		var titl = csc.originalTitle;
		_screenTitleTimeout = setTimeout( function()
		{
			setTitleAndMoveMenu( csc, titl );
			_screenTitleTimeout = setTimeout( function()
			{
				csc.contentDiv.parentNode.classList.remove( 'ChangingScreenTitle' );
			}, 70 );
		}, 70 );	
	}
	else
	{
		setTitleAndMoveMenu();
	}

	// Delayed
	function setTitleAndMoveMenu( obj, tit )
	{
		if( obj && tit )
		{
			obj.setFlag( 'title', tit );
			if( tit.indexOf( 'Friend Workspace' ) < 0 )
				tit += ' - Friend Workspace';
			document.title = tit;
		}
		
		// Enable the global menu
		if( Workspace && Workspace.menuMode == 'pear' )
		{
			if( window.WorkspaceMenu && ( !WorkspaceMenu.generated || WorkspaceMenu.currentView != currentMovable || WorkspaceMenu.currentScreen != currentScreen ) )
			{
				WorkspaceMenu.show();
				WorkspaceMenu.currentView = currentMovable;
				WorkspaceMenu.currentScreen = currentScreen;
			}
			// Nudge workspace menu to right side of screen title 
			if( !isMobile && ge( 'WorkspaceMenu' ) )
			{
				var t = currentScreen.screen._titleBar.querySelector( '.Info' );
				if( t ) 
				{
					ge( 'WorkspaceMenu' ).style.left = t.offsetWidth + t.offsetLeft + 10 + 'px';
				}
			}
		}
	}
	
}

// Indicator that we have a maximized view
function CheckMaximizedView()
{
	if( isMobile )
	{
		if( window.currentMovable && currentMovable.classList.contains( 'Active' ) )
		{
			document.body.classList.add( 'ViewMaximized' );
		}
		else
		{
			document.body.classList.remove( 'ViewMaximized' );
		}
	}
	else
	{
		if( window.currentMovable )
		{
			if( currentMovable.getAttribute( 'maximized' ) == 'true' )
			{
				document.body.classList.add( 'ViewMaximized' );
			}
			else if( currentMovable.snapObject && currentMovable.snapObject.getAttribute( 'maximized' ) == 'true' )
			{
				document.body.classList.add( 'ViewMaximized' );
			}
			else
			{
				document.body.classList.remove( 'ViewMaximized' );
			}
		}
		else
		{
			document.body.classList.remove( 'ViewMaximized' );
		}
	}
}

// Get the taskbar element
function GetTaskbarElement()
{
	if( ge( 'DockWindowList' ) ) return ge( 'DockWindowList' );
	return ge( 'Taskbar' );
}

// Let's make gui for movable windows minimize maximize
pollingTaskbar = false;
function PollTaskbar( curr )
{
	if( pollingTaskbar ) return;
	
	if( !document.body || !document.body.classList.contains( 'Inside' ) ) return;
	if( ge( 'FriendScreenOverlay' ) && ge( 'FriendScreenOverlay' ).classList.contains( 'Visible' ) )
		return;
		
	if( globalConfig.viewList == 'docked' || globalConfig.viewList == 'dockedlist' )
	{
		PollDockedTaskbar(); // <- we are using the dock
		if( globalConfig.viewList == 'docked' )
			return;
	}

	// Abort if we have a premature element
	if( curr && !curr.parentNode )
		return;
	
	var doorsScreen = ge( 'DoorsScreen' );
	if( !doorsScreen ) return;
	pollingTaskbar = true;
	
	var baseElement = ge( 'Taskbar' );
	
	// Placing the apps inside the dock and not using a normal taskbar
	if( !isMobile )
	{
		if( globalConfig.viewList == 'dockedlist' )
		{
			if( !ge( 'DockWindowList' ) )
			{
				// Find first desklet
				var dlets = document.getElementsByClassName( 'Desklet' );
				if( dlets.length || dlets[ 0 ] )
				{
					ge( 'Statusbar' ).className = 'Docklist';
				
					var dlet = dlets[ 0 ];
					var d = document.createElement( 'div' );
					d.id = 'DockWindowList';
					d.className = 'WindowList';
					dlet.appendChild( d );
				
					dlet.classList.add( 'HasWindowlist' );
					if( dlet.classList.contains( 'Vertical' ) )
					{
						d.style.bottom = '0px';
					}
					else
					{
						d.style.right = '0px';
					}
				
					baseElement = d;
				
					// Add size here
					var dock = d.parentNode.desklet;
					if( dock.conf )
						d.classList.add( 'Size' + dock.conf.size );
				}
				// Nothing to track
				else
				{
					pollingTaskbar = false;
					return;
				}
			}
			else
			{	
				baseElement = ge( 'DockWindowList' );
			}
		
			if( !baseElement )
			{
				pollingTaskbar = false;
				return;
			}
		
			// Make into a HasWindowlist element
			var dock = baseElement.parentNode.desklet;
			baseElement.parentNode.classList.add( 'HasWindowlist' );
		
			var dlength = Workspace.mainDock.iconListPixelLength;
		
			if( baseElement.parentNode.classList.contains( 'Vertical' ) )
			{
				baseElement.style.height = 'calc(100% - ' + dlength + 'px)';
				baseElement.style.width = '100%';
			}
			else
			{
				var right = '0';
				baseElement.style.width = 'calc(100% - ' + dlength + 'px)';
				baseElement.style.right = right + 'px';
				baseElement.style.height = '100%';
			}
		
			// Add size here
			if( dock.conf )
			{
				baseElement.classList.add( 'Size' + dock.conf.size );
			}
		}
		// Normal taskbar
		else
		{	
			if( !baseElement ) 
			{
				pollingTaskbar = false;
				return;
			}
		
			if( baseElement.childNodes.length )
			{
				var lastTask = baseElement.childNodes[ baseElement.childNodes.length - 1 ];
				// Horizontal
			
				var taskWidth = lastTask.offsetLeft + lastTask.offsetWidth;
				baseElement.style.left = '0px';
				baseElement.style.top = 'auto';
				baseElement.classList.add( 'Horizontal' );
				baseElement.style.width = 'calc(100% - ' + ( ge( 'Tray' ).offsetWidth + 5 ) + 'px)';
			
				if( baseElement.scrollFunc )
					baseElement.removeEventListener( 'mousemove', baseElement.scrollFunc );
			
				baseElement.scrollFunc = function( e )
				{
					var l = baseElement.childNodes[ baseElement.childNodes.length - 1 ];
					if( !l ) return;
				
					var off = e.clientX - baseElement.offsetLeft;
					var scr = off / baseElement.offsetWidth;
					if( l.offsetLeft + l.offsetWidth > baseElement.offsetWidth )
					{
						var whole = l.offsetLeft + l.offsetWidth - baseElement.offsetWidth;
						baseElement.scroll( scr * whole, 0 );
					}
				}
				baseElement.addEventListener( 'mousemove', baseElement.scrollFunc );
			}
		}
	
		// If we have the 'Taskbar'
		if( baseElement )
		{
			var whw = 0; // whole width
			var swi = baseElement.offsetWidth;
		
			var t = baseElement;
		
			// When activated normally
		
			if( !curr )
			{
				// No task array?
				if( typeof( t.tasks ) == 'undefined' )
					t.tasks = [];
			
				// Remove tasks on the taskbar that isn't represented by a view
				var cleaner = [];
				for( var b = 0; b < t.tasks.length; b++ )
				{
					// Look if this task is registered with a view
					var f = false;
					for( var a in movableWindows )
					{
						// Skip snapped windows
						if( !movableWindows[ a ].snap && movableWindows[ a ].viewId == t.tasks[ b ].viewId )
						{
							f = true;
							break;
						}
					}
					// If we already registered this task, add to cleaner
					if( f )
					{
						var tt = t.tasks[ b ];
						if( !currentMovable && tt.dom.classList.contains( 'Active' ) )
						{
							// Remove active if there's no movable
							tt.dom.classList.remove( 'Active' );
						}
						cleaner.push( tt );
					}
					// If the window doesn't exist, remove the DOM element from tasbkar
					else t.removeChild( t.tasks[ b ].dom );
				}
			
				t.tasks = cleaner; // Set cleaned task list
			
				for( var a in movableWindows )
				{
					var d = false;
				
					// Skip snapped windows
					if( movableWindows[ a ].snap ) continue;
				
					// Movable windows
					var pn = movableWindows[a];
				
					// Skip hidden ones
					if( pn.windowObject.flags.hidden == true )
					{
						continue;
					}
					if( pn.windowObject.flags.invisible == true )
					{
						continue;
					}
				
					if( pn && pn.windowObject.flags.screen != Workspace.screen )
					{
						continue;
					}
				
					// Lets see if the view is a task we manage
					for( var c = 0; c < t.tasks.length; c++ )
					{
						if ( t.tasks[c].viewId == pn.viewId )
						{
							d = t.tasks[ c ].dom; // don't add twice
						
							// Race condition, Update the state
							( function( ele, pp ){ 
								setTimeout( function()
								{
									if( pp.parentNode.getAttribute( 'minimized' ) )
									{
										ele.classList.add( 'Task', 'Hidden', 'MousePointer' );
									}
									else
									{
										ele.classList.add( 'Task', 'MoustPointer' );
										ele.classList.remove( 'Hidden' );
									}
								}, 5 );
							} )( d, pn );
							// Check directoryvuew
							if( pn.content.directoryview )
								d.classList.add( 'Directory' );
							break;
						}
					}
				
					// Create new tasks
					if( !d )
					{
						// New view!
						d = document.createElement ( 'div' );
						d.viewId = pn.viewId;
						d.view = pn;
						d.className = pn.parentNode.getAttribute( 'minimized' ) == 'minimized' ? 'Task Hidden MousePointer' : 'Task MousePointer';
						if( pn.content.directoryview )
						{
							d.classList.add( 'Directory' );
						}
						d.window = pn;
						pn.taskbarTask = d;
						d.applicationId = d.window.applicationId;
						d.innerHTML = d.window.titleString;
						t.tasks.push( { viewId: pn.viewId, dom: d } );
				
						if( pn == currentMovable ) d.classList.add( 'Active' );
				
						// Functions on task element
						// Activate
						d.setActive = function( click )
						{
							this.classList.add( 'Active' );
							_ActivateWindow( this.window );
							if( click )
							{
								var div = this.window;
								div.viewContainer.setAttribute( 'minimized', '' );
								div.windowObject.flags.minimized = false;
								div.minimized = false;
							
								var app = _getAppByAppId( div.applicationId );
								if( app )
								{
									app.sendMessage( {
										'command': 'notify',
										'method': 'setviewflag',
										'flag': 'minimized',
										'viewId': div.windowObject.viewId,
										'value': false
									} );
								}
							
								if( div.windowObject.workspace != globalConfig.workspaceCurrent )
								{
									Workspace.switchWorkspace( div.windowObject.workspace );
								}
								if( div.attached )
								{
									for( var a = 0; a < div.attached.length; a++ )
									{
										if( div.attached[ a ].minimize )
										{
											div.attached[ a ].minimized = false;
											div.attached[ a ].windowObject.flags.minimized = false;
											div.attached[ a ].viewContainer.removeAttribute( 'minimized' );
										
											var app = _getAppByAppId( div.attached[ a ].applicationId );
											if( app )
											{
												app.sendMessage( {
													'command': 'notify',
													'method': 'setviewflag',
													'flag': 'minimized',
													'viewId': div.attached[ a ].windowObject.viewId,
													'value': false
												} );
											}
										}
									}
								}
							}
						}
						// Deactivate
						d.setInactive = function()
						{
							if( this.window.classList.contains( 'Active' ) )
							{
								_DeactivateWindow( this.window );
							}
							this.classList.remove( 'Active' );
						}
						// Click event
						d.onmousedown = function()
						{
							this.mousedown = true;
						}
						d.onmouseout = function()
						{
							this.mousedown = false;
						}
						d.onmouseup = function( e, extarg )
						{
							if( !this.mousedown )
								return;
							if( e.button != 0 ) return;
						
							// Not needed anymore
							this.mousedown = false;
							
							if ( !e ) e = window.event;
							var targ = e ? ( e.target ? e.target : e.srcElement ) : false;
							if( extarg ) targ = extarg;
							for( var n = 0; n < t.childNodes.length; n++ )
							{
								var ch = t.childNodes[ n ];
								if( !ch.className ) continue;
								if( ch.className.indexOf( 'Task' ) < 0 ) continue;
								if( this == ch )
								{
									if( !this.window.classList.contains( 'Active' ) )
									{
										this.setActive( true ); // with click
										_WindowToFront( this.window );
										this.classList.remove( 'Hidden' );
									}
									else
									{
										this.setInactive();
										this.window.viewContainer.setAttribute( 'minimized', 'minimized' );
										this.window.windowObject.flags.minimized = true;
									
										var div = this.window;
									
										var app = _getAppByAppId( div.applicationId );
										if( app )
										{
											app.sendMessage( {
												'command': 'notify',
												'method': 'setviewflag',
												'flag': 'minimized',
												'viewId': div.windowObject.viewId,
												'value': true
											} );
										}
									
										if( div.attached )
										{
											for( var a = 0; a < div.attached.length; a++ )
											{
												if( !div.attached[ a ].minimized )
												{
													div.attached[ a ].minimized = true;
													div.attached[ a ].windowObject.minimized = true;
													div.attached[ a ].viewContainer.setAttribute( 'minimized', 'minimized' );
												
													var app = _getAppByAppId( div.attached[ a ].applicationId );
													if( app )
													{
														app.sendMessage( {
															'command': 'notify',
															'method': 'setviewflag',
															'flag': 'minimized',
															'viewId': div.attached[ a ].viewId,
															'value': true
														} );
													}
												}
											}
										}
										CheckMaximizedView();
									}
								}
								else
								{
									ch.setInactive();
									if( ch.window.classList.contains( 'Active' ) )
										_DeactivateWindow( ch.window );
								}
							}
						}
						
						// Need some help? Only show help if parent element is aligned left or right
						CreateHelpBubble( d, d.window.titleString, false, { getOffsetTop: function(){ return t.scrollTop; }, positions: [ 'Left', 'Right' ] } );
						
						t.appendChild( d );
						d.origWidth = d.offsetWidth + 20;
						
			
						// Check if we opened a window with a task image
						if( d.applicationId )
						{
							var running = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
							for( var a = 0; a < running.length; a++ )
							{
								var task = running[a];
								// Find the window!
								if( task.applicationId == d.applicationId )
								{
									// If we have a match!
									d.style.backgroundImage = 'url(' + task.icon + ')';
								}
							}
						}
					}
				}
			}
			else
			{
				// Update existing tasks
				if( curr && curr.taskbarTask && curr.parentNode )
				{
					curr.taskbarTask.setActive();
				}
				for( var c = 0; c < t.tasks.length; c++ )
				{
					var d = t.tasks[ c ].dom;
					if( d.window != curr )
					{
						d.setInactive();
					}
				}
			}
		
			// Can't 
			if( whw >= swi )
			{
				baseElement.setAttribute( 'full', 'full' );
			}
			// We deleted some
			else
			{
				baseElement.setAttribute( 'full', 'no' );
			}
		}
	
		// Manage running apps -------

		// Just check if the app represented on the desklet is running
		for( var a = 0; a < __desklets.length; a++ )
		{
			var desklet = __desklets[a];
		
			// Assume all launchers represent apps that are not running
			for( var c = 0; c < desklet.dom.childNodes.length; c++ )
			{
				desklet.dom.childNodes[c].running = false;
			}
		
			// Go and check running status
			for( var b in movableWindows )
			{
				if( movableWindows[b].windowObject )
				{
					var app = movableWindows[b].windowObject.applicationName;
				
					// Try to find the application if it is an application window
					for( var c = 0; c < desklet.dom.childNodes.length; c++ )
					{
						if( app && desklet.dom.childNodes[c].executable == app )
						{
							desklet.dom.childNodes[c].classList.add( 'Running' );
							desklet.dom.childNodes[c].running = true;
						}
					}
				}
			}
	
			// Just check if the app represented on the desklet is running
			for( var c = 0; c < desklet.dom.childNodes.length; c++ )
			{
				if( desklet.dom.childNodes[c].running == false )
				{
					desklet.dom.childNodes[c].classList.remove( 'Running' );
					desklet.dom.childNodes[c].classList.remove( 'Minimized' );
				}
			}
		}
	
		// Final test, just flush suddenly invisible or hidden view windows
		var out = [];
		for( var a = 0; a < t.tasks.length; a++ )
		{
			var v = t.tasks[a].dom;
			if( v.view.windowObject.flags.hidden || v.view.windowObject.flags.invisible )
			{
				t.tasks[a].dom.parentNode.removeChild( t.tasks[a].dom );
			}
			else out.push( t.tasks[a] );
		}
		t.tasks = out;
	}
	PollTray();
	pollingTaskbar = false;
}

// A docked taskbar uses the dock desklet!
function PollDockedTaskbar()
{
	if( Workspace.docksReloading ) return;
	
	pollingTaskbar = true;
	
	PollTray();
	
	for( var a = 0; a < __desklets.length; a++ )
	{	
		var desklet = __desklets[a];
		
		var changed = false;
		
		if( !desklet.viewList )
		{
			var wl = document.createElement( 'div' );
			desklet.viewList = wl;
			wl.className = 'ViewList';
			desklet.dom.appendChild( wl );
		}
		
		// Clear existing viewlist items that are removed
		var remove = [];
		for( var y = 0; y < desklet.viewList.childNodes.length; y++ )
		{
			if( !movableWindows[desklet.viewList.childNodes[y].viewId] )
				remove.push( desklet.viewList.childNodes[y] );
		}
		if( remove.length )
		{
			for( var y = 0; y < remove.length; y++ )
				desklet.viewList.removeChild( remove[y] );
			changed++;
		}
		
		// Clear views that are managed by launchers
		for( var y = 0; y < desklet.dom.childNodes.length; y++ )
		{
			var dy = desklet.dom.childNodes[y];
			if( dy.views )
			{
				var out = [];
				for( var o in dy.views )
				{
					if( movableWindows[o] )
						out[o] = dy.views[o];
				}
				dy.views = out;
			}
		}
		
		var wl = desklet.viewList;
		
		// Just check if the app represented on the desklet is running
		for( var c = 0; c < desklet.dom.childNodes.length; c++ )
		{
			desklet.dom.childNodes[c].running = false;
		}
		
		// Go through all movable view windows and check!
		// Buty only for docked mode.
		if( globalConfig.viewList == 'docked' )
		{
			for( var b in movableWindows )
			{
				if( movableWindows[ b ].windowObject )
				{
					// Skip hidden and invisible windows
					if( movableWindows[ b ].windowObject.flags.hidden )
					{
						continue;
					}
					if( movableWindows[ b ].windowObject.flags.invisible )
					{
						continue;
					}
				
					var app = movableWindows[ b ].windowObject.applicationName;
					var win = b;
					var wino = movableWindows[ b ];
					var found = false;
				
					// Try to find view in viewlist
					for( var c = 0; c < desklet.viewList.childNodes.length; c++ )
					{
						var cn = desklet.viewList.childNodes[ c ];
						if( cn.viewId == win )
						{
							found = wino;
						
							// Check if it is a directory
							if( found.content.directoryview )
							{
								cn.classList.add( 'Directory' );
							}
							else if( found.applicationId )
							{
								cn.classList.add( 'Running' );
							}
							break;
						}
					}
				
					// Try to find the application if it is an application window
					if( !found && app )
					{
						for( var c = 0; c < desklet.dom.childNodes.length; c++ )
						{
							var dof = desklet.dom.childNodes[ c ];
							if( dof.executable == app )
							{
								found = dof.executable;
								dof.classList.add( 'Running' );
								dof.running = true;
								break;
							}
						}
					}
				
					// If it's a found app, check if it isn't a single instance app
					if( found && typeof( found ) == 'string' )
					{
						// Single instance apps handle themselves
						if( !Friend.singleInstanceApps[ found ] )
						{
							for( var c = 0; c < desklet.dom.childNodes.length; c++ )
							{
								var d = desklet.dom.childNodes[ c ];
								if( !d.classList.contains( 'Launcher' ) ) continue;
								if( d.executable == found )
								{
									if( !d.views ) d.views = [];
									if( !d.views[ win ] ) d.views[ win ] = wino;
								
									// Clear non existing
									var out = [];
									for( var i in d.views )
										if( movableWindows[ i ] ) out[ i ] = d.views[ i ];
									d.views = out;
								}
							}
						}
					}
				
					// Check for an app icon
					var labelIcon = false;
					if( app && ge( 'Tasks' ) )
					{
						var tk = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
						for( var a1 = 0; a1 < tk.length; a1++ )
						{
							if( tk[a1].applicationName != app ) continue;
							var f = tk[ a1 ].parentNode;
							if( f.className && f.className == 'AppSandbox' )
							{
								var img = f.getElementsByTagName( 'div' );
								for( var b1 = 0; b1 < img.length; b1++ )
								{
									if( img[ b1 ].style.backgroundImage )
									{
										labelIcon = document.createElement( 'div' );
										labelIcon.style.backgroundImage = img[ b1 ].style.backgroundImage;
										labelIcon.className = 'LabelIcon';
										break;
									}
								}
							}
						}
					}
				
					// Add the window list item into the desklet
					if( !found )
					{
						var viewRep = document.createElement( 'div' );
						viewRep.className = 'Launcher View MousePointer';
					
						if( labelIcon ) viewRep.appendChild( labelIcon );
						if( app ) viewRep.classList.add( app );
						viewRep.style.backgroundSize = 'contain';
						viewRep.state = 'visible';
						viewRep.viewId = win;
						viewRep.setAttribute( 'title', movableWindows[win].titleString );
						viewRep.onclick = function( e )
						{
							// TODO: Make sure we also have touch
							if( !e || e.button != '0' ) return;
						
							var theView = movableWindows[ this.viewId ];
						
							this.state = this.state == 'visible' ? 'hidden' : 'visible';
							var wsp = theView.windowObject.workspace;
							if( wsp != globalConfig.workspaceCurrent )
							{
								Workspace.switchWorkspace( wsp );
								this.state = 'visible';
							}
							if( this.state == 'hidden' )
							{
								theView.viewContainer.classList.add( 'Minimized' );
								theView.windowObject.flags.minimized = true;
							}
							else
							{
								theView.viewContainer.classList.remove( 'Minimized' );
								theView.windowObject.flags.minimized = false;
								_WindowToFront( theView );
							}
							var mv = theView;
							if( mv && mv.windowObject )
							{
								theView.windowObject.setFlag( 'hidden', this.state == 'hidden' ? true : false );
								if( this.state == 'hidden' )
								{
									if( !this.elementCount )
									{
										var d = document.createElement( 'div' );
										d.className = 'ElementCount';
										this.elementCount = d;
										this.appendChild( d );
									}
									this.elementCount.innerHTML = '<span>' + 1 + '</span>';
								}
								else
								{
									if( this.elementCount ) 
									{
										this.removeChild( this.elementCount );
										this.elementCount = null;	
									}
								}
							}
							_WindowToFront( theView );
							 CheckMaximizedView();
						}
						desklet.viewList.appendChild( viewRep );
						changed++;
					}
					else
					{
					
					}
				}
			}
		}
		
		// Just check if the app represented on the desklet is running
		for( var c = 0; c < desklet.dom.childNodes.length; c++ )
		{
			if( desklet.dom.childNodes[c].running == false )
			{
				desklet.dom.childNodes[c].classList.remove( 'Running' );
				desklet.dom.childNodes[c].classList.remove( 'Minimized' );
			}
		}
		
		if( changed ) desklet.render();
	}
	
	pollingTaskbar = false;
}

// Make a menu for the current launcher or view list item icon
// It's only for items that has a group of views!
var _vlMenu = null;
function GenerateViewListMenu( win )
{
	if( _vlMenu )
	{
		_vlMenu.parentNode.removeChild( _vlMenu );
	}
	
	var found = false;
	for( var a in movableWindows )
	{
		//if( movableWindows[
	}
	
	//_vlMenu = document.createElement( 'div' );
}

// Notify the user!
// format: msg{ title: 'sffs', text: 'fslkjsl' }
function CallFriendApp( func, param1, param2, param3 )
{
	if( typeof friendApp != 'undefined' )
	{
		switch ( func )
		{
			case 'show_notification':
				if ( typeof friendApp.show_notification == 'function' )
				{
					friendApp.show_notification( param1, param2 );
					return '';
				}
				break;
			case 'onFriendNetworkMessage':
				if ( typeof friendApp.onFriendNetworkMessage == 'function' )
					return friendApp.onFriendNetworkMessage( param1 );
				break;
		}
	}
	return false;
}

function ClearSelectRegion()
{
	if( ge ( 'RegionSelector' ) )
	{
		var s = ge ( 'RegionSelector' );
		s.parentNode.removeChild( s );
	}
	// Nullify initial settings
	if( window.regionWindow )
	{
		if( window.regionWindow.scroller )
		{
			window.regionWindow.scroller.onscroll = null;
		}
	}
}

movableMouseDown = function ( e )
{
	if ( !e ) e = window.event;
	
	window.focus();
	
	// Close tray bubble
	if( ge( 'Tray' ) && ge( 'Tray' ).notificationPopup )
	{
		if( e.target && e.target != ge( 'Tray' ).notificationPopup.parentNode )
		{
			CloseTrayBubble();
		}
	}
	
	// Menu trigger
	var rc = 0;
	if ( e.which ) rc = ( e.which == 3 );
	else if ( e.button ) rc = ( e.button == 2 );
	
	// Get target
	var tar = e.srcElement ? e.srcElement : e.target;
	
	if( ( window.isTablet || window.isMobile ) && Workspace.iconContextMenu )
	{
		Workspace.iconContextMenu.hide();
		if( !isMobile )
			DefaultToWorkspaceScreen( tar );
	}
	
	// TODO: Allow context menus!
	if( !window.isMobile && !window.isTablet && ( rc || e.button != 0 ) )
	{
		return;
	}
	
	// Remove menu on calendar slide and menu click
	if( isMobile && tar.id && tar.id == 'WorkspaceMenu' )
	{
		 if( ge( 'CalendarWidget' ) && document.body.classList.contains( 'WidgetSlideDown' ) )
		 {
		 	if( Workspace.widget )
		 	{
		 		tar.classList.remove( 'Open' );
		 		Workspace.widget.slideUp();
			 	return;
		 	}
		 }
	}
	
	var clickOnMenuItem = tar && tar.classList.contains( 'MenuItem' ) ? true : false;
	
	if( !clickOnMenuItem && Workspace.iconContextMenu )
	{
		Workspace.iconContextMenu.hide();
	}
	
	var sh = e.shiftKey || e.ctrlKey;
	
	// Zero scroll
	window.regionScrollLeft = 0;
	window.regionScrollTop = 0;
	
	// Clicking inside content (listview or normal)
	if ( 
		( 
			tar.classList && tar.classList.contains( 'Scroller' ) &&
			( 
				tar.parentNode.classList.contains( 'Content' ) || 
				tar.parentNode.classList.contains( 'ScreenContent' ) 
			)
		) ||
		(
			tar.classList && tar.classList.contains( 'ScrollArea' ) &&
			tar.parentNode.classList.contains( 'Listview' )
		)
	)
	{
		tar = tar.parentNode;
	}
	// Check if we got a click on desktop
	var clickonDesktop = tar.classList && ( 
		tar.classList.contains( 'ScreenContent' ) ||
		tar.classList.contains( 'ScreenOverlay' ) 
	);
	
	var clickOnView = tar.classList && tar.classList.contains( 'Content' ) && tar.parentNode.classList.contains ( 'View' ); 
	// Listview
	if( !clickOnView && tar.classList.contains( 'Listview' ) )
		clickOnView = true;
	
	// Desktop / view selection 
	if(
		!isMobile && ( clickonDesktop || clickOnView )
	)
	{
		if( !sh && e.button === 0 )
		{
			// Don't count scrollbar
			if( ( ( e.clientX - GetElementLeft( tar ) ) < tar.offsetWidth - 16 ) )
			{
				clearRegionIcons( { force: true } );
			}
		}
		
		window.mouseDown = 4;
		window.regionX = windowMouseX;
		window.regionY = windowMouseY;
		if( tar ) window.regionWindow = tar;
		else window.regionWindow = ge( 'DoorsScreen' );
		if( clickOnView )
		{
			_ActivateWindow( tar.parentNode );
		}
		else if( clickonDesktop )
		{
			if( window.currentMovable && tar.classList && tar.classList.contains( 'ScreenOverlay' ) )
			{
				// Check if we clicked active window
				// TODO: Cycle through all windows and check if we clicked on any, including widgets
				var wl = GetElementLeft( currentMovable );
				var wt = GetElementTop( currentMovable );
				if( 
					windowMouseX >= wl && windowMouseX <= wl+currentMovable.offsetWidth &&
					windowMouseY >= wt && windowMouseY <= wt+currentMovable.offsetHeight
				)
				{
					_ActivateWindow( currentMovable );
				}
				else
				{
					DefaultToWorkspaceScreen( tar );
				}
			}
			else
			{
				// Clicking from an active view to screen
				DefaultToWorkspaceScreen( tar );
			}
		}
		else 
		{
			CheckScreenTitle();
		}
		Workspace.toggleStartMenu( false );
		
		// Cover windows if we are clicking on desktop
		if( clickonDesktop )
			CoverWindows();
		
		return cancelBubble( 2 );
	}
	else if ( isMobile && ( clickonDesktop || clickOnView ) )
	{
		// TODO: Perhaps scroll shouldn't deselect
		if( clickOnView )
		{
			clearRegionIcons( { force: true } );
		}
		
	}
}

// Go into standard Workspace user mode (f.ex. clicking on wallpaper)
function DefaultToWorkspaceScreen( tar ) // tar = click target
{
	if( isMobile ) return;
	FocusOnNothing();
	WorkspaceMenu.close();
}

function convertIconsToMultiple()
{
	if( currentMovable && currentMovable && currentMovable.content.icons )
	{
		var ics = currentMovable.content.icons;
		for( var a = 0; a < ics.length; a++ )
		{
			if( ics[a].selected )
			{
				ics[a].selected = 'multiple';
				if( ics[ a ].domNode )
					ics[a].domNode.selected = 'multiple';
				if( ics[a].fileInfo )
					ics[a].fileInfo.selected = 'multiple';
			}
		}
	}
}

function clearRegionIcons( flags )
{
	// No icons selected now..
	Friend.iconsSelectedCount = 0;

	// Exception for icon deselection
	var exception = null;
	if( flags && flags.exception )
	{
		exception = flags.exception;
	}

	var multipleCheck = flags && flags.force ? 'none' : 'multiple';

	// Clear all icons
	for( var a in movableWindows )
	{
		var w = movableWindows[a];
		if( w.content && w.content.icons )
			w = w.content;
		if ( w.icons )
		{
			for ( var a = 0; a < w.icons.length; a++ )
			{
				var ic = w.icons[a].domNode;
				if( ic && ic.className )
				{
					if( exception != ic && ic.selected != multipleCheck )
					{
						ic.classList.remove( 'Selected' );
						w.icons[a].selected = false;
						w.icons[a].file = false;
						ic.selected = false;
					}
					ic.classList.remove( 'Editing' );
					if( ic.input )
					{
						if( ic.input.parentNode )
						{
							ic.input.parentNode.removeChild( ic.input );
						}
						ic.input = null;
					}
				}
			}
		}
	}
	// Clear desktop icons
	if( window.Doors && Doors.screen && Doors.screen.contentDiv.icons )
	{
		for( var a = 0; a < Doors.screen.contentDiv.icons.length; a++ )
		{
			var icon = Doors.screen.contentDiv.icons[a];
			var ic = icon.domNode;
			if( !ic ) continue;
			if( exception != ic && ic.selected != multipleCheck )
			{
				ic.classList.remove( 'Selected' );
				icon.file.selected = false;
				icon.selected = false;
				ic.selected = false;
			}
		}
	}
}

function contextMenu( e )
{
	if( e.defaultBehavior ) return;
	if ( !e ) e = window.event;
	var tar = e.target ? e.target : e.srcEvent;
	if ( !tar ) return;
	
	var mov, mov2, mov3;
	var mdl = GetTitleBarG ();
	if ( tar.parentNode )
		mov = tar.parentNode.className && tar.parentNode.className.indexOf ( ' View' ) >= 0;
	if ( tar.parentNode && tar.parentNode.parentNode && tar.parentNode.parentNode.className )
		mov2 = tar.parentNode.parentNode.className.indexOf ( ' View' ) >= 0;
	if ( tar.parentNode && tar.parentNode.parentNode && tar.parentNode.parentNode.parentNode && tar.parentNode.parentNode.parentNode.className )
		mov3 = tar.parentNode.parentNode.parentNode.className.indexOf ( ' View' ) >= 0;
	
	if ( 
		tar.classList.contains( 'ScreenContent' ) || 
		windowMouseY < (mdl?mdl.offsetHeight:0) || 
		( tar.classList.contains( 'Content' ) && mov ) ||
		( tar.classList.contains( 'Title' ) && mov ) ||
		( tar.parentNode.classList.contains( 'Title' ) && mov2 ) ||
		( tar.className == 'MoveOverlay' && mov ) ||
		( tar.className == 'Resize' && mov ) ||
		( tar.parentNode.parentNode && tar.parentNode.parentNode.classList.contains( 'Title' ) && mov3 )
	)
	{
		window.mouseDown = false;
		if( isMobile )
		{
			MobileContextMenu.show( tar );
		}
		else
		{
			WorkspaceMenu.show();
		}
	}
	return cancelBubble( e );
}

function FixWindowDimensions( mw )
{
	SetWindowFlag( mw, 'min-height', mw.parentNode.offsetHeight );
	SetWindowFlag( mw, 'max-height', mw.parentNode.offsetHeight );
	SetWindowFlag( mw, 'min-width', mw.parentNode.offsetWidth );
	SetWindowFlag( mw, 'max-width', mw.parentNode.offsetWidth );
}

function ElementWindow ( ele )
{
	// Check if this element is in a window
	while ( ele != document.body )
	{
		ele = ele.parentNode;
		if ( ele.className && ele.className.indexOf ( ' View' ) >= 0 )
		{
			if ( ele.content ) return ele.content;
			return ele;
		}
	}
	return false;
}

function InitGuibaseEvents()
{
	if( window.isTablet || window.isMobile || isTouchDevice() )
	{
		window.addEventListener( 'touchstart', movableMouseDown, false );
		window.addEventListener( 'touchmove', movableListener, false );
		window.addEventListener( 'touchend', movableMouseUp, false );
	}
	else
	{
		if( window.attachEvent )
			window.attachEvent( 'onmouseup', movableMouseUp, false );
		else window.addEventListener( 'mouseup', movableMouseUp, false );	
		
		if( window.attachEvent )
			window.attachEvent ( 'onmousemove', movableListener, false );
		else window.addEventListener( 'mousemove', movableListener, false );
		
		if( window.attachEvent )
			window.attachEvent( 'onmousedown', movableMouseDown, false );
		else window.addEventListener( 'mousedown', movableMouseDown, false );

		if( window.attachEvent )
			window.attachEvent( 'oncontextmenu', contextMenu, false );
		else window.addEventListener( 'contextmenu', contextMenu, false );
		
		// On blur, activate current movable (don't put it to front)
		window.addEventListener( 'blur', function( e )
		{
			// Refresh the tray
			PollTray();
			
			var viewObject = null;
			if( document.activeElement )
			{
				viewObject = document.activeElement;
			}
			if( window.currentMovable )
			{
				if( window.currentMovable.content == viewObject.view )
				{
					_WindowToFront( window.currentMovable );
				}
				else
				{
					_ActivateWindowOnly( window.currentMovable );
				}
			}
		} );
	}
	
	if( window.attachEvent )
		window.attachEvent( 'onresize', movableListener, false );
	else window.addEventListener( 'resize', movableListener, false );

	document.oncontextmenu = contextMenu;
}

var __titlebarg = false;
function GetTitleBarG ()
{
	if ( typeof ( window.currentScreen ) != 'undefined' )
		return window.currentScreen.getElementsByTagName ( 'div' )[0];
	if ( !__titlebarg )
		__titlebarg = ge ( 'Modules' ) ? ge ( 'Modules' ) : ( ge ( 'TitleBar' ) ? ge ( 'TitleBar' ) : false );
	return __titlebarg;
}

function ClearMenuItemStyling( par )
{
	var lis = par.getElementsByTagName( 'li' );
	for( var a = 0; a < lis.length; a++ ) 
	{
		var sp = lis[a].getElementsByTagName( 'span' );
		if( sp && sp[0] ) sp[0].className = '';
	}
}

function FocusOnNothing()
{
	if( !window.currentMovable ) return;
	
	if( !isMobile )
		_DeactivateWindows();
	
	// Put focus somewhere else than where it is now..
	// Blur like hell! :)
	for( var a in movableWindows )
	{
		if( movableWindows[a].windowObject )
		{
			movableWindows[a].windowObject.sendMessage( { command: 'blur' } );
		}
	}
	var eles = document.getElementsByTagName( '*' );
	for( var a = 0; a < eles.length; a++ )
	{
		eles[a].blur();
	}
	// Why not focus on window!?
	window.focus();
}

// Alert box, blocking a window
function AlertBox( title, desc, buttons, win )
{
	// New view
	var w = new View( {
		title: title,
		width: 380,
		height: 200,
		resize: false
	} );
	
	for( var a in buttons )
		buttonml += '<button class="IconSmall ' + buttons[a].className + '">' + buttons[a].text + '</button>';
	
	var ml = '<div class="Dialog"><div class="DialogContent">' + desc + '</div><div class="DialogButtons">' + buttonml + '</div></div>';
	
	w.setContent( ml );
	
	// Collect added dom elements
	var eles = w.content.getElementsByTagName( 'button' );
	var dbuttons = [];
	for( var a = 0; a < eles.length; a++ )
	{
		// TODO: Make safer!
		if( eles[a].parentNode.className == 'DialogButtons' && eles[a].parentNode.parentNode == 'Dialog' )
		{
			dbuttons.push( eles[a] );
		}
	}
	
	// Set onclick actions
	for( var c = 0; c < buttons.length; c++ )
	{
		dbuttons[c].view = w;
		dbuttons[c].onclick = buttons.onclick;
	}
	
	// Apply blocker if needed
	if( win ) w.setBlocker( win );
}

// Is it a shared app?
function IsSharedApp()
{
	return GetDOMHead().getAttribute( 'sharedapp' );
}

function GetDOMHead()
{
	if( !window._domHead )
	{
		window._domHead = document.getElementsByTagName( 'head' )[0];
	}
	return window._domHead;
}

// COLOR PROCESSOR IS NOT USED AND CAN BE DELETED! -----------------------------

// Setup a color processor
_colorProcessor = false;
function LockColorProcessor()
{
	if( !_colorProcessor )
	{
		// Make it and get it out of the way
		_colorProcessor = document.createElement( 'canvas' );
		_colorProcessor.style.width = 320;
		_colorProcessor.style.height = 200;
		//_colorProcessor.style.visibility = 'hidden';
		_colorProcessor.style.pointerEvents = 'none';
		//_colorProcessor.style.top = '-320px';
		_colorProcessor.style.position = 'absolute';
		document.body.appendChild( _colorProcessor );
		_colorProcessor.ctx = _colorProcessor.getContext( '2d' );
	}
	if( _colorProcessor.lock ) return false;
	_colorProcessor.lock = true;
	return _colorProcessor;
}

function UnlockColorProcessor()
{
	_colorProcessor.lock = false;
}

// Take an image and look for average color
function FindImageColorProduct( img )
{
	var c = LockColorProcessor();
	if( c )
	{
		c.ctx.drawImage( img, 0, 0, 320, 200 );
		var imgd = c.ctx.getImageData( 0, 0, 320, 200 );
		var average = { r: 0, g: 0, b: 0 };
		var steps = 8;
		var increments = steps << 2; // * 4
		for( var i = 0; i < imgd.data.length; i += increments )
		{
			average.r += imgd.data[ i   ];
			average.g += imgd.data[ i + 1 ];
			average.b += imgd.data[ i + 2 ];
		}
		average.r /= imgd.data.length >> 3;
		average.g /= imgd.data.length >> 3; // step == 8 (>>3)
		average.b /= imgd.data.length >> 3;
		average.r = Math.floor( average.r );
		average.g = Math.floor( average.g );
		average.b = Math.floor( average.b );
		UnlockColorProcessor();
		return average;
	}
	return false;
}

// END COLOR PROCESSOR ---------------------------------------------------------

// End disposable menu for mobile use ------------------------------------------

/* Bubble emitter for tutorials and help ------------------------------------ */
/* This is bubbles for showing localized help on Workspace scoped elements.   */
/* TODO: Support API scoped elements...                                       */

function CreateHelpBubble( element, text, uniqueid, rules )
{
	if( isMobile || isTablet ) return;
	if( !element || !text ) return;
	
	if( element.helpBubble )
	{
		element.helpBubble.close();
	}
	
	var helpBubble = {
		destroy: function()
		{
			if( helpBubble )
			{
				helpBubble.close();
				helpBubble.widget = null;
			}
			if( element && element.parentNode )
			{
				element.removeEventListener( 'mouseover', element.helpBubble.overListener );
				element.removeEventListener( 'mouseover', element.helpBubble.outListener );
			}
		},
		close: function()
		{
			if( helpBubble.widget )
			{
				helpBubble.widget.close();
				helpBubble.widget = null;
			}
		},
		overListener: function( e )
		{
			if( !element || !element.parentNode )
			{
				helpBubble.destroy();
				return;
			}
			
			// Check parent
			var positionClass = '';
			var p = e.target ? e.target.parentNode : false;
			
			// Also check parent
			if( p )
			{
				for( var a = 0; a < 2; a++ )
				{
					var found = false;
					if( p.getAttribute( 'position' ) )
					{
						switch( p.getAttribute( 'position' ) )
						{
							case 'right_center':
							case 'right_top':
							case 'right_bottom':
								positionClass = 'Right';
								break;
							case 'left_center':
							case 'left_top':
							case 'left_bottom':
								positionClass = 'Left';
								break;
							case 'bottom_left':
							case 'bottom_center':
							case 'bottom_right':
								positionClass = 'Bottom';
								break;
							case 'top_left':
							case 'top_center':
							case 'top_right':
								positionClass = 'Top';
								break;
							default:
								break;
						}
					}
					if( !!positionClass ) break;
					p = p.parentNode;
				}
			}
			
			var mx = windowMouseX;
			var my = windowMouseY;
			var mt = GetElementTop( element ) - ( 50 + 10 );
			
			var c = document.createElement( 'canvas' );
			var d = c.getContext( '2d' );
			d.font = '1em default';
			var textWidth = d.measureText( text );
			
			// Normal operation
			mx = GetElementLeft( element ) + ( GetElementWidth( element ) >> 1 ) - ( textWidth.width >> 1 ) - 30;
			
			// Check element position
			if( positionClass )
			{
				if( positionClass == 'Right' )
				{
					mt = GetElementTop( element ) + 5;
					mx = GetElementLeft( element ) - Math.floor( textWidth.width + 90 );
					posset = true;
				}
				else if( positionClass == 'Left' )
				{
					mt = GetElementTop( element ) + 5;
					mx = GetElementLeft( element ) + GetElementWidth( element.parentNode ) + 10;
					posset = true;
				}
				else if( positionClass == 'Top' )
				{
					mt = GetElementTop( element.parentNode ) + GetElementHeight( element.parentNode ) + 25;
				}
			}
			
			// Nudge
			if( rules )
			{
				if( !!rules.offsetTop )
				{
					mt -= rules.offsetTop;
				}
				if( !!rules.offsetLeft )
				{
					mx -= rules.offsetLeft;
				}
				if( !!rules.getOffsetTop )
				{
					mt -= rules.getOffsetTop();
				}
				if( !!rules.getOffsetLeft )
				{
					mx -= rules.getOffsetLeft();
				}
			}
			
			var v = new Widget( {
				left: mx,
				top: mt,
				width: 200,
				height: 40,
				'border-radius': 20,
				above: true,
				fadeOut: true,
				fadeIn: true
			} );
			
			d.innerHTML = text;
			v.setFlag( 'width', textWidth.width + 60 );
			v.setFlag( 'left', mx );
			v.setFlag( 'top', mt );
			v.setContent( '<div class="TextCenter Padding Ellipsis">' + text + '</div>' );
			v.dom.addEventListener( 'mouseout', element.helpBubble.outListener );
			v.dom.classList.add( 'HelpBubble' );
			
			// Remove all position classes and add right one
			var pcl = [ 'Left', 'Top', 'Right', 'Bottom' ];
			if( rules && rules.positions )
				pcl = rules.positions;
			for( var z = 0; z < pcl.length; z++ )
				if( pcl[ a ] != positionClass )
					v.dom.classList.remove( pcl[ a ] );
			if( v.dom.className.length && positionClass )
				v.dom.classList.add( positionClass );
			else if( positionClass ) v.dom.className = positionClass;
			
			var show = true;
			if( pcl )
			{
				var f = false;
				for( var a in pcl )
				{
					if( positionClass == pcl[ a ] )
					{
						f = true;
						break;
					}
				}
				show = f;
			}
			if( show )
				v.show();
			element.helpBubble.widget = v;
		},
		outListener: function( e )
		{
			if( helpBubble && helpBubble.widget )
				helpBubble.widget.hide( function(){ if( helpBubble && helpBubble.widget ) helpBubble.widget.close(); } );
		}
	};
	element.helpBubble = helpBubble;
	element.addEventListener( 'mouseover', element.helpBubble.overListener );
	element.addEventListener( 'mouseout', element.helpBubble.outListener );
}

