<?php

require_once( 'php/friend.php' );
require_once( 'php/classes/dbio.php' );

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



if( $level != 'Admin' ) die( 'fail<!--separate-->{"response":"unauthorized access to system settings"}' );



switch( $args->command )
{
	
	// read --------------------------------------------------------------------------------------------------------- //
	
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
				die( 'ok<!--separate-->noprinterfound' );
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
				die( 'ok<!--separate-->noprintersfound' );
			}
		}
		
		break;
	
	// write -------------------------------------------------------------------------------------------------------- //
	
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
		
		die( 'fail create' );
		
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
		
		die( 'fail update' );
		
		break;
		
	// delete ------------------------------------------------------------------------------------------------------- //
	
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
		
		die( 'fail remove' );
		
		break;
	
}

die( print_r( $args,1 ) . ' --' );

die( 'fail' );

?>
