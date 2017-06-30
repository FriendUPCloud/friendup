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

/*
	listens on ws for progress events from a specified FC processes
	- processId: id to listen for on ws
	- conn: ws connection
*/

Progress = function( processId, conn )
{
	var self = this;
	self.pId = processId;
	self.conn = conn;
	
	self.appSubs = [];
	self.workspaceSubs = [];
	self.init();
}

// Public

/*
	applications registered will receive a postMessage with progesss events
*/
Progress.prototype.registerApp = function( appObj )
{
	var self = this;
	self.appSubs.push( appobj );
}

/*
	listeners will receive progress events
*/
Progress.prototype.registerListener = function( listener )
{
	var self = this;
	self.workspaceSubs.push( listener );
}

/*
	Detaches from the ws connection and releases all subscribers
*/
Progress.prototype.close = function()
{
	console.log( 'Progress.close' );
	var self = this;
	if ( self.handlerId )
		self.conn.off( self.handlerId );
	
	delete self.pId;
	delete self.conn;
	delete self.appSubs;
	delete self.workspaceSubs;
}

// Private

Progress.prototype.init = function()
{
	var self = this;
	console.log( 'Progress.init' );
	if ( !self.pId || !self.conn )
	{
		console.log( 'Progress - missing inputs', {
			pId : self.pId,
			conn : self.conn,
		});
		throw new Error( 'Progress - missing inputs' );
	}
	
	self.handlerId = self.conn.on( self.pId, handle );
	function handle( event ) { self.handle( event ); }
}

Progress.prototype.handle = function( event )
{
	var self = this;
	console.log( 'Progress.handle', event );
	self.appSubs.forEach( toApp );
	self.workspaceSubs.forEach( toListener );
	
	function toApp( app )
	{
		var wrap = {
			type : self.pId,
			data : event,
		};
		app.contentWindow.postMessage( wrap, '*' );
	}
	
	function toListener( fn )
	{
		fn( event );
	}
}

