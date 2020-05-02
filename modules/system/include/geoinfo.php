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

$lang = 'en';

if( isset( $args->args->get ) )
{
	switch( $args->args->get )
	{
		// Get countries - localized if possible
		case 'countries':
			if( isset( $args->args->lang ) && file_exists( 'modules/system/assets/countries.' . $args->args->lang . '.lang' ) )
			{
				$cnt = file_get_contents( 'modules/system/assets/countries.' . $args->args->lang . '.lang' );
			}
			else
			{
				$cnt = file_get_contents( 'modules/system/assets/countries.' . $lang . '.lang' );
			}
			$cnt = explode( "\n", $cnt );
			$std = array();
			foreach( $cnt as $k )
			{
				$k = explode( ':', $k );
				$cl = new stdClass();
				$cl->Key = trim( $k[0] );
				$cl->Value = trim( $k[1] );
				$std[] =$cl;
			}
			die( 'ok<!--separate-->' . json_encode( $std ) );
			break;
	}
}
die( 'fail<!--separate-->' );

?>
