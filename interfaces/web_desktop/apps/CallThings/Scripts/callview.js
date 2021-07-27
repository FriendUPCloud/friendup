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
	self.moduleName = ge( 'module_name' );
	self.modNameWrap = ge( 'mod_name_wrap' );
	self.getUserInfoBtn = ge( 'user_info_get' );
	self.tokenAuthId = ge( 'token_auth_id' );
	self.tokenServerToken = ge( 'token_server_token' );
	self.tokenSessionId = ge( 'token_session_id' );
	self.execPath = ge( 'input_exec_path' );
	self.args = ge( 'ta_args' );
	
	self.resEl = ge( 'result_response' );
	self.dataEl = ge( 'result_data' );
	
	self.callBtn = ge( 'btn_call' );
	self.clearBtn = ge( 'btn_clear' );
	self.closeBtn = ge( 'btn_close' );
	
	self.modLib.addEventListener( 'change', e => self.modLibChange( e ));
	self.getUserInfoBtn.addEventListener( 'click', e => self.pullUserInfo( e ));
	
	self.callBtn.addEventListener( 'click', e => self.makeCall());
	self.clearBtn.addEventListener( 'click', e => self.clearInputs());
	self.closeBtn.addEventListener( 'click', e => self.closeWin());
}

CallView.prototype.modLibChange = function( e ) {
	const self = this;
	console.log( 'modLibChange', [ e, self.modLib, self.modLib.value ]);
	const type = self.modLib.value;
	const hideModName = ( type == 'library' ) ? true : false;
	self.modNameWrap.classList.toggle( 'hidden', hideModName );
}

CallView.prototype.pullUserInfo = async function() {
	const self = this;
	const uInfo = await get();
	console.log( 'userinfoget', uInfo );
	
	function get() {
		return new Promise(( resolve, reject ) => {
			const req = new Module( 'system' );
			req.execute( 'userinfoget' );
			req.onExecuted = ( r, d ) => {
				console.log( 'pull uinfo', [ r, d ]);
				resolve( JSON.parse( d ));
			}
		});
	}
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
	} else
		args = null;
	
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
	self.moduleName.value = '';
	self.tokenAuthId.value = '';
	self.tokenServerToken.value = '';
	self.tokenSessionId.value = '';
	self.execPath.value = '';
	self.args.value = '';
}

CallView.prototype.setError = function( el, show ) {
	const self = this;
	el.classList.toggle( 'input-error', show );
}

CallView.prototype.makeLibraryCall = async function( exec, args ) {
	const self = this;
	const token = self.getToken();
	console.log( 'makeLibCall', [ exec, args, token ]);
	if ( null == token )
		nativeCall( exec, args );
	else
		directCall( exec, args, token );
	
	function nativeCall( exec, args ) {
		const req = new Library( 'system.library' );
		req.execute( exec, args );
		req.onExecuted = ( r, d ) => {
			console.log( 'lib onExecuted', [ r, d ]);
			self.setResult( r , d );
		}
	}
	
	async function directCall( exec, args, token ) {
		args = args || {};
		const path = '/system.library/' + exec;
		const req = new Request( 'library', path, token );
		const res = await req.send( args );
		console.log( 'lib directCall, res', res );
		self.setResult( res[ 0 ], res[ 1 ]);
	}
}

CallView.prototype.makeModuleCall = async function( exec, args ) {
	const self = this;
	const token = self.getToken();
	let modName = self.moduleName.value;
	if ( !modName )
		modName = 'system';
	
	console.log( 'makeModCall', [ modName, exec, args, token ]);
	if ( null == token ) 
		nativeCall( modName, exec, args );
	else
		directCall( modName, exec, args, token );
	
	function nativeCall( modName, exec, args ) {
		const req = new Module( modName );
		req.execute( exec, args );
		req.onExecuted = ( r, d ) => {
			console.log( 'mod onExecuted', [ r, d ]);
			self.setResult( r, d );
		}
	}
	
	async function directCall( modName, exec, args, token ) {
		const conf = {
			module  : modName,
			command : exec,
		};
		const path = '/system.library/module/';
		const req = new Request( 'module', path, token );
		const res = await req.send( conf, args );
		console.log( 'mod direct call, res', res );
		self.setResult( res[ 0 ], res[ 1 ]);
	}
}

CallView.prototype.setResult = function( res, data ) {
	const self = this;
	let jRes = null;
	let jData = null;
	try {
		jRes = JSON.parse( res );
	} catch(e){}
	
	try {
		jData = JSON.parse( data );
	} catch(e){}
	
	console.log( 'setResult', {
		res   : res,
		jRes  : jRes,
		data  : data,
		jData : jData,
	});
	res = makeStringy( res );
	data = makeStringy( data );
	
	self.resEl.textContent = res;
	self.dataEl.textContent = data;
	
	function makeStringy( something ) {
		if ( undefined === something )
			return 'undefined';
		
		if ( null === something )
			return 'null';
		
		if ( '' == res )
			return '""';
		
		let str = null;
		try {
			str = JSON.stringify( something );
		} catch( ex ) {
			return something;
		}
		
		return str;
	}
}

CallView.prototype.clearResult = function() {
	const self = this;
	self.resEl.textContent = '';
	self.dataEl.textContent = '';
}

CallView.prototype.getToken = function() {
	const self = this;
	const authId = self.tokenAuthId.value;
	if ( '' != authId ) {
		console.log( 'found authId', authId );
		return { authid : authId };
	}
	
	const serverToken = self.tokenServerToken.value;
	if ( '' != serverToken ) {
		console.log( 'found serverToken', serverToken );
		return { servertoken : serverToken };
	}
	
	const sessionId = self.tokenSessionId.value;
	if ( '' != sessionId ) {
		console.log( 'found sessionId' );
		return { sessionid : sessionId };
	}
	
	return null;
}

CallView.prototype.closeWin = function()
{
	const self = this;
	self.app.sendMessage( { command: 'quit' } );
}

//////

const Request = function( type, path, token ) {
	const self = this;
	self.type = type;
	self.path = path;
	console.log( 'request', [ type, path, token ]);
	self.init( token );
}

Request.prototype.send = async function( conf, args ) {
	const self = this;
	let body = null;
	if ( 'library' == self.type )
		body = self.buildLibBody( conf );
	else
		body = self.buildModBody( conf, args );
	
	let req = {
		method  : 'POST',
		body    : body,
		headers : {
			'Content-Type' : 'application/x-www-form-urlencoded',
		},
	};
	
	const res = await window.fetch( self.url, req );
	const text = await res.text();
	console.log( 'Request.send, res', text );
	return text.split( '<!--separate-->' );
}

// Priv

Request.prototype.init = function( token ) {
	const self = this;
	const proto = 'https://';
	const host = document.location.host;
	self.url = [ proto, host, self.path ].join( '' );
	
	const tokenType = Object.keys( token )[ 0 ];
	self.token = {
		type  : tokenType,
		value : token[ tokenType ],
	};
	
	/*
	const conf = {};
	if ( null != modName )
		conf.module = modName;
	
	if ( null != exec )
		conf.command = exec;
	
	conf[ tokenType ] = token[ tokenType ];
	if ( null != args )
		conf.args = args;
	
	const req = 
	
	//const query = self.buildQueryString( conf );
	console.log( 'Request', {
		host   : host,
		path   : path,
		module : modName,
		exec   : exec,
		args   : args,
		token  : token,
		url    : self.url,
		req    : req,
	});
	self.reqConf = req;
	/*
	const parts = [
		proto,
		host,
		path,
		query,
	];
	const reqString = parts.join( '' );
	console.log('reqString', reqString );
	self.reqString = reqString;
	*/
}

Request.prototype.buildModBody = function( conf, args ) {
	const self = this;
	console.log( 'buildModBody', [ conf, args ]);
	self.setToken( conf );
	let body = self.buildQueryString( conf );
	if ( args ) {
		let aJ = JSON.stringify( args );
		aJ = window.encodeURIComponent( aJ );
		body = body + '&' + 'args=' + aJ;
	}
	
	console.log( 'buildModBody, body', body );
	return body;
}

Request.prototype.buildLibBody = function( conf ) {
	const self = this;
	console.log( 'buildLibBody', [ conf, self.token ]);
	self.setToken( conf );
	const body = self.buildQueryString( conf );
	console.log( 'buildLibBody, body', body );
	return body;
}

Request.prototype.setToken = function( body ) {
	const self = this;
	const t = self.token;
	body[ t.type ] = t.value;
}

Request.prototype.buildQueryString = function( conf ) {
	const self = this;
	const parts = [];
	const cKeys = Object.keys( conf );
	cKeys.forEach( k => {
		const v = conf[ k ];
		const p = k + '=' + v;
		parts.push( p );
	});
	
	const body = parts.join('&');
	return body;
	
	/*
	
	const keys = Object.keys( conf );
	keys.forEach( k => {
		let v = conf[ k ];
		if ( 'args' == k ) {
			const aKeys = Object.keys( v );
			aKeys.forEach( aK => {
				let aV = v[ aK ];
				//aV = JSON.stringify( aV );
				//aV = window.encodeURI( aV );
				const aP = aK + '=' + aV;
				parts.push( aP );
			});
		} else {
			const p = k + '=' + v;
			parts.push( p );
		}
	});
	
	//return form;
	const query = parts.join( '&' );
	console.log( 'buildQueryString, query', query );
	return query;
	*/
}
