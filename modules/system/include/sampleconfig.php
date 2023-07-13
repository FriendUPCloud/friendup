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

$object = new stdClass();

$ie = $groupFeatureSet = $shareDriveSet = false;
$cnfsec = isset( $configfilesettings[ 'Security' ] ) ? $configfilesettings[ 'Security' ] : false;
if( $cnfsec )
{
    $ie = isset( $configfilesettings[ 'Security' ][ 'InvitesEnabled' ] ) && $configfilesettings[ 'Security' ][ 'InvitesEnabled' ];
    $groupFeatureSet = isset( $configfilesettings[ 'Security' ][ 'hasGroupsFeature' ] );
    $shareDriveSet = isset( $configfilesettings[ 'Security' ][ 'hasShareDrive' ] );
}
$jiniTheme = ( isset( $configfilesettings[ 'FriendCore' ] ) && isset( $configfilesettings[ 'FriendCore' ][ 'friendTheme' ] ));
$object->invitesEnabled = $ie;
if ( $groupFeatureSet )
	$object->hasGroupsFeature = $configfilesettings[ 'Security' ][ 'hasGroupsFeature' ] ? true : false;
if ( $shareDriveSet )
	$object->hasShareDrive = $configfilesettings[ 'Security' ][ 'hasShareDrive' ] ? true : false;	
if ( $jiniTheme )
	$object->friendTheme = $configfilesettings[ 'FriendCore' ][ 'friendTheme' ];

// Service initmodules to workspace
if( isset( $configfilesettings[ 'Security' ] ) && isset( $configfilesettings[ 'Security' ][ 'Initmodules' ] ) )
{
	$initmodules = explode( ',', $configfilesettings[ 'Security' ][ 'Initmodules' ] );
	if( count( $initmodules ) > 0 )
	{
		$object->initmodules = $initmodules;
		/*foreach( $initmodules as $mod )
		{
			$modPath = 'modules/' . $mod;
			if( file_exists( $modPath ) && is_dir( $modPath ) && file_exists( $modPath . '/preload.php' ) )
			{
				include_once( $modPath . '/preload.php' );
			}
		}*/
	}
}

die( 'ok<!--separate-->' . json_encode( $object ) );

?>
