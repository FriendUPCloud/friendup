<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

global $SqlDatabase, $args, $User, $Logger;

global $mitradb;
$mitradb = false;

include_once( 'php/friend.php' );


/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
// Get user level // some security here...

if( $level = $SqlDatabase->FetchObject( 'SELECT g.Name FROM FUserGroup g, FUserToGroup ug WHERE ug.UserID=\'' . intval( $User->ID ) . '\' AND ug.UserGroupID = g.ID AND g.Type = \'Level\'' ) )
{
	$level = $level->Name;
}
else $level = false;

/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
$d = new DbTable( 'MitraFileSync', $SqlDatabase );
if( !$d->Load() )
{
	$SqlDatabase->query( '
		CREATE TABLE MitraFileSync
		(
			`ID` bigint(20) auto_increment NOT NULL,
			`UserID` bigint(20) default NULL,			
			`SourceFile` text NOT NULL default \'\',
			`TargetFile` text NOT NULL default \'\',
			`DateCreated` datetime,
			PRIMARY KEY(`ID`)
		)
	' );
}

/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
if( $args->command )
{
	switch( $args->command )
	{
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 
		case 'loadappsettings':
			//non admin users will only get app config
			if( $rows = $SqlDatabase->FetchObjects( "SELECT * FROM FSetting s WHERE	s.UserID = '-1' AND s.Key = 'apps' AND s.Type = 'mitra' ORDER BY s.Key ASC;" ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			die('ok<!--separate-->[]');		
			break;

		case 'saveappsettings':
			if( $level != 'Admin' ) die('fail');

			if( !($args && $args->args && $args->args->data && $args->args->data != '') ) { die('fail<!--separate-->No settings. '); }

			
			$o = new dbIO( 'FSetting' );
			$o->UserID = -1;
			$o->Type = 'mitra';
			$o->Key = 'apps';
			$o->Load();
			
			$SqlDatabase->query( 'UPDATE `FSetting` SET Data=\''. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data ) .'\' WHERE ID=\'' . $o->ID . '\'' );
			
			
			die('ok<!--separate-->[]');		
			break;

		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 			
		// save settings for a single application; update as of May 2017
		case 'saveapplicationsettings':
			if( $level != 'Admin' ) die('fail');
			
			if( !($args && $args->args && $args->args->data && $args->args->data != '' ) ) { die('fail<!--separate-->No settings. '); }

			$o = new dbIO( 'FSetting' );
			$o->UserID = -1;
			$o->Type = 'mitraapp';
			
			if( isset($args->args->id) && intval( $args->args->id ) > 0 )
			{
				$o->ID = intval( $args->args->id );
				$o->Load();
			}
			
			if( isset($args->args->key) ) $o->Key = $args->args->key;
			if( !$o->ID  ) $o->Load();
			$o->Save();
						
			$SqlDatabase->query( 'UPDATE `FSetting` SET Data=\''. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data ) .'\' WHERE ID=\'' . $o->ID . '\'' );
			die('ok<!--separate-->[]');	
			
			break;

		case 'loadmitrasettings':
			$o = new dbIO( 'FSetting' );
			$o->UserID = -1;
			$o->Type = 'mitra';
			$o->Key = 'settings';
			if( $o->Load() )
			{
				$dataset = $o->Data;
				// shall we load some info about the available connections as well?
				if( isset( $args->args->extended ) )
				{
					$rs = $SqlDatabase->fetchObjects("SELECT * FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitraapp' ORDER BY s.Key ASC;");
					for( $i = 0; $i < count( $rs ); $i++ )
					{
						$tmp = (array)json_decode( $rs[$i]->Data );
						$keyname = '';
						
						if( isset( $tmp['remoteapplicationprogram'] ) && trim( $tmp['remoteapplicationprogram'] ) != '' )
						{
							$keyname = $tmp['remoteapplicationprogram'];
						}
						else if(  isset( $tmp['remote-app-dir'] ) && trim( $tmp['remote-app-dir'] ) != '' )
						{
							$keyname = $tmp['remote-app-dir'];
						}
						$rs[$i]->Data = $keyname;
						$rs[$i]->ExePath = ( isset( $tmp['executable_path'] ) ? $tmp['executable_path'] : '' );
						$rs[$i]->Parameters = ( isset( $tmp['remoteapp_parameters'] ) ? $tmp['remoteapp_parameters'] : '' );
						$rs[$i]->WorkingDir = ( isset( $tmp['remoteapp_working_dir'] ) ? $tmp['remoteapp_working_dir'] : '' );
						if (isset($tmp['icon'])){
                            if (strlen($tmp['icon']) > 3){
                                $rs[$i]->icon = $tmp['icon'];
                            }
						}
					}
					
					$tmp = json_decode($o->Data);
					$tmp->appkeys = $rs;
					
					$dataset = json_encode($tmp);
				}


				die('ok<!--separate-->'  . $dataset );					
			}
			die('fail<!--separate-->[]');
			break;
			
		case 'savemitrasettings':
			if( $level != 'Admin' ) die('fail');
			
			if( !($args && $args->args && $args->args->data && $args->args->data != '' ) ) { die('fail<!--separate-->No settings. '); }

			$o = new dbIO( 'FSetting' );
			$o->UserID = -1;
			$o->Type = 'mitra';
			$o->Key = 'settings';
			
			$o->Load();
			$o->Save();
						
			$SqlDatabase->query( 'UPDATE `FSetting` SET Data=\''. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data ) .'\' WHERE ID=\'' . $o->ID . '\'' );
			die('ok<!--separate-->[]');	
			
			break;
			
		case 'deleteapplicationsettings':
			if( $level != 'Admin' ) die('fail');
			
			if( isset( $args->args->id ) ) $rs = $SqlDatabase->query('DELETE FROM FSetting WHERE `Type` = \'mitraapp\' AND `UserID` = \'-1\' AND `ID`	=\'' . intval( $args->args->id ) . '\'' );
			die('ok<!--separate-->[]');
			break;	
		
		case 'loadapplicationlist':
			if( isset( $args->args ) && isset( $args->args->admin ) && $level == 'Admin' )
			{
				$query = "SELECT s.* FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitraapp' ORDER BY s.Key ASC;";
			}
			else
			{
				$query = "SELECT s.ID,s.Key FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitraapp' ORDER BY s.Key ASC;";
			}
			
			if( $rows = $SqlDatabase->FetchObjects( $query ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			//no apps... empty array.
			die('ok<!--separate-->[]');
			break;
			
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 
		case 'loadsettings':
			if( $level != 'Admin' ) die('fail<!--separate-->unauthorized! ' . $level);
			
			if( $rows = $SqlDatabase->FetchObjects( "SELECT * FROM FSetting s WHERE	s.UserID = '-1' AND s.Type = 'mitra' ORDER BY s.Key ASC;" ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			else
			{
				//insert settings
				$defaultserversettings = (object) array('url' => 'https://localhost/guacamole/');
				$defaultadminsettings =  (object) array('admin_username'=>'guacadmin', 'admin_password' =>'guacadmin','connection_container'=>'ROOT','default_domain'=>'foobarsam','storage_root'=>'/var/mitra');
				$defaultapps = (object) array('desktop' => '');
				$defaultdb = (object) array('host' => 'localhost', 'username'=>'foobar','password'=>'sambar','database'=>'guacamole');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'host\',\''. json_encode($defaultserversettings) .'\');');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'admin\',\''. json_encode($defaultadminsettings) .'\');');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'database\',\''. json_encode($defaultdb) .'\');');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'settings\',\'{"icon_default":"/webclient/gfx/icons/64x64/apps/akonadi.png","icon_firefox":"/webclient/gfx/icons/64x64/apps/internet-web-browser.png","icon_mspaint":"/webclient/gfx/icons/64x64/mimetypes/application-vnd.oasis.opendocument.image.png","icon_iexplore":"","icon_calc":"/webclient/gfx/icons/64x64/apps/accessories-calculator.png","icon_wordpad":"/webclient/gfx/icons/64x64/apps/accessories-text-editor.png","size_default":"1024x800","size_calc":"224x315","icon_winword":"/webclient/apps/Mitra/Images/icon-winword-2016.png","icon_excel":"/webclient/apps/Mitra/Images/icon-excel-2016.png","icon_scalc":"/webclient/gfx/icons/64x64/mimetypes/application-vnd.oasis.opendocument.spreadsheet.png","icon_sdraw":"/webclient/gfx/icons/64x64/mimetypes/application-vnd.oasis.opendocument.image.png","icon_swriter":"/webclient/gfx/icons/64x64/mimetypes/application-vnd.oasis.opendocument.text.png","icon_simpress":"/webclient/gfx/icons/64x64/mimetypes/application-vnd.oasis.opendocument.presentation.png","icon_smath":"/webclient/gfx/icons/64x64/categories/applications-education-school.png","icon_thunderbird":"/webclient/gfx/icons/64x64/mimetypes/application-vnd.stardivision.mail.png","icon_smartkalk":"/webclient/apps/Mitra/Images/smartkalk-ikon.png","icon_byggsafetotal":"/webclient/apps/Mitra/Images/byggsafe-ikon.png","icon_grafx2":"/webclient/apps/Mitra/Images/grafx2-icon.png","icon_smartsenter":"/webclient/apps/Mitra/Images/smartsenter-ikon.png","icon_systemx":"/webclient/apps/Mitra/Images/systemx-ikon.png","icon_outlook":"/webclient/apps/Mitra/Images/icon-outlook-2016.png","icon_onenote":"/webclient/apps/Mitra/Images/icon-onenote-2016.png","icon_powerpnt":"/webclient/apps/Mitra/Images/icon-powerpnt-2016.png","icon_mspub":"/webclient/apps/Mitra/Images/icon-mspub-2016.png"}\');');
				$rows = $SqlDatabase->FetchObjects( "SELECT * FROM FSetting s WHERE	s.UserID = '-1' AND s.Type = 'mitra' ORDER BY s.Key ASC;" );
				
				die('ok<!--separate-->' . ($rows ? json_encode( $rows ) : 'bigbaderror' ) );	
			}
			die( 'ok<!--separate-->Settings to be loaded here.' );
			break;
		
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 	
		case 'listusers':
			if( $level != 'Admin' ) die('fail');
			
			connectMitraDb(); // this one dies on errors :)
			
			// SQL ROCKS !!! - get all initial programs for RDP connections
			$mquery = 'SELECT gu.user_id,gu.username,GROUP_CONCAT(gcp.parameter_value SEPARATOR \',\') AS connections,GROUP_CONCAT(gcp.connection_id SEPARATOR \',\') AS connection_ids FROM guacamole_user gu,guacamole_connection_permission gp, guacamole_connection_parameter gcp WHERE gu.username LIKE \'mitra_%\' AND gu.user_id = gp.user_id AND gp.connection_id = gcp.connection_id AND ( gcp.parameter_name = \'initial-program\' OR gcp.parameter_name = \'remote-app\' OR ( gcp.parameter_name = \'remote-app-dir\' AND INSTR(gcp.parameter_value,\':\') = 0 ) )GROUP BY gu.user_id ORDER BY gu.username;';
			

			// add VNC connections
			$vquery = 'SELECT gu2.user_id,gu2.username, GROUP_CONCAT(DISTINCT gc2.connection_id SEPARATOR \',\') AS vnc_connection_ids,GROUP_CONCAT(gcp2.parameter_value SEPARATOR \',\') AS hostnames FROM guacamole_connection gc2, guacamole_connection_parameter gcp2, guacamole_user gu2, guacamole_connection_permission gp2 WHERE gu2.username LIKE \'mitra_%\' AND gu2.user_id = gp2.user_id AND gp2.connection_id = gc2.connection_id AND gc2.protocol = \'vnc\' AND gcp2.connection_id = gc2.connection_id AND gcp2.parameter_name = \'hostname\' GROUP BY gu2.user_id;';			
			
			$rdp_users = $mitradb->FetchObjects($mquery);
			$vnc_users = $mitradb->FetchObjects($vquery); 
			
			if( $rdp_users||$vnc_users )
			{
				die( 'ok<!--separate-->' . json_encode( [$rdp_users,$vnc_users] ) );
			}
			else
			{
				$Logger->log('No Mitra users at all? ' . print_r($mitradb,1) . ' ::: ' . $mquery);
				die( 'ok<!--separate-->[]' );
			}
			break;		
		
		/*case 'saveconnectionsetting':
			if( $level != 'Admin' ) die('fail');
		
			connectMitraDb(); // this one dies on errors :)
			if( $args->args->mitrauser == 0 )
			{
				$uid = createMitraUser( $args->args->frienduser );
			}
			else
			{
				$uid = $args->args->mitrauser;
			}
			break;
		*/
		case 'loaduserconncreds':
			//store new credentials for a connections
			connectMitraDb(); // this one dies on errors :)


			$checkquery = 'SELECT * FROM guacamole_connection_parameter gcp WHERE gcp.connection_id IN ( ' .
								'SELECT connection_id FROM guacamole_connection_permission WHERE user_id IN ( ' .
								'	SELECT user_id FROM guacamole_user WHERE user_id = \''. getMitraUser( $User->ID,$User->Name,false ) .'\' '.
								') AND connection_id = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->connection ) . '\')';

			$checkresult = $mitradb->FetchObjects( $checkquery );
			if( $checkresult )
			{
				$old_username = '';
				$old_domain = '';
				
				for( $i = 0; $i < count( $checkresult ); $i++ )
				{
					if( $checkresult[ $i ]->parameter_name == 'username' )
					{
						$old_username = $checkresult[ $i ]->parameter_value;
					}
					else if( $checkresult[ $i ]->parameter_name == 'domain' )
					{
						$old_domain = $checkresult[ $i ]->parameter_value;
					}
				}
				$udata = new stdClass();
				$udata->username = $old_username;
				$udata->domain = $old_domain;
				
				die('ok<!--separate-->' . json_encode( $udata ) );
			}
			die('fail<!--separate-->unauthorised request to loaduserconncreds');
			break;
		
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 
		case 'updateusercredentials':
			//store new credentials for a connections
			connectMitraDb(); // this one dies on errors :)


			$checkquery = 'SELECT * FROM guacamole_connection_parameter gcp WHERE gcp.connection_id IN ( ' .
								'SELECT connection_id FROM guacamole_connection_permission WHERE user_id IN ( ' .
								'	SELECT user_id FROM guacamole_user WHERE user_id = \''. getMitraUser( $User->ID,$User->Name,false ) .'\' '.
								') AND connection_id = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->connection ) . '\')';

			$checkresult = $mitradb->FetchObjects( $checkquery );
			
			
			
			if( $checkresult )
			{
				//$Logger->log('check rs ' . print_r($checkresult,1));
				
				$old_username = '';
				$old_password = '';
				$old_domain = '';
				
				for( $i = 0; $i < count( $checkresult ); $i++ )
				{
					if( $checkresult[ $i ]->parameter_name == 'username' )
					{
						$old_username = $checkresult[ $i ]->parameter_value;
					}
					else if( $checkresult[ $i ]->parameter_name == 'password' )
					{
						$old_password = $checkresult[ $i ]->parameter_value;
					}
					else if( $checkresult[ $i ]->parameter_name == 'domain' )
					{
						$old_domain = $checkresult[ $i ]->parameter_value;
					}
				}
				
				// find all connections with the old data and overwrite them.
				$findquery =  'SELECT GROUP_CONCAT(DISTINCT gcp.connection_id SEPARATOR \',\') AS connections FROM guacamole_connection_parameter gcp WHERE gcp.connection_id IN ( ' .
								'SELECT connection_id FROM guacamole_connection_permission WHERE user_id = \''. getMitraUser( $User->ID,$User->Name,false ) .'\''.
								' AND (  ( gcp.parameter_name = \'domain\' AND gcp.parameter_value = \''. mysqli_real_escape_string( $SqlDatabase->_link, $old_domain ) .'\') ' . 
								' OR ( gcp.parameter_name = \'username\' AND gcp.parameter_value = \''. mysqli_real_escape_string( $SqlDatabase->_link, $old_username ) .'\') ' . 
								' OR ( gcp.parameter_name = \'password\' AND gcp.parameter_value = \''. mysqli_real_escape_string( $SqlDatabase->_link, $old_password ) .'\') ) )';


				$rs = $mitradb->FetchObject( $findquery );

				//$Logger->log('Look for connections by '. $findquery .'\n\n');
				//$Logger->log('We found connections' . print_r( $rs,1 ));


				if( $rs && $rs->connections )
				{
					$cids = explode(',', $rs->connections);
					
					for( $i = 0; $i < count( $cids ); $i++ )
					{
						$uquery = 'UPDATE guacamole_connection_parameter gcp SET parameter_value=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->username ) . '\' WHERE parameter_name=\'username\' AND connection_id = \'' . $cids[ $i ] . '\'';
						$pquery = 'UPDATE guacamole_connection_parameter gcp SET parameter_value=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->password ) . '\' WHERE parameter_name=\'password\' AND connection_id = \'' . $cids[ $i ] . '\'';
						$dquery = 'UPDATE guacamole_connection_parameter gcp SET parameter_value=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->domain ) . '\' WHERE parameter_name=\'domain\' AND connection_id = \'' . $cids[ $i ] . '\'';
						
						$ur = $mitradb->query( $uquery );
						$pr = $mitradb->query( $pquery );
						$dr = $mitradb->query( $dquery );					
						
						

							
					}
					
				}
				
				// no need for this really.... but ... 
				$uquery = 'UPDATE guacamole_connection_parameter gcp SET parameter_value=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->username ) . '\' WHERE parameter_name=\'username\' AND connection_id = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->connection ) . '\'';
				$pquery = 'UPDATE guacamole_connection_parameter gcp SET parameter_value=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->password ) . '\' WHERE parameter_name=\'password\' AND connection_id = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->connection ) . '\'';
				$dquery = 'UPDATE guacamole_connection_parameter gcp SET parameter_value=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->domain ) . '\' WHERE parameter_name=\'domain\' AND connection_id = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->connection ) . '\'';
				
				$ur = $mitradb->query( $uquery );
				$pr = $mitradb->query( $pquery );
				$dr = $mitradb->query( $dquery );
				
				if( $ur && $pr && $dr ) die('ok<!--separate-->'.$args->args->data->connection);
				
				die('fail<!--separate-->Could not save given credentials');
			}

			die('fail<!--separate-->Are you really you');
			break;
				
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 
		case 'loadusersettings':

			//check that we have a password stored for this guy... if not, the rest does not matter ;)		
			$o = new dbIO( 'FSetting' );
			$o->UserID = $User->ID;
			$o->Type = 'mitra';
			$o->Key = 'passhash';
			if( !$o->Load() )
			{
				if( checkForSAMLUser() )
				{
					$connections = new stdClass();
					$connections->user_id = 1;
					$connections->connections = '1';
					if( $row = $SqlDatabase->FetchObject( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'host' ORDER BY s.Key ASC;" )	)
					{
						$connections->mitrahost=$row->Data;
						$connections->up = $o->Data;
						$connections->vncdata = $vnc_cons;
					}
					
					die( 'ok<!--separate-->' . json_encode( $connections ) );
					
					
				}
				die( 'ok<!--separate-->[]' );
			}
		
			connectMitraDb(); // this one dies on errors :)
			
			$mid = getMitraUser( $User->ID,$User->Name,false );
			if( !$mid ) die('fail<!--separate-->could not find user'); 
			
			$mquery = 'SELECT gu.user_id,gu.username,GROUP_CONCAT(gcp.parameter_value SEPARATOR \',\') AS connections,GROUP_CONCAT(gcp.connection_id SEPARATOR \',\') AS connection_ids,GROUP_CONCAT(gcp.parameter_name SEPARATOR \',\') AS connection_subtypes FROM guacamole_user gu,guacamole_connection_permission gp, guacamole_connection_parameter gcp WHERE gu.user_id = \''. $mid .'\' AND gu.user_id = gp.user_id AND gp.connection_id = gcp.connection_id AND ( gcp.parameter_name = \'initial-program\' OR gcp.parameter_name = \'remote-app\' OR ( gcp.parameter_name = \'remote-app-dir\' AND INSTR(gcp.parameter_value,\':\') = 0 ) ) GROUP BY gu.user_id ORDER BY gu.username;';
			
			// add VNC connections
			$vquery = 'SELECT gu2.user_id, GROUP_CONCAT(DISTINCT gc2.connection_id SEPARATOR \',\') AS vnc_connection_ids,GROUP_CONCAT(gcp2.parameter_value SEPARATOR \',\') AS hostnames FROM guacamole_connection gc2, guacamole_connection_parameter gcp2, guacamole_user gu2, guacamole_connection_permission gp2 WHERE gu2.user_id = \''. $mid .'\' AND gu2.user_id = gp2.user_id AND gp2.connection_id = gc2.connection_id AND gc2.protocol = \'vnc\' AND gcp2.connection_id = gc2.connection_id AND gcp2.parameter_name = \'hostname\';';			
			
			$connections = $mitradb->FetchObject( $mquery );
			$vnc_cons = $mitradb->FetchObject( $vquery );
			
			if( $connections||$vnc_cons )
			{
				
				if( $level == 'Admin' ) $connections->mitradesktop=1;
				if( $row = $SqlDatabase->FetchObject( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'host' ORDER BY s.Key ASC;" )	)
				{
					$connections->mitrahost=$row->Data;
					$connections->up = $o->Data;
					$connections->vncdata = $vnc_cons;
				}
				
				die( 'ok<!--separate-->' . json_encode( $connections ) );
			}
			else
			{
				die( 'ok<!--separate-->[]' );
			}
				
			break;
			
		case 'enablestorage':
			//initial checks...
			if( $level != 'Admin' ) die('fail');
			if( !($args && $args->args && $args->args->username && $args->args->username != '') ) { die('fail<!--separate-->No user given. '); }
			
			//check if systme is set up and store or fail :)
			if( $row = $SqlDatabase->FetchObject( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'admin';" ) )
			{
				//$Logger->log('ROW' . print_r( $row,1 ));
				
				$tmp = json_decode($row->Data);
				if( $tmp && $tmp->storage_root )
				{
					if( substr( $tmp->storage_root , -1 ) != '/' ) $tmp->storage_root .= '/';
					if( file_exists( $tmp->storage_root  . $args->args->username ) ) die('ok<!--separate-->DIR_EXISTED');
					if( mkdir( $tmp->storage_root . $args->args->username ) ) die('ok<!--separate-->DIR_CREATED');
					die('fail<!--separate-->Could not create user storage directory.');
				}
				else
				{
					die('fail<!--separate-->Mitra storage settings could not be found. Please make sure storage_root is set in mitra/admin in server settings.');
				}
			}
			else
			{
				die('fail<!--separate-->Mitra settings could not be found. How did you get here?');
			}
			
			break;
			
		case 'saveuserpassword':
			if( $level != 'Admin' ) die('fail');
			if( !($args && $args->args && $args->args->userid && $args->args->userid != '') ) { die('fail<!--separate-->No user id given. '); }
			
			
			$o = new dbIO( 'FSetting' );
			$o->UserID = intval($args->args->userid);
			$o->Type = 'mitra';
			$o->Key = 'passhash';
			$o->Load();
			$o->Data = json_encode( $args->args->password );
			$o->Save();
			
			die('ok<!--separate-->Saved');
			break;

		case 'deleteuserpassword':
			if( $level != 'Admin' ) die('fail');
			if( !($args && $args->args && $args->args->userid && $args->args->userid != '') ) { die('fail<!--separate-->No user id given. '); }
			
			//$Logger->log('Trying to delete user access for userid ' . intval($args->args->userid));
			
			$o = new dbIO( 'FSetting' );
			$o->UserID = intval($args->args->userid);
			$o->Type = 'mitra';
			$o->Key = 'passhash';
			$o->Load();
			$o->Delete();
			
			die('ok<!--separate-->Saved');
			break;		
		
		case 'reopenconnectionwithfile':
		
			//we will only handle files here....
			if( $args->args->file->Type != 'File' ) die('fail<!--separate-->no file dropped ' . $args->args->file->Type . '::' . print_r( $args->args,1 ) );
		
			connectMitraDb(); // this one dies on errors :)
		
			require_once( 'php/classes/file.php' );
			require_once( 'php/classes/door.php' );
		
			//transaction key
			$transaction = $args->args->file->Path . '_COPIED_TO_' .  $args->args->mitradrive . '_' . $args->args->transferfolder;

			
			$lock = new dbIO( 'FSetting' );
			$lock->UserID = intval( $User->ID );
			$lock->Type = 'mitra';
			$lock->Data = $transaction;
			$lock->Load();
			
			//chcek if we have an ongoing transaction... do not start twice...
			if( $lock->Key == 'INIT' )
			{
				die('fail<!--separate-->transaction_in_progress');
			}
			
			//set lock on transaction..........
			$lock->UserID = intval( $User->ID );
			$lock->Key = 'INIT';
			$lock->Data = $transaction;
			$lock->Save();
			
			//query is written so that we use double check we dont change connections for other users...
			$pquery = 'SELECT gcp.*  FROM guacamole_connection_parameter gcp, guacamole_connection_permission gperm WHERE gcp.connection_id = \''. intval($args->args->connection) .'\' AND gperm.connection_id = \''. intval($args->args->connection) .'\' AND gperm.user_id = \''. getMitraUser( $User->ID,$User->Name,false ) .'\'';
			
			$dbpath = '';
			$parameters = $mitradb->FetchArray( $pquery );
			if( $parameters )
			{
			

				//check if we dropped a file on the mitra drive...
				if( strpos( 'X' . $args->args->file->Path, $args->args->mitradrive ) == 1 )
				{
					$dbpath = '\\\\tsclient\\G\\' . str_replace($args->args->mitradrive . ':', '', $args->args->file->Path);
					$dbpath = str_replace('/','\\',$dbpath);
				}
				else
				{
					$filesync = new dbIO( 'MitraFileSync' );
					$filesync->UserID = intval($User->ID);
					$filesync->SourceFile = $args->args->file->Path;
					$filesync->TargetFile = $args->args->mitradrive . ':' . $args->args->transferfolder . '/' . $args->args->file->Filename;
					$filesync->Load(); // avoid doubled DB entries... but we copy the file on each drop...
					
					//copy the file to target...
					$door = new Door( $args->args->mitradrive );
					

					if( $door->copyFile( $args->args->file->Path, $args->args->mitradrive . ':' . $args->args->transferfolder . '/' . $args->args->file->Filename ) )
					{
						$dbpath = '\\\\tsclient\\G\\' . $args->args->transferfolder . '\\' . $args->args->file->Filename . '"';
					}
					else
					{
						die('fail<!--separate-->could not copy file :: FROM ' . $args->args->file->Path . ' TO ' .  $args->args->mitradrive . ':' . $args->args->transferfolder . ' :: '  ); //. print_r( $door,1 )
					}					
					
					$filesync->DateCreated = date('Y-m-d H:i:s');
					$filesync->Save();
				}
				

				$app_to_open = '';
				//check if we have initial-program parameter.... if we have it we save it as client-name + create remote-app to be able to restore back to it later ;)
				for($i = 0; $i < count( $parameters ); $i++)
				{
					if( $parameters[ $i ]['parameter_name'] == 'initial-program' )
					{
						$app_to_open = $parameters[ $i ]['parameter_value'];
					}
				}
				
				if( $app_to_open != '' )
				{
					$query01 = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'initial-program\'';
					$query02 = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'remote-app\'';
					$query03 = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'client-name\'';
					$query04 = 'INSERT INTO guacamole_connection_parameter (connection_id,parameter_name,parameter_value) VALUES (\''. intval($args->args->connection) .'\',\'remote-app\',\'||'. addslashes( $app_to_open ) .'\')';
					$query05 = 'INSERT INTO guacamole_connection_parameter (connection_id,parameter_name,parameter_value) VALUES (\''. intval($args->args->connection) .'\',\'client-name\',\''. addslashes( $app_to_open ) .'\')';
					
					$mitradb->Query( $query01 );
					$mitradb->Query( $query02 );
					$mitradb->Query( $query03 );
					$mitradb->Query( $query04 );
					$mitradb->Query( $query05 );
				}
				
				//file is in place... create parameter for our connection... delete old first if any...
				$mquery = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'remote-app-args\'';
				$mitradb->Query( $mquery );

				$mquery = 'INSERT INTO guacamole_connection_parameter (connection_id,parameter_name,parameter_value) VALUES (\''. intval($args->args->connection) .'\',\'remote-app-args\',\''. addslashes( $dbpath ) .'\')';

				if( $mitradb->Query( $mquery ) )
					die('ok<!--separate-->' . intval($args->args->connection) );
				else
					die('fail<!--separate-->could not update db##' . $mquery);
			}
			else
			{
				$lock->Delete();
				die('fail<!--separate-->invalid_connection');
			}
			
			
			break;
		
		case 'resetfileconnection':
			//we will only handle files here....
			if( $args->args->file->Type != 'File' ) die('fail<!--separate-->no file dropped ' . $args->args->file->Type . '::' . print_r( $args->args,1 ) );
		
			connectMitraDb(); // this one dies on errors :)
		
			//transaction key
			$transaction = $args->args->file->Path . '_COPIED_TO_' .  $args->args->mitradrive . '_' . $args->args->transferfolder;

			$pquery = 'SELECT gcp.*  FROM guacamole_connection_parameter gcp, guacamole_connection_permission gperm WHERE gcp.connection_id = \''. intval($args->args->connection) .'\' AND gperm.connection_id = \''. intval($args->args->connection) .'\' AND gperm.user_id = \''. getMitraUser( $User->ID,$User->Name,false ) .'\'';
			
			$dbpath = '';
			$parameters = $mitradb->FetchArray( $pquery );

			$app_to_open = '';
			if( $parameters )
			{

				//check if we need to revert to initial-program....
				for($i = 0; $i < count( $parameters ); $i++)
				{
					if( $parameters[$i]['parameter_name'] == 'client-name' )
					{
						$app_to_open = $parameters[$i]['parameter_value'];
					}
				}
				
				if( $app_to_open != '' )
				{
					$query01 = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'initial-program\'';
					$query02 = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'remote-app\'';
					$query03 = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'client-name\'';
					$query04 = 'INSERT INTO guacamole_connection_parameter (connection_id,parameter_name,parameter_value) VALUES (\''. intval($args->args->connection) .'\',\'initial-program\',\''. addslashes( $app_to_open ) .'\')';
					
					$mitradb->Query( $query01 );
					$mitradb->Query( $query02 );
					$mitradb->Query( $query03 );
					$mitradb->Query( $query04 );
				}
				
				$mquery = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. intval($args->args->connection) .'\' AND parameter_name = \'remote-app-args\'';
				$mitradb->Query( $mquery );			
				
				$lock = new dbIO( 'FSetting' );
				$lock->UserID = intval( $User->ID );
				$lock->Type = 'mitra';
				$lock->Data = $transaction;
				$lock->Key = 'INIT';
				$lock->Load();
				$lock->Delete();
				
				die('ok<!--separate-->' . intval($args->args->connection) );
				
			}
			die('fail<!--separate-->unauthorized?!');

						
			break;
		
		case 'clean_synced_userfiles':
		
			require_once( 'php/classes/file.php' );
			require_once( 'php/classes/door.php' );
		
			$query = 'SELECT * FROM MitraFileSync WHERE UserID = ' . intval( $User->ID );
			$files = $SqlDatabase->FetchArray( $query );
			if( $files )
			{
				for($i = 0; $i < count( $files ); $i++)
				{
					//open door and check date modified against our original date.
					$tdoor = new Door( $files[$i]['TargetFile'] );
					$tinfo = $tdoor->dosQuery('/system.library/file/info/?path=' . rawurlencode( $files[$i]['TargetFile'] ) );
					
					$sdoor = new Door( $files[$i]['SourceFile'] );
					$sinfo = $sdoor->dosQuery('/system.library/file/info/?path=' . rawurlencode( $files[$i]['SourceFile'] ) );
					
					//check if the file has actually been changed...
					if( 1==1 || $tinfo->DateModified > $files[$i]['DateCreated'] )
					{
						//look if the source file has been changed as well...
						if( 1==1 || $sinfo->DateModified > $files[$i]['DateCreated'] )
						{
							
							$newfilename = substr($sinfo->Filename,0,strrpos( $sinfo->Filename, '.' ) ) . '_MITRA_COPY' . substr($sinfo->Filename,strrpos( $sinfo->Filename, '.' ) );
							$Logger->log('New file name' . $newfilename );
						}
					}

				}
			}
			die('ok');
			break;
			
		case 'get_connection_data':
			//get data for a connection id
			//we will only handle files here....
			if( !($args->args && $args->args->connectionid && intval( $args->args->connectionid ) > 0) ) die('fail<!--separate-->no valid connection given');
		
			connectMitraDb(); // this one dies on errors :)
			
			$pquery = 'SELECT gcp.*  FROM guacamole_connection_parameter gcp, guacamole_connection_permission gperm WHERE gcp.connection_id = \''. intval($args->args->connectionid) .'\' AND gperm.connection_id = \''. intval($args->args->connectionid) .'\' AND gperm.user_id = \''. getMitraUser( $User->ID,$User->Name,false ) .'\'';
			
			if( $parameters = $mitradb->FetchArray( $pquery ) )
			{
				die('ok<!--separate-->' . json_encode($parameters) );
			}
			else
			{
				die('fail<!--separate-->connection not found');
			}

			break;
		
		case 'loaduserconnections':
			if( $rs = $SqlDatabase->fetchObjects( "SELECT s.ID,s.Key,s.Data FROM FSetting s WHERE s.UserID = '". intval( $User->ID ) ."' AND s.Type = 'mitraapp';" ) )
			{
				die('ok<!--separate-->' . json_encode( $rs ) );
			}
 			die('ok<!--separate-->[]');
			break;
			
		case 'saveuserconnection':
			if( !($args && $args->args && $args->args->protocol && $args->args->protocol != '' && $args->args->data && $args->args->data != '' ) ) { die('fail<!--separate-->No settings. '); }

			$connectiondata = (array)json_decode( $args->args->data );
			if( !$connectiondata ) die('fail<!--separate-->invalid data handled in');

			connectMitraDb();

			$o = new dbIO( 'FSetting' );
			$o->UserID = intval( $User->ID );
			$o->Type = 'mitraapp';
			
			if( isset($args->args->id) && intval( $args->args->id ) > 0 )
			{
				$o->ID = intval( $args->args->id );
				$o->Load();
			}
			
			if( isset($args->args->key) ) $o->Key = $args->args->key;
			if( !$o->ID  ) $o->Load();
			$o->Save();

		

			// we identify based on our keys from the friend setup....
			$connectioname = intval( $User->ID ) .  '_' . $o->ID;
			$connectionprotocol = mysqli_real_escape_string( $mitradb->_link, $args->args->protocol );

			$mitrauserid = getMitraUser( $User->ID, $User->Name, true );

			$getconnectionidquery = "SELECT gc.connection_id FROM guacamole_connection gc WHERE gc.connection_name = '{$connectioname}' AND gc.protocol = '{$connectionprotocol}'"; 
			$rs = $mitradb->fetchObject( $getconnectionidquery );
			if( $rs && $rs->connection_id )
			{
				$connectionid = $rs->connection_id;
				
				//delete old parameters...
				$delparaquery = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = \''. $rs->connection_id .'\'';
				$mitradb->query( $delparaquery );
			}
			else
			{
				//create connection
				$insertconnectionquery = "INSERT INTO guacamole_connection (connection_name,protocol) VALUES ('{$connectioname}','{$connectionprotocol}')";
				$mitradb->query( $insertconnectionquery );
				$rs = $mitradb->fetchObject( $getconnectionidquery );
				if( !($rs && $rs->connection_id) ) die('fail<!--separate-->internal server error. could not create connection.');

				//$Logger->log( 'our conn looks like this ' . print_r( $rs,1 ) );
				$connectionid = $rs->connection_id;
				
				$insertpermissionsquery = "INSERT INTO guacamole_connection_permission (user_id,connection_id,permission) VALUES ('{$mitrauserid}','{$connectionid}','READ')";
				$mitradb->query( $insertpermissionsquery );
			}

			//add mitra ID to our data in FriendDB... for easier connection later
			$args->args->data = str_replace(',"host":', ',"mitraid":"'. $connectionid .'","host":', $args->args->data);
			

			$SqlDatabase->query( 'UPDATE `FSetting` SET Data=\''. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data ) .'\' WHERE ID=\'' . $o->ID . '\' AND UserID = \''. intval( $User->ID ) .'\'' );


			//now we save the parameters... this list shoudl work across protocols... we start with SSH parameters though.
			$sep = '';
			$parameterquery = "INSERT INTO guacamole_connection_parameter (connection_id,parameter_name,parameter_value) VALUES ";
			if( isset( $connectiondata['user'] ) ) { $value = $connectiondata['user']; $parameterquery.= $sep . " ('{$connectionid}','username','{$value}')"; $sep = ', '; }
			if( isset( $connectiondata['pass'] ) ) { $value = $connectiondata['pass']; $parameterquery.= $sep . " ('{$connectionid}','password','{$value}')"; $sep = ', '; }
			if( isset( $connectiondata['host'] ) ) { $value = $connectiondata['host']; $parameterquery.= $sep . " ('{$connectionid}','hostname','{$value}')"; $sep = ', '; }
			if( isset( $connectiondata['port'] ) ) { $value = $connectiondata['port']; $parameterquery.= $sep . " ('{$connectionid}','port','{$value}')"; $sep = ', '; }
			if( isset( $connectiondata['key'] ) ) { $value = $connectiondata['key']; $parameterquery.= $sep . " ('{$connectionid}','private-key','{$value}')"; $sep = ', '; }
			if( isset( $connectiondata['keypass'] ) ) { $value = $connectiondata['keypass']; $parameterquery.= $sep . " ('{$connectionid}','passphrase','{$value}')"; $sep = ', '; }
			
			$Logger->log( 'insert all new paras..' . $parameterquery );
			$mitradb->query( $parameterquery );
			
			die('ok<!--separate-->[]');	
					
			break;
		
		case 'getuserconnectiondetails':
			if( !($args && $args->args && $args->args->id && $args->args->id != '' ) ) { die('fail<!--separate-->No connection requested. '); }
			
			$o = new dbIO( 'FSetting' );
			$o->UserID = intval( $User->ID );
			$o->Type = 'mitraapp';	
			$o->ID = intval( $args->args->id );
			if( $o->Load() )
			{
		
				$o2 = new dbIO( 'FSetting' );
				$o2->UserID = $User->ID;
				$o2->Type = 'mitra';
				$o2->Key = 'passhash';
				
				//users that once were created by an admin in the old scheme have a different password..
				if( $o2->Load() )
				{
					$username = 'mitra_' . $User->Name;
					$password = json_decode( $o2->Data );
				}
				else
				{
					$username = 'mitra_frienduser_' . $User->ID;
					$password = 'FRIENDID' . $User->ID;
				}
		
				$mitrahost = false;
				if( $row = $SqlDatabase->FetchObject( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'host' ORDER BY s.Key ASC;" )	)
				{
					$mitrahost = $row->Data;
				}
				if(!$mitrahost) die('fail<!--separate-->internal server error. mitra setup defunct.');
				
				connectMitraDb();
				
				$connectioname = intval( $User->ID ) .  '_' . $o->ID;
				$mitra_user_id = getMitraUser( $User->ID, $User->Name );
				if( !$mitra_user_id ) die('fail<!--separate-->could not verify user');

			
				$dataset = (object)array('username' => $username, 'password' => $password, 'host' => $mitrahost );
				
				die('ok<!--separate-->' . json_encode( $dataset ) );
			}
			die('fail<!--separate-->invalid request');
			break;
		
		case 'samlsync':

			//check for SAML integration
			if( isset( $args->args->samldata ) && $args->args->samldata )
			{
				die( checkMitraSAMLIntegration( $args->args->samldata ) );	
			}
			die('fail<!--separate-->invalid saml sync request');	

			break;
		
		default:
			die( 'ok<!--separate-->No known command given. Nothing to show here.');
			break;
		
	}
}
else
	die( 'ok<!--separate-->No command given. Nothing to show here.' );




/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
/*
	load and evt create a ssh connection for a mitra user...
*/
function getSSHConnection( $userid, $connectiondetails )
{
	global $mitradb, $SqlDatabase, $User, $Logger;

	/*
		A connection in guacamole is a construct spread across a couple of tables
		First we try to find a connection by the given parameters. If we dont get a match we create a new connection in the DB
		We use the connection key as a name to make it easier to clean up on changes form the users side.
	*/
	$Logger->log( 'getting mitra data' . $userid . ' :: ' .print_r( $connectiondetails,1 ) );
	
	return false;

}


/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
/*
	load and evt create a mitra user for a friend user
*/
function getMitraUser( $frienduserid, $friendusername, $createifnotexists )
{
	global $mitradb, $SqlDatabase, $User, $Logger;
	if( !$mitradb ) return;
	
	$findquery = 'SELECT gu.user_id FROM guacamole_user gu WHERE gu.username = \'mitra_'. mysqli_real_escape_string( $mitradb->_link, $friendusername ) .'\' OR gu.username = \'mitra_frienduser_'. intval( $frienduserid ) .'\'';
	
	if( $rs = $mitradb->fetchObject( $findquery ) ) { return $rs->user_id; }
	
	if( $createifnotexists )
	{
		mt_srand();
		$username = 'mitra_frienduser_' . $User->ID;
		$password = 'FRIENDID' . $User->ID;
		
		$saltquery = 'SET @salt = UNHEX(SHA2(UUID(), 256));';
		$insertquery = "INSERT INTO guacamole_user (username, password_salt, password_hash,password_date) VALUES ('{$username}', @salt, UNHEX(SHA2(CONCAT('{$password}', HEX(@salt)), 256)), NOW() );";

		
		$mitradb->query( $saltquery );
		$mitradb->query( $insertquery );
		if( $rs = $mitradb->fetchObject( $findquery ) )
		{
			$adminpermissions = ", ((SELECT MIN(user_id) FROM guacamole_system_permission WHERE permission = 'CREATE_USER'),'".$rs->user_id."','READ')";
			$adminpermissions.= ", ((SELECT MIN(user_id) FROM guacamole_system_permission WHERE permission = 'CREATE_USER'),'".$rs->user_id."','UPDATE')";
			$adminpermissions.= ", ((SELECT MIN(user_id) FROM guacamole_system_permission WHERE permission = 'CREATE_USER'),'".$rs->user_id."','DELETE')";
			$adminpermissions.= ", ((SELECT MIN(user_id) FROM guacamole_system_permission WHERE permission = 'CREATE_USER'),'".$rs->user_id."','ADMINISTER')";
			$permissionquery = "INSERT INTO guacamole_user_permission (`user_id`,`affected_user_id`,`permission`) VALUES ('".$rs->user_id."','".$rs->user_id."','READ') ". $adminpermissions;
			$mitradb->query( $permissionquery );

			return $rs->user_id;
		}
	}
	
	return false;
}

function checkMitraSAMLIntegration( $samldata )
{
	global $mitradb, $SqlDatabase, $User, $Logger;
	
	if( isset( $samldata->user ) )
	{
		//check if we have a saml user
		$Logger->log( $checksql );
		if( checkForSAMLUser() )
		{
			return 'ok<!--separate-->[]';
		}
		return 'fail<!--separate-->user is not saml user';
	}
		
	//check if user is member of SAML group	
	$Logger->log( gettype( $samldata ) );
	$Logger->log( print_r( $samldata, 1 ) );
	
}

/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
function checkForSAMLUser()
{
	global $User, $SqlDatabase;
		$checksql = 'SELECT fu.ID,fu.Name FROM FUser fu,FUserToGroup futg WHERE fu.ID = futg.UserID AND futg.UserGroupID IN (SELECT ID FROM FUserGroup WHERE `Name`="User" AND `Type` = "SAML" ) AND futg.UserID = "'. mysqli_real_escape_string( $SqlDatabase->_link, $User->ID ) .'"';
	if( $rs = $SqlDatabase->fetchObject( $checksql ) ) return true;
	
	return false;
	

}

/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
/*
	connect to our mitra database
*/
function connectMitraDb()
{
	global $mitradb, $SqlDatabase;

	$rs = $SqlDatabase->FetchRow( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'database';" );
	$settings = json_decode($rs['Data']);
	
	$mitradb = new SqlDatabase( );
	if( $mitradb->open(  $settings->host,$settings->username,$settings->password ) )
	{
		if( $mitradb->SelectDatabase( $settings->database ) )
		{
			return true;
		}
		else
			die('fail<!--separate-->Could find database '. $settings->database .'. Is your configuration correct?');
	}
	else
		die('fail<!--separate-->Could not connect to Mitra database at '. $settings->host .'. Is your configuration correct?');	
	
}

?>
