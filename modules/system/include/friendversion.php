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
