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
$hgf = isset( $configfilesettings[ 'Security' ] ) && $configfilesettings[ 'Security' ][ 'hasGroupsFeature' ] ? true : false;
$object->invitesEnabled = $ie;
$object->hasGroupsFeature = $hgf;

die( 'ok<!--separate-->' . json_encode( $object ) );

?>
