/*******************************************************************************
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
*******************************************************************************/

var api = api || {};
var friendUP = window.friendUP || {};
var Doors = window.Doors || {};

// Add Css by url
function AddCSSByUrl( csspath, callback )
{
	if( !window.cssStyles ) window.cssStyles = [];
	if( typeof( window.cssStyles[csspath] ) != 'undefined' )
	{
		// Remove existing and clean up
		document.body.removeChild( window.cssStyles[csspath] );
		var o = [];
		for( var a in window.cssStyles )
		{
			if( a != csspath )
			{
				o[a] = window.cssStyles[a];
			}
		}
		window.cssStyles = o;
	}
	// Add and register
	var s = document.createElement( 'link' );
	s.rel = 'stylesheet';
	s.href = csspath;
	if( callback ){ s.onload = function() { callback(); } }
	document.body.appendChild( s );
	window.cssStyles[csspath] = s;
}

// dummy View to collect .run() handler from application
window.View = {};

// basic setup
(function()
{
	urlToConfig();
	function urlToConfig()
	{
		if ( !document.location.search )
		{
			throw new Error( 'View - no config found, aborting' );
			return;
		}
		
		var pairs = {};
		var tokens = document.location.search.split( /(\?|&)/);
		
		tokens.forEach( split );
		function split( token ) {
			if ( !token )
				return;
			
			var pair = token.split( '=' );
			var key = pair[ 0 ];
			var value = pair[ 1 ];
			if ( key && value )
				pairs[ key ] = value;
		}
		
		window.viewConfig = pairs;
		setBase( window.viewConfig.base );
	}
	
	function setBase( baseUrl )
	{
		removeOld();
		var baseElement = document.createElement( 'base' );
		baseElement.href = baseUrl;
		document.head.insertBefore( baseElement, document.head.children[ 0 ] );
	}
	
	function removeOld()
	{
		var allYourBase = document.head.querySelectorAll( 'base' );
		Array.prototype.forEach.call( allYourBase, remove );
		function remove( base ) {
			base.parentElement.removeChild( base );
		}
	}
	
	var scripts = [
		'io/cajax.js', // dependency for cssparser.js
		'utils/engine.js',
		'utils/tool.js',
		'utils/cssparser.js',
		'gui/template.js',
	];
	
	var theme = window.viewConfig.theme;
	if ( theme )
		window.viewConfig.themePath = '/themes/' + theme;
	else
		window.viewConfig.themePath = '/webclient/theme';
	
	var themedScrollbars = window.viewConfig.themePath + '/scrollbars.css';
	var css = [
		'/webclient/css/font-awesome.min.css',
		themedScrollbars,
	];
	
	scripts.forEach( addScript );
	css.forEach( addCss );
	
	function addScript( scriptPath )
	{
		var script = document.createElement( 'script' );
		script.type = 'text/javascript';
		document.head.appendChild( script );
		script.src = '/webclient/js/' + scriptPath;
	}
	
	function addCss( cssPath )
	{
		var css = document.createElement( 'link' );
		css.type = 'text/css';
		css.rel = 'stylesheet';
		document.head.appendChild( css );
		css.href = cssPath;
	}
	
	// When all resources are loaded..
	document.addEventListener( 'readystatechange', readyState, false );
	function readyState( e ) {
		e.stopPropagation();
		if ( document.readyState === 'complete' ) {
			window.viewConfig.run = window.View.run;
			window.View = new api.View( window.viewConfig );
			window.View.run(); // <-- ..this happens!
		}
	}
})();

// ViewEvent
(function( ns, undefined )
{
	ns.ViewEvent = function()
	{
		if ( !( this instanceof ns.ViewEvent ))
			return new ns.ViewEvent();
		
		var self = this;
		self.listener = {};
		
		self.eventInit();
	}
	
	ns.ViewEvent.prototype.eventInit = function()
	{
		var self = this;
		self.eventMap = {
			'focus' : focus,
			'initappframe' : initialize,
			'initialize' : initialize,
			'notify' : notify,
			'register' : register,
		};
		
		function close( msg ) { self.close( msg ); }
		function focus( msg ) { self.focus( msg ); }
		function initialize( msg ) { console.log( 'View.initialize event, skipping', msg ); }
		function notify( msg ) { self.notify( msg ); }
		function register( msg ) { self.register( msg ); }
		
		self.notifyMap = {
			'activateview' : activated,
			'deactivateview' : deactivated,
		};
		
		function activated( msg ) { self.activated( msg ); }
		function deactivated( msg ) { self.deactivated( msg ); }
		
		window.addEventListener( 'message', receiveEvent, false );
		document.body.addEventListener( 'click', activate, false );
		
		function activate( e ) { self.activate( e ); }
		function receiveEvent( e ) { self.receiveEvent( e ); }
	}
	
	ns.ViewEvent.prototype.receiveEvent = function( e )
	{
		var self = this;
		var msg = friendUP.tool.objectify( e.data );
		msg.origin = e.origin;
		var handler = self.eventMap[ msg.command ];
		
		if ( !handler )
		{
			self.viewEvent( msg );
			return;
		}
		
		handler( msg );
	}
	
	ns.ViewEvent.prototype.viewEvent = function( msg )
	{
		var self = this;
		var handler = self.listener[ msg.type ];
		if ( !handler ) {
			//console.log( 'view.viewEvent - no handler for', msg );
			self.receiveMessage( msg );
			return;
		}
		
		handler( msg.data );
	}
	
	ns.ViewEvent.prototype.notify = function( msg )
	{
		var self = this;
		
		var handler = self.notifyMap[ msg.method ];
		if ( !handler ) {
			console.log( 'unkown notify event', msg );
			return;
		}
		
		handler( msg );
	}
	
	ns.ViewEvent.prototype.on = function( event, handler )
	{
		var self = this;
		self.listener[ event ] = handler;
	}
	
	ns.ViewEvent.prototype.off = function( event )
	{
		var self = this;
		if ( self.listener[ event ])
			delete self.listener[ event ];
	}
	
	ns.ViewEvent.prototype.allOff = function()
	{
		var self = this;
		self.listener = {};
	}
	
})( api );

// View
(function( ns, undefined )
{
	ns.View = function( conf )
	{
		if ( !( this instanceof ns.View ))
			return new ns.View( conf );
		
		api.ViewEvent.call( this );
		
		var self = this;
		self.id = conf.id;
		self.applicationId = conf.applicationId;
		self.parentOrigin = conf.origin;
		self.domain = conf.domain;
		self.run = conf.run;
		self.isActive = null;
		
		self.initialize();
	}
	
	ns.View.prototype = Object.create( api.ViewEvent.prototype );
	
	ns.View.prototype.close = function( msg )
	{
		console.log( 'view.close' );
		var self = this;
		self.sendMessage({
			type : 'close',
		});
	}
	
	ns.View.prototype.initialize = function()
	{
		var self = this;
		self.activate();
		notify();
		
		//var themeFile = window.viewConfig.themePath + '/theme.css';
		//ParseCssFile( themeFile, '/webclient/' );
		AddCSSByUrl( window.viewConfig.themePath + '/theme_compiled.css' );
		
		function notify() {
			self.send({
				type: 'notify',
			});
		}
		
		// deprecated, until its needed again :p
		/*reapplyRelativeHeadElements();
		function reapplyRelativeHeadElements() {
			var elements = document.head.children;
			var replace = [];
			var scriptsLoaded = [];
			Array.prototype.forEach.call( elements, find );
			function find( element ) {
				var html = element.outerHTML;
				var match = html.match( /(?:src|href)="(?!\/)(.+?)"/i );
				if ( match ) {
					replace.push( element );
				}
			}
			replace.forEach( build );
			function build( element, index ) {
				if ( element.src )
					setScript( element.src );
				else;
					//setLink( element.href );
			}
			
			console.log( 'done adding scripts', scriptsLoaded );
			
			function setScript( src ) {
				var script = document.createElement( 'script' );
				document.head.appendChild( script );
				var index = scriptsLoaded.length;
				scriptsLoaded[ index ] = false;
				script.type = 'text/javascript';
				script.onload = loaded;
				script.src = src;
				
				function loaded( e ) {
					scriptsLoaded[ index ] = true;
					checkLoaded();
				}
			}
			
			function setLink( href ) {
				var link = document.createElement( 'link' );
				document.head.appendChild( link );
				link.type = 'text/css';
				link.rel = 'stylesheet';
				link.href = href;
				//return link;
			}
			
			function checkLoaded() {
				console.log( 'checkLoaded', scriptsLoaded );
				var all = scriptsLoaded.every( is );
				function is( element ) {
					return element;
				}
				console.log( 'all', all );
				if ( all )
					callRun();
			}
			
			function callRun() {
				console.log( 'callRun' );
				notify();
				if ( self.run )
					self.run();
			}
		}
		*/
		
	}
	
	ns.View.prototype.activate = function()
	{
		var self = this;
		var msg = {
			method : 'activate',
		};
		self.sendViewEvent( msg );
	}
	
	ns.View.prototype.activated = function()
	{
		var self = this;
		self.viewEvent({
			type : 'focus',
			data : true,
		});
		
		self.isActive = true;
		document.body.classList.add( 'activated' );
	}
	
	ns.View.prototype.deactivated = function()
	{
		var self = this;
		self.viewEvent({
			type : 'focus',
			data : false,
		});
		
		self.isActive = false;
		document.body.classList.remove( 'activated' );
	}
	
	ns.View.prototype.sendMessage = function( data, callback )
	{
		var self = this;
		if ( !self.id )
			throw new Error( 'View not yet initialized' );
		
		var msg = { data : data };
		if ( callback ) {
			var callbackId = friendUP.tool.uid();
			msg.data.callback = callbackId;
			self.on( callbackId, callback );
		}
		
		self.send( msg );
	}
	
	ns.View.prototype.sendViewEvent = function( msg )
	{
		var self = this;
		msg.type = 'view';
		self.send( msg );
	}
	
	ns.View.prototype.send = function( msg )
	{
		var self = this;
		msg.windowId = self.id;
		msg.applicationId = self.applicationId;
		
		msgString = friendUP.tool.stringify( msg );
		window.parent.postMessage( msgString, self.parentOrigin );
	}
	
	ns.View.prototype.receiveMessage = function( msg )
	{
		var self = this;
		/*
		console.log( 'View.receiveMessage - '
			+ ' provide your own implementation of this function'
			+ ' to receive messages in your view', msg );
		*/
	}
	
})( api );

// Say
(function( ns, undefined ) {
	ns.Say = function( toSay, langCode ) {
		var defaultLanguage = 'en-US';
		var availableVoices = window.speechSynthesis.getVoices();
		var utterance = new window.SpeechSynthesisUtterance( toSay );
		//console.log( 'availableVoices', availableVoices );
		availableVoices.forEach( matchPreference );
		
		utterance.lang = defaultLanguage;
		window.speechSynthesis.speak( utterance );
		
		function matchPreference( voice, index ) {
			//console.log( 'voice', { l: voice, i: index });
		}
	}
})( api );
