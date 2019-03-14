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

global $Logger;

if( !isset( $args->args->theme ) )
{
	die( 'fail<!--separate-->{"response":"no theme set in theme call"}' );
}

$path = 'resources/webclient/theme/';
$theme = $args->args->theme;
// TODO: This is wrong..
if( $theme != 'default' )
	$path = 'resources/themes/' . $theme . '/';

include_once( 'modules/system/include/cssparser.php' );

ParseCssFile( $path );

die( 'fail<!--separate-->{"response":"fatal error in theme"}' );

?>
