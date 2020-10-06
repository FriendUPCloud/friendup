/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for printer management
Sections.server_printers = function( cmd, extra )
{
	
	switch( cmd )
	{
		
		case 'details':
			
			loading();
			
			break;
		
		case 'edit':
			
			if( extra && extra.id && extra._this )
			{
				edit( extra.id, extra._this );
			}
			
			break;
		
		case 'create':
			
			create();
			
			break;
		
		case 'update':
			
			if( extra )
			{
				update( extra );
			}
			
			break;
		
		case 'remove':
			
			if( extra )
			{
				remove( extra );
			}
			
			break;
		
		case 'cancel':
			
			cancel();
			
			break;
		
		case 'refresh':
			
			initMain();
			
			break;
		
		default:
			
			initMain();
			
			break;
		
	}
	
	
	
	// read --------------------------------------------------------------------------------------------------------- //
	
	function list( callback, id )
	{
		
		if( callback )
		{
			if( id )
			{
				var m = new Module( 'print' );
				m.onExecuted = function( e, d )
				{
					//console.log( { e:e , d:d } );
				
					if( e == 'ok' && d )
					{
						try
						{
							var json = JSON.parse( d );
							
							if( json )
							{
								var obj = { ID: json.ID };
								
								if( json.Data )
								{
									var data = JSON.parse( json.Data );
									
									if( data.name ) obj.Name = data.name;
									if( data.host ) obj.Host = data.host;
									if( data.ip   ) obj.IP   = data.ip;
									if( data.port ) obj.Port = data.port;
									if( data.type ) obj.Type = data.type;
									if( data.confirmation ) obj.Confirmation = data.confirmation;
								}
								
								return callback( true, obj );
							}
						} 
						catch( e ){ } 
					}
					
					return callback( false, false );
				}
				m.execute( 'list', { id: id, authid: Application.authId } );
			}
			else
			{
				var m = new Module( 'print' );
				m.onExecuted = function( e, d )
				{
					//console.log( { e:e , d:d } );
				
					if( e == 'ok' && d )
					{
						try
						{
							var json = JSON.parse( d );
							
							if( json )
							{
								var arr = [];
								
								for( var k in json )
								{
									var obj = { ID: json[k].ID };
									
									if( json[k].Data )
									{
										var data = JSON.parse( json[k].Data );
										
										if( data.name ) obj.Name = data.name;
										if( data.host ) obj.Host = data.host;
										if( data.ip   ) obj.IP   = data.ip;
										if( data.port ) obj.Port = data.port;
										if( data.type ) obj.Type = data.type;
										if( data.confirmation ) obj.Confirmation = data.confirmation;
									}
									
									arr.push( obj );
								}
								
								return callback( true, arr );
							}
						} 
						catch( e ){ } 
					}
					
					return callback( false, false );
				}
				m.execute( 'list', { authid: Application.authId } );
			}
			
			return true;
		}
		
		return false;
		
	}
	
	function edit( id, _this )
	{
		
		var pnt = _this.parentNode;
		
		var edit = pnt.innerHTML;
		
		var buttons = [ 
			{ 'name' : 'Save',   'icon' : '', 'func' : function()
				{ 
					Sections.server_printers( 'update', id ) 
				} 
			}, 
			{ 'name' : 'Delete', 'icon' : '', 'func' : function()
				{ 
					Sections.server_printers( 'remove', id ) 
				} 
			}, 
			{ 'name' : 'Cancel', 'icon' : '', 'func' : function()
				{ 
					pnt.innerHTML = edit 
				} 
			}
		];
		
		pnt.innerHTML = '';
		
		for( var i in buttons )
		{
			var b = document.createElement( 'button' );
			b.className = 'IconSmall FloatRight';
			b.innerHTML = buttons[i].name;
			b.onclick = buttons[i].func;
		
			pnt.appendChild( b );
		}
		
	}
	
	function cancel()
	{
		ge( 'PrinterDetails' ).innerHTML = '';
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create()
	{
		
		var m = new Module( 'print' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
			
			Sections.server_printers( 'refresh' );
			
			if( e == 'ok' && d )
			{
				Sections.server_printers( 'details', d );
			}
		}
		m.execute( 'create', { data: { name: 'Unnamed printer' }, authid: Application.authId } );
		
	}
	
	function update( id )
	{
		var data = {
			name        : ge( 'PrinterName' ).value,
			host        : ge( 'PrinterHost' ).value,
			ip          : ge( 'PrinterIP'   ).value,
			port        : ge( 'PrinterPort' ).value,
			type        : ge( 'PrinterType' ).value,
			confirmation: ge( 'RequiresConfirmation' ).checked ? true : false
		}
		
		if( id && data )
		{
			var m = new Module( 'print' );
			m.onExecuted = function( e, d )
			{
				//console.log( { e:e, d:d } );
			
				Sections.server_printers( 'refresh' );
			}
			m.execute( 'update', { id: id, data: data, authid: Application.authId } );
		}
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id )
	{
		
		Confirm( i18n( 'i18n_deleting_printer' ), i18n( 'i18n_deleting_printer_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{
				var m = new Module( 'print' );
				m.onExecuted = function( e, d )
				{
					//console.log( { e:e, d:d } );
			
					Sections.server_printers( 'refresh' );
					Sections.server_printers( 'cancel' );
				}
				m.execute( 'remove', { id: id, authid: Application.authId } );	
			}
			
		} );
		
	}
	
	
	
	// init --------------------------------------------------------------------------------------------------------- //
	
	function loading()
	{
		var info = {};
		
		// Go through all data gathering until stop
		var loadingSlot = 0;
		
		var loadingList = [
			
			// Load printerinfo
			
			function()
			{
								
				list( function( e, d )
				{
					
					info.printer = null;
					
					if( e && d )
					{
						info.printer = d;
						
						loadingList[ ++loadingSlot ]( info );
					}
					else return;
					
				}, extra );
				
			},
			
			function( info )
			{
				if( typeof info.printer == 'undefined' ) return;
				
				initDetails( info );
			}
			
		];
		
		loadingList[ 0 ]();
		
		return;
	}
	
	// Show the form
	function initDetails( info )
	{
		var printer = info.printer;
		
		var arr = [ 'safeq-spooler', 'generic-postscript', 'local-printer' ];
		
		var type = '';
		
		for( var i in arr )
		{
			type += '<option' + ( printer.Type == arr[i] ? ' selected="selected"' : '' ) + '>' + arr[i] + '</option>';
		}
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/server_printers_details.html' );
		
		// Add all data for the template
		d.replacements = {
			id                  : ( printer.ID   ? printer.ID   : '' ),
			printer_name        : ( printer.Name ? printer.Name : '' ),
			printer_host        : ( printer.Host ? printer.Host : '' ),
			printer_ip          : ( printer.IP   ? printer.IP   : '' ),
			printer_port        : ( printer.Port ? printer.Port : '' ),
			printer_type        : ( type ? type : '' ),
			confirmation_checked: ( ( !printer.ID || printer.Confirmation ) ? ' checked="checked"' : '' )
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'PrinterDetails' ).innerHTML = data;
			
			// Responsive framework
			Friend.responsive.pageActive = ge( 'PrinterDetails' );
			Friend.responsive.reinit();
		}
		d.load();
	}
	
	function initMain()
	{
		
		// Get the user list
		list( function( e, d )
		{
			var List = null;
			
			try { List = d } catch( e ) { }
			
			
			
			var o = ge( 'PrinterList' );
			o.innerHTML = '';
			
			// Types of listed fields
			var types = {
				Edit: '10',
				Name: '80'
			};
			
			
			
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = i18n( 'i18n_printers' );
			o.appendChild( h2 );
			
			// List headers
			var header = document.createElement( 'div' );
			header.className = 'List';
			var headRow = document.createElement( 'div' );
			headRow.className = 'HRow sw1';
			for( var z in types )
			{
				var d = document.createElement( 'div' );
				d.className = 'PaddingSmall HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft Ellipsis';
				d.innerHTML = '<strong>' + ( z != 'Edit' ? z : '' ) + '</strong>';
				headRow.appendChild( d );
			}
			
			var d = document.createElement( 'div' );
			d.className = 'PaddingSmall HContent10 TextCenter FloatLeft Ellipsis';
			d.innerHTML = '<strong>(+)</strong>';
			d.onclick = function()
			{
				Sections.server_printers( 'create' );
			};
			headRow.appendChild( d );
			
			header.appendChild( headRow );
			o.appendChild( header );
			
			function setROnclick( r, id )
			{
				r.onclick = function()
				{
					Sections.server_printers( 'details', id );
				}
			}
			
			var list = document.createElement( 'div' );
			list.className = 'List';
			var sw = 2;
			
			if( List )
			{
				for( var a = 0; a < List.length; a++ )
				{
					sw = sw == 2 ? 1 : 2;
					
					var r = document.createElement( 'div' );
					setROnclick( r, List[ a ].ID );
					r.className = 'HRow sw' + sw;
					
					var icon = '<span class="IconSmall fa-user"></span>';
					List[ a ][ 'Edit' ] = icon;
					
					for( var z in types )
					{
						var d = document.createElement( 'div' );
						if( z != 'Edit' )
						{
							d.className = '';
						}
						else d.className = 'TextCenter';
						
						d.className += ' HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft PaddingSmall Ellipsis';
						d.innerHTML = ( List[a][ z ] ? List[a][ z ] : '-' );
						r.appendChild( d );
					}
		
					// Add row
					list.appendChild( r );
				}
			}
			
			o.appendChild( list );
			
			Friend.responsive.pageActive = ge( 'PrinterList' );
			Friend.responsive.reinit();
		} );
		
	}
	
};




