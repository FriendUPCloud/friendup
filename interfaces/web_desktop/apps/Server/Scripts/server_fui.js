// When FUI is initialized, do
var rootObject = null;
window.startServer = function( robj )
{	
	// We got a root object
	rootObject = robj;
	
	// Build our server list!
	var serverList = rootObject.get( 'ServerList' );
	serverList.setColumns( [
		{
			name: 'server_setting',
			label: 'Server setting'
		},
		{
			name: '',
			span: 2,
			label: 'Options'
		}
	] );
	serverList.setFlag( 'sortColumn', 'server_setting' );
	
	// Build our software list!
	var softList = rootObject.get( 'SoftwareList' );
	softList.setColumns( [
		{
			name: 'software_name',
			label: 'Application'
		},
		{
			name: 'software_hash',
			label: 'Hash'
		},
		{
			name: 'software_opts',
			span: 2,
			label: 'Options'
		}
	] );
	softList.setFlag( 'sortColumn', 'software_name' );
	
	redrawServerSettings();
}

// Helper functions ------------------------------------------------------------

function redrawServerSettings()
{
	var serverList = rootObject.get( 'ServerList' );
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		serverList.clearEntries();
		if( e == 'ok' )
		{
			if( d != 'nosettingsfound' )
			{
				var settings = JSON.parse( d );
				for( var a = 0; a < settings.length; a++ )
				{
					var o = [
						{
							type: 'text',
							text: settings[ a ].Type + '/' + settings[ a ].Key
						},
						{
							type: 'button',
							text: 'Edit',
							icon: 'fa-edit',
							event: {
								functionName: 'editElement',
								arguments: '\'' + settings[ a ].ID + '\''
							}
						},
						{
							type: 'button',
							text: 'Delete',
							icon: 'fa-remove',
							event: {
								functionName: 'deleteElement',
								arguments: '\'' + settings[ a ].ID + '\''
							}
						}
					];
					serverList.addEntry( o );
				}
			}
		}
	}
	m.execute( 'listsystemsettings' );
}

function editElement( id )
{
	Alert( 'Yes', 'Which id: ' + id );
}

function deleteElement( id )
{
}

// Add a new setting item
function addItem()
{
	var v = new View( {
		title: 'Add setting item',
		width: 400,
		height: 400,
		frameworks: {
			fui: {
				data: 'Progdir:FUI/server_item.json',
				javascript: 'Progdir:Scripts/server_item_fui.js'
			}
		}
	} );
}

// Close program, really
function cancelView()
{
	CloseView();
}

