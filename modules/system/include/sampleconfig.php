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

$ie = isset( $configfilesettings[ 'Security' ] ) && $configfilesettings[ 'Security' ][ 'InvitesEnabled' ] ? true : false;
$groupFeatureSet = ( isset( $configfilesettings[ 'Security' ] ) && isset( $configfilesettings[ 'Security' ][ 'hasGroupsFeature' ] ));
$object->invitesEnabled = $ie;
if ( $groupFeatureSet )
	$object->hasGroupsFeature = $configfilesettings[ 'Security' ][ 'hasGroupsFeature' ] ? true : false;

// Service initmodules to workspace
if( isset( $configfilesettings[ 'Security' ] ) && $configfilesettings[ 'Security' ][ 'Initmodules' ] )
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
