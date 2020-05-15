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

if( $level == 'Admin' )
{
	// Get the fusergroup object
	$o = new dbIO( 'FUserGroup' );
	$o->Type = 'Setup';
	$o->Name = ( $args->args->Name ? $args->args->Name : 'Unnamed setup' );
	if( isset( $args->args->Description ) )
	{
		$o->Description = $args->args->Description;
	}
	if( isset( $args->args->Name ) && $o->Load() )
	{
		die( 'fail<!--separate-->{"response":"Template with that name already exist"}'  );
	}
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
			array( 'Calculator', '1' )
		);
		
		//$obj->disks = array(
		//	array( 'Home', 'Sqldrive' )
		//);
		
		//$obj->startups = array(
		//	'launch Dingo'				   
		//);
		
		$obj->language = ( isset( $args->args->Languages ) ? $args->args->Languages : 'en' );
		
		$obj->theme = ( isset( $args->args->Themes ) ? $args->args->Themes : 'Friendup12' );
		
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
