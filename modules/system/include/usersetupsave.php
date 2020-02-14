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
	if( isset( $args->args->Name ) )
	{
		$c = new dbIO( 'FUserGroup' );
		$c->Name = $args->args->Name;
		if( $c->Load() && $c->ID != $args->args->id )
		{
			die( 'fail<!--separate-->{"response":"Template with that name already exist"}'  );
		}
	}
	
	// Get the fusergroup object
	$o = new dbIO( 'FUserGroup' );
	$o->ID = $args->args->id;
	if( $o->Load() )
	{
		if( isset( $args->args->Description ) )
		{
			$o->Description = $args->args->Description;
		}
		
		if( isset( $args->args->Name ) )
		{
			$o->Name = $args->args->Name;
			$o->Save();
		}
		
		// Insert settings
		if( $o->ID > 0 )
		{
			$obj = new stdClass();
			
			$s = new dbIO( 'FSetting' );
			$s->UserID = $args->args->id;
			$s->Type = 'setup';
			$s->Key = 'usergroup';
			$s->Load();
			
			if( $s->Data )
			{
				if( $json = json_decode( $s->Data ) )
				{
					$obj = $json;
				}
			}
			
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
			
			if ( isset( $args->args->Applications ) )
			{
				$obj->software = array();
				
				if( $args->args->Applications )
				{
					$arr = explode( ',', $args->args->Applications );
				
					foreach( $arr as $a )
					{
						$o = explode( '_', $a );
					
						$obj->software[] = array( trim( $o[0] ), trim( $o[1] ) );
					}
				}
			}
			
			if ( isset( $args->args->Startup ) )
			{
				$obj->startups = array();
				
				if( $args->args->Startup )
				{
					$arr = explode( ',', $args->args->Startup );
					
					foreach( $arr as $a )
					{
						$obj->startups[] = trim( $a );
					}
				}
			}
			
			if( isset( $args->args->Preinstall ) )
			{
				$obj->preinstall = $args->args->Preinstall;
			}
			if( isset( $args->args->Languages ) )
			{
				$obj->language = $args->args->Languages;
			}
			if( isset( $args->args->Themes ) )
			{
				$obj->theme = $args->args->Themes;
			}
			
			if( isset( $args->args->ThemeConfig ) )
			{
				$obj->themeconfig = $args->args->ThemeConfig;
			}
			
			if( isset( $args->args->WorkspaceCount ) )
			{
				$obj->workspacecount = $args->args->WorkspaceCount;
			}
			
			if ( $data = json_encode( $obj ) )
			{
				if( $data )
				{
					$s->Data = $data;
					$s->Save();
				}
				
				//die( print_r( print_r( $args->args,1 ) . ' -- ' ) . ' [] ' . $data . ' || ' . $args->args->id . ' [] ' . $s->ID );
				
				die( 'ok<!--separate-->' . $args->args->id );
			}
		}
	}
}
die( 'fail' );

?>
