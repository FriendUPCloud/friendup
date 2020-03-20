<?php

$s = new dbIO( 'FSetting' );
$s->UserID = $User->ID;
$s->Type = 'system';
$s->Key = 'friendversion';
if( $s->load() )
{
	die( 'ok<!--separate-->{"response":"2","message":"Already at current version."}' );
}

// We need to upgrade - NOW version 1.2rc1
$s->Data = 'v1.2rc1';
$s->save();
if( $s->ID > 0 )
{
	// No go set the updated settings
	
	// Workspace count
	$vc = new dbIO( 'FSetting' );
	$vc->UserID = $User->ID;
	$vc->Type = 'system';
	$vc->Key = 'workspacecount';
	if( !$vc->load() )
		$vc->Data = 0;
	$vc->save();
	
	// Navigation mode
	$vc = new dbIO( 'FSetting' );
	$vc->UserID = $User->ID;
	$vc->Type = 'system';
	$vc->Key = 'navigationmode';
	$vc->load();
	$vc->Data = 'browser';
	$vc->save();
	
	// Menu mode
	$vc = new dbIO( 'FSetting' );
	$vc->UserID = $User->ID;
	$vc->Type = 'system';
	$vc->Key = 'menumode';
	$vc->load();
	$vc->Data = 'pear';
	$vc->save();
	
	// Navigation mode
	$vc = new dbIO( 'FSetting' );
	$vc->UserID = $User->ID;
	$vc->Type = 'system';
	$vc->Key = 'focusmode';
	$vc->load();
	$vc->Data = 'clicktofront';
	$vc->save();
	
	// Dock mode
	$vc = new dbIO( 'FSetting' );
	$vc->UserID = $User->ID;
	$vc->Type = 'system';
	$vc->Key = 'windowlist';
	$vc->load();
	$vc->Data = 'dockedlist';
	$vc->save();
	
	// Theme
	$vc = new dbIO( 'FSetting' );
	$vc->UserID = $User->ID;
	$vc->Type = 'system';
	$vc->Key = 'theme';
	$vc->load();
	$vc->Data = 'friendup12';
	$vc->save();

	// Dock
	$dc = new dbIO( 'DockItem' );
	$dc->UserID = $User->ID;
	$dc->Type = 'Dock';
	$dc->load();
	$dc->ShortDescription = '{"options":{"position":"aligned","layout":"bottom_center","size":32,"dockx":"0","docky":"0","workspace":"1"}}';
	$dc->save();
	
	// Remove dock configuration
	if( $row = $SqlDatabase->fetchObject( '
		SELECT f.ID AS FID, ua.ID AS UID FROM FUserApplication ua, FApplication f 
		WHERE 
			f.Name="Dock" AND f.ID = ua.ApplicationID AND 
			ua.UserID = \'' . $User->ID . '\';
	' ) )
	{
		$SqlDatabase->query( 'DELETE FROM FApplication WHERE ID=\'' . $row->FID . '\'' );
		$SqlDatabase->query( 'DELETE FROM FUserApplication WHERE ID=\'' . $row->UID . '\'' );
	}

	die( 'ok<!--separate-->{"response":"1","message":"You are upgraded.","version":"' . $s->Data . '"}' );
}

die( 'fail<!--separate-->{"response":"0","message":"Could not find current Friend information."}' );

?>
