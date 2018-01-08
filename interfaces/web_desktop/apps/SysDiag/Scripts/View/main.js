/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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