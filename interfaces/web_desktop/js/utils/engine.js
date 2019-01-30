/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// We need friend!
Friend = window.Friend || {};

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
				var out = [];
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
			var r = [];
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

// Deep clone an element
function deepClone( ele )
{
	var obj = ele.cloneNode();
	
	// Get objects and functions
	for( var a in ele )
	{
		switch( a )
		{
			case 'onclick':
			case 'command':
			case 'name':
			case 'items':
			case 'innerHMTL':
			case 'touchend':
			case 'onmouseup':
			case 'onmousedown':
			case 'ontouchstart':
			case 'ontouchend':
			case 'disabled':
				obj[a] = ele[a];
				break;
		}
	}
	
	// Get attributes
	var supported = [ 'name', 'disabled', 'divider' ];
	for( var a = 0; a < supported.length; a++ )
	{
		if( ele.getAttribute )
		{
			var v = ele.getAttribute( supported[ a ] );
			if( v )	obj.setAttribute( supported[ a ], v );
		}
	}
	
	// Get childnodes recursively
	if( ele.childNodes )
	{
		for( var a = 0; a < ele.childNodes.length; a++ )
		{
			var d = deepClone( ele.childNodes[ a ] );
			obj.appendChild( d );
		}
	}
	
	// Return clone
	return obj;
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
function SetCookie( key, value, expiry )
{
	var t = new Date ();
	if ( !expiry ) expiry = 1;
	expiry = new Date( t.getTime() + ( expiry*1000*60*60*24 ) );
	document.cookie = key + '=' + escape ( value ) + ';expires='+expiry.toGMTString();
	return;
}
function DelCookie ( key ) { document.cookie = key + '=;'; }

// get a cookie
function GetCookie( key )
{
	if ( !key ) return false;
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
	return false;
}

// Set opacity on an element
function SetOpacity( element, opacity )
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
function GetByAjax( url, execfunc )
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

function hideKeyboard()
{
	if( !isMobile && !isTablet ) return;
	
	setTimeout( function()
	{
		var field = document.createElement( 'input' );
		field.setAttribute( 'type', 'text' );
		field.setAttribute( 'style', 'position: absolute; top: 0px; opacity: 0; -webkit-user-modify: read-write-plaintext-only; left: 0px;' );
		document.body.appendChild( field );
		field.onfocus = function()
		{
			setTimeout( function()
			{
				field.setAttribute('style', 'display:none;');
				setTimeout( function()
				{
					document.body.removeChild( field );
					document.body.focus();
				}, 14 );
			}, 200);
		};
		field.focus();
		setTimeout( function()
		{
			document.body.removeChild( field );
		}, 500 );
	}, 50 );
}

// Make sure the objs are in array form
function MakeArray ( objs )
{
	if ( objs.length >= 1 ) return objs;
	return [ objs ];
}

/**
 * HTML Entity map
 */
Friend.HTMLEntities = {
	"'": "&apos;",
	"&lt;": "&lt;",
	"&gt;": "&gt;",
	" ": "&nbsp;",
	"¡": "&iexcl;",
	"¢": "&cent;",
	"£": "&pound;",
	"¤": "&curren;",
	"¥": "&yen;",
	"¦": "&brvbar;",
	"§": "&sect;",
	"¨": "&uml;",
	"©": "&copy;",
	"ª": "&ordf;",
	"«": "&laquo;",
	"¬": "&not;",
	"®": "&reg;",
	"¯": "&macr;",
	"°": "&deg;",
	"±": "&plusmn;",
	"²": "&sup2;",
	"³": "&sup3;",
	"´": "&acute;",
	"µ": "&micro;",
	"¶": "&para;",
	"·": "&middot;",
	"¸": "&cedil;",
	"¹": "&sup1;",
	"º": "&ordm;",
	"»": "&raquo;",
	"¼": "&frac14;",
	"½": "&frac12;",
	"¾": "&frac34;",
	"¿": "&iquest;",
	"À": "&Agrave;",
	"Á": "&Aacute;",
	"Â": "&Acirc;",
	"Ã": "&Atilde;",
	"Ä": "&Auml;",
	"Å": "&Aring;",
	"Æ": "&AElig;",
	"Ç": "&Ccedil;",
	"È": "&Egrave;",
	"É": "&Eacute;",
	"Ê": "&Ecirc;",
	"Ë": "&Euml;",
	"Ì": "&Igrave;",
	"Í": "&Iacute;",
	"Î": "&Icirc;",
	"Ï": "&Iuml;",
	"Ð": "&ETH;",
	"Ñ": "&Ntilde;",
	"Ò": "&Ograve;",
	"Ó": "&Oacute;",
	"Ô": "&Ocirc;",
	"Õ": "&Otilde;",
	"Ö": "&Ouml;",
	"×": "&times;",
	"Ø": "&Oslash;",
	"Ù": "&Ugrave;",
	"Ú": "&Uacute;",
	"Û": "&Ucirc;",
	"Ü": "&Uuml;",
	"Ý": "&Yacute;",
	"Þ": "&THORN;",
	"ß": "&szlig;",
	"à": "&agrave;",
	"á": "&aacute;",
	"â": "&acirc;",
	"ã": "&atilde;",
	"ä": "&auml;",
	"å": "&aring;",
	"æ": "&aelig;",
	"ç": "&ccedil;",
	"è": "&egrave;",
	"é": "&eacute;",
	"ê": "&ecirc;",
	"ë": "&euml;",
	"ì": "&igrave;",
	"í": "&iacute;",
	"î": "&icirc;",
	"ï": "&iuml;",
	"ð": "&eth;",
	"ñ": "&ntilde;",
	"ò": "&ograve;",
	"ó": "&oacute;",
	"ô": "&ocirc;",
	"õ": "&otilde;",
	"ö": "&ouml;",
	"÷": "&divide;",
	"ø": "&oslash;",
	"ù": "&ugrave;",
	"ú": "&uacute;",
	"û": "&ucirc;",
	"ü": "&uuml;",
	"ý": "&yacute;",
	"þ": "&thorn;",
	"ÿ": "&yuml;",
	"Œ": "&OElig;",
	"œ": "&oelig;",
	"Š": "&Scaron;",
	"š": "&scaron;",
	"Ÿ": "&Yuml;",
	"ƒ": "&fnof;",
	"ˆ": "&circ;",
	"˜": "&tilde;",
	"Α": "&Alpha;",
	"Β": "&Beta;",
	"Γ": "&Gamma;",
	"Δ": "&Delta;",
	"Ε": "&Epsilon;",
	"Ζ": "&Zeta;",
	"Η": "&Eta;",
	"Θ": "&Theta;",
	"Ι": "&Iota;",
	"Κ": "&Kappa;",
	"Λ": "&Lambda;",
	"Μ": "&Mu;",
	"Ν": "&Nu;",
	"Ξ": "&Xi;",
	"Ο": "&Omicron;",
	"Π": "&Pi;",
	"Ρ": "&Rho;",
	"Σ": "&Sigma;",
	"Τ": "&Tau;",
	"Υ": "&Upsilon;",
	"Φ": "&Phi;",
	"Χ": "&Chi;",
	"Ψ": "&Psi;",
	"Ω": "&Omega;",
	"α": "&alpha;",
	"β": "&beta;",
	"γ": "&gamma;",
	"δ": "&delta;",
	"ε": "&epsilon;",
	"ζ": "&zeta;",
	"η": "&eta;",
	"θ": "&theta;",
	"ι": "&iota;",
	"κ": "&kappa;",
	"λ": "&lambda;",
	"μ": "&mu;",
	"ν": "&nu;",
	"ξ": "&xi;",
	"ο": "&omicron;",
	"π": "&pi;",
	"ρ": "&rho;",
	"ς": "&sigmaf;",
	"σ": "&sigma;",
	"τ": "&tau;",
	"υ": "&upsilon;",
	"φ": "&phi;",
	"χ": "&chi;",
	"ψ": "&psi;",
	"ω": "&omega;",
	"ϑ": "&thetasym;",
	"ϒ": "&Upsih;",
	"ϖ": "&piv;",
	"–": "&ndash;",
	"—": "&mdash;",
	"‘": "&lsquo;",
	"’": "&rsquo;",
	"‚": "&sbquo;",
	"“": "&ldquo;",
	"”": "&rdquo;",
	"„": "&bdquo;",
	"†": "&dagger;",
	"‡": "&Dagger;",
	"•": "&bull;",
	"…": "&hellip;",
	"‰": "&permil;",
	"′": "&prime;",
	"″": "&Prime;",
	"‹": "&lsaquo;",
	"›": "&rsaquo;",
	"‾": "&oline;",
	"⁄": "&frasl;",
	"€": "&euro;",
	"ℑ": "&image;",
	"℘": "&weierp;",
	"ℜ": "&real;",
	"™": "&trade;",
	"ℵ": "&alefsym;",
	"←": "&larr;",
	"↑": "&uarr;",
	"→": "&rarr;",
	"↓": "&darr;",
	"↔": "&harr;",
	"↵": "&crarr;",
	"⇐": "&lArr;",
	"⇑": "&UArr;",
	"⇒": "&rArr;",
	"⇓": "&dArr;",
	"⇔": "&hArr;",
	"∀": "&forall;",
	"∂": "&part;",
	"∃": "&exist;",
	"∅": "&empty;",
	"∇": "&nabla;",
	"∈": "&isin;",
	"∉": "&notin;",
	"∋": "&ni;",
	"∏": "&prod;",
	"∑": "&sum;",
	"−": "&minus;",
	"∗": "&lowast;",
	"√": "&radic;",
	"∝": "&prop;",
	"∞": "&infin;",
	"∠": "&ang;",
	"∧": "&and;",
	"∨": "&or;",
	"∩": "&cap;",
	"∪": "&cup;",
	"∫": "&int;",
	"∴": "&there4;",
	"∼": "&sim;",
	"≅": "&cong;",
	"≈": "&asymp;",
	"≠": "&ne;",
	"≡": "&equiv;",
	"≤": "&le;",
	"≥": "&ge;",
	"⊂": "&sub;",
	"⊃": "&sup;",
	"⊄": "&nsub;",
	"⊆": "&sube;",
	"⊇": "&supe;",
	"⊕": "&oplus;",
	"⊗": "&otimes;",
	"⊥": "&perp;",
	"⋅": "&sdot;",
	"⌈": "&lceil;",
	"⌉": "&rceil;",
	"⌊": "&lfloor;",
	"⌋": "&rfloor;",
	"⟨": "&lang;",
	"⟩": "&rang;",
	"◊": "&loz;",
	"♠": "&spades;",
	"♣": "&clubs;",
	"♥": "&hearts;",
	"♦": "&diams;",
	"&": "&amp;"
};

/**
 * Encodes string with HTML entities
 * @param string string to be encoded
 */
function EntityEncode( string )
{
	var output = [];
	for( var a = string.length - 1; a >= 0; a-- )
	{
		var k = string[a];
		for( var b in Friend.HTMLEntities )
		{
			if( b == string[a] )
			{
				k = Friend.HTMLEntities[b];
				break;
			}
		}
		output.push( k );
	}
	return output.join( '' );
}

/**
 * Decodes string with HTML entities
 * @param string string to be decoded
 */
function EntityDecode( string )
{
	return string.replace( /(\&[^;]*?\;)/g, function( m, decoded )
	{
		for( var b in Friend.HTMLEntities )
		{
			if( Friend.HTMLEntities[b] == decoded )
				return b; 
		}
		return decoded;
	} );
}

// Get a translated string
function i18n( string )
{
	if( i18n_translations[string] )
		return i18n_translations[string];
	if( typeof( translations ) != 'undefined' )
		if ( translations[string] )
			return translations[string];
	return string; 
}

// Add translations by path
function i18nAddPath( path, callback )
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
		if( typeof callback == 'function' ) callback();
	}
	j.send();
}

// Add translations from string
function i18nAddTranslations( string )
{
	var s = string.split( "\n" );
	for( var a = 0; a < s.length; a++ )
	{
		var p = s[a].split( ":" );
		if( Trim( p[0] ).length && Trim( p[1] ).length )
		{
			i18n_translations[Trim( p[0] )] = Trim( p[1] );
		}
	}
}

// Search and execute replacements in string (Note from FL: I'll certainly remove this later, redundant)
function i18nReplaceInString( str )
{
	var pos = 0;
	while ( ( pos = str.indexOf( "{i18n_", pos ) ) >= 0 )
	{
		var pos2 = str.indexOf( "}", pos );
		if ( pos2 >=0 )
		{
			var key = str.substring( pos + 1, pos2 - pos - 1 );
			var r = i18n( key );
			if ( r != key )
			{
				str = str.substring(0, pos) + r + str.substring(pos2 + 1);
			}
			pos = pos2 + 1;
		}
		else
		{
			break;
		}
	}
	return str;
}
// Execute replacements (Note from FL: I'll certainly remove this later)
function i18nReplace( data, replacements )
{
	var str = data ? data : this.data;
	if( !str ) return '';
	
	// Array
	if( replacements.length && typeof( replacements[ 0 ] ) != 'undefined' )
	{
		for( var a = 0; a < replacements.length; a++ )
		{
			str = str.split( '{' + replacements[ a ] + '}' ).join( i18n( replacements[ a ] ) );
		}
	}
	// Object?
	else
	{
		for( var a in replacements )
		{
			str = str.split( '{' + a + '}' ).join( replacements[a] );
		}
	}
	return str;
}

function i18nClearLocale()
{
	i18n_translations = [];
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
	d.style.left = Math.floor ( GetWindowWidth() >> 1 - ( width >> 1 ) ) + 'px';
	d.style.top = Math.floor ( GetWindowHeight() >> 1 - ( d.offsetHeight >> 1 ) ) + 'px';
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
		this.op = (( new Date () ).getTime () - this._time) / 250.0;
		if ( this.op >= 1 )
		{
			this.op = 1;
			clearInterval ( this.interval );
			if ( this.endfunc ) this.endfunc ();
		}
		SetOpacity ( this, this.op );
		if ( window.addEventListener )
			SetOpacity ( this.bg, this.op >> 1 );
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
		this.op = (( new Date () ).getTime () - this._time) / 250.0;
		if ( this.op >= 1 )
		{
			this.op = 1;
			clearInterval ( this.interval );
			if ( this.func ) this.func();
		}
		SetOpacity ( this, 1-this.op );
		SetOpacity ( this.bg, (1-this.op) >> 1 );
	}
	GetByAjax ( 
		url, function () 
		{ 
			d.innerHTML = '<div class="Box">' + this.responseText + '</div>'; 
			d.style.top = Math.floor ( GetWindowHeight() >> 1 - ( d.offsetHeight >> 1 ) ) + 'px';
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
			p.firstChild.firstChild.style.left = 0 - ( this.w >> 1 ) + 'px';
			p.firstChild.firstChild.style.top = -150 + 'px';
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
				p.firstChild.firstChild.style.left = 0 - ( this.w >> 1 ) + 'px';
				p.firstChild.firstChild.style.top = -150 + 'px';
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
function Include ( url, callback )
{
	var ele = document.createElement ( "script" );
	ele.type = "text/javascript";
	ele.src = url;
	if( callback )
	{
		ele.onload = function( e )
		{
			callback( e );
		}
	}
	document.body.appendChild ( ele );
}

// Add several events on each event type
var _events = new Array ();

function TriggerEvent( eventName, object )
{
	var event = false;
	if ( typeof document.createEvent == 'function' )
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

	if ( typeof document.createEvent == 'function' && event != false) 
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

function Trim( string, direction )
{
	if( !direction ) direction = false;
	
	string = ( string + "" );
	var out = '';
	var start = true;
	if( !direction || direction == 'left' )
	{
		for ( var a = 0; a < string.length; a++ )
		{
			var letter = string.substr( a, 1 );
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
		string = out;
	}
	else out = string;
	
	if( !direction || direction == 'right' )
	{
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
	}
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
	var t = 0;
	do
	{
		t += ele.offsetTop;
		ele = ele.offsetParent;
	} while( ele && ele.offsetParent != document.body );
	return t;
}

function GetElementLeft ( ele )
{
	var l = 0;
	do 
	{
		l += ele.offsetLeft;
		ele = ele.offsetParent;
	} while ( ele && ele.offsetParent != document.body );
	return l;
}

function getTotalWidthOfObject(object) {

    if(object == null || object.length == 0) {
        return 0;
    }

    var value       = object.width();
    value           += parseInt(object.css("padding-left"), 10) + parseInt(object.css("padding-right"), 10); //Total Padding Width
    value           += parseInt(object.css("margin-left"), 10) + parseInt(object.css("margin-right"), 10); //Total Margin Width
    value           += parseInt(object.css("borderLeftWidth"), 10) + parseInt(object.css("borderRightWidth"), 10); //Total Border Width
    return value;
}
GetElementWidthTotal = getTotalWidthOfObject; // Correct alias

function GetElementWidth( ele )
{
	if( ele == null || ele.length == 0 )
		return 0;
	var css = window.getComputedStyle( ele, null );
	var value = ele.offsetWidth;
	if( css.boxSizing != 'border-box' )
	{
		value += parseInt( css.paddingLeft, 10) + 
			parseInt( css.paddingRight, 10);
		value += parseInt( css.borderLeftWidth, 10) + 
			parseInt( css.borderRightWidth, 10);
	}
	value += parseInt( css.marginLeft, 10) + 
		parseInt( css.marginRight, 10);
	return value;
}

function GetElementHeight( ele )
{
	if( ele == null || ele.length == 0 )
		return 0;
	var css = window.getComputedStyle( ele, null );
	var value = ele.offsetHeight;
	if( css.boxSizing != 'border-box' )
	{
		value += parseInt( css.paddingTop, 10) + 
			parseInt( css.paddingBottom, 10);
		value += parseInt( css.borderTopWidth, 10) + 
			parseInt( css.borderBottomWidth, 10);
	}
	value += parseInt( css.marginTop, 10) + 
		parseInt( css.marginBottom, 10);
	return value;
}

function GetWindowWidth()
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

function GetWindowHeight()
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

function FixServerUrl( url )
{
	var ur = url.match( /http[s]{0,1}\:\/\/.*?\/(.*)/i );
	if( ur )
	{
		var l = document.location.href.match( /(http[s]{0,1}\:\/\/)(.*?\/).*/i );
		if( l )
		{
			return l[1] + l[2]+ ur[1];
		}
	}
	return url;
}

function GetUrlVar ( vari )
{
	var line = document.location.href.split ( '#' )[0].split ( '?' );
	if ( line.length > 1 )
	{
		line = line[1];
		line = line.split ( '&' );
		for( var a = 0; a < line.length; a++ )
		{
			var l = line[a].split( '=' );
			if( l[0] && l[0] == vari )
				return l[1];
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
	var ustr = new Array();
	for( var a in arr )
	{
		arr[a] = arr[a]+"";
		ustr.push( a + "\t" + arr[a].split ( "\n" ).join ( "<nl>" ).split ( "\t" ).join ( "<tab>" ) );
	}
	return ustr.join( "\n" );
}

function StringToObject ( str )
{
	if( !str || !str.split )
		return false;
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
function RunScripts( str, context )
{
	if( !str ) return;
	if ( !str.length ) return;
	var scripts;
	while ( scripts = str.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
	{
		str = str.split ( scripts[0] ).join ( '' );
		if( context )
		{
			context.doEvaluate = function( scriptCode )
			{
				context.eval( scriptCode );
			}
			context.doEvaluate( scripts[ 1 ] );
		}
		else
		{
			eval ( scripts[1] );
		}
	}
}

// Extract scripts and add on dom!
function ActivateScripts( str )
{
	if( !str ) return;
	if ( !str.length ) return;
	var scripts;
	var totalLoading = 0;
	var out = []; // Scripts to load
	var inl = []; // Inline scripts to run in sequence after load
	
	function runInline()
	{
		for( var a = 0; a < inl.length; a++ )
		{
			RunScripts( '<script>' + inl[a] + '</script>' );
		}
	}
	
	// Grab all scripts
	while( scripts = str.match ( /\<script[\s]+src\=\"([^"]*?)\"\>[\s]{0,}\<\/script\>/i ) )
	{
		str = str.split ( scripts[0] ).join ( '' );
		var s = document.createElement( 'script' );
		s.setAttribute( 'src', scripts[1] );
		out.push( s );
	}
	while( scripts = str.match ( /\<script.*?type\=\"[^"]*?\"[\s]+src\=\"([^"]*?)\"\>[\s]{0,}\<\/script\>/i ) )
	{
		str = str.split ( scripts[0] ).join ( '' );
		var s = document.createElement( 'script' );
		s.setAttribute( 'src', scripts[1] );
		out.push( s );
	}
	// Inline scripts to run last
	while ( scripts = str.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
	{
		inl.push( scripts[1] );
		str = str.split ( scripts[0] ).join ( '' );
	}
	
	// Support running application in an included script src
	if( window.applicationStarted == false && out.length > 0 )
	{
		var o = out.length > 1 ? ( out.length - 1 ) : 0;
		totalLoading++;
		out[ o ].onload = function()
		{
			totalLoading--;
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
			if( totalLoading == 0 )
			{
				runInline();
			}
		}
		document.body.appendChild( out[o] );
	}
	// Forget about applicationStarted
	else if( out.length > 0 )
	{
		// Append to dom tree
		for( var a = 0; a < out.length; a++ )
		{
			out[a].onload = function()
			{
				if( --totalLoading == 0 )
				{
					runInline();
				}
			}
			totalLoading++;
			document.body.appendChild( out[a] );
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
		return true;
	}
	return false;
}

// Fire event on element
function dispatchEvent( ele, evt, spec )
{
    // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
    var doc;
	if( ele.ownerDocument )
		doc = ele.ownerDocument;
	else if( ele.nodeType == 9 )
		doc = ele;
	else return;

	if( ele.dispatchEvent )
	{
		var eventClass = '';
		switch( evt )
		{
			case 'click':
			case 'mousedown':
			case 'mouseup':
				eventClass = 'MouseEvents';
				break;
			case 'focus':
			case 'change':
			case 'blur':
			case 'select':
				eventClass = 'HTMLEvents';
				break;
			case 'change':
				eventClass = 'HashChangeEvent';
				break;
			case 'keydown':
			case 'keypress':
			case 'keyup':
			case 'input':
				eventClass = 'KeyboardEvents';
				break;
			case 'touchstart':
			case 'touchend':
				eventClass = 'TouchEvents';
				break;
			case 'cut':
			case 'copy':
			case 'paste':
				console.log('ClipboardEvent dispatched here in engine.js',evt);
				eventClass = 'ClipboardEvent';
				break;
			default:
				console.log( 'Illegal event class.' );
				eventClass = 'Event';
				return;
		}
		
		var event = false;
		try
		{
			event = doc.createEvent( eventClass );
			var bubbles = evt == 'change' ? false : true;
			if( event) event.initEvent( evt, bubbles, true );
			if( event) event.synthetic = true;			

	
			// Add to event data
			if( event && spec )
			{
				for( var g in spec )
					event[g] = spec[g];
			}
			if( event ) ele.dispatchEvent( event, true );
		}
		catch(e)
		{
			console.log('could not create event of type ' + eventClass + ': ' + e);
		}
	}
	else if( ele.fireEvent )
	{
		// IE-old school style
		var event = doc.createEventObject();
		event.synthetic = true;
		ele.fireEvent( 'on' + evt, event );
	}
}

function cancelBubble ( ev )
{
	if( !ev ) ev = window.event;
	if( !ev ) return false;
	if( ev.cancelBubble && typeof( ev.cancelBubble ) == 'function' ) ev.cancelBubble();
	if( ev.stopPropagation ) ev.stopPropagation();
	if( ev.preventDefault ) ev.preventDefault();				
	return false;
}

function TextareaToWYSIWYG( inp )
{
	if( inp && inp.nodeName == 'TEXTAREA' )
	{
		if( inp.richTextArea )
			inp.richTextArea.parentNode.removeChild( inp.richTextArea );
		var d = document.createElement( 'div' );
		d.className = 'TextareaRich FullWidth Padding BackgroundDefault ColorDefault BordersDefault';
		d.setAttribute( 'contentEditable', 'true' );
		d.innerHTML = inp.value == '' ? '<p></p>' : inp.value;
		inp.style.position = 'absolute';
		inp.style.visibility = 'hidden';
		inp.style.top = '-100000px';
		if( inp.style.height ) d.style.height = inp.style.height;
		d.onkeydown = function( e )
		{
			inp.value = this.innerHTML.split( '<div' ).join( '<p' ).split( '</div' ).join( '</p' );
		}
		d.onkeyup = d.onkeydown;
		inp.richTextArea = d;
		inp.parentNode.insertBefore( d, inp );
		return true;
	}
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
	if( !depth ) depth = 0;
	
	if( typeof( o ) != 'object' && typeof( o ) != 'array' )
		return o;
		
	var n = new Object ();
	for( var a in o )
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
function humanFilesize( bts )
{
	if ( bts > 1000000000000 )
	{
		filesize = ( Math.round ( bts / 1000000000000 * 100 ) / 100 ) + 'tb';
	}
	else if ( bts > 1000000000 )
	{
		filesize = ( Math.round ( bts / 1000000000 * 100 ) / 100 ) + 'gb';
	}
	else if ( bts > 1000000 )
	{
		filesize = ( Math.round ( bts / 1000000 * 100 ) / 100 ) + 'mb';
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
function sortArray( array, sortColumn, order )
{
	if( !array || !array.length ) return false;
	
	// Output
	var out = [];
	
	// Create sortable array
	for ( var a = 0; a < array.length; a++ )
	{
		// make unique key
		var key = '';
		if( typeof( sortColumn ) == 'object' )
		{
			for( var ak in sortColumn )
				key += array[a][sortColumn[ak]] + '_';
		}
		else key = array[a][sortColumn] + '_';
		key += a.toString();
		out.push ( key.toLowerCase() );
	}
	out.sort ();
	
	// Create final output
	var fin = [];
	for ( var a = 0; a < out.length; a++ )
	{
		var keys = out[a].split( '_' );
		fin.push( array[parseInt(keys[keys.length-1])] );
	}
	
	// Descending order
	if( order == 'descending' || order == 'desc' )
	{
		fin.reverse();
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
// because Base64 gets overwritten by the crypto library
window.Base64alt = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64alt._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64alt._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t } }

/* Vertical tabs ------------------------------------------------------------ */

//
// Create a vertical tab list
//
VertTabContainer = function( domElement )
{
	this.dom = domElement;
	this.dom.innerHTML = '';
	this.dom.classList.add( 'VertTabContainer', 'ScrollArea' );
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

/* Sliders ------------------------------------------------------------------ */

function InitSliders( pdiv )
{
	if( !Friend.slidersInitialized )
	{
		Friend.slidersInitialized = true;
		// Move func
		Friend.sliderMove = function( e )
		{
			if( Friend.sliderCurrent )
			{
				var el = Friend.sliderCurrent;
				// Mind the direction of the slider
				if( el.parentNode.direction == 'horizontal' )
				{
					var left = ( e.clientX - el.posx ) - el.clickX;
					if( left < 0 ) left = 0;
					if( left + el.offsetWidth >= el.parentNode.offsetWidth - 2 )
						left = el.parentNode.offsetWidth - el.offsetWidth - 2;	
					el.style.left = left + 'px';
					
					var scaleP = el.parentNode.scale;
					var scale = left / ( el.parentNode.offsetWidth - ( el.offsetWidth + 2 ) ) *
						( scaleP.to - scaleP.from ) + scaleP.from;
						
					if( el.parentNode.onSlide )
						el.parentNode.onSlide( { scale: scale } );
				}
				else
				{
					var top = ( e.clientY - el.posy ) - el.clickY;
					if( top < 0 ) top = 0;
					if( top + el.offsetHeight >= el.parentNode.offsetHeight - 2 )
						top = el.parentNode.offsetHeight - el.offsetHeight - 2;	
					el.style.top = top + 'px';
					
					var scaleP = el.parentNode.scale;
					var scale = top / ( el.parentNode.offsetHeight - ( el.offsetHeight + 2 ) ) *
						( scaleP.to - scaleP.from ) + scaleP.from;
						
					if( el.parentNode.onSlide )
						el.parentNode.onSlide( { scale: scale } );
				}
			}
		}
		Friend.sliderMouseUp = function( e )
		{
			Friend.sliderCurrent = false;
		}
		// Getister events
		window.addEventListener( 'mousemove', Friend.sliderMove, true );
		window.addEventListener( 'mouseup', Friend.sliderMouseUp, true );
	}
	if( typeof( pdiv ) == 'string' )
		pdiv = ge( pdiv );
		
	// Fetch all sliders
	var sliders = [];
	var divs = pdiv.getElementsByTagName( 'div' );
	for( var a = 0; a < divs.length; a++ )
	{
		if( divs[a].classList.contains( 'Slider' ) )
		{
			sliders.push( divs[a] );
		}
	}
	// Set up each slider that remains uninitialized!
	for( var a = 0; a < sliders.length; a++ )
	{
		var slider = sliders[a];
		if( slider.sliderInitialized ) continue;
		slider.sliderInitialized = true;
		slider.scale = { from: 0, to: 1 };
		slider.position = 0;
		// Set the scale!
		slider.setScale = function( from, to )
		{
			this.scale = { from: from, to: to };
		}
		// Set a position
		slider.setPosition = function( pos )
		{
			this.position = pos;
			var el = this.button;
			if( this.direction == 'horizontal' )
			{
				var scaleP = el.parentNode.scale;
				var scale = ( pos - scaleP.from ) / ( scaleP.to - scaleP.from );
				el.style.left = scale * ( el.parentNode.offsetWidth - el.offsetWidth - 2 ) + 'px';
				if( el.parentNode.onSlide ) el.parentNode.onSlide( { scale: scale } );
			}
			else
			{
				var scaleP = el.parentNode.scale;
				var scale = ( pos - scaleP.from ) / ( scaleP.to - scaleP.from );
				el.style.top = scale * ( el.parentNode.offsetHeight - el.offsetHeight - 2 ) + 'px';
				if( el.parentNode.onSlide ) el.parentNode.onSlide( { scale: scale } );
			}
		}
		// Register mouse down and touch start!
		// TODO: Complete touch
		for( var b = 0; b < slider.childNodes.length; b++ )
		{
			if( slider.childNodes[b].className && slider.childNodes[b].classList.contains( 'SliderButton' ) )
			{
				slider.childNodes[b].onmousedown = function( e )
				{
					var el = this;
					el.parentNode.button = el;
					el.parentNode.direction = 'horizontal';
					el.posx = GetElementLeft( el ); // Slider position
					el.posy = GetElementTop( el );
					el.clickX = e.clientX - ( el.posx + el.offsetLeft ); // Mouse click offset
					el.clickY = e.clientY - ( el.posy + el.offsetTop );
					Friend.sliderCurrent = this;
				}
				slider.childNodes[b].ontouchstart = slider.childNodes[b].onmousedown;
			}
		}
	}
}

/* Standard tabs ------------------------------------------------------------ */

// Initializes tab system on the subsequent divs one level under parent div
Friend.horizontalTabs = {};
function InitTabs( pdiv, tabCallback )
{
	if( typeof( pdiv ) == 'string' )
		pdiv = ge( pdiv );
	
	// Save these
	Friend.horizontalTabs[ pdiv.id ] = pdiv;
	
	// Find window
	var wobj = pdiv;
	while( wobj )
	{
		if( wobj.classList && wobj.classList.contains( 'Content' ) && wobj.windowObject )
		{
			wobj = wobj.windowObject.content;
			break;
		}
		wobj = wobj.parentNode;
	}
	// Ah we are in an api!
	if( !wobj ) wobj = window;
	
	var divs = pdiv.getElementsByTagName( 'div' );
	var tabs = [];
	var pages = [];
	var active = 0;
	
	var tabContainer = pdiv.getElementsByClassName( 'TabContainer' );
	if( !tabContainer.length || tabContainer[0].parentNode != pdiv )
	{
		tabContainer = false;
	}
	else tabContainer = tabContainer[0];
	
	var hasContainer = tabContainer;
	
	var setPageState = true;
	
	for( var a = 0; a < divs.length; a++ )
	{
		// Skip orphan tabs and out of bounds subelements
		if( ( divs[a].classList.contains( 'Tab' ) && hasContainer && divs[a].parentNode != tabContainer ) || ( !hasContainer && divs[a].parentNode != pdiv ) )
		{
			continue;
		}
		if( divs[a].classList.contains( 'TabContainer' ) )
		{
			hasContainer = divs[a];
			tabContainer = divs[a];
			continue;
		}
		if( divs[a].classList.contains( 'Tab' ) )
		{
			tabs.push( divs[a] );
			divs[a].pdiv = pdiv;
			divs[a].tabs = tabs; 
			divs[a].pages = pages;
			divs[a].index = tabs.length - 1;
			divs[a].onclick = function()
			{
				// Already active? Just return
				if( this.classList.contains( 'TabActive' ) ) return;
				
				// Assume it is ok to activate this tab
				var result = true;
				
				SetCookie ( 'Tabs' + this.pdiv.id, this.index );
				this.classList.add( 'TabActive' );
				var ind;
				for( var b = 0; b < this.tabs.length; b++ )
				{
					if( this.tabs[b] != this )
					{
						this.tabs[b].classList.remove( 'TabActive' );
					}
					else ind = b;
				}
				
				if( tabCallback )
				{
					var r = tabCallback( this, this.pages );
					if( r === false || r === true )
						result = r;
				}
				
				// Only continue if the tab callback has a positive result or doesn't exist
				if( result )
				{
					for( var b = 0; b < this.pages.length; b++ )
					{
						if( b != ind )
						{
							this.pages[b].classList.remove( 'PageActive' );
						}
						else 
						{
							this.pages[b].classList.add( 'PageActive' );
							if( navigator.userAgent.indexOf ( 'MSIE' ) > 0 )
							{
								this.pages[b].style.display = 'none';
								var idz = 1;
								if( !this.pages[b].id )
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
				}
				
				// Do magic with resize
				if( typeof ( AutoResizeWindow ) != 'undefined' )
				{
					var pdiv = this.pdiv;
					while ( pdiv.className.indexOf ( ' View' ) < 0 && pdiv != document.body )
						pdiv = pdiv.parentNode;
					if ( pdiv != document.body && pdiv.autoResize == true )
						AutoResizeWindow ( pdiv );
				}
			}
			if( GetCookie ( 'Tabs' + pdiv.id ) == divs[a].index )
			{
				active = divs[a].index;
			}
		}
		else if( divs[a].classList.contains( 'Page' ) )
		{
			divs[a].classList.remove( 'PageActive' );
			divs[a].classList.add( 'Page' );
			pages.push( divs[a] );
		}
	}
	// Reorder the tabs
	if( !hasContainer )
	{
		// Abort!
		if( !tabs.length )
		{
			return;
		}
		var d = document.createElement( 'div' );
		d.className = 'TabContainer';
		tabs[0].parentNode.insertBefore( d, tabs[0] );
		for( var a = 0; a < tabs.length; a++ )
		{
			tabs[a].parentNode.removeChild( tabs[a] );
			d.appendChild( tabs[a] );
		}
		hasContainer = d;
	}
	
	if( hasContainer )
	{
		// Scroll on mouse move
		hasContainer.addEventListener( 'mousemove', function( e )
		{
			if( this.scrollWidth <= this.offsetWidth )
				return;
			var rest = this.scrollWidth - this.offsetWidth;
			var position = ( e.clientX - GetElementLeft( this ) );
			if( position > this.offsetWidth ) position = this.offsetWidth;
			else if( position < 0 ) position = 0;
			position /= this.offsetWidth;
			this.scrollLeft = Math.round( position * rest );
		} );
		// Allow touch slide
		hasContainer.addEventListener( 'touchstart', function( e )
		{
			this.touchDownX = this.scrollLeft;
			this.touchX = e.touches[0].clientX;
		} );
		hasContainer.addEventListener( 'touchmove', function( e )
		{
			if( this.scrollWidth <= this.offsetWidth )
				return;
			var diff = this.touchX - e.touches[0].clientX;
			var rest = this.scrollWidth - this.offsetWidth;
			var position = this.touchDownX + diff;
			if( position > rest ) position = rest;
			else if( position < 0 ) position = 0;
			this.scrollLeft = position;
		} );
		hasContainer.addEventListener( 'touchend', function( e )
		{
			this.touchDownX = false;
			this.touchX = false;
		} );
	}
	
	// Scroll areas
	for( var a = 0; a < pages.length; a++ )
	{
		var pag = pages[a];
		for( var b = 0; b < pag.childNodes.length; b++ )
		{
			// Find content container
			var cr = pag.childNodes[ b ];
			var resizeObject = false;
			var spaceSize = 0; // margins and paddings
			while( cr && cr != document.body )
			{
				var cl = cr.classList;
				if( cl && ( 
					cl.contains( 'VContentTop' ) || 
					cl.contains( 'VContentLeft' ) || 
					cl.contains( 'VContentRight' ) || 
					cl.contains( 'ContentFull' ) || 
					cl.contains( 'VContentBottom' ) 
				) )
				{
					resizeObject = cr;
					break;
				}
				cr = cr.parentNode;
			}
			
			// Resize pagescroll and set resize event
			var cl = pag.childNodes[ b ].classList;
			if( cl && cl.contains( 'PageScroll' ) )
			{
				// New scope for resize event
				function addResizeEvent( n, page )
				{
					var ch = 0;
					var ph = 0;
					function resiz( force )
					{
						// Take last container height
						ph = ch;
						ch = wobj.offsetHeight ? wobj.offsetHeight : wobj.innerHeight;

						// We succeeded in getting a stable tabpage container height
						// Check if it changed, and abort if it didn't
						if( ch == ph && !force ) return;
						
						// Containing element
						var hhh = GetElementHeight( resizeObject ) - ( hasContainer ? GetElementHeight( hasContainer ) : n.tab.offsetHeight );
						
						// Page scroll height (other elements contained minus page scroll element)
						var psh = 0;
						for( var pa = 0; pa < n.parentNode.childNodes.length; pa++ )
						{
							var nn = n.parentNode.childNodes[ pa ];
							// Skip elements after page scroll
							if( nn.className && nn.classList.contains( 'PageScroll' ) )
							{
								break;
							}
							if( n.parentNode.childNodes[ pa ] != n )
							{
								if( n.parentNode && n.parentNode.childNodes[ pa ].nodeName == 'DIV' )
									psh += GetElementHeight( n.parentNode.childNodes[ pa ] );
							}
						}
						
						// See if containing page has padding
						var css = window.getComputedStyle( page, null );
						var targets = [ 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth' ];
						for( var zz = 0; zz < targets.length; zz++ )
						{
							if( css[ targets[ zz ] ] ) psh += parseInt( css[ targets[ zz ] ] );
						}
						
						// See if page scroller has margin
						css = window.getComputedStyle( n, null );
						var targets = [ 'marginTop', 'marginBottom', 'borderTopWidth', 'borderBottomWidth' ];
						for( var zz = 0; zz < targets.length; zz++ )
						{
							if( css[ targets[ zz ] ] ) psh += parseInt( css[ targets[ zz ] ] );
						}
						
						// Page scroll
						n.style.height = hhh - psh + 'px';
						
						// Container
						page.style.height = hhh + 'px';
						
						// Refresh again in case height changes
						setTimeout( function(){ resiz(); }, 25 );
					}
					
					// Add events and 
					window.addEventListener( 'resize', resiz );
					if( !Friend.resizeTabs )
						Friend.resizeTabs = [];
					n.tab.addEventListener( 'click', function(){ resiz( 1 ); } );
					Friend.resizeTabs.push( { element: pdiv, resize: function()
					{
						resiz( 1 );
					} } );
					
					// Resize now! (in 5ms)
					setTimeout( function()
					{
						resiz();
					}, 5 );
				}
				// Register the page and associate it so we can add the resize event
				var n = pag.childNodes[ b ];
				n.tab = tabs[a];
				n.style.position = 'relative';
				n.style.overflow = 'auto';
				n.parentNode.style.height = n.style.height;
				if( wobj && n.tab )
				{
					addResizeEvent( n, pag );
				}
			}
		}
	}
	if( tabs.length && tabs[active] )
	{
		tabs[active].onclick();
	}
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

function checkMobile()
{
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
}

function checkTablet() 
{
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
}

// Are we on a mobile browser?
function checkMobileBrowser()
{
	if( !document.body ) return setTimeout( checkMobileBrowser, 50 );
	window.isMobile = checkMobile();
	window.isTablet = checkTablet();
	if( window.isMobile ) window.isTablet = false;
	if( !window.isMobile && !window.isTablet )
	{
		if( window.isTouch || !document.getElementsByTagName( 'head' )[0].getAttribute( 'touchdesktop' ) )
		{
			window.isMobile = ( window.Workspace && window.innerWidth <= 760 ) && (
				navigator.userAgent.toLowerCase().indexOf( 'android' ) > 0 ||
				navigator.userAgent.toLowerCase().indexOf( 'phone' ) > 0 ||
				navigator.userAgent.toLowerCase().indexOf( 'pad' ) > 0 ||
				navigator.userAgent.toLowerCase().indexOf( 'bowser' ) > 0 );
			
			if( ( window.isMobile || navigator.userAgent.indexOf( 'Mobile' ) > 0 ) && window.innerWidth >= 1024 )
			{
				window.isTablet = true;
				window.isMobile = false;
			}
		}
	}
	// Ipads are always mobiles
	if( navigator.userAgent.toLowerCase().indexOf( 'ipad' ) > 0 )
	{
		//console.log( 'IPAD! ' + navigator.userAgent );
		window.isMobile = true;
	}
	
	window.isTouch = !!('ontouchstart' in window);
	if( window.isMobile )
	{
		document.body.setAttribute( 'mobile', 'mobile' );
	}
	else if( window.isTablet )
	{
		document.body.setAttribute( 'tablet', 'tablet' );
	}
	else
	{
		document.body.removeAttribute( 'tablet' );
	}
	if( navigator.userAgent.toLowerCase().indexOf( 'playstation' ) > 0 )
	{
		document.body.setAttribute( 'settopbox', 'playstation' );
		window.isSettopBox = 'playstation';
		if (typeof console  != "undefined") 
			if (typeof console.log != 'undefined')
				console.olog = console.log;
			else
				console.olog = function() {};
		console.log = function(message) {
			console.olog(message);
			Notify( { title: 'Playstation error', text: message } );
		};
		console.error = console.debug = console.info =  console.log
	}
	return window.isMobile;
}

// Binary to string conversions for transport in postmessage
function ConvertArrayBufferToString( arraybuffer, method )
{
	if( !method || method == 'binaryString' )
	{
		var v = new Uint8Array( arraybuffer );
		return Array.prototype.join.call( v, ',' );
	}
	else if ( method == 'base64' )
	{
		var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		var bytes = new Uint8Array( arraybuffer ),
		i, len = bytes.length, base64 = "";

		for (i = 0; i < len; i+=3) 
		{
			base64 += chars[bytes[i] >> 2];
			base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
			base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
			base64 += chars[bytes[i + 2] & 63];
		}

		if ((len % 3) === 2) 
		{
			base64 = base64.substring(0, base64.length - 1) + "=";
		} 
		else if (len % 3 === 1) 
		{
			base64 = base64.substring(0, base64.length - 2) + "==";
		}
	    return base64;
	}
	return false;
}
function ConvertStringToArrayBuffer( str, method )
{
	if( !method || method == 'binaryString' )
	{
		var data = str.split( ',' );
		return ( new Uint8Array( data ) ).buffer;
	}
	else if ( method == 'base64' )
	{
		var lookup = window.base64Lookup;
		if ( !lookup )
		{
			var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
			lookup = new Uint8Array(256);
			for ( var i = 0; i < chars.length; i++ ) 
			{
				lookup[ chars.charCodeAt( i ) ] = i;
			}
			window.base64Lookup = lookup;		
		}

		var bufferLength = str.length * 0.75, len = str.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
		if ( str[ str.length - 1 ] === "=") 
		{
			bufferLength--;
			if ( str[ str.length - 2 ] === "=") 
			{
				bufferLength--;
			}
		}

		var arraybuffer = new ArrayBuffer( bufferLength ),
		bytes = new Uint8Array( arraybuffer );

		for ( i = 0; i < len; i += 4 ) 
		{
			encoded1 = lookup[str.charCodeAt(i)];
			encoded2 = lookup[str.charCodeAt(i+1)];
			encoded3 = lookup[str.charCodeAt(i+2)];
			encoded4 = lookup[str.charCodeAt(i+3)];

			bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
			bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
			bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
		}
		return arraybuffer;
	}
	return false;
}
function ConvertBase64StringToString( str )
{
	var arrayBuffer = ConvertStringToArrayBuffer( str, 'base64' );
	var bytes = new Uint8Array( arrayBuffer );
	var len = bytes.length;
	var result = '';
	for ( var c = 0; c < len; c++ )
		result += String.fromCharCode( bytes[ c ] );
	return result;
}
function ConvertStringToBase64String( input )
{
	// private property
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	
	// public method for encoding
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

	while ( i < input.length ) 
	{
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) 
		{
			enc3 = enc4 = 64;
		} 
		else if (isNaN(chr3)) 
		{
			enc4 = 64;
		}

		output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
	};
	return output;
}
// Extract the name of a file from a path
function GetFilename( path )
{
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );

	var slash = path.lastIndexOf( '/' );
	if ( slash >= 0 )
		return path.substring( slash + 1 );

	var split = path.split( ':' );
	if ( split[ 1 ] && split[ 1 ].length )
		return split[ 1 ];
	return split[ 0 ];		
}

// Clean the properties of a Javascript object
function CleanArray( keys, exclude )
{
	var out = [ ];
	for ( var key in keys )
	{
		if ( keys[ key ] && keys[ key ] != exclude )
			out[ key ] = keys[ key ];
	}
	return out;
}

var __randDevId = false;
function GetDeviceId()
{
	// Try to get the device id from cookie
	var ck = GetCookie( 'deviceId' );
	if( ck ) return ck;
	
	if( !__randDevId )
	{
		var md5 = deps ? deps.MD5 : window.MD5;
		__randDevId = md5( ( Math.random() % 999 ) + ( Math.random() % 999 ) + ( Math.random() % 999 ) + '' );
	}
	
	var id = !!('ontouchstart' in window) ? 'touch' : 'wimp';
	var ua = navigator.userAgent.toLowerCase()
	var type = ua.indexOf( 'android' ) > 0 ? 'android' : false;
	var platform = '';
	if( !type ) type = ua.indexOf( 'phone' ) > 0 ? 'iphone' : false;
	if( !type ) type = 'other';
	if( ua.indexOf( 'ios' ) > 0 ) platform = 'iOS';
	if( ua.indexOf( 'mac' ) > 0 ) platform = 'Apple';
	if( ua.indexOf( 'windows' ) > 0 ) platform = 'Microsoft';
	if( ua.indexOf( 'linux' ) > 0 ) platform = 'Linux';
	if( !platform ) platform = 'Generic';
	
	var r = id + '_' + type + '_' + platform + '_' + __randDevId;

	//application token is needed for iOS push notifications
	if (typeof window.friendApp != "undefined"){
                if (typeof window.friendApp.appToken != "undefined"){
                        r = id + "_ios_app_" + friendApp.appToken;
                }
        }
	// Store the cookie for later use
	SetCookie( 'deviceId', r );
	
	return r;
}

checkMobileBrowser();

/* Ranges and cursors */
/* TODO: Implement this! */
function SetCursorPosition( element, position )
{
	setTimeout( function()
	{
		element.focus();
		var s = window.getSelection();
		var r = document.createRange();
		var pos = position;
		switch( position )
		{
			case 'end':
				pos = element.childElementCount;
				r.selectNodeContents( element );
				break;
			case 'start':
				pos = 0;
				r.setStart( element, 0 );
				r.setEnd( element, 0 );
			default:
				r.setStart( element, position );
				r.setEnd( element, position );
				break;
		}
		r.collapse();
		s.removeAllRanges();
		s.addRange( r );
	}, 0 );
}

