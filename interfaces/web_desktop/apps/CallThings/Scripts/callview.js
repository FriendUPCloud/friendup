/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

'use strict';

Application.run = fun;
function fun( msg, iface ) {
	new CallView( window.Application, msg, iface );
}

const CallView = function( app, msg, iface ) {
	console.log( 'CallView run', [ app, msg, iface ]);
	const self = this;
	self.app = app;
	
	self.init();
}

CallView.prototype.init = function() {
	const self = this;
	self.bind();
}

CallView.prototype.bind = function() {
	const self = this;
	self.modLib = ge( 'select_mod_lib' );
	self.execPath = ge( 'input_exec_path' );
	self.args = ge( 'ta_args' );
	
	self.resEl = ge( 'result_response' );
	self.dataEl = ge( 'result_data' );
	
	self.callBtn = ge( 'btn_call' );
	self.clearBtn = ge( 'btn_clear' );
	self.closeBtn = ge( 'btn_close' );
	
	self.callBtn.addEventListener( 'click', e => self.makeCall());
	self.clearBtn.addEventListener( 'click', e => self.clearInputs());
	self.closeBtn.addEventListener( 'click', e => self.closeWin());
}

CallView.prototype.makeCall = function() {
	const self = this;
	console.log( 'makeCall', [
		self.modLib.value,
		self.execPath.value,
		self.args.value,
	]);
	self.clearResult();
	const type = self.modLib.value;
	let path = self.execPath.value;
	path = cleanPath( path );
	if ( null == path ) {
		self.setError( self.execPath, true );
		return;
	}
	else
		self.setError( self.execPath, false );
	
	let args = self.args.value;
	if ( '' != args ) {
		try {
			//args = self.parseKV( args );
			args = JSON.parse( args );
		} catch( ex ) {
			console.log( 'invalid JSON', args );
			self.setError( self.args, true );
			return;
		}
	}
	
	self.setError( self.args, false );
	if ( 'library' == type )
		self.makeLibraryCall( path, args );
	if ( 'module' == type )
		self.makeModuleCall( path, args );
	
	function cleanPath( p ) {
		console.log( 'cleanPath', p );
		if ( !p.trim )
			return null;
		
		p = p.trim();
		if ( '' == p )
			return null;
		
		if ( '/' == p[ 0 ])
			p = p.slice( 1 );
		
		return p;
	}
}

CallView.prototype.clearInputs = function() {
	const self = this;
	console.log( 'clearInputs' );
	self.clearResult();
	self.execPath.value = '';
	self.args.value = '';
}

CallView.prototype.setError = function( el, show ) {
	const self = this;
	el.classList.toggle( 'input-error', show );
}

CallView.prototype.makeLibraryCall = async function( path, args ) {
	const self = this;
	console.log( 'makeLibCall', [ path, args ]);
	const req = new Library( 'system.library' );
	req.execute( path, args );
	req.onExecuted = ( r, d ) => {
		console.log( 'onExecuted', [ r, d ]);
		self.setResult( r , d );
	}
}

CallView.prototype.makeModuleCall = async function( path, args ) {
	const self = this;
	console.log( 'makeModCall', [ path, args ]);
	const req = new Module( 'system' );
	req.execute( path, args );
	req.onExecuted = ( r, d ) => {
		console.log( 'onExecuted', [ r, d ]);
		self.setResult( r, d );
	}
}

CallView.prototype.setResult = function( res, data ) {
	const self = this;
	console.log( 'setResult' );
	if ( '' == res )
		res = '""';
	if ( '' == data )
		data = '""';
	
	self.resEl.textContent = res;
	self.dataEl.textContent = data;
}

CallView.prototype.clearResult = function() {
	const self = this;
	self.resEl.textContent = '';
	self.dataEl.textContent = '';
}

/*
CallView.prototype.parseKV = function( inputStr ) {
	const self = this;
	console.log( 'parseKV', inputStr );
	const pairs = {};
	const lines = inputStr.split( ',' );
	console.log( 'lines', lines );
	lines.forEach( line => {
		const kv = line.split( ':' );
	});
}
*/

CallView.prototype.closeWin = function()
{
	const self = this;
	self.app.sendMessage( { command: 'quit' } );
}

