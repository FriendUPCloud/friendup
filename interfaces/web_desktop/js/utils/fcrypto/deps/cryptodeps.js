
/*******************************************************************************
*                                                                              *
* @dependencies included                                                       *
*                                                                              *
* 	cryptojs/components/aes.js                                                 *
* 	cryptojs/components/pbkdf2.js                                              *
*   jsencrypt.js                                                               *
*   base64.js                                                                  *
*   hash.js                                                                    *
*   jsbn.js                                                                    *
*   random.js                                                                  *
*   rsa.js                                                                     *
*   jscrypto.js                                                                *
*                                                                              *
*******************************************************************************/



var cryptodeps = window.cryptodeps || {};



(function( ns, undefined ) {
	
	
	/*ns.CryptoJS = {};*/
	
	
	// --- aes.js --------------------------------------------------------------------------------------------------- //
	
	
	/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	(function ( CryptoJS ) {
		return;
		// Shortcuts
		var C = CryptoJS;
		var C_lib = C.lib;
		var BlockCipher = C_lib.BlockCipher;
		var C_algo = C.algo;

		// Lookup tables
		var SBOX = [];
		var INV_SBOX = [];
		var SUB_MIX_0 = [];
		var SUB_MIX_1 = [];
		var SUB_MIX_2 = [];
		var SUB_MIX_3 = [];
		var INV_SUB_MIX_0 = [];
		var INV_SUB_MIX_1 = [];
		var INV_SUB_MIX_2 = [];
		var INV_SUB_MIX_3 = [];

		// Compute lookup tables
		(function () {
		    // Compute double table
		    var d = [];
		    for (var i = 0; i < 256; i++) {
		        if (i < 128) {
		            d[i] = i << 1;
		        } else {
		            d[i] = (i << 1) ^ 0x11b;
		        }
		    }

		    // Walk GF(2^8)
		    var x = 0;
		    var xi = 0;
		    for (var i = 0; i < 256; i++) {
		        // Compute sbox
		        var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
		        sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
		        SBOX[x] = sx;
		        INV_SBOX[sx] = x;

		        // Compute multiplication
		        var x2 = d[x];
		        var x4 = d[x2];
		        var x8 = d[x4];

		        // Compute sub bytes, mix columns tables
		        var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
		        SUB_MIX_0[x] = (t << 24) | (t >>> 8);
		        SUB_MIX_1[x] = (t << 16) | (t >>> 16);
		        SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
		        SUB_MIX_3[x] = t;

		        // Compute inv sub bytes, inv mix columns tables
		        var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
		        INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
		        INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
		        INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
		        INV_SUB_MIX_3[sx] = t;

		        // Compute next counter
		        if (!x) {
		            x = xi = 1;
		        } else {
		            x = x2 ^ d[d[d[x8 ^ x2]]];
		            xi ^= d[d[xi]];
		        }
		    }
		}());

		// Precomputed Rcon lookup
		var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

		/**
		 * AES block cipher algorithm.
		 */
		var AES = C_algo.AES = BlockCipher.extend({
		    _doReset: function () {
		        // Shortcuts
		        var key = this._key;
		        var keyWords = key.words;
		        var keySize = key.sigBytes / 4;

		        // Compute number of rounds
		        var nRounds = this._nRounds = keySize + 6

		        // Compute number of key schedule rows
		        var ksRows = (nRounds + 1) * 4;

		        // Compute key schedule
		        var keySchedule = this._keySchedule = [];
		        for (var ksRow = 0; ksRow < ksRows; ksRow++) {
		            if (ksRow < keySize) {
		                keySchedule[ksRow] = keyWords[ksRow];
		            } else {
		                var t = keySchedule[ksRow - 1];

		                if (!(ksRow % keySize)) {
		                    // Rot word
		                    t = (t << 8) | (t >>> 24);

		                    // Sub word
		                    t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

		                    // Mix Rcon
		                    t ^= RCON[(ksRow / keySize) | 0] << 24;
		                } else if (keySize > 6 && ksRow % keySize == 4) {
		                    // Sub word
		                    t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
		                }

		                keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
		            }
		        }

		        // Compute inv key schedule
		        var invKeySchedule = this._invKeySchedule = [];
		        for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
		            var ksRow = ksRows - invKsRow;

		            if (invKsRow % 4) {
		                var t = keySchedule[ksRow];
		            } else {
		                var t = keySchedule[ksRow - 4];
		            }

		            if (invKsRow < 4 || ksRow <= 4) {
		                invKeySchedule[invKsRow] = t;
		            } else {
		                invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
		                                           INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
		            }
		        }
		    },

		    encryptBlock: function (M, offset) {
		        this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
		    },

		    decryptBlock: function (M, offset) {
		        // Swap 2nd and 4th rows
		        var t = M[offset + 1];
		        M[offset + 1] = M[offset + 3];
		        M[offset + 3] = t;

		        this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

		        // Inv swap 2nd and 4th rows
		        var t = M[offset + 1];
		        M[offset + 1] = M[offset + 3];
		        M[offset + 3] = t;
		    },

		    _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
		        // Shortcut
		        var nRounds = this._nRounds;

		        // Get input, add round key
		        var s0 = M[offset]     ^ keySchedule[0];
		        var s1 = M[offset + 1] ^ keySchedule[1];
		        var s2 = M[offset + 2] ^ keySchedule[2];
		        var s3 = M[offset + 3] ^ keySchedule[3];

		        // Key schedule row counter
		        var ksRow = 4;

		        // Rounds
		        for (var round = 1; round < nRounds; round++) {
		            // Shift rows, sub bytes, mix columns, add round key
		            var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
		            var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
		            var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
		            var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

		            // Update state
		            s0 = t0;
		            s1 = t1;
		            s2 = t2;
		            s3 = t3;
		        }

		        // Shift rows, sub bytes, add round key
		        var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
		        var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
		        var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
		        var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

		        // Set output
		        M[offset]     = t0;
		        M[offset + 1] = t1;
		        M[offset + 2] = t2;
		        M[offset + 3] = t3;
		    },

		    keySize: 256/32
		});

		/**
		 * Shortcut functions to the cipher's object interface.
		 *
		 * @example
		 *
		 *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
		 *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
		 */
		C.AES = BlockCipher._createHelper(AES);
		
	}( /*ns.CryptoJS*/undefined ));
	
// TODO: Unmess this mess under ...
	
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(u,p){var d={},l=d.lib={},s=function(){},t=l.Base={extend:function(a){s.prototype=this;var c=new s;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
r=l.WordArray=t.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=p?c:4*a.length},toString:function(a){return(a||v).stringify(this)},concat:function(a){var c=this.words,e=a.words,j=this.sigBytes;a=a.sigBytes;this.clamp();if(j%4)for(var k=0;k<a;k++)c[j+k>>>2]|=(e[k>>>2]>>>24-8*(k%4)&255)<<24-8*((j+k)%4);else if(65535<e.length)for(k=0;k<a;k+=4)c[j+k>>>2]=e[k>>>2];else c.push.apply(c,e);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=u.ceil(c/4)},clone:function(){var a=t.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],e=0;e<a;e+=4)c.push(4294967296*u.random()|0);return new r.init(c,a)}}),w=d.enc={},v=w.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++){var k=c[j>>>2]>>>24-8*(j%4)&255;e.push((k>>>4).toString(16));e.push((k&15).toString(16))}return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j+=2)e[j>>>3]|=parseInt(a.substr(j,
2),16)<<24-4*(j%8);return new r.init(e,c/2)}},b=w.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++)e.push(String.fromCharCode(c[j>>>2]>>>24-8*(j%4)&255));return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j++)e[j>>>2]|=(a.charCodeAt(j)&255)<<24-8*(j%4);return new r.init(e,c)}},x=w.Utf8={stringify:function(a){try{return decodeURIComponent(escape(b.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return b.parse(unescape(encodeURIComponent(a)))}},
q=l.BufferedBlockAlgorithm=t.extend({reset:function(){this._data=new r.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=x.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,e=c.words,j=c.sigBytes,k=this.blockSize,b=j/(4*k),b=a?u.ceil(b):u.max((b|0)-this._minBufferSize,0);a=b*k;j=u.min(4*a,j);if(a){for(var q=0;q<a;q+=k)this._doProcessBlock(e,q);q=e.splice(0,a);c.sigBytes-=j}return new r.init(q,j)},clone:function(){var a=t.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:t.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,e){return(new a.init(e)).finalize(b)}},_createHmacHelper:function(a){return function(b,e){return(new n.HMAC.init(a,
e)).finalize(b)}}});var n=d.algo={};return d}(Math);
(function(){var u=CryptoJS,p=u.lib.WordArray;u.enc.Base64={stringify:function(d){var l=d.words,p=d.sigBytes,t=this._map;d.clamp();d=[];for(var r=0;r<p;r+=3)for(var w=(l[r>>>2]>>>24-8*(r%4)&255)<<16|(l[r+1>>>2]>>>24-8*((r+1)%4)&255)<<8|l[r+2>>>2]>>>24-8*((r+2)%4)&255,v=0;4>v&&r+0.75*v<p;v++)d.push(t.charAt(w>>>6*(3-v)&63));if(l=t.charAt(64))for(;d.length%4;)d.push(l);return d.join("")},parse:function(d){var l=d.length,s=this._map,t=s.charAt(64);t&&(t=d.indexOf(t),-1!=t&&(l=t));for(var t=[],r=0,w=0;w<
l;w++)if(w%4){var v=s.indexOf(d.charAt(w-1))<<2*(w%4),b=s.indexOf(d.charAt(w))>>>6-2*(w%4);t[r>>>2]|=(v|b)<<24-8*(r%4);r++}return p.create(t,r)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
(function(u){function p(b,n,a,c,e,j,k){b=b+(n&a|~n&c)+e+k;return(b<<j|b>>>32-j)+n}function d(b,n,a,c,e,j,k){b=b+(n&c|a&~c)+e+k;return(b<<j|b>>>32-j)+n}function l(b,n,a,c,e,j,k){b=b+(n^a^c)+e+k;return(b<<j|b>>>32-j)+n}function s(b,n,a,c,e,j,k){b=b+(a^(n|~c))+e+k;return(b<<j|b>>>32-j)+n}for(var t=CryptoJS,r=t.lib,w=r.WordArray,v=r.Hasher,r=t.algo,b=[],x=0;64>x;x++)b[x]=4294967296*u.abs(u.sin(x+1))|0;r=r.MD5=v.extend({_doReset:function(){this._hash=new w.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(q,n){for(var a=0;16>a;a++){var c=n+a,e=q[c];q[c]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360}var a=this._hash.words,c=q[n+0],e=q[n+1],j=q[n+2],k=q[n+3],z=q[n+4],r=q[n+5],t=q[n+6],w=q[n+7],v=q[n+8],A=q[n+9],B=q[n+10],C=q[n+11],u=q[n+12],D=q[n+13],E=q[n+14],x=q[n+15],f=a[0],m=a[1],g=a[2],h=a[3],f=p(f,m,g,h,c,7,b[0]),h=p(h,f,m,g,e,12,b[1]),g=p(g,h,f,m,j,17,b[2]),m=p(m,g,h,f,k,22,b[3]),f=p(f,m,g,h,z,7,b[4]),h=p(h,f,m,g,r,12,b[5]),g=p(g,h,f,m,t,17,b[6]),m=p(m,g,h,f,w,22,b[7]),
f=p(f,m,g,h,v,7,b[8]),h=p(h,f,m,g,A,12,b[9]),g=p(g,h,f,m,B,17,b[10]),m=p(m,g,h,f,C,22,b[11]),f=p(f,m,g,h,u,7,b[12]),h=p(h,f,m,g,D,12,b[13]),g=p(g,h,f,m,E,17,b[14]),m=p(m,g,h,f,x,22,b[15]),f=d(f,m,g,h,e,5,b[16]),h=d(h,f,m,g,t,9,b[17]),g=d(g,h,f,m,C,14,b[18]),m=d(m,g,h,f,c,20,b[19]),f=d(f,m,g,h,r,5,b[20]),h=d(h,f,m,g,B,9,b[21]),g=d(g,h,f,m,x,14,b[22]),m=d(m,g,h,f,z,20,b[23]),f=d(f,m,g,h,A,5,b[24]),h=d(h,f,m,g,E,9,b[25]),g=d(g,h,f,m,k,14,b[26]),m=d(m,g,h,f,v,20,b[27]),f=d(f,m,g,h,D,5,b[28]),h=d(h,f,
m,g,j,9,b[29]),g=d(g,h,f,m,w,14,b[30]),m=d(m,g,h,f,u,20,b[31]),f=l(f,m,g,h,r,4,b[32]),h=l(h,f,m,g,v,11,b[33]),g=l(g,h,f,m,C,16,b[34]),m=l(m,g,h,f,E,23,b[35]),f=l(f,m,g,h,e,4,b[36]),h=l(h,f,m,g,z,11,b[37]),g=l(g,h,f,m,w,16,b[38]),m=l(m,g,h,f,B,23,b[39]),f=l(f,m,g,h,D,4,b[40]),h=l(h,f,m,g,c,11,b[41]),g=l(g,h,f,m,k,16,b[42]),m=l(m,g,h,f,t,23,b[43]),f=l(f,m,g,h,A,4,b[44]),h=l(h,f,m,g,u,11,b[45]),g=l(g,h,f,m,x,16,b[46]),m=l(m,g,h,f,j,23,b[47]),f=s(f,m,g,h,c,6,b[48]),h=s(h,f,m,g,w,10,b[49]),g=s(g,h,f,m,
E,15,b[50]),m=s(m,g,h,f,r,21,b[51]),f=s(f,m,g,h,u,6,b[52]),h=s(h,f,m,g,k,10,b[53]),g=s(g,h,f,m,B,15,b[54]),m=s(m,g,h,f,e,21,b[55]),f=s(f,m,g,h,v,6,b[56]),h=s(h,f,m,g,x,10,b[57]),g=s(g,h,f,m,t,15,b[58]),m=s(m,g,h,f,D,21,b[59]),f=s(f,m,g,h,z,6,b[60]),h=s(h,f,m,g,C,10,b[61]),g=s(g,h,f,m,j,15,b[62]),m=s(m,g,h,f,A,21,b[63]);a[0]=a[0]+f|0;a[1]=a[1]+m|0;a[2]=a[2]+g|0;a[3]=a[3]+h|0},_doFinalize:function(){var b=this._data,n=b.words,a=8*this._nDataBytes,c=8*b.sigBytes;n[c>>>5]|=128<<24-c%32;var e=u.floor(a/
4294967296);n[(c+64>>>9<<4)+15]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360;n[(c+64>>>9<<4)+14]=(a<<8|a>>>24)&16711935|(a<<24|a>>>8)&4278255360;b.sigBytes=4*(n.length+1);this._process();b=this._hash;n=b.words;for(a=0;4>a;a++)c=n[a],n[a]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return b},clone:function(){var b=v.clone.call(this);b._hash=this._hash.clone();return b}});t.MD5=v._createHelper(r);t.HmacMD5=v._createHmacHelper(r)})(Math);
(function(){var u=CryptoJS,p=u.lib,d=p.Base,l=p.WordArray,p=u.algo,s=p.EvpKDF=d.extend({cfg:d.extend({keySize:4,hasher:p.MD5,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(d,r){for(var p=this.cfg,s=p.hasher.create(),b=l.create(),u=b.words,q=p.keySize,p=p.iterations;u.length<q;){n&&s.update(n);var n=s.update(d).finalize(r);s.reset();for(var a=1;a<p;a++)n=s.finalize(n),s.reset();b.concat(n)}b.sigBytes=4*q;return b}});u.EvpKDF=function(d,l,p){return s.create(p).compute(d,
l)}})();
CryptoJS.lib.Cipher||function(u){var p=CryptoJS,d=p.lib,l=d.Base,s=d.WordArray,t=d.BufferedBlockAlgorithm,r=p.enc.Base64,w=p.algo.EvpKDF,v=d.Cipher=t.extend({cfg:l.extend(),createEncryptor:function(e,a){return this.create(this._ENC_XFORM_MODE,e,a)},createDecryptor:function(e,a){return this.create(this._DEC_XFORM_MODE,e,a)},init:function(e,a,b){this.cfg=this.cfg.extend(b);this._xformMode=e;this._key=a;this.reset()},reset:function(){t.reset.call(this);this._doReset()},process:function(e){this._append(e);return this._process()},
finalize:function(e){e&&this._append(e);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(e){return{encrypt:function(b,k,d){return("string"==typeof k?c:a).encrypt(e,b,k,d)},decrypt:function(b,k,d){return("string"==typeof k?c:a).decrypt(e,b,k,d)}}}});d.StreamCipher=v.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var b=p.mode={},x=function(e,a,b){var c=this._iv;c?this._iv=u:c=this._prevBlock;for(var d=0;d<b;d++)e[a+d]^=
c[d]},q=(d.BlockCipherMode=l.extend({createEncryptor:function(e,a){return this.Encryptor.create(e,a)},createDecryptor:function(e,a){return this.Decryptor.create(e,a)},init:function(e,a){this._cipher=e;this._iv=a}})).extend();q.Encryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize;x.call(this,e,a,c);b.encryptBlock(e,a);this._prevBlock=e.slice(a,a+c)}});q.Decryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize,d=e.slice(a,a+c);b.decryptBlock(e,a);x.call(this,
e,a,c);this._prevBlock=d}});b=b.CBC=q;q=(p.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,l=[],n=0;n<c;n+=4)l.push(d);c=s.create(l,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};d.BlockCipher=v.extend({cfg:v.cfg.extend({mode:b,padding:q}),reset:function(){v.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;this._mode=c.call(a,
this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var n=d.CipherParams=l.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),b=(p.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;return(a?s.create([1398893684,
1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=s.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return n.create({ciphertext:a,salt:c})}},a=d.SerializableCipher=l.extend({cfg:l.extend({format:b}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var l=a.createEncryptor(c,d);b=l.finalize(b);l=l.cfg;return n.create({ciphertext:b,key:c,iv:l.iv,algorithm:a,mode:l.mode,padding:l.padding,blockSize:a.blockSize,formatter:d.format})},
decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),p=(p.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=s.random(8));a=w.create({keySize:b+c}).compute(a,d);c=s.create(a.words.slice(b),4*c);a.sigBytes=4*b;return n.create({key:a,iv:c,salt:d})}},c=d.PasswordBasedCipher=a.extend({cfg:a.cfg.extend({kdf:p}),encrypt:function(b,c,d,l){l=this.cfg.extend(l);d=l.kdf.execute(d,
b.keySize,b.ivSize);l.iv=d.iv;b=a.encrypt.call(this,b,c,d.key,l);b.mixIn(d);return b},decrypt:function(b,c,d,l){l=this.cfg.extend(l);c=this._parse(c,l.format);d=l.kdf.execute(d,b.keySize,b.ivSize,c.salt);l.iv=d.iv;return a.decrypt.call(this,b,c,d.key,l)}})}();
(function(){for(var u=CryptoJS,p=u.lib.BlockCipher,d=u.algo,l=[],s=[],t=[],r=[],w=[],v=[],b=[],x=[],q=[],n=[],a=[],c=0;256>c;c++)a[c]=128>c?c<<1:c<<1^283;for(var e=0,j=0,c=0;256>c;c++){var k=j^j<<1^j<<2^j<<3^j<<4,k=k>>>8^k&255^99;l[e]=k;s[k]=e;var z=a[e],F=a[z],G=a[F],y=257*a[k]^16843008*k;t[e]=y<<24|y>>>8;r[e]=y<<16|y>>>16;w[e]=y<<8|y>>>24;v[e]=y;y=16843009*G^65537*F^257*z^16843008*e;b[k]=y<<24|y>>>8;x[k]=y<<16|y>>>16;q[k]=y<<8|y>>>24;n[k]=y;e?(e=z^a[a[a[G^z]]],j^=a[a[j]]):e=j=1}var H=[0,1,2,4,8,
16,32,64,128,27,54],d=d.AES=p.extend({_doReset:function(){for(var a=this._key,c=a.words,d=a.sigBytes/4,a=4*((this._nRounds=d+6)+1),e=this._keySchedule=[],j=0;j<a;j++)if(j<d)e[j]=c[j];else{var k=e[j-1];j%d?6<d&&4==j%d&&(k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255]):(k=k<<8|k>>>24,k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255],k^=H[j/d|0]<<24);e[j]=e[j-d]^k}c=this._invKeySchedule=[];for(d=0;d<a;d++)j=a-d,k=d%4?e[j]:e[j-4],c[d]=4>d||4>=j?k:b[l[k>>>24]]^x[l[k>>>16&255]]^q[l[k>>>
8&255]]^n[l[k&255]]},encryptBlock:function(a,b){this._doCryptBlock(a,b,this._keySchedule,t,r,w,v,l)},decryptBlock:function(a,c){var d=a[c+1];a[c+1]=a[c+3];a[c+3]=d;this._doCryptBlock(a,c,this._invKeySchedule,b,x,q,n,s);d=a[c+1];a[c+1]=a[c+3];a[c+3]=d},_doCryptBlock:function(a,b,c,d,e,j,l,f){for(var m=this._nRounds,g=a[b]^c[0],h=a[b+1]^c[1],k=a[b+2]^c[2],n=a[b+3]^c[3],p=4,r=1;r<m;r++)var q=d[g>>>24]^e[h>>>16&255]^j[k>>>8&255]^l[n&255]^c[p++],s=d[h>>>24]^e[k>>>16&255]^j[n>>>8&255]^l[g&255]^c[p++],t=
d[k>>>24]^e[n>>>16&255]^j[g>>>8&255]^l[h&255]^c[p++],n=d[n>>>24]^e[g>>>16&255]^j[h>>>8&255]^l[k&255]^c[p++],g=q,h=s,k=t;q=(f[g>>>24]<<24|f[h>>>16&255]<<16|f[k>>>8&255]<<8|f[n&255])^c[p++];s=(f[h>>>24]<<24|f[k>>>16&255]<<16|f[n>>>8&255]<<8|f[g&255])^c[p++];t=(f[k>>>24]<<24|f[n>>>16&255]<<16|f[g>>>8&255]<<8|f[h&255])^c[p++];n=(f[n>>>24]<<24|f[g>>>16&255]<<16|f[h>>>8&255]<<8|f[k&255])^c[p++];a[b]=q;a[b+1]=s;a[b+2]=t;a[b+3]=n},keySize:8});u.AES=p._createHelper(d)})();
	
	
	// --- pbkdf2.js ------------------------------------------------------------------------------------------------ //
	
	
	/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	(function ( CryptoJS ) {
		return;
		// Shortcuts
		var C = CryptoJS;
		var C_lib = C.lib;
		var Base = C_lib.Base;
		var WordArray = C_lib.WordArray;
		var C_algo = C.algo;
		var SHA1 = C_algo.SHA1;
		var HMAC = C_algo.HMAC;

		/**
		 * Password-Based Key Derivation Function 2 algorithm.
		 */
		var PBKDF2 = C_algo.PBKDF2 = Base.extend({
		    /**
		     * Configuration options.
		     *
		     * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
		     * @property {Hasher} hasher The hasher to use. Default: SHA1
		     * @property {number} iterations The number of iterations to perform. Default: 1
		     */
		    cfg: Base.extend({
		        keySize: 128/32,
		        hasher: SHA1,
		        iterations: 1
		    }),

		    /**
		     * Initializes a newly created key derivation function.
		     *
		     * @param {Object} cfg (Optional) The configuration options to use for the derivation.
		     *
		     * @example
		     *
		     *     var kdf = CryptoJS.algo.PBKDF2.create();
		     *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
		     *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
		     */
		    init: function (cfg) {
		        this.cfg = this.cfg.extend(cfg);
		    },

		    /**
		     * Computes the Password-Based Key Derivation Function 2.
		     *
		     * @param {WordArray|string} password The password.
		     * @param {WordArray|string} salt A salt.
		     *
		     * @return {WordArray} The derived key.
		     *
		     * @example
		     *
		     *     var key = kdf.compute(password, salt);
		     */
		    compute: function (password, salt) {
		        // Shortcut
		        var cfg = this.cfg;

		        // Init HMAC
		        var hmac = HMAC.create(cfg.hasher, password);

		        // Initial values
		        var derivedKey = WordArray.create();
		        var blockIndex = WordArray.create([0x00000001]);

		        // Shortcuts
		        var derivedKeyWords = derivedKey.words;
		        var blockIndexWords = blockIndex.words;
		        var keySize = cfg.keySize;
		        var iterations = cfg.iterations;

		        // Generate key
		        while (derivedKeyWords.length < keySize) {
		            var block = hmac.update(salt).finalize(blockIndex);
		            hmac.reset();

		            // Shortcuts
		            var blockWords = block.words;
		            var blockWordsLength = blockWords.length;

		            // Iterations
		            var intermediate = block;
		            for (var i = 1; i < iterations; i++) {
		                intermediate = hmac.finalize(intermediate);
		                hmac.reset();

		                // Shortcut
		                var intermediateWords = intermediate.words;

		                // XOR intermediate with block
		                for (var j = 0; j < blockWordsLength; j++) {
		                    blockWords[j] ^= intermediateWords[j];
		                }
		            }

		            derivedKey.concat(block);
		            blockIndexWords[0]++;
		        }
		        derivedKey.sigBytes = keySize * 4;

		        return derivedKey;
		    }
		});

		/**
		 * Computes the Password-Based Key Derivation Function 2.
		 *
		 * @param {WordArray|string} password The password.
		 * @param {WordArray|string} salt A salt.
		 * @param {Object} cfg (Optional) The configuration options to use for this computation.
		 *
		 * @return {WordArray} The derived key.
		 *
		 * @static
		 *
		 * @example
		 *
		 *     var key = CryptoJS.PBKDF2(password, salt);
		 *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
		 *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
		 */
		C.PBKDF2 = function (password, salt, cfg) {
		    return PBKDF2.create(cfg).compute(password, salt);
		};
	}( /*ns.CryptoJS*/undefined ));
	
// TODO: Unmess this mess under ...
	
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(g,j){var e={},d=e.lib={},m=function(){},n=d.Base={extend:function(a){m.prototype=this;var c=new m;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
q=d.WordArray=n.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=j?c:4*a.length},toString:function(a){return(a||l).stringify(this)},concat:function(a){var c=this.words,p=a.words,f=this.sigBytes;a=a.sigBytes;this.clamp();if(f%4)for(var b=0;b<a;b++)c[f+b>>>2]|=(p[b>>>2]>>>24-8*(b%4)&255)<<24-8*((f+b)%4);else if(65535<p.length)for(b=0;b<a;b+=4)c[f+b>>>2]=p[b>>>2];else c.push.apply(c,p);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=g.ceil(c/4)},clone:function(){var a=n.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*g.random()|0);return new q.init(c,a)}}),b=e.enc={},l=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++){var d=c[f>>>2]>>>24-8*(f%4)&255;b.push((d>>>4).toString(16));b.push((d&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f+=2)b[f>>>3]|=parseInt(a.substr(f,
2),16)<<24-4*(f%8);return new q.init(b,c/2)}},k=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++)b.push(String.fromCharCode(c[f>>>2]>>>24-8*(f%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f++)b[f>>>2]|=(a.charCodeAt(f)&255)<<24-8*(f%4);return new q.init(b,c)}},h=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(k.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return k.parse(unescape(encodeURIComponent(a)))}},
u=d.BufferedBlockAlgorithm=n.extend({reset:function(){this._data=new q.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=h.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var b=this._data,d=b.words,f=b.sigBytes,l=this.blockSize,e=f/(4*l),e=a?g.ceil(e):g.max((e|0)-this._minBufferSize,0);a=e*l;f=g.min(4*a,f);if(a){for(var h=0;h<a;h+=l)this._doProcessBlock(d,h);h=d.splice(0,a);b.sigBytes-=f}return new q.init(h,f)},clone:function(){var a=n.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});d.Hasher=u.extend({cfg:n.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){u.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,d){return(new a.init(d)).finalize(b)}},_createHmacHelper:function(a){return function(b,d){return(new w.HMAC.init(a,
d)).finalize(b)}}});var w=e.algo={};return e}(Math);
(function(){var g=CryptoJS,j=g.lib,e=j.WordArray,d=j.Hasher,m=[],j=g.algo.SHA1=d.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(d,e){for(var b=this._hash.words,l=b[0],k=b[1],h=b[2],g=b[3],j=b[4],a=0;80>a;a++){if(16>a)m[a]=d[e+a]|0;else{var c=m[a-3]^m[a-8]^m[a-14]^m[a-16];m[a]=c<<1|c>>>31}c=(l<<5|l>>>27)+j+m[a];c=20>a?c+((k&h|~k&g)+1518500249):40>a?c+((k^h^g)+1859775393):60>a?c+((k&h|k&g|h&g)-1894007588):c+((k^h^
g)-899497514);j=g;g=h;h=k<<30|k>>>2;k=l;l=c}b[0]=b[0]+l|0;b[1]=b[1]+k|0;b[2]=b[2]+h|0;b[3]=b[3]+g|0;b[4]=b[4]+j|0},_doFinalize:function(){var d=this._data,e=d.words,b=8*this._nDataBytes,l=8*d.sigBytes;e[l>>>5]|=128<<24-l%32;e[(l+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(l+64>>>9<<4)+15]=b;d.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=d.clone.call(this);e._hash=this._hash.clone();return e}});g.SHA1=d._createHelper(j);g.HmacSHA1=d._createHmacHelper(j)})();
(function(){var g=CryptoJS,j=g.enc.Utf8;g.algo.HMAC=g.lib.Base.extend({init:function(e,d){e=this._hasher=new e.init;"string"==typeof d&&(d=j.parse(d));var g=e.blockSize,n=4*g;d.sigBytes>n&&(d=e.finalize(d));d.clamp();for(var q=this._oKey=d.clone(),b=this._iKey=d.clone(),l=q.words,k=b.words,h=0;h<g;h++)l[h]^=1549556828,k[h]^=909522486;q.sigBytes=b.sigBytes=n;this.reset()},reset:function(){var e=this._hasher;e.reset();e.update(this._iKey)},update:function(e){this._hasher.update(e);return this},finalize:function(e){var d=
this._hasher;e=d.finalize(e);d.reset();return d.finalize(this._oKey.clone().concat(e))}})})();
(function(){var g=CryptoJS,j=g.lib,e=j.Base,d=j.WordArray,j=g.algo,m=j.HMAC,n=j.PBKDF2=e.extend({cfg:e.extend({keySize:4,hasher:j.SHA1,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(e,b){for(var g=this.cfg,k=m.create(g.hasher,e),h=d.create(),j=d.create([1]),n=h.words,a=j.words,c=g.keySize,g=g.iterations;n.length<c;){var p=k.update(b).finalize(j);k.reset();for(var f=p.words,v=f.length,s=p,t=1;t<g;t++){s=k.finalize(s);k.reset();for(var x=s.words,r=0;r<v;r++)f[r]^=x[r]}h.concat(p);
a[0]++}h.sigBytes=4*c;return h}});g.PBKDF2=function(d,b,e){return n.create(e).compute(d,b)}})();
	
	
	ns.CryptoJS = CryptoJS;
	
	
	// --- jsencrypt.js --------------------------------------------------------------------------------------------- //
	
	
	ns.JSEncryptExports = {};
	
	(function(exports) {
		
		// Copyright (c) 2005  Tom Wu
		// All Rights Reserved.
		// See "LICENSE" for details.

		// Basic JavaScript BN library - subset useful for RSA encryption.

		// Bits per digit
		var dbits;

		// JavaScript engine analysis
		var canary = 0xdeadbeefcafe;
		var j_lm = ((canary&0xffffff)==0xefcafe);

		// (public) Constructor
		function BigInteger(a,b,c) {
		  if(a != null)
			if("number" == typeof a) this.fromNumber(a,b,c);
			else if(b == null && "string" != typeof a) this.fromString(a,256);
			else this.fromString(a,b);
		}

		// return new, unset BigInteger
		function nbi() { return new BigInteger(null); }

		// am: Compute w_j += (x*this_i), propagate carries,
		// c is initial carry, returns final carry.
		// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
		// We need to select the fastest one that works in this environment.

		// am1: use a single mult and divide to get the high bits,
		// max digit bits should be 26 because
		// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
		function am1(i,x,w,j,c,n) {
		  while(--n >= 0) {
			var v = x*this[i++]+w[j]+c;
			c = Math.floor(v/0x4000000);
			w[j++] = v&0x3ffffff;
		  }
		  return c;
		}
		// am2 avoids a big mult-and-extract completely.
		// Max digit bits should be <= 30 because we do bitwise ops
		// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
		function am2(i,x,w,j,c,n) {
		  var xl = x&0x7fff, xh = x>>15;
		  while(--n >= 0) {
			var l = this[i]&0x7fff;
			var h = this[i++]>>15;
			var m = xh*l+h*xl;
			l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
			c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
			w[j++] = l&0x3fffffff;
		  }
		  return c;
		}
		// Alternately, set max digit bits to 28 since some
		// browsers slow down when dealing with 32-bit numbers.
		function am3(i,x,w,j,c,n) {
		  var xl = x&0x3fff, xh = x>>14;
		  while(--n >= 0) {
			var l = this[i]&0x3fff;
			var h = this[i++]>>14;
			var m = xh*l+h*xl;
			l = xl*l+((m&0x3fff)<<14)+w[j]+c;
			c = (l>>28)+(m>>14)+xh*h;
			w[j++] = l&0xfffffff;
		  }
		  return c;
		}
		if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
		  BigInteger.prototype.am = am2;
		  dbits = 30;
		}
		else if(j_lm && (navigator.appName != "Netscape")) {
		  BigInteger.prototype.am = am1;
		  dbits = 26;
		}
		else { // Mozilla/Netscape seems to prefer am3
		  BigInteger.prototype.am = am3;
		  dbits = 28;
		}

		BigInteger.prototype.DB = dbits;
		BigInteger.prototype.DM = ((1<<dbits)-1);
		BigInteger.prototype.DV = (1<<dbits);

		var BI_FP = 52;
		BigInteger.prototype.FV = Math.pow(2,BI_FP);
		BigInteger.prototype.F1 = BI_FP-dbits;
		BigInteger.prototype.F2 = 2*dbits-BI_FP;

		// Digit conversions
		var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
		var BI_RC = new Array();
		var rr,vv;
		rr = "0".charCodeAt(0);
		for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
		rr = "a".charCodeAt(0);
		for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
		rr = "A".charCodeAt(0);
		for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

		function int2char(n) { return BI_RM.charAt(n); }
		function intAt(s,i) {
		  var c = BI_RC[s.charCodeAt(i)];
		  return (c==null)?-1:c;
		}

		// (protected) copy this to r
		function bnpCopyTo(r) {
		  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
		  r.t = this.t;
		  r.s = this.s;
		}

		// (protected) set from integer value x, -DV <= x < DV
		function bnpFromInt(x) {
		  this.t = 1;
		  this.s = (x<0)?-1:0;
		  if(x > 0) this[0] = x;
		  else if(x < -1) this[0] = x+this.DV;
		  else this.t = 0;
		}

		// return bigint initialized to value
		function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

		// (protected) set from string and radix
		function bnpFromString(s,b) {
		  var k;
		  if(b == 16) k = 4;
		  else if(b == 8) k = 3;
		  else if(b == 256) k = 8; // byte array
		  else if(b == 2) k = 1;
		  else if(b == 32) k = 5;
		  else if(b == 4) k = 2;
		  else { this.fromRadix(s,b); return; }
		  this.t = 0;
		  this.s = 0;
		  var i = s.length, mi = false, sh = 0;
		  while(--i >= 0) {
			var x = (k==8)?s[i]&0xff:intAt(s,i);
			if(x < 0) {
			  if(s.charAt(i) == "-") mi = true;
			  continue;
			}
			mi = false;
			if(sh == 0)
			  this[this.t++] = x;
			else if(sh+k > this.DB) {
			  this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
			  this[this.t++] = (x>>(this.DB-sh));
			}
			else
			  this[this.t-1] |= x<<sh;
			sh += k;
			if(sh >= this.DB) sh -= this.DB;
		  }
		  if(k == 8 && (s[0]&0x80) != 0) {
			this.s = -1;
			if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
		  }
		  this.clamp();
		  if(mi) BigInteger.ZERO.subTo(this,this);
		}

		// (protected) clamp off excess high words
		function bnpClamp() {
		  var c = this.s&this.DM;
		  while(this.t > 0 && this[this.t-1] == c) --this.t;
		}

		// (public) return string representation in given radix
		function bnToString(b) {
		  if(this.s < 0) return "-"+this.negate().toString(b);
		  var k;
		  if(b == 16) k = 4;
		  else if(b == 8) k = 3;
		  else if(b == 2) k = 1;
		  else if(b == 32) k = 5;
		  else if(b == 4) k = 2;
		  else return this.toRadix(b);
		  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
		  var p = this.DB-(i*this.DB)%k;
		  if(i-- > 0) {
			if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
			while(i >= 0) {
			  if(p < k) {
				d = (this[i]&((1<<p)-1))<<(k-p);
				d |= this[--i]>>(p+=this.DB-k);
			  }
			  else {
				d = (this[i]>>(p-=k))&km;
				if(p <= 0) { p += this.DB; --i; }
			  }
			  if(d > 0) m = true;
			  if(m) r += int2char(d);
			}
		  }
		  return m?r:"0";
		}

		// (public) -this
		function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

		// (public) |this|
		function bnAbs() { return (this.s<0)?this.negate():this; }

		// (public) return + if this > a, - if this < a, 0 if equal
		function bnCompareTo(a) {
		  var r = this.s-a.s;
		  if(r != 0) return r;
		  var i = this.t;
		  r = i-a.t;
		  if(r != 0) return (this.s<0)?-r:r;
		  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
		  return 0;
		}

		// returns bit length of the integer x
		function nbits(x) {
		  var r = 1, t;
		  if((t=x>>>16) != 0) { x = t; r += 16; }
		  if((t=x>>8) != 0) { x = t; r += 8; }
		  if((t=x>>4) != 0) { x = t; r += 4; }
		  if((t=x>>2) != 0) { x = t; r += 2; }
		  if((t=x>>1) != 0) { x = t; r += 1; }
		  return r;
		}

		// (public) return the number of bits in "this"
		function bnBitLength() {
		  if(this.t <= 0) return 0;
		  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
		}

		// (protected) r = this << n*DB
		function bnpDLShiftTo(n,r) {
		  var i;
		  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
		  for(i = n-1; i >= 0; --i) r[i] = 0;
		  r.t = this.t+n;
		  r.s = this.s;
		}

		// (protected) r = this >> n*DB
		function bnpDRShiftTo(n,r) {
		  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
		  r.t = Math.max(this.t-n,0);
		  r.s = this.s;
		}

		// (protected) r = this << n
		function bnpLShiftTo(n,r) {
		  var bs = n%this.DB;
		  var cbs = this.DB-bs;
		  var bm = (1<<cbs)-1;
		  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
		  for(i = this.t-1; i >= 0; --i) {
			r[i+ds+1] = (this[i]>>cbs)|c;
			c = (this[i]&bm)<<bs;
		  }
		  for(i = ds-1; i >= 0; --i) r[i] = 0;
		  r[ds] = c;
		  r.t = this.t+ds+1;
		  r.s = this.s;
		  r.clamp();
		}

		// (protected) r = this >> n
		function bnpRShiftTo(n,r) {
		  r.s = this.s;
		  var ds = Math.floor(n/this.DB);
		  if(ds >= this.t) { r.t = 0; return; }
		  var bs = n%this.DB;
		  var cbs = this.DB-bs;
		  var bm = (1<<bs)-1;
		  r[0] = this[ds]>>bs;
		  for(var i = ds+1; i < this.t; ++i) {
			r[i-ds-1] |= (this[i]&bm)<<cbs;
			r[i-ds] = this[i]>>bs;
		  }
		  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
		  r.t = this.t-ds;
		  r.clamp();
		}

		// (protected) r = this - a
		function bnpSubTo(a,r) {
		  var i = 0, c = 0, m = Math.min(a.t,this.t);
		  while(i < m) {
			c += this[i]-a[i];
			r[i++] = c&this.DM;
			c >>= this.DB;
		  }
		  if(a.t < this.t) {
			c -= a.s;
			while(i < this.t) {
			  c += this[i];
			  r[i++] = c&this.DM;
			  c >>= this.DB;
			}
			c += this.s;
		  }
		  else {
			c += this.s;
			while(i < a.t) {
			  c -= a[i];
			  r[i++] = c&this.DM;
			  c >>= this.DB;
			}
			c -= a.s;
		  }
		  r.s = (c<0)?-1:0;
		  if(c < -1) r[i++] = this.DV+c;
		  else if(c > 0) r[i++] = c;
		  r.t = i;
		  r.clamp();
		}

		// (protected) r = this * a, r != this,a (HAC 14.12)
		// "this" should be the larger one if appropriate.
		function bnpMultiplyTo(a,r) {
		  var x = this.abs(), y = a.abs();
		  var i = x.t;
		  r.t = i+y.t;
		  while(--i >= 0) r[i] = 0;
		  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
		  r.s = 0;
		  r.clamp();
		  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
		}

		// (protected) r = this^2, r != this (HAC 14.16)
		function bnpSquareTo(r) {
		  var x = this.abs();
		  var i = r.t = 2*x.t;
		  while(--i >= 0) r[i] = 0;
		  for(i = 0; i < x.t-1; ++i) {
			var c = x.am(i,x[i],r,2*i,0,1);
			if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
			  r[i+x.t] -= x.DV;
			  r[i+x.t+1] = 1;
			}
		  }
		  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
		  r.s = 0;
		  r.clamp();
		}

		// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
		// r != q, this != m.  q or r may be null.
		function bnpDivRemTo(m,q,r) {
		  var pm = m.abs();
		  if(pm.t <= 0) return;
		  var pt = this.abs();
		  if(pt.t < pm.t) {
			if(q != null) q.fromInt(0);
			if(r != null) this.copyTo(r);
			return;
		  }
		  if(r == null) r = nbi();
		  var y = nbi(), ts = this.s, ms = m.s;
		  var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
		  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
		  else { pm.copyTo(y); pt.copyTo(r); }
		  var ys = y.t;
		  var y0 = y[ys-1];
		  if(y0 == 0) return;
		  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
		  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
		  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
		  y.dlShiftTo(j,t);
		  if(r.compareTo(t) >= 0) {
			r[r.t++] = 1;
			r.subTo(t,r);
		  }
		  BigInteger.ONE.dlShiftTo(ys,t);
		  t.subTo(y,y);	// "negative" y so we can replace sub with am later
		  while(y.t < ys) y[y.t++] = 0;
		  while(--j >= 0) {
			// Estimate quotient digit
			var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
			if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
			  y.dlShiftTo(j,t);
			  r.subTo(t,r);
			  while(r[i] < --qd) r.subTo(t,r);
			}
		  }
		  if(q != null) {
			r.drShiftTo(ys,q);
			if(ts != ms) BigInteger.ZERO.subTo(q,q);
		  }
		  r.t = ys;
		  r.clamp();
		  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
		  if(ts < 0) BigInteger.ZERO.subTo(r,r);
		}

		// (public) this mod a
		function bnMod(a) {
		  var r = nbi();
		  this.abs().divRemTo(a,null,r);
		  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
		  return r;
		}

		// Modular reduction using "classic" algorithm
		function Classic(m) { this.m = m; }
		function cConvert(x) {
		  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
		  else return x;
		}
		function cRevert(x) { return x; }
		function cReduce(x) { x.divRemTo(this.m,null,x); }
		function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
		function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

		Classic.prototype.convert = cConvert;
		Classic.prototype.revert = cRevert;
		Classic.prototype.reduce = cReduce;
		Classic.prototype.mulTo = cMulTo;
		Classic.prototype.sqrTo = cSqrTo;

		// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
		// justification:
		//         xy == 1 (mod m)
		//         xy =  1+km
		//   xy(2-xy) = (1+km)(1-km)
		// x[y(2-xy)] = 1-k^2m^2
		// x[y(2-xy)] == 1 (mod m^2)
		// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
		// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
		// JS multiply "overflows" differently from C/C++, so care is needed here.
		function bnpInvDigit() {
		  if(this.t < 1) return 0;
		  var x = this[0];
		  if((x&1) == 0) return 0;
		  var y = x&3;		// y == 1/x mod 2^2
		  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
		  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
		  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
		  // last step - calculate inverse mod DV directly;
		  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
		  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
		  // we really want the negative inverse, and -DV < y < DV
		  return (y>0)?this.DV-y:-y;
		}

		// Montgomery reduction
		function Montgomery(m) {
		  this.m = m;
		  this.mp = m.invDigit();
		  this.mpl = this.mp&0x7fff;
		  this.mph = this.mp>>15;
		  this.um = (1<<(m.DB-15))-1;
		  this.mt2 = 2*m.t;
		}

		// xR mod m
		function montConvert(x) {
		  var r = nbi();
		  x.abs().dlShiftTo(this.m.t,r);
		  r.divRemTo(this.m,null,r);
		  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
		  return r;
		}

		// x/R mod m
		function montRevert(x) {
		  var r = nbi();
		  x.copyTo(r);
		  this.reduce(r);
		  return r;
		}

		// x = x/R mod m (HAC 14.32)
		function montReduce(x) {
		  while(x.t <= this.mt2)	// pad x so am has enough room later
			x[x.t++] = 0;
		  for(var i = 0; i < this.m.t; ++i) {
			// faster way of calculating u0 = x[i]*mp mod DV
			var j = x[i]&0x7fff;
			var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
			// use am to combine the multiply-shift-add into one call
			j = i+this.m.t;
			x[j] += this.m.am(0,u0,x,i,0,this.m.t);
			// propagate carry
			while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
		  }
		  x.clamp();
		  x.drShiftTo(this.m.t,x);
		  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
		}

		// r = "x^2/R mod m"; x != r
		function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

		// r = "xy/R mod m"; x,y != r
		function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

		Montgomery.prototype.convert = montConvert;
		Montgomery.prototype.revert = montRevert;
		Montgomery.prototype.reduce = montReduce;
		Montgomery.prototype.mulTo = montMulTo;
		Montgomery.prototype.sqrTo = montSqrTo;

		// (protected) true iff this is even
		function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

		// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
		function bnpExp(e,z) {
		  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
		  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
		  g.copyTo(r);
		  while(--i >= 0) {
			z.sqrTo(r,r2);
			if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
			else { var t = r; r = r2; r2 = t; }
		  }
		  return z.revert(r);
		}

		// (public) this^e % m, 0 <= e < 2^32
		function bnModPowInt(e,m) {
		  var z;
		  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
		  return this.exp(e,z);
		}

		// protected
		BigInteger.prototype.copyTo = bnpCopyTo;
		BigInteger.prototype.fromInt = bnpFromInt;
		BigInteger.prototype.fromString = bnpFromString;
		BigInteger.prototype.clamp = bnpClamp;
		BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
		BigInteger.prototype.drShiftTo = bnpDRShiftTo;
		BigInteger.prototype.lShiftTo = bnpLShiftTo;
		BigInteger.prototype.rShiftTo = bnpRShiftTo;
		BigInteger.prototype.subTo = bnpSubTo;
		BigInteger.prototype.multiplyTo = bnpMultiplyTo;
		BigInteger.prototype.squareTo = bnpSquareTo;
		BigInteger.prototype.divRemTo = bnpDivRemTo;
		BigInteger.prototype.invDigit = bnpInvDigit;
		BigInteger.prototype.isEven = bnpIsEven;
		BigInteger.prototype.exp = bnpExp;

		// public
		BigInteger.prototype.toString = bnToString;
		BigInteger.prototype.negate = bnNegate;
		BigInteger.prototype.abs = bnAbs;
		BigInteger.prototype.compareTo = bnCompareTo;
		BigInteger.prototype.bitLength = bnBitLength;
		BigInteger.prototype.mod = bnMod;
		BigInteger.prototype.modPowInt = bnModPowInt;

		// "constants"
		BigInteger.ZERO = nbv(0);
		BigInteger.ONE = nbv(1);
		// Copyright (c) 2005-2009  Tom Wu
		// All Rights Reserved.
		// See "LICENSE" for details.

		// Extended JavaScript BN functions, required for RSA private ops.

		// Version 1.1: new BigInteger("0", 10) returns "proper" zero
		// Version 1.2: square() API, isProbablePrime fix

		// (public)
		function bnClone() { var r = nbi(); this.copyTo(r); return r; }

		// (public) return value as integer
		function bnIntValue() {
		  if(this.s < 0) {
			if(this.t == 1) return this[0]-this.DV;
			else if(this.t == 0) return -1;
		  }
		  else if(this.t == 1) return this[0];
		  else if(this.t == 0) return 0;
		  // assumes 16 < DB < 32
		  return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
		}

		// (public) return value as byte
		function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

		// (public) return value as short (assumes DB>=16)
		function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

		// (protected) return x s.t. r^x < DV
		function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

		// (public) 0 if this == 0, 1 if this > 0
		function bnSigNum() {
		  if(this.s < 0) return -1;
		  else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
		  else return 1;
		}

		// (protected) convert to radix string
		function bnpToRadix(b) {
		  if(b == null) b = 10;
		  if(this.signum() == 0 || b < 2 || b > 36) return "0";
		  var cs = this.chunkSize(b);
		  var a = Math.pow(b,cs);
		  var d = nbv(a), y = nbi(), z = nbi(), r = "";
		  this.divRemTo(d,y,z);
		  while(y.signum() > 0) {
			r = (a+z.intValue()).toString(b).substr(1) + r;
			y.divRemTo(d,y,z);
		  }
		  return z.intValue().toString(b) + r;
		}

		// (protected) convert from radix string
		function bnpFromRadix(s,b) {
		  this.fromInt(0);
		  if(b == null) b = 10;
		  var cs = this.chunkSize(b);
		  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
		  for(var i = 0; i < s.length; ++i) {
			var x = intAt(s,i);
			if(x < 0) {
			  if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
			  continue;
			}
			w = b*w+x;
			if(++j >= cs) {
			  this.dMultiply(d);
			  this.dAddOffset(w,0);
			  j = 0;
			  w = 0;
			}
		  }
		  if(j > 0) {
			this.dMultiply(Math.pow(b,j));
			this.dAddOffset(w,0);
		  }
		  if(mi) BigInteger.ZERO.subTo(this,this);
		}

		// (protected) alternate constructor
		function bnpFromNumber(a,b,c) {
		  if("number" == typeof b) {
			// new BigInteger(int,int,RNG)
			if(a < 2) this.fromInt(1);
			else {
			  this.fromNumber(a,c);
			  if(!this.testBit(a-1))	// force MSB set
				this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
			  if(this.isEven()) this.dAddOffset(1,0); // force odd
			  while(!this.isProbablePrime(b)) {
				this.dAddOffset(2,0);
				if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
			  }
			}
		  }
		  else {
			// new BigInteger(int,RNG)
			var x = new Array(), t = a&7;
			x.length = (a>>3)+1;
			b.nextBytes(x);
			if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
			this.fromString(x,256);
		  }
		}

		// (public) convert to bigendian byte array
		function bnToByteArray() {
		  var i = this.t, r = new Array();
		  r[0] = this.s;
		  var p = this.DB-(i*this.DB)%8, d, k = 0;
		  if(i-- > 0) {
			if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
			  r[k++] = d|(this.s<<(this.DB-p));
			while(i >= 0) {
			  if(p < 8) {
				d = (this[i]&((1<<p)-1))<<(8-p);
				d |= this[--i]>>(p+=this.DB-8);
			  }
			  else {
				d = (this[i]>>(p-=8))&0xff;
				if(p <= 0) { p += this.DB; --i; }
			  }
			  if((d&0x80) != 0) d |= -256;
			  if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
			  if(k > 0 || d != this.s) r[k++] = d;
			}
		  }
		  return r;
		}

		function bnEquals(a) { return(this.compareTo(a)==0); }
		function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
		function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

		// (protected) r = this op a (bitwise)
		function bnpBitwiseTo(a,op,r) {
		  var i, f, m = Math.min(a.t,this.t);
		  for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
		  if(a.t < this.t) {
			f = a.s&this.DM;
			for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
			r.t = this.t;
		  }
		  else {
			f = this.s&this.DM;
			for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
			r.t = a.t;
		  }
		  r.s = op(this.s,a.s);
		  r.clamp();
		}

		// (public) this & a
		function op_and(x,y) { return x&y; }
		function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

		// (public) this | a
		function op_or(x,y) { return x|y; }
		function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

		// (public) this ^ a
		function op_xor(x,y) { return x^y; }
		function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

		// (public) this & ~a
		function op_andnot(x,y) { return x&~y; }
		function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

		// (public) ~this
		function bnNot() {
		  var r = nbi();
		  for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
		  r.t = this.t;
		  r.s = ~this.s;
		  return r;
		}

		// (public) this << n
		function bnShiftLeft(n) {
		  var r = nbi();
		  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
		  return r;
		}

		// (public) this >> n
		function bnShiftRight(n) {
		  var r = nbi();
		  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
		  return r;
		}

		// return index of lowest 1-bit in x, x < 2^31
		function lbit(x) {
		  if(x == 0) return -1;
		  var r = 0;
		  if((x&0xffff) == 0) { x >>= 16; r += 16; }
		  if((x&0xff) == 0) { x >>= 8; r += 8; }
		  if((x&0xf) == 0) { x >>= 4; r += 4; }
		  if((x&3) == 0) { x >>= 2; r += 2; }
		  if((x&1) == 0) ++r;
		  return r;
		}

		// (public) returns index of lowest 1-bit (or -1 if none)
		function bnGetLowestSetBit() {
		  for(var i = 0; i < this.t; ++i)
			if(this[i] != 0) return i*this.DB+lbit(this[i]);
		  if(this.s < 0) return this.t*this.DB;
		  return -1;
		}

		// return number of 1 bits in x
		function cbit(x) {
		  var r = 0;
		  while(x != 0) { x &= x-1; ++r; }
		  return r;
		}

		// (public) return number of set bits
		function bnBitCount() {
		  var r = 0, x = this.s&this.DM;
		  for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
		  return r;
		}

		// (public) true iff nth bit is set
		function bnTestBit(n) {
		  var j = Math.floor(n/this.DB);
		  if(j >= this.t) return(this.s!=0);
		  return((this[j]&(1<<(n%this.DB)))!=0);
		}

		// (protected) this op (1<<n)
		function bnpChangeBit(n,op) {
		  var r = BigInteger.ONE.shiftLeft(n);
		  this.bitwiseTo(r,op,r);
		  return r;
		}

		// (public) this | (1<<n)
		function bnSetBit(n) { return this.changeBit(n,op_or); }

		// (public) this & ~(1<<n)
		function bnClearBit(n) { return this.changeBit(n,op_andnot); }

		// (public) this ^ (1<<n)
		function bnFlipBit(n) { return this.changeBit(n,op_xor); }

		// (protected) r = this + a
		function bnpAddTo(a,r) {
		  var i = 0, c = 0, m = Math.min(a.t,this.t);
		  while(i < m) {
			c += this[i]+a[i];
			r[i++] = c&this.DM;
			c >>= this.DB;
		  }
		  if(a.t < this.t) {
			c += a.s;
			while(i < this.t) {
			  c += this[i];
			  r[i++] = c&this.DM;
			  c >>= this.DB;
			}
			c += this.s;
		  }
		  else {
			c += this.s;
			while(i < a.t) {
			  c += a[i];
			  r[i++] = c&this.DM;
			  c >>= this.DB;
			}
			c += a.s;
		  }
		  r.s = (c<0)?-1:0;
		  if(c > 0) r[i++] = c;
		  else if(c < -1) r[i++] = this.DV+c;
		  r.t = i;
		  r.clamp();
		}

		// (public) this + a
		function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

		// (public) this - a
		function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

		// (public) this * a
		function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

		// (public) this^2
		function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

		// (public) this / a
		function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

		// (public) this % a
		function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

		// (public) [this/a,this%a]
		function bnDivideAndRemainder(a) {
		  var q = nbi(), r = nbi();
		  this.divRemTo(a,q,r);
		  return new Array(q,r);
		}

		// (protected) this *= n, this >= 0, 1 < n < DV
		function bnpDMultiply(n) {
		  this[this.t] = this.am(0,n-1,this,0,0,this.t);
		  ++this.t;
		  this.clamp();
		}

		// (protected) this += n << w words, this >= 0
		function bnpDAddOffset(n,w) {
		  if(n == 0) return;
		  while(this.t <= w) this[this.t++] = 0;
		  this[w] += n;
		  while(this[w] >= this.DV) {
			this[w] -= this.DV;
			if(++w >= this.t) this[this.t++] = 0;
			++this[w];
		  }
		}

		// A "null" reducer
		function NullExp() {}
		function nNop(x) { return x; }
		function nMulTo(x,y,r) { x.multiplyTo(y,r); }
		function nSqrTo(x,r) { x.squareTo(r); }

		NullExp.prototype.convert = nNop;
		NullExp.prototype.revert = nNop;
		NullExp.prototype.mulTo = nMulTo;
		NullExp.prototype.sqrTo = nSqrTo;

		// (public) this^e
		function bnPow(e) { return this.exp(e,new NullExp()); }

		// (protected) r = lower n words of "this * a", a.t <= n
		// "this" should be the larger one if appropriate.
		function bnpMultiplyLowerTo(a,n,r) {
		  var i = Math.min(this.t+a.t,n);
		  r.s = 0; // assumes a,this >= 0
		  r.t = i;
		  while(i > 0) r[--i] = 0;
		  var j;
		  for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
		  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
		  r.clamp();
		}

		// (protected) r = "this * a" without lower n words, n > 0
		// "this" should be the larger one if appropriate.
		function bnpMultiplyUpperTo(a,n,r) {
		  --n;
		  var i = r.t = this.t+a.t-n;
		  r.s = 0; // assumes a,this >= 0
		  while(--i >= 0) r[i] = 0;
		  for(i = Math.max(n-this.t,0); i < a.t; ++i)
			r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
		  r.clamp();
		  r.drShiftTo(1,r);
		}

		// Barrett modular reduction
		function Barrett(m) {
		  // setup Barrett
		  this.r2 = nbi();
		  this.q3 = nbi();
		  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
		  this.mu = this.r2.divide(m);
		  this.m = m;
		}

		function barrettConvert(x) {
		  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
		  else if(x.compareTo(this.m) < 0) return x;
		  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
		}

		function barrettRevert(x) { return x; }

		// x = x mod m (HAC 14.42)
		function barrettReduce(x) {
		  x.drShiftTo(this.m.t-1,this.r2);
		  if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
		  this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
		  this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
		  while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
		  x.subTo(this.r2,x);
		  while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
		}

		// r = x^2 mod m; x != r
		function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

		// r = x*y mod m; x,y != r
		function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

		Barrett.prototype.convert = barrettConvert;
		Barrett.prototype.revert = barrettRevert;
		Barrett.prototype.reduce = barrettReduce;
		Barrett.prototype.mulTo = barrettMulTo;
		Barrett.prototype.sqrTo = barrettSqrTo;

		// (public) this^e % m (HAC 14.85)
		function bnModPow(e,m) {
		  var i = e.bitLength(), k, r = nbv(1), z;
		  if(i <= 0) return r;
		  else if(i < 18) k = 1;
		  else if(i < 48) k = 3;
		  else if(i < 144) k = 4;
		  else if(i < 768) k = 5;
		  else k = 6;
		  if(i < 8)
			z = new Classic(m);
		  else if(m.isEven())
			z = new Barrett(m);
		  else
			z = new Montgomery(m);

		  // precomputation
		  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
		  g[1] = z.convert(this);
		  if(k > 1) {
			var g2 = nbi();
			z.sqrTo(g[1],g2);
			while(n <= km) {
			  g[n] = nbi();
			  z.mulTo(g2,g[n-2],g[n]);
			  n += 2;
			}
		  }

		  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
		  i = nbits(e[j])-1;
		  while(j >= 0) {
			if(i >= k1) w = (e[j]>>(i-k1))&km;
			else {
			  w = (e[j]&((1<<(i+1))-1))<<(k1-i);
			  if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
			}

			n = k;
			while((w&1) == 0) { w >>= 1; --n; }
			if((i -= n) < 0) { i += this.DB; --j; }
			if(is1) {	// ret == 1, don't bother squaring or multiplying it
			  g[w].copyTo(r);
			  is1 = false;
			}
			else {
			  while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
			  if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
			  z.mulTo(r2,g[w],r);
			}

			while(j >= 0 && (e[j]&(1<<i)) == 0) {
			  z.sqrTo(r,r2); t = r; r = r2; r2 = t;
			  if(--i < 0) { i = this.DB-1; --j; }
			}
		  }
		  return z.revert(r);
		}

		// (public) gcd(this,a) (HAC 14.54)
		function bnGCD(a) {
		  var x = (this.s<0)?this.negate():this.clone();
		  var y = (a.s<0)?a.negate():a.clone();
		  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
		  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
		  if(g < 0) return x;
		  if(i < g) g = i;
		  if(g > 0) {
			x.rShiftTo(g,x);
			y.rShiftTo(g,y);
		  }
		  while(x.signum() > 0) {
			if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
			if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
			if(x.compareTo(y) >= 0) {
			  x.subTo(y,x);
			  x.rShiftTo(1,x);
			}
			else {
			  y.subTo(x,y);
			  y.rShiftTo(1,y);
			}
		  }
		  if(g > 0) y.lShiftTo(g,y);
		  return y;
		}

		// (protected) this % n, n < 2^26
		function bnpModInt(n) {
		  if(n <= 0) return 0;
		  var d = this.DV%n, r = (this.s<0)?n-1:0;
		  if(this.t > 0)
			if(d == 0) r = this[0]%n;
			else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
		  return r;
		}

		// (public) 1/this % m (HAC 14.61)
		function bnModInverse(m) {
		  var ac = m.isEven();
		  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
		  var u = m.clone(), v = this.clone();
		  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
		  while(u.signum() != 0) {
			while(u.isEven()) {
			  u.rShiftTo(1,u);
			  if(ac) {
				if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
				a.rShiftTo(1,a);
			  }
			  else if(!b.isEven()) b.subTo(m,b);
			  b.rShiftTo(1,b);
			}
			while(v.isEven()) {
			  v.rShiftTo(1,v);
			  if(ac) {
				if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
				c.rShiftTo(1,c);
			  }
			  else if(!d.isEven()) d.subTo(m,d);
			  d.rShiftTo(1,d);
			}
			if(u.compareTo(v) >= 0) {
			  u.subTo(v,u);
			  if(ac) a.subTo(c,a);
			  b.subTo(d,b);
			}
			else {
			  v.subTo(u,v);
			  if(ac) c.subTo(a,c);
			  d.subTo(b,d);
			}
		  }
		  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
		  if(d.compareTo(m) >= 0) return d.subtract(m);
		  if(d.signum() < 0) d.addTo(m,d); else return d;
		  if(d.signum() < 0) return d.add(m); else return d;
		}

		var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
		var lplim = (1<<26)/lowprimes[lowprimes.length-1];

		// (public) test primality with certainty >= 1-.5^t
		function bnIsProbablePrime(t) {
		  var i, x = this.abs();
		  if(x.t == 1 && x[0] <= lowprimes[lowprimes.length-1]) {
			for(i = 0; i < lowprimes.length; ++i)
			  if(x[0] == lowprimes[i]) return true;
			return false;
		  }
		  if(x.isEven()) return false;
		  i = 1;
		  while(i < lowprimes.length) {
			var m = lowprimes[i], j = i+1;
			while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
			m = x.modInt(m);
			while(i < j) if(m%lowprimes[i++] == 0) return false;
		  }
		  return x.millerRabin(t);
		}

		// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
		function bnpMillerRabin(t) {
		  var n1 = this.subtract(BigInteger.ONE);
		  var k = n1.getLowestSetBit();
		  if(k <= 0) return false;
		  var r = n1.shiftRight(k);
		  t = (t+1)>>1;
		  if(t > lowprimes.length) t = lowprimes.length;
		  var a = nbi();
		  for(var i = 0; i < t; ++i) {
			//Pick bases at random, instead of starting at 2
			a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
			var y = a.modPow(r,this);
			if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
			  var j = 1;
			  while(j++ < k && y.compareTo(n1) != 0) {
				y = y.modPowInt(2,this);
				if(y.compareTo(BigInteger.ONE) == 0) return false;
			  }
			  if(y.compareTo(n1) != 0) return false;
			}
		  }
		  return true;
		}

		// protected
		BigInteger.prototype.chunkSize = bnpChunkSize;
		BigInteger.prototype.toRadix = bnpToRadix;
		BigInteger.prototype.fromRadix = bnpFromRadix;
		BigInteger.prototype.fromNumber = bnpFromNumber;
		BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
		BigInteger.prototype.changeBit = bnpChangeBit;
		BigInteger.prototype.addTo = bnpAddTo;
		BigInteger.prototype.dMultiply = bnpDMultiply;
		BigInteger.prototype.dAddOffset = bnpDAddOffset;
		BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
		BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
		BigInteger.prototype.modInt = bnpModInt;
		BigInteger.prototype.millerRabin = bnpMillerRabin;

		// public
		BigInteger.prototype.clone = bnClone;
		BigInteger.prototype.intValue = bnIntValue;
		BigInteger.prototype.byteValue = bnByteValue;
		BigInteger.prototype.shortValue = bnShortValue;
		BigInteger.prototype.signum = bnSigNum;
		BigInteger.prototype.toByteArray = bnToByteArray;
		BigInteger.prototype.equals = bnEquals;
		BigInteger.prototype.min = bnMin;
		BigInteger.prototype.max = bnMax;
		BigInteger.prototype.and = bnAnd;
		BigInteger.prototype.or = bnOr;
		BigInteger.prototype.xor = bnXor;
		BigInteger.prototype.andNot = bnAndNot;
		BigInteger.prototype.not = bnNot;
		BigInteger.prototype.shiftLeft = bnShiftLeft;
		BigInteger.prototype.shiftRight = bnShiftRight;
		BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
		BigInteger.prototype.bitCount = bnBitCount;
		BigInteger.prototype.testBit = bnTestBit;
		BigInteger.prototype.setBit = bnSetBit;
		BigInteger.prototype.clearBit = bnClearBit;
		BigInteger.prototype.flipBit = bnFlipBit;
		BigInteger.prototype.add = bnAdd;
		BigInteger.prototype.subtract = bnSubtract;
		BigInteger.prototype.multiply = bnMultiply;
		BigInteger.prototype.divide = bnDivide;
		BigInteger.prototype.remainder = bnRemainder;
		BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
		BigInteger.prototype.modPow = bnModPow;
		BigInteger.prototype.modInverse = bnModInverse;
		BigInteger.prototype.pow = bnPow;
		BigInteger.prototype.gcd = bnGCD;
		BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

		// JSBN-specific extension
		BigInteger.prototype.square = bnSquare;

		// BigInteger interfaces not implemented in jsbn:

		// BigInteger(int signum, byte[] magnitude)
		// double doubleValue()
		// float floatValue()
		// int hashCode()
		// long longValue()
		// static BigInteger valueOf(long val)
		// prng4.js - uses Arcfour as a PRNG

		function Arcfour() {
		  this.i = 0;
		  this.j = 0;
		  this.S = new Array();
		}

		// Initialize arcfour context from key, an array of ints, each from [0..255]
		function ARC4init(key) {
		  var i, j, t;
		  for(i = 0; i < 256; ++i)
			this.S[i] = i;
		  j = 0;
		  for(i = 0; i < 256; ++i) {
			j = (j + this.S[i] + key[i % key.length]) & 255;
			t = this.S[i];
			this.S[i] = this.S[j];
			this.S[j] = t;
		  }
		  this.i = 0;
		  this.j = 0;
		}

		function ARC4next() {
		  var t;
		  this.i = (this.i + 1) & 255;
		  this.j = (this.j + this.S[this.i]) & 255;
		  t = this.S[this.i];
		  this.S[this.i] = this.S[this.j];
		  this.S[this.j] = t;
		  return this.S[(t + this.S[this.i]) & 255];
		}

		Arcfour.prototype.init = ARC4init;
		Arcfour.prototype.next = ARC4next;

		// Plug in your RNG constructor here
		function prng_newstate() {
		  return new Arcfour();
		}

		// Pool size must be a multiple of 4 and greater than 32.
		// An array of bytes the size of the pool will be passed to init()
		var rng_psize = 256;
		// Random number generator - requires a PRNG backend, e.g. prng4.js
		var rng_state;
		var rng_pool;
		var rng_pptr;

		// Initialize the pool with junk if needed.
		if(rng_pool == null) {
		  rng_pool = new Array();
		  rng_pptr = 0;
		  var t;
		  if(window.crypto && window.crypto.getRandomValues) {
			// Extract entropy (2048 bits) from RNG if available
			var z = new Uint32Array(256);
			window.crypto.getRandomValues(z);
			for (t = 0; t < z.length; ++t)
			  rng_pool[rng_pptr++] = z[t] & 255;
		  } 
		  
		  // Use mouse events for entropy, if we do not have enough entropy by the time
		  // we need it, entropy will be generated by Math.random.
		  var onMouseMoveListener = function(ev) {
			this.count = this.count || 0;
			if (this.count >= 256 || rng_pptr >= rng_psize) {
			  if (window.removeEventListener)
				window.removeEventListener("mousemove", onMouseMoveListener);
			  else if (window.detachEvent)
				window.detachEvent("onmousemove", onMouseMoveListener);
			  return;
			}
			this.count += 1;
			var mouseCoordinates = ev.x + ev.y;
			rng_pool[rng_pptr++] = mouseCoordinates & 255;
		  };
		  if (window.addEventListener)
			window.addEventListener("mousemove", onMouseMoveListener);
		  else if (window.attachEvent)
			window.attachEvent("onmousemove", onMouseMoveListener);
		  
		}

		function rng_get_byte() {
		  if(rng_state == null) {
			rng_state = prng_newstate();
			// At this point, we may not have collected enough entropy.  If not, fall back to Math.random
			while (rng_pptr < rng_psize) {
			  var random = Math.floor(65536 * Math.random());
			  rng_pool[rng_pptr++] = random & 255;
			}
			rng_state.init(rng_pool);
			for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
			  rng_pool[rng_pptr] = 0;
			rng_pptr = 0;
		  }
		  // TODO: allow reseeding after first request
		  return rng_state.next();
		}

		function rng_get_bytes(ba) {
		  var i;
		  for(i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
		}

		function SecureRandom() {}

		SecureRandom.prototype.nextBytes = rng_get_bytes;
		// Depends on jsbn.js and rng.js

		// Version 1.1: support utf-8 encoding in pkcs1pad2

		// convert a (hex) string to a bignum object
		function parseBigInt(str,r) {
		  return new BigInteger(str,r);
		}

		function linebrk(s,n) {
		  var ret = "";
		  var i = 0;
		  while(i + n < s.length) {
			ret += s.substring(i,i+n) + "\n";
			i += n;
		  }
		  return ret + s.substring(i,s.length);
		}

		function byte2Hex(b) {
		  if(b < 0x10)
			return "0" + b.toString(16);
		  else
			return b.toString(16);
		}

		// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
		function pkcs1pad2(s,n) {
		  if(n < s.length + 11) { // TODO: fix for utf-8
			console.error("Message too long for RSA");
			return null;
		  }
		  var ba = new Array();
		  var i = s.length - 1;
		  while(i >= 0 && n > 0) {
			var c = s.charCodeAt(i--);
			if(c < 128) { // encode using utf-8
			  ba[--n] = c;
			}
			else if((c > 127) && (c < 2048)) {
			  ba[--n] = (c & 63) | 128;
			  ba[--n] = (c >> 6) | 192;
			}
			else {
			  ba[--n] = (c & 63) | 128;
			  ba[--n] = ((c >> 6) & 63) | 128;
			  ba[--n] = (c >> 12) | 224;
			}
		  }
		  ba[--n] = 0;
		  var rng = new SecureRandom();
		  var x = new Array();
		  while(n > 2) { // random non-zero pad
			x[0] = 0;
			while(x[0] == 0) rng.nextBytes(x);
			ba[--n] = x[0];
		  }
		  ba[--n] = 2;
		  ba[--n] = 0;
		  return new BigInteger(ba);
		}

		// "empty" RSA key constructor
		function RSAKey() {
		  this.n = null;
		  this.e = 0;
		  this.d = null;
		  this.p = null;
		  this.q = null;
		  this.dmp1 = null;
		  this.dmq1 = null;
		  this.coeff = null;
		}

		// Set the public key fields N and e from hex strings
		function RSASetPublic(N,E) {
		  if(N != null && E != null && N.length > 0 && E.length > 0) {
			this.n = parseBigInt(N,16);
			this.e = parseInt(E,16);
		  }
		  else
			console.error("Invalid RSA public key");
		}

		// Perform raw public operation on "x": return x^e (mod n)
		function RSADoPublic(x) {
		  return x.modPowInt(this.e, this.n);
		}

		// Return the PKCS#1 RSA encryption of "text" as an even-length hex string
		function RSAEncrypt(text) {
		  var m = pkcs1pad2(text,(this.n.bitLength()+7)>>3);
		  if(m == null) return null;
		  var c = this.doPublic(m);
		  if(c == null) return null;
		  var h = c.toString(16);
		  if((h.length & 1) == 0) return h; else return "0" + h;
		}

		// Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
		//function RSAEncryptB64(text) {
		//  var h = this.encrypt(text);
		//  if(h) return hex2b64(h); else return null;
		//}

		// protected
		RSAKey.prototype.doPublic = RSADoPublic;

		// public
		RSAKey.prototype.setPublic = RSASetPublic;
		RSAKey.prototype.encrypt = RSAEncrypt;
		//RSAKey.prototype.encrypt_b64 = RSAEncryptB64;
		// Depends on rsa.js and jsbn2.js

		// Version 1.1: support utf-8 decoding in pkcs1unpad2

		// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
		function pkcs1unpad2(d,n) {
		  var b = d.toByteArray();
		  var i = 0;
		  while(i < b.length && b[i] == 0) ++i;
		  if(b.length-i != n-1 || b[i] != 2)
			return null;
		  ++i;
		  while(b[i] != 0)
			if(++i >= b.length) return null;
		  var ret = "";
		  while(++i < b.length) {
			var c = b[i] & 255;
			if(c < 128) { // utf-8 decode
			  ret += String.fromCharCode(c);
			}
			else if((c > 191) && (c < 224)) {
			  ret += String.fromCharCode(((c & 31) << 6) | (b[i+1] & 63));
			  ++i;
			}
			else {
			  ret += String.fromCharCode(((c & 15) << 12) | ((b[i+1] & 63) << 6) | (b[i+2] & 63));
			  i += 2;
			}
		  }
		  return ret;
		}

		// Set the private key fields N, e, and d from hex strings
		function RSASetPrivate(N,E,D) {
		  if(N != null && E != null && N.length > 0 && E.length > 0) {
			this.n = parseBigInt(N,16);
			this.e = parseInt(E,16);
			this.d = parseBigInt(D,16);
		  }
		  else
			console.error("Invalid RSA private key");
		}

		// Set the private key fields N, e, d and CRT params from hex strings
		function RSASetPrivateEx(N,E,D,P,Q,DP,DQ,C) {
		  if(N != null && E != null && N.length > 0 && E.length > 0) {
			this.n = parseBigInt(N,16);
			this.e = parseInt(E,16);
			this.d = parseBigInt(D,16);
			this.p = parseBigInt(P,16);
			this.q = parseBigInt(Q,16);
			this.dmp1 = parseBigInt(DP,16);
			this.dmq1 = parseBigInt(DQ,16);
			this.coeff = parseBigInt(C,16);
		  }
		  else
			console.error("Invalid RSA private key");
		}

		// Generate a new random private key B bits long, using public expt E
		function RSAGenerate(B,E) {
		  var rng = new SecureRandom();
		  var qs = B>>1;
		  this.e = parseInt(E,16);
		  var ee = new BigInteger(E,16);
		  for(;;) {
			for(;;) {
			  this.p = new BigInteger(B-qs,1,rng);
			  if(this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) break;
			}
			for(;;) {
			  this.q = new BigInteger(qs,1,rng);
			  if(this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) break;
			}
			if(this.p.compareTo(this.q) <= 0) {
			  var t = this.p;
			  this.p = this.q;
			  this.q = t;
			}
			var p1 = this.p.subtract(BigInteger.ONE);
			var q1 = this.q.subtract(BigInteger.ONE);
			var phi = p1.multiply(q1);
			if(phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
			  this.n = this.p.multiply(this.q);
			  this.d = ee.modInverse(phi);
			  this.dmp1 = this.d.mod(p1);
			  this.dmq1 = this.d.mod(q1);
			  this.coeff = this.q.modInverse(this.p);
			  break;
			}
		  }
		}

		// Perform raw private operation on "x": return x^d (mod n)
		function RSADoPrivate(x) {
		  if(this.p == null || this.q == null)
			return x.modPow(this.d, this.n);

		  // TODO: re-calculate any missing CRT params
		  var xp = x.mod(this.p).modPow(this.dmp1, this.p);
		  var xq = x.mod(this.q).modPow(this.dmq1, this.q);

		  while(xp.compareTo(xq) < 0)
			xp = xp.add(this.p);
		  return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
		}

		// Return the PKCS#1 RSA decryption of "ctext".
		// "ctext" is an even-length hex string and the output is a plain string.
		function RSADecrypt(ctext) {
		  var c = parseBigInt(ctext, 16);
		  var m = this.doPrivate(c);
		  if(m == null) return null;
		  return pkcs1unpad2(m, (this.n.bitLength()+7)>>3);
		}

		// Return the PKCS#1 RSA decryption of "ctext".
		// "ctext" is a Base64-encoded string and the output is a plain string.
		//function RSAB64Decrypt(ctext) {
		//  var h = b64tohex(ctext);
		//  if(h) return this.decrypt(h); else return null;
		//}

		// protected
		RSAKey.prototype.doPrivate = RSADoPrivate;

		// public
		RSAKey.prototype.setPrivate = RSASetPrivate;
		RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
		RSAKey.prototype.generate = RSAGenerate;
		RSAKey.prototype.decrypt = RSADecrypt;
		//RSAKey.prototype.b64_decrypt = RSAB64Decrypt;
		// Copyright (c) 2011  Kevin M Burns Jr.
		// All Rights Reserved.
		// See "LICENSE" for details.
		//
		// Extension to jsbn which adds facilities for asynchronous RSA key generation
		// Primarily created to avoid execution timeout on mobile devices
		//
		// http://www-cs-students.stanford.edu/~tjw/jsbn/
		//
		// ---

		(function(){
		
			// Generate a new random private key B bits long, using public expt E
			var RSAGenerateAsync = function (B, E, callback) {
				//var rng = new SeededRandom();
				var rng = new SecureRandom();
				var qs = B >> 1;
				this.e = parseInt(E, 16);
				var ee = new BigInteger(E, 16);
				var rsa = this;
				// These functions have non-descript names because they were originally for(;;) loops.
				// I don't know about cryptography to give them better names than loop1-4.
				var loop1 = function() {
					var loop4 = function() {
						if (rsa.p.compareTo(rsa.q) <= 0) {
						    var t = rsa.p;
						    rsa.p = rsa.q;
						    rsa.q = t;
						}
						var p1 = rsa.p.subtract(BigInteger.ONE);
						var q1 = rsa.q.subtract(BigInteger.ONE);
						var phi = p1.multiply(q1);
						if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
						    rsa.n = rsa.p.multiply(rsa.q);
						    rsa.d = ee.modInverse(phi);
						    rsa.dmp1 = rsa.d.mod(p1);
						    rsa.dmq1 = rsa.d.mod(q1);
						    rsa.coeff = rsa.q.modInverse(rsa.p);
						    setTimeout(function(){callback()},0); // escape
						} else {
						    setTimeout(loop1,0);
						}
					};
					var loop3 = function() {
						rsa.q = nbi();
						rsa.q.fromNumberAsync(qs, 1, rng, function(){
						    rsa.q.subtract(BigInteger.ONE).gcda(ee, function(r){
						        if (r.compareTo(BigInteger.ONE) == 0 && rsa.q.isProbablePrime(10)) {
						            setTimeout(loop4,0);
						        } else {
						            setTimeout(loop3,0);
						        }
						    });
						});
					};
					var loop2 = function() {
						rsa.p = nbi();
						rsa.p.fromNumberAsync(B - qs, 1, rng, function(){
						    rsa.p.subtract(BigInteger.ONE).gcda(ee, function(r){
						        if (r.compareTo(BigInteger.ONE) == 0 && rsa.p.isProbablePrime(10)) {
						            setTimeout(loop3,0);
						        } else {
						            setTimeout(loop2,0);
						        }
						    });
						});
					};
					setTimeout(loop2,0);
				};
				setTimeout(loop1,0);
			};
			RSAKey.prototype.generateAsync = RSAGenerateAsync;

			// Public API method
			var bnGCDAsync = function (a, callback) {
				var x = (this.s < 0) ? this.negate() : this.clone();
				var y = (a.s < 0) ? a.negate() : a.clone();
				if (x.compareTo(y) < 0) {
					var t = x;
					x = y;
					y = t;
				}
				var i = x.getLowestSetBit(),
					g = y.getLowestSetBit();
				if (g < 0) {
					callback(x);
					return;
				}
				if (i < g) g = i;
				if (g > 0) {
					x.rShiftTo(g, x);
					y.rShiftTo(g, y);
				}
				// Workhorse of the algorithm, gets called 200 - 800 times per 512 bit keygen.
				var gcda1 = function() {
					if ((i = x.getLowestSetBit()) > 0){ x.rShiftTo(i, x); }
					if ((i = y.getLowestSetBit()) > 0){ y.rShiftTo(i, y); }
					if (x.compareTo(y) >= 0) {
						x.subTo(y, x);
						x.rShiftTo(1, x);
					} else {
						y.subTo(x, y);
						y.rShiftTo(1, y);
					}
					if(!(x.signum() > 0)) {
						if (g > 0) y.lShiftTo(g, y);
						setTimeout(function(){callback(y)},0); // escape
					} else {
						setTimeout(gcda1,0);
					}
				};
				setTimeout(gcda1,10);
			};
			BigInteger.prototype.gcda = bnGCDAsync;

			// (protected) alternate constructor
			var bnpFromNumberAsync = function (a,b,c,callback) {
			  if("number" == typeof b) {
				if(a < 2) {
					this.fromInt(1);
				} else {
				  this.fromNumber(a,c);
				  if(!this.testBit(a-1)){
					this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
				  }
				  if(this.isEven()) {
					this.dAddOffset(1,0);
				  }
				  var bnp = this;
				  var bnpfn1 = function(){
					bnp.dAddOffset(2,0);
					if(bnp.bitLength() > a) bnp.subTo(BigInteger.ONE.shiftLeft(a-1),bnp);
					if(bnp.isProbablePrime(b)) {
						setTimeout(function(){callback()},0); // escape
					} else {
						setTimeout(bnpfn1,0);
					}
				  };
				  setTimeout(bnpfn1,0);
				}
			  } else {
				var x = new Array(), t = a&7;
				x.length = (a>>3)+1;
				b.nextBytes(x);
				if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
				this.fromString(x,256);
			  }
			};
			BigInteger.prototype.fromNumberAsync = bnpFromNumberAsync;
		
		})();
	
		var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		var b64pad="=";

		function hex2b64(h) {
		  var i;
		  var c;
		  var ret = "";
		  for(i = 0; i+3 <= h.length; i+=3) {
			c = parseInt(h.substring(i,i+3),16);
			ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
		  }
		  if(i+1 == h.length) {
			c = parseInt(h.substring(i,i+1),16);
			ret += b64map.charAt(c << 2);
		  }
		  else if(i+2 == h.length) {
			c = parseInt(h.substring(i,i+2),16);
			ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
		  }
		  while((ret.length & 3) > 0) ret += b64pad;
		  return ret;
		}

		// convert a base64 string to hex
		function b64tohex(s) {
		  var ret = ""
		  var i;
		  var k = 0; // b64 state, 0-3
		  var slop;
		  for(i = 0; i < s.length; ++i) {
			if(s.charAt(i) == b64pad) break;
			v = b64map.indexOf(s.charAt(i));
			if(v < 0) continue;
			if(k == 0) {
			  ret += int2char(v >> 2);
			  slop = v & 3;
			  k = 1;
			}
			else if(k == 1) {
			  ret += int2char((slop << 2) | (v >> 4));
			  slop = v & 0xf;
			  k = 2;
			}
			else if(k == 2) {
			  ret += int2char(slop);
			  ret += int2char(v >> 2);
			  slop = v & 3;
			  k = 3;
			}
			else {
			  ret += int2char((slop << 2) | (v >> 4));
			  ret += int2char(v & 0xf);
			  k = 0;
			}
		  }
		  if(k == 1)
			ret += int2char(slop << 2);
		  return ret;
		}

		// convert a base64 string to a byte/number array
		function b64toBA(s) {
		  //piggyback on b64tohex for now, optimize later
		  var h = b64tohex(s);
		  var i;
		  var a = new Array();
		  for(i = 0; 2*i < h.length; ++i) {
			a[i] = parseInt(h.substring(2*i,2*i+2),16);
		  }
		  return a;
		}
		/*! asn1-1.0.2.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
		 */

		var JSX = JSX || {};
		JSX.env = JSX.env || {};

		var L = JSX, OP = Object.prototype, FUNCTION_TOSTRING = '[object Function]',ADD = ["toString", "valueOf"];

		JSX.env.parseUA = function(agent) {

			var numberify = function(s) {
				var c = 0;
				return parseFloat(s.replace(/\./g, function() {
				    return (c++ == 1) ? '' : '.';
				}));
			},

			nav = navigator,
			o = {
				ie: 0,
				opera: 0,
				gecko: 0,
				webkit: 0,
				chrome: 0,
				mobile: null,
				air: 0,
				ipad: 0,
				iphone: 0,
				ipod: 0,
				ios: null,
				android: 0,
				webos: 0,
				caja: nav && nav.cajaVersion,
				secure: false,
				os: null

			},

			ua = agent || (navigator && navigator.userAgent),
			loc = window && window.location,
			href = loc && loc.href,
			m;

			o.secure = href && (href.toLowerCase().indexOf("https") === 0);

			if (ua) {

				if ((/windows|win32/i).test(ua)) {
				    o.os = 'windows';
				} else if ((/macintosh/i).test(ua)) {
				    o.os = 'macintosh';
				} else if ((/rhino/i).test(ua)) {
				    o.os = 'rhino';
				}
				if ((/KHTML/).test(ua)) {
				    o.webkit = 1;
				}
				m = ua.match(/AppleWebKit\/([^\s]*)/);
				if (m && m[1]) {
				    o.webkit = numberify(m[1]);
				    if (/ Mobile\//.test(ua)) {
				        o.mobile = 'Apple'; // iPhone or iPod Touch
				        m = ua.match(/OS ([^\s]*)/);
				        if (m && m[1]) {
				            m = numberify(m[1].replace('_', '.'));
				        }
				        o.ios = m;
				        o.ipad = o.ipod = o.iphone = 0;
				        m = ua.match(/iPad|iPod|iPhone/);
				        if (m && m[0]) {
				            o[m[0].toLowerCase()] = o.ios;
				        }
				    } else {
				        m = ua.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/);
				        if (m) {
				            o.mobile = m[0];
				        }
				        if (/webOS/.test(ua)) {
				            o.mobile = 'WebOS';
				            m = ua.match(/webOS\/([^\s]*);/);
				            if (m && m[1]) {
				                o.webos = numberify(m[1]);
				            }
				        }
				        if (/ Android/.test(ua)) {
				            o.mobile = 'Android';
				            m = ua.match(/Android ([^\s]*);/);
				            if (m && m[1]) {
				                o.android = numberify(m[1]);
				            }
				        }
				    }
				    m = ua.match(/Chrome\/([^\s]*)/);
				    if (m && m[1]) {
				        o.chrome = numberify(m[1]); // Chrome
				    } else {
				        m = ua.match(/AdobeAIR\/([^\s]*)/);
				        if (m) {
				            o.air = m[0]; // Adobe AIR 1.0 or better
				        }
				    }
				}
				if (!o.webkit) {
				    m = ua.match(/Opera[\s\/]([^\s]*)/);
				    if (m && m[1]) {
				        o.opera = numberify(m[1]);
				        m = ua.match(/Version\/([^\s]*)/);
				        if (m && m[1]) {
				            o.opera = numberify(m[1]); // opera 10+
				        }
				        m = ua.match(/Opera Mini[^;]*/);
				        if (m) {
				            o.mobile = m[0]; // ex: Opera Mini/2.0.4509/1316
				        }
				    } else { // not opera or webkit
				        m = ua.match(/MSIE\s([^;]*)/);
				        if (m && m[1]) {
				            o.ie = numberify(m[1]);
				        } else { // not opera, webkit, or ie
				            m = ua.match(/Gecko\/([^\s]*)/);
				            if (m) {
				                o.gecko = 1; // Gecko detected, look for revision
				                m = ua.match(/rv:([^\s\)]*)/);
				                if (m && m[1]) {
				                    o.gecko = numberify(m[1]);
				                }
				            }
				        }
				    }
				}
			}
			return o;
		};

		JSX.env.ua = JSX.env.parseUA();

		JSX.isFunction = function(o) {
			return (typeof o === 'function') || OP.toString.apply(o) === FUNCTION_TOSTRING;
		};

		JSX._IEEnumFix = (JSX.env.ua.ie) ? function(r, s) {
			var i, fname, f;
			for (i=0;i<ADD.length;i=i+1) {

				fname = ADD[i];
				f = s[fname];

				if (L.isFunction(f) && f!=OP[fname]) {
				    r[fname]=f;
				}
			}
		} : function(){};

		JSX.extend = function(subc, superc, overrides) {
			if (!superc||!subc) {
				throw new Error("extend failed, please check that " +
				                "all dependencies are included.");
			}
			var F = function() {}, i;
			F.prototype=superc.prototype;
			subc.prototype=new F();
			subc.prototype.constructor=subc;
			subc.superclass=superc.prototype;
			if (superc.prototype.constructor == OP.constructor) {
				superc.prototype.constructor=superc;
			}

			if (overrides) {
				for (i in overrides) {
				    if (L.hasOwnProperty(overrides, i)) {
				        subc.prototype[i]=overrides[i];
				    }
				}

				L._IEEnumFix(subc.prototype, overrides);
			}
		};

		/*
		 * asn1.js - ASN.1 DER encoder classes
		 *
		 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
		 *
		 * This software is licensed under the terms of the MIT License.
		 * http://kjur.github.com/jsrsasign/license
		 *
		 * The above copyright and license notice shall be 
		 * included in all copies or substantial portions of the Software.
		 */

		/**
		 * @fileOverview
		 * @name asn1-1.0.js
		 * @author Kenji Urushima kenji.urushima@gmail.com
		 * @version 1.0.2 (2013-May-30)
		 * @since 2.1
		 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
		 */

		/** 
		 * kjur's class library name space
		 * <p>
		 * This name space provides following name spaces:
		 * <ul>
		 * <li>{@link KJUR.asn1} - ASN.1 primitive hexadecimal encoder</li>
		 * <li>{@link KJUR.asn1.x509} - ASN.1 structure for X.509 certificate and CRL</li>
		 * <li>{@link KJUR.crypto} - Java Cryptographic Extension(JCE) style MessageDigest/Signature 
		 * class and utilities</li>
		 * </ul>
		 * </p> 
		 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
		  * @name KJUR
		 * @namespace kjur's class library name space
		 */
		if (typeof KJUR == "undefined" || !KJUR) KJUR = {};

		/**
		 * kjur's ASN.1 class library name space
		 * <p>
		 * This is ITU-T X.690 ASN.1 DER encoder class library and
		 * class structure and methods is very similar to 
		 * org.bouncycastle.asn1 package of 
		 * well known BouncyCaslte Cryptography Library.
		 *
		 * <h4>PROVIDING ASN.1 PRIMITIVES</h4>
		 * Here are ASN.1 DER primitive classes.
		 * <ul>
		 * <li>{@link KJUR.asn1.DERBoolean}</li>
		 * <li>{@link KJUR.asn1.DERInteger}</li>
		 * <li>{@link KJUR.asn1.DERBitString}</li>
		 * <li>{@link KJUR.asn1.DEROctetString}</li>
		 * <li>{@link KJUR.asn1.DERNull}</li>
		 * <li>{@link KJUR.asn1.DERObjectIdentifier}</li>
		 * <li>{@link KJUR.asn1.DERUTF8String}</li>
		 * <li>{@link KJUR.asn1.DERNumericString}</li>
		 * <li>{@link KJUR.asn1.DERPrintableString}</li>
		 * <li>{@link KJUR.asn1.DERTeletexString}</li>
		 * <li>{@link KJUR.asn1.DERIA5String}</li>
		 * <li>{@link KJUR.asn1.DERUTCTime}</li>
		 * <li>{@link KJUR.asn1.DERGeneralizedTime}</li>
		 * <li>{@link KJUR.asn1.DERSequence}</li>
		 * <li>{@link KJUR.asn1.DERSet}</li>
		 * </ul>
		 *
		 * <h4>OTHER ASN.1 CLASSES</h4>
		 * <ul>
		 * <li>{@link KJUR.asn1.ASN1Object}</li>
		 * <li>{@link KJUR.asn1.DERAbstractString}</li>
		 * <li>{@link KJUR.asn1.DERAbstractTime}</li>
		 * <li>{@link KJUR.asn1.DERAbstractStructured}</li>
		 * <li>{@link KJUR.asn1.DERTaggedObject}</li>
		 * </ul>
		 * </p>
		 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
		 * @name KJUR.asn1
		 * @namespace
		 */
		if (typeof KJUR.asn1 == "undefined" || !KJUR.asn1) KJUR.asn1 = {};

		/**
		 * ASN1 utilities class
		 * @name KJUR.asn1.ASN1Util
		 * @classs ASN1 utilities class
		 * @since asn1 1.0.2
		 */
		KJUR.asn1.ASN1Util = new function() {
			this.integerToByteHex = function(i) {
			var h = i.toString(16);
			if ((h.length % 2) == 1) h = '0' + h;
			return h;
			};
			this.bigIntToMinTwosComplementsHex = function(bigIntegerValue) {
			var h = bigIntegerValue.toString(16);
			if (h.substr(0, 1) != '-') {
				if (h.length % 2 == 1) {
				h = '0' + h;
				} else {
				if (! h.match(/^[0-7]/)) {
					h = '00' + h;
				}
				}
			} else {
				var hPos = h.substr(1);
				var xorLen = hPos.length;
				if (xorLen % 2 == 1) {
				xorLen += 1;
				} else {
				if (! h.match(/^[0-7]/)) {
					xorLen += 2;
				}
				}
				var hMask = '';
				for (var i = 0; i < xorLen; i++) {
				hMask += 'f';
				}
				var biMask = new BigInteger(hMask, 16);
				var biNeg = biMask.xor(bigIntegerValue).add(BigInteger.ONE);
				h = biNeg.toString(16).replace(/^-/, '');
			}
			return h;
			};
			/**
			 * get PEM string from hexadecimal data and header string
			 * @name getPEMStringFromHex
			 * @memberOf KJUR.asn1.ASN1Util
			 * @function
			 * @param {String} dataHex hexadecimal string of PEM body
			 * @param {String} pemHeader PEM header string (ex. 'RSA PRIVATE KEY')
			 * @return {String} PEM formatted string of input data
			 * @description
			 * @example
			 * var pem  = KJUR.asn1.ASN1Util.getPEMStringFromHex('616161', 'RSA PRIVATE KEY');
			 * // value of pem will be:
			 * -----BEGIN PRIVATE KEY-----
			 * YWFh
			 * -----END PRIVATE KEY-----
			 */
			this.getPEMStringFromHex = function(dataHex, pemHeader) {
			var dataWA = CryptoJS.enc.Hex.parse(dataHex);
			var dataB64 = CryptoJS.enc.Base64.stringify(dataWA);
			var pemBody = dataB64.replace(/(.{64})/g, "$1\r\n");
				pemBody = pemBody.replace(/\r\n$/, '');
			return "-----BEGIN " + pemHeader + "-----\r\n" + 
				       pemBody + 
				       "\r\n-----END " + pemHeader + "-----\r\n";
			};
		};

		// ********************************************************************
		//  Abstract ASN.1 Classes
		// ********************************************************************

		// ********************************************************************

		/**
		 * base class for ASN.1 DER encoder object
		 * @name KJUR.asn1.ASN1Object
		 * @class base class for ASN.1 DER encoder object
		 * @property {Boolean} isModified flag whether internal data was changed
		 * @property {String} hTLV hexadecimal string of ASN.1 TLV
		 * @property {String} hT hexadecimal string of ASN.1 TLV tag(T)
		 * @property {String} hL hexadecimal string of ASN.1 TLV length(L)
		 * @property {String} hV hexadecimal string of ASN.1 TLV value(V)
		 * @description
		 */
		KJUR.asn1.ASN1Object = function() {
			var isModified = true;
			var hTLV = null;
			var hT = '00'
			var hL = '00';
			var hV = '';

			/**
			 * get hexadecimal ASN.1 TLV length(L) bytes from TLV value(V)
			 * @name getLengthHexFromValue
			 * @memberOf KJUR.asn1.ASN1Object
			 * @function
			 * @return {String} hexadecimal string of ASN.1 TLV length(L)
			 */
			this.getLengthHexFromValue = function() {
			if (typeof this.hV == "undefined" || this.hV == null) {
				throw "this.hV is null or undefined.";
			}
			if (this.hV.length % 2 == 1) {
				throw "value hex must be even length: n=" + hV.length + ",v=" + this.hV;
			}
			var n = this.hV.length / 2;
			var hN = n.toString(16);
			if (hN.length % 2 == 1) {
				hN = "0" + hN;
			}
			if (n < 128) {
				return hN;
			} else {
				var hNlen = hN.length / 2;
				if (hNlen > 15) {
				throw "ASN.1 length too long to represent by 8x: n = " + n.toString(16);
				}
				var head = 128 + hNlen;
				return head.toString(16) + hN;
			}
			};

			/**
			 * get hexadecimal string of ASN.1 TLV bytes
			 * @name getEncodedHex
			 * @memberOf KJUR.asn1.ASN1Object
			 * @function
			 * @return {String} hexadecimal string of ASN.1 TLV
			 */
			this.getEncodedHex = function() {
			if (this.hTLV == null || this.isModified) {
				this.hV = this.getFreshValueHex();
				this.hL = this.getLengthHexFromValue();
				this.hTLV = this.hT + this.hL + this.hV;
				this.isModified = false;
				//console.error("first time: " + this.hTLV);
			}
			return this.hTLV;
			};

			/**
			 * get hexadecimal string of ASN.1 TLV value(V) bytes
			 * @name getValueHex
			 * @memberOf KJUR.asn1.ASN1Object
			 * @function
			 * @return {String} hexadecimal string of ASN.1 TLV value(V) bytes
			 */
			this.getValueHex = function() {
			this.getEncodedHex();
			return this.hV;
			}

			this.getFreshValueHex = function() {
			return '';
			};
		};

		// == BEGIN DERAbstractString ================================================
		/**
		 * base class for ASN.1 DER string classes
		 * @name KJUR.asn1.DERAbstractString
		 * @class base class for ASN.1 DER string classes
		 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
		 * @property {String} s internal string of value
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>str - specify initial ASN.1 value(V) by a string</li>
		 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 */
		KJUR.asn1.DERAbstractString = function(params) {
			KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
			var s = null;
			var hV = null;

			/**
			 * get string value of this string object
			 * @name getString
			 * @memberOf KJUR.asn1.DERAbstractString
			 * @function
			 * @return {String} string value of this string object
			 */
			this.getString = function() {
			return this.s;
			};

			/**
			 * set value by a string
			 * @name setString
			 * @memberOf KJUR.asn1.DERAbstractString
			 * @function
			 * @param {String} newS value by a string to set
			 */
			this.setString = function(newS) {
			this.hTLV = null;
			this.isModified = true;
			this.s = newS;
			this.hV = stohex(this.s);
			};

			/**
			 * set value by a hexadecimal string
			 * @name setStringHex
			 * @memberOf KJUR.asn1.DERAbstractString
			 * @function
			 * @param {String} newHexString value by a hexadecimal string to set
			 */
			this.setStringHex = function(newHexString) {
			this.hTLV = null;
			this.isModified = true;
			this.s = null;
			this.hV = newHexString;
			};

			this.getFreshValueHex = function() {
			return this.hV;
			};

			if (typeof params != "undefined") {
			if (typeof params['str'] != "undefined") {
				this.setString(params['str']);
			} else if (typeof params['hex'] != "undefined") {
				this.setStringHex(params['hex']);
			}
			}
		};
		JSX.extend(KJUR.asn1.DERAbstractString, KJUR.asn1.ASN1Object);
		// == END   DERAbstractString ================================================

		// == BEGIN DERAbstractTime ==================================================
		/**
		 * base class for ASN.1 DER Generalized/UTCTime class
		 * @name KJUR.asn1.DERAbstractTime
		 * @class base class for ASN.1 DER Generalized/UTCTime class
		 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * @see KJUR.asn1.ASN1Object - superclass
		 */
		KJUR.asn1.DERAbstractTime = function(params) {
			KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);
			var s = null;
			var date = null;

			// --- PRIVATE METHODS --------------------
			this.localDateToUTC = function(d) {
			utc = d.getTime() + (d.getTimezoneOffset() * 60000);
			var utcDate = new Date(utc);
			return utcDate;
			};

			this.formatDate = function(dateObject, type) {
			var pad = this.zeroPadding;
			var d = this.localDateToUTC(dateObject);
			var year = String(d.getFullYear());
			if (type == 'utc') year = year.substr(2, 2);
			var month = pad(String(d.getMonth() + 1), 2);
			var day = pad(String(d.getDate()), 2);
			var hour = pad(String(d.getHours()), 2);
			var min = pad(String(d.getMinutes()), 2);
			var sec = pad(String(d.getSeconds()), 2);
			return year + month + day + hour + min + sec + 'Z';
			};

			this.zeroPadding = function(s, len) {
			if (s.length >= len) return s;
			return new Array(len - s.length + 1).join('0') + s;
			};

			// --- PUBLIC METHODS --------------------
			/**
			 * get string value of this string object
			 * @name getString
			 * @memberOf KJUR.asn1.DERAbstractTime
			 * @function
			 * @return {String} string value of this time object
			 */
			this.getString = function() {
			return this.s;
			};

			/**
			 * set value by a string
			 * @name setString
			 * @memberOf KJUR.asn1.DERAbstractTime
			 * @function
			 * @param {String} newS value by a string to set such like "130430235959Z"
			 */
			this.setString = function(newS) {
			this.hTLV = null;
			this.isModified = true;
			this.s = newS;
			this.hV = stohex(this.s);
			};

			/**
			 * set value by a Date object
			 * @name setByDateValue
			 * @memberOf KJUR.asn1.DERAbstractTime
			 * @function
			 * @param {Integer} year year of date (ex. 2013)
			 * @param {Integer} month month of date between 1 and 12 (ex. 12)
			 * @param {Integer} day day of month
			 * @param {Integer} hour hours of date
			 * @param {Integer} min minutes of date
			 * @param {Integer} sec seconds of date
			 */
			this.setByDateValue = function(year, month, day, hour, min, sec) {
			var dateObject = new Date(Date.UTC(year, month - 1, day, hour, min, sec, 0));
			this.setByDate(dateObject);
			};

			this.getFreshValueHex = function() {
			return this.hV;
			};
		};
		JSX.extend(KJUR.asn1.DERAbstractTime, KJUR.asn1.ASN1Object);
		// == END   DERAbstractTime ==================================================

		// == BEGIN DERAbstractStructured ============================================
		/**
		 * base class for ASN.1 DER structured class
		 * @name KJUR.asn1.DERAbstractStructured
		 * @class base class for ASN.1 DER structured class
		 * @property {Array} asn1Array internal array of ASN1Object
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * @see KJUR.asn1.ASN1Object - superclass
		 */
		KJUR.asn1.DERAbstractStructured = function(params) {
			KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
			var asn1Array = null;

			/**
			 * set value by array of ASN1Object
			 * @name setByASN1ObjectArray
			 * @memberOf KJUR.asn1.DERAbstractStructured
			 * @function
			 * @param {array} asn1ObjectArray array of ASN1Object to set
			 */
			this.setByASN1ObjectArray = function(asn1ObjectArray) {
			this.hTLV = null;
			this.isModified = true;
			this.asn1Array = asn1ObjectArray;
			};

			/**
			 * append an ASN1Object to internal array
			 * @name appendASN1Object
			 * @memberOf KJUR.asn1.DERAbstractStructured
			 * @function
			 * @param {ASN1Object} asn1Object to add
			 */
			this.appendASN1Object = function(asn1Object) {
			this.hTLV = null;
			this.isModified = true;
			this.asn1Array.push(asn1Object);
			};

			this.asn1Array = new Array();
			if (typeof params != "undefined") {
			if (typeof params['array'] != "undefined") {
				this.asn1Array = params['array'];
			}
			}
		};
		JSX.extend(KJUR.asn1.DERAbstractStructured, KJUR.asn1.ASN1Object);


		// ********************************************************************
		//  ASN.1 Object Classes
		// ********************************************************************

		// ********************************************************************
		/**
		 * class for ASN.1 DER Boolean
		 * @name KJUR.asn1.DERBoolean
		 * @class class for ASN.1 DER Boolean
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * @see KJUR.asn1.ASN1Object - superclass
		 */
		KJUR.asn1.DERBoolean = function() {
			KJUR.asn1.DERBoolean.superclass.constructor.call(this);
			this.hT = "01";
			this.hTLV = "0101ff";
		};
		JSX.extend(KJUR.asn1.DERBoolean, KJUR.asn1.ASN1Object);

		// ********************************************************************
		/**
		 * class for ASN.1 DER Integer
		 * @name KJUR.asn1.DERInteger
		 * @class class for ASN.1 DER Integer
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>int - specify initial ASN.1 value(V) by integer value</li>
		 * <li>bigint - specify initial ASN.1 value(V) by BigInteger object</li>
		 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 */
		KJUR.asn1.DERInteger = function(params) {
			KJUR.asn1.DERInteger.superclass.constructor.call(this);
			this.hT = "02";

			/**
			 * set value by Tom Wu's BigInteger object
			 * @name setByBigInteger
			 * @memberOf KJUR.asn1.DERInteger
			 * @function
			 * @param {BigInteger} bigIntegerValue to set
			 */
			this.setByBigInteger = function(bigIntegerValue) {
			this.hTLV = null;
			this.isModified = true;
			this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
			};

			/**
			 * set value by integer value
			 * @name setByInteger
			 * @memberOf KJUR.asn1.DERInteger
			 * @function
			 * @param {Integer} integer value to set
			 */
			this.setByInteger = function(intValue) {
			var bi = new BigInteger(String(intValue), 10);
			this.setByBigInteger(bi);
			};

			/**
			 * set value by integer value
			 * @name setValueHex
			 * @memberOf KJUR.asn1.DERInteger
			 * @function
			 * @param {String} hexadecimal string of integer value
			 * @description
			 * <br/>
			 * NOTE: Value shall be represented by minimum octet length of
			 * two's complement representation.
			 */
			this.setValueHex = function(newHexString) {
			this.hV = newHexString;
			};

			this.getFreshValueHex = function() {
			return this.hV;
			};

			if (typeof params != "undefined") {
			if (typeof params['bigint'] != "undefined") {
				this.setByBigInteger(params['bigint']);
			} else if (typeof params['int'] != "undefined") {
				this.setByInteger(params['int']);
			} else if (typeof params['hex'] != "undefined") {
				this.setValueHex(params['hex']);
			}
			}
		};
		JSX.extend(KJUR.asn1.DERInteger, KJUR.asn1.ASN1Object);

		// ********************************************************************
		/**
		 * class for ASN.1 DER encoded BitString primitive
		 * @name KJUR.asn1.DERBitString
		 * @class class for ASN.1 DER encoded BitString primitive
		 * @extends KJUR.asn1.ASN1Object
		 * @description 
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>bin - specify binary string (ex. '10111')</li>
		 * <li>array - specify array of boolean (ex. [true,false,true,true])</li>
		 * <li>hex - specify hexadecimal string of ASN.1 value(V) including unused bits</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 */
		KJUR.asn1.DERBitString = function(params) {
			KJUR.asn1.DERBitString.superclass.constructor.call(this);
			this.hT = "03";

			/**
			 * set ASN.1 value(V) by a hexadecimal string including unused bits
			 * @name setHexValueIncludingUnusedBits
			 * @memberOf KJUR.asn1.DERBitString
			 * @function
			 * @param {String} newHexStringIncludingUnusedBits
			 */
			this.setHexValueIncludingUnusedBits = function(newHexStringIncludingUnusedBits) {
			this.hTLV = null;
			this.isModified = true;
			this.hV = newHexStringIncludingUnusedBits;
			};

			/**
			 * set ASN.1 value(V) by unused bit and hexadecimal string of value
			 * @name setUnusedBitsAndHexValue
			 * @memberOf KJUR.asn1.DERBitString
			 * @function
			 * @param {Integer} unusedBits
			 * @param {String} hValue
			 */
			this.setUnusedBitsAndHexValue = function(unusedBits, hValue) {
			if (unusedBits < 0 || 7 < unusedBits) {
				throw "unused bits shall be from 0 to 7: u = " + unusedBits;
			}
			var hUnusedBits = "0" + unusedBits;
			this.hTLV = null;
			this.isModified = true;
			this.hV = hUnusedBits + hValue;
			};

			/**
			 * set ASN.1 DER BitString by binary string
			 * @name setByBinaryString
			 * @memberOf KJUR.asn1.DERBitString
			 * @function
			 * @param {String} binaryString binary value string (i.e. '10111')
			 * @description
			 * Its unused bits will be calculated automatically by length of 
			 * 'binaryValue'. <br/>
			 * NOTE: Trailing zeros '0' will be ignored.
			 */
			this.setByBinaryString = function(binaryString) {
			binaryString = binaryString.replace(/0+$/, '');
			var unusedBits = 8 - binaryString.length % 8;
			if (unusedBits == 8) unusedBits = 0;
			for (var i = 0; i <= unusedBits; i++) {
				binaryString += '0';
			}
			var h = '';
			for (var i = 0; i < binaryString.length - 1; i += 8) {
				var b = binaryString.substr(i, 8);
				var x = parseInt(b, 2).toString(16);
				if (x.length == 1) x = '0' + x;
				h += x;  
			}
			this.hTLV = null;
			this.isModified = true;
			this.hV = '0' + unusedBits + h;
			};

			/**
			 * set ASN.1 TLV value(V) by an array of boolean
			 * @name setByBooleanArray
			 * @memberOf KJUR.asn1.DERBitString
			 * @function
			 * @param {array} booleanArray array of boolean (ex. [true, false, true])
			 * @description
			 * NOTE: Trailing falses will be ignored.
			 */
			this.setByBooleanArray = function(booleanArray) {
			var s = '';
			for (var i = 0; i < booleanArray.length; i++) {
				if (booleanArray[i] == true) {
				s += '1';
				} else {
				s += '0';
				}
			}
			this.setByBinaryString(s);
			};

			/**
			 * generate an array of false with specified length
			 * @name newFalseArray
			 * @memberOf KJUR.asn1.DERBitString
			 * @function
			 * @param {Integer} nLength length of array to generate
			 * @return {array} array of boolean faluse
			 * @description
			 * This static method may be useful to initialize boolean array.
			 */
			this.newFalseArray = function(nLength) {
			var a = new Array(nLength);
			for (var i = 0; i < nLength; i++) {
				a[i] = false;
			}
			return a;
			};

			this.getFreshValueHex = function() {
			return this.hV;
			};

			if (typeof params != "undefined") {
			if (typeof params['hex'] != "undefined") {
				this.setHexValueIncludingUnusedBits(params['hex']);
			} else if (typeof params['bin'] != "undefined") {
				this.setByBinaryString(params['bin']);
			} else if (typeof params['array'] != "undefined") {
				this.setByBooleanArray(params['array']);
			}
			}
		};
		JSX.extend(KJUR.asn1.DERBitString, KJUR.asn1.ASN1Object);

		// ********************************************************************
		/**
		 * class for ASN.1 DER OctetString
		 * @name KJUR.asn1.DEROctetString
		 * @class class for ASN.1 DER OctetString
		 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
		 * @extends KJUR.asn1.DERAbstractString
		 * @description
		 * @see KJUR.asn1.DERAbstractString - superclass
		 */
		KJUR.asn1.DEROctetString = function(params) {
			KJUR.asn1.DEROctetString.superclass.constructor.call(this, params);
			this.hT = "04";
		};
		JSX.extend(KJUR.asn1.DEROctetString, KJUR.asn1.DERAbstractString);

		// ********************************************************************
		/**
		 * class for ASN.1 DER Null
		 * @name KJUR.asn1.DERNull
		 * @class class for ASN.1 DER Null
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * @see KJUR.asn1.ASN1Object - superclass
		 */
		KJUR.asn1.DERNull = function() {
			KJUR.asn1.DERNull.superclass.constructor.call(this);
			this.hT = "05";
			this.hTLV = "0500";
		};
		JSX.extend(KJUR.asn1.DERNull, KJUR.asn1.ASN1Object);

		// ********************************************************************
		/**
		 * class for ASN.1 DER ObjectIdentifier
		 * @name KJUR.asn1.DERObjectIdentifier
		 * @class class for ASN.1 DER ObjectIdentifier
		 * @param {Array} params associative array of parameters (ex. {'oid': '2.5.4.5'})
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>oid - specify initial ASN.1 value(V) by a oid string (ex. 2.5.4.13)</li>
		 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 */
		KJUR.asn1.DERObjectIdentifier = function(params) {
			var itox = function(i) {
			var h = i.toString(16);
			if (h.length == 1) h = '0' + h;
			return h;
			};
			var roidtox = function(roid) {
			var h = '';
			var bi = new BigInteger(roid, 10);
			var b = bi.toString(2);
			var padLen = 7 - b.length % 7;
			if (padLen == 7) padLen = 0;
			var bPad = '';
			for (var i = 0; i < padLen; i++) bPad += '0';
			b = bPad + b;
			for (var i = 0; i < b.length - 1; i += 7) {
				var b8 = b.substr(i, 7);
				if (i != b.length - 7) b8 = '1' + b8;
				h += itox(parseInt(b8, 2));
			}
			return h;
			}

			KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);
			this.hT = "06";

			/**
			 * set value by a hexadecimal string
			 * @name setValueHex
			 * @memberOf KJUR.asn1.DERObjectIdentifier
			 * @function
			 * @param {String} newHexString hexadecimal value of OID bytes
			 */
			this.setValueHex = function(newHexString) {
			this.hTLV = null;
			this.isModified = true;
			this.s = null;
			this.hV = newHexString;
			};

			/**
			 * set value by a OID string
			 * @name setValueOidString
			 * @memberOf KJUR.asn1.DERObjectIdentifier
			 * @function
			 * @param {String} oidString OID string (ex. 2.5.4.13)
			 */
			this.setValueOidString = function(oidString) {
			if (! oidString.match(/^[0-9.]+$/)) {
				throw "malformed oid string: " + oidString;
			}
			var h = '';
			var a = oidString.split('.');
			var i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
			h += itox(i0);
			a.splice(0, 2);
			for (var i = 0; i < a.length; i++) {
				h += roidtox(a[i]);
			}
			this.hTLV = null;
			this.isModified = true;
			this.s = null;
			this.hV = h;
			};

			/**
			 * set value by a OID name
			 * @name setValueName
			 * @memberOf KJUR.asn1.DERObjectIdentifier
			 * @function
			 * @param {String} oidName OID name (ex. 'serverAuth')
			 * @since 1.0.1
			 * @description
			 * OID name shall be defined in 'KJUR.asn1.x509.OID.name2oidList'.
			 * Otherwise raise error.
			 */
			this.setValueName = function(oidName) {
			if (typeof KJUR.asn1.x509.OID.name2oidList[oidName] != "undefined") {
				var oid = KJUR.asn1.x509.OID.name2oidList[oidName];
				this.setValueOidString(oid);
			} else {
				throw "DERObjectIdentifier oidName undefined: " + oidName;
			}
			};

			this.getFreshValueHex = function() {
			return this.hV;
			};

			if (typeof params != "undefined") {
			if (typeof params['oid'] != "undefined") {
				this.setValueOidString(params['oid']);
			} else if (typeof params['hex'] != "undefined") {
				this.setValueHex(params['hex']);
			} else if (typeof params['name'] != "undefined") {
				this.setValueName(params['name']);
			}
			}
		};
		JSX.extend(KJUR.asn1.DERObjectIdentifier, KJUR.asn1.ASN1Object);

		// ********************************************************************
		/**
		 * class for ASN.1 DER UTF8String
		 * @name KJUR.asn1.DERUTF8String
		 * @class class for ASN.1 DER UTF8String
		 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
		 * @extends KJUR.asn1.DERAbstractString
		 * @description
		 * @see KJUR.asn1.DERAbstractString - superclass
		 */
		KJUR.asn1.DERUTF8String = function(params) {
			KJUR.asn1.DERUTF8String.superclass.constructor.call(this, params);
			this.hT = "0c";
		};
		JSX.extend(KJUR.asn1.DERUTF8String, KJUR.asn1.DERAbstractString);

		// ********************************************************************
		/**
		 * class for ASN.1 DER NumericString
		 * @name KJUR.asn1.DERNumericString
		 * @class class for ASN.1 DER NumericString
		 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
		 * @extends KJUR.asn1.DERAbstractString
		 * @description
		 * @see KJUR.asn1.DERAbstractString - superclass
		 */
		KJUR.asn1.DERNumericString = function(params) {
			KJUR.asn1.DERNumericString.superclass.constructor.call(this, params);
			this.hT = "12";
		};
		JSX.extend(KJUR.asn1.DERNumericString, KJUR.asn1.DERAbstractString);

		// ********************************************************************
		/**
		 * class for ASN.1 DER PrintableString
		 * @name KJUR.asn1.DERPrintableString
		 * @class class for ASN.1 DER PrintableString
		 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
		 * @extends KJUR.asn1.DERAbstractString
		 * @description
		 * @see KJUR.asn1.DERAbstractString - superclass
		 */
		KJUR.asn1.DERPrintableString = function(params) {
			KJUR.asn1.DERPrintableString.superclass.constructor.call(this, params);
			this.hT = "13";
		};
		JSX.extend(KJUR.asn1.DERPrintableString, KJUR.asn1.DERAbstractString);

		// ********************************************************************
		/**
		 * class for ASN.1 DER TeletexString
		 * @name KJUR.asn1.DERTeletexString
		 * @class class for ASN.1 DER TeletexString
		 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
		 * @extends KJUR.asn1.DERAbstractString
		 * @description
		 * @see KJUR.asn1.DERAbstractString - superclass
		 */
		KJUR.asn1.DERTeletexString = function(params) {
			KJUR.asn1.DERTeletexString.superclass.constructor.call(this, params);
			this.hT = "14";
		};
		JSX.extend(KJUR.asn1.DERTeletexString, KJUR.asn1.DERAbstractString);

		// ********************************************************************
		/**
		 * class for ASN.1 DER IA5String
		 * @name KJUR.asn1.DERIA5String
		 * @class class for ASN.1 DER IA5String
		 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
		 * @extends KJUR.asn1.DERAbstractString
		 * @description
		 * @see KJUR.asn1.DERAbstractString - superclass
		 */
		KJUR.asn1.DERIA5String = function(params) {
			KJUR.asn1.DERIA5String.superclass.constructor.call(this, params);
			this.hT = "16";
		};
		JSX.extend(KJUR.asn1.DERIA5String, KJUR.asn1.DERAbstractString);

		// ********************************************************************
		/**
		 * class for ASN.1 DER UTCTime
		 * @name KJUR.asn1.DERUTCTime
		 * @class class for ASN.1 DER UTCTime
		 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
		 * @extends KJUR.asn1.DERAbstractTime
		 * @description
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>str - specify initial ASN.1 value(V) by a string (ex.'130430235959Z')</li>
		 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
		 * <li>date - specify Date object.</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 * <h4>EXAMPLES</h4>
		 * @example
		 * var d1 = new KJUR.asn1.DERUTCTime();
		 * d1.setString('130430125959Z');
		 *
		 * var d2 = new KJUR.asn1.DERUTCTime({'str': '130430125959Z'});
		 *
		 * var d3 = new KJUR.asn1.DERUTCTime({'date': new Date(Date.UTC(2015, 0, 31, 0, 0, 0, 0))});
		 */
		KJUR.asn1.DERUTCTime = function(params) {
			KJUR.asn1.DERUTCTime.superclass.constructor.call(this, params);
			this.hT = "17";

			/**
			 * set value by a Date object
			 * @name setByDate
			 * @memberOf KJUR.asn1.DERUTCTime
			 * @function
			 * @param {Date} dateObject Date object to set ASN.1 value(V)
			 */
			this.setByDate = function(dateObject) {
			this.hTLV = null;
			this.isModified = true;
			this.date = dateObject;
			this.s = this.formatDate(this.date, 'utc');
			this.hV = stohex(this.s);
			};

			if (typeof params != "undefined") {
			if (typeof params['str'] != "undefined") {
				this.setString(params['str']);
			} else if (typeof params['hex'] != "undefined") {
				this.setStringHex(params['hex']);
			} else if (typeof params['date'] != "undefined") {
				this.setByDate(params['date']);
			}
			}
		};
		JSX.extend(KJUR.asn1.DERUTCTime, KJUR.asn1.DERAbstractTime);

		// ********************************************************************
		/**
		 * class for ASN.1 DER GeneralizedTime
		 * @name KJUR.asn1.DERGeneralizedTime
		 * @class class for ASN.1 DER GeneralizedTime
		 * @param {Array} params associative array of parameters (ex. {'str': '20130430235959Z'})
		 * @extends KJUR.asn1.DERAbstractTime
		 * @description
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>str - specify initial ASN.1 value(V) by a string (ex.'20130430235959Z')</li>
		 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
		 * <li>date - specify Date object.</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 */
		KJUR.asn1.DERGeneralizedTime = function(params) {
			KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this, params);
			this.hT = "18";

			/**
			 * set value by a Date object
			 * @name setByDate
			 * @memberOf KJUR.asn1.DERGeneralizedTime
			 * @function
			 * @param {Date} dateObject Date object to set ASN.1 value(V)
			 * @example
			 * When you specify UTC time, use 'Date.UTC' method like this:<br/>
			 * var o = new DERUTCTime();
			 * var date = new Date(Date.UTC(2015, 0, 31, 23, 59, 59, 0)); #2015JAN31 23:59:59
			 * o.setByDate(date);
			 */
			this.setByDate = function(dateObject) {
			this.hTLV = null;
			this.isModified = true;
			this.date = dateObject;
			this.s = this.formatDate(this.date, 'gen');
			this.hV = stohex(this.s);
			};

			if (typeof params != "undefined") {
			if (typeof params['str'] != "undefined") {
				this.setString(params['str']);
			} else if (typeof params['hex'] != "undefined") {
				this.setStringHex(params['hex']);
			} else if (typeof params['date'] != "undefined") {
				this.setByDate(params['date']);
			}
			}
		};
		JSX.extend(KJUR.asn1.DERGeneralizedTime, KJUR.asn1.DERAbstractTime);

		// ********************************************************************
		/**
		 * class for ASN.1 DER Sequence
		 * @name KJUR.asn1.DERSequence
		 * @class class for ASN.1 DER Sequence
		 * @extends KJUR.asn1.DERAbstractStructured
		 * @description
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>array - specify array of ASN1Object to set elements of content</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 */
		KJUR.asn1.DERSequence = function(params) {
			KJUR.asn1.DERSequence.superclass.constructor.call(this, params);
			this.hT = "30";
			this.getFreshValueHex = function() {
			var h = '';
			for (var i = 0; i < this.asn1Array.length; i++) {
				var asn1Obj = this.asn1Array[i];
				h += asn1Obj.getEncodedHex();
			}
			this.hV = h;
			return this.hV;
			};
		};
		JSX.extend(KJUR.asn1.DERSequence, KJUR.asn1.DERAbstractStructured);

		// ********************************************************************
		/**
		 * class for ASN.1 DER Set
		 * @name KJUR.asn1.DERSet
		 * @class class for ASN.1 DER Set
		 * @extends KJUR.asn1.DERAbstractStructured
		 * @description
		 * <br/>
		 * As for argument 'params' for constructor, you can specify one of
		 * following properties:
		 * <ul>
		 * <li>array - specify array of ASN1Object to set elements of content</li>
		 * </ul>
		 * NOTE: 'params' can be omitted.
		 */
		KJUR.asn1.DERSet = function(params) {
			KJUR.asn1.DERSet.superclass.constructor.call(this, params);
			this.hT = "31";
			this.getFreshValueHex = function() {
			var a = new Array();
			for (var i = 0; i < this.asn1Array.length; i++) {
				var asn1Obj = this.asn1Array[i];
				a.push(asn1Obj.getEncodedHex());
			}
			a.sort();
			this.hV = a.join('');
			return this.hV;
			};
		};
		JSX.extend(KJUR.asn1.DERSet, KJUR.asn1.DERAbstractStructured);

		// ********************************************************************
		/**
		 * class for ASN.1 DER TaggedObject
		 * @name KJUR.asn1.DERTaggedObject
		 * @class class for ASN.1 DER TaggedObject
		 * @extends KJUR.asn1.ASN1Object
		 * @description
		 * <br/>
		 * Parameter 'tagNoNex' is ASN.1 tag(T) value for this object.
		 * For example, if you find '[1]' tag in a ASN.1 dump, 
		 * 'tagNoHex' will be 'a1'.
		 * <br/>
		 * As for optional argument 'params' for constructor, you can specify *ANY* of
		 * following properties:
		 * <ul>
		 * <li>explicit - specify true if this is explicit tag otherwise false 
		 *     (default is 'true').</li>
		 * <li>tag - specify tag (default is 'a0' which means [0])</li>
		 * <li>obj - specify ASN1Object which is tagged</li>
		 * </ul>
		 * @example
		 * d1 = new KJUR.asn1.DERUTF8String({'str':'a'});
		 * d2 = new KJUR.asn1.DERTaggedObject({'obj': d1});
		 * hex = d2.getEncodedHex();
		 */
		KJUR.asn1.DERTaggedObject = function(params) {
			KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);
			this.hT = "a0";
			this.hV = '';
			this.isExplicit = true;
			this.asn1Object = null;

			/**
			 * set value by an ASN1Object
			 * @name setString
			 * @memberOf KJUR.asn1.DERTaggedObject
			 * @function
			 * @param {Boolean} isExplicitFlag flag for explicit/implicit tag
			 * @param {Integer} tagNoHex hexadecimal string of ASN.1 tag
			 * @param {ASN1Object} asn1Object ASN.1 to encapsulate
			 */
			this.setASN1Object = function(isExplicitFlag, tagNoHex, asn1Object) {
			this.hT = tagNoHex;
			this.isExplicit = isExplicitFlag;
			this.asn1Object = asn1Object;
			if (this.isExplicit) {
				this.hV = this.asn1Object.getEncodedHex();
				this.hTLV = null;
				this.isModified = true;
			} else {
				this.hV = null;
				this.hTLV = asn1Object.getEncodedHex();
				this.hTLV = this.hTLV.replace(/^../, tagNoHex);
				this.isModified = false;
			}
			};

			this.getFreshValueHex = function() {
			return this.hV;
			};

			if (typeof params != "undefined") {
			if (typeof params['tag'] != "undefined") {
				this.hT = params['tag'];
			}
			if (typeof params['explicit'] != "undefined") {
				this.isExplicit = params['explicit'];
			}
			if (typeof params['obj'] != "undefined") {
				this.asn1Object = params['obj'];
				this.setASN1Object(this.isExplicit, this.hT, this.asn1Object);
			}
			}
		};
		JSX.extend(KJUR.asn1.DERTaggedObject, KJUR.asn1.ASN1Object);// Hex JavaScript decoder
		// Copyright (c) 2008-2013 Lapo Luchini <lapo@lapo.it>

		// Permission to use, copy, modify, and/or distribute this software for any
		// purpose with or without fee is hereby granted, provided that the above
		// copyright notice and this permission notice appear in all copies.
		// 
		// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
		// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
		// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
		// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
		// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
		// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
		// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

		/*jshint browser: true, strict: true, immed: true, latedef: true, undef: true, regexdash: false */
		(function (undefined) {
			"use strict";

			var Hex = {},
				decoder;

			Hex.decode = function(a) {
				var i;
				if (decoder === undefined) {
					var hex = "0123456789ABCDEF",
						ignore = " \f\n\r\t\u00A0\u2028\u2029";
					decoder = [];
					for (i = 0; i < 16; ++i)
						decoder[hex.charAt(i)] = i;
					hex = hex.toLowerCase();
					for (i = 10; i < 16; ++i)
						decoder[hex.charAt(i)] = i;
					for (i = 0; i < ignore.length; ++i)
						decoder[ignore.charAt(i)] = -1;
				}
				var out = [],
					bits = 0,
					char_count = 0;
				for (i = 0; i < a.length; ++i) {
					var c = a.charAt(i);
					if (c == '=')
						break;
					c = decoder[c];
					if (c == -1)
						continue;
					if (c === undefined)
						throw 'Illegal character at offset ' + i;
					bits |= c;
					if (++char_count >= 2) {
						out[out.length] = bits;
						bits = 0;
						char_count = 0;
					} else {
						bits <<= 4;
					}
				}
				if (char_count)
					throw "Hex encoding incomplete: 4 bits missing";
				return out;
			};

			// export globals
			window.Hex = Hex;
		})();
	
		// Base64 JavaScript decoder
		// Copyright (c) 2008-2013 Lapo Luchini <lapo@lapo.it>

		// Permission to use, copy, modify, and/or distribute this software for any
		// purpose with or without fee is hereby granted, provided that the above
		// copyright notice and this permission notice appear in all copies.
		// 
		// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
		// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
		// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
		// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
		// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
		// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
		// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

		/*jshint browser: true, strict: true, immed: true, latedef: true, undef: true, regexdash: false */
		(function (undefined) {
			"use strict";

			var Base64 = {},
				decoder;

			Base64.decode = function (a) {
				var i;
				if (decoder === undefined) {
					var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
						ignore = "= \f\n\r\t\u00A0\u2028\u2029";
					decoder = [];
					for (i = 0; i < 64; ++i)
						decoder[b64.charAt(i)] = i;
					for (i = 0; i < ignore.length; ++i)
						decoder[ignore.charAt(i)] = -1;
				}
				var out = [];
				var bits = 0, char_count = 0;
				for (i = 0; i < a.length; ++i) {
					var c = a.charAt(i);
					if (c == '=')
						break;
					c = decoder[c];
					if (c == -1)
						continue;
					if (c === undefined)
						throw 'Illegal character at offset ' + i;
					bits |= c;
					if (++char_count >= 4) {
						out[out.length] = (bits >> 16);
						out[out.length] = (bits >> 8) & 0xFF;
						out[out.length] = bits & 0xFF;
						bits = 0;
						char_count = 0;
					} else {
						bits <<= 6;
					}
				}
				switch (char_count) {
				  case 1:
					throw "Base64 encoding incomplete: at least 2 bits missing";
				  case 2:
					out[out.length] = (bits >> 10);
					break;
				  case 3:
					out[out.length] = (bits >> 16);
					out[out.length] = (bits >> 8) & 0xFF;
					break;
				}
				return out;
			};

			Base64.re = /-----BEGIN [^-]+-----([A-Za-z0-9+\/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/;
			Base64.unarmor = function (a) {
				var m = Base64.re.exec(a);
				if (m) {
					if (m[1])
						a = m[1];
					else if (m[2])
						a = m[2];
					else
						throw "RegExp out of sync";
				}
				return Base64.decode(a);
			};

			// export globals
			window.Base64 = Base64;
		})();
	
		// ASN.1 JavaScript decoder
		// Copyright (c) 2008-2013 Lapo Luchini <lapo@lapo.it>

		// Permission to use, copy, modify, and/or distribute this software for any
		// purpose with or without fee is hereby granted, provided that the above
		// copyright notice and this permission notice appear in all copies.
		// 
		// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
		// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
		// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
		// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
		// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
		// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
		// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

		/*jshint browser: true, strict: true, immed: true, latedef: true, undef: true, regexdash: false */
		/*global oids */
		(function (undefined) {
			"use strict";

			var hardLimit = 100,
				ellipsis = "\u2026",
				DOM = {
					tag: function (tagName, className) {
						var t = document.createElement(tagName);
						t.className = className;
						return t;
					},
					text: function (str) {
						return document.createTextNode(str);
					}
				};

			function Stream(enc, pos) {
				if (enc instanceof Stream) {
					this.enc = enc.enc;
					this.pos = enc.pos;
				} else {
					this.enc = enc;
					this.pos = pos;
				}
			}
			Stream.prototype.get = function (pos) {
				if (pos === undefined)
					pos = this.pos++;
				if (pos >= this.enc.length)
					throw 'Requesting byte offset ' + pos + ' on a stream of length ' + this.enc.length;
				return this.enc[pos];
			};
			Stream.prototype.hexDigits = "0123456789ABCDEF";
			Stream.prototype.hexByte = function (b) {
				return this.hexDigits.charAt((b >> 4) & 0xF) + this.hexDigits.charAt(b & 0xF);
			};
			Stream.prototype.hexDump = function (start, end, raw) {
				var s = "";
				for (var i = start; i < end; ++i) {
					s += this.hexByte(this.get(i));
					if (raw !== true)
						switch (i & 0xF) {
						case 0x7: s += "  "; break;
						case 0xF: s += "\n"; break;
						default:  s += " ";
						}
				}
				return s;
			};
			Stream.prototype.parseStringISO = function (start, end) {
				var s = "";
				for (var i = start; i < end; ++i)
					s += String.fromCharCode(this.get(i));
				return s;
			};
			Stream.prototype.parseStringUTF = function (start, end) {
				var s = "";
				for (var i = start; i < end; ) {
					var c = this.get(i++);
					if (c < 128)
						s += String.fromCharCode(c);
					else if ((c > 191) && (c < 224))
						s += String.fromCharCode(((c & 0x1F) << 6) | (this.get(i++) & 0x3F));
					else
						s += String.fromCharCode(((c & 0x0F) << 12) | ((this.get(i++) & 0x3F) << 6) | (this.get(i++) & 0x3F));
				}
				return s;
			};
			Stream.prototype.parseStringBMP = function (start, end) {
				var str = ""
				for (var i = start; i < end; i += 2) {
					var high_byte = this.get(i);
					var low_byte = this.get(i + 1);
					str += String.fromCharCode( (high_byte << 8) + low_byte );
				}

				return str;
			};
			Stream.prototype.reTime = /^((?:1[89]|2\d)?\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
			Stream.prototype.parseTime = function (start, end) {
				var s = this.parseStringISO(start, end),
					m = this.reTime.exec(s);
				if (!m)
					return "Unrecognized time: " + s;
				s = m[1] + "-" + m[2] + "-" + m[3] + " " + m[4];
				if (m[5]) {
					s += ":" + m[5];
					if (m[6]) {
						s += ":" + m[6];
						if (m[7])
						    s += "." + m[7];
					}
				}
				if (m[8]) {
					s += " UTC";
					if (m[8] != 'Z') {
						s += m[8];
						if (m[9])
						    s += ":" + m[9];
					}
				}
				return s;
			};
			Stream.prototype.parseInteger = function (start, end) {
				//TODO support negative numbers
				var len = end - start;
				if (len > 4) {
					len <<= 3;
					var s = this.get(start);
					if (s === 0)
						len -= 8;
					else
						while (s < 128) {
						    s <<= 1;
						    --len;
						}
					return "(" + len + " bit)";
				}
				var n = 0;
				for (var i = start; i < end; ++i)
					n = (n << 8) | this.get(i);
				return n;
			};
			Stream.prototype.parseBitString = function (start, end) {
				var unusedBit = this.get(start),
					lenBit = ((end - start - 1) << 3) - unusedBit,
					s = "(" + lenBit + " bit)";
				if (lenBit <= 20) {
					var skip = unusedBit;
					s += " ";
					for (var i = end - 1; i > start; --i) {
						var b = this.get(i);
						for (var j = skip; j < 8; ++j)
						    s += (b >> j) & 1 ? "1" : "0";
						skip = 0;
					}
				}
				return s;
			};
			Stream.prototype.parseOctetString = function (start, end) {
				var len = end - start,
					s = "(" + len + " byte) ";
				if (len > hardLimit)
					end = start + hardLimit;
				for (var i = start; i < end; ++i)
					s += this.hexByte(this.get(i)); //TODO: also try Latin1?
				if (len > hardLimit)
					s += ellipsis;
				return s;
			};
			Stream.prototype.parseOID = function (start, end) {
				var s = '',
					n = 0,
					bits = 0;
				for (var i = start; i < end; ++i) {
					var v = this.get(i);
					n = (n << 7) | (v & 0x7F);
					bits += 7;
					if (!(v & 0x80)) { // finished
						if (s === '') {
						    var m = n < 80 ? n < 40 ? 0 : 1 : 2;
						    s = m + "." + (n - m * 40);
						} else
						    s += "." + ((bits >= 31) ? "bigint" : n);
						n = bits = 0;
					}
				}
				return s;
			};

			function ASN1(stream, header, length, tag, sub) {
				this.stream = stream;
				this.header = header;
				this.length = length;
				this.tag = tag;
				this.sub = sub;
			}
			ASN1.prototype.typeName = function () {
				if (this.tag === undefined)
					return "unknown";
				var tagClass = this.tag >> 6,
					tagConstructed = (this.tag >> 5) & 1,
					tagNumber = this.tag & 0x1F;
				switch (tagClass) {
				case 0: // universal
					switch (tagNumber) {
					case 0x00: return "EOC";
					case 0x01: return "BOOLEAN";
					case 0x02: return "INTEGER";
					case 0x03: return "BIT_STRING";
					case 0x04: return "OCTET_STRING";
					case 0x05: return "NULL";
					case 0x06: return "OBJECT_IDENTIFIER";
					case 0x07: return "ObjectDescriptor";
					case 0x08: return "EXTERNAL";
					case 0x09: return "REAL";
					case 0x0A: return "ENUMERATED";
					case 0x0B: return "EMBEDDED_PDV";
					case 0x0C: return "UTF8String";
					case 0x10: return "SEQUENCE";
					case 0x11: return "SET";
					case 0x12: return "NumericString";
					case 0x13: return "PrintableString"; // ASCII subset
					case 0x14: return "TeletexString"; // aka T61String
					case 0x15: return "VideotexString";
					case 0x16: return "IA5String"; // ASCII
					case 0x17: return "UTCTime";
					case 0x18: return "GeneralizedTime";
					case 0x19: return "GraphicString";
					case 0x1A: return "VisibleString"; // ASCII subset
					case 0x1B: return "GeneralString";
					case 0x1C: return "UniversalString";
					case 0x1E: return "BMPString";
					default:   return "Universal_" + tagNumber.toString(16);
					}
				case 1: return "Application_" + tagNumber.toString(16);
				case 2: return "[" + tagNumber + "]"; // Context
				case 3: return "Private_" + tagNumber.toString(16);
				}
			};
			ASN1.prototype.reSeemsASCII = /^[ -~]+$/;
			ASN1.prototype.content = function () {
				if (this.tag === undefined)
					return null;
				var tagClass = this.tag >> 6,
					tagNumber = this.tag & 0x1F,
					content = this.posContent(),
					len = Math.abs(this.length);
				if (tagClass !== 0) { // universal
					if (this.sub !== null)
						return "(" + this.sub.length + " elem)";
					//TODO: TRY TO PARSE ASCII STRING
					var s = this.stream.parseStringISO(content, content + Math.min(len, hardLimit));
					if (this.reSeemsASCII.test(s))
						return s.substring(0, 2 * hardLimit) + ((s.length > 2 * hardLimit) ? ellipsis : "");
					else
						return this.stream.parseOctetString(content, content + len);
				}
				switch (tagNumber) {
				case 0x01: // BOOLEAN
					return (this.stream.get(content) === 0) ? "false" : "true";
				case 0x02: // INTEGER
					return this.stream.parseInteger(content, content + len);
				case 0x03: // BIT_STRING
					return this.sub ? "(" + this.sub.length + " elem)" :
						this.stream.parseBitString(content, content + len);
				case 0x04: // OCTET_STRING
					return this.sub ? "(" + this.sub.length + " elem)" :
						this.stream.parseOctetString(content, content + len);
				//case 0x05: // NULL
				case 0x06: // OBJECT_IDENTIFIER
					return this.stream.parseOID(content, content + len);
				//case 0x07: // ObjectDescriptor
				//case 0x08: // EXTERNAL
				//case 0x09: // REAL
				//case 0x0A: // ENUMERATED
				//case 0x0B: // EMBEDDED_PDV
				case 0x10: // SEQUENCE
				case 0x11: // SET
					return "(" + this.sub.length + " elem)";
				case 0x0C: // UTF8String
					return this.stream.parseStringUTF(content, content + len);
				case 0x12: // NumericString
				case 0x13: // PrintableString
				case 0x14: // TeletexString
				case 0x15: // VideotexString
				case 0x16: // IA5String
				//case 0x19: // GraphicString
				case 0x1A: // VisibleString
				//case 0x1B: // GeneralString
				//case 0x1C: // UniversalString
					return this.stream.parseStringISO(content, content + len);
				case 0x1E: // BMPString
					return this.stream.parseStringBMP(content, content + len);
				case 0x17: // UTCTime
				case 0x18: // GeneralizedTime
					return this.stream.parseTime(content, content + len);
				}
				return null;
			};
			ASN1.prototype.toString = function () {
				return this.typeName() + "@" + this.stream.pos + "[header:" + this.header + ",length:" + this.length + ",sub:" + ((this.sub === null) ? 'null' : this.sub.length) + "]";
			};
			ASN1.prototype.print = function (indent) {
				if (indent === undefined) indent = '';
				document.writeln(indent + this);
				if (this.sub !== null) {
					indent += '  ';
					for (var i = 0, max = this.sub.length; i < max; ++i)
						this.sub[i].print(indent);
				}
			};
			ASN1.prototype.toPrettyString = function (indent) {
				if (indent === undefined) indent = '';
				var s = indent + this.typeName() + " @" + this.stream.pos;
				if (this.length >= 0)
					s += "+";
				s += this.length;
				if (this.tag & 0x20)
					s += " (constructed)";
				else if (((this.tag == 0x03) || (this.tag == 0x04)) && (this.sub !== null))
					s += " (encapsulates)";
				s += "\n";
				if (this.sub !== null) {
					indent += '  ';
					for (var i = 0, max = this.sub.length; i < max; ++i)
						s += this.sub[i].toPrettyString(indent);
				}
				return s;
			};
			ASN1.prototype.toDOM = function () {
				var node = DOM.tag("div", "node");
				node.asn1 = this;
				var head = DOM.tag("div", "head");
				var s = this.typeName().replace(/_/g, " ");
				head.innerHTML = s;
				var content = this.content();
				if (content !== null) {
					content = String(content).replace(/</g, "&lt;");
					var preview = DOM.tag("span", "preview");
					preview.appendChild(DOM.text(content));
					head.appendChild(preview);
				}
				node.appendChild(head);
				this.node = node;
				this.head = head;
				var value = DOM.tag("div", "value");
				s = "Offset: " + this.stream.pos + "<br/>";
				s += "Length: " + this.header + "+";
				if (this.length >= 0)
					s += this.length;
				else
					s += (-this.length) + " (undefined)";
				if (this.tag & 0x20)
					s += "<br/>(constructed)";
				else if (((this.tag == 0x03) || (this.tag == 0x04)) && (this.sub !== null))
					s += "<br/>(encapsulates)";
				//TODO if (this.tag == 0x03) s += "Unused bits: "
				if (content !== null) {
					s += "<br/>Value:<br/><b>" + content + "</b>";
					if ((typeof oids === 'object') && (this.tag == 0x06)) {
						var oid = oids[content];
						if (oid) {
						    if (oid.d) s += "<br/>" + oid.d;
						    if (oid.c) s += "<br/>" + oid.c;
						    if (oid.w) s += "<br/>(warning!)";
						}
					}
				}
				value.innerHTML = s;
				node.appendChild(value);
				var sub = DOM.tag("div", "sub");
				if (this.sub !== null) {
					for (var i = 0, max = this.sub.length; i < max; ++i)
						sub.appendChild(this.sub[i].toDOM());
				}
				node.appendChild(sub);
				head.onclick = function () {
					node.className = (node.className == "node collapsed") ? "node" : "node collapsed";
				};
				return node;
			};
			ASN1.prototype.posStart = function () {
				return this.stream.pos;
			};
			ASN1.prototype.posContent = function () {
				return this.stream.pos + this.header;
			};
			ASN1.prototype.posEnd = function () {
				return this.stream.pos + this.header + Math.abs(this.length);
			};
			ASN1.prototype.fakeHover = function (current) {
				this.node.className += " hover";
				if (current)
					this.head.className += " hover";
			};
			ASN1.prototype.fakeOut = function (current) {
				var re = / ?hover/;
				this.node.className = this.node.className.replace(re, "");
				if (current)
					this.head.className = this.head.className.replace(re, "");
			};
			ASN1.prototype.toHexDOM_sub = function (node, className, stream, start, end) {
				if (start >= end)
					return;
				var sub = DOM.tag("span", className);
				sub.appendChild(DOM.text(
					stream.hexDump(start, end)));
				node.appendChild(sub);
			};
			ASN1.prototype.toHexDOM = function (root) {
				var node = DOM.tag("span", "hex");
				if (root === undefined) root = node;
				this.head.hexNode = node;
				this.head.onmouseover = function () { this.hexNode.className = "hexCurrent"; };
				this.head.onmouseout  = function () { this.hexNode.className = "hex"; };
				node.asn1 = this;
				node.onmouseover = function () {
					var current = !root.selected;
					if (current) {
						root.selected = this.asn1;
						this.className = "hexCurrent";
					}
					this.asn1.fakeHover(current);
				};
				node.onmouseout  = function () {
					var current = (root.selected == this.asn1);
					this.asn1.fakeOut(current);
					if (current) {
						root.selected = null;
						this.className = "hex";
					}
				};
				this.toHexDOM_sub(node, "tag", this.stream, this.posStart(), this.posStart() + 1);
				this.toHexDOM_sub(node, (this.length >= 0) ? "dlen" : "ulen", this.stream, this.posStart() + 1, this.posContent());
				if (this.sub === null)
					node.appendChild(DOM.text(
						this.stream.hexDump(this.posContent(), this.posEnd())));
				else if (this.sub.length > 0) {
					var first = this.sub[0];
					var last = this.sub[this.sub.length - 1];
					this.toHexDOM_sub(node, "intro", this.stream, this.posContent(), first.posStart());
					for (var i = 0, max = this.sub.length; i < max; ++i)
						node.appendChild(this.sub[i].toHexDOM(root));
					this.toHexDOM_sub(node, "outro", this.stream, last.posEnd(), this.posEnd());
				}
				return node;
			};
			ASN1.prototype.toHexString = function (root) {
				return this.stream.hexDump(this.posStart(), this.posEnd(), true);
			};
			ASN1.decodeLength = function (stream) {
				var buf = stream.get(),
					len = buf & 0x7F;
				if (len == buf)
					return len;
				if (len > 3)
					throw "Length over 24 bits not supported at position " + (stream.pos - 1);
				if (len === 0)
					return -1; // undefined
				buf = 0;
				for (var i = 0; i < len; ++i)
					buf = (buf << 8) | stream.get();
				return buf;
			};
			ASN1.hasContent = function (tag, len, stream) {
				if (tag & 0x20) // constructed
					return true;
				if ((tag < 0x03) || (tag > 0x04))
					return false;
				var p = new Stream(stream);
				if (tag == 0x03) p.get(); // BitString unused bits, must be in [0, 7]
				var subTag = p.get();
				if ((subTag >> 6) & 0x01) // not (universal or context)
					return false;
				try {
					var subLength = ASN1.decodeLength(p);
					return ((p.pos - stream.pos) + subLength == len);
				} catch (exception) {
					return false;
				}
			};
			ASN1.decode = function (stream) {
				if (!(stream instanceof Stream))
					stream = new Stream(stream, 0);
				var streamStart = new Stream(stream),
					tag = stream.get(),
					len = ASN1.decodeLength(stream),
					header = stream.pos - streamStart.pos,
					sub = null;
				if (ASN1.hasContent(tag, len, stream)) {
					// it has content, so we decode it
					var start = stream.pos;
					if (tag == 0x03) stream.get(); // skip BitString unused bits, must be in [0, 7]
					sub = [];
					if (len >= 0) {
						// definite length
						var end = start + len;
						while (stream.pos < end)
						    sub[sub.length] = ASN1.decode(stream);
						if (stream.pos != end)
						    throw "Content size is not correct for container starting at offset " + start;
					} else {
						// undefined length
						try {
						    for (;;) {
						        var s = ASN1.decode(stream);
						        if (s.tag === 0)
						            break;
						        sub[sub.length] = s;
						    }
						    len = start - stream.pos;
						} catch (e) {
						    throw "Exception while decoding undefined length content: " + e;
						}
					}
				} else
					stream.pos += len; // skip content
				return new ASN1(streamStart, header, len, tag, sub);
			};
			ASN1.test = function () {
				var test = [
					{ value: [0x27],                   expected: 0x27     },
					{ value: [0x81, 0xC9],             expected: 0xC9     },
					{ value: [0x83, 0xFE, 0xDC, 0xBA], expected: 0xFEDCBA }
				];
				for (var i = 0, max = test.length; i < max; ++i) {
					var pos = 0,
						stream = new Stream(test[i].value, 0),
						res = ASN1.decodeLength(stream);
					if (res != test[i].expected)
						document.write("In test[" + i + "] expected " + test[i].expected + " got " + res + "\n");
				}
			};

			// export globals
			window.ASN1 = ASN1;
		})();
	
		/**
		 * Retrieve the hexadecimal value (as a string) of the current ASN.1 element
		 * @returns {string}
		 * @public
		 */
		ASN1.prototype.getHexStringValue = function () {
		  var hexString = this.toHexString();
		  var offset = this.header * 2;
		  var length = this.length * 2;
		  return hexString.substr(offset, length);
		};

		/**
		 * Method to parse a pem encoded string containing both a public or private key.
		 * The method will translate the pem encoded string in a der encoded string and
		 * will parse private key and public key parameters. This method accepts public key
		 * in the rsaencryption pkcs #1 format (oid: 1.2.840.113549.1.1.1).
		 *
		 * @todo Check how many rsa formats use the same format of pkcs #1.
		 *
		 * The format is defined as:
		 * PublicKeyInfo ::= SEQUENCE {
		 *   algorithm       AlgorithmIdentifier,
		 *   PublicKey       BIT STRING
		 * }
		 * Where AlgorithmIdentifier is:
		 * AlgorithmIdentifier ::= SEQUENCE {
		 *   algorithm       OBJECT IDENTIFIER,     the OID of the enc algorithm
		 *   parameters      ANY DEFINED BY algorithm OPTIONAL (NULL for PKCS #1)
		 * }
		 * and PublicKey is a SEQUENCE encapsulated in a BIT STRING
		 * RSAPublicKey ::= SEQUENCE {
		 *   modulus           INTEGER,  -- n
		 *   publicExponent    INTEGER   -- e
		 * }
		 * it's possible to examine the structure of the keys obtained from openssl using
		 * an asn.1 dumper as the one used here to parse the components: http://lapo.it/asn1js/
		 * @argument {string} pem the pem encoded string, can include the BEGIN/END header/footer
		 * @private
		 */
		RSAKey.prototype.parseKey = function (pem) {
		  try {
			var modulus = 0;
			var public_exponent = 0;
			var reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
			var der = reHex.test(pem) ? Hex.decode(pem) : Base64.unarmor(pem);
			var asn1 = ASN1.decode(der);

			//Fixes a bug with OpenSSL 1.0+ private keys
			if(asn1.sub.length === 3){
				asn1 = asn1.sub[2].sub[0];
			}
			if (asn1.sub.length === 9) {

			  // Parse the private key.
			  modulus = asn1.sub[1].getHexStringValue(); //bigint
			  this.n = parseBigInt(modulus, 16);

			  public_exponent = asn1.sub[2].getHexStringValue(); //int
			  this.e = parseInt(public_exponent, 16);

			  var private_exponent = asn1.sub[3].getHexStringValue(); //bigint
			  this.d = parseBigInt(private_exponent, 16);

			  var prime1 = asn1.sub[4].getHexStringValue(); //bigint
			  this.p = parseBigInt(prime1, 16);

			  var prime2 = asn1.sub[5].getHexStringValue(); //bigint
			  this.q = parseBigInt(prime2, 16);

			  var exponent1 = asn1.sub[6].getHexStringValue(); //bigint
			  this.dmp1 = parseBigInt(exponent1, 16);

			  var exponent2 = asn1.sub[7].getHexStringValue(); //bigint
			  this.dmq1 = parseBigInt(exponent2, 16);

			  var coefficient = asn1.sub[8].getHexStringValue(); //bigint
			  this.coeff = parseBigInt(coefficient, 16);

			}
			else if (asn1.sub.length === 2) {

			  // Parse the public key.
			  var bit_string = asn1.sub[1];
			  var sequence = bit_string.sub[0];

			  modulus = sequence.sub[0].getHexStringValue();
			  this.n = parseBigInt(modulus, 16);
			  public_exponent = sequence.sub[1].getHexStringValue();
			  this.e = parseInt(public_exponent, 16);

			}
			else {
			  return false;
			}
			return true;
		  }
		  catch (ex) {
			return false;
		  }
		};

		/**
		 * Translate rsa parameters in a hex encoded string representing the rsa key.
		 *
		 * The translation follow the ASN.1 notation :
		 * RSAPrivateKey ::= SEQUENCE {
		 *   version           Version,
		 *   modulus           INTEGER,  -- n
		 *   publicExponent    INTEGER,  -- e
		 *   privateExponent   INTEGER,  -- d
		 *   prime1            INTEGER,  -- p
		 *   prime2            INTEGER,  -- q
		 *   exponent1         INTEGER,  -- d mod (p1)
		 *   exponent2         INTEGER,  -- d mod (q-1)
		 *   coefficient       INTEGER,  -- (inverse of q) mod p
		 * }
		 * @returns {string}  DER Encoded String representing the rsa private key
		 * @private
		 */
		RSAKey.prototype.getPrivateBaseKey = function () {
		  var options = {
			'array': [
			  new KJUR.asn1.DERInteger({'int': 0}),
			  new KJUR.asn1.DERInteger({'bigint': this.n}),
			  new KJUR.asn1.DERInteger({'int': this.e}),
			  new KJUR.asn1.DERInteger({'bigint': this.d}),
			  new KJUR.asn1.DERInteger({'bigint': this.p}),
			  new KJUR.asn1.DERInteger({'bigint': this.q}),
			  new KJUR.asn1.DERInteger({'bigint': this.dmp1}),
			  new KJUR.asn1.DERInteger({'bigint': this.dmq1}),
			  new KJUR.asn1.DERInteger({'bigint': this.coeff})
			]
		  };
		  var seq = new KJUR.asn1.DERSequence(options);
		  return seq.getEncodedHex();
		};

		/**
		 * base64 (pem) encoded version of the DER encoded representation
		 * @returns {string} pem encoded representation without header and footer
		 * @public
		 */
		RSAKey.prototype.getPrivateBaseKeyB64 = function () {
		  return hex2b64(this.getPrivateBaseKey());
		};

		/**
		 * Translate rsa parameters in a hex encoded string representing the rsa public key.
		 * The representation follow the ASN.1 notation :
		 * PublicKeyInfo ::= SEQUENCE {
		 *   algorithm       AlgorithmIdentifier,
		 *   PublicKey       BIT STRING
		 * }
		 * Where AlgorithmIdentifier is:
		 * AlgorithmIdentifier ::= SEQUENCE {
		 *   algorithm       OBJECT IDENTIFIER,     the OID of the enc algorithm
		 *   parameters      ANY DEFINED BY algorithm OPTIONAL (NULL for PKCS #1)
		 * }
		 * and PublicKey is a SEQUENCE encapsulated in a BIT STRING
		 * RSAPublicKey ::= SEQUENCE {
		 *   modulus           INTEGER,  -- n
		 *   publicExponent    INTEGER   -- e
		 * }
		 * @returns {string} DER Encoded String representing the rsa public key
		 * @private
		 */
		RSAKey.prototype.getPublicBaseKey = function () {
		  var options = {
			'array': [
			  new KJUR.asn1.DERObjectIdentifier({'oid': '1.2.840.113549.1.1.1'}), //RSA Encryption pkcs #1 oid
			  new KJUR.asn1.DERNull()
			]
		  };
		  var first_sequence = new KJUR.asn1.DERSequence(options);

		  options = {
			'array': [
			  new KJUR.asn1.DERInteger({'bigint': this.n}),
			  new KJUR.asn1.DERInteger({'int': this.e})
			]
		  };
		  var second_sequence = new KJUR.asn1.DERSequence(options);

		  options = {
			'hex': '00' + second_sequence.getEncodedHex()
		  };
		  var bit_string = new KJUR.asn1.DERBitString(options);

		  options = {
			'array': [
			  first_sequence,
			  bit_string
			]
		  };
		  var seq = new KJUR.asn1.DERSequence(options);
		  return seq.getEncodedHex();
		};

		/**
		 * base64 (pem) encoded version of the DER encoded representation
		 * @returns {string} pem encoded representation without header and footer
		 * @public
		 */
		RSAKey.prototype.getPublicBaseKeyB64 = function () {
		  return hex2b64(this.getPublicBaseKey());
		};

		/**
		 * wrap the string in block of width chars. The default value for rsa keys is 64
		 * characters.
		 * @param {string} str the pem encoded string without header and footer
		 * @param {Number} [width=64] - the length the string has to be wrapped at
		 * @returns {string}
		 * @private
		 */
		RSAKey.prototype.wordwrap = function (str, width) {
		  width = width || 64;
		  if (!str) {
			return str;
		  }
		  var regex = '(.{1,' + width + '})( +|$\n?)|(.{1,' + width + '})';
		  return str.match(RegExp(regex, 'g')).join('\n');
		};

		/**
		 * Retrieve the pem encoded private key
		 * @returns {string} the pem encoded private key with header/footer
		 * @public
		 */
		RSAKey.prototype.getPrivateKey = function () {
		  var key = "-----BEGIN RSA PRIVATE KEY-----\n";
		  key += this.wordwrap(this.getPrivateBaseKeyB64()) + "\n";
		  key += "-----END RSA PRIVATE KEY-----";
		  return key;
		};

		/**
		 * Retrieve the pem encoded public key
		 * @returns {string} the pem encoded public key with header/footer
		 * @public
		 */
		RSAKey.prototype.getPublicKey = function () {
		  var key = "-----BEGIN PUBLIC KEY-----\n";
		  key += this.wordwrap(this.getPublicBaseKeyB64()) + "\n";
		  key += "-----END PUBLIC KEY-----";
		  return key;
		};

		/**
		 * Check if the object contains the necessary parameters to populate the rsa modulus
		 * and public exponent parameters.
		 * @param {Object} [obj={}] - An object that may contain the two public key
		 * parameters
		 * @returns {boolean} true if the object contains both the modulus and the public exponent
		 * properties (n and e)
		 * @todo check for types of n and e. N should be a parseable bigInt object, E should
		 * be a parseable integer number
		 * @private
		 */
		RSAKey.prototype.hasPublicKeyProperty = function (obj) {
		  obj = obj || {};
		  return (
			obj.hasOwnProperty('n') &&
			obj.hasOwnProperty('e')
		  );
		};

		/**
		 * Check if the object contains ALL the parameters of an RSA key.
		 * @param {Object} [obj={}] - An object that may contain nine rsa key
		 * parameters
		 * @returns {boolean} true if the object contains all the parameters needed
		 * @todo check for types of the parameters all the parameters but the public exponent
		 * should be parseable bigint objects, the public exponent should be a parseable integer number
		 * @private
		 */
		RSAKey.prototype.hasPrivateKeyProperty = function (obj) {
		  obj = obj || {};
		  return (
			obj.hasOwnProperty('n') &&
			obj.hasOwnProperty('e') &&
			obj.hasOwnProperty('d') &&
			obj.hasOwnProperty('p') &&
			obj.hasOwnProperty('q') &&
			obj.hasOwnProperty('dmp1') &&
			obj.hasOwnProperty('dmq1') &&
			obj.hasOwnProperty('coeff')
		  );
		};

		/**
		 * Parse the properties of obj in the current rsa object. Obj should AT LEAST
		 * include the modulus and public exponent (n, e) parameters.
		 * @param {Object} obj - the object containing rsa parameters
		 * @private
		 */
		RSAKey.prototype.parsePropertiesFrom = function (obj) {
		  this.n = obj.n;
		  this.e = obj.e;

		  if (obj.hasOwnProperty('d')) {
			this.d = obj.d;
			this.p = obj.p;
			this.q = obj.q;
			this.dmp1 = obj.dmp1;
			this.dmq1 = obj.dmq1;
			this.coeff = obj.coeff;
		  }
		};

		/**
		 * Create a new JSEncryptRSAKey that extends Tom Wu's RSA key object.
		 * This object is just a decorator for parsing the key parameter
		 * @param {string|Object} key - The key in string format, or an object containing
		 * the parameters needed to build a RSAKey object.
		 * @constructor
		 */
		var JSEncryptRSAKey = function (key) {
		  // Call the super constructor.
		  RSAKey.call(this);
		  // If a key key was provided.
		  if (key) {
			// If this is a string...
			if (typeof key === 'string') {
			  this.parseKey(key);
			}
			else if (
			  this.hasPrivateKeyProperty(key) ||
			  this.hasPublicKeyProperty(key)
			) {
			  // Set the values for the key.
			  this.parsePropertiesFrom(key);
			}
		  }
		};

		// Derive from RSAKey.
		JSEncryptRSAKey.prototype = new RSAKey();

		// Reset the contructor.
		JSEncryptRSAKey.prototype.constructor = JSEncryptRSAKey;


		/**
		 *
		 * @param {Object} [options = {}] - An object to customize JSEncrypt behaviour
		 * possible parameters are:
		 * - default_key_size        {number}  default: 1024 the key size in bit
		 * - default_public_exponent {string}  default: '010001' the hexadecimal representation of the public exponent
		 * - log                     {boolean} default: false whether log warn/error or not
		 * @constructor
		 */
		var JSEncrypt = function (options) {
		  options = options || {};
		  this.default_key_size = parseInt(options.default_key_size) || 1024;
		  this.default_public_exponent = options.default_public_exponent || '010001'; //65537 default openssl public exponent for rsa key type
		  this.log = options.log || false;
		  // The private and public key.
		  this.key = null;
		};

		/**
		 * Method to set the rsa key parameter (one method is enough to set both the public
		 * and the private key, since the private key contains the public key paramenters)
		 * Log a warning if logs are enabled
		 * @param {Object|string} key the pem encoded string or an object (with or without header/footer)
		 * @public
		 */
		JSEncrypt.prototype.setKey = function (key) {
		  if (this.log && this.key) {
			console.warn('A key was already set, overriding existing.');
		  }
		  this.key = new JSEncryptRSAKey(key);
		};

		/**
		 * Proxy method for setKey, for api compatibility
		 * @see setKey
		 * @public
		 */
		JSEncrypt.prototype.setPrivateKey = function (privkey) {
		  // Create the key.
		  this.setKey(privkey);
		};

		/**
		 * Proxy method for setKey, for api compatibility
		 * @see setKey
		 * @public
		 */
		JSEncrypt.prototype.setPublicKey = function (pubkey) {
		  // Sets the public key.
		  this.setKey(pubkey);
		};

		/**
		 * Proxy method for RSAKey object's decrypt, decrypt the string using the private
		 * components of the rsa key object. Note that if the object was not set will be created
		 * on the fly (by the getKey method) using the parameters passed in the JSEncrypt constructor
		 * @param {string} string base64 encoded crypted string to decrypt
		 * @return {string} the decrypted string
		 * @public
		 */
		JSEncrypt.prototype.decrypt = function (string) {
		  // Return the decrypted string.
		  try {
			return this.getKey().decrypt(b64tohex(string));
		  }
		  catch (ex) {
			return false;
		  }
		};

		/**
		 * Proxy method for RSAKey object's encrypt, encrypt the string using the public
		 * components of the rsa key object. Note that if the object was not set will be created
		 * on the fly (by the getKey method) using the parameters passed in the JSEncrypt constructor
		 * @param {string} string the string to encrypt
		 * @return {string} the encrypted string encoded in base64
		 * @public
		 */
		JSEncrypt.prototype.encrypt = function (string) {
		  // Return the encrypted string.
		  try {
			return hex2b64(this.getKey().encrypt(string));
		  }
		  catch (ex) {
			return false;
		  }
		};

		/**
		 * Getter for the current JSEncryptRSAKey object. If it doesn't exists a new object
		 * will be created and returned
		 * @param {callback} [cb] the callback to be called if we want the key to be generated
		 * in an async fashion
		 * @returns {JSEncryptRSAKey} the JSEncryptRSAKey object
		 * @public
		 */
		JSEncrypt.prototype.getKey = function (cb) {
		  // Only create new if it does not exist.
		  if (!this.key) {
			// Get a new private key.
			this.key = new JSEncryptRSAKey();
			if (cb && {}.toString.call(cb) === '[object Function]') {
			  this.key.generateAsync(this.default_key_size, this.default_public_exponent, cb);
			  return;
			}
			// Generate the key.
			this.key.generate(this.default_key_size, this.default_public_exponent);
		  }
		  return this.key;
		};

		/**
		 * Returns the pem encoded representation of the private key
		 * If the key doesn't exists a new key will be created
		 * @returns {string} pem encoded representation of the private key WITH header and footer
		 * @public
		 */
		JSEncrypt.prototype.getPrivateKey = function () {
		  // Return the private representation of this key.
		  return this.getKey().getPrivateKey();
		};

		/**
		 * Returns the pem encoded representation of the private key
		 * If the key doesn't exists a new key will be created
		 * @returns {string} pem encoded representation of the private key WITHOUT header and footer
		 * @public
		 */
		JSEncrypt.prototype.getPrivateKeyB64 = function () {
		  // Return the private representation of this key.
		  return this.getKey().getPrivateBaseKeyB64();
		};


		/**
		 * Returns the pem encoded representation of the public key
		 * If the key doesn't exists a new key will be created
		 * @returns {string} pem encoded representation of the public key WITH header and footer
		 * @public
		 */
		JSEncrypt.prototype.getPublicKey = function () {
		  // Return the private representation of this key.
		  return this.getKey().getPublicKey();
		};

		/**
		 * Returns the pem encoded representation of the public key
		 * If the key doesn't exists a new key will be created
		 * @returns {string} pem encoded representation of the public key WITHOUT header and footer
		 * @public
		 */
		JSEncrypt.prototype.getPublicKeyB64 = function () {
		  // Return the private representation of this key.
		  return this.getKey().getPublicBaseKeyB64();
		};

		exports.JSEncrypt = JSEncrypt;
		
	})(ns.JSEncryptExports);
	
	ns.JSEncrypt = ns.JSEncryptExports.JSEncrypt;
	
	
	// --- base64.js ------------------------------------------------------------------------------------------------ //
	
	
	ns.b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	ns.b64pad="=";
	
	ns.hex2b64 = function(h) {
	  var i;
	  var c;
	  var ret = "";
	  for(i = 0; i+3 <= h.length; i+=3) {
		c = parseInt(h.substring(i,i+3),16);
		ret += ns.b64map.charAt(c >> 6) + ns.b64map.charAt(c & 63);
	  }
	  if(i+1 == h.length) {
		c = parseInt(h.substring(i,i+1),16);
		ret += ns.b64map.charAt(c << 2);
	  }
	  else if(i+2 == h.length) {
		c = parseInt(h.substring(i,i+2),16);
		ret += ns.b64map.charAt(c >> 2) + ns.b64map.charAt((c & 3) << 4);
	  }
	  while((ret.length & 3) > 0) ret += ns.b64pad;
	  return ret;
	}
	
	// convert a base64 string to hex
	ns.b64tohex = function(s) {
	  var ret = ""
	  var i;
	  var k = 0; // b64 state, 0-3
	  var slop;
	  for(i = 0; i < s.length; ++i) {
		if(s.charAt(i) == ns.b64pad) break;
		v = ns.b64map.indexOf(s.charAt(i));
		if(v < 0) continue;
		if(k == 0) {
		  ret += ns.int2char(v >> 2);
		  slop = v & 3;
		  k = 1;
		}
		else if(k == 1) {
		  ret += ns.int2char((slop << 2) | (v >> 4));
		  slop = v & 0xf;
		  k = 2;
		}
		else if(k == 2) {
		  ret += ns.int2char(slop);
		  ret += ns.int2char(v >> 2);
		  slop = v & 3;
		  k = 3;
		}
		else {
		  ret += ns.int2char((slop << 2) | (v >> 4));
		  ret += ns.int2char(v & 0xf);
		  k = 0;
		}
	  }
	  if(k == 1)
		ret += ns.int2char(slop << 2);
	  return ret;
	}
	
	// convert a base64 string to a byte/number array
	ns.b64toBA = function(s) {
	  //piggyback on b64tohex for now, optimize later
	  var h = ns.b64tohex(s);
	  var i;
	  var a = new Array();
	  for(i = 0; 2*i < h.length; ++i) {
		a[i] = parseInt(h.substring(2*i,2*i+2),16);
	  }
	  return a;
	}
	
	
	// --- hash.js -------------------------------------------------------------------------------------------------- //
	
	
	/**
	*
	*  Secure Hash Algorithm (SHA256)
	*  http://www.webtoolkit.info/
	*
	*  Original code by Angel Marin, Paul Johnston.
	*
	**/
	 
	ns.SHA256 = function(s){
	 
		var chrsz   = 8;
		var hexcase = 0;
	 
		function safe_add (x, y) {
			var lsw = (x & 0xFFFF) + (y & 0xFFFF);
			var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			return (msw << 16) | (lsw & 0xFFFF);
		}
	 
		function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
		function R (X, n) { return ( X >>> n ); }
		function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
		function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
		function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
		function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
		function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
		function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }
	 
		function core_sha256 (m, l) {
			var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
			var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
			var W = new Array(64);
			var a, b, c, d, e, f, g, h, i, j;
			var T1, T2;
	 
			m[l >> 5] |= 0x80 << (24 - l % 32);
			m[((l + 64 >> 9) << 4) + 15] = l;
	 
			for ( var i = 0; i<m.length; i+=16 ) {
				a = HASH[0];
				b = HASH[1];
				c = HASH[2];
				d = HASH[3];
				e = HASH[4];
				f = HASH[5];
				g = HASH[6];
				h = HASH[7];
	 
				for ( var j = 0; j<64; j++) {
					if (j < 16) W[j] = m[j + i];
					else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
	 
					T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
					T2 = safe_add(Sigma0256(a), Maj(a, b, c));
	 
					h = g;
					g = f;
					f = e;
					e = safe_add(d, T1);
					d = c;
					c = b;
					b = a;
					a = safe_add(T1, T2);
				}
	 
				HASH[0] = safe_add(a, HASH[0]);
				HASH[1] = safe_add(b, HASH[1]);
				HASH[2] = safe_add(c, HASH[2]);
				HASH[3] = safe_add(d, HASH[3]);
				HASH[4] = safe_add(e, HASH[4]);
				HASH[5] = safe_add(f, HASH[5]);
				HASH[6] = safe_add(g, HASH[6]);
				HASH[7] = safe_add(h, HASH[7]);
			}
			return HASH;
		}
	 
		function str2binb (str) {
			var bin = Array();
			var mask = (1 << chrsz) - 1;
			for(var i = 0; i < str.length * chrsz; i += chrsz) {
				bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
			}
			return bin;
		}
	 
		function Utf8Encode(string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";
	 
			for (var n = 0; n < string.length; n++) {
	 
				var c = string.charCodeAt(n);
	 
				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
	 
			}
	 
			return utftext;
		}
	 
		function binb2hex (binarray) {
			var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
			var str = "";
			for(var i = 0; i < binarray.length * 4; i++) {
				str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
				hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
			}
			return str;
		}
	 
		s = Utf8Encode(s);
		return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
	}
	
	ns.sha256 = {}
	ns.sha256.hex = function(s)
	{
		return ns.SHA256(s);
	}
	
	/**
	*
	*  Secure Hash Algorithm (SHA1)
	*  http://www.webtoolkit.info/
	*
	**/
	
	ns.SHA1 = function (msg) {
	 
		function rotate_left(n,s) {
			var t4 = ( n<<s ) | (n>>>(32-s));
			return t4;
		};
	 
		function lsb_hex(val) {
			var str="";
			var i;
			var vh;
			var vl;
	 
			for( i=0; i<=6; i+=2 ) {
				vh = (val>>>(i*4+4))&0x0f;
				vl = (val>>>(i*4))&0x0f;
				str += vh.toString(16) + vl.toString(16);
			}
			return str;
		};
	 
		function cvt_hex(val) {
			var str="";
			var i;
			var v;
	 
			for( i=7; i>=0; i-- ) {
				v = (val>>>(i*4))&0x0f;
				str += v.toString(16);
			}
			return str;
		};
	 
	 
		function Utf8Encode(string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";
	 
			for (var n = 0; n < string.length; n++) {
	 
				var c = string.charCodeAt(n);
	 
				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
	 
			}
	 
			return utftext;
		};
	 
		var blockstart;
		var i, j;
		var W = new Array(80);
		var H0 = 0x67452301;
		var H1 = 0xEFCDAB89;
		var H2 = 0x98BADCFE;
		var H3 = 0x10325476;
		var H4 = 0xC3D2E1F0;
		var A, B, C, D, E;
		var temp;
	 
		msg = Utf8Encode(msg);
	 
		var msg_len = msg.length;
	 
		var word_array = new Array();
		for( i=0; i<msg_len-3; i+=4 ) {
			j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
			msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
			word_array.push( j );
		}
	 
		switch( msg_len % 4 ) {
			case 0:
				i = 0x080000000;
			break;
			case 1:
				i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
			break;
	 
			case 2:
				i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
			break;
	 
			case 3:
				i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8	| 0x80;
			break;
		}
	 
		word_array.push( i );
	 
		while( (word_array.length % 16) != 14 ) word_array.push( 0 );
	 
		word_array.push( msg_len>>>29 );
		word_array.push( (msg_len<<3)&0x0ffffffff );
	 
	 
		for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
	 
			for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
			for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
	 
			A = H0;
			B = H1;
			C = H2;
			D = H3;
			E = H4;
	 
			for( i= 0; i<=19; i++ ) {
				temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
	 
			for( i=20; i<=39; i++ ) {
				temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
	 
			for( i=40; i<=59; i++ ) {
				temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
	 
			for( i=60; i<=79; i++ ) {
				temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
	 
			H0 = (H0 + A) & 0x0ffffffff;
			H1 = (H1 + B) & 0x0ffffffff;
			H2 = (H2 + C) & 0x0ffffffff;
			H3 = (H3 + D) & 0x0ffffffff;
			H4 = (H4 + E) & 0x0ffffffff;
	 
		}
	 
		var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
	 
		return temp.toLowerCase();
	 
	}
	
	ns.sha1 = {}
	ns.sha1.hex = function(s)
	{
		return ns.SHA1(s);
	}
	
	/**
	*
	*  MD5 (Message-Digest Algorithm)
	*  http://www.webtoolkit.info/
	*
	**/
	 
	ns.MD5 = function (string) {
	 
		function RotateLeft(lValue, iShiftBits) {
			return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
		}
	 
		function AddUnsigned(lX,lY) {
			var lX4,lY4,lX8,lY8,lResult;
			lX8 = (lX & 0x80000000);
			lY8 = (lY & 0x80000000);
			lX4 = (lX & 0x40000000);
			lY4 = (lY & 0x40000000);
			lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
			if (lX4 & lY4) {
				return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
			}
			if (lX4 | lY4) {
				if (lResult & 0x40000000) {
					return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
				} else {
					return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
				}
			} else {
				return (lResult ^ lX8 ^ lY8);
			}
	 	}
	 
	 	function F(x,y,z) { return (x & y) | ((~x) & z); }
	 	function G(x,y,z) { return (x & z) | (y & (~z)); }
	 	function H(x,y,z) { return (x ^ y ^ z); }
		function I(x,y,z) { return (y ^ (x | (~z))); }
	 
		function FF(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};
	 
		function GG(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};
	 
		function HH(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};
	 
		function II(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};
	 
		function ConvertToWordArray(string) {
			var lWordCount;
			var lMessageLength = string.length;
			var lNumberOfWords_temp1=lMessageLength + 8;
			var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
			var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
			var lWordArray=Array(lNumberOfWords-1);
			var lBytePosition = 0;
			var lByteCount = 0;
			while ( lByteCount < lMessageLength ) {
				lWordCount = (lByteCount-(lByteCount % 4))/4;
				lBytePosition = (lByteCount % 4)*8;
				lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
				lByteCount++;
			}
			lWordCount = (lByteCount-(lByteCount % 4))/4;
			lBytePosition = (lByteCount % 4)*8;
			lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
			lWordArray[lNumberOfWords-2] = lMessageLength<<3;
			lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
			return lWordArray;
		};
	 
		function WordToHex(lValue) {
			var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
			for (lCount = 0;lCount<=3;lCount++) {
				lByte = (lValue>>>(lCount*8)) & 255;
				WordToHexValue_temp = "0" + lByte.toString(16);
				WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
			}
			return WordToHexValue;
		};
	 
		function Utf8Encode(string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";
	 
			for (var n = 0; n < string.length; n++) {
	 
				var c = string.charCodeAt(n);
	 
				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
	 
			}
	 
			return utftext;
		};
	 
		var x=Array();
		var k,AA,BB,CC,DD,a,b,c,d;
		var S11=7, S12=12, S13=17, S14=22;
		var S21=5, S22=9 , S23=14, S24=20;
		var S31=4, S32=11, S33=16, S34=23;
		var S41=6, S42=10, S43=15, S44=21;
	 
		string = Utf8Encode(string);
	 
		x = ConvertToWordArray(string);
	 
		a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
	 
		for (k=0;k<x.length;k+=16) {
			AA=a; BB=b; CC=c; DD=d;
			a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
			d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
			c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
			b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
			a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
			d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
			c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
			b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
			a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
			d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
			c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
			b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
			a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
			d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
			c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
			b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
			a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
			d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
			c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
			b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
			a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
			d=GG(d,a,b,c,x[k+10],S22,0x2441453);
			c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
			b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
			a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
			d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
			c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
			b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
			a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
			d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
			c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
			b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
			a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
			d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
			c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
			b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
			a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
			d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
			c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
			b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
			a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
			d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
			c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
			b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
			a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
			d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
			c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
			b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
			a=II(a,b,c,d,x[k+0], S41,0xF4292244);
			d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
			c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
			b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
			a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
			d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
			c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
			b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
			a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
			d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
			c=II(c,d,a,b,x[k+6], S43,0xA3014314);
			b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
			a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
			d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
			c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
			b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
			a=AddUnsigned(a,AA);
			b=AddUnsigned(b,BB);
			c=AddUnsigned(c,CC);
			d=AddUnsigned(d,DD);
		}
	 
		var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
	 
		return temp.toLowerCase();
	}
	
	
	// --- jsbn.js -------------------------------------------------------------------------------------------------- //
	
	
	// Copyright (c) 2005  Tom Wu
	// All Rights Reserved.
	// See "LICENSE" for details.
	// Basic JavaScript BN library - subset useful for RSA encryption.
	
	// Bits per digit
	ns.dbits;
	
	// JavaScript engine analysis
	ns.canary = 0xdeadbeefcafe;
	ns.j_lm = ((ns.canary & 0xffffff) == 0xefcafe);
	
	// (public) Constructor
	
	ns.BigInteger = function(a, b, c) {
		if (a != null) if ("number" == typeof a) this.fromNumber(a, b, c);
		else if (b == null && "string" != typeof a) this.fromString(a, 256);
		else this.fromString(a, b);
	}
	
	// return new, unset BigInteger
	
	ns.nbi = function() {
		return new ns.BigInteger(null);
	}
	
	// am: Compute w_j += (x*this_i), propagate carries,
	// c is initial carry, returns final carry.
	// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
	// We need to select the fastest one that works in this environment.
	// am1: use a single mult and divide to get the high bits,
	// max digit bits should be 26 because
	// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
	
	ns.am1 = function(i, x, w, j, c, n) {
		while (--n >= 0) {
		    var v = x * this[i++] + w[j] + c;
		    c = Math.floor(v / 0x4000000);
		    w[j++] = v & 0x3ffffff;
		}
		return c;
	}
	// am2 avoids a big mult-and-extract completely.
	// Max digit bits should be <= 30 because we do bitwise ops
	// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
	
	ns.am2 = function(i, x, w, j, c, n) {
		var xl = x & 0x7fff,
		    xh = x >> 15;
		while (--n >= 0) {
		    var l = this[i] & 0x7fff;
		    var h = this[i++] >> 15;
		    var m = xh * l + h * xl;
		    l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
		    c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
		    w[j++] = l & 0x3fffffff;
		}
		return c;
	}
	// Alternately, set max digit bits to 28 since some
	// browsers slow down when dealing with 32-bit numbers.
	
	ns.am3 = function(i, x, w, j, c, n) {
		var xl = x & 0x3fff,
		    xh = x >> 14;
		while (--n >= 0) {
		    var l = this[i] & 0x3fff;
		    var h = this[i++] >> 14;
		    var m = xh * l + h * xl;
		    l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
		    c = (l >> 28) + (m >> 14) + xh * h;
		    w[j++] = l & 0xfffffff;
		}
		return c;
	}
	if (ns.j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
		ns.BigInteger.prototype.am = ns.am2;
		ns.dbits = 30;
	}
	else if (ns.j_lm && (navigator.appName != "Netscape")) {
		ns.BigInteger.prototype.am = ns.am1;
		ns.dbits = 26;
	}
	else { // Mozilla/Netscape seems to prefer am3
		ns.BigInteger.prototype.am = ns.am3;
		ns.dbits = 28;
	}
	
	ns.BigInteger.prototype.DB = ns.dbits;
	ns.BigInteger.prototype.DM = ((1 << ns.dbits) - 1);
	ns.BigInteger.prototype.DV = (1 << ns.dbits);
	
	ns.BI_FP = 52;
	ns.BigInteger.prototype.FV = Math.pow(2, ns.BI_FP);
	ns.BigInteger.prototype.F1 = ns.BI_FP - ns.dbits;
	ns.BigInteger.prototype.F2 = 2 * ns.dbits - ns.BI_FP;
	
	// Digit conversions
	ns.BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
	ns.BI_RC = new Array();
	ns.rr; ns.vv;
	ns.rr = "0".charCodeAt(0);
	for (ns.vv = 0; ns.vv <= 9; ++ns.vv) ns.BI_RC[ns.rr++] = ns.vv;
	ns.rr = "a".charCodeAt(0);
	for (ns.vv = 10; ns.vv < 36; ++ns.vv) ns.BI_RC[ns.rr++] = ns.vv;
	ns.rr = "A".charCodeAt(0);
	for (ns.vv = 10; ns.vv < 36; ++ns.vv) ns.BI_RC[ns.rr++] = ns.vv;
	
	ns.int2char = function(n) {
		return ns.BI_RM.charAt(n);
	}
	
	ns.intAt = function(s, i) {
		var c = ns.BI_RC[s.charCodeAt(i)];
		return (c == null) ? -1 : c;
	}
	
	// (protected) copy this to r
	
	ns.bnpCopyTo = function(r) {
		for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
		r.t = this.t;
		r.s = this.s;
	}
	
	// (protected) set from integer value x, -DV <= x < DV
	
	ns.bnpFromInt = function(x) {
		this.t = 1;
		this.s = (x < 0) ? -1 : 0;
		if (x > 0) this[0] = x;
		else if (x < -1) this[0] = x + DV;
		else this.t = 0;
	}
	
	// return bigint initialized to value
	
	ns.nbv = function(i) {
		var r = ns.nbi();
		r.fromInt(i);
		return r;
	}
	
	// (protected) set from string and radix
	
	ns.bnpFromString = function(s, b) {
		var k;
		if (b == 16) k = 4;
		else if (b == 8) k = 3;
		else if (b == 256) k = 8; // byte array
		else if (b == 2) k = 1;
		else if (b == 32) k = 5;
		else if (b == 4) k = 2;
		else {
		    this.fromRadix(s, b);
		    return;
		}
		this.t = 0;
		this.s = 0;
		var i = s.length,
		    mi = false,
		    sh = 0;
		while (--i >= 0) {
		    var x = (k == 8) ? s[i] & 0xff : ns.intAt(s, i);
		    if (x < 0) {
		        if (s.charAt(i) == "-") mi = true;
		        continue;
		    }
		    mi = false;
		    if (sh == 0) this[this.t++] = x;
		    else if (sh + k > this.DB) {
		        this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
		        this[this.t++] = (x >> (this.DB - sh));
		    }
		    else this[this.t - 1] |= x << sh;
		    sh += k;
		    if (sh >= this.DB) sh -= this.DB;
		}
		if (k == 8 && (s[0] & 0x80) != 0) {
		    this.s = -1;
		    if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
		}
		this.clamp();
		if (mi) ns.BigInteger.ZERO.subTo(this, this);
	}
	
	// (protected) clamp off excess high words
	
	ns.bnpClamp = function() {
		var c = this.s & this.DM;
		while (this.t > 0 && this[this.t - 1] == c)--this.t;
	}
	
	// (public) return string representation in given radix
	
	ns.bnToString = function(b) {
		if (this.s < 0) return "-" + this.negate().toString(b);
		var k;
		if (b == 16) k = 4;
		else if (b == 8) k = 3;
		else if (b == 2) k = 1;
		else if (b == 32) k = 5;
		else if (b == 64) k = 6;
		else if (b == 4) k = 2;
		else return this.toRadix(b);
		var km = (1 << k) - 1,
		    d, m = false,
		    r = "",
		    i = this.t;
		var p = this.DB - (i * this.DB) % k;
		if (i-- > 0) {
		    if (p < this.DB && (d = this[i] >> p) > 0) {
		        m = true;
		        r = ns.int2char(d);
		    }
		    while (i >= 0) {
		        if (p < k) {
		            d = (this[i] & ((1 << p) - 1)) << (k - p);
		            d |= this[--i] >> (p += this.DB - k);
		        }
		        else {
		            d = (this[i] >> (p -= k)) & km;
		            if (p <= 0) {
		                p += this.DB;
		                --i;
		            }
		        }
		        if (d > 0) m = true;
		        if (m) r += ns.int2char(d);
		    }
		}
		return m ? r : "0";
	}
	
	// (public) -this
	
	ns.bnNegate = function() {
		var r = ns.nbi();
		ns.BigInteger.ZERO.subTo(this, r);
		return r;
	}
	
	// (public) |this|
	
	ns.bnAbs = function() {
		return (this.s < 0) ? this.negate() : this;
	}
	
	// (public) return + if this > a, - if this < a, 0 if equal
	
	ns.bnCompareTo = function(a) {
		var r = this.s - a.s;
		if (r != 0) return r;
		var i = this.t;
		r = i - a.t;
		if (r != 0) return r;
		while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
		return 0;
	}
	
	// returns bit length of the integer x
	
	ns.nbits = function(x) {
		var r = 1,
		    t;
		if ((t = x >>> 16) != 0) {
		    x = t;
		    r += 16;
		}
		if ((t = x >> 8) != 0) {
		    x = t;
		    r += 8;
		}
		if ((t = x >> 4) != 0) {
		    x = t;
		    r += 4;
		}
		if ((t = x >> 2) != 0) {
		    x = t;
		    r += 2;
		}
		if ((t = x >> 1) != 0) {
		    x = t;
		    r += 1;
		}
		return r;
	}
	
	// (public) return the number of bits in "this"
	
	ns.bnBitLength = function() {
		if (this.t <= 0) return 0;
		return this.DB * (this.t - 1) + ns.nbits(this[this.t - 1] ^ (this.s & this.DM));
	}
	
	// (protected) r = this << n*DB
	
	ns.bnpDLShiftTo = function(n, r) {
		var i;
		for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
		for (i = n - 1; i >= 0; --i) r[i] = 0;
		r.t = this.t + n;
		r.s = this.s;
	}
	
	// (protected) r = this >> n*DB
	
	ns.bnpDRShiftTo = function(n, r) {
		for (var i = n; i < this.t; ++i) r[i - n] = this[i];
		r.t = Math.max(this.t - n, 0);
		r.s = this.s;
	}
	
	// (protected) r = this << n
	
	ns.bnpLShiftTo = function(n, r) {
		var bs = n % this.DB;
		var cbs = this.DB - bs;
		var bm = (1 << cbs) - 1;
		var ds = Math.floor(n / this.DB),
		    c = (this.s << bs) & this.DM,
		    i;
		for (i = this.t - 1; i >= 0; --i) {
		    r[i + ds + 1] = (this[i] >> cbs) | c;
		    c = (this[i] & bm) << bs;
		}
		for (i = ds - 1; i >= 0; --i) r[i] = 0;
		r[ds] = c;
		r.t = this.t + ds + 1;
		r.s = this.s;
		r.clamp();
	}
	
	// (protected) r = this >> n
	
	ns.bnpRShiftTo = function(n, r) {
		r.s = this.s;
		var ds = Math.floor(n / this.DB);
		if (ds >= this.t) {
		    r.t = 0;
		    return;
		}
		var bs = n % this.DB;
		var cbs = this.DB - bs;
		var bm = (1 << bs) - 1;
		r[0] = this[ds] >> bs;
		for (var i = ds + 1; i < this.t; ++i) {
		    r[i - ds - 1] |= (this[i] & bm) << cbs;
		    r[i - ds] = this[i] >> bs;
		}
		if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
		r.t = this.t - ds;
		r.clamp();
	}
	
	// (protected) r = this - a
	
	ns.bnpSubTo = function(a, r) {
		var i = 0,
		    c = 0,
		    m = Math.min(a.t, this.t);
		while (i < m) {
		    c += this[i] - a[i];
		    r[i++] = c & this.DM;
		    c >>= this.DB;
		}
		if (a.t < this.t) {
		    c -= a.s;
		    while (i < this.t) {
		        c += this[i];
		        r[i++] = c & this.DM;
		        c >>= this.DB;
		    }
		    c += this.s;
		}
		else {
		    c += this.s;
		    while (i < a.t) {
		        c -= a[i];
		        r[i++] = c & this.DM;
		        c >>= this.DB;
		    }
		    c -= a.s;
		}
		r.s = (c < 0) ? -1 : 0;
		if (c < -1) r[i++] = this.DV + c;
		else if (c > 0) r[i++] = c;
		r.t = i;
		r.clamp();
	}
	
	// (protected) r = this * a, r != this,a (HAC 14.12)
	// "this" should be the larger one if appropriate.
	
	ns.bnpMultiplyTo = function(a, r) {
		var x = this.abs(),
		    y = a.abs();
		var i = x.t;
		r.t = i + y.t;
		while (--i >= 0) r[i] = 0;
		for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
		r.s = 0;
		r.clamp();
		if (this.s != a.s) ns.BigInteger.ZERO.subTo(r, r);
	}
	
	// (protected) r = this^2, r != this (HAC 14.16)
	
	ns.bnpSquareTo = function(r) {
		var x = this.abs();
		var i = r.t = 2 * x.t;
		while (--i >= 0) r[i] = 0;
		for (i = 0; i < x.t - 1; ++i) {
		    var c = x.am(i, x[i], r, 2 * i, 0, 1);
		    if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
		        r[i + x.t] -= x.DV;
		        r[i + x.t + 1] = 1;
		    }
		}
		if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
		r.s = 0;
		r.clamp();
	}
	
	// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
	// r != q, this != m.  q or r may be null.
	
	ns.bnpDivRemTo = function(m, q, r) {
		var pm = m.abs();
		if (pm.t <= 0) return;
		var pt = this.abs();
		if (pt.t < pm.t) {
		    if (q != null) q.fromInt(0);
		    if (r != null) this.copyTo(r);
		    return;
		}
		if (r == null) r = nbi();
		var y = ns.nbi(),
		    ts = this.s,
		    ms = m.s;
		var nsh = this.DB - ns.nbits(pm[pm.t - 1]); // normalize modulus
		if (nsh > 0) {
		    pm.lShiftTo(nsh, y);
		    pt.lShiftTo(nsh, r);
		}
		else {
		    pm.copyTo(y);
		    pt.copyTo(r);
		}
		var ys = y.t;
		var y0 = y[ys - 1];
		if (y0 == 0) return;
		var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
		var d1 = this.FV / yt,
		    d2 = (1 << this.F1) / yt,
		    e = 1 << this.F2;
		var i = r.t,
		    j = i - ys,
		    t = (q == null) ? ns.nbi() : q;
		y.dlShiftTo(j, t);
		if (r.compareTo(t) >= 0) {
		    r[r.t++] = 1;
		    r.subTo(t, r);
		}
		ns.BigInteger.ONE.dlShiftTo(ys, t);
		t.subTo(y, y); // "negative" y so we can replace sub with am later
		while (y.t < ys) y[y.t++] = 0;
		while (--j >= 0) {
		    // Estimate quotient digit
		    var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
		    if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) { // Try it out
		        y.dlShiftTo(j, t);
		        r.subTo(t, r);
		        while (r[i] < --qd) r.subTo(t, r);
		    }
		}
		if (q != null) {
		    r.drShiftTo(ys, q);
		    if (ts != ms) ns.BigInteger.ZERO.subTo(q, q);
		}
		r.t = ys;
		r.clamp();
		if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
		if (ts < 0) ns.BigInteger.ZERO.subTo(r, r);
	}
	
	// (public) this mod a
	
	ns.bnMod = function(a) {
		var r = ns.nbi();
		this.abs().divRemTo(a, null, r);
		if (this.s < 0 && r.compareTo(ns.BigInteger.ZERO) > 0) a.subTo(r, r);
		return r;
	}
	
	// Modular reduction using "classic" algorithm
	
	ns.Classic = function(m) {
		this.m = m;
	}
	
	ns.cConvert = function(x) {
		if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
		else return x;
	}
	
	ns.cRevert = function(x) {
		return x;
	}
	
	ns.cReduce = function(x) {
		x.divRemTo(this.m, null, x);
	}
	
	ns.cMulTo = function(x, y, r) {
		x.multiplyTo(y, r);
		this.reduce(r);
	}
	
	ns.cSqrTo = function(x, r) {
		x.squareTo(r);
		this.reduce(r);
	}
	
	ns.Classic.prototype.convert = ns.cConvert;
	ns.Classic.prototype.revert = ns.cRevert;
	ns.Classic.prototype.reduce = ns.cReduce;
	ns.Classic.prototype.mulTo = ns.cMulTo;
	ns.Classic.prototype.sqrTo = ns.cSqrTo;
	
	// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
	// justification:
	//         xy == 1 (mod m)
	//         xy =  1+km
	//   xy(2-xy) = (1+km)(1-km)
	// x[y(2-xy)] = 1-k^2m^2
	// x[y(2-xy)] == 1 (mod m^2)
	// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
	// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
	// JS multiply "overflows" differently from C/C++, so care is needed here.
	
	ns.bnpInvDigit = function() {
		if (this.t < 1) return 0;
		var x = this[0];
		if ((x & 1) == 0) return 0;
		var y = x & 3; // y == 1/x mod 2^2
		y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
		y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
		y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
		// last step - calculate inverse mod DV directly;
		// assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
		y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
		// we really want the negative inverse, and -DV < y < DV
		return (y > 0) ? this.DV - y : -y;
	}
	
	// Montgomery reduction
	
	ns.Montgomery = function(m) {
		this.m = m;
		this.mp = m.invDigit();
		this.mpl = this.mp & 0x7fff;
		this.mph = this.mp >> 15;
		this.um = (1 << (m.DB - 15)) - 1;
		this.mt2 = 2 * m.t;
	}
	
	// xR mod m
	
	ns.montConvert = function(x) {
		var r = ns.nbi();
		x.abs().dlShiftTo(this.m.t, r);
		r.divRemTo(this.m, null, r);
		if (x.s < 0 && r.compareTo(ns.BigInteger.ZERO) > 0) this.m.subTo(r, r);
		return r;
	}
	
	// x/R mod m
	
	ns.montRevert = function(x) {
		var r = ns.nbi();
		x.copyTo(r);
		this.reduce(r);
		return r;
	}
	
	// x = x/R mod m (HAC 14.32)
	
	ns.montReduce = function(x) {
		while (x.t <= this.mt2) // pad x so am has enough room later
		x[x.t++] = 0;
		for (var i = 0; i < this.m.t; ++i) {
		    // faster way of calculating u0 = x[i]*mp mod DV
		    var j = x[i] & 0x7fff;
		    var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
		    // use am to combine the multiply-shift-add into one call
		    j = i + this.m.t;
		    x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
		    // propagate carry
		    while (x[j] >= x.DV) {
		        x[j] -= x.DV;
		        x[++j]++;
		    }
		}
		x.clamp();
		x.drShiftTo(this.m.t, x);
		if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
	}
	
	// r = "x^2/R mod m"; x != r
	
	ns.montSqrTo = function(x, r) {
		x.squareTo(r);
		this.reduce(r);
	}
	
	// r = "xy/R mod m"; x,y != r
	
	ns.montMulTo = function(x, y, r) {
		x.multiplyTo(y, r);
		this.reduce(r);
	}
	
	ns.Montgomery.prototype.convert = ns.montConvert;
	ns.Montgomery.prototype.revert = ns.montRevert;
	ns.Montgomery.prototype.reduce = ns.montReduce;
	ns.Montgomery.prototype.mulTo = ns.montMulTo;
	ns.Montgomery.prototype.sqrTo = ns.montSqrTo;
	
	// (protected) true iff this is even
	
	ns.bnpIsEven = function() {
		return ((this.t > 0) ? (this[0] & 1) : this.s) == 0;
	}
	
	// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
	
	ns.bnpExp = function(e, z) {
		if (e > 0xffffffff || e < 1) return ns.BigInteger.ONE;
		var r = ns.nbi(),
		    r2 = ns.nbi(),
		    g = z.convert(this),
		    i = ns.nbits(e) - 1;
		g.copyTo(r);
		while (--i >= 0) {
		    z.sqrTo(r, r2);
		    if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
		    else {
		        var t = r;
		        r = r2;
		        r2 = t;
		    }
		}
		return z.revert(r);
	}
	
	// (public) this^e % m, 0 <= e < 2^32
	
	ns.bnModPowInt = function(e, m) {
		var z;
		if (e < 256 || m.isEven()) z = new ns.Classic(m);
		else z = new ns.Montgomery(m);
		return this.exp(e, z);
	}
	
	// protected
	ns.BigInteger.prototype.copyTo = ns.bnpCopyTo;
	ns.BigInteger.prototype.fromInt = ns.bnpFromInt;
	ns.BigInteger.prototype.fromString = ns.bnpFromString;
	ns.BigInteger.prototype.clamp = ns.bnpClamp;
	ns.BigInteger.prototype.dlShiftTo = ns.bnpDLShiftTo;
	ns.BigInteger.prototype.drShiftTo = ns.bnpDRShiftTo;
	ns.BigInteger.prototype.lShiftTo = ns.bnpLShiftTo;
	ns.BigInteger.prototype.rShiftTo = ns.bnpRShiftTo;
	ns.BigInteger.prototype.subTo = ns.bnpSubTo;
	ns.BigInteger.prototype.multiplyTo = ns.bnpMultiplyTo;
	ns.BigInteger.prototype.squareTo = ns.bnpSquareTo;
	ns.BigInteger.prototype.divRemTo = ns.bnpDivRemTo;
	ns.BigInteger.prototype.invDigit = ns.bnpInvDigit;
	ns.BigInteger.prototype.isEven = ns.bnpIsEven;
	ns.BigInteger.prototype.exp = ns.bnpExp;
	
	// public
	ns.BigInteger.prototype.toString = ns.bnToString;
	ns.BigInteger.prototype.negate = ns.bnNegate;
	ns.BigInteger.prototype.abs = ns.bnAbs;
	ns.BigInteger.prototype.compareTo = ns.bnCompareTo;
	ns.BigInteger.prototype.bitLength = ns.bnBitLength;
	ns.BigInteger.prototype.mod = ns.bnMod;
	ns.BigInteger.prototype.modPowInt = ns.bnModPowInt;
	
	// "constants"
	ns.BigInteger.ZERO = ns.nbv(0);
	ns.BigInteger.ONE = ns.nbv(1);
	
	
	ns.bnClone = function() {
		var r = ns.nbi();
		this.copyTo(r);
		return r;
	}
	
	// (public) return value as integer
	
	ns.bnIntValue = function() {
		if (this.s < 0) {
		    if (this.t == 1) return this[0] - this.DV;
		    else if (this.t == 0) return -1;
		}
		else if (this.t == 1) return this[0];
		else if (this.t == 0) return 0;
		// assumes 16 < DB < 32
		return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
	}
	
	// (public) return value as byte
	
	ns.bnByteValue = function() {
		return (this.t == 0) ? this.s : (this[0] << 24) >> 24;
	}
	
	// (public) return value as short (assumes DB>=16)
	
	ns.bnShortValue = function() {
		return (this.t == 0) ? this.s : (this[0] << 16) >> 16;
	}
	
	// (protected) return x s.t. r^x < DV
	
	ns.bnpChunkSize = function(r) {
		return Math.floor(Math.LN2 * this.DB / Math.log(r));
	}
	
	// (public) 0 if this == 0, 1 if this > 0
	
	ns.bnSigNum = function() {
		if (this.s < 0) return -1;
		else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
		else return 1;
	}
	
	// (protected) convert to radix string
	
	ns.bnpToRadix = function(b) {
		if (b == null) b = 10;
		if (this.signum() == 0 || b < 2 || b > 36) return "0";
		var cs = this.chunkSize(b);
		var a = Math.pow(b, cs);
		var d = ns.nbv(a),
		    y = ns.nbi(),
		    z = ns.nbi(),
		    r = "";
		this.divRemTo(d, y, z);
		while (y.signum() > 0) {
		    r = (a + z.intValue()).toString(b).substr(1) + r;
		    y.divRemTo(d, y, z);
		}
		return z.intValue().toString(b) + r;
	}
	
	// (protected) convert from radix string
	
	ns.bnpFromRadix = function(s, b) {
		this.fromInt(0);
		if (b == null) b = 10;
		var cs = this.chunkSize(b);
		var d = Math.pow(b, cs),
		    mi = false,
		    j = 0,
		    w = 0;
		for (var i = 0; i < s.length; ++i) {
		    var x = ns.intAt(s, i);
		    if (x < 0) {
		        if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
		        continue;
		    }
		    w = b * w + x;
		    if (++j >= cs) {
		        this.dMultiply(d);
		        this.dAddOffset(w, 0);
		        j = 0;
		        w = 0;
		    }
		}
		if (j > 0) {
		    this.dMultiply(Math.pow(b, j));
		    this.dAddOffset(w, 0);
		}
		if (mi) ns.BigInteger.ZERO.subTo(this, this);
	}
	
	// (protected) alternate constructor
	
	ns.bnpFromNumber = function(a, b, c) {
		if ("number" == typeof b) {
		    // new BigInteger(int,int,RNG)
		    if (a < 2) this.fromInt(1);
		    else {
		        this.fromNumber(a, c);
		        if (!this.testBit(a - 1)) // force MSB set
		        this.bitwiseTo(ns.BigInteger.ONE.shiftLeft(a - 1), ns.op_or, this);
		        if (this.isEven()) this.dAddOffset(1, 0); // force odd
		        while (!this.isProbablePrime(b)) {
		            this.dAddOffset(2, 0);
		            if (this.bitLength() > a) this.subTo(ns.BigInteger.ONE.shiftLeft(a - 1), this);
		        }
		    }
		}
		else {
		    // new BigInteger(int,RNG)
		    var x = new Array(),
		        t = a & 7;
		    x.length = (a >> 3) + 1;
		    b.nextBytes(x);
		    if (t > 0) x[0] &= ((1 << t) - 1);
		    else x[0] = 0;
		    this.fromString(x, 256);
		}
	}
	
	// (public) convert to bigendian byte array
	
	ns.bnToByteArray = function() {
		var i = this.t,
		    r = new Array();
		r[0] = this.s;
		var p = this.DB - (i * this.DB) % 8,
		    d, k = 0;
		if (i-- > 0) {
		    if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) r[k++] = d | (this.s << (this.DB - p));
		    while (i >= 0) {
		        if (p < 8) {
		            d = (this[i] & ((1 << p) - 1)) << (8 - p);
		            d |= this[--i] >> (p += this.DB - 8);
		        }
		        else {
		            d = (this[i] >> (p -= 8)) & 0xff;
		            if (p <= 0) {
		                p += this.DB;
		                --i;
		            }
		        }
		        if ((d & 0x80) != 0) d |= -256;
		        if (k == 0 && (this.s & 0x80) != (d & 0x80))++k;
		        if (k > 0 || d != this.s) r[k++] = d;
		    }
		}
		return r;
	}
	
	ns.bnEquals = function(a) {
		return (this.compareTo(a) == 0);
	}
	
	ns.bnMin = function(a) {
		return (this.compareTo(a) < 0) ? this : a;
	}
	
	ns.bnMax = function(a) {
		return (this.compareTo(a) > 0) ? this : a;
	}
	
	// (protected) r = this op a (bitwise)
	
	ns.bnpBitwiseTo = function(a, op, r) {
		var i, f, m = Math.min(a.t, this.t);
		for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
		if (a.t < this.t) {
		    f = a.s & this.DM;
		    for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
		    r.t = this.t;
		}
		else {
		    f = this.s & this.DM;
		    for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
		    r.t = a.t;
		}
		r.s = op(this.s, a.s);
		r.clamp();
	}
	
	// (public) this & a
	
	ns.op_and = function(x, y) {
		return x & y;
	}
	
	ns.bnAnd = function(a) {
		var r = ns.nbi();
		this.bitwiseTo(a, op_and, r);
		return r;
	}
	
	// (public) this | a
	
	ns.op_or = function(x, y) {
		return x | y;
	}
	
	ns.bnOr = function(a) {
		var r = ns.nbi();
		this.bitwiseTo(a, op_or, r);
		return r;
	}
	
	// (public) this ^ a
	
	ns.op_xor = function(x, y) {
		return x ^ y;
	}
	
	ns.bnXor = function(a) {
		var r = ns.nbi();
		this.bitwiseTo(a, op_xor, r);
		return r;
	}
	
	// (public) this & ~a
	
	ns.op_andnot = function(x, y) {
		return x & ~y;
	}
	
	ns.bnAndNot = function(a) {
		var r = ns.nbi();
		this.bitwiseTo(a, op_andnot, r);
		return r;
	}
	
	// (public) ~this
	
	ns.bnNot = function() {
		var r = ns.nbi();
		for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
		r.t = this.t;
		r.s = ~this.s;
		return r;
	}
	
	// (public) this << n
	
	ns.bnShiftLeft = function(n) {
		var r = ns.nbi();
		if (n < 0) this.rShiftTo(-n, r);
		else this.lShiftTo(n, r);
		return r;
	}
	
	// (public) this >> n
	
	ns.bnShiftRight = function(n) {
		var r = ns.nbi();
		if (n < 0) this.lShiftTo(-n, r);
		else this.rShiftTo(n, r);
		return r;
	}
	
	// return index of lowest 1-bit in x, x < 2^31
	
	ns.lbit = function(x) {
		if (x == 0) return -1;
		var r = 0;
		if ((x & 0xffff) == 0) {
		    x >>= 16;
		    r += 16;
		}
		if ((x & 0xff) == 0) {
		    x >>= 8;
		    r += 8;
		}
		if ((x & 0xf) == 0) {
		    x >>= 4;
		    r += 4;
		}
		if ((x & 3) == 0) {
		    x >>= 2;
		    r += 2;
		}
		if ((x & 1) == 0)++r;
		return r;
	}
	
	// (public) returns index of lowest 1-bit (or -1 if none)
	
	ns.bnGetLowestSetBit = function() {
		for (var i = 0; i < this.t; ++i)
		if (this[i] != 0) return i * this.DB + ns.lbit(this[i]);
		if (this.s < 0) return this.t * this.DB;
		return -1;
	}
	
	// return number of 1 bits in x
	
	ns.cbit = function(x) {
		var r = 0;
		while (x != 0) {
		    x &= x - 1;
		    ++r;
		}
		return r;
	}
	
	// (public) return number of set bits
	
	ns.bnBitCount = function() {
		var r = 0,
		    x = this.s & this.DM;
		for (var i = 0; i < this.t; ++i) r += ns.cbit(this[i] ^ x);
		return r;
	}
	
	// (public) true iff nth bit is set
	
	ns.bnTestBit = function(n) {
		var j = Math.floor(n / this.DB);
		if (j >= this.t) return (this.s != 0);
		return ((this[j] & (1 << (n % this.DB))) != 0);
	}
	
	// (protected) this op (1<<n)
	
	ns.bnpChangeBit = function(n, op) {
		var r = ns.BigInteger.ONE.shiftLeft(n);
		this.bitwiseTo(r, op, r);
		return r;
	}
	
	// (public) this | (1<<n)
	
	ns.bnSetBit = function(n) {
		return this.changeBit(n, op_or);
	}
	
	// (public) this & ~(1<<n)
	
	ns.bnClearBit = function(n) {
		return this.changeBit(n, op_andnot);
	}
	
	// (public) this ^ (1<<n)
	
	ns.bnFlipBit = function(n) {
		return this.changeBit(n, op_xor);
	}
	
	// (protected) r = this + a
	
	ns.bnpAddTo = function(a, r) {
		var i = 0,
		    c = 0,
		    m = Math.min(a.t, this.t);
		while (i < m) {
		    c += this[i] + a[i];
		    r[i++] = c & this.DM;
		    c >>= this.DB;
		}
		if (a.t < this.t) {
		    c += a.s;
		    while (i < this.t) {
		        c += this[i];
		        r[i++] = c & this.DM;
		        c >>= this.DB;
		    }
		    c += this.s;
		}
		else {
		    c += this.s;
		    while (i < a.t) {
		        c += a[i];
		        r[i++] = c & this.DM;
		        c >>= this.DB;
		    }
		    c += a.s;
		}
		r.s = (c < 0) ? -1 : 0;
		if (c > 0) r[i++] = c;
		else if (c < -1) r[i++] = this.DV + c;
		r.t = i;
		r.clamp();
	}
	
	// (public) this + a
	
	ns.bnAdd = function(a) {
		var r = ns.nbi();
		this.addTo(a, r);
		return r;
	}
	
	// (public) this - a
	
	ns.bnSubtract = function(a) {
		var r = ns.nbi();
		this.subTo(a, r);
		return r;
	}
	
	// (public) this * a
	
	ns.bnMultiply = function(a) {
		var r = ns.nbi();
		this.multiplyTo(a, r);
		return r;
	}
	
	// (public) this^2
	
	ns.bnSquare = function() {
		var r = ns.nbi();
		this.squareTo(r);
		return r;
	}
	
	// (public) this / a
	
	ns.bnDivide = function(a) {
		var r = ns.nbi();
		this.divRemTo(a, r, null);
		return r;
	}
	
	// (public) this % a
	
	ns.bnRemainder = function(a) {
		var r = ns.nbi();
		this.divRemTo(a, null, r);
		return r;
	}
	
	// (public) [this/a,this%a]
	
	ns.bnDivideAndRemainder = function(a) {
		var q = ns.nbi(),
		    r = ns.nbi();
		this.divRemTo(a, q, r);
		return new Array(q, r);
	}
	
	// (protected) this *= n, this >= 0, 1 < n < DV
	
	ns.bnpDMultiply = function(n) {
		this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
		++this.t;
		this.clamp();
	}
	
	// (protected) this += n << w words, this >= 0
	
	ns.bnpDAddOffset = function(n, w) {
		if (n == 0) return;
		while (this.t <= w) this[this.t++] = 0;
		this[w] += n;
		while (this[w] >= this.DV) {
		    this[w] -= this.DV;
		    if (++w >= this.t) this[this.t++] = 0;
		    ++this[w];
		}
	}
	
	// A "null" reducer
	
	ns.NullExp = function() {}
	
	ns.nNop = function(x) {
		return x;
	}
	
	ns.nMulTo = function(x, y, r) {
		x.multiplyTo(y, r);
	}
	
	ns.nSqrTo = function(x, r) {
		x.squareTo(r);
	}
	
	ns.NullExp.prototype.convert = ns.nNop;
	ns.NullExp.prototype.revert = ns.nNop;
	ns.NullExp.prototype.mulTo = ns.nMulTo;
	ns.NullExp.prototype.sqrTo = ns.nSqrTo;
	
	// (public) this^e
	
	ns.bnPow = function(e) {
		return this.exp(e, new ns.NullExp());
	}
	
	// (protected) r = lower n words of "this * a", a.t <= n
	// "this" should be the larger one if appropriate.
	
	ns.bnpMultiplyLowerTo = function(a, n, r) {
		var i = Math.min(this.t + a.t, n);
		r.s = 0; // assumes a,this >= 0
		r.t = i;
		while (i > 0) r[--i] = 0;
		var j;
		for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
		for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
		r.clamp();
	}
	
	// (protected) r = "this * a" without lower n words, n > 0
	// "this" should be the larger one if appropriate.
	
	ns.bnpMultiplyUpperTo = function(a, n, r) {
		--n;
		var i = r.t = this.t + a.t - n;
		r.s = 0; // assumes a,this >= 0
		while (--i >= 0) r[i] = 0;
		for (i = Math.max(n - this.t, 0); i < a.t; ++i)
		r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
		r.clamp();
		r.drShiftTo(1, r);
	}
	
	// Barrett modular reduction
	
	ns.Barrett = function(m) {
		// setup Barrett
		this.r2 = ns.nbi();
		this.q3 = ns.nbi();
		ns.BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
		this.mu = this.r2.divide(m);
		this.m = m;
	}
	
	ns.barrettConvert = function(x) {
		if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
		else if (x.compareTo(this.m) < 0) return x;
		else {
		    var r = ns.nbi();
		    x.copyTo(r);
		    this.reduce(r);
		    return r;
		}
	}
	
	ns.barrettRevert = function(x) {
		return x;
	}
	
	// x = x mod m (HAC 14.42)
	
	ns.barrettReduce = function(x) {
		x.drShiftTo(this.m.t - 1, this.r2);
		if (x.t > this.m.t + 1) {
		    x.t = this.m.t + 1;
		    x.clamp();
		}
		this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
		this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
		while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
		x.subTo(this.r2, x);
		while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
	}
	
	// r = x^2 mod m; x != r
	
	ns.barrettSqrTo = function(x, r) {
		x.squareTo(r);
		this.reduce(r);
	}
	
	// r = x*y mod m; x,y != r
	
	ns.barrettMulTo = function(x, y, r) {
		x.multiplyTo(y, r);
		this.reduce(r);
	}
	
	ns.Barrett.prototype.convert = ns.barrettConvert;
	ns.Barrett.prototype.revert = ns.barrettRevert;
	ns.Barrett.prototype.reduce = ns.barrettReduce;
	ns.Barrett.prototype.mulTo = ns.barrettMulTo;
	ns.Barrett.prototype.sqrTo = ns.barrettSqrTo;
	
	// (public) this^e % m (HAC 14.85)
	
	ns.bnModPow = function(e, m) {
		var i = e.bitLength(),
		    k, r = ns.nbv(1),
		    z;
		if (i <= 0) return r;
		else if (i < 18) k = 1;
		else if (i < 48) k = 3;
		else if (i < 144) k = 4;
		else if (i < 768) k = 5;
		else k = 6;
		if (i < 8) z = new ns.Classic(m);
		else if (m.isEven()) z = new ns.Barrett(m);
		else z = new ns.Montgomery(m);
		
		// precomputation
		var g = new Array(),
		    n = 3,
		    k1 = k - 1,
		    km = (1 << k) - 1;
		g[1] = z.convert(this);
		if (k > 1) {
		    var g2 = ns.nbi();
		    z.sqrTo(g[1], g2);
		    while (n <= km) {
		        g[n] = ns.nbi();
		        z.mulTo(g2, g[n - 2], g[n]);
		        n += 2;
		    }
		}
		
		var j = e.t - 1,
		    w, is1 = true,
		    r2 = ns.nbi(),
		    t;
		i = ns.nbits(e[j]) - 1;
		while (j >= 0) {
		    if (i >= k1) w = (e[j] >> (i - k1)) & km;
		    else {
		        w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
		        if (j > 0) w |= e[j - 1] >> (this.DB + i - k1);
		    }
			
		    n = k;
		    while ((w & 1) == 0) {
		        w >>= 1;
		        --n;
		    }
		    if ((i -= n) < 0) {
		        i += this.DB;
		        --j;
		    }
		    if (is1) { // ret == 1, don't bother squaring or multiplying it
		        g[w].copyTo(r);
		        is1 = false;
		    }
		    else {
		        while (n > 1) {
		            z.sqrTo(r, r2);
		            z.sqrTo(r2, r);
		            n -= 2;
		        }
		        if (n > 0) z.sqrTo(r, r2);
		        else {
		            t = r;
		            r = r2;
		            r2 = t;
		        }
		        z.mulTo(r2, g[w], r);
		    }
			
		    while (j >= 0 && (e[j] & (1 << i)) == 0) {
		        z.sqrTo(r, r2);
		        t = r;
		        r = r2;
		        r2 = t;
		        if (--i < 0) {
		            i = this.DB - 1;
		            --j;
		        }
		    }
		}
		return z.revert(r);
	}
	
	// (public) gcd(this,a) (HAC 14.54)
	
	ns.bnGCD = function(a) {
		var x = (this.s < 0) ? this.negate() : this.clone();
		var y = (a.s < 0) ? a.negate() : a.clone();
		if (x.compareTo(y) < 0) {
		    var t = x;
		    x = y;
		    y = t;
		}
		var i = x.getLowestSetBit(),
		    g = y.getLowestSetBit();
		if (g < 0) return x;
		if (i < g) g = i;
		if (g > 0) {
		    x.rShiftTo(g, x);
		    y.rShiftTo(g, y);
		}
		while (x.signum() > 0) {
		    if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
		    if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
		    if (x.compareTo(y) >= 0) {
		        x.subTo(y, x);
		        x.rShiftTo(1, x);
		    }
		    else {
		        y.subTo(x, y);
		        y.rShiftTo(1, y);
		    }
		}
		if (g > 0) y.lShiftTo(g, y);
		return y;
	}
	
	// (protected) this % n, n < 2^26
	
	ns.bnpModInt = function(n) {
		if (n <= 0) return 0;
		var d = this.DV % n,
		    r = (this.s < 0) ? n - 1 : 0;
		if (this.t > 0) if (d == 0) r = this[0] % n;
		else for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
		return r;
	}
	
	// (public) 1/this % m (HAC 14.61)
	
	ns.bnModInverse = function(m) {
		var ac = m.isEven();
		if ((this.isEven() && ac) || m.signum() == 0) return ns.BigInteger.ZERO;
		var u = m.clone(),
		    v = this.clone();
		var a = ns.nbv(1),
		    b = ns.nbv(0),
		    c = ns.nbv(0),
		    d = ns.nbv(1);
		while (u.signum() != 0) {
		    while (u.isEven()) {
		        u.rShiftTo(1, u);
		        if (ac) {
		            if (!a.isEven() || !b.isEven()) {
		                a.addTo(this, a);
		                b.subTo(m, b);
		            }
		            a.rShiftTo(1, a);
		        }
		        else if (!b.isEven()) b.subTo(m, b);
		        b.rShiftTo(1, b);
		    }
		    while (v.isEven()) {
		        v.rShiftTo(1, v);
		        if (ac) {
		            if (!c.isEven() || !d.isEven()) {
		                c.addTo(this, c);
		                d.subTo(m, d);
		            }
		            c.rShiftTo(1, c);
		        }
		        else if (!d.isEven()) d.subTo(m, d);
		        d.rShiftTo(1, d);
		    }
		    if (u.compareTo(v) >= 0) {
		        u.subTo(v, u);
		        if (ac) a.subTo(c, a);
		        b.subTo(d, b);
		    }
		    else {
		        v.subTo(u, v);
		        if (ac) c.subTo(a, c);
		        d.subTo(b, d);
		    }
		}
		if (v.compareTo(ns.BigInteger.ONE) != 0) return ns.BigInteger.ZERO;
		if (d.compareTo(m) >= 0) return d.subtract(m);
		if (d.signum() < 0) d.addTo(m, d);
		else return d;
		if (d.signum() < 0) return d.add(m);
		else return d;
	}
	
	ns.lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	ns.lplim = (1 << 26) / ns.lowprimes[ns.lowprimes.length - 1];
	
	// (public) test primality with certainty >= 1-.5^t
	
	ns.bnIsProbablePrime = function(t) {
		var i, x = this.abs();
		if (x.t == 1 && x[0] <= ns.lowprimes[ns.lowprimes.length - 1]) {
		    for (i = 0; i < ns.lowprimes.length; ++i)
		    if (x[0] == ns.lowprimes[i]) return true;
		    return false;
		}
		if (x.isEven()) return false;
		i = 1;
		while (i < ns.lowprimes.length) {
		    var m = ns.lowprimes[i],
		        j = i + 1;
		    while (j < ns.lowprimes.length && m < ns.lplim) m *= ns.lowprimes[j++];
		    m = x.modInt(m);
		    while (i < j) if (m % ns.lowprimes[i++] == 0) return false;
		}
		return x.millerRabin(t);
	}
	
	// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
	
	ns.bnpMillerRabin = function(t) {
		var n1 = this.subtract(ns.BigInteger.ONE);
		var k = n1.getLowestSetBit();
		if (k <= 0) return false;
		var r = n1.shiftRight(k);
		t = (t + 1) >> 1;
		if (t > ns.lowprimes.length) t = ns.lowprimes.length;
		var a = ns.nbi();
		for (var i = 0; i < t; ++i) {
		    //Pick bases at random, instead of starting at 2
		    a.fromInt(ns.lowprimes[Math.floor(Math.random() * ns.lowprimes.length)]);
		    var y = a.modPow(r, this);
		    if (y.compareTo(ns.BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
		        var j = 1;
		        while (j++ < k && y.compareTo(n1) != 0) {
		            y = y.modPowInt(2, this);
		            if (y.compareTo(ns.BigInteger.ONE) == 0) return false;
		        }
		        if (y.compareTo(n1) != 0) return false;
		    }
		}
		return true;
	}
	
	// protected
	ns.BigInteger.prototype.chunkSize = ns.bnpChunkSize;
	ns.BigInteger.prototype.toRadix = ns.bnpToRadix;
	ns.BigInteger.prototype.fromRadix = ns.bnpFromRadix;
	ns.BigInteger.prototype.fromNumber = ns.bnpFromNumber;
	ns.BigInteger.prototype.bitwiseTo = ns.bnpBitwiseTo;
	ns.BigInteger.prototype.changeBit = ns.bnpChangeBit;
	ns.BigInteger.prototype.addTo = ns.bnpAddTo;
	ns.BigInteger.prototype.dMultiply = ns.bnpDMultiply;
	ns.BigInteger.prototype.dAddOffset = ns.bnpDAddOffset;
	ns.BigInteger.prototype.multiplyLowerTo = ns.bnpMultiplyLowerTo;
	ns.BigInteger.prototype.multiplyUpperTo = ns.bnpMultiplyUpperTo;
	ns.BigInteger.prototype.modInt = ns.bnpModInt;
	ns.BigInteger.prototype.millerRabin = ns.bnpMillerRabin;
	
	// public
	ns.BigInteger.prototype.clone = ns.bnClone;
	ns.BigInteger.prototype.intValue = ns.bnIntValue;
	ns.BigInteger.prototype.byteValue = ns.bnByteValue;
	ns.BigInteger.prototype.shortValue = ns.bnShortValue;
	ns.BigInteger.prototype.signum = ns.bnSigNum;
	ns.BigInteger.prototype.toByteArray = ns.bnToByteArray;
	ns.BigInteger.prototype.equals = ns.bnEquals;
	ns.BigInteger.prototype.min = ns.bnMin;
	ns.BigInteger.prototype.max = ns.bnMax;
	ns.BigInteger.prototype.and = ns.bnAnd;
	ns.BigInteger.prototype.or = ns.bnOr;
	ns.BigInteger.prototype.xor = ns.bnXor;
	ns.BigInteger.prototype.andNot = ns.bnAndNot;
	ns.BigInteger.prototype.not = ns.bnNot;
	ns.BigInteger.prototype.shiftLeft = ns.bnShiftLeft;
	ns.BigInteger.prototype.shiftRight = ns.bnShiftRight;
	ns.BigInteger.prototype.getLowestSetBit = ns.bnGetLowestSetBit;
	ns.BigInteger.prototype.bitCount = ns.bnBitCount;
	ns.BigInteger.prototype.testBit = ns.bnTestBit;
	ns.BigInteger.prototype.setBit = ns.bnSetBit;
	ns.BigInteger.prototype.clearBit = ns.bnClearBit;
	ns.BigInteger.prototype.flipBit = ns.bnFlipBit;
	ns.BigInteger.prototype.add = ns.bnAdd;
	ns.BigInteger.prototype.subtract = ns.bnSubtract;
	ns.BigInteger.prototype.multiply = ns.bnMultiply;
	ns.BigInteger.prototype.divide = ns.bnDivide;
	ns.BigInteger.prototype.remainder = ns.bnRemainder;
	ns.BigInteger.prototype.divideAndRemainder = ns.bnDivideAndRemainder;
	ns.BigInteger.prototype.modPow = ns.bnModPow;
	ns.BigInteger.prototype.modInverse = ns.bnModInverse;
	ns.BigInteger.prototype.pow = ns.bnPow;
	ns.BigInteger.prototype.gcd = ns.bnGCD;
	ns.BigInteger.prototype.isProbablePrime = ns.bnIsProbablePrime;
	
	// JSBN-specific extension
	ns.BigInteger.prototype.square = ns.bnSquare;
	
	
	// --- random.js ------------------------------------------------------------------------------------------------ //
	
	
	// seedrandom.js version 2.0.
	// Author: David Bau 4/2/2011
	//
	// Defines a method Math.seedrandom() that, when called, substitutes
	// an explicitly seeded RC4-based algorithm for Math.random().  Also
	// supports automatic seeding from local or network sources of entropy.
	//
	// Usage:
	//
	//   <script src=http://davidbau.com/encode/seedrandom-min.js></script>
	//
	//   Math.seedrandom('yipee'); Sets Math.random to a function that is
	//                             initialized using the given explicit seed.
	//
	//   Math.seedrandom();        Sets Math.random to a function that is
	//                             seeded using the current time, dom state,
	//                             and other accumulated local entropy.
	//                             The generated seed string is returned.
	//
	//   Math.seedrandom('yowza', true);
	//                             Seeds using the given explicit seed mixed
	//                             together with accumulated entropy.
	//
	//   <script src="http://bit.ly/srandom-512"></script>
	//                             Seeds using physical random bits downloaded
	//                             from random.org.
	//
	//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
	//   </script>                 Seeds using urandom bits from call.jsonlib.com,
	//                             which is faster than random.org.
	//
	// Examples:
	//
	//   Math.seedrandom("hello");            // Use "hello" as the seed.
	//   document.write(Math.random());       // Always 0.5463663768140734
	//   document.write(Math.random());       // Always 0.43973793770592234
	//   var rng1 = Math.random;              // Remember the current prng.
	//
	//   var autoseed = Math.seedrandom();    // New prng with an automatic seed.
	//   document.write(Math.random());       // Pretty much unpredictable.
	//
	//   Math.random = rng1;                  // Continue "hello" prng sequence.
	//   document.write(Math.random());       // Always 0.554769432473455
	//
	//   Math.seedrandom(autoseed);           // Restart at the previous seed.
	//   document.write(Math.random());       // Repeat the 'unpredictable' value.
	//
	// Notes:
	//
	// Each time seedrandom('arg') is called, entropy from the passed seed
	// is accumulated in a pool to help generate future seeds for the
	// zero-argument form of Math.seedrandom, so entropy can be injected over
	// time by calling seedrandom with explicit data repeatedly.
	//
	// On speed - This javascript implementation of Math.random() is about
	// 3-10x slower than the built-in Math.random() because it is not native
	// code, but this is typically fast enough anyway.  Seeding is more expensive,
	// especially if you use auto-seeding.  Some details (timings on Chrome 4):
	//
	// Our Math.random()            - avg less than 0.002 milliseconds per call
	// seedrandom('explicit')       - avg less than 0.5 milliseconds per call
	// seedrandom('explicit', true) - avg less than 2 milliseconds per call
	// seedrandom()                 - avg about 38 milliseconds per call
	//
	// LICENSE (BSD):
	//
	// Copyright 2010 David Bau, all rights reserved.
	//
	// Redistribution and use in source and binary forms, with or without
	// modification, are permitted provided that the following conditions are met:
	// 
	//   1. Redistributions of source code must retain the above copyright
	//      notice, this list of conditions and the following disclaimer.
	//
	//   2. Redistributions in binary form must reproduce the above copyright
	//      notice, this list of conditions and the following disclaimer in the
	//      documentation and/or other materials provided with the distribution.
	// 
	//   3. Neither the name of this module nor the names of its contributors may
	//      be used to endorse or promote products derived from this software
	//      without specific prior written permission.
	// 
	// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	//
	/**
	 * All code is in an anonymous closure to keep the global namespace clean.
	 *
	 * @param {number=} overflow 
	 * @param {number=} startdenom
	 */
	(function (pool, math, width, chunks, significance, overflow, startdenom)
	{


		//
		// seedrandom()
		// This is the seedrandom function described above.
		//
		math['seedrandom'] = function seedrandom(seed, use_entropy)
		{
		    var key = [];
		    var arc4;

		    // Flatten the seed string or build one from local entropy if needed.
		    seed = mixkey(flatten(
		    use_entropy ? [seed, pool] : arguments.length ? seed : [new Date().getTime(), pool, window], 3), key);

		    // Use the seed to initialize an ARC4 generator.
		    arc4 = new ARC4(key);

		    // Mix the randomness into accumulated entropy.
		    mixkey(arc4.S, pool);

		    // Override Math.random
		    // This function returns a random double in [0, 1) that contains
		    // randomness in every bit of the mantissa of the IEEE 754 value.
		    math['random'] = function random()
		    { // Closure to return a random double:
		        var n = arc4.g(chunks); // Start with a numerator n < 2 ^ 48
		        var d = startdenom; //   and denominator d = 2 ^ 48.
		        var x = 0; //   and no 'extra last byte'.
		        while (n < significance)
		        { // Fill up all significant digits by
		            n = (n + x) * width; //   shifting numerator and
		            d *= width; //   denominator and generating a
		            x = arc4.g(1); //   new least-significant-byte.
		        }
		        while (n >= overflow)
		        { // To avoid rounding up, before adding
		            n /= 2; //   last byte, shift everything
		            d /= 2; //   right using integer math until
		            x >>>= 1; //   we have exactly the desired bits.
		        }
		        return (n + x) / d; // Form the number within [0, 1).
		    };

		    // Return the seed that was used
		    return seed;
		};

		//
		// ARC4
		//
		// An ARC4 implementation.  The constructor takes a key in the form of
		// an array of at most (width) integers that should be 0 <= x < (width).
		//
		// The g(count) method returns a pseudorandom integer that concatenates
		// the next (count) outputs from ARC4.  Its return value is a number x
		// that is in the range 0 <= x < (width ^ count).
		//
		/** @constructor */

		function ARC4(key)
		{
		    var t, u, me = this,
		        keylen = key.length;
		    var i = 0,
		        j = me.i = me.j = me.m = 0;
		    me.S = [];
		    me.c = [];

		    // The empty key [] is treated as [0].
		    if (!keylen)
		    {
		        key = [keylen++];
		    }

		    // Set up S using the standard key scheduling algorithm.
		    while (i < width)
		    {
		        me.S[i] = i++;
		    }
		    for (i = 0; i < width; i++)
		    {
		        t = me.S[i];
		        j = lowbits(j + t + key[i % keylen]);
		        u = me.S[j];
		        me.S[i] = u;
		        me.S[j] = t;
		    }

		    // The "g" method returns the next (count) outputs as one number.
		    me.g = function getnext(count)
		    {
		        var s = me.S;
		        var i = lowbits(me.i + 1);
		        var t = s[i];
		        var j = lowbits(me.j + t);
		        var u = s[j];
		        s[i] = u;
		        s[j] = t;
		        var r = s[lowbits(t + u)];
		        while (--count)
		        {
		            i = lowbits(i + 1);
		            t = s[i];
		            j = lowbits(j + t);
		            u = s[j];
		            s[i] = u;
		            s[j] = t;
		            r = r * width + s[lowbits(t + u)];
		        }
		        me.i = i;
		        me.j = j;
		        return r;
		    };
		    // For robust unpredictability discard an initial batch of values.
		    // See http://www.rsa.com/rsalabs/node.asp?id=2009
		    me.g(width);
		}

		//
		// flatten()
		// Converts an object tree to nested arrays of strings.
		//
		/** @param {Object=} result 
		 * @param {string=} prop
		 * @param {string=} typ */

		function flatten(obj, depth, result, prop, typ)
		{
		    result = [];
		    typ = typeof (obj);
		    if (depth && typ == 'object')
		    {
		        for (prop in obj)
		        {
		            if (prop.indexOf('S') < 5)
		            { // Avoid FF3 bug (local/sessionStorage)
		                try
		                {
		                    result.push(flatten(obj[prop], depth - 1));
		                }
		                catch (e)
		                {}
		            }
		        }
		    }
		    return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
		}

		//
		// mixkey()
		// Mixes a string seed into a key that is an array of integers, and
		// returns a shortened string seed that is equivalent to the result key.
		//
		/** @param {number=} smear 
		 * @param {number=} j */

		function mixkey(seed, key, smear, j)
		{
		    seed += ''; // Ensure the seed is a string
		    smear = 0;
		    for (j = 0; j < seed.length; j++)
		    {
		        key[lowbits(j)] = lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
		    }
		    seed = '';
		    for (j in key)
		    {
		        seed += String.fromCharCode(key[j]);
		    }
		    return seed;
		}

		//
		// lowbits()
		// A quick "n mod width" for width a power of 2.
		//


		function lowbits(n)
		{
		    return n & (width - 1);
		}

		//
		// The following constants are related to IEEE 754 limits.
		//
		startdenom = math.pow(width, chunks);
		significance = math.pow(2, significance);
		overflow = significance * 2;

		//
		// When seedrandom.js is loaded, we immediately mix a few bits
		// from the built-in RNG into the entropy pool.  Because we do
		// not want to intefere with determinstic PRNG state later,
		// seedrandom will not call math.random on its own again after
		// initialization.
		//
		mixkey(math.random(), pool);

		// End anonymous scope, and pass initial values.
	})([], // pool: entropy pool starts empty
	Math, // math: package containing random, pow, and seedrandom
	256, // width: each RC4 output is 0 <= x < 256
	6, // chunks: at least six RC4 outputs for each double
	52 // significance: there are 52 significant digits in a double
	);


	// This is not really a random number generator object, and two SeededRandom
	// objects will conflict with one another, but it's good enough for generating 
	// the rsa key.
	ns.SeededRandom = function(){}
	
	ns.SRnextBytes = function(ba)
	{
		var i;
		for(i = 0; i < ba.length; i++)
		{
		    ba[i] = Math.floor(Math.random() * 256);
		}
	}
	
	ns.SeededRandom.prototype.nextBytes = ns.SRnextBytes;
	
	// prng4.js - uses Arcfour as a PRNG
	
	ns.Arcfour = function() {
	  this.i = 0;
	  this.j = 0;
	  this.S = new Array();
	}
	
	// Initialize arcfour context from key, an array of ints, each from [0..255]
	ns.ARC4init = function(key) {
	  var i, j, t;
	  for(i = 0; i < 256; ++i)
		this.S[i] = i;
	  j = 0;
	  for(i = 0; i < 256; ++i) {
		j = (j + this.S[i] + key[i % key.length]) & 255;
		t = this.S[i];
		this.S[i] = this.S[j];
		this.S[j] = t;
	  }
	  this.i = 0;
	  this.j = 0;
	}
	
	ns.ARC4next = function() {
	  var t;
	  this.i = (this.i + 1) & 255;
	  this.j = (this.j + this.S[this.i]) & 255;
	  t = this.S[this.i];
	  this.S[this.i] = this.S[this.j];
	  this.S[this.j] = t;
	  return this.S[(t + this.S[this.i]) & 255];
	}
	
	ns.Arcfour.prototype.init = ns.ARC4init;
	ns.Arcfour.prototype.next = ns.ARC4next;
	
	// Plug in your RNG constructor here
	ns.prng_newstate = function() {
	  return new ns.Arcfour();
	}
	
	// Pool size must be a multiple of 4 and greater than 32.
	// An array of bytes the size of the pool will be passed to init()
	ns.rng_psize = 256;
	
	// Random number generator - requires a PRNG backend, e.g. prng4.js
	
	// For best results, put code like
	// <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
	// in your main HTML document.
	
	ns.rng_state;
	ns.rng_pool;
	ns.rng_pptr;
	
	// Mix in a 32-bit integer into the pool
	ns.rng_seed_int = function(x) {
	  ns.rng_pool[ns.rng_pptr++] ^= x & 255;
	  ns.rng_pool[ns.rng_pptr++] ^= (x >> 8) & 255;
	  ns.rng_pool[ns.rng_pptr++] ^= (x >> 16) & 255;
	  ns.rng_pool[ns.rng_pptr++] ^= (x >> 24) & 255;
	  if(ns.rng_pptr >= ns.rng_psize) ns.rng_pptr -= ns.rng_psize;
	}
	
	// Mix in the current time (w/milliseconds) into the pool
	ns.rng_seed_time = function() {
	  ns.rng_seed_int(new Date().getTime());
	}
	
	// Initialize the pool with junk if needed.
	if(ns.rng_pool == null) {
	  ns.rng_pool = new Array();
	  ns.rng_pptr = 0;
	  var t;
	  if(navigator.appName == "Netscape" && navigator.appVersion < "5" && window.crypto) {
		// Extract entropy (256 bits) from NS4 RNG if available
		var z = window.crypto.random(32);
		for(t = 0; t < z.length; ++t)
		  ns.rng_pool[ns.rng_pptr++] = z.charCodeAt(t) & 255;
	  }  
	  while(ns.rng_pptr < ns.rng_psize) {  // extract some randomness from Math.random()
		t = Math.floor(65536 * Math.random());
		ns.rng_pool[ns.rng_pptr++] = t >>> 8;
		ns.rng_pool[ns.rng_pptr++] = t & 255;
	  }
	  ns.rng_pptr = 0;
	  ns.rng_seed_time();
	  //ns.rng_seed_int(window.screenX);
	  //ns.rng_seed_int(window.screenY);
	}
	
	ns.rng_get_byte = function() {
	  if(ns.rng_state == null) {
		ns.rng_seed_time();
		ns.rng_state = ns.prng_newstate();
		ns.rng_state.init(ns.rng_pool);
		for(ns.rng_pptr = 0; ns.rng_pptr < ns.rng_pool.length; ++ns.rng_pptr)
		  ns.rng_pool[ns.rng_pptr] = 0;
		ns.rng_pptr = 0;
		//ns.rng_pool = null;
	  }
	  // TODO: allow reseeding after first request
	  return ns.rng_state.next();
	}
	
	ns.rng_get_bytes = function(ba) {
	  var i;
	  for(i = 0; i < ba.length; ++i) ba[i] = ns.rng_get_byte();
	}
	
	ns.SecureRandom = function() {}
	
	ns.SecureRandom.prototype.nextBytes = ns.rng_get_bytes;
	
	
	// --- rsa.js --------------------------------------------------------------------------------------------------- //
	
	
	// Depends on jsbn.js and rng.js
	// Version 1.1: support utf-8 encoding in pkcs1pad2
	// convert a (hex) string to a bignum object
	
	
	ns.parseBigInt = function(str, r)
	{
		return new ns.BigInteger(str, r);
	}
	
	ns.linebrk = function(s, n)
	{
		var ret = "";
		var i = 0;
		while (i + n < s.length)
		{
		    ret += s.substring(i, i + n) + "\n";
		    i += n;
		}
		return ret + s.substring(i, s.length);
	}
	
	ns.byte2Hex = function(b)
	{
		if (b < 0x10) return "0" + b.toString(16);
		else return b.toString(16);
	}
	
	// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
	
	
	ns.pkcs1pad2 = function(s, n)
	{
		if (n < s.length + 11)
		{ // TODO: fix for utf-8
		    //alert("Message too long for RSA (n=" + n + ", l=" + s.length + ")");
		    //return null;
		    throw "Message too long for RSA (n=" + n + ", l=" + s.length + ")";
		}
		var ba = new Array();
		var i = s.length - 1;
		while (i >= 0 && n > 0)
		{
		    var c = s.charCodeAt(i--);
		    if (c < 128)
		    { // encode using utf-8
		        ba[--n] = c;
		    }
		    else if ((c > 127) && (c < 2048))
		    {
		        ba[--n] = (c & 63) | 128;
		        ba[--n] = (c >> 6) | 192;
		    }
		    else
		    {
		        ba[--n] = (c & 63) | 128;
		        ba[--n] = ((c >> 6) & 63) | 128;
		        ba[--n] = (c >> 12) | 224;
		    }
		}
		ba[--n] = 0;
		var rng = new ns.SecureRandom();
		var x = new Array();
		while (n > 2)
		{ // random non-zero pad
		    x[0] = 0;
		    while (x[0] == 0) rng.nextBytes(x);
		    ba[--n] = x[0];
		}
		ba[--n] = 2;
		ba[--n] = 0;
		return new ns.BigInteger(ba);
	}
	
	// "empty" RSA key constructor
	
	
	ns.RSAKey = function()
	{
		this.n = null;
		this.e = 0;
		this.d = null;
		this.p = null;
		this.q = null;
		this.dmp1 = null;
		this.dmq1 = null;
		this.coeff = null;
	}
	// Set the public key fields N and e from hex strings
	
	
	ns.RSASetPublic = function(N, E)
	{
		if (N != null && E != null && N.length > 0 && E.length > 0)
		{
		    this.n = ns.parseBigInt(N, 16);
		    this.e = parseInt(E, 16);
		}
		else alert("Invalid RSA public key");
	}
	
	// Perform raw public operation on "x": return x^e (mod n)
	
	
	ns.RSADoPublic = function(x)
	{
		return x.modPowInt(this.e, this.n);
	}
	
	// Return the PKCS#1 RSA encryption of "text" as an even-length hex string
	
	
	ns.RSAEncrypt = function(text)
	{
		var m = ns.pkcs1pad2(text, (this.n.bitLength() + 7) >> 3);
		if (m == null) return null;
		var c = this.doPublic(m);
		if (c == null) return null;
		var h = c.toString(16);
		if ((h.length & 1) == 0) return h;
		else return "0" + h;
	}
	
	// Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
	//ns.RSAEncryptB64 = function(text) {
	//  var h = this.encrypt(text);
	//  if(h) return hex2b64(h); else return null;
	//}
	// protected
	ns.RSAKey.prototype.doPublic = ns.RSADoPublic;
	
	
	
	// public
	ns.RSAKey.prototype.setPublic = ns.RSASetPublic;
	ns.RSAKey.prototype.encrypt = ns.RSAEncrypt;
	
	// Version 1.1: support utf-8 decoding in pkcs1unpad2
	// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
	
	ns.pkcs1unpad2 = function(d, n)
	{
		var b = d.toByteArray();
		var i = 0;
		while (i < b.length && b[i] == 0)++i;
		if (b.length - i != n - 1 || b[i] != 2) return null;
		++i;
		while (b[i] != 0)
		if (++i >= b.length) return null;
		var ret = "";
		while (++i < b.length)
		{
		    var c = b[i] & 255;
		    if (c < 128)
		    { // utf-8 decode
		        ret += String.fromCharCode(c);
		    }
		    else if ((c > 191) && (c < 224))
		    {
		        ret += String.fromCharCode(((c & 31) << 6) | (b[i + 1] & 63));
		        ++i;
		    }
		    else
		    {
		        ret += String.fromCharCode(((c & 15) << 12) | ((b[i + 1] & 63) << 6) | (b[i + 2] & 63));
		        i += 2;
		    }
		}
		return ret;
	}
	
	// Set the private key fields N, e, and d from hex strings
	ns.RSASetPrivate = function(N, E, D)
	{
		if (N != null && E != null && N.length > 0 && E.length > 0)
		{
		    this.n = ns.parseBigInt(N, 16);
		    this.e = parseInt(E, 16);
		    this.d = ns.parseBigInt(D, 16);
		}
		else alert("Invalid RSA private key");
	}
	
	// Set the private key fields N, e, d and CRT params from hex strings
	ns.RSASetPrivateEx = function(N, E, D, P, Q, DP, DQ, C)
	{
		if (N != null && E != null && N.length > 0 && E.length > 0)
		{
		    this.n = ns.parseBigInt(N, 16);
		    this.e = parseInt(E, 16);
		    this.d = ns.parseBigInt(D, 16);
		    this.p = ns.parseBigInt(P, 16);
		    this.q = ns.parseBigInt(Q, 16);
		    this.dmp1 = ns.parseBigInt(DP, 16);
		    this.dmq1 = ns.parseBigInt(DQ, 16);
		    this.coeff = ns.parseBigInt(C, 16);
		}
		else alert("Invalid RSA private key");
	}
	
	// Generate a new random private key B bits long, using public expt E
	ns.RSAGenerate = function(B, E)
	{
		var rng = new ns.SeededRandom();
		var qs = B >> 1;
		this.e = parseInt(E, 16);
		var ee = new ns.BigInteger(E, 16);
		for (;;)
		{
		    for (;;)
		    {
		        this.p = new ns.BigInteger(B - qs, 1, rng);
		        if (this.p.subtract(ns.BigInteger.ONE).gcd(ee).compareTo(ns.BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) break;
		    }
		    for (;;)
		    {
		        this.q = new ns.BigInteger(qs, 1, rng);
		        if (this.q.subtract(ns.BigInteger.ONE).gcd(ee).compareTo(ns.BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) break;
		    }
		    if (this.p.compareTo(this.q) <= 0)
		    {
		        var t = this.p;
		        this.p = this.q;
		        this.q = t;
		    }
		    var p1 = this.p.subtract(ns.BigInteger.ONE);
		    var q1 = this.q.subtract(ns.BigInteger.ONE);
		    var phi = p1.multiply(q1);
		    if (phi.gcd(ee).compareTo(ns.BigInteger.ONE) == 0)
		    {
		        this.n = this.p.multiply(this.q);
		        this.d = ee.modInverse(phi);
		        this.dmp1 = this.d.mod(p1);
		        this.dmq1 = this.d.mod(q1);
		        this.coeff = this.q.modInverse(this.p);
		        break;
		    }
		}
	}
	
	// Perform raw private operation on "x": return x^d (mod n)
	ns.RSADoPrivate = function(x)
	{
		if (this.p == null || this.q == null) return x.modPow(this.d, this.n);
		// TODO: re-calculate any missing CRT params
		var xp = x.mod(this.p).modPow(this.dmp1, this.p);
		var xq = x.mod(this.q).modPow(this.dmq1, this.q);
		while (xp.compareTo(xq) < 0)
		xp = xp.add(this.p);
		return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
	}

	// Return the PKCS#1 RSA decryption of "ctext".
	// "ctext" is an even-length hex string and the output is a plain string.
	ns.RSADecrypt = function(ctext)
	{
		var c = ns.parseBigInt(ctext, 16);
		var m = this.doPrivate(c);
		if (m == null) return null;
		return ns.pkcs1unpad2(m, (this.n.bitLength() + 7) >> 3);
	}
	
	// protected
	ns.RSAKey.prototype.doPrivate = ns.RSADoPrivate;
	
	// public
	ns.RSAKey.prototype.setPrivate = ns.RSASetPrivate;
	ns.RSAKey.prototype.setPrivateEx = ns.RSASetPrivateEx;
	ns.RSAKey.prototype.generate = ns.RSAGenerate;
	ns.RSAKey.prototype.decrypt = ns.RSADecrypt;
	
	
	
	
	
	//
	// rsa-sign.js - adding signing functions to RSAKey class.
	//
	//
	// version: 1.0 (2010-Jun-03)
	//
	// Copyright (c) 2010 Kenji Urushima (kenji.urushima@gmail.com)
	//
	// This software is licensed under the terms of the MIT License.
	// http://www.opensource.org/licenses/mit-license.php
	//
	// The above copyright and license notice shall be 
	// included in all copies or substantial portions of the Software.
	//
	// Depends on:
	//   function sha1.hex(s) of sha1.js
	//   jsbn.js
	//   jsbn2.js
	//   rsa.js
	//   rsa2.js
	//
	// keysize / pmstrlen
	//  512 /  128
	// 1024 /  256
	// 2048 /  512
	// 4096 / 1024
	// As for _RSASGIN_DIHEAD values for each hash algorithm, see PKCS#1 v2.1 spec (p38).
	ns._RSASIGN_DIHEAD = [];
	ns._RSASIGN_DIHEAD['sha1'] = "3021300906052b0e03021a05000414";
	ns._RSASIGN_DIHEAD['sha256'] = "3031300d060960864801650304020105000420";
	//ns._RSASIGN_DIHEAD['md2'] = "3020300c06082a864886f70d020205000410";
	//ns._RSASIGN_DIHEAD['md5'] = "3020300c06082a864886f70d020505000410";
	//ns._RSASIGN_DIHEAD['sha384'] = "3041300d060960864801650304020205000430";
	//ns._RSASIGN_DIHEAD['sha512'] = "3051300d060960864801650304020305000440";
	ns._RSASIGN_HASHHEXFUNC = [];
	ns._RSASIGN_HASHHEXFUNC['sha1'] = ns.sha1.hex;
	ns._RSASIGN_HASHHEXFUNC['sha256'] = ns.sha256.hex;
	
	// ========================================================================
	// Signature Generation
	// ========================================================================
	
	ns._rsasign_getHexPaddedDigestInfoForString = function(s, keySize, hashAlg)
	{
		var pmStrLen = keySize / 4;
		var hashFunc = ns._RSASIGN_HASHHEXFUNC[hashAlg];
		var sHashHex = hashFunc(s);
		
		var sHead = "0001";
		var sTail = "00" + ns._RSASIGN_DIHEAD[hashAlg] + sHashHex;
		var sMid = "";
		var fLen = pmStrLen - sHead.length - sTail.length;
		for (var i = 0; i < fLen; i += 2)
		{
		    sMid += "ff";
		}
		sPaddedMessageHex = sHead + sMid + sTail;
		return sPaddedMessageHex;
	}
	
	ns._rsasign_signString = function(s, hashAlg)
	{
		var hPM = ns._rsasign_getHexPaddedDigestInfoForString(s, this.n.bitLength(), hashAlg);
		var biPaddedMessage = ns.parseBigInt(hPM, 16);
		var biSign = this.doPrivate(biPaddedMessage);
		var hexSign = biSign.toString(16);
		return hexSign;
	}

	ns._rsasign_signStringWithSHA1 = function(s)
	{
		var hPM = ns._rsasign_getHexPaddedDigestInfoForString(s, this.n.bitLength(), 'sha1');
		var biPaddedMessage = ns.parseBigInt(hPM, 16);
		var biSign = this.doPrivate(biPaddedMessage);
		var hexSign = biSign.toString(16);
		return hexSign;
	}
	
	ns._rsasign_signStringWithSHA256 = function(s)
	{
		var hPM = ns._rsasign_getHexPaddedDigestInfoForString(s, this.n.bitLength(), 'sha256');
		var biPaddedMessage = ns.parseBigInt(hPM, 16);
		var biSign = this.doPrivate(biPaddedMessage);
		var hexSign = biSign.toString(16);
		return hexSign;
	}
	
	// ========================================================================
	// Signature Verification
	// ========================================================================
	
	ns._rsasign_getDecryptSignatureBI = function(biSig, hN, hE)
	{
		var rsa = new ns.RSAKey();
		rsa.setPublic(hN, hE);
		var biDecryptedSig = rsa.doPublic(biSig);
		return biDecryptedSig;
	}
	
	ns._rsasign_getHexDigestInfoFromSig = function(biSig, hN, hE)
	{
		var biDecryptedSig = ns._rsasign_getDecryptSignatureBI(biSig, hN, hE);
		var hDigestInfo = biDecryptedSig.toString(16).replace(/^1f+00/, '');
		return hDigestInfo;
	}
	
	ns._rsasign_getAlgNameAndHashFromHexDisgestInfo = function(hDigestInfo)
	{
		for (var algName in ns._RSASIGN_DIHEAD)
		{
		    var head = ns._RSASIGN_DIHEAD[algName];
		    var len = head.length;
		    if (hDigestInfo.substring(0, len) == head)
		    {
		        var a = [algName, hDigestInfo.substring(len)];
		        return a;
		    }
		}
		return [];
	}
	
	ns._rsasign_verifySignatureWithArgs = function(sMsg, biSig, hN, hE)
	{
		var hDigestInfo = ns._rsasign_getHexDigestInfoFromSig(biSig, hN, hE);
		var digestInfoAry = ns._rsasign_getAlgNameAndHashFromHexDisgestInfo(hDigestInfo);
		if (digestInfoAry.length == 0) return false;
		var algName = digestInfoAry[0];
		var diHashValue = digestInfoAry[1];
		var ff = ns._RSASIGN_HASHHEXFUNC[algName];
		var msgHashValue = ff(sMsg);
		return (diHashValue == msgHashValue);
	}
	
	ns._rsasign_verifyHexSignatureForMessage = function(hSig, sMsg)
	{
		var biSig = ns.parseBigInt(hSig, 16);
		var result = ns._rsasign_verifySignatureWithArgs(sMsg, biSig, this.n.toString(16), this.e.toString(16));
		return result;
	}
	
	ns._rsasign_verifyString = function(sMsg, hSig)
	{
		hSig = hSig.replace(/[ \n]+/g, "");
		var biSig = ns.parseBigInt(hSig, 16);
		var biDecryptedSig = this.doPublic(biSig);
		var hDigestInfo = biDecryptedSig.toString(16).replace(/^1f+00/, '');
		var digestInfoAry = ns._rsasign_getAlgNameAndHashFromHexDisgestInfo(hDigestInfo);
		
		if (digestInfoAry.length == 0) return false;
		var algName = digestInfoAry[0];
		var diHashValue = digestInfoAry[1];
		var ff = ns._RSASIGN_HASHHEXFUNC[algName];
		var msgHashValue = ff(sMsg);
		return (diHashValue == msgHashValue);
	}
	
	ns.RSAKey.prototype.signString = ns._rsasign_signString;
	ns.RSAKey.prototype.signStringWithSHA1 = ns._rsasign_signStringWithSHA1;
	ns.RSAKey.prototype.signStringWithSHA256 = ns._rsasign_signStringWithSHA256;
	
	ns.RSAKey.prototype.verifyString = ns._rsasign_verifyString;
	ns.RSAKey.prototype.verifyHexSignatureForMessage = ns._rsasign_verifyHexSignatureForMessage;
	
	
	// --- jscrypto.js ---------------------------------------------------------------------------------------------- //
	
	
	/**
	 * Method to parse a pem encoded string containing both a public or private key.
	 * The method will translate the pem encoded string in a der encoded string and
	 * will parse private key and public key parameters. This method accepts public key
	 * in the rsaencryption pkcs #1 format (oid: 1.2.840.113549.1.1.1).
	 *
	 * @todo Check how many rsa formats use the same format of pkcs #1.
	 *
	 * The format is defined as:
	 * PublicKeyInfo ::= SEQUENCE {
	 *   algorithm       AlgorithmIdentifier,
	 *   PublicKey       BIT STRING
	 * }
	 * Where AlgorithmIdentifier is:
	 * AlgorithmIdentifier ::= SEQUENCE {
	 *   algorithm       OBJECT IDENTIFIER,     the OID of the enc algorithm
	 *   parameters      ANY DEFINED BY algorithm OPTIONAL (NULL for PKCS #1)
	 * }
	 * and PublicKey is a SEQUENCE encapsulated in a BIT STRING
	 * RSAPublicKey ::= SEQUENCE {
	 *   modulus           INTEGER,  -- n
	 *   publicExponent    INTEGER   -- e
	 * }
	 * it's possible to examine the structure of the keys obtained from openssl using
	 * an asn.1 dumper as the one used here to parse the components: http://lapo.it/asn1js/
	 * @argument {string} pem the pem encoded string, can include the BEGIN/END header/footer
	 * @private
	 */
	ns.RSAKey.prototype.parseKey = function (pem) {
	  try {
		var modulus = 0;
		var public_exponent = 0;
		var reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
		var der = reHex.test(pem) ? Hex.decode(pem) : Base64.unarmor(pem);
		var asn1 = ASN1.decode(der);
		
		//Fixes a bug with OpenSSL 1.0+ private keys
		if(asn1.sub.length === 3){
		    asn1 = asn1.sub[2].sub[0];
		}
		if (asn1.sub.length === 9) {

		  // Parse the private key.
		  modulus = asn1.sub[1].getHexStringValue(); //bigint
		  this.n = ns.parseBigInt(modulus, 16);

		  public_exponent = asn1.sub[2].getHexStringValue(); //int
		  this.e = parseInt(public_exponent, 16);

		  var private_exponent = asn1.sub[3].getHexStringValue(); //bigint
		  this.d = ns.parseBigInt(private_exponent, 16);

		  var prime1 = asn1.sub[4].getHexStringValue(); //bigint
		  this.p = ns.parseBigInt(prime1, 16);

		  var prime2 = asn1.sub[5].getHexStringValue(); //bigint
		  this.q = ns.parseBigInt(prime2, 16);

		  var exponent1 = asn1.sub[6].getHexStringValue(); //bigint
		  this.dmp1 = ns.parseBigInt(exponent1, 16);

		  var exponent2 = asn1.sub[7].getHexStringValue(); //bigint
		  this.dmq1 = ns.parseBigInt(exponent2, 16);

		  var coefficient = asn1.sub[8].getHexStringValue(); //bigint
		  this.coeff = ns.parseBigInt(coefficient, 16);

		}
		else if (asn1.sub.length === 2) {

		  // Parse the public key.
		  var bit_string = asn1.sub[1];
		  var sequence = bit_string.sub[0];

		  modulus = sequence.sub[0].getHexStringValue();
		  this.n = ns.parseBigInt(modulus, 16);
		  public_exponent = sequence.sub[1].getHexStringValue();
		  this.e = parseInt(public_exponent, 16);
		
		}
		else {
		  return false;
		}
		return true;
	  }
	  catch (ex) {
		return false;
	  }
	};
	
	/**
	 * Translate rsa parameters in a hex encoded string representing the rsa key.
	 *
	 * The translation follow the ASN.1 notation :
	 * RSAPrivateKey ::= SEQUENCE {
	 *   version           Version,
	 *   modulus           INTEGER,  -- n
	 *   publicExponent    INTEGER,  -- e
	 *   privateExponent   INTEGER,  -- d
	 *   prime1            INTEGER,  -- p
	 *   prime2            INTEGER,  -- q
	 *   exponent1         INTEGER,  -- d mod (p1)
	 *   exponent2         INTEGER,  -- d mod (q-1)
	 *   coefficient       INTEGER,  -- (inverse of q) mod p
	 * }
	 * @returns {string}  DER Encoded String representing the rsa private key
	 * @private
	 */
	ns.RSAKey.prototype.getPrivateBaseKey = function () {
	  var options = {
		'array': [
		  new KJUR.asn1.DERInteger({'int': 0}),
		  new KJUR.asn1.DERInteger({'bigint': this.n}),
		  new KJUR.asn1.DERInteger({'int': this.e}),
		  new KJUR.asn1.DERInteger({'bigint': this.d}),
		  new KJUR.asn1.DERInteger({'bigint': this.p}),
		  new KJUR.asn1.DERInteger({'bigint': this.q}),
		  new KJUR.asn1.DERInteger({'bigint': this.dmp1}),
		  new KJUR.asn1.DERInteger({'bigint': this.dmq1}),
		  new KJUR.asn1.DERInteger({'bigint': this.coeff})
		]
	  };
	  var seq = new KJUR.asn1.DERSequence(options);
	  return seq.getEncodedHex();
	};
	
	/**
	 * base64 (pem) encoded version of the DER encoded representation
	 * @returns {string} pem encoded representation without header and footer
	 * @public
	 */
	ns.RSAKey.prototype.getPrivateBaseKeyB64 = function () {
	  return ns.hex2b64(this.getPrivateBaseKey());
	};
	
	/**
	 * Translate rsa parameters in a hex encoded string representing the rsa public key.
	 * The representation follow the ASN.1 notation :
	 * PublicKeyInfo ::= SEQUENCE {
	 *   algorithm       AlgorithmIdentifier,
	 *   PublicKey       BIT STRING
	 * }
	 * Where AlgorithmIdentifier is:
	 * AlgorithmIdentifier ::= SEQUENCE {
	 *   algorithm       OBJECT IDENTIFIER,     the OID of the enc algorithm
	 *   parameters      ANY DEFINED BY algorithm OPTIONAL (NULL for PKCS #1)
	 * }
	 * and PublicKey is a SEQUENCE encapsulated in a BIT STRING
	 * RSAPublicKey ::= SEQUENCE {
	 *   modulus           INTEGER,  -- n
	 *   publicExponent    INTEGER   -- e
	 * }
	 * @returns {string} DER Encoded String representing the rsa public key
	 * @private
	 */
	ns.RSAKey.prototype.getPublicBaseKey = function () {
	  var options = {
		'array': [
		  new KJUR.asn1.DERObjectIdentifier({'oid': '1.2.840.113549.1.1.1'}), //RSA Encryption pkcs #1 oid
		  new KJUR.asn1.DERNull()
		]
	  };
	  var first_sequence = new KJUR.asn1.DERSequence(options);

	  options = {
		'array': [
		  new KJUR.asn1.DERInteger({'bigint': this.n}),
		  new KJUR.asn1.DERInteger({'int': this.e})
		]
	  };
	  var second_sequence = new KJUR.asn1.DERSequence(options);

	  options = {
		'hex': '00' + second_sequence.getEncodedHex()
	  };
	  var bit_string = new KJUR.asn1.DERBitString(options);

	  options = {
		'array': [
		  first_sequence,
		  bit_string
		]
	  };
	  var seq = new KJUR.asn1.DERSequence(options);
	  return seq.getEncodedHex();
	};
	
	/**
	 * base64 (pem) encoded version of the DER encoded representation
	 * @returns {string} pem encoded representation without header and footer
	 * @public
	 */
	ns.RSAKey.prototype.getPublicBaseKeyB64 = function () {
	  return ns.hex2b64(this.getPublicBaseKey());
	};
	
	/**
	 * wrap the string in block of width chars. The default value for rsa keys is 64
	 * characters.
	 * @param {string} str the pem encoded string without header and footer
	 * @param {Number} [width=64] - the length the string has to be wrapped at
	 * @returns {string}
	 * @private
	 */
	ns.RSAKey.prototype.wordwrap = function (str, width) {
	  width = width || 64;
	  if (!str) {
		return str;
	  }
	  var regex = '(.{1,' + width + '})( +|$\n?)|(.{1,' + width + '})';
	  return str.match(RegExp(regex, 'g')).join('\n');
	};
	
	/**
	 * Retrieve the pem encoded private key
	 * @returns {string} the pem encoded private key with header/footer
	 * @public
	 */
	ns.RSAKey.prototype.getPrivateKey = function () {
	  var key = "-----BEGIN RSA PRIVATE KEY-----\n";
	  key += this.wordwrap(this.getPrivateBaseKeyB64()) + "\n";
	  key += "-----END RSA PRIVATE KEY-----";
	  return key;
	};
	
	/**
	 * Retrieve the pem encoded public key
	 * @returns {string} the pem encoded public key with header/footer
	 * @public
	 */
	ns.RSAKey.prototype.getPublicKey = function () {
	  var key = "-----BEGIN PUBLIC KEY-----\n";
	  key += this.wordwrap(this.getPublicBaseKeyB64()) + "\n";
	  key += "-----END PUBLIC KEY-----";
	  return key;
	};
	
	/**
	 * Check if the object contains the necessary parameters to populate the rsa modulus
	 * and public exponent parameters.
	 * @param {Object} [obj={}] - An object that may contain the two public key
	 * parameters
	 * @returns {boolean} true if the object contains both the modulus and the public exponent
	 * properties (n and e)
	 * @todo check for types of n and e. N should be a parseable bigInt object, E should
	 * be a parseable integer number
	 * @private
	 */
	ns.RSAKey.prototype.hasPublicKeyProperty = function (obj) {
	  obj = obj || {};
	  return (
		obj.hasOwnProperty('n') &&
		obj.hasOwnProperty('e')
	  );
	};
	
	/**
	 * Check if the object contains ALL the parameters of an RSA key.
	 * @param {Object} [obj={}] - An object that may contain nine rsa key
	 * parameters
	 * @returns {boolean} true if the object contains all the parameters needed
	 * @todo check for types of the parameters all the parameters but the public exponent
	 * should be parseable bigint objects, the public exponent should be a parseable integer number
	 * @private
	 */
	ns.RSAKey.prototype.hasPrivateKeyProperty = function (obj) {
	  obj = obj || {};
	  return (
		obj.hasOwnProperty('n') &&
		obj.hasOwnProperty('e') &&
		obj.hasOwnProperty('d') &&
		obj.hasOwnProperty('p') &&
		obj.hasOwnProperty('q') &&
		obj.hasOwnProperty('dmp1') &&
		obj.hasOwnProperty('dmq1') &&
		obj.hasOwnProperty('coeff')
	  );
	};
	
	/**
	 * Parse the properties of obj in the current rsa object. Obj should AT LEAST
	 * include the modulus and public exponent (n, e) parameters.
	 * @param {Object} obj - the object containing rsa parameters
	 * @private
	 */
	ns.RSAKey.prototype.parsePropertiesFrom = function (obj) {
	  this.n = obj.n;
	  this.e = obj.e;

	  if (obj.hasOwnProperty('d')) {
		this.d = obj.d;
		this.p = obj.p;
		this.q = obj.q;
		this.dmp1 = obj.dmp1;
		this.dmq1 = obj.dmq1;
		this.coeff = obj.coeff;
	  }
	};
	
	/**
	 * Create a new JSEncryptRSAKey that extends Tom Wu's RSA key object.
	 * This object is just a decorator for parsing the key parameter
	 * @param {string|Object} key - The key in string format, or an object containing
	 * the parameters needed to build a RSAKey object.
	 * @constructor
	 */
	ns.JSEncryptRSAKey = function (key) {
	  // Call the super constructor.
	  ns.RSAKey.call(this);
	  // If a key key was provided.
	  if (key) {
		// If this is a string...
		if (typeof key === 'string') {
		  this.parseKey(key);
		}
		else if (
		  this.hasPrivateKeyProperty(key) ||
		  this.hasPublicKeyProperty(key)
		) {
		  // Set the values for the key.
		  this.parsePropertiesFrom(key);
		}
	  }
	};
	
	// Derive from RSAKey.
	ns.JSEncryptRSAKey.prototype = new ns.RSAKey();
	
	// Reset the contructor.
	ns.JSEncryptRSAKey.prototype.constructor = ns.JSEncryptRSAKey;
	
	
})( cryptodeps );



