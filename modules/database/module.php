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

// Create a new database object
$ModuleDatabase = new SqlDatabase();
register_shutdown_function( function()
{
	global $ModuleDatabase;
	$ModuleDatabase->close();
} );

// TODO: Add security!!
function encapsulateValue( $v )
{
	global $ModuleDatabase;
	return mysqli_real_escape_string( $ModuleDatabase->_link, $v );
}

if( isset( $args->command ) )
{
	if( !isset( $args->args->options ) )
	{
		die( 'fail<!--separate-->{"message":"You forgot to supply database options."}' );
	}

	$options = $args->args->options;
	
	if( !isset( $options->hostname ) )
		die( 'fail<!--separate-->{"message":"You need to connect to a valid hostname."}' );
	
	// TODO: Reenable when tested for security!
	if( $level != 'Admin' )
	{
		die( 'fail<!--separate-->{"message":"You need to connect to a valid hostname."}' );
	}
	if( $level != 'Admin' && ( substr( $options->hostname, 0, 9 ) == 'localhost' || substr( $options->hostname, 0, 4 ) == '127.' ) )
	{
		die( 'fail<!--separate-->{"message":"You need to connect to a valid hostname."}' );
	}
	
	if( $args->command == 'open' || $args->command == 'find' )
	{
		if( !$ModuleDatabase->Open( $options->hostname, $options->username, $options->password ) )
			die( 'fail<!--separate-->{"message":"Could not connect to database."}' );
		$ModuleDatabase->SelectDatabase( $options->database );
		
		// Leave it there when it's open!
		if( $args->command == 'open' )
		{
			die( 'ok<!--separate-->{"message":"Database connected successfully."}' );
		}
	}
	if( $args->command == 'find' )
	{
		$def = $args->args->definition;
		if( !isset( $def->table ) )
		{
			die( 'fail<!--separate-->{"message":"No table selected."}' );
		}
		if( !isset( $def->definition ) )
		{
			die( 'fail<!--separate-->{"message":"Please supply a definition."}' );
		}
		
		// Parse definition
		$definition = [];
		foreach( $def->definition as $k=>$v )
		{
			$vl = strlen( $v );
			$mod = 0;
			$sign = '';
			$value = null;
			
			for( $a = 0; $a < $vl; $a++ )
			{
				if( $mod == 0 && $v[$a] != ' ' )
				{
					$sign .= $v[$a];
				}
				else if( $mod == 0 && $v[$a] == ' ' )
				{
					$mod = 1;
					$value = '';
				}
				else if( $mod == 1 )
				{
					$value .= $v[$a];
				}
			}
			
			if( !isset( $value ) || !$sign )
				die( 'fail<!--separate-->{"message":"You supplied an invalid definition."}' );
			
			if( $sign != '=' && $sign != '<' && $sign != '==' && $sign != '>' && $sign != 'LIKE' )
			{
				die( 'fail<!--separate-->{"message":"You supplied an invalid sign."}' );
			}
			
			$definition[] = 't.' . $k . ' ' . $sign . ' ' . encapsulateValue( $value );
		}
		$definition = implode( ' AND ', $definition );
		$extra = '';
		if( $rows = $ModuleDatabase->FetchObjects( $q = ( 'SELECT * FROM `' . $def->table . '` t WHERE ' . $definition . $extra ) ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"Your query yielded no results."}' );
	}
	die( 'fail<!--separate-->{"message":"Unknown command given."}' );
}

die( 'fail<!--separate-->{"message":"No command given."}' );

?>
