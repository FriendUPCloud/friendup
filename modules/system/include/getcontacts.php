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

global $SqlDatabase, $User, $Logger;

$search = '';

if( isset( $args->args->search ) )
{
	if( strstr( $args->args->search, ',' ) )
	{
		$keys = explode( ',', $args->args->search );
	}
	else
	{
		$keys = array( $args->args->search );
	}
	$search .= '(';
	$a = 0;
	
	foreach( $keys as $key )
	{
		$key = mysqli_real_escape_string( $SqlDatabase->_link, trim( $key ) );
		
		if( $a++ > 0 )
			$search .= ' OR ';
		$search .= '(';
		$search .= '`Firstname` LIKE "%' . $key . '%" OR ';
		$search .= '`Lastname` LIKE "%' . $key . '%" OR ';
		$search .= '`Company` LIKE "%' . $key . '%" OR ';
		$search .= '`Email` LIKE "%' . $key . '%"';
		$search .= ')';
	}
	$search .= ') AND ';
}

$query = 'SELECT * FROM FContact WHERE ' . $search . 'UserID=\'' . $User->ID . '\' ORDER BY Firstname ASC';

if( $rows = $SqlDatabase->fetchObjects( $query ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
else
{
	die( 'fail<!--separate-->{"response":-1,"message":"No such contacts exist."}' );
}


?>
