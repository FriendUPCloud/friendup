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

if( $level == 'Admin' )
{
	// Get the fusergroup object
	$o = new dbIO( 'FUserGroup' );
	$o->Type = 'Setup';
	$o->Name = ( $args->args->Name ? $args->args->Name : 'Unnamed setup' );
	$o->Save();
	
	// Insert settings
	if( $o->ID > 0 )
	{
		$obj = new stdClass();
		
		$obj->preinstall = '1';
		
		$obj->software = array(
			array( 'Dock', '1' ),
			array( 'Dingo', '1' ),
			array( 'FriendChat', '1' ),
			array( 'FriendCreate', '1' ),
			array( 'Author', '1' ),
			array( 'Wallpaper', '1' ),
			array( 'Astray', '1' ),
			array( 'Calculator', '1' )
		);
		
		//$obj->disks = array(
		//	array( 'Home', 'Sqldrive' )
		//);
		
		//$obj->startups = array(
		//	'launch Dingo'				   
		//);
		
		$obj->language = 'en';
		
		$obj->theme = 'Friendup';
		
		//$obj->folders = array(
		//	'Wallpaper',
		//	'Documents',
		//	'Code examples'
		//);
		
		//$obj->wallpapers = array(
		//	'wp_beach',
		//	'wp_microscope',
		//	'wp_morerocks',
		//	'wp_mountains',
		//	'wp_omnious',
		//	'wp_rocks',
		//	'wp_coffee'
		//);
		
		//$obj->files = array(
		//	'ExampleWindow.jsx',
		//	'Template.html'
		//);
		
		//$obj->default = 'wp_coffee';
		
		if ( $data = json_encode( $obj ) )
		{
			$s = new dbIO( 'FSetting' );
			$s->UserID = $o->ID;
			$s->Type = 'setup';
			$s->Key = 'usergroup';
			$s->Load();
			$s->Data = $data;
			$s->Save();
			
			die( 'ok<!--separate-->' . $o->ID );
		}
	}
}
die( 'fail' );

?>
