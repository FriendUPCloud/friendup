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
			else
			{
				$obj->startups = [];
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
