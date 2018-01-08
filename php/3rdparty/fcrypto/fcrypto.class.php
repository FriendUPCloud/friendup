<?php

/*******************************************************************************
*                                                                              *
* Friend Crypto (fcrypt) v0.5                                                  *
*                                                                              *
* @dependency                                                                  *
*                                                                              *
* 	hash_pbkdf2.php                                                            *
* 	Crypt/RSA.php                                                              *
*   Crypt/TripleDES.php                                                        *
*   BigInteger.php                                                             *
*                                                                              *
* @example                                                                     *
*                                                                              *
* 	// generate an object of private and public keys                           *
* 	$fcrypt = new fcrypto();                                                   *
* 	$keys = $fcrypt->generateKeys();                                           *
*                                                                              *
*   // get private and public key as string                                    *
*   $privateKey = $fcrypt->getPrivateKey();                                    *
*   $publicKey  = $fcrypt->getPublicKey();                                     *
*																			   *
*	// get an array with privatekey and publickey                              *
*   $keys = $fcrypt->getKeys();                                 			   *
*                                                                              *
*   // encrypt message with receivers public key                               *
*   $encrypted  = $fcrypt->encryptString( $msg, $publicKey );                  *
*   $ciphertext = $encrypted->cipher;                                          *
*                                                                              *
*   // decrypt cipertext with receivers privateKey                             *
*   $decrypted = $fcrypt->decryptString( $ciphertext, $privateKey );           *
*   $plaintext = $decrypted->plaintext;                                        *
*                                                                              *
*   // create certificate and encrypt the data with owner keys                 *
*   $signed      = $fcrypt->signCertificate( $msg, $publicKey, $privateKey );  *
*   $certificate = $signed->certificate;                                       *
*   $signid   	 = $signed->signature;                                         *
*                                                                              *
*   // verify certificate with owners private key                              *
*   $valid = $fcrypt->verifyCertificate( $certificate, $privateKey, $signid ); *
*                                                                              *
*   // sign a message with senders private key                                 *
*   $signature = $fcrypt->signString( $msg, $privateKey );                     *
*                                                                              *
*   // verify a message with senders signature and senders public key          *
*   $valid = $fcrypt->verifyString( $msg, $signature, $publicKey );            *
*                                                                              *
*   // generate a random/passphrased pbkdf2 or hash key                        *
*   $fcrypt->generateKey( password, bitLength, keySize, keyType );             *
*																			   *
*   // get the sha256 key that seeded the key generate                         *
*   $key = $fcrypt->getKey();                                                  *
*                                                                              *
*   // set a sha256 key as seed to generate lost private and public keys       *
*   $fcrypt->setKey( $key );                                                   *  
*                                                                              *
*******************************************************************************/

require ( dirname(__FILE__) . '/deps/php/hash_pbkdf2.php' );
require ( dirname(__FILE__) . '/deps/php/phpseclib/Crypt/RSA.php' );
require ( dirname(__FILE__) . '/deps/php/phpseclib/Crypt/TripleDES.php' );
require ( dirname(__FILE__) . '/deps/php/phpseclib/Math/BigInteger.php' );

class fcrypto extends Crypt_RSA
{
	// Public variables: _______________________________________________________
	
	var $rsaKeySize = 1024;
	var $rsaKeyType = '03'; //65537 default openssl public exponent for rsa key type
	var $aesKeySize = 256;
	var $aesKeyType = 'pbkdf2';
	var $aesBlockSize = 256;
	var $aesBitLength = 32;
	var $key = false;
	var $keys = false;
	var $debug = false;
	
	// Public helper functions: __________________________________________________
	
	public static function stripHeader ( $str )
	{
		if( !$str ) return false;
        $str = explode( "\r\n", $str );
		$str = implode( "", $str );
		$str = explode( "\n", $str );
		$str = implode( "", $str );
		$str = str_replace( "-----BEGIN RSA PRIVATE KEY-----\n", '', $str );
		$str = str_replace( "-----BEGIN RSA PRIVATE KEY-----", '', $str );
        $str = str_replace( "-----BEGIN PRIVATE KEY-----\n", '', $str );
		$str = str_replace( "-----BEGIN PRIVATE KEY-----", '', $str );
		$str = str_replace( "-----END RSA PRIVATE KEY-----", '', $str );
        $str = str_replace( "-----END PRIVATE KEY-----", '', $str );
        $str = str_replace( "-----BEGIN RSA PUBLIC KEY-----\n", '', $str );
		$str = str_replace( "-----BEGIN RSA PUBLIC KEY-----", '', $str );
		$str = str_replace( "-----BEGIN PUBLIC KEY-----\n", '', $str );
		$str = str_replace( "-----BEGIN PUBLIC KEY-----", '', $str );
        $str = str_replace( "-----END RSA PUBLIC KEY-----", '', $str );
		$str = str_replace( "-----END PUBLIC KEY-----", '', $str );
		$str = str_replace( "-----BEGIN CERTIFICATE-----\n", '', $str );
		$str = str_replace( "-----BEGIN CERTIFICATE-----", '', $str );
		$str = str_replace( "-----END CERTIFICATE-----", '', $str );
		$str = str_replace( "\r\n", '', $str );
		$str = str_replace( "\n", '', $str );
		return $str;
	}
	
	function stripSecondHeader ( $str )
	{
		if( strstr( $str, 'Proc-Type:' ) )
		{
			$str = explode( "\r\n\r\n", $str );
			$str[0] = reset( explode( "\r\n", $str[0] ) );
			$str = implode( "\r\n", $str );
		}
		return $str;
	}
	
	function encodeKeyHeader ( $key )
	{
		if( $key )
		{
			$encoded = ( strstr( $key, '-----BEGIN' ) ? base64_encode( $key ) : $key );
			
			if( !strstr( $encoded, '-----BEGIN' ) )
			{
				return $encoded;
			}
			
			return $key;
		}
		
		return false;
	}
	
	function decodeKeyHeader ( $key )
	{
		if( $key )
		{
			$decoded = ( !strstr( $key, '-----BEGIN' ) ? base64_decode( $key ) : $key );
			
			if( strstr( $decoded, '-----BEGIN' ) )
			{
				return $decoded;
			}
			
			return $key;
		}
		
		return false;
	}
	
	// TODO: Make this more precise, right now it removes the last number in a string sometimes
	function trimWhitespaceTrail ( $str )
	{
		return $str;
		$l = strlen( $str ) - 1;
		$m = 0;
		for( $a = $l; $a > 0; $a-- )
		{
			if( $m == 0 )
			{
				$ch = ord( $str{$a} );
				if( $ch == 0 || $ch == 11 ) continue;
				else $m = 1;
			}
			if( $m == 1 ) break;
		}
		return substr( $str, 0, $a );
	}
	
	// Public functions: _______________________________________________________
	
	function __construct ( $KeySize = false )
	{
		parent::__construct();
		
		if ( $KeySize )
		{
			$this->rsaKeySize = $KeySize;
		}
	}
	
	function generateKeys ( $passPhrase = false, $keySize = false, $keyType = false )
	{
		$keyType = ( $keyType ? $keyType : $this->rsaKeyType );
		$keySize = ( $keySize ? $keySize : $this->rsaKeySize );
		
		$key = ( $this->key ? $this->key : $this->generateKey( $passPhrase, 32, 256, 'sha256' ) );
		
		if ( $key )
		{
			// TODO: Find a way to create same private and public key based on password
			
			//$this->setPassword( $key );
			
			//$this->setPrivateKeyFormat( CRYPT_RSA_PRIVATE_FORMAT_PKCS1 );
			//$this->setPublicKeyFormat( CRYPT_RSA_PUBLIC_FORMAT_PKCS1 );
			
			//define( 'CRYPT_RSA_EXPONENT', 65537 );
			//define( 'CRYPT_RSA_SMALLEST_PRIME', 64 ); // makes it so multi-prime RSA is used
			
			$keys = $this->createKey( $keySize );
			
			if ( $keys )
			{
				//$keys['privatekey'] = $this->stripSecondHeader( $keys['privatekey'] );
				//$keys['publickey'] = $this->stripSecondHeader( $keys['publickey'] );
				
				$this->key = $key;
				$this->keys = $keys;
				return $keys;
			}
		}
		
		return false;
	}
	
	function getPrivateKey ( $type = false )
	{
		if ( isset( $this->keys['privatekey'] ) )
		{
			return $this->keys['privatekey'];
		}
		
		return false;
	}
	
	function getPublicKey ( $type = false )
	{
		if ( isset( $this->keys['publickey'] ) )
		{
			return $this->keys['publickey'];
		}
		
		return false;
	}
	
	function getKeys (  )
	{
		if ( isset( $this->keys ) )
		{
			return $this->keys;
		}
		
		return false;
	}
	
	function getKey (  )
	{
		if( $this->key )
		{
			return $this->key;
		}
		
		return false;
	}
	
	function setKey ( $key )
	{
		if( $key )
		{
			$this->key = $key;
			
			return $this->key;
		}
		
		return false;
	}
	
	function setPrivateKeyRSA ( $str )
	{
		if ( $str )
		{
			$str = $this->decodeKeyHeader( $str );
			
			$this->loadKey( $str );
			
			return true;
		}
		
		return false;
	}
	
	function setPublicKeyRSA ( $str )
	{
		if ( $str )
		{
			$str = $this->decodeKeyHeader( $str );
			
			$this->loadKey( $str );
			
			return true;
		}
		
		return false;
	}
	
	function publicKeyID ( $str )
	{
		if ( !$str )
		{
			$str = $this->getPublicKey();
		}
		
		if ( $str )
		{
			$str = $this->decodeKeyHeader( $str );
			
			return md5( $str );
		}
		
		return false;
	}
	
	function generateKey ( $passPhrase = false, $bitLength = false, $keySize = false, $keyType = false )
	{
		$bitLength = ( $bitLength ? $bitLength : $this->aesBitLength );
		$keySize = ( $keySize ? $keySize : $this->aesKeySize );
		$keyType = ( $keyType ? $keyType : $this->aesKeyType );
		
		if ( !$passPhrase )
		{
			$passPhrase = crypt_random_string(32);
		}
		
		if ( $keyType == 'sha256' )
		{
			$key = hash( 'sha256', $passPhrase );
			
			if( $key )
			{
				return $key;
			}
		}
		else
		{
			$obj = new stdClass();
			
			if( function_exists( 'openssl_pbkdf2' ) )
			{
				$salt = openssl_random_pseudo_bytes(16);
				
				$obj->key = openssl_pbkdf2( $passPhrase, $salt, 32, 500, 'sha256' );
				$obj->iv  = $salt;
			}
			else
			{
				$cipher = MCRYPT_RIJNDAEL_128;
				$mode = MCRYPT_MODE_CBC;
				
				$iv_size = mcrypt_get_iv_size( $cipher, $mode );
				$salt = mcrypt_create_iv( $iv_size, MCRYPT_RAND );
				
				$obj->key = hash_pbkdf2( 'sha256', $passPhrase, $salt, 500, 32, true );
				$obj->iv  = $salt;
			}
			
			$obj->key = base64_encode( $obj->key );
			$obj->iv = base64_encode( $obj->iv );
			
			if ( $obj->key && $obj->iv )
			{
				return $obj;
			}
		}
		
		return false;
	}
	
	function encryptRSA ( $plaintext, $key )
	{
		if ( !$plaintext ) return false;
		
		if ( $key )
		{
			$key = $this->decodeKeyHeader( $key );
			
			$this->loadKey( $key );
		}
		
		if ( $key || $this->keys )
		{
			$this->setEncryptionMode( CRYPT_RSA_ENCRYPTION_PKCS1 );
			$encrypted = $this->encrypt( $plaintext );
			
			if ( $encrypted )
			{
				$data_base64 = base64_encode( $encrypted );
				return $data_base64;
			}
		}
		
		return false;
	}
	
	function decryptRSA ( $encryptedText, $key )
	{
		if ( !$encryptedText ) return false;
		
		if ( $key )
		{
			$key = $this->decodeKeyHeader( $key );
			
			$this->loadKey( $key );
		}
		
		if ( $key || $this->keys )
		{
			$this->setEncryptionMode( CRYPT_RSA_ENCRYPTION_PKCS1 );
			$encryptedText = base64_decode( $encryptedText );
			
			$decrypted = $this->decrypt( $encryptedText );
			
			if ( $decrypted )
			{
				return $decrypted;
			}
		}
		
		return false;
	}
	
	function encryptAES ( $plaintext, $key, $iv )
	{
		if( !$plaintext || !$key || !$iv ) return false;
		
		$iv_binary = base64_decode( $iv );
		$key_binary = base64_decode( $key );
		
		if( function_exists( 'openssl_encrypt' ) )
		{
			$encrypted = openssl_encrypt( $plaintext, 'AES-256-CBC', $key_binary, OPENSSL_RAW_DATA, $iv_binary );
		}
		else
		{
			$cipher = MCRYPT_RIJNDAEL_128;
			$mode = MCRYPT_MODE_CBC;
			
			$encrypted = mcrypt_encrypt( $cipher, $key_binary, $plaintext, $mode, $iv_binary );
		}
		
		if ( $encrypted )
		{
			$obj = new stdClass();
			
			$obj->cipher = base64_encode( $encrypted );
			$obj->iv = base64_encode( $iv_binary );
			$obj->key = base64_encode( $key_binary );
			
			if ( $this->debug )
			{
				$debug  = 'key: ' . $key_binary . "\r\n";
				$debug .= 'iv: ' . $iv_binary . "\r\n";
				$debug .= 'data(b64): ' . base64_encode( $encrypted ) . "\r\n";
				$debug .= 'iv(b64): ' . base64_encode( $iv_binary ) . "\r\n";
				$debug .= 'key(b64): ' . base64_encode( $key_binary ) . "\r\n";
				
				die( $debug );
			}
			
			return $obj;
		}
		
		return false;
	}
	
	function decryptAES ( $encryptedText, $key, $iv )
	{
		if( !$encryptedText || !$key || !$iv ) return false;
		
		$data_binary = base64_decode( $encryptedText );
		$iv_binary = base64_decode( $iv );
		$key_binary = base64_decode( $key );
		
		if( function_exists( 'openssl_decrypt' ) )
		{
			$decrypted = rtrim( openssl_decrypt( $data_binary, 'AES-256-CBC', $key_binary, OPENSSL_RAW_DATA, $iv_binary ), "\t\0 " );
		}
		else
		{
			$cipher = MCRYPT_RIJNDAEL_128;
			$mode = MCRYPT_MODE_CBC;
			
			$decrypted = rtrim( mcrypt_decrypt( $cipher, $key_binary, $data_binary, $mode, $iv_binary ), "\t\0 " );
		}
		
		if ( $this->debug )
		{
			$debug  = 'cipher(b64): ' . $encryptedText . "\r\n";
			$debug .= 'key: ' . bin2hex( $key_binary ) . "\r\n";
			$debug .= 'iv: ' . bin2hex( $iv_binary ) . "\r\n";
			$debug .= 'decrypted text: ' . $decrypted . "\r\n";
			
			die( $debug );
		}
		
		if( $decrypted )
		{
			if( $trim = $this->trimWhitespaceTrail( $decrypted ) )
			{
				$decrypted = $trim;
			}
			return $decrypted;
		}
		
		return false;
	}
	
	function encryptString ( $plaintext, $publicKey, $signingKey = false )
	{
		if ( !$plaintext ) return false;
		
		$publicKey  = $this->decodeKeyHeader( $publicKey );
		$signingKey = $this->decodeKeyHeader( $signingKey );
		
		$obj = new stdClass();
		
		if ( $signingKey )
        {
            $pubkey = $this->getPublicKey( $signingKey );
            $pubkey = $this->stripHeader( $pubkey );
            $signString = $this->signString( $plaintext, $signingKey );
			$plaintext .= '::52cee64bb3a38f6403386519a39ac91c::';
            $plaintext .= $pubkey;
            $plaintext .= '::52cee64bb3a38f6403386519a39ac91c::';
            $plaintext .= $signString;
        }
		
        $aeskey = $this->generateKey();
		
		if ( $aeskey && is_object( $aeskey ) )
		{
			$AESdata = $this->encryptAES( $plaintext, $aeskey->key, $aeskey->iv );
			
			if ( $AESdata )
			{
				$pubkey = ( $publicKey ? $publicKey : $this->getPublicKey() );
				
				if ( $pubkey )
				{
					$RSAdata = $this->encryptRSA( ( $AESdata->key . '?' . $AESdata->iv ), $pubkey ) . '?';
				}
				
				if ( !$RSAdata )
				{
					$obj->status = 'Invalid public key';
					
					return $obj;
				}
				
				$cipherblock = '';
				$cipherblock .= $RSAdata;
				$cipherblock .= $AESdata->cipher;
				
				if ( $cipherblock )
				{
					$obj->status = 'success';
					$obj->cipher = chunk_split( $cipherblock, 64 );
					
					return $obj;
				}
			}
		}
		
		return false;
	}
	
	function decryptString ( $ciphertext, $privateKey )
	{
		if ( !$ciphertext ) return false;
		
		$privateKey = $this->decodeKeyHeader( $privateKey );
		
		$obj = new stdClass();
		
		if ( !$privateKey )
		{
			$privateKey = $this->getPrivateKey();
		}
		
		if ( $ciphertext && $privateKey )
		{
			$ciphertext = $this->stripHeader( $ciphertext );
			$cipherblock = explode( '?', $ciphertext );
			
			$aeskey = $this->decryptRSA( $cipherblock[0], $privateKey );
			
			if ( !$aeskey )
			{
				$obj->status = 'failure';
				
				return $obj;
			}
			
			if( !isset( $cipherblock[1] ) && $aeskey )
			{
				$obj->status = 'success';
				$obj->plaintext = $aeskey;
				$obj->signature = 'unsigned';
				
				return $obj;
			}
			
			$aeskey = explode( '?', $aeskey );
			
			$plaintext = $this->decryptAES( $cipherblock[1], $aeskey[0], $aeskey[1] );
			
			if ( $plaintext )
			{
				$plaintext = explode( '::52cee64bb3a38f6403386519a39ac91c::', $plaintext );
				
				$text = $plaintext[0];
				
				if ( count( $plaintext ) == 3 )
				{
					$publickey = $plaintext[1];
					$cipher = $plaintext[2];
					
					if ( $this->verifyString( $text, $cipher, $publickey ) )
					{
						$obj->status = 'success';
						$obj->plaintext = $text;
						$obj->signature = 'verified';
						$obj->publicKeyString = $publickey;
						
						return $obj;
					}
					else
					{
						$obj->status = 'success';
						$obj->plaintext = $text;
						$obj->signature = 'forged';
						$obj->publicKeyString = $publickey;
						
						return $obj;
					}
				}
				else
				{
					$obj->status = 'success';
					$obj->plaintext = $text;
					$obj->signature = 'unsigned';
					
					return $obj;
				}
			}
		}
		
		return false;
	}
	
	function signString ( $plaintext, $key )
	{
		if ( !$plaintext ) return false;
		
		if ( $key )
		{
			$key = $this->decodeKeyHeader( $key );
			
			$this->loadKey( $key );
		}
		
		if ( $key || $this->keys )
		{
			$this->setSignatureMode( CRYPT_RSA_SIGNATURE_PKCS1 );
			$signature = $this->sign( $plaintext );
			
			if ( $signature )
			{
				$signature_base64 = base64_encode( $signature );
				return $signature_base64;
			}
		}
		
		return false;
	}
	
	function verifyString ( $plaintext, $ciphertext, $key )
	{
		if ( !$plaintext || !$ciphertext ) return false;
		
		if ( $key )
		{
			$key = $this->decodeKeyHeader( $key );
			
			$this->loadKey( $key );
		}
		
		if ( $key || $this->keys )
		{
			$this->setSignatureMode( CRYPT_RSA_SIGNATURE_PKCS1 );
			$ciphertext = base64_decode( $ciphertext );
			
			if ( $this->verify( $plaintext, $ciphertext ) )
			{
				return true;
			}
		}
		
		return false;
	}
	
	function signCertificate ( $data, $publicKey, $signingKey )
	{
		if ( !$data ) return false;
		
		$certificate = $this->encryptString( $data, $publicKey, $signingKey );
		
		if ( $certificate && $certificate->cipher )
		{
			$signCert  = "-----BEGIN CERTIFICATE-----\n";
			$signCert .= $certificate->cipher;
			$signCert .= "-----END CERTIFICATE-----";
			
			$obj = new stdClass();
			$obj->certificate = $signCert;
			$obj->signature = $this->publicKeyID( $publicKey );
			
			return $obj;
		}
		
		return false;
	}
	
	function verifyCertificate ( $ciphertext, $privateKey, $signature = false )
	{
		if ( !$ciphertext ) return false;
		
		$decrypted = $this->decryptString( $ciphertext, $privateKey );
		
		$isValid = ( $decrypted->signature && $decrypted->signature == 'verified' ? true : false );
		
		if ( $signature )
		{
			$publicKeyID = $this->publicKeyID( $decrypted->publicKeyString );
			
			if ( $isValid && $signature == $publicKeyID )
			{
				return true;
			}
		}
		else if ( $isValid )
		{
			return true;
		}
		
		return false;
	}
}

?>
