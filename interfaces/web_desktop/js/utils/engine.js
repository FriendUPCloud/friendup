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

// We need friend!
friend = window.friend || {}

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

// Make sure the objs are in array form
function MakeArray ( objs )
{
	if ( objs.length >= 1 ) return objs;
	return [ objs ];
}

/**
 * HTML Entity map
 */
friend.HTMLEntities = {
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
		for( var b in friend.HTMLEntities )
		{
			if( b == string[a] )
			{
				k = friend.HTMLEntities[b];
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
		for( var b in friend.HTMLEntities )
		{
			if( friend.HTMLEntities[b] == decoded )
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
			var replace = i18n( key );
			if ( replace != key )
			{
				str = str.substring(0, pos) + replace + str.substring(pos2 + 1);
			}
			pos = pos2 + 1;
		}
		else
		{
			break;
		}
	}
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
		value += parseInt( css.paddingLeft, 10 ) + 
			parseInt( css.paddingRight, 10 );
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
	var value  = ele.offsetHeight;
	if( css.boxSizing != 'border-box' )
	{
		value += parseInt( css.paddingTop, 10 ) + 
			parseInt( css.paddingBottom, 10 );
		value += parseInt( css.borderTopWidth, 10) + 
			parseInt( css.borderBottomWidth, 10);
	}
	value += parseInt( css.marginTop, 10) + 
		parseInt( css.marginBottom, 10);
	return value;
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

/* Sliders ------------------------------------------------------------------ */

function InitSliders( pdiv )
{
	if( !friend.slidersInitialized )
	{
		friend.slidersInitialized = true;
		// Move func
		friend.sliderMove = function( e )
		{
			if( friend.sliderCurrent )
			{
				var el = friend.sliderCurrent;
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
		friend.sliderMouseUp = function( e )
		{
			friend.sliderCurrent = false;
		}
		// Getister events
		window.addEventListener( 'mousemove', friend.sliderMove, true );
		window.addEventListener( 'mouseup', friend.sliderMouseUp, true );
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
					friend.sliderCurrent = this;
				}
				slider.childNodes[b].ontouchstart = slider.childNodes[b].onmousedown;
			}
		}
	}
}

/* Standard tabs ------------------------------------------------------------ */

// Initializes tab system on the subsequent divs one level under parent div
function InitTabs ( pdiv )
{
	if( typeof( pdiv ) == 'string' )
		pdiv = ge( pdiv );
		
	
	// Find window
	var wobj = pdiv;
	while( wobj )
	{
		if( wobj.classList && wobj.classList.contains( 'Content' ) && wobj.windowObject )
		{
			wobj = wobj.windowObject;
			break;
		}
		wobj = wobj.parentNode;
	}
	// Ah we are in an api!
	if( !wobj )
	{
		wobj = window;
	}
	
	var divs = pdiv.getElementsByTagName( 'div' );
	var tabs = new Array();
	var pages = new Array();
	var active = 0;
	for( var a = 0; a < divs.length; a++ )
	{
		if( divs[a].parentNode != pdiv ) continue;
		if( divs[a].classList.contains( 'Tab' ) )
		{
			tabs.push ( divs[a] );
			divs[a].pdiv = pdiv;
			divs[a].tabs = tabs; 
			divs[a].pages = pages;
			divs[a].index = tabs.length - 1;
			divs[a].onclick = function ()
			{
				SetCookie ( 'Tabs'+this.pdiv.id, this.index );
				this.classList.remove( 'Tab' );
				this.classList.add( 'TabActive' );
				var ind;
				for( var b = 0; b < this.tabs.length; b++ )
				{
					if( this.tabs[b] != this )
					{
						this.tabs[b].classList.remove( 'TabActive' );
						this.tabs[b].classList.add( 'Tab' );
					}
					else ind = b;
				}
				for( var b = 0; b < this.pages.length; b++ )
				{
					if( b != ind )
					{
						this.pages[b].classList.remove( 'PageActive' );
						this.pages[b].classList.add( 'Page' );
					}
					else 
					{
						this.pages[b].classList.remove( 'Page' );
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
				if( typeof ( AutoResizeWindow ) != 'undefined' )
				{
					var pdiv = this.pdiv;
					while ( pdiv.className.indexOf ( ' View' ) < 0 && pdiv != document.body )
						pdiv = pdiv.parentNode;
					if ( pdiv != document.body && pdiv.autoResize == true )
						AutoResizeWindow ( pdiv );
				}
			}
			if( GetCookie ( 'Tabs'+pdiv.id ) == divs[a].index )
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
	// Scroll areas
	for( var a = 0; a < pages.length; a++ )
	{
		for( var b = 0; b < pages[a].childNodes.length; b++ )
		{
			// Find content container
			var cr = pages[a].childNodes[b];
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
				
				// Get all properties here
				if( cr.classList )
				{
					var cst = window.getComputedStyle( cr, null );
				
					// Add padding
					var props = [ 'padding', 'padding-top', 'padding-bottom', 'margin', 'margin-top', 'margin-bottom' ];
					for( var c = 0; c < props.length; c++ )
					{
						var prop = cst.getPropertyValue( props[c] );
						if( !prop ) continue;
						if( props[c].indexOf( '-' ) > 0 )
							spaceSize += parseInt( prop );
						else spaceSize += parseInt( prop ) * 2;
					}
				}
				cr = cr.parentNode;
			}
			
			// Resize pagescroll and set resize event
			var cl = pages[a].childNodes[b].classList;
			if( cl && cl.contains( 'PageScroll' ) )
			{
				function addResizeEvent( n )
				{
					function resiz()
					{
						n.style.height = ( resizeObject.offsetHeight - n.tab.offsetHeight - spaceSize ) + 'px';
						n.parentNode.style.minHeight = n.style.height;
					}
					if( wobj.addEvent )
						wobj.addEvent( 'resize', resiz );
					else wobj.addEventListener( 'resize', resiz );
					setTimeout( function()
					{
						resiz();
					}, 5 );
				}
				var n = pages[a].childNodes[b];
				n.tab = tabs[a];
				n.style.position = 'relative';
				n.style.height = ( resizeObject.offsetHeight - tabs[a].offsetHeight - spaceSize ) + 'px';
				n.style.overflow = 'auto';
				n.parentNode.style.minHeight = n.style.height;
				if( wobj ) addResizeEvent( n );
			}
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
	else if( document.getElementsByTagName( 'head' )[0].getAttribute( 'mobile' ) )
	{
		window.isMobile = true;
	}
	else window.isMobile = false;
	window.isTouch = !!('ontouchstart' in window);
	
	return window.isMobile;
}

var __randDevId = false;
function GetDeviceId()
{
	// Try to get the device id from cookie
	var ck = GetCookie( 'deviceId' );
	if( ck ) return ck;
	
	if( !__randDevId )
		__randDevId = window.MD5( ( Math.random() % 999 ) + ( Math.random() % 999 ) + ( Math.random() % 999 ) + '' );
	
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

