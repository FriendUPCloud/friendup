<?php

if( !isset( $args->args->setup ) )
{
	die( 'fail<!--separate-->{"message":"Unknown setup directive."}' );
}

// Create a default setup
if( $args->args->setup == 'defaults' )
{
	// 1. Set theme to Friend12
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'theme';
	$o->Load();
	$o->Data = getDefaultTheme();
	$o->Save();
	// 2. Set Dock to window list on the bottom of the screen
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'windowlist';
	$o->Load();
	$o->Data = 'dockedlist';
	$o->Save();
	// 3. Set window manager options
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'focusmode';
	$o->Load();
	$o->Data = 'clicktofront';
	$o->Save();
	// 4. Set default browsing mode (file manager)
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'navigationmode';
	$o->Load();
	$o->Data = 'browser';
	$o->Save();
	// 5. Set menu mode
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'menumode';
	$o->Load();
	$o->Data = 'pear';
	$o->Save();
	// 5. Set menu mode
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'workspacecount';
	$o->Load();
	$o->Data = '1';
	$o->Save();
	// 6. Do not hide the system
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'hiddensystem';
	$o->Load();
	$o->Data = 'false';
	$o->Save();
	// 7. Do not scroll desktop icons (on the main desktop)
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'scrolldesktopicons';
	$o->Load();
	$o->Data = '0';
	$o->Save();
	
	// 8. Finally, say that we run the wizard
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'wizardrun';
	$o->Load();
	$o->Data = '1';
	$o->Save();
	
	// All done!
	die( 'ok<!--separate-->{"message":"Defaults set"}' );
}
else if( $args->args->setup == 'custom' )
{
	// 8. Finally, say that we run the wizard
	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'system';
	$o->Key = 'wizardrun';
	$o->Load();
	$o->Data = '1';
	$o->Save();
	
	// All done!
	die( 'ok<!--separate-->{"message":"Custom set"}' );
}

die( 'fail<!--separate-->{"message":"Unknown setup"}' );

?>
