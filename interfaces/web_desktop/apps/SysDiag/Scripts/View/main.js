/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var lib = window.lib || {};
lib.view = lib.view || {};

(function( ns, undefined ) {
	ns.Main = function( conf ) {
		var self = this;
		console.log( 'Main - fup conf', conf );
		self.init();
	}
	
	ns.Main.prototype.init = function() {
		var self = this;
		console.log( 'Main.init' );
		Application.receiveMsg = receiveMsg;
		function receiveMsg( e ) { self.receiveMsg( e ); }
	}
	
	ns.Main.prototype.receiveMsg = function( e ) {
		var self = this;
		console.log( 'Main.receiveMsg', e );
	}
	
})( lib.view );


Application.run = fun;
function fun( conf ) {
	console.log( 'main view' );
	window.sysdiagMainView = new lib.view.Main( conf );
}