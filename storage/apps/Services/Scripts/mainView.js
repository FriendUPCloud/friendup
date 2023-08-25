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

(function( ns, undefined )
{
	ns.View = function( app )
	{
		var self = this;
		self.app = app;
		self.init();
	}
	
	// PUBLIC
	
	ns.View.prototype.loaded = function( id )
	{
		var self = this;
		var loaded = {
			type : 'loaded',
			data : {
				id : id,
				viewId : self.app.viewId,
			},
		};
		self.send( loaded );
	}
	
	ns.View.prototype.send = function( data )
	{
		var self = this;
		var msg = {
			robotUnicorns : 'viewMessage',
			data : data,
		};
		self.app.sendMessage( msg );
	}
	
	// PRIVATE
	
	ns.View.prototype.init = function()
	{
		var self = this;
		console.log( 'hi! im just here to annoy you =^.^=' );
	}
	
})( lib );

(function( ns, undefined )
{
	ns.Main = function( conf, view )
	{
		var self = this;
		self.conf = conf;
		self.view = view;
		
		self.services = {};
		self.currentFocus = null;
		
		self.init();
	}
	
	// useful stuff
	
	ns.Main.prototype.populate = function( data )
	{
		var self = this;
		console.log( 'populate', data );
		data.Services.forEach( add );
		function add( service )
		{
			self.add( service );
		}
	}
	
	ns.Main.prototype.add = function( service )
	{
		var self = this;
		if ( !!self.services[ service.Name ] )
		{
			self.update( service );
			return;
		}
		
		self.services[ service.Name ] = service;
		var item = build( service );
		self.list.appendChild( item );
		bind( item, service );
		self.update( service );
		
		function build( service )
		{
			var conf = {
				id : service.Name,
				name : service.Name,
			};
			var element = self.template.getElement( 'service-item-tmpl', conf );
			element.setAttribute( 'tabindex', '-1' ); // focusable, but not tabable
			return element;
		}
		
		function bind( element, service )
		{
			var startBtn = element.querySelector( '.service-start' );
			var stopBtn = element.querySelector( '.service-stop' );
			
			element.addEventListener( 'focus', serviceFocus, false );
			element.addEventListener( 'blur', serviceBlur, false );
			startBtn.addEventListener( 'click', start, false );
			stopBtn.addEventListener( 'click', stop, false );
			
			function serviceFocus( e ) {
				console.log( 'service focus', { s : service, e : e });
				self.focusItem( service );
				//element.classList.add( 'BackgroundNegative', 'Negative', true );
			}
			
			function serviceBlur( service ) {
				console.log( 'service blur', service );
				var element = document.getElementById( service.id );
				//element.classList.remove( 'BackgroundNegative' ,'Negative', false );
			}
			
			function start( e ) {
				console.log( 'service start', service );
				var msg = {
					type : 'start',
					data : service.Name,
				};
				self.send( msg );
			}
			
			function stop( e ) {
				console.log( 'service stop', service );
				var msg = {
					type : 'stop',
					data : service.Name,
				};
				self.send( msg );
			}
		}
	}
	
	ns.Main.prototype.update = function( service ) {
		var self = this;
		console.log( 'update service', service );
		var oldState = self.services[ service.Name ];
		if ( !oldState ) {
			console.log( '.update - no old state found for', service );
			return;
		}
		
		updateItem( oldState, service );
		if ( self.currentDetails && ( self.currentDetails.Name === service.Name ))
			updateInfo( service );
		
		function updateItem ( current, update ) {
			var item = document.getElementById( update.Name );
			console.log( 'update item', item );
			if ( !item ) {
				console.log( 'updateItem - item not found for', update );
				return;
			}
			
			setRunState( current.Status, update.Status );
			var showStart = ( 'started' === service.Status ) ? false : true ;
			toggleStartStop( showStart );
			
			function setRunState( current, update )
			{
				if ( !current || !update ) {
					console.log( 'run state missing', { curr : current, upd : update });
					return;
				}
				
				var removeClass = self.statusClassMap[ current ];
				var addClass = self.statusClassMap[ update ];
				var indicator = item.querySelector( '.service-run-state .indicator' );
				toggle( removeClass, false );
				toggle( addClass, true );
				function toggle( name, add )
				{
					indicator.classList.toggle( name, add );
				}
			}
			
			function toggleStartStop( showStart ) {
				console.log( 'toggleStartStop', showStart );
				var startBtn = item.querySelector( '.service-start' );
				var stopBtn = item.querySelector( '.service-stop' );
				startBtn.classList.toggle( 'hidden', !showStart );
				stopBtn.classList.toggle( 'hidden', showStart );
			}
		}
		
		function updateInfo( service ) {
			var id = service.id + '-details';
			var info = document.getElementById( id );
			console.log( 'update details', info );
		}
	}
	
	ns.Main.prototype.remove = function( id ) {
		var self = this;
		console.log( 'remove service', id );
		if ( !services[ id ] )
			return;
		
		removeElement( id );
		if ( id === self.currentFocus.id )
			removeDetails( id );
		
		function removeElement( id ) {
			var element = document.getElementById( id );
			element.parentNode.removeChild( element );
		}
		
		function removeDetails( id ) {
			var detailsId = id + '-details';
			var element = document.getElementById( detailsId );
			self.currentFocus = null;
		}
	}
	
	ns.Main.prototype.send = function( msg )
	{
		var self = this;
		self.view.send( msg );
	}
	
	// implementation details
	
	ns.Main.prototype.statusClassMap = {
		'stopped' : 'Off',
		'started' : 'On',
		'(null)' : 'Notify',
	}
	
	ns.Main.prototype.statusMap = {
		'0' : 'stopped',
		'1' : 'running',
		'2' : 'paused',
	}
	
	ns.Main.prototype.init = function()
	{
		var self = this;
		self.bind();
		var fragments = document.getElementById( 'fragments' );
		self.template = new friendUP.gui.TemplateManager( fragments );
		self.app = window.Application;
		self.app.receiveMessage = function( e ) { self.receiveMessage( e ); }
		self.view.loaded( 'mainView' );
		self.viewEvents = {
			add : add,
			update : update,
			remove : remove,
			populate : populate,
		};
		
		function add( e ) { self.add( e ); }
		function update( e ) { self.update( e ); }
		function remove( e ) { self.remove( e ); }
		function populate( e ) { self.populate( e ); }
	}
	
	ns.Main.prototype.bind = function()
	{
		var self = this;
		self.list = document.getElementById( 'list' );
		
		var form = document.getElementById( 'input-form' );
		self.output = document.getElementById( 'output' );
		
		form.addEventListener( 'submit', submit, false );
		function submit( e ) {
			e.preventDefault();
			e.stopPropagation();
			self.sendEvent( e );
		}
	}
	
	ns.Main.prototype.focusItem = function( service )
	{
		var self = this;
		console.log( 'focusItem', service );
		if ( self.currentFocus && ( self.currentFocus.Name === service.Name ))
			return;
		
		if ( self.currentFocus )
			toggleFocus( self.currentFocus.Name, false );
		
		toggleFocus( service.Name, true );
		self.currentFocus = service;
		setFocus( service );
		self.showDetails( service );
		
		function setFocus( service ) {
			toggleFocus( service.Name, true );
			self.currentFocus = service;
		}
		
		function toggleFocus( id, setFocus ) {
			var element = document.getElementById( id );
			element.classList.toggle( 'focus', setFocus );
		}
	}
	
	ns.Main.prototype.blurItem = function( service )
	{
		var self = this;
		console.log( 'blurItem', service );
	}
	
	ns.Main.prototype.showDetails = function( service )
	{
		var self = this;
		console.log( 'showDetails', service );
		self.currentDetails = service;
		var dC = document.getElementById( 'info' );
		dC.innerHTML = '';
		var detailsId = service.Name + '-details';
		if ( !Array.isArray( service.Hosts ))
			service.Hosts = [
				'karius',
				'baktus',
				'morra-di',
			];
		
		//var status = self.statusMap[ service.Status ];
		var status = service.Status;
		var hostsHtml = buildHostsHtml( service.Hosts );
		var conf = {
			id : detailsId,
			name : service.Name,
			status : status,
			hosts : hostsHtml,
		};
		var details = self.template.getElement( 'service-details-tmpl', conf );
		console.log( 'showDetails.element', details );
		dC.appendChild( details );
		self.bindDetails( service, details );
		
		function buildHostsHtml( hosts ) {
			var items = hosts.map( build );
			var html = items.join( '' );
			return html;
			
			function build( hostName, index ) {
				var id = service.Name + '-' + hostName;
				var conf = {
					id : id,
					name : hostName,
					index : index,
				};
				var itemHtml = self.template.get( 'details-host-item-tmpl', conf );
				return itemHtml;
			}
		}
	}
	
	ns.Main.prototype.bindDetails = function( service, element )
	{
		var self = this;
		var cmdForm = element.querySelector( '.command-form' );
		
		cmdForm.addEventListener( 'submit', cmdSubmit, false );
		function cmdSubmit( e ) {
			e.preventDefault();
			e.stopPropagation();
			self.commandSubmit( service, cmdForm );
		}
		
	}
	
	ns.Main.prototype.commandSubmit = function( service, form )
	{
		var self = this;
		var cmdInput = form.querySelector( '.command-input input' );
		var hostsInput = form.querySelectorAll( '.host-item' );
		var cmdStr = cmdInput.value;
		if ( !cmdStr || !cmdStr.length )
			return;
		
		var hosts = getChecked( hostsInput );
		var cmdMsg = {
			type : 'command',
			data : {
				id : service.Name,
				cmd : cmdStr,
				hosts : hosts,
			},
		};
		self.send( cmdMsg );
		
		function getChecked( inputs )
		{
			var checked = [];
			Array.prototype.forEach.call( inputs, isChecked );
			return checked;
			
			function isChecked( inputWrap ) {
				var check = inputWrap.querySelector( '.check' );
				var host = inputWrap.querySelector( '.host' );
				var isChecked = check.checked;
				if ( isChecked )
					checked.push( host.value );
			}
		}
	}
	
	ns.Main.prototype.sendEvent = function( e )
	{
		var self = this;
		var type = e.target[ 0 ].checked ? 'event' : 'request';
		var path = e.target[ 2 ].value;
		var data = e.target[ 3 ].value;
		var msg = {
			type : 'send',
			data : {
				type : type,
				path : path,
				data : data,
			},
		};
		self.send( msg );
	}
	
	ns.Main.prototype.receiveMessage = function( msg )
	{
		var self = this;
		if ( msg.checkDefaultMethod )
			return;
		
		if ( !msg.robotUnicorns )
			return;
		
		console.log( 'view.Main.receiveMessage', msg );
		var handler = self.viewEvents[ msg.data.type ];
		if ( !handler ) {
			console.log( 'mainView - no handler for view message', msg );
			return;
		}
		
		handler( msg.data.data );
	}
	
	ns.Main.prototype.dump = function( str )
	{
		var self = this;
		var conf = {
			str : str,
		};
		var element = self.template.getElement( 'dump-tmpl', conf );
		self.output.appendChild( element );
	}
	
})( lib );

Application.run = function( conf, iface )
{
	if ( iface )
		console.log( 'mainView run', { conf : conf, iface : iface });
	
	window.view = new lib.View( Application );
	window.main = new lib.Main( conf, window.view );
}

Application.editEntry = function( fdata )
{
	if( !fdata ) return;
	
	// Loading main gui
	var f = new File( 'Progdir:Templates/entry.html' );
	f.onLoad = function( dataResponse )
	{
		console.log( fdata );
	
		ge( 'Settings' ).innerHTML = dataResponse;
		
		// load custom gui, now that our entry.html is loaded...
		var cl = new Library( 'system.library' );
		cl.onExecuted = function( data )
		{
			// Get custom GUI from service
			
			console.log( data );
			ge( 'CustomGUI' ).innerHTML = data;
			
			// Get connected hosts
			
			console.log('---' + fdata.hosts );
			var lhosts = fdata.hosts.split(",");
			var list = '';
			for( var a=0 ; a < lhosts.length ; a++ )
			{
				list += '\
					<div class="Box MarginBottom" style="cursor: hand; cursor: pointer" onmouseover="this.className = this.className.split( \' BackgroundDefault ColorDefault\' ).join( \'\' ) + \' BackgroundLists ColorLists\'\" onmouseout="this.className = this.className.split( \' BackgroundLists ColorLists\' ).join( \'\' ) + \' BackgroundDefault ColorDefault\'\">\
						<div class="HRow">\
							<div class="FloatRight">\
							<input type="checkbox"/>\
						</div>\
						<div class="FloatLeft IconSmall fa-gears">&nbsp;</div>\
						<div class="FloatLeft">&nbsp;' + lhosts[ a ] + '</div>\
					</div>\
				</div>\
				';
			}
			// Set the list and select the first entry
			ge( 'ServicesHost' ).innerHTML = list;		
		}
		cl.execute( 'services/getwebgui', { serviceName: fdata.service } );
		
		console.log( document.title );
	}
	f.load();
}

// Set the list of services...
Application.setServicesList = function( data )
{
	var r = data.split( '<!--separate-->' );
		
	// Create new HTML data
	var list = '';
	var obj = JSON.parse( r[0] );
	
	Application.dataEntries = obj;

	for( var a in obj.Services )
	{
		var cl = '';

		list += '\
<div class="Box MarginBottom' + cl + '" style="cursor: hand; cursor: pointer" onclick="Application.receiveMessage( { command: \'entry\', service: \'' + obj.Services[ a ].Service + '\', data: \''+ a +'\', hosts: \''+ obj.Services[ a ].Hosts +'\' } )" onmouseover="this.className = this.className.split( \' BackgroundDefault ColorDefault\' ).join( \'\' ) + \' BackgroundLists ColorLists\'\" onmouseout="this.className = this.className.split( \' BackgroundLists ColorLists\' ).join( \'\' ) + \' BackgroundDefault ColorDefault\'\">\
	<div class="HRow">\
		<div class="FloatRight">\
			<input type="checkbox" ' + ( obj.Services[ a ].Active ? ' checked="checked"' : '' ) + ' onclick="Application.sendMessage( { command: \'toggle\', id: \'' + obj.Services[ a ].Service + '\' } )"/>\
		</div>\
		<div class="FloatLeft IconSmall fa-gears">&nbsp;</div>\
		<div class="FloatLeft">&nbsp;' + obj.Services[ a ].Service + '</div>\
	</div>\
</div>\
		';
	}
	// Set the list and select the first entry
	ge( 'Services' ).innerHTML = list;
	
	// Activate first entry
	this.editEntry( { service: Application.dataEntries.Services[ 0 ].Service, data: 0, hosts: obj.Services[ a ].Hosts } );
}

// Get messages!
/*
Application.receiveMessage = function( msg )
{
	if ( msg.checkDefaultMethod )
		return;
	
	console.log( 'mainView.receiveMessage', msg );
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'entry':
			console.log('-->' + msg.hosts );
			this.editEntry( { service: msg.service, data: msg.data, hosts: msg.hosts } );
			break;
		case 'setserviceslist':
			this.setServicesList( msg.data );
			break;
	}
}
*/


