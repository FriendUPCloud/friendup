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

var movableHighestZindex = 99;
var movableWindowCount = 0;
var movableWindowIdSeed = 1;
var movableWindows = new Array ();
var windowMouseX = -1;
var windowMouseY = -1;
var mousePointer = 
{
	'elements': [],
	'dom': false,
	'testPointer': function ()
	{
		if( !ge( 'MousePointer' ) )
		{
			var d = document.createElement( 'div' );
			d.id = 'MousePointer';
			d.style.position = 'absolute';
			d.style.zIndex = '10000';
			d.style.opacity = 0.7;
			d.style.whiteSpace = 'nowrap';
			document.body.appendChild( d );
			this.dom = d;
		}
	},
	'move': function( e )
	{
		if ( !e ) e = window.event;
		var tar = e.target ? e.target : e.srcElement;
		// If we have elements, it means we have icons!
		if ( this.elements.length )
		{
			// Make sure we don't have problems with iframes!
			CoverWindows();
			
			// Find what we moved over
			var w = this.elements[0].window;
			var mover = false;
			for ( var a = 0; a < w.icons.length; a++ )
			{
				var ic = w.icons[a].domNode;
				var icon = w.icons[a];
				if ( 
					ic.offsetTop < windowMouseY && ic.offsetLeft < windowMouseX &&
					ic.offsetTop + ic.offsetHeight > windowMouseY &&
					ic.offsetLeft + ic.offsetWidth > windowMouseX
				)
				{
					mover = icon;
				}
			}
			// Check move on window
			if ( !mover )
			{
				var z = 0;
				var moveWin = 0;
				for ( var a in window.movableWindows )
				{
					var wn = window.movableWindows[a];
					var wnZ = parseInt ( wn.style.zIndex );
					if ( 
						wn.offsetTop < windowMouseY && 
						wn.offsetLeft < windowMouseX &&
						wn.offsetTop + wn.offsetHeight > windowMouseY &&
						wn.offsetLeft + wn.offsetWidth > windowMouseX && 
						wnZ >= z
					)
					{
						moveWin = wn;
						z = wnZ;
					}
				}
				if ( moveWin )
				{
					if ( moveWin.content )
					{
						mover = moveWin;
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
			}
			for ( var a in window.movableWindows )
			{
				var wd = window.movableWindows[a];
				if ( ( !mover && wd.rollOut ) || ( wd != moveWin && wd.rollOut ) )
					wd.rollOut ( e );
			}
			if ( mover )
			{
				if ( mover.rollOver )
				{
					mover.rollOver ( this.elements );
				}
			}
		}
	},
	'stopMove': function ( e )
	{
		for ( var a in window.movableWindows )
		{
			var wn = window.movableWindows[a];
			if ( wn.rollOut ) wn.rollOut ( e );
		}
	},
	'drop': function ( e )
	{
		if ( !e ) e = window.event;
		var tar = e.target ? e.target : e.srcElement;
		if ( this.elements.length )
		{
			// Find what we dropped on
			var w = this.elements[0].window;
			var dropper = false;
			for ( var a = 0; a < w.icons.length; a++ )
			{
				var ic = w.icons[a].domNode;
				var icon = w.icons[a];
				if ( 
					ic.offsetTop < windowMouseY && ic.offsetLeft < windowMouseX &&
					ic.offsetTop + ic.offsetHeight > windowMouseY &&
					ic.offsetLeft + ic.offsetWidth > windowMouseX
				)
				{
					dropper = icon;
				}
			}
			// Check drop on window
			if( !dropper )
			{
				var z = 0;
				var dropWin = 0;
				for ( var a in window.movableWindows )
				{
					var wn = window.movableWindows[a];
					var wnZ = parseInt ( wn.style.zIndex );
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
				}
				if ( dropWin )
				{
					if ( dropWin.content )
					{	
						dropper = dropWin;
					}
				}
			}
			// Check drop on desklet
			if( !dropper )
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
						console.log( 'We are dropped!' );
						dropWin = wn;
						z = wnZ
					}
					else
					{
						console.log( 'No dropping here: ' + wnZ + '..' );
					}
				}
				if ( dropWin && dropWin.drop )
				{
					dropper = dropWin;
				}
			}
			
			var dropped = 0;
			if( dropper )
			{
				// Check if dropper object has a drop method, and execute it
				// with the supplied elements
				if( dropper.drop )
				{
					dropped = dropper.drop( this.elements );
				}
				else
				{
					var objs = [];
					for( var k = 0; k < this.elements.length; k++ )
					{
						var e = this.elements[k];
						objs.push( {
							Path: e.fileInfo.Path,
							Type: e.fileInfo.Type,
							Filename: e.fileInfo.Filename ? e.fileInfo.Filename : e.fileInfo.Title,
							Filesize: e.fileInfo.fileSize,
							Icon: e.fileInfo.Icon
						} );
					}
					if( dropper.windowObject )
						dropper.windowObject.sendMessage( { command: 'drop', data: objs } );
				}
			}
			
			for( var a = 0; a < this.elements.length; a++ )
			{
				this.dom.removeChild( this.elements[a] );
			}
			this.elements = [];
			this.dom.innerHTML = '';
			
			// We didn't drop anything, or there was an error..
			if( dropped <= 0 )
			{
				if ( w.parentNode.id == 'DoorsScreen' ) Workspace.refreshDesktop();
				if( window.currentMovable.content && window.currentMovable.content.refresh )
					window.currentMovable.content.refresh();
			}
			
			if( w )
			{
				if( w.id == 'DoorsScreen' ) Workspace.refreshDesktop();
				else if( w.refreshIcons )
				{
					w.refreshIcons();
				}
			}
			else
			{
				Workspace.refreshDesktop();
			}
		}
	},
	'clone': function ( ele )
	{
		this.testPointer ();
	},
	'pickup': function ( ele )
	{
		this.testPointer ();
		// Check multiple (pickup multiple)
		var multiple = false;
		if ( ele.window )
		{
			_ActivateWindowOnly( ele.window.parentNode );
			for ( var a = 0; a < ele.window.icons.length; a++ )
			{
				var ic = ele.window.icons[a];
				if ( ic.domNode.className.indexOf ( 'Selected' ) > 0 )
				{
					var el = ic.domNode;
					multiple = true;
					el.style.top = 'auto';
					el.style.left = 'auto';
					el.style.position = 'relative';
					el.parentNode.removeChild ( el );
					this.dom.appendChild ( el );
					this.elements.push ( el );
				}
			}
		}
		// Pickup single
		if ( !multiple )
		{
			ele.style.top = 'auto';
			ele.style.left = 'auto';
			ele.style.position = 'relative';
			ele.parentNode.removeChild ( ele );
			this.dom.appendChild ( ele );
			this.elements.push ( ele );
		}
	},
	'poll': function ( e )
	{
		if ( !this.elements || !this.elements.length )
		{
			if ( this.dom )
				this.dom.parentNode.removeChild ( this.dom );
			this.dom = false;
		}
		else
		{
			this.dom.style.top = windowMouseY - Math.floor ( this.dom.firstChild.offsetHeight * 0.5 ) + 'px';
			this.dom.style.left = windowMouseX - Math.floor ( this.dom.firstChild.offsetWidth * 0.5 ) + 'px';
			window.mouseDown = 5;
			ClearSelectRegion ();
		}
	}
};

// Cover windows with overlay
function CoverWindows()
{
	for ( var a in movableWindows )
	{
		if( movableWindows[a].moveoverlay )
			movableWindows[a].moveoverlay.style.height = '100%';
	}
}
// Expose windows / remove overlay
function ExposeWindows()
{
	for ( var a in movableWindows )
	{
		if( movableWindows[a].moveoverlay )
			movableWindows[a].moveoverlay.style.height = '0%';
		movableWindows[a].memorize ();
	}
}
// Cover screens with overlay
function CoverScreens()
{
	// Disable all screen overlays
	var screenc = ge ( 'Screens' );
	var screens = screenc.getElementsByTagName ( 'div' );
	for( var a = 0; a < screens.length; a++ )
	{
		if( !screens[a].className ) continue;
		if( screens[a].parentNode != screenc ) continue;
		screens[a]._screenoverlay.style.display = '';
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

// Set a flag
function SetWindowFlag ( div, flag, value )
{
	if ( !div.flags )
		div.flags = new Object ();
	div.flags[flag] = value;
	switch( flag )
	{
		case 'scrollable':
			if( value == true )
				div.className = 'Content IconWindow';
			else div.className = 'Content';
			break;
		case 'width':
		case 'height':
		case 'max-width':
		case 'max-height':
		case 'min-width':
		case 'min-height':
			ResizeWindow( div );
			RefreshWindow( div );
			break;
		case 'screen':
			console.log( value );
			break;
		case 'title':
			SetWindowTitle( div, value );
			break;
	}
}

function GuiCreate ( obj )
{
	var str = '';
	for ( var a = 0; a < obj.length; a++ )
	{
		switch ( typeof ( obj[a] ) )
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

function GuiColumns ( data )
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

function GuiContainer ( obj )
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
function InitElementPopup ( pdiv, actionurl, forceupdate, immediateDisplay )
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
				document.body.appendChild ( this.d );
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

function RepositionPopup ( e, test )
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
	l -= Math.floor ( el.offsetWidth * 0.5 );
	t -= ( height + 20 );
	
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
			RepositionPopup ( e );
		}
		else
		{
			RemoveElementPopup ( 1 ); // Totally remove
		}
	}
}

function RemoveElementPopup( close )
{
	var e = ge('ElementPopup' );
	if ( !e ) return;
	if ( e.tm ) clearTimeout ( e.tm );
	e.tm = false;
	if ( close )
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
	/*cont.style.height = rheight * height + 'px';*/
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

// Gets values from a SelectBox - multiple select returns array, otherwise string
function GetSelectBoxValue ( pel )
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

// Moves windows on mouse move
movableListener = function ( e )
{
	if ( !e ) e = window.event;
	var ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var wh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	var y = e.clientY ? e.clientY : e.pageY;
	var x = e.clientX ? e.clientX : e.pageX;
	var sh = e.shiftKey || e.ctrlKey;
	windowMouseX = x;
	windowMouseY = y;
	mousePointer.poll ();
	mousePointer.move ( e );
	if ( window.mouseDown && window.mouseMoveFunc ) 
	{
		window.mouseMoveFunc ( e );
	}
	else if ( window.currentMovable )
	{
		// Some defaults
		var minW = 160;
		var minH = 100;
		var maxW = 1000000;
		var maxH = 1000000;
		var st = document.body.scrollTop;
		if ( window.currentMovable.content && window.currentMovable.content.flags )
		{
			if ( window.currentMovable.content.flags['min-width'] >= 100 )
				minW = window.currentMovable.content.flags['min-width'];
			if ( window.currentMovable.content.flags['max-width'] >= 100 )
				maxW = window.currentMovable.content.flags['max-width'];
			if ( window.currentMovable.content.flags['min-height'] >= 100 )
				minH = window.currentMovable.content.flags['min-height'];
			if ( window.currentMovable.content.flags['max-height'] >= 100 )
				maxH = window.currentMovable.content.flags['max-height'];
		}
		
		// Clicking on the window title
		var mx = ( x - window.currentMovable.offx );
		var my = ( y - window.currentMovable.offy );
		if ( window.mouseDown == 1 )
		{
			var w = window.currentMovable;

			// Make sure the inner overlay is over screens
			if( window.currentScreen )
			{
				window.currentScreen.moveoverlay.style.display = '';
				window.currentScreen.moveoverlay.style.height = '100%';
			}	
			
			var minY = w.parentWindow ? 0 : ( GetTitleBarG() ? GetTitleBarG().offsetHeight : 0 );
			var maxY = w.parentWindow ? w.parentWindow.offsetHeight : ( ge ( 'Statusbar' ) && ge ( 'Statusbar' ).offsetTop ? ge ( 'Statusbar' ).offsetTop : wh );
			var maxX = w.parentWindow ? w.parentWindow.offsetWidth : ww;
			
			if ( my < minY ) my = minY;
			if ( mx < 0 ) mx = 0;
			else if ( mx + window.currentMovable.offsetWidth > maxX )
				mx = maxX - window.currentMovable.offsetWidth;
			if ( my + window.currentMovable.offsetHeight > maxY )
				my = maxY - window.currentMovable.offsetHeight;
			// Move the window!
			if ( window.currentMovable && window.currentMovable.style )
			{
				if( !window.currentMovable.getAttribute( 'moving' ) )
					window.currentMovable.setAttribute( 'moving', 'moving' );
				window.currentMovable.style.left = mx + 'px';
				window.currentMovable.style.top  = my + 'px';
				window.currentMovable.memorize ();
			}
			
			// Do resize events
			var w = window.currentMovable;
			CoverWindows();
			if ( w.content && w.content.events )
			{
				if ( typeof(w.content.events['move']) != 'undefined' )
				{
					for ( var a = 0; a < w.content.events['move'].length; a++ )
					{
						w.content.events['move'][a]();
					}
				}
			}
			return cancelBubble ( e );
		}
		// Mouse down on a resize gadget
		else if ( window.mouseDown == 2 )
		{ 
			var w = window.currentMovable;
			var r = w.resize;
			var t = w.titleBar;
			var minY = w.parentWindow ? 0 : ( GetTitleBarG() ? GetTitleBarG().offsetHeight : 0 );
			var maxY = w.parentWindow ? w.parentWindow.offsetHeight : 
				( ge ( 'Statusbar' ) && ge ( 'Statusbar' ).offsetTop ? ge ( 'Statusbar' ).offsetTop : wh );
			var maxX = w.parentWindow ? w.parentWindow.offsetWidth : ww;
			var nwh = windowMouseX - r.offx + r.offsetWidth;
			var nhh = windowMouseY - r.offy + r.offsetHeight - t.offsetHeight;
			
			ResizeWindow( w, nwh, nhh );
			
			// Move window if out of bounds!
			var t = w.offsetTop;
			var l = w.offsetLeft;
			if ( l + w.offsetWidth > maxX ) l = maxX - w.offsetWidth;
			if ( t + w.offsetHeight > maxY ) t = maxY - w.offsetHeight;
			if ( t < minY ) t = minY;
			if ( l < 0 ) l = 0;
			w.style.left = l + 'px';
			w.style.top  = t + 'px';
			
			// Do resize even••••••••ts (and make sure we have the overlay to speed things up)
			CoverWindows();
			if ( w.content.events )
			{
				if ( typeof(w.content.events['resize']) != 'undefined' )
				{
					for ( var a = 0; a < w.content.events['resize'].length; a++ )
					{
						w.content.events['resize'][a]();
					}
				}
			}
			return cancelBubble ( e );
		}
	}
	// Mouse down on desktop (regions)
	if ( window.mouseDown == 4 && window.regionWindow )
	{
		if( DrawRegionSelector( e ) )
		{		
			return cancelBubble( e );
		}
		return false;
	}
}

// Draw the region selector with a possible offset!
function DrawRegionSelector( e )
{
	var sh = e.shiftKey || e.ctrlKey;
	
	// Create region selector if it doesn't exist!
	if ( !ge ( 'RegionSelector' ) )
	{
		var d = document.createElement ( 'div' );
		d.id = 'RegionSelector';
		
		window.regionWindow.appendChild ( d );
		if ( document.body.attachEvent )
		{
			d.style.border = '1px solid #000000';
			d.style.background = '#555555';
			d.style.filter = 'alpha(opacity=50)';
		}
		else 
		{
			d.style.border = '1px solid rgba(0,0,0,0.3)';
			d.style.background = 'rgba(0,0,0,0.3)';
		}
		d.style.borderRadius = '3px';
	}
	
	// Extra offset in content window
	var mx = windowMouseX; var my = windowMouseY;
	var diffx = 0;		 var diffy = 0; 
	var ex = 0; var ey = 0;
	var eh = 0; var ew = 0;
	var rwc = window.regionWindow.className;
	var scrwn = window.regionWindow.scroller;
	
	// In icon windows or new screens
	if ( rwc == 'Content' || rwc == 'ScreenContent' )
	{
		// Window offset
		ex = -window.regionWindow.parentNode.offsetLeft;
		ey = -window.regionWindow.parentNode.offsetTop;
		
		// Scrolling down / left? Add to mouse scroll
		eh += window.regionWindow.scrollTop;
		ew += window.regionWindow.scrollLeft;
		
		if( rwc == 'Content' )
		{
			_ActivateWindow ( window.regionWindow.parentNode );
		}
		else
		{
			_DeactivateWindows();
		}
			
		// Do we have a scroll area?
		if( scrwn )
		{
			// Make sure the scrolling rects adapt on scroll! (first time!)
			if( !scrwn.onscroll )
			{
				scrwn.scrollTopStart  = scrwn.scrollTop;
				scrwn.scrollLeftStart = scrwn.scrollLeft;
				scrwn.onscroll = DrawRegionSelector;
			}
			// Calculate the diff on scroll
			else
			{
				diffy = scrwn.scrollTopStart - scrwn.scrollTop;
				diffx = scrwn.scrollLeftStart - scrwn.scrollLeft;
			}
		
			// If mouse pointer is far down, do some scrolling
			var ty = my - window.regionWindow.parentNode.offsetTop;
			var tx = mx - window.regionWindow.parentNode.offsetLeft;
			if( ty < 40 )
				scrwn.scrollTop -= 10;
			else if ( ty - 30 > scrwn.offsetHeight - 30 )
				scrwn.scrollTop += 10;
		}
	}
	
	var d = ge ( 'RegionSelector' );
	if ( !d ) return;
	
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
		if ( window.regionWindow.scroller && window.regionWindow.scroller.style )
		{
			var scr = parseInt ( window.regionWindow.scroller.scrollTop );
			if ( isNaN ( scr )) scr = 0;
			imy += scr;
		}
		
		var icos = window.regionWindow.icons;
		if ( icos )
		{
			for ( var a = 0; a < icos.length; a++ )
			{
				var ics = icos[a].domNode;
				// Coords on icon
				var ix1 = ics.offsetLeft;
				var iy1 = ics.offsetTop;
				var ix2 = ics.offsetWidth+ix1;
				var iy2 = ics.offsetHeight+iy1;
			
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
				
				if ( overlapping || intersecting )
				{
					ics.className = ics.className.split ( ' Selected' ).join ( '' ) + ' Selected';
				}
				else if ( !sh ) ics.className = ics.className.split ( ' Selected' ).join ( '' );
			}
		}
	}
}


// Gui modification / editing
function AbsolutePosition ( div, left, top, width, height )
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
function MakeTableList ( entries, headers )
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

function showWorkbenchMenu ( popupElement )
{
	// Move it!
	if( !window.isMobile )
	{
		if( ge( 'WorkbenchMenu' ) )
		{
			var m = ge( 'WorkbenchMenu' );
			m.parentNode.removeChild( m );
			currentScreen.appendChild( m );
		}
		// Make it!
		else if ( !ge ( 'WorkbenchMenu' ) )
		{
			var d = document.createElement ( 'div' );
			d.id = 'WorkbenchMenu';
			currentScreen.appendChild( d );
		}
	
		var wm = ge ( 'WorkbenchMenu' );
	
		// It's not a text document, don't allow drag/select
		wm.ondragstart = function( e ){ return cancelBubble( e ); }
		wm.onselectstart = function( e ){ return cancelBubble( e ); }
	}
	
	// Special case! Make it pop up!
	if( popupElement ) 
	{
		wm = popupElement;
	}
	else if( !window.isMobile )
	{
		ge( 'WorkbenchMenu' ).style.display = '';
	}
	
	// Make sure we don't have problems!
	if( Workspace && Workspace.menuMode == 'miga' )
	{
		CoverWindows();
	}
	// Others (fensters and pares)
	else if( Workspace && !window.isMobile )
	{
		var t = window.currentScreen.screenTitle.getElementsByClassName( 'Info' )[0];
		ge( 'WorkbenchMenu' ).style.left = t.offsetWidth + t.offsetLeft + 10 + 'px';
		ge( 'WorkbenchMenu' ).className = 'Pear';
	}
	
	var menuFound = 0;
	
	// Test if we have menu items 
	if ( wm && window.regionWindow && window.regionWindow.id != 'DoorsScreen' )
	{
		// Check window type
		// TODO: Give option to make a custom menu for this window!
		if ( window.regionWindow.menu )
		{
			GenerateMenu( wm, window.regionWindow.menu, false, window.regionWindow.applicationId );
			if( popupElement )
				popupElement.className = 'PopupMenu';
			menuFound = 1;
		}
	}
	
	// Ok this is the fallback menu and the workbench menu
	if ( !menuFound && wm )
	{
		// Blank menu
		if( currentMovable && currentMovable.windowObject )
		{
			if( !( currentMovable.content && currentMovable.content.directoryview ) )
			{
				return GenerateMenu( wm, [] );
			}
		}
		if( popupElement )
			return;
		if( window.currentScreen && window.currentScreen.menu )
		{
			GenerateMenu( wm, window.currentScreen.menu, false, window.currentScreen.screenObject._screen.applicationId );
		}
		else if ( ge ( 'DoorsScreen' ) && Workspace.menu )
		{
			GenerateMenu( wm, Workspace.menu );
		}
		else
		{
			if ( window.menu )
			{
				GenerateMenu( wm, window.menu );
			}
		}
	}
	// Onmouseover on menus (or click!)
	var mode = ( Workspace && Workspace.menuMode == 'miga' ) ? 'onmouseover' : 'onmousedown';
	if( wm )
	{
		var menus = wm.getElementsByTagName ( 'div' );
		for ( var a = 0; a < menus.length; a++ )
		{
			if ( menus[a].className != 'Menu' )
				continue;
			menus[a].menus = menus;
			menus[a][mode] = function()
			{
				//if( Workspace.menuMode != 'miga' )
				//	if( wm.isActivated ) return;
				wm.isActivated = true; // This menu is activated!
				console.log( 'this was triggered.' );
				// Cover movable windows to avoid mouse collision
				CoverWindows();
			
				for ( var c = 0; c < this.menus.length; c++ )
				{
					if ( this.menus[c] == this ) 
					{
						this.className = 'Menu Open';
					}
					else this.menus[c].className = 'Menu';
				}
			}
			// When one menu is open, allow changing menu with mouseover
			if( mode == 'onmousedown' )
			{
				menus[a].onmouseover = function()
				{
					if( wm.isActivated )
					{
						this.onmousedown();
					}
				}
			}
		}
		var lis = wm.getElementsByTagName ( 'li' );
		for ( var a = 0; a < lis.length; a++ )
		{
			lis[a].lis = lis;
			lis[a].onmouseover = function ()
			{
				// Open menu
				this.className = 'Open';
				// close all others
				for ( var a = 0; a < this.lis.length; a++ )
				{
					if ( this.lis[a] != this ) this.lis[a].className = '';
				}
				// Open parents
				var d = this;
				while ( d.nodeName != 'DIV' )
				{
					d = d.parentNode;
					if ( d.nodeName == 'LI' )
						d.className = 'Open';
				}
			}
			if( mode == 'onmousedown' )
			{
				lis[a].onmousedown = lis[a].onmouseover;
			}
		}
	}
}
// Close the open menus
function closeWorkbenchMenu()
{
	if( !window.isMobile )
	{
		var e = ge( 'WorkbenchMenu' );
		if( !e ) return;
		e.isActivated = false;
		var els = e.getElementsByTagName( 'div' );
		for( var a = 0; a < els.length; a++ )
		{
			if( HasClass( els[a], 'Open' ) && HasClass( els[a], 'Menu' ) )
			{
				els[a].className = 'Menu';
			}
			else if(
				( 
					HasClass( els[a].parentNode, 'Menu' ) || 
					HasClass( els[a].parentNode.parentNode, 'Menu' ) 
				) 
				&& els[a].className == 'Open'
			)
			{
				els[a].className = '';
			}
		}
	}
	
	// Remove them!
	removeWindowPopupMenus();
	
	ExposeWindows();
	ExposeScreens();
}

function hideWorkbenchMenu ( e )
{
	if( !e ) e = window.event;
	if( ge( 'WorkbenchMenu' ) )
	{
		var t = e.target ? e.target : e.srcElement;
		if ( t && t.getAttribute ( 'onclick' ) )
		{
			t.onclick ();
		}
		var divs = ge ( 'WorkbenchMenu' ).getElementsByTagName ( 'div' );
		for ( var a = 0; a < divs.length; a++ )
			divs[a].className = 'Menu';
		var lis = ge ( 'WorkbenchMenu' ).getElementsByTagName ( 'li' );
		for ( var a = 0; a < lis.length; a++ )
			lis[a].className = '';
		ge ( 'WorkbenchMenu' ).style.display = 'none';
	}
	
	// Popup menu close
	removeWindowPopupMenus();
	
	// Let it go
	ExposeWindows();
}

function removeWindowPopupMenus()
{
	// Deactivate workbench menu
	if( ge( 'WorkbenchMenu' ) )
		ge( 'WorkbenchMenu' ).isActivated = false;

	for( var a in movableWindows )
	{
		var cm = movableWindows[a];
		if( cm && cm.titleDiv && cm.titleDiv.popup )
		{
			var titl = cm.titleDiv;
			titl.removeChild( titl.popup );
			titl.popup = null;
		}
	}
}

var workbenchMenus = new Array ();
function SetMenuEntries ( menu, entries )
{
	if ( typeof ( workbenchMenus[menu] ) == 'undefined' ) 
		workbenchMenus[menu] = new Array ();
	workbenchMenus[menu].push ( entries );
	if ( typeof ( RefreshWorkbenchMenu ) != 'undefined' )
		RefreshWorkbenchMenu ();
}

// Just register we left the building
movableMouseUp = function ( e )
{
	if( !e ) e = window.event;
	
	window.mouseDown = false;
	window.mouseMoveFunc = false;
	document.body.style.cursor = 'default';
	
	// Execute the release function
	if( window.mouseReleaseFunc )
	{
		window.mouseReleaseFunc();
		window.mouseReleaseFunc = false;
	}
	
	// If we have a current movable window, stop "moving"
	if( window.currentMovable )
	{
		ExposeWindows();
		window.currentMovable.removeAttribute( 'moving' );
	}
	
	// Make sure the inner overlay is over screens
	if( window.currentScreen )
	{
		window.currentScreen.moveoverlay.style.display = 'none';
	}
	
	// Workbench menu is now hidden (only miga style)
	if( Workspace && Workspace.menuMode == 'miga' )
	{
		hideWorkbenchMenu( e );
	}
	
	// If we selected icons, clear the select region
	ClearSelectRegion();
	closeWorkbenchMenu();
	
	// Execute drop function on mousepointer (and stop moving!)
	mousePointer.drop( e );	
	mousePointer.stopMove( e );
}

// Check the screen title of active window
function CheckScreenTitle()
{
	if( !window.currentScreen ) return;
	
	// Set screen title
	var csc = currentScreen.screenObject;
	var wo = currentMovable ? currentMovable.windowObject : false;
	if( wo && wo.applicationName )
	{
		var wnd = wo.applicationName;
		if( !csc.originalTitle )
			csc.originalTitle = csc.getFlag( 'title' );
		csc.setFlag( 'title', wnd );
	}
	else if( csc.originalTitle )
	{
		csc.setFlag( 'title', csc.originalTitle );
	}
	
	// Enable the global menu
	if( Workspace && Workspace.menuMode == 'pear' )
	{
		showWorkbenchMenu();
	}
}

pollingTaskbar = false;
function PollTaskbar( curr )
{
	if ( pollingTaskbar ) return;
	var doorsScreen = ge( 'DoorsScreen' );
	pollingTaskbar = true;
	if( ge( 'Taskbar' ) )
	{
		var whw = 0; // whole width
		var swi = document.body.offsetWidth;
		
		var t = ge( 'Taskbar' );
		
		// When activated normally
		if ( !curr )
		{
			t.innerHTML = '';
			t.tasks = [];
			for ( var a in movableWindows )
			{
				var pn = movableWindows[a];
				if( pn && pn.parentNode != doorsScreen ) continue;
				var found = false;
				for ( var c = 0; c < t.tasks.length; c++ )
				{
					if ( t.tasks[c] == movableWindows[a].windowId )
					{
						found = true;
						break;
					}
				}
				if( found ) continue;
				t.tasks.push ( movableWindows[a].windowId );
				var d = document.createElement ( 'div' );
				d.windowId = movableWindows[a].windowId;
				d.className = movableWindows[a].getAttribute( 'minimized' ) == 'minimized' ? 'Task Hidden' : 'Task';
				d.window = movableWindows[a];
				d.applicationId = d.window.applicationId;
				d.innerHTML = d.window.titleString;
				d.onmouseup = function( e, extarg )
				{
					if ( !e ) e = window.event;
					var targ = e ? ( e.target ? e.target : e.srcElement ) : false;
					if( extarg ) targ = extarg;
					var divs = this.parentNode.getElementsByTagName ( 'div' );
					for ( var b = 0; b < divs.length; b++ )
					{
						if ( divs[b].className.indexOf ( 'Task' ) < 0 ) continue;
						if ( divs[b] == this )
						{
							if ( divs[b].className.indexOf ( 'Task Active' ) == 0 )
							{
								if ( targ && targ.className && targ.className.indexOf ( 'Task Active' ) == 0 )
								{
									var w = divs[b].window;
									if( w.getAttribute( 'minimized' ) == 'minimized' )
									{
										w.setAttribute( 'minimized', '' )
										targ.className = 'Task Active';
									}
									else 
									{
										w.setAttribute( 'minimized', 'minimized' );
										targ.className = 'Task Active Hidden';
									}
								}
							}
							else
							{
								if ( targ && targ.className && targ.className.indexOf ( 'Task' ) == 0 )
								{
									divs[b].window.setAttribute( 'minimized', '' );
								}
								divs[b].className = 'Task Active';
								_ActivateWindow ( divs[b].window, 1 );
								if ( targ && targ.className && targ.className.indexOf ( 'Task' ) == 0 )
									_WindowToFront ( divs[b].window );
							}
						}
						else
						{
							divs[b].className = divs[b].className.indexOf ( 'Hidden' ) > 0 ? 'Task Hidden' : 'Task';
						}
					}
				}
				t.appendChild( d );
				d.origWidth = d.offsetWidth + 20;
				
				// Check if we opened a window
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
		
		// When activating on the window
		var isFull = ge( 'Taskbar' ).getAttribute( 'full' ) == 'full';
		var divs = t.getElementsByTagName ( 'div' );
		for ( var b = 0; b < divs.length; b++ )
		{
			if( divs[b].className.indexOf ( 'Task' ) < 0 ) continue;
			if( !isFull ) divs[b].origWidth = divs[b].offsetWidth;
			whw += divs[b].origWidth + 20; // todo calc size
			if ( divs[b].window == curr )
			{
				divs[b].onmouseup();
			}
		}
		// Can't 
		if( whw >= swi )
		{
			ge( 'Taskbar' ).setAttribute( 'full', 'full' );
		}
		// We deleted some
		else
		{
			ge( 'Taskbar' ).setAttribute( 'full', 'no' );
		}	
	}
	pollingTaskbar = false;
}

function PollTray()
{
	if( !ge( 'Tray' ) )
		return;
	// TODO: Do this dynamically
	var s = ge( 'Tray' ).getElementsByTagName( 'div' );
	var mic = false;
	for( var a = 0; a < s.length; a++ )
	{
		if( !s[a].className ) continue;
		if( s[a].className.indexOf( 'Microphone' ) == 0 )
			mic = s[a];
	}
	mic.onclick = function()
	{
		if( Doors.handsFree )
		{
			var btn = Doors.handsFree.getElementsByClassName( 'si-btn' )[0];
			if( btn.recognition ) btn.recognition.stop();
			Doors.handsFree.parentNode.removeChild( Doors.handsFree );
			Doors.handsFree = false;
			return;
		}
		var f = new File( 'System:templates/handsfree.html' );
		f.onLoad = function( data )
		{
			var d = document.createElement( 'div' );
			d.id = 'Handsfree';
			d.innerHTML = data;
			document.body.insertBefore( d, document.body.firstChild );
			Doors.handsFree = d;
			
			// For other browsers
			if ( !( 'webkitSpeechRecognition' in window ) )
			{
				var inp = ge( 'Handsfree' ).getElementsByTagName( 'input' )[0];
				inp.focus();
				return;
			}
			else
			{
				setTimeout( function( e )
				{
					var dv = ge( 'Handsfree' ).getElementsByTagName( 'button' )[0];
					dv.onclick = function( e )
					{
						return cancelBubble( e );
					}
					dv.click();
				}, 100 );
				// Remove it
				d.onclick = function()
				{
					mic.onclick();
					var stopper = ge( 'Tray' ).getElementsByClassName( 'Microphone' );
					if( stopper.length ) stopper = stopper[0];
					if( stopper )
					{
						stopper.className = 'Microphone IconSmall fa-microphone-slash';
					}
				}
			}
			// For google chrome
			InitSpeechControls( function()
			{
				Say( 'Voice mode started.', false, 'both' );
			} );
		}
		f.load();
	}
}

function ClearSelectRegion ()
{
	if ( ge ( 'RegionSelector' ) )
	{
		var s = ge ( 'RegionSelector' );
		s.parentNode.removeChild ( s );
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
	
	// Menu trigger
	var rc = 0;
	if ( e.which ) rc = ( e.which == 3 );
	else if ( e.button ) rc = ( e.button == 2 );
	
	// TODO: Allow context menus!
	if ( rc || e.button != 0 ) 
		return cancelBubble ( e );
	
	var sh = e.shiftKey || e.ctrlKey;
	
	// Get target
	var tar = e.srcElement ? e.srcElement : e.target;
	
	// Zero scroll
	window.regionScrollLeft = 0;
	window.regionScrollTop = 0;
	
	// Clicking inside content
	if ( tar.className == 'Scroller' && tar.parentNode.className == 'Content' )
	{
		tar = tar.parentNode;
	}
	// Desktop selection
	if ( tar.className == 'ScreenContent' )
	{
		if ( !sh ) clearRegionIcons ();
		window.mouseDown = 4;
		window.regionX = windowMouseX;
		window.regionY = windowMouseY;
		window.regionWindow = tar;
		FocusOnNothing();
		removeWindowPopupMenus();
		return cancelBubble ( e );
	}
	// Making selection on content window!
	else if ( tar.className == 'Content' && tar.parentNode.className.indexOf ( 'View' ) >= 0 )
	{
		if ( !sh ) clearRegionIcons ();
		window.mouseDown = 4;
		window.regionX = windowMouseX;
		window.regionY = windowMouseY;
		window.regionWindow = tar;
		removeWindowPopupMenus();
		return cancelBubble ( e );
	}
}

function clearRegionIcons()
{
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
				ic.className = ic.className.split ( ' Selected' ).join ( '' );
			}
		}
	}
	// Clear desktop icons
	if( Doors.screen && Doors.screen.contentDiv.icons )
	{
		for ( var a = 0; a < Doors.screen.contentDiv.icons.length; a++ )
		{
			var ic = Doors.screen.contentDiv.icons[a].domNode;
			ic.className = ic.className.split ( ' Selected' ).join ( '' );
		}
	}
}

function contextMenu( e )
{
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
		tar.className == 'ScreenContent' || 
		windowMouseY < (mdl?mdl.offsetHeight:0) || 
		( tar.className == 'Content' && mov ) ||
		( tar.className == 'Title' && mov ) ||
		( tar.parentNode.className == 'Title' && mov2 ) ||
		( tar.className == 'MoveOverlay' && mov ) ||
		( tar.className == 'Resize' && mov ) ||
		( tar.parentNode.parentNode && tar.parentNode.parentNode.className == 'Title' && mov3 )
	)
	{
		window.mouseDown = false;
		showWorkbenchMenu();
	}
	return cancelBubble ( e );
}

function FixWindowDimensions ( mw )
{
	SetWindowFlag ( mw, 'min-height', mw.parentNode.offsetHeight );
	SetWindowFlag ( mw, 'max-height', mw.parentNode.offsetHeight );
	SetWindowFlag ( mw, 'min-width', mw.parentNode.offsetWidth );
	SetWindowFlag ( mw, 'max-width', mw.parentNode.offsetWidth );
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
	if ( document.attachEvent )
		document.attachEvent ( 'onmousemove', movableListener, false );
	else window.addEventListener ( 'mousemove', movableListener, false );
	if ( document.attachEvent )
		document.attachEvent ( 'onresize', movableListener, false );
	else window.addEventListener ( 'resize', movableListener, false );

	if ( document.attachEvent )
		document.attachEvent ( 'onmouseup', movableMouseUp, false );
	else window.addEventListener ( 'mouseup', movableMouseUp, false );

	if ( document.attachEvent )
		document.attachEvent ( 'onmousedown', movableMouseDown, false );
	else window.addEventListener ( 'mousedown', movableMouseDown, false );

	if ( document.attachEvent )
		document.attachEvent ( 'oncontextmenu', contextMenu, false );
	else window.addEventListener ( 'contextmenu', contextMenu, false );
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

// Generates menu html
function GenerateMenu( menudiv, menuItems, depth, appid )
{
	if ( !depth ) 
		depth = 0;
	
	// Don't assign the same array twice!
	if( menudiv.menu != menuItems ) menudiv.menu = menuItems; else return;
	
	if ( depth == 0 ) menudiv.innerHTML = '';
	for ( var i in menuItems )
	{
		var d = menudiv;
		if ( depth == 0 )
		{
			var n = document.createElement ( 'div' );
			n.className = 'Menu';
			n.innerHTML = menuItems[i].name;
			d.appendChild ( n );
			d = n;
		}
		var ul = document.createElement ( 'ul' );
		var depth2 = depth + 1;
		
		// Object members
		if ( menuItems[i].items )
		{
			for ( var j in menuItems[i].items )
			{
				var li = document.createElement( 'li' );
				var it = menuItems[i].items[j];
				
				// A postmessage command
				if( typeof ( it.command ) == 'string' )
				{
					li.command = it.command;
					
					// Sends command to application
					var mode = 'onmouseup';
					li[mode] = function() 
					{
						// Set appid from current movable..
						if( !appid && currentMovable.windowObject && currentMovable.windowObject.applicationId )
							appid = currentMovable.windowObject.applicationId;
							
						if( appid )
						{
							var app = findApplication( appid );
							if( app )
							{
								app.contentWindow.postMessage( JSON.stringify( {
									applicationId: appid,
									command: this.command + ""
								} ), '*' );
								closeWorkbenchMenu();
							}
						}
					};
				}
				// A runnable function
				else if( it.command )
				{
					li.commandMethod = it.command;
					li.onmouseup = function( e ){ this.commandMethod( e ); closeWorkbenchMenu(); }
				}
				if ( it.items )
				{
					li.innerHTML = it.name;
					GenerateMenu ( li, [ it ], depth2, appid );
				}
				else if ( it.itemsHTML )
				{
					li.innerHTML = it.itemsHTML;
				}
				else if( typeof( it.divider ) != 'undefined' )
				{
					li.setAttribute( 'divider', 'divider' );
				}
				else
				{ 
					li.innerHTML = '<span>' + it.name + '</span>';
					li.onmousemove = function()
					{
						ClearMenuItemStyling( menudiv );
						this.getElementsByTagName( 'span' )[0].className = 'Active';
					}
				}
				ul.appendChild ( li );
			}
		}
		// Static members
		else if ( menuItems[i].itemsHTML )
		{
			ul.innerHTML = menuItems[i].itemsHTML;
		}
		d.appendChild ( ul );
	}
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
	_DeactivateWindows();
	
	setTimeout(	function()
	{
		var field = ge( 'FocusRelease' );
		if( !field )
		{
			field = document.createElement( 'input' );
			field.id = 'FocusRelease';
			field.setAttribute( 'type', 'text' );
			field.setAttribute( 'style', 'position: absolute; top: -40px; opacity: 1; visibility: visible; -webkit-user-modify: read-write-plaintext-only; left: 0px;' );
			document.body.appendChild( field );
		}
		field.onfocus = function()
		{
			//this timeout of 200ms is nessasary for Android 2.3.x
			setTimeout( function()
			{
				field.blur();
				field.setAttribute( 'style', 'display: none;' );
				setTimeout( function()
				{
					document.body.removeChild( field );
					document.body.focus();
				}, 14 );
			}, 200 );
		};
		setTimeout( function()
		{
			field.focus();
		}, 14 );
	}, 50);
}

// Alert box, blocking a window
function AlertBox( title, desc, buttons, win )
{
	// New view
	var w = new View( {
		title: title,
		width: 380,
		height: 200
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

