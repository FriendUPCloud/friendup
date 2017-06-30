<?php
/*©lpgl*************************************************************************
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


if( $level == 'Admin' && $args->args->id > 0 )
{
	// Get the fusergroup object
	$o = new dbIO( 'FUserGroup' );
	$o->ID = $args->args->id;
	if( $o->Load() )
	{
		$o->Name = $args->args->Name;
		$o->Save();
		
		// Insert settings
		if( $o->ID > 0 )
		{
			$obj = new stdClass();
			
			/*$obj->apps = array(
				array( 'Dock', 'A simple dock desklet' ),
				array( 'Dingo', 'A command line interface' ),
				array( 'FriendChat', 'A chat client' ),
				array( 'FriendCreate', 'A programmers editor' ),
				array( 'Author', 'A word processor' ),
				array( 'Wallpaper', 'Select a wallpaper' ),
				array( 'Astray', 'Play a game' ),
				array( 'Calculator', 'Do some math' )
			);
			
			$obj->disks = array(
				array( 'Home', 'My data volume' )
			);
			
			$obj->folders = array(
				'Wallpaper',
				'Documents',
				'Code examples'
			);
			
			$obj->wallpapers = array(
				'wp_beach',
				'wp_microscope',
				'wp_morerocks',
				'wp_mountains',
				'wp_omnious',
				'wp_rocks',
				'wp_coffee'
			);
			
			$obj->files = array(
				'ExampleWindow.jsx',
				'Template.html'
			);
			
			$obj->default = 'wp_coffee';*/
			
			if ( $args->args->Applications )
			{
				$obj->software = array();
				
				$arr = explode( ',', $args->args->Applications );
				
				foreach( $arr as $a )
				{
					$o = explode( '_', $a );
					
					$obj->software[] = array( trim( $o[0] ), trim( $o[1] ) );
				}
			}
			
			if ( $args->args->Startup )
			{
				$obj->startups = array();
				
				$arr = explode( ',', $args->args->Startup );
				
				foreach( $arr as $a )
				{
					$obj->startups[] = trim( $a );
				}
			}
			
			$obj->preinstall = $args->args->Preinstall;
			$obj->language = $args->args->Languages;
			$obj->theme = $args->args->Themes;
			
			if ( $data = json_encode( $obj ) )
			{
				$s = new dbIO( 'FSetting' );
				$s->UserID = $args->args->id;
				$s->Type = 'setup';
				$s->Key = 'usergroup';
				$s->Load();
				$s->Data = $data;
				$s->Save();
				
				//die( print_r( print_r( $args->args,1 ) . ' -- ' ) . ' [] ' . $data . ' || ' . $args->args->id . ' [] ' . $s->ID );
				
				die( 'ok<!--separate-->' . $args->args->id );
			}
		}
	}
}
die( 'fail' );

?>
