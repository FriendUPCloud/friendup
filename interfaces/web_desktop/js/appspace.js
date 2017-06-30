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

// App space version of workspace!
var _protocol = document.location.href.split( '://' )[0];

/* just make the needed functions available without enven doing stuff in deepestfield */
DeepestField = {
	drawTasks: function() {},
	networkActivity: { timeToFinish: [] },
	addConnection: function(){},
	delConnection: function(){}
	
};

Workspace = {
	locale: 'en',
	init: function( mode ) 
	{
		// Add locale
		i18nAddPath( 'locale/en.locale' );
		
		this.mode = mode;
	
		// Interpret directive
		var urlVars = {};
		var url = document.location.href.split( '?' )[1].split( '&' );
		for( var a = 0; a < url.length; a++ )
		{
			var pair = url[a].split( '=' );
			urlVars[pair[0]] = decodeURIComponent( pair[1] );
			if( urlVars[pair[0]].indexOf( ':' ) > 0 )
			{
				// JSON?
				try
				{
					var o = JSON.parse( urlVars[pair[0]] );
					if( o ) urlVars[pair[0]] = o;
				}
				// No, a path maybe
				catch( e )
				{
					// Good
				}
			}
		}
		this.conf = urlVars;
		var t = this;
		var p = 'HASHED' + Sha256.hash( 'apipass' );
		var j = new cAjax();
		
		var si = GetUrlVar( 'sessionid' );
		var au = GetUrlVar( 'authid' );
		var authType = si ? 'sessionId' : 'authId';
		var authValue = si ? si : au;
		
		if( !au && !si )
		{
			j.open( 'POST', '/system.library/login', true, true );
			j.addVar( 'username', 'apiuser' );
			j.addVar( 'password', p );
			j.addVar( 'deviceid', 'loving-crotch-grabbing-espen' );
		}
		// TODO: Do something useful here!
		else
		{
			j.open( 'POST', '/system.library/help', true, true );
			j.addVar( authType.toLowerCase(), authValue );
		}
		j.onload = function( r, d )
		{
			var o = false;
			if( r )
			{
				try{ o = JSON.parse( r ); } catch( e )
				{ console.log( 'Result is not in JSON format.' ); }
			}
			
			// Either guest user or real user
			if( ( ( si || au ) && r == 'ok' ) || ( r && o ) )
			{
				if( ( ( si || au ) && ( !o || typeof( o ) == 'undefined' ) ) || o.result == '0' || o.result == 3 )
				{
					// Register no Workspace object
					if( !si && o && o.sessionid ) Workspace.sessionId = o.sessionid;
					if( au || si ) Workspace[authType] = authValue;
					
					// Ping every 10 seconds
					if( !window.pingInt ) window.pingInt = setInterval( Workspace.pingAccount, 10000 );
					Workspace.pingAccount();
					
					// Get available drives
					return Workspace.getMountlist( function()
					{
						// Setup default Doors screen
						var wbscreen = new Screen( {
								title: 'Friend Workspace v1.0.0',
								id:	'DoorsScreen',
								extra: Workspace.fullName,
								taskbar: false
							}
						);
						
						// Touch start show menu!
						wbscreen.contentDiv.addEventListener( 'click', function( e )
						{
							var t = e.target ? e.target : e.srcElement;
							if( t == wbscreen.contentDiv )
							{
								// You need to click two times! And within 500 ms
								setTimeout( function()
								{
									wbscreen.canShowMenu = false;
								}, 500 );
								if( !wbscreen.canShowMenu )
								{
									wbscreen.canShowMenu = true;
									return;
								}
								setTimeout( function()
								{
									workspaceMenu.show();
									ge( 'MobileMenu' ).classList.add( 'Visible' );
								}, 100 );					
							}
						}, true );
					
					
						document.body.style.visibility = 'visible';
						
						if( t.conf.app )
						{
							return ExecuteApplication( t.conf.app, GetUrlVar( 'data' ), function()
							{
								setTimeout( function()
								{
									var jo = new cAjax();
									jo.open( 'get', '/webclient/templates/thankyou.html', true, false );
									jo.onload = function()
									{
										var ele = document.createElement( 'div' );
										ele.className = 'ThankYou Padding';
										ele.innerHTML = this.responseText();
										var s = GeByClass( 'ScreenContent' );
										if( s )
										{
											if( s.length ) s = s[0];
											s.appendChild( ele );
										}
										else document.body.appendChild( s );
									}
									jo.send();
								}, 2000 );
							} );
						}
					} );
				}
			}
			document.body.innerHTML = '<h1>Error with call</h1><p>FriendUP can not interpret application call.</p>';
		}
		j.send();	
		
		// Add event listeners
		for( var a = 0; a < this.runLevels.length; a++ )
		{
			var listener = this.runLevels[a].listener;
			
			if ( !listener )
				continue;
			
			if( window.addEventListener )
				window.addEventListener( 'message', listener, true );
			else window.attachEvent( 'onmessage', listener, true );
		}
		
		// Set theme
		if( typeof( this.conf.theme ) != 'undefined' )
			this.refreshTheme( this.conf.theme );
		
	},
	refreshTheme: function( themeName, update )
	{
		// Only on force or first time
		if( this.themeRefreshed && !update )
			return;
		this.themeRefreshed = true;
		
		Workspace.theme = themeName ? themeName.toLowerCase() : '';
		themeName = Workspace.theme;
		
		var h = document.getElementsByTagName( 'head' );
		if( h )
		{
			h = h[0];
			
			// New css!
			var styles = document.createElement( 'link' );
			styles.rel = 'stylesheet';
			styles.type = 'text/css';
			styles.onload = function(){ document.body.className = 'Inside'; }
			
			if( themeName && themeName != 'default' )
			{
				AddCSSByUrl( '/themes/' + Workspace.theme + '/scrollbars.css' );
				if( !Workspace.sessionId )
					styles.href = '/themes/' + Workspace.theme + '/theme_compiled.css';
				else styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"' + themeName + '"}' ) + '&sessionid=' + Workspace.sessionId;
			}
			else
			{
				AddCSSByUrl( '/webclient/theme/scrollbars.css' );
				if( !Workspace.sessionId )
					styles.href = '/themes/friendup/theme_compiled.css';
				else styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"friendup"}' ) + '&sessionid=' + Workspace.sessionId;
			}
			
			// Remove old one
			var l = h.getElementsByTagName( 'link' );
			for( var b = 0; b < l.length; b++ )
			{
				if( l[b].parentNode != h ) continue;
				l[b].href = '';
				l[b].parentNode.removeChild( l[b] );
			}
			
			// Add new one
			h.appendChild( styles );
		}
		
		// TODO: Loop through all apps and update themes...
		
		
	},
	// Get a door by path
	getDoorByPath: function( path )
	{
		if( !path ) return false;
		var list = Workspace.icons;
		var part = path.split( ':' )[0] + ':';
		for( var a = 0; a < list.length; a++ )
		{
			if( list[a].Volume == part )
			{
				return list[a].Dormant ? list[a].Dormant : list[a].Door;
			}
		}
		return false;
	},
	// Fetch mountlist from database
	getMountlist: function( callback )
	{
		var t = this;
		var m = new Module( 'system' );
		m.onExecuted = function( e, dat )
		{
			t.icons = [];
			
			// Check dormant
			if( DormantMaster )
			{
				var doors = DormantMaster.getDoors();
				var found = [];
				for( var a = 0; a < doors.length; a++ )
				{
					// Fixie
					if( doors[a].Title && !doors[a].Volume )
						doors[a].Volume = doors[a].Title;
					doors[a].Filesize = '';
					var isfound = false;
					for( var b = 0; b < found.length; b++ )
						if( found[b].Title == doors[a].Title )
							isfound = true;
					if( !isfound )
					{
						t.icons.push( doors[a] );
					}
					found.push( doors[a] );
				}
			}
			
			// Network devices
			var rows = friendUP.tool.parse( dat );
			if ( rows && rows.length ) 
			{
				for ( var a = 0; a < rows.length; a++ )
				{
					var r = rows[a];
					if( r.Mounted != '1' )
					{
						continue;
					}
					var o = false;
				
					var d;
				
					var typ = r.Type.substr(0,1).toUpperCase()+r.Type.substr(1,r.Type.length); 
				
					d = ( new Door() ).get( r.Name + ':' );
					d.permissions[0] = 'r';
					d.permissions[1] = 'w';
					d.permissions[2] = 'e';
					d.permissions[3] = 'd';
				
					var o = {
						Title: r.Name.split(':').join('') + ':',
						Volume: r.Name.split(':').join('') + ':',
						Path: r.Name.split(':').join('') + ':',
						Type: 'Door',
						MetaType: 'Directory',
						ID: r.ID,
						Mounted: r.Mounted ? true : false,
						Door: d
					};
					
					// Force mounnt
					var f = new FriendLibrary( 'system.library' );
					f.addVar( 'type', r.Type );
					f.addVar( 'devname', r.Name.split(':').join('') );
					if( r.Type != 'Local' )
						f.addVar( 'module', 'system' );
					f.execute( 'device/mount' );
				
					// We need volume information
					d.Volume = o.Volume;
					d.Type = typ;
				
					// Add to list
					t.icons.push( o );
				}
			}
			
			// Do the callback thing
			if( callback ) callback( t.icons );
		}
		m.execute( 'mountlist', this.conf );
		
		return true;
	},
	// Just check if the system is being used or has expired
	pingAccount: function()
	{
		var realApps = 0;
		for( var a = 0; a < Workspace.applications.length; a++ )
		{
			realApps++;
		}
		if( realApps > 0 )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					return false;
				}
			}
			m.execute( 'ping' );
		}
	},
	
	// Dummy functions here
	relogin: function( us, ps ){},
	updateTasks: function(){},
	refreshDesktop: function(){},
	refreshMenu: function(){},
	// Objects and arrays
	icons: [],
	menuMode: 'pear', // 'miga', 'fensters' (alternatives)
	initialized: true,
	protocol: _protocol,
	menu: [],
	diskNotificationList: [],
	applications: [],
	importWindow: false,
	runLevels: [ 
		{ 
			name: 'root', 
			domain: _protocol + '://' + document.location.href.match( /h[^:]*?\:\/\/([^/]+)/i )[1]
		},
		{ 
			name: 'utilities', 
			domain: _protocol + '://' + document.location.href.match( /h[^:]*?\:\/\/([^/]+)/i )[1],
			/*domain: 'http://utilities.' + document.location.href.match( /h[^:]*?\:\/\/([^/]+)/i )[1],*/
			listener: apiWrapper
		}
	],
	directoryView: false
}
Doors = Workspace;






/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-256 implementation in JavaScript                (c) Chris Veness 2002-2014 / MIT Licence  */
/*                                                                                                */
/*  - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                              */
/*        http://csrc.nist.gov/groups/ST/toolkit/examples.html                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint node:true *//* global define, escape, unescape */
'use strict';


/**
 * SHA-256 hash function reference implementation.
 *
 * @namespace
 */
var Sha256 = {};


/**
 * Generates SHA-256 hash of string.
 *
 * @param   {string} msg - String to be hashed
 * @returns {string} Hash of msg as hex character string
 */
Sha256.hash = function(msg) {
    // convert string to UTF-8, as SHA only deals with byte-streams
    msg = msg.utf8Encode();
    
    // constants [§4.2.2]
    var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ];
    // initial hash value [§5.3.1]
    var H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ];

    // PREPROCESSING 
 
    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    var l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
    var N = Math.ceil(l/16);  // number of 16-integer-blocks required to hold 'l' ints
    var M = new Array(N);

    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | 
                      (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;


    // HASH COMPUTATION [§6.1.2]

    var W = new Array(64); var a, b, c, d, e, f, g, h;
    for (var i=0; i<N; i++) {

        // 1 - prepare message schedule 'W'
        for (var t=0;  t<16; t++) W[t] = M[i][t];
        for (var t=16; t<64; t++) W[t] = (Sha256.OO1(W[t-2]) + W[t-7] + Sha256.OO0(W[t-15]) + W[t-16]) & 0xffffffff;

        // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
        a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];

        // 3 - main loop (note 'addition modulo 2^32')
        for (var t=0; t<64; t++) {
            var T1 = h + Sha256.EE1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
            var T2 =     Sha256.EE0(a) + Sha256.Maj(a, b, c);
            h = g;
            g = f;
            f = e;
            e = (d + T1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) & 0xffffffff;
        }
         // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
        H[0] = (H[0]+a) & 0xffffffff;
        H[1] = (H[1]+b) & 0xffffffff; 
        H[2] = (H[2]+c) & 0xffffffff; 
        H[3] = (H[3]+d) & 0xffffffff; 
        H[4] = (H[4]+e) & 0xffffffff;
        H[5] = (H[5]+f) & 0xffffffff;
        H[6] = (H[6]+g) & 0xffffffff; 
        H[7] = (H[7]+h) & 0xffffffff; 
    }

    return Sha256.toHexStr(H[0]) + Sha256.toHexStr(H[1]) + Sha256.toHexStr(H[2]) + Sha256.toHexStr(H[3]) + 
           Sha256.toHexStr(H[4]) + Sha256.toHexStr(H[5]) + Sha256.toHexStr(H[6]) + Sha256.toHexStr(H[7]);
};


/**
 * Rotates right (circular right shift) value x by n positions [§3.2.4].
 * @private
 */
Sha256.ROTR = function(n, x) {
    return (x >>> n) | (x << (32-n));
};

/**
 * Logical functions [§4.1.2].
 * @private
 */
Sha256.EE0  = function(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); };
Sha256.EE1  = function(x) { return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); };
Sha256.OO0  = function(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  };
Sha256.OO1  = function(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); };
Sha256.Ch  = function(x, y, z) { return (x & y) ^ (~x & z); };
Sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };


/**
 * Hexadecimal representation of a number.
 * @private
 */
Sha256.toHexStr = function(n) {
    // note can't use toString(16) as it is implementation-dependant,
    // and in IE returns signed numbers when used on full words
    var s="", v;
    for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
    return s;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/** Extend String object with method to encode multi-byte string to utf8
 *  - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html */
if (typeof String.prototype.utf8Encode == 'undefined') {
    String.prototype.utf8Encode = function() {
        return unescape( encodeURIComponent( this ) );
    };
}

/** Extend String object with method to decode utf8 string to multi-byte */
if (typeof String.prototype.utf8Decode == 'undefined') {
    String.prototype.utf8Decode = function() {
        try {
            return decodeURIComponent( escape( this ) );
        } catch (e) {
            return this; // invalid UTF-8? return as-is
        }
    };
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Sha256; // CommonJs export
if (typeof define == 'function' && define.amd) define([], function() { return Sha256; }); // AMD


