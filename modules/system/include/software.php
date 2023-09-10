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

global $SqlDatabase, $Config, $User;

$mode = false;
if( isset( $args->args->mode ) )
	$mode = $args->args->mode;



if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) ) 
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 
		'PERM_APPLICATION_READ_GLOBAL', 'PERM_APPLICATION_READ_IN_WORKGROUP', 
		'PERM_APPLICATION_GLOBAL',      'PERM_APPLICATION_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
			
			if( $perm->response == -1 )
			{
				//
				
				
			}
			
			// Permission granted. GLOBAL or WORKGROUP specific ...
			
			if( $perm->response == 1 )
			{
				//
				
				$level = 'Admin';
			}
		}
	}
}



// Fetch installed applications
$installed = $SqlDatabase->fetchObjects( 'SELECT * FROM FApplication WHERE UserID=\'' . $User->ID . '\'' );
$byName = [];
foreach( $installed as $inst )
{
	$byName[ $inst->Name ] = $inst;
}
unset( $installed );

// Get visible apps
$metadata = false;
if( $metadata = $SqlDatabase->fetchObjects( 'SELECT * FROM FMetaData WHERE `Key` LIKE "application_%" AND `ValueString` = "Visible" && `ValueNumber`=\'1\'' ) )
{
	$m = new stdClass();
	foreach( $metadata as $me )
	{
		$k = explode( 'application_', $me->Key );
		$m->{$k[1]} = $me->ValueNumber;
	}
	$metadata = $m;
	unset( $m );
}

// Get workgroup setups
if( $mode == 'global_permissions' )
{
	$wsql = 'SELECT * FROM FMetaData WHERE `Key` LIKE "workgroup_application_%" AND `ValueNumber`=\'0\'';
}
/*else
{
	$wsql = 'SELECT * FROM FMetaData WHERE `Key` LIKE "workgroup_application_%" AND `ValueNumber`=\'' . $User->ID . '\'';
}*/

$organizedWorkgroups = array();

if( isset( $wsql ) && $wgroupdata = $SqlDatabase->fetchObjects( $wsql ) )
{
	if( $mode == 'global_permissions' )
	{
		foreach( $wgroupdata as $wd )
		{
			if( $appName = preg_match( $wd->Key, '/workgroup\_application\_(*?)/i' ) )
			{
				$organizedWorkgroups[ $appName[1] ] = $wd->ValueString;
			}
		}
	}
}

// Fetch locally available software
$apps = [];
$paths = [ 'resources/webclient/apps/', 'repository/' ];

if( isset( $args->args->type ) )
{
	if( $args->args->type == 'repository' )
	{
		$paths = [ 'repository/' ];
	}
}
foreach( $paths as $path )
{
	if( $dir = opendir( $path ) )
	{
		while( $file = readdir( $dir ) )
		{
			if( $file{0} == '.' ) continue;
		
			// For repositories
			if( file_exists( $path . $file . '/Signature.sig' ) )
			{
				if( !( $d = file_get_contents( 'repository/' . $file . '/Signature.sig' ) ) )
					continue;
				if( !( $js = json_decode( $d ) ) )
					continue;
				if( !isset( $js->validated ) )
					continue;
			}

			if( !file_exists( $path . $file . '/Config.conf' ) )
				continue;
			
			
			$f = json_decode( file_get_contents( $path . $file . '/Config.conf' ) );
			if( !$f ) continue;
			if( $mode != 'showall' && isset( $f->HideInCatalog ) && $f->HideInCatalog == 'yes' ) continue;
			
		
			$o = new stdClass();
			$o->Name = str_replace( '_', ' ', $file );
			//if( ( !$metadata || !isset( $metadata->{$o->Name} ) ) && $level != 'Admin' ) continue;
			$o->Preview = file_exists( $path . $file . '/preview.png' ) ? true : false;
			$o->Category = $f->Category;
			$o->Description = isset( $f->Description ) ? $f->Description : '';
			$stat = stat( $path . $file . '/Config.conf' );
			$o->DateModifiedUnix = $stat[9];
			$o->DateModified = date( 'Y-m-d H:i:s', $stat[9] );
			$o->Visible = isset( $f->Visible ) == 'true' ? true : false;
			
			// If this application is associated with a workgroup
			$o->Workgroups = isset( $organizedWorkgroups[ $file ] ) ? $organizedWorkgroups[ $file ] : '';
		
			if( isset( $byName[ $o->Name ] ) )
			{
				$o->Installed = true;
			}
		
			$apps[] = $o;
		}
		closedir( $dir );
	}
}

// Sorting
$byName = [];
foreach( $apps as $a )
{
	$byName[ $a->Name ] = $a;
}
ksort( $byName );
$apps = [];
foreach( $byName as $k=>$v )
	$apps[] = $v;

die( 'ok<!--separate-->' . json_encode( $apps ) );

?>
