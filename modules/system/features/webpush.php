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

if( !file_exists( 'cfg/crt/webpush_private_key.pem' ) )
{
	system( "openssl ecparam -genkey -name prime256v1 -out cfg/crt/webpush_private_key.pem" );
	system( "openssl ec -in cfg/crt/webpush_private_key.pem -pubout -outform DER|tail -c 65|base64|tr -d '=' |tr '/+' '_-' >> cfg/crt/webpush_public_key.txt" );
	system( "openssl ec -in cfg/crt/webpush_private_key.pem -outform DER|tail -c +8|head -c 32|base64|tr -d '=' |tr '/+' '_-' >> cfg/crt/webpush_private_key.txt" );
}

?>
