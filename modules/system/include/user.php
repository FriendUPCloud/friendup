<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

require_once( 'php/include/permissions.php' );

$prevlevel = $level;

/*if( $perm = Permissions( 'write', 'application', false, [ 
	'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
	'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
	'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
	'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
] ) )
{
	if( is_object( $perm ) )
	{
		// Permission denied.
		
		if( $perm->response == -1 )
		{
			//
			
			die( 'fail<!--separate-->' . json_encode( $perm ) );
		}
		
		// Permission granted.
		
		if( $perm->response == 1 )
		{*/
			
			$level = 'Admin';
			
		/*}
	}
}*/

die( 'TODO: finish the module code to create / update user ' . print_r( $args,1 ) . ' -- ' );



if( $level == 'Admin' )
{
	
	$data = []; $extr = [];
	
	if( isset( $args->sessionid ) )
	{
		$data['sessionid'] = trim( $args->sessionid );
	}
	if( isset( $args->servertoken ) )
	{
		$data['servertoken'] = trim( $args->servertoken );
	}
	if( isset( $args->args->id ) )
	{
		$data['id'] = trim( $args->args->id );
	}
	if( isset( $args->args->fullname ) )
	{
		$data['fullname'] = trim( $args->args->fullname );
	}
	if( isset( $args->args->password ) )
	{
		$data['password'] = trim( $args->args->password );
	}
	if( isset( $args->args->email ) )
	{
		$data['email'] = trim( $args->args->email );
	}
	if( isset( $args->args->mobile ) )
	{
		$extr['mobile'] = trim( $args->args->mobile );
	}
	if( isset( $args->args->language ) )
	{
		$extr['language'] = trim( $args->args->language );
	}
	if( isset( $args->args->avatar ) )
	{
		$extr['avatar'] = trim( $args->args->avatar );
	}
	if( isset( $args->args->workgroups ) )
	{
		$extr['workgroups'] = trim( $args->args->workgroups );
	}
	if( isset( $args->args->setup ) )
	{
		$extr['setup'] = trim( $args->args->setup );
	}
	
	
	
	if( $args->command )
	{
	
		switch( $args->command )
		{
	
			case 'user/create'
		
				// Create user ... 
			
				$res = fc_query( '/system.library/user/create', $data );
				
				die( $res . ' -- ' );
				
				break;
	
			case 'user/update':
		
				// Update user ... 

				if( isset( $args->args->id ) && $args->args->id )
				{
				
					$res = fc_query( '/system.library/user/update', $data );
				
					die( $res . ' -- ' );
				
				}
				
				break;
				
			case 'user/remove':
				
				// Delete user ...
				
				break;
				
		}
		
		
		
		// First login
		
		/*function firstLogin( userid, callback )
		{
			if( userid > 0 )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					//console.log( 'firstLogin( '+userid+', callback ) ', { e:e, d:d, args: { userid: userid, authid: Application.authId } } );
			
					if( e == 'ok' )
					{
						if( d && d.indexOf( '<!--separate-->' ) >= 0 )
						{
							var data = d.split( '<!--separate-->' );
					
							if( data[1] )
							{
								try
								{
									data[1] = JSON.parse( data[1] );
							
									//console.log( data );
								}
								catch( e ) {  }
							}
						}
				
						if( callback ) return callback( true );	
					}
			
					if( callback ) return callback( false );
				}
				m.execute( 'firstlogin', { userid: userid, force: true, exclude: [ 'mountlist', 'dock', 'mount' ], authid: Application.authId } );
			}
		}*/
		
		// Save avatar image
			
		/*function saveAvatar( callback )
		{
			var canvas = ge( 'AdminAvatar' );
			if( canvas )
			{
				var base64 = 0;
				
				try
				{
					base64 = canvas.toDataURL();
				}
				catch( e ) {  }
				
				if( base64 && base64.length > 3000 )
				{
					var ma = new Module( 'system' );
					ma.forceHTTP = true;
					ma.onExecuted = function( e, d )
					{
						if( e != 'ok' )
						{
							if( ShowLog ) console.log( 'Avatar saving failed.' );
					
							if( callback ) callback( false );
						}
				
						if( callback ) callback( true );
					};
					ma.execute( 'setsetting', { userid: uid, setting: 'avatar', data: base64, authid: Application.authId } );
				}
				else
				{
					if( callback ) callback( false );
				}
			}
		}*/
		
		// Apply template
		
		/*function applySetup( init, callback )
		{
			if( init )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					//console.log( 'applySetup() ', { e:e, d:d, args: { id: ( ge( 'usSetup' ).value ? ge( 'usSetup' ).value : '0' ), userid: uid, authid: Application.authId } } );
				
					if( callback ) return callback( true );
				
				}
				m.execute( 'usersetupapply', { id: ( ge( 'usSetup' ).value ? ge( 'usSetup' ).value : '0' ), userid: uid, authid: Application.authId } );
			}
			else
			{
				if( callback ) return callback( false );
			}
		}*/
		
		// Save language setting
			
		/*function updateLanguages( ignore, callback )
		{
			if( !ignore )
			{
				// Find right language for speech
				var langs = speechSynthesis.getVoices();
			
				var voice = false;
				for( var v = 0; v < langs.length; v++ )
				{
					//console.log( langs[v].lang.substr( 0, 2 ) );
					if( langs[v].lang.substr( 0, 2 ) == ge( 'usLanguage' ).value )
					{
						voice = {
							spokenLanguage: langs[v].lang,
							spokenAlternate: langs[v].lang // TODO: Pick an alternative voice - call it spokenVoice
						};
					}
				}
			
				var mt = new Module( 'system' );
				mt.onExecuted = function( ee, dd )
				{	
					var mo = new Module( 'system' );
					mo.onExecuted = function()
					{
						if( callback ) return callback( true );
					}
					mo.execute( 'setsetting', { userid: uid, setting: 'locale', data: ge( 'usLanguage' ).value, authid: Application.authId } );
				}
				mt.execute( 'setsetting', { userid: uid, setting: 'language', data: voice, authid: Application.authId } );
			}
			else
			{
				if( callback ) return callback( false );
			}
		}*/
		
		
		
		
		
		
		
	}

}

// Helper functions ...
function fc_query( $command = '', $args = false, $method = 'POST', $headers = false )
{
	global $Config, $Logger;	
	
	$LogThis = false;
	
	$curl = curl_init();
	
	$server = ( $Config->SSLEnable ? 'https://' : 'http://' ) . $Config->FCHost . ( $Config->FCHost == 'localhost' && $Config->FCPort ? ':' . $Config->FCPort : '' );
	
	$url = ( $server . $command );
	
	if( $url && strstr( $url, '?' ) )
	{
		$thispath = $url;
		$url = explode( '?', $url );
	
		if( isset( $url[1] ) )
		{
			if( strstr( $url[1], '&' ) && strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '&', $url[1] );
			
				foreach( $url[1] as $k=>$p )
				{
					if( strstr( $url[1][$k], '=' ) )
					{
						$url[1][$k] = explode( '=', $url[1][$k] );
					
						if( isset( $url[1][$k][1] ) )
						{
							$url[1][$k][1] = urlencode( $url[1][$k][1] );
						}
					
						$url[1][$k] = implode( '=', $url[1][$k] );
					}
				}
			
				$url[1] = implode( '&', $url[1] );
			}
			else if( strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '=', $url[1] );
			
				if( isset( $url[1][1] ) )
				{
					$url[1][1] = urlencode( $url[1][1] );
				}
			
				$url[1] = implode( '=', $url[1] );
			}
		}
	
		$url = implode( '?', $url );
	}

	curl_setopt( $curl, CURLOPT_URL, $url );
	curl_setopt( $curl, CURLOPT_EXPECT_100_TIMEOUT_MS, false );

	if( $headers )
	{
		curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
	}

	if( $method != 'POST' )
	{
		curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
	}
	
	// TODO: Turn this off when SSL is working ...
	curl_setopt( $curl, CURLOPT_SSL_VERIFYHOST, false );
	curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
	
	if( $args )
	{
		if( is_object( $args ) )
		{
			$args = array(
				'args' => urlencode( json_encode( $args ) )
			);
		}
		else if( is_string( $args ) )
		{
			$args = array(
				'args' => urlencode( $args )
			);
		}
	
		curl_setopt( $curl, CURLOPT_POST, true );
		curl_setopt( $curl, CURLOPT_POSTFIELDS, $args );
	}
	
	if( $LogThis ) $Logger->log( 'Curl Init: ' . $url . ' ', print_r( $args,1 ) );
	
	curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

	$output = curl_exec( $curl );

	$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
	
	if( $LogThis ) $Logger->log( 'Curl HttpCode: ', print_r( $httpCode,1 ) );
	
	curl_close( $curl );

	return $output;
}

die( 'fail ...' );

?>
