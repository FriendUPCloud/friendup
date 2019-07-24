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

require_once( 'php/friend.php' );
require_once( 'php/classes/dbio.php' );
require_once( 'php/classes/file.php' );

// Get user level
if( $level = $SqlDatabase->FetchObject( '
	SELECT g.Name FROM FUserGroup g, FUserToGroup ug
	WHERE
		g.Type = \'Level\' AND
		ug.UserID=\'' . $User->ID . '\' AND
		ug.UserGroupID = g.ID
' ) )
{
	$level = $level->Name;
}
else $level = false;

// User level ------------------------------------------------------------------

switch( $args->command )
{
	case 'listprinters':
		// TODO: Apply user permissions
		if( isset( $args->args->id ) )
		{
			if( $row = $SqlDatabase->FetchObject( '
				SELECT `ID`, `Data` 
				FROM FSetting 
				WHERE `UserID` = "0" AND `Type` = "system" AND `Key` = "printer" AND ID = "' . $args->args->id . '"
				ORDER BY `ID` ASC 
			' ) )
			{
				$d = json_decode( $row->Data );
				$d->id = $row->ID;
				die( 'ok<!--separate-->' . json_encode( $d ) );
			}
			else
			{
				die( 'fail<!--separate-->{"response":-1,"message":"No printer found"}' );
			}
		}
		// TODO: Apply user permissions
		else
		{
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT `ID`, `Data` 
				FROM FSetting 
				WHERE `UserID` = "0" AND `Type` = "system" AND `Key` = "printer" 
				ORDER BY `ID` ASC 
			' ) )
			{
				$out = [];
				foreach( $rows as $row )
				{
					$o = json_decode( $row->Data );
					$o->id = $row->ID;
					$out[] = $o;
				}
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			else
			{
				die( 'fail<!--separate-->{"response":-1,"message":"No printers found"}' );
			}
		}
		break;
	case 'print':
		// Find by driver
		if( isset( $args->args->id ) )
		{
			// Get printer config
			if( $row = $SqlDatabase->FetchObject( '
				SELECT `ID`, `Data` 
				FROM FSetting 
				WHERE `UserID` = "0" AND `Type` = "system" AND `Key` = "printer" AND ID = "' . intval( $args->args->id, 10 ) . '"
				ORDER BY `ID` ASC 
			' ) )
			{
				$conf = json_decode( $row->Data );
				if( $conf )
				{
					// Do the printing!
					if( file_exists( 'modules/print/drivers/' . $conf->type . '.php' ) )
					{
						require( 'modules/print/drivers/' . $conf->type . '.php' );
					}
				}
			}
			
			die( 'fail<!--separate-->{"response":-1,"message":"Could not find printer driver."}' );
		}
		die( 'fail<!--separate-->{"response":-1,"message":"Failed to contact printer."}' );
		break;
	case 'status':
		break;
}

// Admin level -----------------------------------------------------------------
// TODO: Add permission checker
if( $level == 'Admin' )
{

	switch( $args->command )
	{
	
		// read ----------------------------------------------------------------- //
	
		case 'list': 
		
			if( isset( $args->args->id ) )
			{
				if( $row = $SqlDatabase->FetchObject( '
					SELECT `ID`, `Data` 
					FROM FSetting 
					WHERE `UserID` = "0" AND `Type` = "system" AND `Key` = "printer" AND ID = "' . $args->args->id . '"
					ORDER BY `ID` ASC 
				' ) )
				{
					die( 'ok<!--separate-->' . json_encode( $row ) );
				}
				else
				{
					die( 'fail<!--separate-->{"response":-1,"message":"No printer found"}' );
				}
			}
			else
			{
				if( $rows = $SqlDatabase->FetchObjects( '
					SELECT `ID`, `Data` 
					FROM FSetting 
					WHERE `UserID` = "0" AND `Type` = "system" AND `Key` = "printer" 
					ORDER BY `ID` ASC 
				' ) )
				{
					die( 'ok<!--separate-->' . json_encode( $rows ) );
				}
				else
				{
					die( 'fail<!--separate-->{"response":-1,"message":"No printers found"}' );
				}
			}
		
			break;
	
		// write ---------------------------------------------------------------- //
	
		case 'create':
		
			if( $args->args->data )
			{
				$o = new dbIO( 'FSetting' );
				$o->UserID = 0;
				$o->Type = 'system';
				$o->Key = 'printer';
				$o->Data = json_encode( $args->args->data );
				$o->Save();
			
				die( 'ok<!--separate-->' . $o->ID );
			}
		
			die( 'fail<!--separate-->{"response":-1,"message":"Could not create printer"}' );
		
			break;
	
		case 'update':
		
			if( $args->args->id && $args->args->data )
			{
				$o = new dbIO( 'FSetting' );
				$o->ID = $args->args->id;
				$o->UserID = 0;
				$o->Type = 'system';
				$o->Key = 'printer';
				if( $o->Load() )
				{
					$id = $o->ID;
					$o->Data = json_encode( $args->args->data );
					$o->Save();
				
					die( 'ok<!--separate-->' . $o->ID );
				}
			}
		
			die( 'fail<!--separate-->{"response":-1,"message":"Could not update printer"}' );
		
			break;
		
		// delete --------------------------------------------------------------- //
	
		case 'remove':
		
			if( $args->args->id )
			{
				$o = new dbIO( 'FSetting' );
				$o->ID = $args->args->id;
				$o->UserID = 0;
				$o->Type = 'system';
				$o->Key = 'printer';
				if( $o->Load() )
				{
					$id = $o->ID;
					$o->Delete();
				
					die( 'ok<!--separate-->' . $id );
				}
			}
		
			die( 'fail<!--separate-->{"response":-1,"message":"Could not remove printer"}' );
		
			break;
	
	}
}

//die( print_r( $args,1 ) . ' --' );

die( 'fail' );

?>
