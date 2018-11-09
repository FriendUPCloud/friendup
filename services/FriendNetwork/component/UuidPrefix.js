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


var log = require( './Log' )( 'Uuid-prefix' );
var uuid = require( 'uuid' );
var ns = {};

ns.UuidPrefix = function( prefix ) {
	if ( !( this instanceof ns.UuidPrefix ))
		return new ns.UuidPrefix( prefix );
	
	const self = this;
	self.prefix = prefix || 'id';
}

ns.UuidPrefix.prototype.get = function( prefix ) {
	const self = this;
	return self.v4( prefix );
}

ns.UuidPrefix.prototype.v1 = function( prefix ) {
	const self = this;
	var prefix = prefix || self.prefix;
	return prefix + '-' + uuid.v1();
}

ns.UuidPrefix.prototype.v4 = function( prefix ) {
	const self = this;
	var prefix = prefix || self.prefix;
	return prefix + '-' + uuid.v4();
}

module.exports = ns.UuidPrefix;
