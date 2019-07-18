/*©agpl*************************************************************************
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

/*******************************************************************************
*                                                                              *
* Friend Crypto (fcrypt) v0.2                                                  *
*                                                                              *
* @dependency                                                                  *
*                                                                              *
* 	cryptojs/rollups/aes.js                                                    *
* 	cryptojs/rollups/pbkdf2.js                                                 *
*   jsencrypt.js                                                               *
*   base64.js                                                                  *
*   jscrypto.js                                                                *
*   hash.js                                                                    *
*   jsbn.js                                                                    *
*   random.js                                                                  *
*   rsa.js                                                                     *
*                                                                              *
* @example                                                                     *
*                                                                              *
* 	// generate an object of private and public keys                           *
* 	var keysObject = fcrypt.generateKeys();                                    *
*                                                                              *
*   // get private and public key as string                                    *
*   var privateKey = fcrypt.getPrivateKey();                                   *
*   var publicKey  = fcrypt.getPublicKey();                                    *
*                                                                              *
*   // encrypt message with receivers public key                               *
*   var encrypted  = fcrypt.encryptString( message, publicKey );               *
*   var ciphertext = encrypted.cipher;                                         *
*                                                                              *
*   // decrypt cipertext with receivers privateKey                             *
*   var decrypted = fcrypt.decryptString( ciphertext, privateKey );            *
*   var plaintext = decrypted.plaintext;                                       *
*                                                                              *
*   // create certificate and encrypt the data with owner keys                 *
*   var signed      = fcrypt.signCertificate( data, publicKey, privateKey );   *
*   var certificate = signed.certificate;                                      *
*   var signed      = signed.signature;                                        *
*                                                                              *
*   // verify certificate with owners private key                              *
*   var valid = fcrypt.verifyCertificate( certificate, privateKey, signed );   *
*                                                                              *
*   // sign a message with senders private key                                 *
*   var signature = fcrypt.signString( message, privateKey );                  *
*                                                                              *
*   // verify a message with senders signature and senders public key          *
*   var valid = fcrypt.verifyString( message, signature, publicKey );          *
*                                                                              *
*   // generate a random/passphrased pbkdf2 or hash key                        *
*   fcrypt.generateKey: function ( passPhrase, bitLength, keySize, keyType )   *
*                                                                              *
*******************************************************************************/

fcrypt = {
	
	// Public variables: _______________________________________________________
	
	rsaKeySize: 1024,
	rsaKeyType: '03', //65537 default openssl public exponent for rsa key type
	aesKeySize: 256,
	aesKeyType: 'pbkdf2',
	aesBlockSize: 256,
	aesBitLength: 32,
	keysObject: false,
	privKeyObject: false,
	pubKeyObject: false,
	debug: false,
	base64Chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
	
	// Public helper functions: __________________________________________________
	
	bytes2string: function ( bts )
	{
		var str = '';
        for ( var i = 0; i < bts.length; i++ )
        {
            str += String.fromCharCode( bts[i] );
        }   
        return str;
	},
	
	string2bytes: function ( str )
	{
		var bytes = new Array();
        for ( var i = 0; i < str.length; i++ ) 
        {
            bytes.push( str.charCodeAt(i) );
        }
        return bytes;
	},
	
	b16to64: function ( h )
	{
        var i;
        var c;
        var ret = '';
        if ( h.length % 2 == 1 )
        {
            h = "0" + h;
        }
        for ( i = 0; i + 3 <= h.length; i += 3 )
        {
            c = parseInt( h.substring( i, i + 3 ), 16 );
            ret += this.base64Chars.charAt( c >> 6 ) + this.base64Chars.charAt( c & 63 );
        }
        if ( i + 1 == h.length )
        {
            c = parseInt( h.substring( i, i + 1 ), 16 );
            ret += this.base64Chars.charAt( c << 2 );
        }
        else if ( i + 2 == h.length )
        {
            c = parseInt( h.substring( i, i + 2 ), 16 );
            ret += this.base64Chars.charAt( c >> 2 ) + this.base64Chars.charAt( ( c & 3 ) << 4 );
        }
        while ( ( ret.length & 3 ) > 0 ) ret += '=';
        return ret;
    },
	
	b64to16: function ( s )
	{
        var ret = '';
        var i;
        var k = 0;
        var slop;
        for ( i = 0; i < s.length; ++i )
        {
            if ( s.charAt(i) == '=' ) break;
            v = this.base64Chars.indexOf( s.charAt(i) );
            if ( v < 0 ) continue;
            if ( k == 0 )
            {
                ret += int2char( v >> 2 );
                slop = v & 3;
                k = 1;
            }
            else if ( k == 1 )
            {
                ret += int2char( (slop << 2) | (v >> 4) );
                slop = v & 0xf;
                k = 2;
            }
            else if ( k == 2 )
            {
                ret += int2char( slop );
                ret += int2char( v >> 2 );
                slop = v & 3;
                k = 3;
            }
            else
            {
                ret += int2char( (slop << 2) | (v >> 4) );
                ret += int2char( v & 0xf );
                k = 0;
            }
        }
        if ( k == 1 ) ret += int2char( slop << 2 );
        return ret;
    },
	
	trimWhitespaceTrail: function( str )
	{
		var l = str.length - 1;
		var m = 0;
		for( var a = l; a > 0; a-- )
		{
			if( m == 0 )
			{
				var ch = str.charCodeAt( a );
				if( ch == 0 || ch == 11 ) continue;
				else m = 1;
			}
			if( m == 1 )
			{
				break;
			}
		}
		return str.substr( 0, a+1 );
	},
	
	linebrk: function ( s, n )
	{
		var ret = '';
		var i = 0;
		while ( i + n < s.length )
		{
			ret += s.substring( i, i + n ) + "\n";
			i += n;
		}
		return ret + s.substring( i, s.length );
	},
	
	stripHeader: function ( str )
	{
		if( !str ) return false;
        str = str.split( "\n" ).join( "" );
		str = str.replace( "-----BEGIN RSA PRIVATE KEY-----\n", '' );
		str = str.replace( "-----BEGIN RSA PRIVATE KEY-----", '' );
        str = str.replace( "-----BEGIN PRIVATE KEY-----\n", '' );
		str = str.replace( "-----BEGIN PRIVATE KEY-----", '' );
		str = str.replace( "-----END RSA PRIVATE KEY-----", '' );
        str = str.replace( "-----END PRIVATE KEY-----", '' );
        str = str.replace( "-----BEGIN RSA PUBLIC KEY-----\n", '' );
		str = str.replace( "-----BEGIN RSA PUBLIC KEY-----", '' );
		str = str.replace( "-----BEGIN PUBLIC KEY-----\n", '' );
		str = str.replace( "-----BEGIN PUBLIC KEY-----", '' );
        str = str.replace( "-----END RSA PUBLIC KEY-----", '' );
		str = str.replace( "-----END PUBLIC KEY-----", '' );
		str = str.replace( "-----BEGIN CERTIFICATE-----\n", '' );
		str = str.replace( "-----BEGIN CERTIFICATE-----", '' );
		str = str.replace( "-----END CERTIFICATE-----", '' );
		str = str.replace( "\n", '' );
		return str;
	},
	
	// Public functions: _______________________________________________________
	
	generateKeys: function ( passPhrase, keySize, keyType )
	{
		keyType = ( keyType ? keyType : this.rsaKeyType );
		keySize = ( keySize ? keySize : this.rsaKeySize );
		
		var key = this.generateKey( passPhrase, 32, 256, 'sha256' );
		
		if ( key )
		{
			Math.seedrandom( key );
			var keysObject = new RSAKey();
			keysObject.generate( keySize, keyType );
			
			if( keysObject && typeof keysObject === 'object' )
			{
				this.keysObject = keysObject;
				return keysObject;
			}
		}
		
		return false;
	},
	
	getPrivateKey: function ( privKeyObject )
	{
		if ( !privKeyObject )
		{
			privKeyObject = ( this.privKeyObject ? this.privKeyObject : this.keysObject );
		}
		
		if ( privKeyObject && typeof privKeyObject === 'object' )
		{
			return privKeyObject.getPrivateKey();
		}
		
		return false;
	},
	
	getPublicKey: function ( pubKeyObject )
	{
		if ( !pubKeyObject )
		{
			pubKeyObject = ( this.pubKeyObject ? this.pubKeyObject : this.keysObject );
		}
		
		if ( pubKeyObject && typeof pubKeyObject === 'object' )
		{
			return pubKeyObject.getPublicKey();
		}
		
		return false;
	},
	
	setPrivateKeyRSA: function ( str )
	{
		str = this.stripHeader( str );
        var privKeyObject = new RSAKey();
        privKeyObject.parseKey( str );
		
		if ( privKeyObject && typeof privKeyObject === 'object' )
		{
			this.privKeyObject = privKeyObject;
			return privKeyObject;
		}
		
		return false;
	},
	
	setPublicKeyRSA: function ( str )
	{
		str = this.stripHeader( str );
		var pubKeyObject = new RSAKey();
        pubKeyObject.parseKey( str );
		
		if ( pubKeyObject && typeof pubKeyObject === 'object' )
		{
			this.pubKeyObject = pubKeyObject;
			return pubKeyObject;
		}
		
		return false;
	},
	
	publicKeyID: function ( str )
	{
		if ( !str )
		{
			var pubKeyObject = ( pubKeyObject ? pubKeyObject : keysObject );
			str = this.getPublicKey( pubKeyObject );
		}
		
		if ( str )
		{
			str = this.stripHeader( str );
			return MD5( str );
		}
		
		return false;
	},
	
	generateKey: function ( passPhrase, bitLength, keySize, keyType )
	{
		bitLength = ( bitLength ? bitLength : this.aesBitLength );
		keySize = ( keySize ? keySize : this.aesKeySize );
		keyType = ( keyType ? keyType : this.aesKeyType );
		
		if ( !passPhrase )
		{
			passPhrase = new Array(32);
			var r = new SecureRandom();
			r.nextBytes( passPhrase );
			passPhrase = this.bytes2string( passPhrase );
		}
		
		if ( keyType == 'sha256' )
		{
			var key = sha256.hex( passPhrase );
			
			if( key )
			{
				return key;
			}
		}
		else
		{
			var salt = CryptoJS.lib.WordArray.random(128/8); 
			var key = CryptoJS.PBKDF2( passPhrase, salt, { keySize: 256/32, iterations: 500 } );
			//var iv  = CryptoJS.enc.Hex.parse('101112131415161718191a1b1c1d1e1f'); // usually random
			var iv  = salt;
			
			var key_base64  = key.toString(CryptoJS.enc.Base64);
			var iv_base64   = iv.toString(CryptoJS.enc.Base64);
			
			if ( key_base64 && iv_base64 )
			{
				return { key: key_base64, iv: iv_base64 };
			}
		}
		
		return false;
	},
	
	encryptRSA: function ( plaintext, keysObject )
	{
		if ( !plaintext ) return false;
		
		if ( keysObject && typeof keysObject === 'string' )
		{
			keysObject = this.setPublicKeyRSA( keysObject );
		}
		
		if ( !keysObject )
		{
			keysObject = ( this.pubKeyObject ? this.pubKeyObject : this.privKeyObject );
			
			if ( keysObject )
			{
				keysObject = this.keysObject;
			}
		}
		
		if ( keysObject )
		{
			var encrypted = keysObject.encrypt( plaintext );
			
			if ( encrypted )
			{
				return this.b16to64( encrypted );
			}
		}
		
		return false;
	},
	
	decryptRSA: function ( encryptedText, keysObject )
	{
		if ( !encryptedText ) return false;
		
		if ( keysObject && typeof keysObject === 'string' )
		{
			keysObject = this.setPrivateKeyRSA( keysObject );
		}
		
		if ( !keysObject )
		{
			keysObject = ( this.privKeyObject ? this.privKeyObject : this.pubKeyObject );
			
			if ( keysObject )
			{
				keysObject = this.keysObject;
			}
		}
		
		if ( keysObject )
		{
			var decrypted = keysObject.decrypt( this.b64to16( encryptedText ) );
			
			if ( decrypted )
			{
				return decrypted;
			}
		}
		
		return false;
	},
	
	encryptAES: function ( plaintext, key, iv )
	{
		if( !plaintext || !key || !iv ) return false;
		
		var key_binary = CryptoJS.enc.Base64.parse(key);
        var iv_binary = CryptoJS.enc.Base64.parse(iv);
		
        var encrypted = CryptoJS.AES.encrypt( plaintext, key_binary, { iv: iv_binary } );
		
        if( encrypted )
		{
			var data_base64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64); 
			var iv_base64   = encrypted.iv.toString(CryptoJS.enc.Base64);       
			var key_base64  = encrypted.key.toString(CryptoJS.enc.Base64);
			
			if ( this.debug )
			{
				console.log( 'key: ' + key_binary );
				console.log( 'iv: ' + iv_binary );
				console.log( 'data(b64): ' + data_base64 );
				console.log( 'iv(b64): ' + iv_base64 );
				console.log( 'key(b64): ' + key_base64 );
			}
			
			return { cipher: data_base64, key: key_base64, iv: iv_base64 };
		}
		
		return false;
	},
	
	decryptAES: function ( encryptedText, key, iv )
	{
		if( !encryptedText || !key || !iv ) return false;
		
		data_binary = CryptoJS.enc.Base64.parse(encryptedText);
        key_binary = CryptoJS.enc.Base64.parse(key);
        iv_binary = CryptoJS.enc.Base64.parse(iv);
		
        var decrypted = CryptoJS.AES.decrypt( { ciphertext: data_binary }, key_binary, { iv: iv_binary } );
		
		if ( this.debug )
		{
			console.log( 'cipher: ' + data_binary );
			console.log( 'key: ' + key_binary );
			console.log( 'iv: ' + iv_binary );
			console.log( 'decrypted text: ' + decrypted );
			console.log( 'decrypted text (utf8): ' + decrypted.toString(CryptoJS.enc.Utf8) );
		}
		
		if( decrypted )
		{
			var plaintext = decrypted.toString(CryptoJS.enc.Utf8);
			plaintext = this.trimWhitespaceTrail( plaintext );
			return plaintext;
		}
		
		return false;
	},
	
	encryptString: function ( plaintext, publicKey, signingKey )
	{
		if ( !plaintext ) return false;
		
		if ( signingKey )
        {
			if ( signingKey && typeof signingKey === 'string' )
			{
				signingKey = this.setPrivateKeyRSA( signingKey );
			}
			
            var pubkey = this.getPublicKey( signingKey );
            pubkey = this.stripHeader( pubkey );
            var signString = this.signString( plaintext, signingKey );
			plaintext += '::52cee64bb3a38f6403386519a39ac91c::';
            plaintext += pubkey;
            plaintext += '::52cee64bb3a38f6403386519a39ac91c::';
            plaintext += signString;
        }
		
        var aeskey = this.generateKey();
		
		if ( aeskey && typeof aeskey === 'object' )
		{
			var AESdata = this.encryptAES( plaintext, aeskey.key, aeskey.iv );
			
			if ( AESdata )
			{
				var pubkey = ( publicKey ? this.setPublicKeyRSA( publicKey ) : this.pubKeyObject );
				
				if ( pubkey )
				{
					var RSAdata = this.encryptRSA( ( AESdata.key + '?' + AESdata.iv ), pubkey ) + '?';
				}
				if ( !RSAdata )
				{
					return { status: 'Invalid public key' };
				}
				
				var cipherblock = '';
				cipherblock += RSAdata;
				cipherblock += AESdata.cipher;
				
				if ( cipherblock )
				{
					return { status: 'success', cipher: this.linebrk( cipherblock, 64 ) };
				}
			}
		}
		
		return false;
	},
	
	decryptString: function ( ciphertext, privKeyObject )
	{
		if ( !ciphertext ) return false;
		
		if ( privKeyObject && typeof privKeyObject === 'string' )
		{
			privKeyObject = this.setPrivateKeyRSA( privKeyObject );
		}
		
		if ( !privKeyObject )
		{
			privKeyObject = ( this.privKeyObject ? this.privKeyObject : this.keysObject );
		}
		
		if ( ciphertext && privKeyObject )
		{
			ciphertext = this.stripHeader( ciphertext );
			var cipherblock = ciphertext.split( '?' );
			
			var aeskey = this.decryptRSA( cipherblock[0], privKeyObject );
			
			if ( !aeskey )
			{
				return { status: 'failure' };
			}
			
			aeskey = aeskey.split( '?' );
			
			var plaintext = this.decryptAES( cipherblock[1], aeskey[0], aeskey[1] );
			
			if ( plaintext )
			{
				plaintext = plaintext.split( '::52cee64bb3a38f6403386519a39ac91c::' );
				
				var text = plaintext[0];
				var cipher = plaintext[2];
				
				if ( plaintext.length == 3 )
				{
					var publickey = this.setPublicKeyRSA( plaintext[1] );
					
					if ( this.verifyString( text, cipher, publickey ) )
					{
						return { status: 'success', plaintext: text, signature: 'verified', publicKeyString: this.getPublicKey( publickey ) };
					}
					else
					{
						return { status: 'success', plaintext: text, signature: 'forged', publicKeyString: this.getPublicKey( publickey ) };
					}
				}
				else
				{
					return { status: 'success', plaintext: text, signature: 'unsigned' };
				}
			}
		}
		
		return false;
	},
	
	signString: function ( plaintext, signingKey )
	{
		if ( !plaintext ) return false;
		
		if ( signingKey && typeof signingKey === 'string' )
		{
			signingKey = this.setPrivateKeyRSA( signingKey );
		}
		
		if ( !signingKey )
		{
			signingKey = ( this.privKeyObject ? this.privKeyObject : this.keysObject );
		}
		
		if ( signingKey )
		{
			var signed = signingKey.signString( plaintext, 'sha1' );
			
			if ( signed )
			{
				return this.b16to64( signed );
			}
		}
		
		return false;
	},
	
	verifyString: function ( plaintext, ciphertext, publicKey )
	{
		if ( !plaintext || !ciphertext ) return false;
		
		if ( publicKey && typeof publicKey === 'string' )
		{
			publicKey = this.setPublicKeyRSA( publicKey );
		}
		
		if ( !publicKey )
		{
			publicKey = ( this.pubKeyObject ? this.pubKeyObject : this.keysObject );
		}
		
		if ( publicKey )
		{
			var signature = this.b64to16( ciphertext );
			
			if ( publicKey.verifyString( plaintext, signature ) )
			{
				return true;
			}
			
			return false;
		}
		
		return false;
	},
	
	signCertificate: function ( data, publicKey, signingKey )
	{
		if ( !data ) return false;
		
		if ( signingKey && typeof signingKey === 'string' )
		{
			signingKey = this.setPrivateKeyRSA( signingKey );
		}
		
		if ( !signingKey )
		{
			signingKey = ( this.privKeyObject ? this.privKeyObject : this.keysObject );
		}
		
		var certificate = this.encryptString( data, publicKey, signingKey );
		
		if ( certificate && certificate.cipher )
		{
			var signCert;
			signCert  = "-----BEGIN CERTIFICATE-----\n";
			signCert += certificate.cipher + "\n";
			signCert += "-----END CERTIFICATE-----";
			
			return { certificate: signCert, signature: this.publicKeyID( publicKey ) };
		}
		
		return false;
	},
	
	verifyCertificate: function ( ciphertext, privKeyObject, signature )
	{
		if ( !ciphertext ) return false;
		
		var decrypted = this.decryptString( ciphertext, privKeyObject );
		
		var isValid = ( decrypted.signature && decrypted.signature == 'verified' ? true : false );
		
		if ( signature )
		{
			var publicKeyID = this.publicKeyID( decrypted.publicKeyString );
			
			if ( isValid && signature == publicKeyID )
			{
				return true;
			}
		}
		else if ( isValid )
		{
			return true;
		}
		
		return false;
	},
};
