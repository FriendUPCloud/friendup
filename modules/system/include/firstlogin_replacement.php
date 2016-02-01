<?php

// 2. Setup standard dock items
$dockItems = array(
	array( 'Dock', 'A simple dock desklet' ),
	array( 'Dingo', 'A command line interface' ),
	array( 'Artisan', 'A programmers editor' ),
	array( 'Author', 'A word processor' ),
	array( 'Wallpaper', 'Select a wallpaper' )
);
$i = 0;
foreach( $dockItems as $r )
{
	$d = new dbIO( 'DockItem' );
	$d->Application = $r[0];
	$d->ShortDescription = $r[1];
	$d->UserID = $User->ID;
	$d->SortOrder = $i++;
	$d->Parent = 0;
	$d->Save();
}

?>
