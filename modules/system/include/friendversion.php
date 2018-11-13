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
	
include_once('php/classes/friendversion.php');

$fv = new FriendVersion();

switch( $args->args->action )
{
	case 'updatetoversion':
		$ret = new stdClass();
		if($args->args && $args->args->number)
		{
			if( $fv->updateToVersion( $args->args->number ) )
			{
				$ret->result = 'Successfully updated to version ' . $args->args->number;
			}
			else
			{
				$ret->result = 'Update to version '. $args->args->number .'failed';
			}
		}
		else
		{
			$ret->result = 'Parameter for updatetoversion missing';
		}
		
		$tmp = new stdClass();
		$tmp->all = $fv->listAllVersions();
		$tmp->installed = $fv->listInstalledVersions();
		$ret->versionlistings = $tmp;
		
		die('ok<!--separate-->'. json_encode( $ret ) );
		break;
		
	
	case 'tolatest':
		$ret = new stdClass();
		if( $fv->updateAllVersions() )
		{
			$ret->result = 'Successfully updated to latest version.' ;
		}
		else
		{
			$ret->result = 'Update to latest version failed :(' ;	
		}
		
		
		$tmp = new stdClass();
		$tmp->all = $fv->listAllVersions();
		$tmp->installed = $fv->listInstalledVersions();
		$ret->versionlistings = $tmp;
		die('ok<!--separate-->'. json_encode( $ret ) );
		break;
	
	default:
	
		$ret = new stdClass();
		$ret->all = $fv->listAllVersions();
		$ret->installed = $fv->listInstalledVersions();
		
		die('ok<!--separate-->'. json_encode( $ret ) );		
		break;
	
}

die('fail<!--separate-->Why did we get here we wonder???');
	
?>
