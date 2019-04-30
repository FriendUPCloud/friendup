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

if( isset( $args->args->publickey ) )
{
	$d = new dbIO( 'FUser' );
	if( $d->Load( $User->ID ) )
	{
		$d->PublicKey = $args->args->publickey;
		$d->Save();
		die( 'ok<!--separate-->{"response":1,"message":"Public key for user was updated."}' );
	}
}

die( 'fail<!--separate-->{"response":-1,"message":"Could not find public key or user."}' );

?>
