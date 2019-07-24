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

var library = window.library || {};
var hello = window.hello || {};
library.component = library.component || {};

(function( ns, undefined ) {
	ns.FCrypto = function( conf ) {
		if ( !( this instanceof ns.FCrypto ))
			return new ns.FCrypto( callback );
		
		var self = this;
		self.conf = conf;
		self.keyObj = null;
		self.keys = {};
		
		var initSuccess = self.init();
		if ( !initSuccess )
			return false;
	}
	
	ns.FCrypto.prototype.init = function() {
		var self = this;
		if ( !window.fcrypt )
			throw new Error( 'window.fcrypt is not defined' );
		
		if ( !self.conf.seed && !self.conf.privateKey ) {
			console.log( 'Fcrypto.init - conf', self.conf );
			throw new Error( 'FCrypt.init - required data not found' );
		}
		
		if ( self.conf.privateKey )
			setPrivateKey();
		else
			generateKeyPair();
		
		self.conf = null;
		return setKeys();
		
		function setPrivateKey() {
			var privKey = self.conf.privateKey;
			var parts = privKey.split( '-----' );
			var body = parts[ 2 ];
			var cleanBody = self.stripWhitespace( body );
			parts[ 2 ] = cleanBody;
			cleanKey = parts.join( '-----' );
			self.keyObj = window.fcrypt.setPrivateKeyRSA( cleanKey );
		}
		
		function generateKeyPair() {
			var seed = self.conf.seed;
			self.keyObj = window.fcrypt.generateKeys( seed, 1024 );
		}
		
		function setKeys() {
			var privKey = self.keyObj.getPrivateKey();
			var pubKey = self.keyObj.getPublicKey();
			self.keys = {
				priv : privKey,
				pub : pubKey,
			};
			return true;
		}
	}
	
	ns.FCrypto.prototype.getKeys = function() {
		var self = this;
		
		return self.keys;
	}
	
	ns.FCrypto.prototype.getPublicKey = function() {
		var self = this;
		return self.keyObj.getPublicKey();
	}
	
	ns.FCrypto.prototype.sign = function( str ) {
		var self = this;
		var signed = window.fcrypt.signString( str, self.keyObj );
		return signed;
	}
	
	ns.FCrypto.prototype.enRSA = function( str ) {
		var self = this;
		var encryptedStr = window.fcrypt.encryptRSA( str, self.keyObj );
		return encryptedStr;
	}
	
	ns.FCrypto.prototype.deRSA = function( str ) {
		var self = this;
		var decryptedStr = window.fcrypt.decryptRSA( str, self.keyObj );
		return decryptedStr;
	}
	
	ns.FCrypto.prototype.en = function( str ) {
		var self = this;
		var pubKey = self.keyObj.getPublicKey();
		var encrypted = window.fcrypt.encryptString( str, pubKey );
		encrypted = self.translateSuccess( encrypted );
		
		return encrypted;
	}
	
	ns.FCrypto.prototype.de = function( str ) {
		var self = this;
		str = self.stripWhitespace( str );
		var decrypted = window.fcrypt.decryptString( str, self.keyObj );
		decrypted.cipherText = str;
		decrypted = self.translateSuccess( decrypted );
		
		return decrypted;
	}
	
	ns.FCrypto.prototype.close = function() {
		var self = this;
		self.conf = null;
		self.keyObj = null;
		self.keys = null;
	}
	
	ns.FCrypto.prototype.translateSuccess = function( res ) {
		var self = this;
		if ( res.status && res.status.length )
			res.success = 'success' === res.status ? true : false;
		
		return res;
	}
	
	ns.FCrypto.prototype.stripWhitespace = function( str ) {
		var self = this;
		if ( !str || str.length )
			return str;
		
		str = str.split( /\s/ ).join( '' );
		return str;
	}
	
})( library.component );
