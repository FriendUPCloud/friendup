Application.run = function( msg )
{
	refreshProjects();
}

function getIds()
{
	var eles = document.getElementsByTagName( 'input' );
	var ids = [];
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].type == 'checkbox' && eles[a].checked )
		{
			ids.push( eles[a].getAttribute( 'did' ) );
		}
	}
	return ids.length ? ids : false;
}

function refreshProjects()
{
	var j = new Module( 'friendproject' );
	j.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var start_status = {}
			var avail_status = {};
			var rows = JSON.parse( d );
			// Fetch used stats
			for( var a = 0; a < rows.length; a++ )
			{
				if( !start_status[ rows[a].Status ] )
					start_status[ rows[a].Status ] = rows[a].Status; // todo i18n
			}
			// Sort order
			var sort_status = { 
				'New': 'New', 
				'Running': 'Running', 
				'Abandoned': 'Abandoned', 
				'Paused': 'Paused', 
				'Completed': 'Completed'
			};
			for( var b in sort_status )
			{
				for( var a in start_status )
				{
					if( a == b )
					{
						avail_status[ a ] = start_status[ a ];
					}
				}
			}
			var str = '';
			for( var b in avail_status )
			{
				str += '<div class="PaddingLeft PaddingRight ProjectHeading"><p><strong>' + avail_status[ b ] + ':</strong></p></div>';
				str += '<div class="Project BorderTop BorderBottom">';
				for( var a = 0; a < rows.length; a++ )
				{
					if( rows[ a ].Status != b ) continue;
					var checkbox = '<input type="checkbox" did="' + rows[ a ].ID + '"/>';
					str += '<div class="ProjectRow PaddingLeft" ondblclick="editProject(\'' + rows[ a ].ID + '\')">';
					str += '<div class="HContent90 BorderRight ProjectColumn">' + rows[a].Name + '</div>';
					str += '<div class="HContent10 ProjectColumn">' + checkbox + '</div>';
					str += '</div>';
				}
				str += '</div>';
			}
			ge( 'Projects' ).innerHTML = str;
		}
	}
	j.execute( 'refreshprojects' );
}

// Deletes projects selected with the input field
function deleteProjects()
{
	var ids = getIds();
	if( ids )
	{
		var m = new Module( 'friendproject' );
		m.onExecuted = function( e, d )
		{
			refreshProjects();
		}
		m.execute( 'deleteproject', { ids: ids.join( ',' ) } );
	}
}

// Adds a new project!
function addProject()
{
	var v = new View( {
		title: 'Add project',
		width: 500,
		height: 500
	} );
	
	var f = new File( 'Progdir:Templates/projectform.html' );
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'viewid', viewid: v.getViewId() } );
		} );
	}
	f.load();
}

function editProjects()
{
	var ids = getIds();
	if( ids )
	{
		for( var a = 0; a < ids.length; a++ )
		{
			editProject( ids[ a ] );
		}
	}
}

// Edits an existing project
function editProject( id )
{
	var v = new View( {
		title: 'Edit project',
		width: 500,
		height: 500
	} );
	
	var f = new File( 'Progdir:Templates/projectform.html' );
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'load', id: id } );
			v.sendMessage( { command: 'viewid', viewid: v.getViewId() } );
		} );
	}
	f.load();
}

// Handles messages
Application.receiveMessage = function( msg )
{
	if( msg.command == 'refreshprojects' )
	{
		return refreshProjects();
	}
}
