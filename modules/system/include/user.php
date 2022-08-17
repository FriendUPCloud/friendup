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

error_reporting( E_ALL & ~E_NOTICE );
ini_set( 'display_errors', 1 );

require_once( 'php/include/permissions.php' );

global $Config;

// For some reason $args->args are now urlencoded so they have to be run through urldecode();

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
	$data['id'] = /*urldecode( */trim( $args->args->id )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}
if( isset( $args->args->fullname ) )
{
	$data['fullname'] = /*urldecode( */trim( $args->args->fullname )/* )*/;
}
if( isset( $args->args->username ) )
{
	$data['username'] = /*urldecode( */trim( $args->args->username )/* )*/;
}
if( isset( $args->args->password ) )
{
	$data['password'] = /*urldecode( */trim( $args->args->password )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}
if( isset( $args->args->email ) )
{
	$data['email'] = /*urldecode( */trim( $args->args->email )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}

if( isset( $args->args->level ) )
{
	$data['level'] = /*urldecode( */trim( $args->args->level )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
	// TODO: Make it so only global / system admin can set level admin
}

if( isset( $args->args->mobile ) )
{
	$extr['mobile'] = /*urldecode( */trim( $args->args->mobile )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}
if( isset( $args->args->language ) )
{
	$extr['language'] = /*urldecode( */trim( $args->args->language )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}
if( isset( $args->args->avatar ) )
{
	$extr['avatar'] = /*urldecode( */trim( $args->args->avatar )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}
if( isset( $args->args->workgroups ) )
{
	$extr['workgroups'] = /*urldecode( */trim( $args->args->workgroups )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}
if( isset( $args->args->setup ) )
{
	// TODO: Look into why we need to add this to Friend Core ..
	
	$data['setup'] = /*urldecode( */trim( $args->args->setup )/* )*/;
	$extr['setup'] = /*urldecode( */trim( $args->args->setup )/* )*/;
	
	// TODO: Add check if it's correct format if not return back ...
}

// Check if FCUpload is defined before moving forward ...

if( !isset( $Config->FCUpload ) || !$Config->FCUpload || trim( $Config->FCUpload ) == getcwd() || trim( $Config->FCUpload ) == ( getcwd() . '/' ) )
{
	die( '{"result":"fail","data":{"response":"FCUpload in cfg/cfg.ini require a storage path, root level is not allowed ..."}}' );
}



if( $args->command )
{

	switch( $args->command )
	{

		case 'user/create':
			
			// 0: Create user ... 
			
			if( isset( $data['fullname'] ) && $data['fullname'] && isset( $data['username'] ) && $data['username'] && isset( $data['password'] ) && $data['password'] )
			{
				
				if( $perm = Permissions( 'write', 'application', "'System','Admin'", [ 
					'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
					'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
				] ) )
				{
					if( is_object( $perm ) )
					{
						// Permission denied.
						
						if( $perm->response == -1 )
						{
							//
							
							die( '{"result":"fail","data":' . json_encode( $perm ) . '}' );
						}
						
						// Permission granted.
						
					}
				}
				
				// Specific for Pawel's code ... He just wants to forward json ...
				
				$data['args'] = json_encode( json_decode( '{
					"type"    : "write", 
					"context" : "application", 
					"name"    : "\'System\',\'Admin\'",
					"data"    : { 
						"permission" : [ 
							"PERM_USER_CREATE_GLOBAL", 
							"PERM_USER_CREATE_IN_WORKGROUP", 
							"PERM_USER_GLOBAL", 
							"PERM_USER_WORKGROUP" 
						]
					} 
				}' ) );
				
				if( !isset( $data['level'] ) && !$data['level'] )
				{
					$data['level'] = 'User';
				}
				
				// TODO: Find out why it's needed?
				
				if( !isset( $data['setup'] ) )
				{
					$data['setup'] = '0';
				}
				
				// TODO: Should be a check if the user that is creating this new user has access to add users to defined workgroup(s) before saving ... 
				
				// TODO: It's required to add user with a workgroup if the user adding is not Admin and have rolepermissions ...
				
				if( $level == 'User' || ( isset( $extr['workgroups'] ) && $extr['workgroups'] ) )
				{
					if( !isset( $extr['workgroups'] ) || !$extr['workgroups'] )
					{
						die( '{"result":"fail","data":{"response":"Adding a User to a Workgroup is required.","code":"20"}' );
					}
				}
				
				$g = new dbIO( 'FUserGroup' );
				$g->Name = 'User';
				$g->Load();
				$g->Save();
				
				if( $g->ID > 0 )
				{
					
					if( $res = _fcquery( '/system.library/user/create', $data ) )
					{
						if( is_object( $res ) )
						{
							if( isset( $res->result ) && $res->result == 'ok' )
							{
								if( isset( $res->data->id ) && $res->data->id )
								{
									// TODO: Look into why you need to run user/update after user/create to create a user in Friend Core ...
									
									$data['id'] = $res->data->id;
									
									if( trim( $data['password'] ) )
									{
										
										if( !strstr( $data['password'], 'HASHED' ) )
										{
											$data['password'] = ( 'HASHED' . hash( 'sha256', $data['password'] ) );
										}
										
										if( !strstr( $data['password'], '{S6}' ) )
										{
											$data['password'] = ( '{S6}' . hash( 'sha256', $data['password'] ) );
										}
										
									}
									
									
									
									// 1: Add user to workgroup(s)
									
									if( isset( $extr['workgroups'] ) && $extr['workgroups'] )
									{
										if( $ret = _addToWorkgroups( $res->data->id, $extr['workgroups'], $data, '[ 
											"PERM_USER_CREATE_GLOBAL", 
											"PERM_USER_CREATE_IN_WORKGROUP", 
											"PERM_USER_GLOBAL", 
											"PERM_USER_WORKGROUP" 
										]' ) )
										{
											if( isset( $ret->result ) && $ret->result == 'fail' )
											{
												die( json_encode( $ret ) );
											}
											else
											{
												if( !isset( $res->debug ) )
												{
													$res->debug = [];
												}
								
												$res->debug['1: Add user to workgroup(s)'] = $ret;
											}
										}
									}
									
									
									
									if( $res2 = _fcquery( '/system.library/user/update', $data ) )
									{
										if( is_object( $res2 ) )
										{
											if( isset( $res2->result ) && $res2->result == 'ok' )
											{
												if( isset( $res2->data->update ) && $res2->data->update )
												{
													
													// 2: Add extra field
									
													if( isset( $extr['mobile'] ) && $extr['mobile'] )
													{
														if( $ret = _addExtraFields( $res->data->id, [ 'Mobile' => $extr['mobile'] ] ) )
														{
															if( isset( $ret->result ) && $ret->result == 'fail' )
															{
																die( json_encode( $ret ) );
															}
															else
															{
																if( !isset( $res->debug ) )
																{
																	$res->debug = [];
																}
																
																$res->debug['2: Add extra field'] = $ret;
															}
														}
													}
									
													// 3: First login
									
													if( $ret = _firstLogin( $res->data->id ) )
													{
														if( isset( $ret->result ) && $ret->result == 'fail' )
														{
															die( json_encode( $ret ) );
														}
														else
														{
															if( !isset( $res->debug ) )
															{
																$res->debug = [];
															}
											
															$res->debug['3: First login'] = $ret;
														}
													}
													
													// 4: Save avatar image
									
													if( isset( $extr['avatar'] ) && $extr['avatar'] )
													{
														if( $ret = _saveAvatar( $res->data->id, $extr['avatar'] ) )
														{
															if( isset( $ret->result ) && $ret->result == 'fail' )
															{
																die( json_encode( $ret ) );
															}
															else
															{
																if( !isset( $res->debug ) )
																{
																	$res->debug = [];
																}
												
																$res->debug['4: Save avatar image'] = $ret;
															}
														}
													}
									
													// 5: Apply template
									
													if( isset( $extr['setup'] ) )
													{
														if( $ret = _applySetup( $res->data->id, $extr['setup'] ) )
														{
															if( isset( $ret->result ) && $ret->result == 'fail' )
															{
																die( json_encode( $ret ) );
															}
															else
															{
																if( !isset( $res->debug ) )
																{
																	$res->debug = [];
																}
												
																$res->debug['5: Apply template'] = $ret;
															}
														}
													}
									
													// 6: Save language setting
									
													if( isset( $extr['language'] ) && $extr['language'] )
													{
														if( $ret = _updateLanguages( $res->data->id, $extr['language'] ) )
														{
															if( isset( $ret->result ) && $ret->result == 'fail' )
															{
																die( json_encode( $ret ) );
															}
															else
															{
																if( !isset( $res->debug ) )
																{
																	$res->debug = [];
																}
												
																$res->debug['6: Save language setting'] = $ret;
															}
														}
													}
													
													
													
												} 
											}
										}
									}
									
									
									
								}
							}
							
							die( json_encode( $res ) );
						}
					}
					
					die( $res );
				}
				
			}
			else
			{
				die( '{"result":"fail","data":{"response":"fullname, username and password is required ..."}}' );
			}
			
			break;

		case 'user/update':
			
			// 0: Update user ... 
			
			if( isset( $data['id'] ) && $data['id'] )
			{
				// Check if the user is in quarantine
				if( $quar = $SqlDatabase->fetchObject( 'SELECT q.* FROM UserQuarantine q, FUser u WHERE u.ID = q.UserID AND u.LoginTime=0 AND q.Verified=\'0\' AND q.UserID=\'' . intval( $data['id'], 10 ) . '\'' ) )
				{
					die( 'fail<!--separate-->{"message":"Can not update a quarantined user.","response":-1}' );
				}
				
				if( $perm = Permissions( 'write', 'application', "'System','Admin'", [ 
					'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
					'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
				], 'user', $data['id'] ) )
				{
					if( is_object( $perm ) )
					{
						// Permission denied.
						
						if( $perm->response == -1 )
						{
							//
							
							die( '{"result":"fail","data":' . json_encode( $perm ) . '}' );
						}
						
						// Permission granted.
						
					}
				}
				
				// TODO: Find out why it's needed?
				
				if( !isset( $data['setup'] ) )
				{
					$data['setup'] = '0';
				}
				
				if( trim( $data['password'] ) )
				{
					
					if( !strstr( $data['password'], 'HASHED' ) )
					{
						$data['password'] = ( 'HASHED' . hash( 'sha256', $data['password'] ) );
					}
					
					if( !strstr( $data['password'], '{S6}' ) )
					{
						$data['password'] = ( '{S6}' . hash( 'sha256', $data['password'] ) );
					}
					
				}
				
				// Specific for Pawel's code ... He just wants to forward json ...
				
				$data['args'] = json_encode( json_decode( '{
					"type"    : "write", 
					"context" : "application", 
					"name"    : "\'System\',\'Admin\'", 
					"data"    : { 
						"permission" : [ 
							"PERM_USER_UPDATE_GLOBAL", 
							"PERM_USER_UPDATE_IN_WORKGROUP", 
							"PERM_USER_GLOBAL", 
							"PERM_USER_WORKGROUP" 
						]
					}, 
					"object"   : "user", 
					"objectid" : ' . $data['id'] . ' 
				}' ) );
				
				if( $res = _fcquery( '/system.library/user/update', $data ) )
				{
					if( is_object( $res ) )
					{
						if( isset( $res->result ) && $res->result == 'ok' )
						{
							if( isset( $res->data->update ) && $res->data->update )
							{
								
								// 1: Add user to workgroup(s)
								
								if( isset( $extr['workgroups'] ) && $extr['workgroups'] )
								{
									if( $ret = _addToWorkgroups( $data['id'], $extr['workgroups'], $data, '[ 
										"PERM_USER_UPDATE_GLOBAL", 
										"PERM_USER_UPDATE_IN_WORKGROUP", 
										"PERM_USER_GLOBAL", 
										"PERM_USER_WORKGROUP" 
									]' ) )
									{
										if( isset( $ret->result ) && $ret->result == 'fail' )
										{
											die( json_encode( $ret ) );
										}
										else
										{
											if( !isset( $res->debug ) )
											{
												$res->debug = [];
											}
											
											$res->debug['1: Add user to workgroup(s)'] = $ret;
										}
									}
								}
								
								// 2: Add extra field
								
								if( isset( $extr['mobile'] ) && $extr['mobile'] )
								{
									if( $ret = _addExtraFields( $data['id'], [ 'Mobile' => $extr['mobile'] ] ) )
									{
										if( isset( $ret->result ) && $ret->result == 'fail' )
										{
											die( json_encode( $ret ) );
										}
										else
										{
											if( !isset( $res->debug ) )
											{
												$res->debug = [];
											}
											
											$res->debug['2: Add extra field'] = $ret;
										}
									}
								}
								
								// 3: Save avatar image
								
								if( isset( $extr['avatar'] ) && $extr['avatar'] )
								{
									if( $ret = _saveAvatar( $data['id'], $extr['avatar'] ) )
									{
										if( isset( $ret->result ) && $ret->result == 'fail' )
										{
											die( json_encode( $ret ) );
										}
										else
										{
											if( !isset( $res->debug ) )
											{
												$res->debug = [];
											}
											
											$res->debug['3: Save avatar image'] = $ret;
										}
									}
								}
								
								// 4: Apply template
								
								if( isset( $extr['setup'] ) )
								{
									if( $ret = _applySetup( $data['id'], $extr['setup'] ) )
									{
										if( isset( $ret->result ) && $ret->result == 'fail' )
										{
											die( json_encode( $ret ) );
										}
										else
										{
											if( !isset( $res->debug ) )
											{
												$res->debug = [];
											}
											
											$res->debug['4: Apply template'] = $ret;
										}
									}
								}
								
								// 5: Save language setting
								
								if( isset( $extr['language'] ) && $extr['language'] )
								{
									if( $ret = _updateLanguages( $data['id'], $extr['language'] ) )
									{
										if( isset( $ret->result ) && $ret->result == 'fail' )
										{
											die( json_encode( $ret ) );
										}
										else
										{
											if( !isset( $res->debug ) )
											{
												$res->debug = [];
											}
											
											$res->debug['5: Save language setting'] = $ret;
										}
									}
								}
								
							}
						}
						
						die( json_encode( $res ) );
					}
				
				}
				
				die( $res );
				
			}
			else
			{
				die( '{"result":"fail","data":{"response":"id is required ..."}}' );
			}
			
			break;
			
		case 'user/delete':
			
			// 0: Delete user ...
			
			if( isset( $data['id'] ) && $data['id'] )
			{
				
				if( $perm = Permissions( 'delete', 'application', "'System','Admin'", [ 
					'PERM_USER_DELETE_GLOBAL', 'PERM_USER_DELETE_IN_WORKGROUP', 
					'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
				], 'user', $data['id'] ) )
				{
					if( is_object( $perm ) )
					{
						// Permission denied.
						
						if( $perm->response == -1 )
						{
							//
							
							die( '{"result":"fail","data":' . json_encode( $perm ) . '}' );
						}
						
						// Permission granted.
						
					}
				}
				
				// Specific for Pawel's code ... He just wants to forward json ...
				
				$data['args'] = json_encode( json_decode( '{
					"type"    : "delete", 
					"context" : "application", 
					"name"    : "\'System\',\'Admin\'", 
					"data"    : { 
						"permission" : [ 
							"PERM_USER_DELETE_GLOBAL", 
							"PERM_USER_DELETE_IN_WORKGROUP", 
							"PERM_USER_GLOBAL", 
							"PERM_USER_WORKGROUP" 
						]
					}, 
					"object"   : "user", 
					"objectid" : ' . $data['id'] . ' 
				}' ) );
				
				if( $res = _fcquery( '/system.library/user/delete', $data ) )
				{
					if( is_object( $res ) )
					{
						if( isset( $res->result ) && $res->result == 'ok' )
						{
							if( isset( $res->data ) && $res->data )
							{
								// 1: Delete extra fields ...
								
								if( $ret = _deleteExtraFields( $data['id'] ) )
								{
									if( isset( $ret->result ) && $ret->result == 'fail' )
									{
										die( json_encode( $ret ) );
									}
									else
									{
										if( !isset( $res->debug ) )
										{
											$res->debug = [];
										}
										
										$res->debug['1: Delete extra fields'] = 'true';
									}
								}
								
								// TODO: See if there is more that needs to be deleted that friendcore doesn't take care of ...
								
							}
							
						}
					}
					
					die( json_encode( $res ) );
				}
				
				die( $res );
				
			}
			else
			{
				die( '{"result":"fail","data":{"response":"id is required ..."}}' );
			}
			
			break;
			
	}
	
	
	
}



// Helper functions ...
function _fcquery( $command = '', $args = false, $method = 'POST', $headers = false )
{
	global $Config, $Logger;	
	
	if( function_exists( 'curl_init' ) )
	{
		$curl = curl_init();
		
		$conf = parse_ini_file( 'cfg/cfg.ini', true );
		
		$debug = ( isset( $conf['options']['debugmodules'] ) && strstr( $conf['options']['debugmodules'], 'system/user' ) ? $conf['options']['debugmodules'] : false );
		
		$usePort = ( $Config->FCHost == 'localhost' || $Config->FCOnLocalhost ) && $Config->FCPort;
		$host = $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost;
        $server = ( $Config->SSLEnable ? 'https://' : 'http://' ) . $host . ( $usePort ? ( ':' . $Config->FCPort ) : '' );
		
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
	
		curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

		// TODO: Disable logging on production servers, perhaps from cfg, because args and results are exposed ...
		
		if( $debug ) $Logger->log( date( 'Y-m-d H:i' ).' CURL: ['.( $method ? $method : 'POST' ).'] URL: '.$url.( $headers ? ' HEADERS: '.json_encode( $headers ) : '' ).( $args ? ' ARGS: '.json_encode( $args ) : '' ).' FILE: /modules/system/include/user.php'."\r\n" );
		
		$output = curl_exec( $curl );

		$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
		
		if( $debug ) $Logger->log( date( 'Y-m-d H:i' ).' CURL: ['.$httpCode.'] URL: '.$url.' RESULT: '.$output."\r\n" );
		
		curl_close( $curl );
		
		if( trim( $output ) )
		{
			if( strstr( trim( $output ), '<!--separate-->' ) )
			{
				if( $resp = explode( '<!--separate-->', trim( $output ) ) )
				{
					if( $resp[0] == 'ok' )
					{
						return json_decode( '{"result":"ok","data":' . ( isset( $resp[1] ) ? $resp[1] : 'null' ) . '}' );
					}
					else
					{
						return json_decode( '{"result":"fail","data":' . ( isset( $resp[1] ) ? $resp[1] : 'null' ) . '}' );
					}
				}
			}
			else
			{
				if( $json = json_decode( trim( $output ) ) )
				{
					return $json;
				}
				
				return json_decode( '{"result":"fail","data":' . trim( $output ) . '}' );
			}
		}
		
		return json_decode( '{"result":"fail","data":{"response":"Unexpected error!","curl_code":"' . $httpCode . '"}}' );
		
	}
	
	return false;
}

function _addToWorkgroups( $userid, $workgroups, $token, $perms )
{
	if( $userid > 0 && $workgroups && $token && $perms )
	{
		
		$success = []; $data = []; 
		
		if( $wgr = explode( ',', $workgroups ) )
		{
			$debug = []; $debug[$userid] = [];
			
			foreach( $wgr as $gid )
			{
				
				if( $gid > 0 )
				{
					
					// Specific for Pawel's code ... He just wants to forward json ...
				
					$data['args'] = json_encode( json_decode( '{
						"type"    : "write", 
						"context" : "application", 
						"name"    : "\'System\',\'Admin\'", 
						"data"    : { 
							"permission" : ' . $perms . '
						}, 
						"object"   : "workgroup", 
						"objectid" : ' . $gid . ' 
					}' ) );
				
					if( $token )
					{
						if( $token['sessionid'] )
						{
							$data['sessionid'] = $token['sessionid'];
						}
						if( $token['servertoken'] )
						{
							$data['servertoken'] = $token['servertoken'];
						}
					}
				
					$data['id']    = intval( $gid );
					$data['users'] = intval( $userid );
				
					if( $res = _fcquery( '/system.library/group/addusers', $data ) )
					{
						if( is_object( $res ) )
						{
							if( isset( $res->result ) && $res->result == 'fail' )
							{
								return false;
							}
							else
							{
								$data['args'] = json_decode( $data['args'] );
								$debug[$userid][] = json_decode( '{
									"url"    : "/system.library/group/addusers",
									"args"   : '.json_encode( $data ).',
									"result" : '.json_encode( $res->result ).',
									"result" : '.json_encode( $res->data ).'
								}' );
								
								$success[] = [ $data, $res ];
							}
						}
					}
					
				}
				
			}
			
			if( $success )
			{
				return ( $debug ? $debug : $success );
			}
			
		}
		
	}
	
	return false;
}

function _findInSearchPaths( $app )
{
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return $apath . $app;
		}
	}
	return false;
}

function _addExtraFields( $userid, $fields )
{
	global $SqlDatabase;
	
	if( $userid > 0 && $fields )
	{
		$debug = []; $debug[$userid] = [];
		
		foreach( $fields as $key => $value )
		{
			
			if( trim( $key ) && $userid > 0 )
			{
				$fm = new dbIO( 'FMetaData' );
				$fm->DataTable = 'FUser';
				$fm->DataID = $userid;
				$fm->Key = trim( $key );
				$fm->Load();
				$fm->ValueString = trim( $value );
				$fm->Save();
				
				$debug[$userid][] = json_decode( '{
					"DBName"      : "FMetaData",
					"ID"          : "'.$fm->ID.'",
					"DataTable"   : "'.$fm->DataTable.'",
					"DataID"      : "'.$fm->DataID.'",
					"Key"         : "'.$fm->Key.'",
					"ValueString" : "'.$fm->ValueString.'"
				}' );
			}
			
		}
		
		return ( $debug ? $debug : false );
	}
	
	return false;
}

function _deleteExtraFields( $userid )
{
	global $SqlDatabase;
	
	if( $userid > 0 )
	{
		
		if( $fields = $SqlDatabase->FetchObjects( '
			SELECT 
				fm.* 
			FROM 
				FMetaData fm 
			WHERE 
					fm.Key       IN ("' . implode( '","', [ 'Mobile' ] ) . '") 
				AND fm.DataID    = \'' . $userid . '\' 
				AND fm.DataTable = "FUser" 
			ORDER BY 
				fm.ID ASC 
		' ) )
		{	
			foreach( $fields as $field )
			{
				
				if( $field->ID > 0 )
				{
					$fm = new dbIO( 'FMetaData' );
					if( $fm->Load( $field->ID ) )
					{
						$fm->Delete();
					}
				}
				
			}
			
			return true;
		}
		
	}
	
	return false;
}

function _firstLogin( $userid )
{
	global $SqlDatabase;
	
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 )
	{
		
		// 2. Check if we never logged in before..
		if( !( $disk = $SqlDatabase->FetchObject( $q = 'SELECT * FROM Filesystem WHERE UserID=\'' . $userid . '\'' ) ) )
		{
			
			$debug = []; $debug[$userid] = new stdClass();
			
			// 3. Setup a standard disk
			$o = new dbIO( 'Filesystem' );
			$o->UserID = $userid;
			$o->Name = 'Home';
			$o->Load();
			$o->Type = 'SQLDrive';
			$o->ShortDescription = 'My data volume';
			$o->Server = 'localhost';
			$o->Mounted = '1';
	
			if( $o->Save() )
			{
				$debug[$userid]->HomeFolder = json_decode( '{
					"DbName"           : "Filesystem",
					"ID"               : "'.$o->ID.'",
					"UserID"           : "'.$o->UserID.'",
					"Name"             : "'.$o->Name.'",
					"Type"             : "'.$o->Type.'",
					"ShortDescription" : "'.$o->ShortDescription.'",
					"Server"           : "'.$o->Server.'",
					"Mounted"          : "'.$o->Mounted.'"
				}' );
				
				// 4. Wallpaper images directory
				if( isset( $Config->copydefaultwallpapers ) )
				{
					$f2 = new dbIO( 'FSFolder' );
					$f2->FilesystemID = $o->ID;
					$f2->UserID = $userid;
					$f2->Name = 'Wallpaper';
					if( !$f2->Load() )
					{
						$f2->DateCreated = date( 'Y-m-d H:i:s' );
						$f2->DateModified = $f2->DateCreated;
						$f2->Save();
					}
					
					$debug[$userid]->WallpaperFolder = json_decode( '{
						"DbName"       : "FSFolder",
						"ID"           : "'.$f2->ID.'",
						"FilesystemID" : "'.$f2->FilesystemID.'",
						"UserID"       : "'.$f2->UserID.'",
						"Name"         : "'.$f2->Name.'",
						"DateCreated"  : "'.$f2->DateCreated.'",
						"DateModified" : "'.$f2->DateModified.'"
					}' );
				}
				
				// 5. Some example documents
				$f = new dbIO( 'FSFolder' );
				$f->FilesystemID = $o->ID;
				$f->UserID = $userid;
				$f->Name = 'Documents';
				if( !$f->Load() )
				{
					$f->DateCreated = date( 'Y-m-d H:i:s' );
					$f->DateModified = $f->DateCreated;
					$f->Save();
				}
				
				$debug[$userid]->DocumentsFolder = json_decode( '{
					"DbName"       : "FSFolder",
					"ID"           : "'.$f->ID.'",
					"FilesystemID" : "'.$f->FilesystemID.'",
					"UserID"       : "'.$f->UserID.'",
					"Name"         : "'.$f->Name.'",
					"DateCreated"  : "'.$f->DateCreated.'",
					"DateModified" : "'.$f->DateModified.'"
				}' );
				
				$fdownloadfolder = new dbIO( 'FSFolder' );
				$fdownloadfolder->FilesystemID = $o->ID;
				$fdownloadfolder->UserID = $userid;
				$fdownloadfolder->Name = 'Downloads';
				if( !$fdownloadfolder->Load() )
				{
					$fdownloadfolder->DateCreated = date( 'Y-m-d H:i:s' );
					$fdownloadfolder->DateModified = $f->DateCreated;
					$fdownloadfolder->Save();
				}
				
				$debug[$userid]->DownloadsFolder = json_decode( '{
					"DbName"       : "FSFolder",
					"ID"           : "'.$fdownloadfolder->ID.'",
					"FilesystemID" : "'.$fdownloadfolder->FilesystemID.'",
					"UserID"       : "'.$fdownloadfolder->UserID.'",
					"Name"         : "'.$fdownloadfolder->Name.'",
					"DateCreated"  : "'.$fdownloadfolder->DateCreated.'",
					"DateModified" : "'.$fdownloadfolder->DateModified.'"
				}' );
				
				/*$f1 = new dbIO( 'FSFolder' );
				$f1->FilesystemID = $o->ID;
				$f1->UserID = $userid;
				$f1->Name = 'Code examples';
				if( !$f1->Load() )
				{
					$f1->DateCreated = date( 'Y-m-d H:i:s' );
					$f1->DateModified = $f1->DateCreated;
					$f1->Save();
				}*/
				
				// 6. Copy some wallpapers
				// TODO: Implement support for "copydefaultwallpapers"
				// This was disabled to conserve space when many user accounts are created
				if( isset( $Config ) && isset( $Config->copydefaultwallpapers ) )
				{
					$debug[$userid]->Wallpapers = [];
					
					$prefix = "resources/webclient/theme/wallpaper/";
					$files = array(
						"Autumn",
						"CalmSea",
						"Domestic",
						"Field",
						"Fire",
						"Freedom",
						"NightClouds",
						"RedLeaf",
						"TechRoad",
						"TreeBranch",
						"Bug",
						"CityLights",
						"EveningCalm",
						"FireCones",
						"FjordCoast",
						"GroundedLeaves",
						"Omen",
						"SummerLeaf",
						"TrailBlazing",
						"WindyOcean"
					);
				
					$wallpaperstring = '';
					$wallpaperseperator = '';
					foreach( $files as $file )
					{
						$fl = new dbIO( 'FSFile' );
						$fl->Filename = $file . '.jpg';
						$fl->FolderID = $f2->ID;
						$fl->FilesystemID = $o->ID;
						$fl->UserID = $userid;
						if( !$fl->Load() )
						{
							$newname = $file;
							while( file_exists( 'storage/' . $newname . '.jpg' ) )
								$newname = $file . rand( 0, 999999 );
							copy( $prefix . $file . '.jpg', 'storage/' . $newname . '.jpg' );

							$fl->DiskFilename = $newname . '.jpg';
							$fl->Filesize = filesize( $prefix . $file . '.jpg' );
							$fl->DateCreated = date( 'Y-m-d H:i:s' );
							$fl->DateModified = $fl->DateCreated;
							$fl->Save();

							$wallpaperstring .= $wallpaperseperator . '"Home:Wallpaper/' . $file . '.jpg"';
							$wallpaperseperator = ',';
						}
						
						$debug[$userid]->Wallpapers[] = json_decode( '{
							"DBName"       : "FSFile",
							"ID"           : "'.$fl->ID.'",
							"Filename"     : "'.$fl->Filename.'",
							"FolderID"     : "'.$fl->FolderID.'",
							"FilesystemID" : "'.$fl->FilesystemID.'", 
							"UserID"       : "'.$fl->UserID.'",
							"DiskFilename" : "'.$fl->DiskFilename.'",
							"Filesize"     : "'.$fl->Filesize.'",
							"DateCreated"  : "'.$fl->DateCreated.'",
							"DateModified" : "'.$fl->DateModified.'"
						}' );
					}
				
					// 7. Copy some other files
					// This is deprecated
					/*
					$prefix = "resources/webclient/examples/";
					$files = array(
					"ExampleWindow.jsx", "Template.html"
					);
				
					foreach( $files as $filen )
					{
						list( $file, $ext ) = explode( '.', $filen );

						$fl = new dbIO( 'FSFile' );
						$fl->Filename = $file . '.' . $ext;
						$fl->FolderID = $f1->ID;
						$fl->FilesystemID = $o->ID;
						$fl->UserID = $userid;
						if( !$fl->Load() )
						{
							$newname = $file;
							while( file_exists( 'storage/' . $newname . '.' . $ext ) )
								$newname = $file . rand( 0, 999999 );
							copy( $prefix . $file . '.' . $ext, 'storage/' . $newname . '.' . $ext );

							$fl->DiskFilename = $newname . '.' . $ext;
							$fl->Filesize = filesize( $prefix . $file . '.' . $ext );
							$fl->DateCreated = date( 'Y-m-d H:i:s' );
							$fl->DateModified = $fl->DateCreated;
							$fl->Save();
						}
					}*/
				}
				
				// 8. Fill Wallpaper app with settings and set default wallpaper
				$wp = new dbIO( 'FSetting' );
				$wp->UserID = $userid;
				$wp->Type = 'system';
				$wp->Key = 'imagesdoors';
				if( !$wp->Load() )
				{
					$wp->Data = '';
					$wp->Save();
				}
				
				$debug[$userid]->WallpaperSettings = json_decode( '{
					"DbName" : "FSetting",
					"Type"   : "system",
					"Key"    : "imagesdoors",
					"ID"     : "'.$wp->ID.'",
					"UserID" : "'.$wp->UserID.'",
					"Data"   : '.( $wp->Data ? $wp->Data : '""' ).'
				}' );
				
				$wp = new dbIO( 'FSetting' );
				$wp->UserID = $userid;
				$wp->Type = 'system';
				$wp->Key = 'wallpaperdoors';
				if( !$wp->Load() )
				{
					$wp->Data = '';
					$wp->Save();
				}
				
				$debug[$userid]->WallpaperTemplate = json_decode( '{
					"DbName" : "FSetting",
					"Type"   : "system",
					"Key"    : "wallpaperdoors",
					"ID"     : "'.$wp->ID.'",
					"UserID" : "'.$wp->UserID.'",
					"Data"   : '.( $wp->Data ? $wp->Data : '""' ).'
				}' );
				
				return ( $debug ? $debug : false );
			}
		}
	}
	
	return false;
}

function _saveAvatar( $userid, $base64 )
{
	global $SqlDatabase;
	
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 && trim( $base64 ) )
	{
		if( !base64_encode( base64_decode( $base64, true ) ) === $base64 )
		{
			die( 'fail not base64 string ...' );
		}
		
		$debug = []; $debug[$userid] = [];
		
		$o = new dbIO( 'FSetting' );
		$o->UserID = $userid;
		$o->Type = 'system';
		$o->Key = 'avatar';
		$o->Load();
		$o->Data = /*urldecode(*/ trim( $base64 )/* )*/;
		$o->Save();
		
		$debug[$userid][] = json_decode( '{"DBName":"FSetting","ID":"'.$o->ID.'","UserID":"'.$o->UserID.'","Type":"'.$o->Type.'","Key":"'.$o->Key.'","Data":"'.( $o->Data ? '[BASE64] string' : '' ).'"}' );
		
		// Save image blob as filename hash on user
		if( $o->ID > 0 && $o->Data && $o->UserID > 0 )
		{
			$u = new dbIO( 'FUser' );
			$u->ID = $o->UserID;
			if( $u->Load() )
			{
				$u->Image = md5( $o->Data );
				$u->Save();
				
				$debug[$userid][] = json_decode( '{"DBName":"FUser","ID":"'.$u->ID.'","Image":"'.$u->Image.'"}' );
				
				return $debug;
			}
		}
	}
	
	return false;
}

function _applySetup( $userid, $id )
{
	global $Config, $SqlDatabase;	
	
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 && $id > 0 )
	{
		if( $ug = $SqlDatabase->FetchObject( '
			SELECT 
				g.*, s.Data
			FROM 
				`FUserGroup` g, 
				`FSetting` s 
			WHERE 
					g.ID = \'' . $id . '\' 
				AND g.Type = "Setup" 
				AND s.Type = "setup" 
				AND s.Key = "usergroup" 
				AND s.UserID = g.ID 
		' ) )
		{
			$debug = [];
			
			$users = array( $userid );
			
			$ug->Data = ( $ug->Data ? json_decode( $ug->Data ) : false );
			
			// TODO: Instead of file_get_contents, copy the file from source to save memory
			
			// Try to get wallpaper
			$wallpaper = new dbIO( 'FMetaData' );
			$wallpaper->DataID = $ug->ID;
			$wallpaper->DataTable = 'FSetting';
			$wallpaper->Key = 'UserTemplateSetupWallpaper';
			$wallpaperContent = false;
			if( !$wallpaper->Load() )
			{
				$wallpaper = false;
			}
			else
			{
				if( !( $wallpaperContent = file_get_contents( $wallpaper->ValueString ) ) )
				{
					$wallpaper = false;
				}
			}
			
			if( $users )
			{
				foreach( $users as $uid )
				{
					$debug[$uid] = new stdClass();
					
					$debug[$uid]->TemplateSetup = json_decode( '{
						"DBName" : "FSetting",
						"ID"     : "'.$ug->ID.'",
						"Type"   : "setup",
						"Key"    : "usergroup",
						"Data"   : '.( $ug->Data ? json_encode( $ug->Data ) : '' ).'
					}' );
					
					// Make sure the user exists!
					$theUser = new dbIO( 'FUser' );
					$theUser->load( $uid );
					if( !$theUser->ID ) continue;
				
					// Great, we have a user
					if( $ug->Data && $uid )
					{
						// Language ----------------------------------------------------------------------------------------
			
						if( $ug->Data->language )
						{
							// 1. Check and update language!
	
							$lang = new dbIO( 'FSetting' );
							$lang->UserID = $uid;
							$lang->Type = 'system';
							$lang->Key = 'locale';
							$lang->Load();
							$lang->Data = $ug->Data->language;
							$lang->Save();
							
							$debug[$uid]->Language = json_decode( '{
								"DBName" : "FSetting",
								"ID"     : "'.$lang->ID.'",
								"UserID" : "'.$lang->UserID.'",
								"Type"   : "'.$lang->Type.'",
								"Key"    : "'.$lang->Key.'",
								"Data"   : "'.$lang->Data.'"
							}' );
						}
		
						// Wallpaper -----------------------------------------------
						// TODO: Support other filesystems than SQLDrive! (right now, not possible!)
					
						if( $wallpaper )
						{
							//$debug[$uid]->wallpaper = new stdClass();
							
							$fnam = $wallpaper->ValueString;
							$fnam = explode( '/', $fnam );
							$fnam = end( $fnam );
							$ext  = explode( '.', $fnam );
							$fnam = $ext[0];
							$ext  = $ext[1];
							
							$debug[$uid]->WallpaperTemplate = json_decode( '{
								"DBName"           : "FMetaData",
								"DataID"           : "'.$wallpaper->DataID.'",
								"DataTable"        : "'.$wallpaper->DataTable.'",
								"Key"              : "'.$wallpaper->Key.'",
								"ValueString"      : "'.$wallpaper->ValueString.'",
								"WallpaperContent" : "'.( $wallpaperContent ? 'true' : 'false' ).'" 
							}' );
							
							$f = new dbIO( 'Filesystem' );
							$f->UserID = $uid;
							$f->Name   = 'Home';
							
							if( !$f->Load() )
							{
								$f->ID = 0;
							}
						
							if( $f->ID > 0 && $fnam && $ext && $theUser->Name )
							{
								// Make sure we have wallpaper folder
								$fl = new dbIO( 'FSFolder' );
								$fl->FilesystemID = $f->ID;
								$fl->UserID = $uid;
								$fl->Name = 'Wallpaper';
								$fl->FolderID = 0;
								if( !$fl->Load() )
								{
									$fl->DateCreated = date( 'Y-m-d H:i:s' );
									$fl->DateModified = $fl->DateCreated;
								
									$fl->Save();
								}
								
								$debug[$uid]->WallpaperFolder = json_decode( '{
									"DBName"       : "FSFolder",
									"ID"           : "'.$fl->ID.'",
									"FilesystemID" : "'.$fl->FilesystemID.'",
									"UserID"       : "'.$fl->UserID.'",
									"Name"         : "'.$fl->Name.'",
									"FolderID"     : "'.$fl->FolderID.'",
									"DateCreated"  : "'.$fl->DateCreated.'",
									"DateModified" : "'.$fl->DateModified.'"
								}' );
								
								// Check if FCUpload is defined before moving forward ...
								if( !isset( $Config->FCUpload ) || !$Config->FCUpload || trim( $Config->FCUpload ) == getcwd() || trim( $Config->FCUpload ) == ( getcwd() . '/' ) )
								{
									die( '{"result":"fail","data":{"response":"FCUpload in cfg/cfg.ini require a storage path, root level is not allowed ..."}}' );
								}
								
								$unlinked = false;
								
								$fi = new dbIO( 'FSFile' );
								$fi->Filename = ( 'default_wallpaper_' . $fl->FilesystemID . '_' . $fl->UserID . '.jpg' );
								$fi->FolderID = $fl->ID;
								$fi->FilesystemID = $f->ID;
								$fi->UserID = $uid;
								if( $fi->Load() && $fi->DiskFilename )
								{
									if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
									{
										unlink( $Config->FCUpload . $fi->DiskFilename );
										$unlinked = true;
									}
								}
								
								$madeDir = false;
								
								// Find disk filename
								$uname = str_replace( array( '..', '/', ' ' ), '_', $theUser->Name );
								if( !file_exists( $Config->FCUpload . $uname ) )
								{
									mkdir( $Config->FCUpload . $uname );
									$madeDir = ( $Config->FCUpload . $uname );
								}
							
								$tempName = $fnam;
								while( file_exists( $Config->FCUpload . $uname . '/' . $fnam . '.' . $ext ) )
								{
									$fnam = ( $tempName . rand( 0, 999999 ) );
								}
								
								if( $fp = fopen( $Config->FCUpload . $uname . '/' . $fnam . '.' . $ext, 'w+' ) )
								{
									fwrite( $fp, $wallpaperContent );
									fclose( $fp );
									
									//$debug[$uid]->wallpaper->diskfilename = ( $uname . '/' . $fnam . '.' . $ext );
									//$debug[$uid]->wallpaper->content = ( $wallpaperContent ? true : false );
									
									$fi->DiskFilename = ( $uname . '/' . $fnam . '.' . $ext );
									$fi->Filesize = filesize( $wallpaper->ValueString );
									$fi->DateCreated = date( 'Y-m-d H:i:s' );
									$fi->DateModified = $fi->DateCreated;
									$fi->Save();
									
									$debug[$uid]->WallpaperFile = json_decode( '{
										"DBName"       : "FSFile",
										"ID"           : "'.$fi->ID.'",
										"Filename"     : "'.$fi->Filename.'",
										"FolderID"     : "'.$fi->FolderID.'",
										"FilesystemID" : "'.$fi->FilesystemID.'",
										"UserID"       : "'.$fi->UserID.'",
										"DiskFilename" : "'.$fi->DiskFilename.'",
										"Filesize"     : "'.$fi->Filesize.'",
										"DateCreated"  : "'.$fi->DateCreated.'",
										"DateModified" : "'.$fi->DateModified.'",
										"'.( $Config->FCUpload . $fi->DiskFilename ).'" : "'.( $unlinked ? 'found file and unlinked before recreated' : 'didn\'t find existing file no need for unlink' ).'",
										"MadeDir"          : "'.$madeDir.'",
										"FullDiskFilePath" : "'.( $Config->FCUpload . $uname . '/' . $fnam . '.' . $ext ).'", 
										"WallpaperContent" : "'.( $wallpaperContent ? 'true' : 'false' ).'"
									}' );
									
									//$debug[$uid]->wallpaper->id = ( $fi->ID > 0 ? $fi->ID : false );
								
									// Set the wallpaper in config
									$s = new dbIO( 'FSetting' );
									$s->UserID = $uid;
									$s->Type = 'system';
									$s->Key = 'wallpaperdoors';
									$s->Load();
									$s->Data = '"Home:Wallpaper/' . $fi->Filename . '"';
									$s->Save();
								
									//$debug[$uid]->wallpaper->wallpaperdoors = ( $s->ID > 0 ? $s->Data : false );
									
									$debug[$uid]->WallpaperSettings = json_decode( '{
										"DBName" : "FSetting",
										"ID"     : "'.$s->ID.'",
										"UserID" : "'.$s->UserID.'",
										"Type"   : "'.$s->Type.'",
										"Key"    : "'.$s->Key.'",
										"Data"   : '.$s->Data.'
									}' );
									
									// Before, we added the wallpaper to the collection. Removed here..
								}
							
							
							}
						}
						
						// Startup -----------------------------------------------------------------------------------------
		
						if( isset( $ug->Data->startups ) )
						{
							// 2. Check and update startup!
	
							$star = new dbIO( 'FSetting' );
							$star->UserID = $uid;
							$star->Type = 'system';
							$star->Key = 'startupsequence';
							$star->Load();
							$star->Data = ( $ug->Data->startups ? json_encode( $ug->Data->startups ) : '[]' );
							$star->Save();
							
							//$debug[$uid]->startup = ( $star->ID > 0 ? $star->Data : false );
							
							$debug[$uid]->Startup = json_decode( '{
								"DBName" : "FSetting",
								"ID"     : "'.$star->ID.'",
								"UserID" : "'.$star->UserID.'",
								"Type"   : "'.$star->Type.'",
								"Key"    : "'.$star->Key.'",
								"Data"   : '.$star->Data.'
							}' );
							
						}
		
						// Theme -------------------------------------------------------------------------------------------
		
						if( $ug->Data->theme )
						{
							// 3. Check and update theme!
	
							$them = new dbIO( 'FSetting' );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'theme';
							$them->Load();
							$them->Data = $ug->Data->theme;
							$them->Save();
							
							//$debug[$uid]->theme = ( $them->ID > 0 ? $them->Data : false );
							
							$debug[$uid]->Theme = json_decode( '{
								"DBName" : "FSetting",
								"ID"     : "'.$them->ID.'",
								"UserID" : "'.$them->UserID.'",
								"Type"   : "'.$them->Type.'",
								"Key"    : "'.$them->Key.'",
								"Data"   : "'.$them->Data.'"
							}' );
						}
					
						if( $ug->Data->themeconfig && $ug->Data->theme )
						{
							// 3. Check and update look and feel config!
						
							$them = new dbIO( 'FSetting' );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'themedata_' . strtolower( $ug->Data->theme );
							$them->Load();
							$them->Data = json_encode( $ug->Data->themeconfig );
							$them->Save(); 
							
							//$debug[$uid]->themedata = ( $them->ID > 0 ? $them->Data : false );
							
							$debug[$uid]->ThemeData = json_decode( '{
								"DBName" : "FSetting",
								"ID"     : "'.$them->ID.'",
								"UserID" : "'.$them->UserID.'",
								"Type"   : "'.$them->Type.'",
								"Key"    : "'.$them->Key.'",
								"Data"   : '.$them->Data.'
							}' );
						}
					
						if( $ug->Data->workspacecount )
						{
							// 3. Check and update look and feel workspace numbers!
						
							$them = new dbIO( 'FSetting' );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'workspacecount';
							$them->Load();
							$them->Data = $ug->Data->workspacecount;
							$them->Save(); 
							
							//$debug[$uid]->workspacecount = ( $them->ID > 0 ? $them->Data : false );
							
							$debug[$uid]->WorkspaceCount = json_decode( '{
								"DBName" : "FSetting",
								"ID"     : "'.$them->ID.'",
								"UserID" : "'.$them->UserID.'",
								"Type"   : "'.$them->Type.'",
								"Key"    : "'.$them->Key.'",
								"Data"   : "'.$them->Data.'"
							}' );
						}
					
						// Software ----------------------------------------------------------------------------------------
					
						if( !isset( $ug->Data->software ) )
						{
							$ug->Data->software = json_decode( '[["Dock","1"]]' );
						}
					
						if( $ug->Data->software )
						{
							// 4. Check dock!
						
							// TODO: Perhaps we should add the current list of dock items if there is any included with the software list for adding ...
	
							if( 1==1 || !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) ) )
							{
								$i = 0;
								
								$debug[$uid]->Software = [];
								
								foreach( $ug->Data->software as $r )
								{
									if( $r[0] )
									{
										// 5. Store applications
				
										if( $path = _findInSearchPaths( $r[0] ) )
										{
											if( file_exists( $path . '/Config.conf' ) )
											{
												$debug[$uid]->Software[$r[0]] = new stdClass();
											
												$f = file_get_contents( $path . '/Config.conf' );
												// Path is dynamic!
												$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
					
												// Store application!
												$a = new dbIO( 'FApplication' );
												$a->UserID = $uid;
												$a->Name = $r[0];
												if( !$a->Load() )
												{
													$a->DateInstalled = date( 'Y-m-d H:i:s' );
													$a->Config = $f;
													$a->Permissions = 'UGO';
													$a->DateModified = $a->DateInstalled;
													$a->Save();
												}
												
												$debug[$uid]->Software[$r[0]]->Application = json_decode( '{
													"DBName"        : "FApplication",
													"ID"            : "'.$a->ID.'",
													"UserID"        : "'.$a->UserID.'",
													"Name"          : "'.$a->Name.'",
													"DateInstalled" : "'.$a->DateInstalled.'",
													"Config"        : '.$a->Config.',
													"Permissions"   : "'.$a->Permissions.'",
													"DateModified"  : "'.$a->DateModified.'"
												}' );
												
												// 6. Setup dock items
						
												if( $r[1] )
												{
													$d = new dbIO( 'DockItem' );
													$d->Application = $r[0];
													$d->UserID = $uid;
													$d->Parent = 0;
													if( !$d->Load() )
													{
														//$d->ShortDescription = $r[1];
														$d->SortOrder = $i++;
														$d->Save();
													}
													
													$debug[$uid]->Software[$r[0]]->Dock = json_decode( '{
														"DBName"      : "DockItem",
														"ID"          : "'.$d->ID.'",
														"Application" : "'.$d->Application.'",
														"UserID"      : "'.$d->UserID.'",
														"Parent"      : "'.$d->Parent.'",
														"SortOrder"   : "'.$d->SortOrder.'"
													}' );
												}
												
												// 7. Pre-install applications
						
												if( $ug->Data->preinstall != '0' && $a->ID > 0 )
												{
													if( $a->Config && ( $cf = json_decode( $a->Config ) ) )
													{
														if( isset( $cf->Permissions ) && $cf->Permissions )
														{
															$perms = [];
															foreach( $cf->Permissions as $p )
															{
																$perms[] = [$p,(strtolower($p)=='door all'?'all':'')];
															}
								
															// TODO: Get this from Config.ini in the future, atm set nothing
															$da = new stdClass();
															$da->domain = '';
									
															// Collect permissions in a string
															$app = new dbIO( 'FUserApplication' );
															$app->ApplicationID = $a->ID;
															$app->UserID = $a->UserID;
															if( !$app->Load() )
															{
																$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $a->ID );
																$app->Permissions = json_encode( $perms );
																$app->Data = json_encode( $da );
																$app->Save();
															}
															
															$debug[$uid]->Software[$r[0]]->UserApplication = json_decode( '{
																"DBName"        : "FUserApplication",
																"ID"            : "'.$app->ID.'",
																"ApplicationID" : "'.$app->ApplicationID.'",
																"UserID"        : "'.$app->UserID.'",
																"AuthID"        : "'.$app->AuthID.'",
																"Permissions"   : "'.( $app->Permissions ? 'true' : 'false' ).'",
																"Data"          : "'.( $app->Data ? 'true' : 'false' ).'"
															}' );
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				
					
				
					if( $uid )
					{
						if( $dels = $SqlDatabase->FetchObjects( $q = '
							SELECT 
								g.* 
							FROM 
								`FUserGroup` g, 
								`FUserToGroup` ug 
							WHERE 
									g.Type = "Setup" 
								AND ug.UserGroupID = g.ID 
								AND ug.UserID = \'' . $uid . '\' 
							ORDER BY 
								g.ID ASC 
						' ) )
						{
		
							foreach( $dels as $del )
							{
								if( $del->ID != $args->args->id )
								{
									$SqlDatabase->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
								}
							}
						}
		
						if( $SqlDatabase->FetchObject( '
							SELECT 
								ug.* 
							FROM 
								`FUserToGroup` ug 
							WHERE 
									ug.UserGroupID = \'' . $ug->ID . '\' 
								AND ug.UserID = \'' . $uid . '\' 
						' ) )
						{
							$SqlDatabase->query( '
								UPDATE FUserToGroup SET UserGroupID = \'' . $ug->ID . '\' 
								WHERE UserGroupID = \'' . $ug->ID . '\' AND UserID = \'' . $uid . '\' 
							' );
						}
						else
						{						
							$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $uid . '\', \'' . $ug->ID . '\' )' );
						}
					}
				}
			}
			
			return ( $ug->Data ? ( $debug ? $debug : $ug->Data ) : false );
		}
	}
	else if( $userid > 0 && ( !$id || $id == 0 ) )
	{
		
		$users = array( $userid );	
	
		if( $users )
		{
			foreach( $users as $uid )
			{
				if( $uid )
				{
					if( $dels = $SqlDatabase->FetchObjects( $q = '
						SELECT 
							g.* 
						FROM 
							`FUserGroup` g, 
							`FUserToGroup` ug 
						WHERE 
								g.Type = "Setup" 
							AND ug.UserGroupID = g.ID 
							AND ug.UserID = \'' . $uid . '\' 
						ORDER BY 
							g.ID ASC 
					' ) )
					{
						foreach( $dels as $del )
						{
							$SqlDatabase->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
						}
					}
				}
			}
			
			return '[]';
		}
		
	}
	
	return false;
}

function _updateLanguages( $userid, $lang )
{
	global $SqlDatabase;
	
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 && trim( $lang ) )
	{
		$debug = []; $debug[$userid] = [];
	
		// Find right language for speech
		$langs = [ 'en', 'fr', 'no', 'fi', 'pl' ]; //speechSynthesis.getVoices();
	
		$voice = false;
	
		foreach( $langs as $v )
		{
			if( strtolower( trim( $v ) ) == strtolower( trim( $lang ) ) )
			{
				$voice = '{"spokenLanguage":"' . $lang . '","spokenAlternate":"' . $lang . '"}';
			}
		}
		
		if( !$voice )
		{
			die( 'fail not supported language. ' . json_encode( $langs ) );
		}
		
		$lo = new dbIO( 'FSetting' );
		$lo->UserID = $userid;
		$lo->Type = 'system';
		$lo->Key = 'locale';
		$lo->Load();
		$lo->Data = $lang;
		$lo->Save();
		
		$debug[$userid][] = json_decode( '{
			"DBName" : "FSetting",
			"ID"     : "'.$lo->ID.'",
			"UserID" : "'.$lo->UserID.'",
			"Type"   : "'.$lo->Type.'",
			"Key"    : "'.$lo->Key.'",
			"Data"   : "'.$lo->Data.'"
		}' );
		
		if( $lo->ID > 0 )
		{
			$lo = new dbIO( 'FSetting' );
			$lo->UserID = $userid;
			$lo->Type = 'system';
			$lo->Key = 'language';
			$lo->Load();
			$lo->Data = $voice;
			$lo->Save();
			
			$debug[$userid][] = json_decode( '{
				"DBName" : "FSetting",
				"ID"     : "'.$lo->ID.'",
				"UserID" : "'.$lo->UserID.'",
				"Type"   : "'.$lo->Type.'",
				"Key"    : "'.$lo->Key.'",
				"Data"   : '.$lo->Data.'
			}' );
			
			return $debug;
		}
	}
	
	return false;
}

die( 'fail ...' );

?>
