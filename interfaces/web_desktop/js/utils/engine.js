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

// Get elements or an element by id
ge = function( el )
{
	switch( typeof ( el ) )
	{
		case 'string':
			if( el.substr ( 0, 1 ) == '#' )
				return document.getElementById( el.substr ( 1, el.length - 1 ) );
			else if( el.substr ( 0, 1 ) == '.' )
			{
				var elements = document.getElementsByTagName( '*' );
				var out = new Array();
				var cl = el.split( '.' ).join( '' );
				for( var a = 0; a < elements.length; a++ )
				{
					if( !elements[a].className.split ) continue;
					var classes = elements[a].className.split( ' ' );
					for( var b = 0; b < classes.length; b++ )
					{
						if( classes[b] == cl )
						{
							out.push( elements[a] );
							break;
						}
					}
				}
				return out;
			}
			return document.getElementById( el );
		case 'array':
			var r = new Array();
			for( var a in el )
			{
				var t = document.getElementById( el[a] );
				if( t ) r.push( t );
			}
			return r;
		case 'object':
			if( el.nodeName )
				return el;
			return false;
		default:
			return false;
	}			
}

//
var i18n_translations = new Array ();
var SEPARATOR = '<!-- separate -->';

// Get an element by id
function Ge ( ele )
{
	var e = document.getElementById ( ele );
	if ( e ) return e;
	return false;
}

// Get elements by name
function GeByName ( nm, el )
{
	var out = new Array ();
	if ( !el ) el = document;
	var eles = el.getElementsByTagName ( '*' );
	for ( var a = 0; a < eles.length; a++ )
		if ( eles[a].name == nm )
			out.push ( eles[a] );
	return out.length == 1 ? out[0] : out;
}

function GetElementTop ( ele )
{
	var top = 0;
	do
	{
		var t = parseInt ( ele.offsetTop );
		if ( !isNaN ( t ) && t >= 0 ) top += t;
		ele = ele.offsetParent;
	}
	while ( ele && ele != document.body  )
	return top;
}

function GetElementLeft ( ele )
{
	var left = 0;
	do
	{
		var t = parseInt ( ele.offsetLeft );
		if ( !isNaN ( t ) && t >= 0 ) left += t;
		ele = ele.offsetParent;
	}
	while ( ele && ele != document.body  )
	return left;
}

// See if an element has a class
function HasClass( ele, className )
{
	var cls = ele.className ? ele.className.split( ' ' ) : false;
	if ( !cls ) return false;
	for ( var a = 0; a < cls.length; a++ )
		if ( cls[a] == className ) return true;
	return false;
}

// Get elements by class name
function GeByClass ( nm, el )
{
	var out = new Array ();
	var eles = document.getElementsByTagName ( '*' );
	for ( var a = 0; a < eles.length; a++ )
	{
		if ( eles[a].className == nm )
		{
			var belongstoel = false;
			if ( el )
			{
				var e = eles[a];
				while ( e != document.body )
				{
					if ( e == el ) 
					{
						belongstoel = true;
						break;
					}
					e = e.parentNode;
				}
			} else belongstoel = true;
			if ( belongstoel )
				out.push ( eles[a] );
		}
	}
	return out.length == 1 ? out[0] : out;
}

// Generate a unique id
function UniqueId ()
{
	var el;
	do
	{
		el = 'element_' + Math.floor ( (Math.random() * 1000) + (Math.random() * 1000) );
	}
	while ( Ge ( el ) );
	return el;
}

// set a cookie
function SetCookie ( key, value, expiry )
{
	var t = new Date ();
	if ( !expiry ) expiry = 1;
	expiry = new Date( t.getTime() + ( expiry*1000*60*60*24 ) );
	document.cookie = key + '=' + escape ( value ) + ';expires='+expiry.toGMTString();
}
function DelCookie ( key ) { document.cookie = key + '=;'; }

// get a cookie
function GetCookie ( key )
{
	if ( !key ) return;
	var c = document.cookie.split ( ';' );
	for ( var a = 0; a < c.length; a++ )
	{
		c[a] = c[a].split ( /^\s+|\s+$/g ).join ( '' ); // rm whitespace
		var v = c[a].split ( '=' );
		if ( v[0] == key )
		{
			return unescape ( v[1] );
		}
	}
}

// Set opacity on an element
function SetOpacity ( element, opacity )
{
	if ( !element ) return;
	if ( 
		navigator.userAgent.indexOf ( 'MSIE' ) >= 0 &&
		navigator.userAgent.indexOf ( 'MSIE 9' ) < 0 &&
		navigator.userAgent.indexOf ( 'MSIE 10' ) < 0
	) 
	{
		if ( opacity == 1 ) element.style.filter = null;
		else element.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(Opacity='+Math.round(opacity*100)+')';
	}
	else element.style.opacity = opacity;
}

// Get data through an ajax query
function GetByAjax ( url, execfunc )
{
	var client = new XMLHttpRequest ();
	client.loadfunc = execfunc ? execfunc : false;
	client.onreadystatechange = function ()
	{
		if ( this.readyState == 4 )
		{
			if ( this.loadfunc != false )
				this.loadfunc ();
		}
	}
	client.open ( 'POST', url );
	client.send ();
}

// Make sure the objs are in array form
function MakeArray ( objs )
{
	if ( objs.length >= 1 ) return objs;
	return [ objs ];
}

// Get a translated string
function i18n ( string )
{
	if ( i18n_translations[string] )
		return i18n_translations[string];
	if ( typeof ( translations ) != 'undefined' )
		if ( translations[string] )
			return translations[string];
	return string; 
}

function i18nAddPath( path )
{
	var j = new cAjax();
	j.open( 'get', path, true );
	j.onload = function()
	{
		var s = this.responseText().split( "\n" );
		for( var a = 0; a < s.length; a++ )
		{
			var p = s[a].split( ":" );
			if( Trim( p[0] ).length && Trim( p[1] ).length )
			{
				i18n_translations[Trim( p[0] )] = Trim( p[1] );
			}
		}
	}
	j.send();
}

// Alter Div Contents
function AlterDivContents ( element, string, spd )
{
	if ( !spd ) spd = 10;
	else if ( spd > 100 ) spd = 100;
	// Make sure element has id
	if ( !element.id )
	{
		var base = 'ele';
		var sugg_id = '';
		do
		{ sugg_id = base + '_' + Math.floor ( Math.random() * 999 ); }
		while ( Ge ( base ) );
		element.id = sigg_id;
	}
	// Reset vars
	element._phase = element.innerHTML.length > 0 ? 0 : 100; element._data = string;
	element._int = 0; element._speed = spd;
	element._dataShown = false;
	// The actual fade code
	element._brain = function ()
	{
		if ( this._phase < 200 )
		{
			if ( this._phase <= 100 )
				SetOpacity ( this, ( 100 - this._phase ) / 100 );
			else
			{
				if ( !this._dataShown )
				{
					this._dataShown = true;
					this.innerHTML = this._data;
				}
				SetOpacity ( this, ( this._phase - 100 ) / 100 );
			}
			this._phase += this._speed;
		}
		else
		{
			SetOpacity ( this, 1 ); clearInterval ( this._int );
		}
	}
	// Initialize fade
	element._int = setInterval ( 'Ge(\''+element.id+'\')._brain()', 25 );
}

function StrPad ( num, len, ch )
{
	var number = num + "";
	var out = '';
	for ( var a = 0; a < len; a++ )
	{
		if ( len - a > number.length )
			out += ch;
		else out += number.substr ( a - len, 1 );
	}
	return out;
}

function ShowDialog ( width, url, func, endfunc )
{
	var d, bg;
	if ( !( d = Ge ( 'Dialog' ) ) )
	{
		bg = document.createElement ( 'div' );
		bg.id = 'DialogBackground';
		bg.onmousedown = function () { return false; }
		Ge ( 'Empty' ).appendChild ( bg );
		d = document.createElement ( 'div' );
		d.id = 'Dialog';
		Ge ( 'Empty' ).appendChild ( d );
		d.bg = bg;
	}
	else bg = d.bg;
	bg.style.zIndex = 100; 			bg.style.opacity = 0; 
	bg.style.display = '';			bg.style.background = '#000000'; 	
	bg.style.position = 'fixed'; 	bg.style.top = '0px';
	bg.style.left = '0px';			bg.style.width = '100%'; 			
	bg.style.height = '100%';		d.style.zIndex = 101;
	bg.style.filter = 'alpha(opacity=60)';
	
	d.style.opacity = 0;			d.style.display = '';
	d.style.boxShadow = '0px 3px 15px rgba(0,0,0,0.4)';
	d.style.webkitBoxShadow = '0px 3px 15px rgba(0,0,0,0.4)';
	d.style.mozBoxShadow = '0px 3px 15px rgba(0,0,0,0.4)';
	d.style.width = Math.floor ( width ) + 'px';
	d.style.left = Math.floor ( GetWindowWidth() * 0.5 - ( width * 0.5 ) ) + 'px';
	d.style.top = Math.floor ( GetWindowHeight() * 0.5 - ( d.offsetHeight * 0.5 ) ) + 'px';
	d.style.visibility = 'hidden';
	d.op = 0; d.func = null;
	d._time = 0;
	d.endfunc = endfunc;
	
	document.body.style.overflow = 'hidden';
	
	d.fadeIn = function ( init )
	{
		if ( init ) 
		{ 
			if ( this.interval ) clearInterval ( this.interval );
			this.interval = setInterval ( 'ge(\'' + this.id + '\').fadeIn()', 25 );
			this._time = 0;
			this.style.visibility = 'visible';
		}
		if ( this._time == 0 ) this._time = ( new Date () ).getTime ();
		this.op = (( new Date () ).getTime () - this._time) / 250 * 1;
		if ( this.op >= 1 )
		{
			this.op = 1;
			clearInterval ( this.interval );
			if ( this.endfunc ) this.endfunc ();
		}
		SetOpacity ( this, this.op );
		if ( window.addEventListener )
			SetOpacity ( this.bg, this.op * 0.5 );
	}
	d.fadeOut = function ( init )
	{
		if ( init ) 
		{ 
			if ( this.interval ) clearInterval ( this.interval );
			this.interval = setInterval ( 'ge(\'' + this.id + '\').fadeOut()', 25 );
			this._time = 0;
		}
		if ( this._time == 0 ) this._time = ( new Date () ).getTime ();
		this.op = (( new Date () ).getTime () - this._time) / 250 * 1;
		if ( this.op >= 1 )
		{
			this.op = 1;
			clearInterval ( this.interval );
			if ( this.func ) this.func();
		}
		SetOpacity ( this, 1-this.op );
		SetOpacity ( this.bg, (1-this.op) * 0.5 );
	}
	GetByAjax ( 
		url, function () 
		{ 
			d.innerHTML = '<div class="Box">' + this.responseText + '</div>'; 
			d.style.top = Math.floor ( GetWindowHeight() * 0.5 - ( d.offsetHeight * 0.5 ) ) + 'px';
			d.fadeIn ( true );
		} 
	);
}

function HideDialog ( )
{
	var d = ge ( 'Dialog' );
	if ( d )
	{
		d.func = function () 
		{ 
			this.bg.style.display = 'none'; this.style.display = 'none';
			this.parentNode.removeChild ( this );
		}		
		ge(d.id).fadeOut(1);
		document.body.style.overflow = 'auto';
	}
}

var _GuiOpenPopups = new Array ();
function ShowPopup ( width, url, func )
{
	var j = new cAjax ();
	j.open ( 'post', url, true );
	j.w = width;
	j.onload = function ()
	{
		var r = this.responseText ().split ( '<!--separate-->' );
		if ( r[0] == 'ok' )
		{
			var p = document.createElement ( 'div' );
			p.className = 'GuiPopup';
			p.innerHTML = '<div class="Center"><div><div>' + r[1] + '</div></div></div>';
			document.body.appendChild ( p );
			p.firstChild.firstChild.style.left = Math.floor ( 0 - ( this.w * 0.5 ) ) + 'px';
			p.firstChild.firstChild.style.top = Math.floor ( 0 - ( 300 * 0.5 ) ) + 'px';
			_GuiOpenPopups.push ( p );
		}
	}
	j.send ();
}

function RefreshPopup ( width, url, func )
{
	if ( !_GuiOpenPopups.length ) 
	{
		return ShowPopup ( width, url, func );
	}
	else
	{
		var j = new cAjax ();
		j.open ( 'post', url, true );
		j.w = width;
		j.onload = function ()
		{
			var r = this.responseText ().split ( '<!--separate-->' );
			if ( r[0] == 'ok' )
			{
				var p = _GuiOpenPopups[ _GuiOpenPopups.length - 1 ];
				p.innerHTML = '<div class="Center"><div><div>' + r[1] + '</div></div></div>';
				p.firstChild.firstChild.style.left = Math.floor ( 0 - ( this.w * 0.5 ) ) + 'px';
				p.firstChild.firstChild.style.top = Math.floor ( 0 - ( 300 * 0.5 ) ) + 'px';
			}
		}
		j.send ();
	}
}

function HidePopup ()
{
	var o = new Array ();
	var l = _GuiOpenPopups.length;
	for ( var a = 0; a < l - 1; a++ )
	{
		o.push ( _GuiOpenPopups );
	}
	_GuiOpenPopups[l-1].parentNode.removeChild ( _GuiOpenPopups[l-1] );
	_GuiOpenPopups = o;
}

/*
from inkassohjelpen
function numberExtract ( num )
{
	var innum = num; num += "";
	
	// We have both , and .
	if ( num.indexOf ( ',' ) >= 0 && num.indexOf ( '.' ) >= 0 )
	{
		// dot is comma
		if ( num.indexOf ( '.' ) > num.indexOf ( ',' ) )
		{
			num = num.split ( ',' ).join ( '' );
			num = num.split ( '.' );
		}
		// comma is comma
		else
		{
			num = num.split ( '.' ).join ( '' );
			num = num.split ( ',' );
		}
	}
	// Only split on comma
	else if ( num.indexOf ( ',' ) >= 0 )
	{
		num = num.split ( ',' );
	}
	// Only split on dot
	else if ( num.indexOf ( '.' ) >= 0 )
	{
		num = num.split ( '.' );
	}
	// No decimal
	else num = [ num, '0' ];
	
	// If we have no number, make it
	if ( !num[0] ) num[0] = '0';
		
	// Convert to number
	num = parseFloat ( num[0] + '.' + num[1] );
	return num;
}*/

// Add intrest to a value in a month period
function AddIntrest ( value, intrest, datefrom, dateto )
{
	var df = datefrom.split ( '-' );
	var dt = dateto.split ( '-' );
	var dn = df[2]; var mn = df[1]; var yn = df[0];
	while ( mn++ != dt[1] && yn != dt[2] )
	{
		if ( mn > 12 ){ mn = 1; yn++ }
		// Add cumulnative intrest
		value += value * intrest;
	}
	return value;
}

// For use with autocomplete fields
function ActivateAutocomplete ( ele, completeurl )
{
	ele.onkeyup = function ()
	{
		getByAjax ( completeurl, function ()
		{
			var d = document.createElement ( 'div' );
			d.className = 'AutocompletePopup';
			ele.parentNode.appendChild ( d );
			d.style.position = 'absolute';
			ele.style.top = (ele.offsetTop + 32)+'px';
			ele.style.left = (ele.offsetLeft)+'px';
			ele.style.width = (ele.offsetWidth)+'px';
			ele.innerHTML = this.responseText;
			d.onclick = function () { this.parentNode.removeChild ( this );	}
		} );
	}
}

// Include a javascript source and eval it globally
function Include ( url )
{
	var ele = document.createElement ( "script" );
	ele.type = "text/javascript";
	ele.src = url;
	document.body.appendChild ( ele );
}

// Add several events on each event type
var _events = new Array ();

function TriggerEvent ( eventName, object )
{
	var event;
	if ( document.createEvent )
	{
		event = document.createEvent ( 'HTMLEvents' );
		event.initEvent ( eventName, true, true );
	} 
	else 
	{
		event = document.createEventObject ();
		event.eventType = eventName;
	}

	event.eventName = eventName;

	if ( document.createEvent ) 
	{
		object.dispatchEvent(event);
	} 
	else 
	{
		object.fireEvent( 'on' + event.eventType, event );
	}
}

// Add an event with type 'onmousemove', function, then dom element (or false)
function AddEvent( type, func, ele )
{	
	if ( !_events[type] ) _events[type] = [];
	
	var obj = ele ? ele : window;
	
	_events[type].push( { func: func, ele: obj } );
	
	if( obj.attachEvent ) obj.attachEvent( type, func, false );
	else obj.addEventListener( type.substr ( 2, type.length - 2 ), func, false );
	return func;
}
// Removes an event from the event pool
function DelEvent( func )
{
	var success = false;
	for( a in _events )
	{
		var out = [];
		for( b in _events[a] )
		{
			if( func != _events[a][b].func )
			{
				out.push ( _events[a][b] );
			}
			else
			{
				if( _events[a][b].ele.detachEvent )
					_events[a][b].ele.detachEvent( a, func );
				else _events[a][b].ele.removeEventListener ( a.substr ( 2, a.length - 2 ), func );
				success = true;
			}
		}
		_events[a] = out;
	}
	return success;
}

// Selection an option in a select element by value
function SelectOption( selectElement, value )
{
	var opts = selectElement.getElementsByTagName( 'option' );
	if( isNaN( value ) )
	{
		for( var a = 0; a < opts.length; a++ )
		{
			if( opts[a].value == value )
			{
				opts[a].selected = 'selected';
			}
			else opts[a].selected = '';
		}
	}
	// Numeric
	else
	{
		for( var a = 0; a < opts.length; a++ )
		{
			if( a == value )
			{
				opts[a].selected = 'selected';
			}
			else opts[a].selected = '';
		}
	}
}

function Trim ( string )
{
	string = ( string + "" );
	var out = '';
	var start = true;
	for ( var a = 0; a < string.length; a++ )
	{
		var letter = string.substr ( a, 1 );
		var wspace = letter == ' ' || 
			letter == '\t' || 
			letter == '\n' || 
			letter == '\r';
		if ( wspace && start )
			continue;
		else start = false;
		if ( !start )
			out += letter;
	}
	var end = true;
	string = out; out = '';
	for ( var a = string.length-1; a >= 0; a-- )
	{
		var letter = string.substr ( a, 1 );
		var wspace = letter == ' ' || 
			letter == '\t' || 
			letter == '\n' || 
			letter == '\r';
		if ( wspace && end )
			continue;
		else end = false;
		if ( !end )
			out = letter + out;
	}
	string = out;
	return string;
}

// Extract a number from the string
function NumberExtract ( string )
{
	string = Trim ( string ).split ( ' ' ).join ( '' );
	var dot = string.indexOf ( '.' );
	var com = string.indexOf ( ',' );
	if ( dot >= 0 && com >= 0 )
	{
		if ( com > dot )
		{
			string = string.split ( '.' ).join ( '' );
			string = string.split ( ',' ).join ( '.' );
		}
		else 
		{
			string = string.split ( ',' ).join ( '' );
		}
	}
	else if ( com >= 0 )
	{
		string = string.split ( ',' ).join ( '.' );
	}
	return parseFloat ( string );
}

// Easy tweener function that lets you 
var __m_seed = 1;
function mTween ( obj, time, func, endfunc )
{
	// Setup
	if ( !obj )
	{
		if ( !this ) return;
		var p = ( new Date () ).getTime () - this.ph;
		this.val = p / this.t;
		if ( this.val > 1 ) this.val = 1;
		if ( this.func ) this.func ();
		if ( this.val == 1 )
		{
			clearInterval ( this.intr ); this.intr = false;
			if ( this.endfunc )
			{
				if ( this.endfunc == 'destroy' )
					this.parentNode.removeChild ( this );
				else this.endfunc();
			}
		}
		return;
	}
	if ( !obj.id ) obj.id = 'mtween_' + __m_seed++;
	if ( !obj.intr )
	{
		obj.ph = ( new Date () ).getTime ();
		obj.val = 0;
		obj.t = time;
		obj.func = func;
		obj.endfunc = endfunc;
		obj.mTween = mTween;
		obj.intr = setInterval ( 'ge(\'' + obj.id + '\').mTween()', 15 );
	}
}

function NumberFormat ( string, decimals )
{
	if ( !decimals ) decimals = 2;
	var decimalsliteral = ''; for ( var a = 0; a < decimals; a++ ) decimalsliteral += '0';
	string = NumberExtract ( string );
	var num = ( string + "" ).split ( '.' );
	var dec = num.length > 1 ? num[1] : decimalsliteral; while ( dec.length < decimals ) dec += "0";
	var num = num[0];
	var out = ''; var i = 0;
	for ( var a = num.length-1; a >= 0; a-- )
	{
		out = num.substr( a, 1 ) + out;
		if ( i++ == 2 ) out = '.' + out;
	}
	string = out + "," + dec;
	if ( string.substr ( 0, 1 ) == '.' )
		string = string.substr ( 1, string.length - 1 );
	else if ( string.substr ( 0, 2 ) == '-.' )
		string = '-' + string.substr ( 2, string.length - 2 );
	return string;
}

function GetElementTop ( ele )
{
	var t = ele.offsetTop;
	while ( ele.offsetParent && ele.offsetParent != document.body )
	{
		t += ele.offsetTop;
		ele = ele.offsetParent;
	}
	return t;
}

function GetElementLeft ( ele )
{
	var l = ele.offsetLeft;
	while ( ele.offsetParent && ele.offsetParent != document.body )
	{
		l += ele.offsetLeft;
		ele = ele.offsetParent;
	}
	return l;
}

function GetWindowWidth ( )
{
	if ( typeof ( window.innerWidth ) == 'number' ) 
	{
	     return window.innerWidth; 
	} 
	else if ( 
		document.documentElement && 
		document.documentElement.clientWidth
	)
	{
	     return document.documentElement.clientWidth; 
	} else if (
		document.body && document.body.clientWidth
	) 
	{
	     return document.body.clientWidth; 
	}
	return false;
}

function GetWindowHeight ( )
{
	if ( typeof ( window.innerHeight ) == 'number' ) 
	{
	     return window.innerHeight; 
	} 
	else if ( 
		document.documentElement && 
		document.documentElement.clientHeight
	)
	{
	     return document.documentElement.clientHeight; 
	} else if ( 
		document.body && document.body.clientHeight
	) 
	{
	     return document.body.clientHeight; 
	}
	return false;
}

function GetScrollPosition ()
{
	// Explorer
	if ( window.attachEvent )
	{
		if ( document.body && document.body.scrollTop )
			return { x: document.body.scrollLeft, y: document.body.scrollTop };
		return { x: document.documentElement.scrollLeft, y: document.documentElement.scrollTop };
	}
	else
	{
		if ( document.scrollTop ) 
			return { x: document.scrollLeft, y: document.scrollTop };
		return { x: window.pageXOffset, y: window.pageYOffset };
	}
}

function GetUrlVar ( vari )
{
	var line = document.location.href.split ( '#' )[0].split ( '?' );
	if ( line.length > 1 )
	{
		line = line[1];
		line = line.split ( '&' );
		for ( var a = 0; a < line.length; a++ )
		{
			var l = line[a].split ( '=' );
			if ( l[0] && l[0] == vari )
				return l[1]
		}
	}
	return '';
}

function ArrayToString ( arr )
{
	var ustr = new Array ();
	for ( var a in arr )
	{
		ustr.push ( a + "\t" + arr[a].split ( "\n" ).join ( "<nl>" ).split ( "\t" ).join ( "<tab>" ) );
	}
	return ustr.join ( "\n" );
}

function StringToArray ( str )
{
	var a = str.split ( "\n" );
	if ( a.length )
	{
		for ( var c in a )
		{
			a[c] = a[c].split ( "\t" );
			if ( a[c].length )
				a[c][1] = a[c][1].split ( "<nl>" ).join ( "\n" ).split ( "<tab>" ).join ( "\t" );
		}
	}
	return a;
}

function ObjectToString ( arr )
{
	var ustr = new Array ();
	for ( var a in arr )
	{
		arr[a] = arr[a]+"";
		ustr.push ( a + "\t" + arr[a].split ( "\n" ).join ( "<nl>" ).split ( "\t" ).join ( "<tab>" ) );
	}
	return ustr.join ( "\n" );
}

function StringToObject ( str )
{
	var a = str.split ( "\n" );
	var o = new Object ();
	if ( a.length )
	{
		for ( var c in a )
		{
			var s = a[c].split ( "\t" );
			if ( s.length )
			{
				o[s[0]] = s[1].split ( "<nl>" ).join ( "\n" ).split ( "<tab>" ).join ( "\t" );
			}
		}
	}
	return o;
}

// Run scripts found in string
function RunScripts( str )
{
	if( !str ) return;
	if ( !str.length ) return;
	var scripts;
	while ( scripts = str.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
	{
		str = str.split ( scripts[0] ).join ( '' );
		eval ( scripts[1] );
	}
}

// Extract scripts and add on dom!
function ActivateScripts( str )
{
	if( !str ) return;
	if ( !str.length ) return;
	var scripts;
	while ( scripts = str.match ( /\<script\>([\w\W]*?)\<\/script\>/i ) )
	{
		str = str.split ( scripts[0] ).join ( '' );
		var s = document.createElement( 'script' );
		s.innerHTML = scripts[1];
		document.body.appendChild( s );
	}
	var out = [];
	while ( scripts = str.match ( /\<script[\s]+src\=\"([^"]*?)\"\>[\s]{0,}\<\/script\>/i ) )
	{
		str = str.split ( scripts[0] ).join ( '' );
		var s = document.createElement( 'script' );
		s.setAttribute( 'src', scripts[1] );
		document.body.appendChild( s );
		out.push( s );
	}
	// Support running application in an included script src
	if( window.applicationStarted == false && out.length > 0 )
	{
		var o = out.length > 1 ? ( out.length - 1 ) : 0;
		out[ o ].onload = function()
		{
			if( !window.applicationStarted )
			{
				if( Application.run )
				{
					window.applicationStarted = true;
					Application.run();
					if( Application.messageQueue )
					{
						var mq = [];
						for( var a = 0; a < Application.messageQueue.length; a++ )
							mq.push( Application.messageQueue[a] );
						Application.messageQueue = false;
						for( var a = 0; a < mq.length; a++ )
						{
							Application.receiveMessage( mq[a] );
							console.log( 'Executing queued event' );
						}
					}
				}
			}
		}
	}
}

function ExecuteScript( str )
{
	eval ( str );
}

// Add a script
function AddScript( scriptsrc )
{
	var h = document.getElementsByTagName ( 'head' )[0];
	var s = h.getElementsByTagName ( 'script' );
	var found = false;
	for ( var a = 0; a < s.length; a++ )
	{
		if ( s[a].src == scriptsrc )
		{
			found = true;
			break;
		}
	}
	if ( !found )
	{
		var sc = document.createElement ( 'script' );
		sc.src = scriptsrc;
		h.appendChild ( sc );
	}
}

function cancelBubble ( ev )
{
	if ( !ev ) ev = window.event;
	if ( !ev ) return false;
	if ( ev.cancelBubble ) ev.cancelBubble();
	if ( ev.stopPropagation ) ev.stopPropagation();
	if ( ev.preventDefault ) ev.preventDefault();				
	return false;
}

function DebugLog( str )
{
	if( typeof console !== "undefined" && console && console.log )
		console.log( p + str );
}

function CorvoImportApp ( filename, description, category, publishedkey, appid )
{
	var desc = [ filename, description, category, publishedkey, appid ];
	ExecuteDirective ( 'installapp', desc.join ( '<!--separate-->' ) );
}

function GetLoadProgress ()
{
	return '<div class="FullWidth" style="padding: 150px 20px 150px 20px; text-align: center; background: #c0c0c0; color: #707070">Loading...</div>';
}

function jsonSafeObject ( o, depth )
{
	if ( !depth ) depth = 0;
	var n = new Object ();
	for ( var a in o )
	{
		if ( typeof ( o[a] ) == 'object' )
		{
			if ( depth > 1 )
			{
				n[a] = null;
			}
			else
			{
				n[a] = jsonSafeObject ( o[a], depth+1 );
			}
		}
		else
		{
			n[a] = o[a];
		}
	}
	return n;
}

// Helpers
function humanFilesize ( bts )
{
	if ( bts > 1000000000000 )
	{
		filesize = ( Math.round ( bts / 1000000000000 * 100 ) / 100 ) + ' tb';
	}
	else if ( bts > 1000000000 )
	{
		filesize = ( Math.round ( bts / 1000000000 * 100 ) / 100 ) + ' gb';
	}
	else if ( bts > 1000000 )
	{
		filesize = ( Math.round ( bts / 1000000 * 100 ) / 100 ) + ' mb';
	}
	else if ( bts > 1000 )
	{
		filesize = ( Math.round ( bts / 1000 * 100 ) / 100 ) + 'kb';
	}
	else
	{
		filesize = bts + 'b';
	}
	return filesize;
}

// Return an array sorted by column, high to low
function sortArray ( array, sortColumn )
{
	if( !array || !array.length ) return false;
	
	// check columns
	if( typeof( sortColumn ) == 'object' )
	{
		var finish = false;
		for( var b = 0; !finish && b < sortColumn.length; b++ )
		{
			for( var a = 0; !finish && a < array.length; a++ )
			{
				if( array[a][sortColumn[b]] )
				{
					sortColumn = sortColumn[b];
					finish = true;
					break;
				}
			}
		}
	}
	
	var out = [];
	
	for ( var a = 0; a < array.length; a++ )
	{
		// make unique key
		var key = array[a][sortColumn];
		var num = 0; var eke = key;
		while ( typeof ( out[eke] ) != 'undefined' ) 
			eke = key + (num++);
		array[a]._key = eke;
		out.push ( eke );
	}
	out.sort ();
	var fin = [];
	for ( var a = 0; a < out.length; a++ )
	{
		for ( var c = 0; c < array.length; c++ )
		{
			if ( array[c]._key == out[a] )
			{
				fin.push ( array[c] );
				
				// It's enough.
				if( fin.length >= array.length )
				{
					a = out.length;
					break;
				}
			}
		}
	}
	return fin;
}

// Generates a number based on string
function stringToNumber ( string )
{
	var num = 0;
	var len = string.length;
	for ( var a = 0; a < len; a++ )
	{
		var val = string.charCodeAt ( a ) / (a+1);
		num += val;
	}
	return num;
}

// Clean a fileInfo structure
function CleanFileinfo( fi )
{
	var o = {};
	for( var a in fi )
	{
		switch( a )
		{
			case 'fileInfo':
			case 'domNode':
			case 'Door':
				break;
			default:
				o[a] = fi[a];
				break;
		}
	}
	return o;
}

/* Base64 encode / decode */
/*
	Usage
	var str = "Hey";
	return Base64.encode( str ); 
*/
var Base64 = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t } }


/* Vertical tabs ------------------------------------------------------------ */

//
// Create a vertical tab list
//
VertTabContainer = function( domElement )
{
	this.dom = domElement;
	this.dom.innerHTML = '';
	this.dom.className = 'VertTabContainer';
	this.tabs = [];
	this.initialized = false;
}
//
// tabObject = {
//     name: "name",
//     label: "Click me",
//     pageDiv: domElement
// };
//
VertTabContainer.prototype.addTab = function( tabObject )
{
	var d = document.createElement( 'div' );
	this.tabs.push( d );
	d.name = tabObject.name;
	d.className = 'VertTab';
	d.innerHTML = '<span>' + tabObject.label + '</span>';
	d.tabs = this.tabs;
	d.pageDiv = tabObject.pageDiv;
	d.pageDiv.className = 'VertTabPage';
	d.onclick = function()
	{
		for( var a = 0; a < this.tabs.length; a++ )
		{
			if( this.tabs[a] != this )
			{
				this.tabs[a].className = 'VertTab';
				this.tabs[a].pageDiv.className = 'VertPage';
			}
		}
		this.className = 'VertTab Active';
		this.pageDiv.className = 'VertPage Active';
	}
	this.dom.appendChild( d );
	if( !this.initialized )
		this.initialize( d );
	else this.initialize( this.initialized );
}
//
// just initialize
// 
VertTabContainer.prototype.initialize = function( ele )
{
	this.initialized = ele ? ele : tabs[0];
	if( ele ) ele.click();
	else this.tabs[0].click();
}

/* Standard tabs ------------------------------------------------------------ */

// Initializes tab system on the subsequent divs one level under parent div
function InitTabs ( pdiv )
{
	if( typeof( pdiv ) == 'string' )
		pdiv = ge( pdiv );
		
	var divs = pdiv.getElementsByTagName ( 'div' );
	var tabs = new Array ();
	var pages = new Array ();
	var active = 0;
	for ( var a = 0; a < divs.length; a++ )
	{
		if ( divs[a].parentNode != pdiv ) continue;
		if ( divs[a].className == 'Tab' )
		{
			tabs.push ( divs[a] );
			divs[a].pdiv = pdiv;
			divs[a].tabs = tabs; 
			divs[a].pages = pages;
			divs[a].index = tabs.length - 1;
			divs[a].onclick = function ()
			{
				SetCookie ( 'Tabs'+this.pdiv.id, this.index );
				this.className = 'TabActive';
				var ind;
				for ( var b = 0; b < this.tabs.length; b++ )
				{
					if ( this.tabs[b] != this )
						this.tabs[b].className = 'Tab';
					else ind = b;
				}
				for ( var b = 0; b < this.pages.length; b++ )
				{
					if ( b != ind )
					{
						this.pages[b].className = 'Page';
					}
					else 
					{
						this.pages[b].className = 'PageActive';
						if ( navigator.userAgent.indexOf ( 'MSIE' ) > 0 )
						{
							this.pages[b].style.display = 'none';
							var idz = 1;
							if ( !this.pages[b].id )
							{
								var bs = 'page';
								idz++;
								while ( ge ( bs ) )
									bs = [ bs, idz ].join ( '' );
								this.pages[b].id = bs;
							}
							var bid = this.pages[b].id;
							setTimeout ( 'ge(\'' + bid + '\').style.display = \'\'', 50 );
						}
					}
				}
				if ( typeof ( AutoResizeWindow ) != 'undefined' )
				{
					var pdiv = this.pdiv;
					while ( pdiv.className.indexOf ( ' View' ) < 0 && pdiv != document.body )
						pdiv = pdiv.parentNode;
					if ( pdiv != document.body && pdiv.autoResize == true )
						AutoResizeWindow ( pdiv );
				}
			}
			if ( GetCookie ( 'Tabs'+pdiv.id ) == divs[a].index )
			{
				active = divs[a].index;
			}
		}
		else if ( divs[a].className.substr ( 0, 4 ) == 'Page' )
		{
			divs[a].className = 'Page';
			pages.push ( divs[a] );
		}
	}
	tabs[active].onclick();
}

// Double click simulator for youch
function touchDoubleClick( element, callback, e )
{
	if( !element.touchClickCount )
	{
		element.touchClickCount = 1;
	}
	else
	{
		element.touchClickCount = false;
		callback( element, e );
	}
	// Simulate timeout between clicks
	setTimeout( function()
	{
		element.touchClickCount = false;
	}, 500 );
}

// Are we on a mobile browser?
function checkMobileBrowser()
{
	if( !document.getElementsByTagName( 'head' )[0].getAttribute( 'touchdesktop' ) )
	{
		window.isMobile = window.innerWidth <= 760 ||
			navigator.userAgent.toLowerCase().indexOf( 'android' ) > 0 ||
			navigator.userAgent.toLowerCase().indexOf( 'phone' ) > 0 ||
			navigator.userAgent.toLowerCase().indexOf( 'pad' ) > 0 ||
			navigator.userAgent.toLowerCase().indexOf( 'bowser' ) > 0;
	}
	else window.isMobile = false;
	window.isTouch = !!('ontouchstart' in window);
}

checkMobileBrowser();

