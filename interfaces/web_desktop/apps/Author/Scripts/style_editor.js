Application.run = function()
{
}

var mouseElement = {
	candidate: null
};

var currentStyles = {};

function renderStyleGUI( data )
{
	var d = false;
	try
	{
		d = JSON.parse( data );
	}
	catch( e )
	{
		d = false;
	}
	var prototype = {
		fontFamily:     { type: 'fonts',     value: ''     },
		fontSize:       { type: 'number',    value: ''     },
		marginTop:      { type: 'number',    value: ''     },
		marginLeft:     { type: 'number',    value: ''     },
		marginRight:    { type: 'number',    value: ''     },
		marginBottom:   { type: 'number',    value: ''     },
		paddingTop:     { type: 'number',    value: ''     },
		paddingLeft:    { type: 'number',    value: ''     },
		paddingRight:   { type: 'number',    value: ''     },
		paddingBottom:  { type: 'number',    value: ''     },
		fontWeight:     { type: 'weight',    value: 'none' },
		fontStyle:      { type: 'fontstyle', value: 'none' },
		textDecoration: { type: 'textdeco',  value: 'none' },
		color:          { type: 'color',     value: ''     },
		background:     { type: 'color',     value: ''     },
		borderTop:      { type: 'border',    value: 'none' },
		borderLeft:     { type: 'border',    value: 'none' },
		borderRight:    { type: 'border',    value: 'none' },
		borderBottom:   { type: 'border',    value: 'none' },
		lineHeight:     { type: 'number',    value: ''     }
	};
	if( !d )
	{
		d = prototype;
	}
	else
	{
		for( var a in prototype )
		{
			if( typeof( d[ a ] ) == 'undefined' )
				d[ a ] = prototype[ a ];
		}
	}
	
	// Begin to render the GUI
	var str = '';
	for( var a in d )
	{
		var label = '';
		for( var b = 0; b < a.length; b++ )
		{
			// Ucfirst
			if( b == 0 ) label += a.charAt( b ).toUpperCase();
			else if( a.charAt( b ) == a.charAt( b ).toUpperCase() )
			{
				label += ' ' + a.charAt( b ).toLowerCase();
			}
			else label += a.charAt( b );
		}
		str += '<div class="HRow Element" attrtype="' + d[a].type + '_' + a + '">';
		str += '<div class="FloatLeft HContent40">' + label + ':</div>';
		str += '<div class="FloatLeft HContent60">';
		switch( d[a].type )
		{
			case 'color':
			{
				str += '<div class="HRow Element" stype="' + d[a].type + '_' + a + '">';
				str += '<div class="FloatLeft HContent70"><input type="text" class="FullWidth" id="col_' + a + '"/></div>';
				str += '<div class="FloatLeft HContent30"><div class="ColorBox" onclick="showColorPicker(\'col_' + a + '\')"></div></div>';
				str += '</div>';
				break;
			}
			case 'border':
			{
				str += '<div class="HRow Element" stype="' + d[a].type + '_' + a + '">';
				str += '<div class="FloatLeft HContent25"><input type="number" class="FullWidth"/></div>';
				str += '<div class="FloatLeft HContent25"><input type="text" class="FullWidth" id="col_' + a + '"/></div>';
				str += '<div class="FloatLeft HContent15"><div class="ColorBox" onclick="showColorPicker(\'col_' + a + '\')"></div></div>';
				str += '<div class="FloatLeft HContent35">'
				var fonts = {
					"none": "None",
					"dotted": "Dotted",
					"dashed": "Dashed",
					"solid": "Solid"
				};
				str += '<select class="FullWidth">';
				for( var b in fonts )
				{
					str += '<option value="' + b + '">' + fonts[ b ] + '</option>';
				}
				str += '</select>';
				str += '</div>';
				str += '</div>';
				break;
			}
			case 'fonts':
			{
				var fonts = {
					"sans": "Sans",
					"monospace": "Monospace",
					"lato": "Lato",
					"times new roman": "Times new roman",
					"verdana": "Verdana",
					"courier": "Courier"
				};
				str += '<select class="FullWidth Element" stype="' + d[a].type + '_' + a + '">';
				for( var b in fonts )
				{
					str += '<option value="' + b + '">' + fonts[ b ] + '</option>';
				}
				str += '</select>';
				break;
			}
			case 'textdeco':
			{
				var fonts = {
					"none": "None",
					"underline": "Underline"
				};
				str += '<select class="FullWidth Element" stype="' + d[a].type + '_' + a + '">';
				for( var b in fonts )
				{
					str += '<option value="' + b + '">' + fonts[ b ] + '</option>';
				}
				str += '</select>';
				break;
			}
			case 'fontstyle':
			{
				var fonts = {
					"none": "None",
					"oblique": "Oblique"
				};
				str += '<select class="FullWidth Element" stype="' + d[a].type + '_' + a + '">';
				for( var b in fonts )
				{
					str += '<option value="' + b + '">' + fonts[ b ] + '</option>';
				}
				str += '</select>';
				break;
			}
			case 'weight':
			{
				var fonts = {
					"normal": "Normal",
					"bold": "Bold"
				};
				str += '<select class="FullWidth Element" stype="' + d[a].type + '_' + a + '">';
				for( var b in fonts )
				{
					str += '<option value="' + b + '">' + fonts[ b ] + '</option>';
				}
				str += '</select>';
				break;
			}
			case 'number':
			default:
				str += '<input type="number" class="FullWidth Element" stype="' + d[a].type + '_' + a + '" value="' + d[a].value + '"/>';
				break;
		}
		str += '</div>';
		str += '</div>';
	}
	return str;
}

var cachedStyles = null;
var elementsChecked = {};
var styleData = {};

var messageCommands = {
	// Render all styles
	renderstyles: function( msg, parent, depth )
	{
		var styles = null;
		if( !depth )
		{
			if( !msg.styles ) return;
			cachedStyles = msg;
			depth = 0;
			styles = JSON.parse( msg.styles );
		}
		else
		{
			styles = msg;
		}
		// Clear style elements
		if( !parent )
		{
			parent = ge( 'Styles' );
			parent.innerHTML = '';
		}
		var d = document.createElement( 'div' );
		d.className = 'List Depth' + depth + ( depth === 0 ? 'BordersDefault' : '' );
		var sw = depth == 0 ? 2 : ( depth % 2 );
		for( var a = 0; a < styles.length; a++ )
		{
			sw = sw == 1 ? 2 : 1;
			var ele = document.createElement( 'div' );
			var nam = styles[a].name.split( /[^a-z\ ]/i ).join( '_' ).toLowerCase();
			ele.className = 'sw' + sw;
			var check = 'ch_' + depth + '_' + a;
			// Only render styles if the element is checked
			var data = ( elementsChecked[ check ] && typeof( styles[a].data ) != 'undefined' ) ? renderStyleGUI( styles[a].data ) : '';
			var prechecked = elementsChecked[ check ] ? ' checked="checked"' : '';
			var checkbox = !styles[a].children ? ( ' - <input type="checkbox" id="' + check + '" onclick="toggleStyles( this )"' + prechecked + '/>' ) : '';
			ele.innerHTML = '<div class="HRow" styletype="' + styles[a].rule + '">' +
							'<div class="Padding HContent40 FloatLeft">' + styles[a].name + checkbox + '</div>' + 
							'<div class="Padding HContent60 FloatLeft">' + data + '</div>' +
							'</div>';
			d.appendChild( ele );
			
			// Register HTML element on styles array
			styles[a].elements = ele;
			
			// Traverse children
			if( styles[a].children )
			{
				this.renderstyles( styles[a].children, d, depth + 1 );
			}
		}
		parent.appendChild( d );
		
		// When all done, register events
		if( depth == 0 )
		{
			this.registerElementEvents( styles );
		}
	},
	// Register events
	registerElementEvents: function( arr, path )
	{
		if( !path ) path = 'Root';
		for( var a = 0; a < arr.length; a++ )
		{
			if( !arr[a].elements ) continue;
			var evObj = arr[a].elements.getElementsByTagName( '*' );
			var nam = arr[a].name;
			for( var g = 0; g < evObj.length; g++ )
			{
				if( !evObj[g].getAttribute( 'styletype' ) )
					continue;
				// Got styletype
				var styleType = evObj[ g ].getAttribute( 'styletype' );
				if( !styleType || styleType == 'undefined' ) continue;
				
				// Get properties
				var children = evObj[ g ].getElementsByTagName( '*' );
				
				for( var h = 0; h < children.length; h++ )
				{
					// Skip irrelevant elements
					if( !children[h].getAttribute( 'attrtype' ) ) continue;
					
					var child = children[h];
					var attr = child.getAttribute( 'attrtype' ).split( '_' );
				
					// Go through attribute and set methods that 
					// save data in the right place
					switch( attr[0] )
					{
						case 'color':
						{
							var l = child.getElementsByTagName( 'input' );
							if( !l ) break;
							var cb = child.getElementsByClassName( 'ColorBox' );
							( function( l1, cb0, p, n )
							{
								l1.onchange = function(){ 
									messageCommands.setStyleByPath( p + '/' + n, 'color', this.value ); 
									cb0.style.backgroundColor = this.value;
								};
							} )( l[0], cb[0], path, nam );
							break;
						}
						case 'border':
						{
							var l = child.getElementsByTagName( 'input' );
							if( l.length < 2 ) break;
							var cb = child.getElementsByClassName( 'ColorBox' );
							( function( l1, l2, cb1, p, n )
							{
								l1.onchange = function(){ messageCommands.setStyleByPath( p + '/' + n, 'borderSize', this.value ); };
								l2.onchange = function(){ 
									messageCommands.setStyleByPath( p + '/' + n, 'borderColor', this.value ); 
									cb1.style.backgroundColor = this.value;
								}
							} )( l[0], l[1], cb[0], path, nam );
							var s = child.getElementsByTagName( 'select' );
							( function( s0, p, n )
							{
								s0.onchange = function(){ messageCommands.setStyleByPath( p + '/' + n, 'borderStyle', this.value ); };
							} )( s[0], path, nam );
							break;
						}
						case 'fonts':
						{
							var s = child.getElementsByTagName( 'select' );
							( function( s0, p, n )
							{
								s0.onchange = function(){ messageCommands.setStyleByPath( p + '/' + n, 'fontFamily', this.value ); };
							} )( s[0], path, nam );
							break;
						}
						case 'textdeco':
						{
							var s = child.getElementsByTagName( 'select' );
							( function( s0, p, n )
							{
								s0.onchange = function(){ messageCommands.setStyleByPath( p + '/' + n, 'textDecoration', this.value ); };
							} )( s[0], path, nam );
							break;
						}
						case 'fontstyle':
						{
							var s = child.getElementsByTagName( 'select' );
							( function( s0, p, n )
							{
								s0.onchange = function(){ messageCommands.setStyleByPath( p + '/' + n, 'fontStyle', this.value ); };
							} )( s[0], path, nam );
							break;
						}
						case 'weight':
						{
							var s = child.getElementsByTagName( 'select' );
							( function( s0, p, n )
							{
								s0.onchange = function(){ messageCommands.setStyleByPath( p + '/' + n, 'fontWeight', this.value ); };
							} )( s[0], path, nam );
							break;
						}
						case 'number':
						default:
							var l = child.getElementsByTagName( 'input' );
							( function( l0, p, n, at )
							{
								l0.onchange = function(){ messageCommands.setStyleByPath( p + '/' + n, at, this.value ); };
							} )( l[0], path, nam, attr[1] );
							break;
					}
				}
			}
			// Recursive
			if( arr[a].children )
			{
				var pathHere = path ? ( path + '/' + arr[a].name ) : arr[a].name;
				this.registerElementEvents( arr[a].children, pathHere );
			}
		}
	},
	setStyleByPath: function( path, type, value )
	{
		var pstyle = styleData;
		path = path.split( '/' );
		for( var a = 0; a < path.length; a++ )
		{
			if( !pstyle[ path[a] ] )
				pstyle[ path[a] ] = {};
			pstyle = pstyle[ path[a] ];
		}
		
		// Some processing
		switch( type )
		{
			case 'borderSize':
			case 'borderColor':
			case 'borderStyle':
				if( !pstyle[ 'border' ] )
				{
					pstyle[ 'border' ] = {};
				}
				if( type == 'borderSize' )
					value += 'px';
				pstyle[ 'border' ][ type ] = value;
				break;
			case 'color':
			case 'fontFamily':
			case 'textDecoration':
			case 'fontStyle':
			case 'fontWeight':
			default:
				if( parseInt( value ) > 0 )
					value += 'px';
				pstyle[ type ] = value;
				break;
		}
	}
}

function toggleStyles( ele )
{
	elementsChecked[ ele.id ] = ele.checked;
	messageCommands.renderstyles( cachedStyles );
}

// Handle messages
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	if( typeof( messageCommands[ msg.command ] ) != 'undefined' )
		messageCommands[ msg.command ]( msg );
}

// Apply this style!
function ApplyStyle()
{
	Application.sendMessage( {
		command: 'applystyle',
		style: styleData
	} );
}

