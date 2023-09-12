/*©agpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

/* Palette names:
	Turquoise
	Amethyst
	Emerald
	Peter River
	Sun Flower
	Carrot
	Alizarin
	Orange
	Wet Asphalt
*/
var eventPaletteBackground = [
	'#1abc9c', '#9b59b6', '#2ecc71', '#3498db', 
	'#f1c40f', '#e67e22', '#e74c3c', '#f39c12', '#34495e'
];

var eventPaletteLighter = [
	'#3cc8ac', '#bd84d3', '#51d55c', '#58ade3',
	'#f9d543', '#f49c4d', '#ff7364', '#fcb544', '#4a6075'
];
var eventPaletteForeground = [
	'#ffffff', '#ffffff', '#ffffff', '#ffffff',
	'#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'
];

Date.prototype.getWeek = function()
{
	var onejan = new Date( this.getFullYear(), 0, 1 );
	var today = new Date( this.getFullYear(), this.getMonth(), this.getDate() );
	var dayOfYear = ( ( today - onejan + 86400000 ) / 86400000 );
	return Math.ceil( dayOfYear / 7 );
};

// Global events ---------------------------------------------------------------
var moveListener = null;
var upListener = null;
var eventMode = null; // We're not in an event mode | we are in an event mode
var firstDraw = true;

window.addEventListener( 'mouseup', function( e )
{
	if( upListener ) upListener( e );
} );
window.addEventListener( 'mousemove', function( e )
{
	if( moveListener ) moveListener( e );
} );
// End global events -----------------------------------------------------------

var calendarRowHeight = 27; // <- will be overwritten below w actual height

// Get the users
var userList = {};
function updateUsers()
{
	ge( 'UsersGroups' ).innerHTML = '';
	
	var you = document.createElement( 'div' );
	you.className = 'User';
	you.innerHTML = i18n( 'i18n_user_you' );
	
	var youBall = document.createElement( 'div' );
	youBall.className = 'Ball';
	youBall.style.backgroundColor = eventPaletteBackground[0];
	youBall.style.borderColor = eventPaletteLighter[0];
	you.appendChild( youBall );
	
	ge( 'UsersGroups' ).appendChild( you );
	
	var inc = 1;
	
	for( var a in userList )
	{
		if( a == 'i18n_you' )
			continue;
		var y = document.createElement( 'div' );
		y.className = 'User';
		y.innerHTML = a;
	
		var yo = document.createElement( 'div' );
		yo.className = 'Ball';
		yo.style.backgroundColor = eventPaletteBackground[inc];
		yo.style.borderColor = eventPaletteLighter[inc++];
		y.appendChild( yo );
		
		ge( 'UsersGroups' ).appendChild( y );
	}
}
updateUsers();

function AddEvent( year, month, day )
{
	let v = new View( {
		title: 'Add event',
		width: 500,
		height: 500
	} );
	
	eventMode = v;
	
	let date = year + '-' + 
		StrPad( month, 2, '0' ) + '-' +
		StrPad( day, 2, '0' );

	let now = new Date();
	let nowTime = StrPad( now.getHours(), 2, '0' ) + ':' +
				  StrPad( now.getMinutes(), 2, '0' ) + ':' +
				  '00';

	var f = new File( 'Progdir:Templates/event.html' );
	f.replacements = {
		title: '',
		leadin: '',
		timefrom: nowTime,
		timeto: nowTime,
		date: date,
		dateTo: date,
		timeslot: ' checked="checked"',
		allweek: '',
		allday: '',
		ID: 0,
		parentViewId: Application.viewId
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

function EditEvent( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		// TODO: Display some kind of error message
		if( e != 'ok' )
			return;
		
		var evd;
		try
		{
			evd = JSON.parse( d );
		}
		catch( e )
		{
			// TODO: Display some kind of error message
			return;
		}
		var v = new View( {
			title: i18n( 'i18n_edit_event' ),
			width: 500,
			height: 550
		} );
		
		try
		{
			var md = JSON.parse( evd.MetaData );
			evd.MetaData = md;
		}
		catch( e )
		{
		}
		
		var allDay = evd.MetaData.AllDay;
		var allWeek = evd.MetaData.AllWeek;
		
		evd.TimeFrom = evd.TimeFrom.split( ':' );
		evd.TimeTo = evd.TimeTo.split( ':' );
		if( evd.TimeFrom[ 0 ] == '24' ) evd.TimeFrom[ 0 ] = '00';
		if( evd.TimeTo[   0 ] == '24' ) evd.TimeTo[   0 ] = '00';
		evd.TimeFrom = evd.TimeFrom.join( ':' );
		evd.TimeTo = evd.TimeTo.join( ':' );
		
		var f = new File( 'Progdir:Templates/event.html' );
		f.replacements = {
			title: evd.Title,
			leadin: evd.Description,
			timefrom: evd.TimeFrom + ':00',
			timeto: evd.TimeTo + ':00',
			date: evd.Date,
			dateTo: evd.MetaData.DateTo,
			time: !allWeek && !allDay ? ' checked="checked"' : '',
			allday: allDay ? ' checked="checked"' : '',
			allweek: allWeek ? ' checked="checked"' : '',
			ID: id,
			parentViewId: Application.viewId
		};
		f.i18n();
		f.onLoad = function( data )
		{
			v.setContent( data );
		}
		f.load();
		eventMode = v;
	}
	m.execute( 'getcalendarevent', { cid: id } );
}


// Previous month
function GoPrevious( e )
{
	var y = Calendar.dateArray[0];
	var m = Calendar.dateArray[1];
	var d = Calendar.dateArray[2];
	
	if( Calendar.listMode == 'month' )
	{
		if( --m < 0 ){ m = 11; y--; }
		Calendar.date = new Date( y, m, d );
	}
	// Week
	else
	{
		var d = new Date( y, m, d );
		var t = d.getTime();
		
		// Find start of week (where monday is 1)
		var findDay = d.getDay();
		if( ( new Date( t ).getDay() ) != 1 )
		{
			while( findDay != 1 )
			{
				t -= 86400000;
				findDay = new Date( t ).getDay();
			}
		}
		t -= 604800000; // (a week)
		Calendar.date = new Date( t );
	}
	
	Calendar.render();
}

// Next month
function GoNext()
{
	var y = Calendar.dateArray[0];
	var m = Calendar.dateArray[1];
	var d = Calendar.dateArray[2];
	
	if( Calendar.listMode == 'month' )
	{
		if( ++m > 11 ){ m = 0; y++; }
		Calendar.date = new Date( y, m, 1 );
	}
	// Week
	else
	{
		var d = new Date( y, m, d );
		var t = d.getTime();
		
		// Find start of week (where monday is 1)
		var findDay = d.getDay();
		if( ( new Date( t ).getDay() ) != 1 )
		{
			while( findDay != 1 )
			{
				t -= 86400000;
				findDay = new Date( t ).getDay();
			}
		}
		t += 604800000; // (a week)
		Calendar.date = new Date( t );
	}
	
	Calendar.render();
}


Application.run = function( msg, iface )
{
	ge( 'monthoverview' ).onclick = function()
	{
		Calendar.listMode = 'month';
		Calendar.render();
	}
	ge( 'weekoverview' ).onclick = function()
	{
		Calendar.listMode = 'week';
		Calendar.render();
	}
	
	Calendar.date = new Date();
	Calendar.render();
}

window.addEventListener( 'resize', function()
{
	Calendar.refresh();
} );

Application.receiveMessage = function( msg )
{
	var self = this;
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'closesharing':	
			if( Application.sharing )
			{
				Application.sharing.close();
			}
			break;
		case 'refresh':
			if( eventMode )
				eventMode.close();
			self.sendMessage( {
				command: 'refresh_calendar'
			} );
			break;
		case 'saveevent':
			var ed = msg.eventData;
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
				    self.sendMessage( {
					    command: 'refresh_calendar'
				    } );
				    
				    AnnounceCalendarChanges();
				}
			}
			m.execute(
				ed.id > 0 ? 'savecalendarevent' : 'addcalendarevent',
				{
					event: {
						Title: ed.title,
						Description: ed.leadin,
						TimeTo: ed.timeTo,
						TimeFrom: ed.timeFrom,
						AllDay: ed.allDay,
						AllWeek: ed.allWeek,
						Date: ed.date,
						DateTo: ed.dateTo
					},
					cid: ed.id > 0 ? ed.id: 0
				}
			);
			if( eventMode )
			{
				eventMode.close();
			}
			break;
		case 'setcalendarmode':
			Calendar.listMode = msg.mode;
			Calendar.render();
			break;
		case 'updateEvents':
			Calendar.events = [];
			let tspan = 60 * 60 * 24 * 1000;
			for( let a = 0; a < msg.events.length; a++ )
			{
				let ev = msg.events[a];
				
				let d = ev.DateStart.split( ' ' )[0];
				d = d.split( '-' );
				let from = new Date( d[0], d[1] - 1, d[2] );
				let fromTime = from.getTime();
				
				let t = ev.DateEnd.split( ' ' )[0];
				t = t.split( '-' );
				let to = new Date( t[0], t[1] - 1, t[2] );
				let toTime = to.getTime();
				
				// Make sure we have toTime
				if( toTime < fromTime )
					toTime = fromTime;
				
				// Fill this date in
				for( let b = fromTime; b <= toTime; b += tspan )
				{
					let k = new Date( b );
					k = k.getFullYear() + '-' + ( k.getMonth() + 1 ) + '-' + k.getDate();
					if( typeof( Calendar.events[k] ) == 'undefined' )
						Calendar.events[k] = [];
					Calendar.events[k].push( ev );
				}
			}
			Calendar.render();
			break;
	}
}


var nowDiv = null;
function drawNow()
{
	if( ge( 'nowdiv' ) )
	{
		nowDiv = ge( 'nowdiv' );
	}
	if( nowDiv )
	{
		var d = new Date();
		var cd = ge( 'MainView' ).querySelector( '.CalendarDates' ).querySelector( '.Day' );
		var tint = Math.floor( ( d.getHours() * 100 ) + d.getMinutes() ) / 2400;
		nowDiv.style.top = Math.floor( tint * cd.offsetHeight ) + 'px';
	}
}
setInterval( drawNow, 10000 );

// Sharing ---------------------------------------------------------------------

function doShare()
{
	if( Application.sharing )
	{
		Application.sharing.activate();
		return;
	}
	var v = new View( {
		title: i18n( 'i18n_share_your_calendar' ),
		width: 500,
		height: 500
	} );
	Application.sharing = v;
	var f = new File( 'Progdir:Templates/share.html' );
	f.replacements = {
		pid: Application.viewId
	};
	f.i18n();
	f.onLoad = function( data )
	{
		if( v && v.setContent )
			v.setContent( data );
	}
	f.load();
	v.onClose = function()
	{
		Application.sharing = null;
	}
}

// Server announcements --------------------------------------------------------

function AnnounceCalendarChanges()
{
    // Who are we sharing with?
    // Get connected users
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			let usl = null;
			try
			{
				usl = JSON.parse( d );
			}
			catch( e ){};
			if( usl.length )
			{
				return checkWorkgroups( usl );
			}
		}
		checkWorkgroups( false );
	}
	m.execute( 'listconnectedusers' );
	
	function checkWorkgroups( userList )
	{
	    // Get connected workgroups
	    let g = new Module( 'system' );
	    g.onExecuted = function( e, d )
	    {
		    if( e == 'ok' )
		    {
			    let wl = null;
			    try
			    {
				    wl = JSON.parse( d );
			    }
			    catch( e ){};
			    if( wl.length )
			    {
				   return dataSift( userList, wl );
			    }
		    }
		    return dataSift( userList, false );
	    }
	    g.execute( 'workgroups', { connected: true } );
	}
	
    // Sift through users and workgroups
	function dataSift( userList, workgroups )
	{
	    let outU = [];
	    let outW = [];
	    if( userList )
	    {
	        for( let a = 0; a < userList.length; a++ )
	        {
	            outU.push( userList[ a ].ID );
	        }
	    }
	    if( workgroups )
	    {
	        for( let a = 0; a < workgroups.length; a++ )
	        {
	            outW.push( workgroups[ a ].ID );
	        }
	    }
        // Place announcement
        // Payload is important with signifying which application it is. The
        // event will be sent there
	    Friend.announce( {
	        type: 'calendar-event',
	        users: outU.length ? outU : false,
	        workgroups: outW.length ? outW : false,
	        payload: '{"event":"new-calendar-event","application":"FriendCalendar"}'
	    }, function( response )
	    {
	        console.log( 'Response from announcement: ', response );
	    } );
	}
}


