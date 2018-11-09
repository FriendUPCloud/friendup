'use strict';

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

const log = require( './component/Log' )( 'fnet' );
const conf = require( './component/Config' ); // not really bothering with saving the obj,
                                              // it writes itself to global.config
const fcReq = require( './component/FCRequest' )( global.config.server.friendcore );
const Hub = require( './component/Hub' );
const NML = require( './component/NoMansLand' );

log( 'conf', conf, 4 );

var fnet = {
	conn  : null,
	hub   : new Hub(),
};

fnet.conn = new NML( fcReq, fnet.hub );

