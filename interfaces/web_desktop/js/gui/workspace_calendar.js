Workspace.createCalendar = function( wid, sessions )
{
	if( !wid ) return;
	
	var m = this.widget ? this.widget.target : ge( 'DoorsScreen' );
	
	var d = '<hr class="Divider"/>\
			<div class="Padding"><p class="Layout"><strong>' + i18n( 'i18n_active_session_list' ) + ':</strong></p>\
			' + ( sessions.length > 0 ? sessions.join( '' ) : '<ul><li>' + i18n( 'i18n_no_other_sessions_available' ) + '.</li></ul>' ) + '\
			</div>\
			';
	
	var calendar = new Calendar( wid.dom );
	wid.dom.id = 'CalendarWidget';

	Workspace.calendarWidget = wid;

	var newBtn = calendar.createButton( 'fa-calendar-plus-o' );
	newBtn.onclick = function()
	{
		Workspace.newCalendarEvent();
	}
	calendar.addButton( newBtn );

	/*
		TODO: Re-enable the wrench when we have a working calendar
	var geBtn = calendar.createButton( 'fa-wrench' );
	geBtn.onclick = function()
	{
		ExecuteApplication( 'FriendCalendar' );
	}
	calendar.addButton( geBtn );*/

	// Add events to calendar!
	calendar.eventWin = false;
	calendar.onSelectDay = function( date )
	{
		calendar.date.setDate( parseInt( date.split( '-' )[2] ) );
		calendar.date.setMonth( parseInt( date.split( '-' )[1] ) - 1 );
		calendar.date.setFullYear( parseInt( date.split( '-' )[0] ) );
		calendar.render();
	}

	calendar.setDate( new Date() );
	calendar.onRender = function( callback )
	{
		var md = new Module( 'system' );
		md.onExecuted = function( e, d )
		{
			try
			{
				// Update events
				var eles = JSON.parse( d );
				calendar.events = [];
				for( var a in eles )
				{
					if( !calendar.events[eles[a].Date] )
						calendar.events[eles[a].Date] = [];
					calendar.events[eles[a].Date].push( eles[a] );
				}
			}
			catch( e )
			{
			}
			calendar.render( true );
			wid.autosize();
			ge( 'DoorsScreen' ).screenObject.resize();
			wid.dom.classList.add( 'Loaded' );
		}
		md.execute( 'getcalendarevents', { date: calendar.date.getFullYear() + '-' + ( calendar.date.getMonth() + 1 ) } );
	}
	calendar.render();
	Workspace.calendar = calendar;

	m.calendar = calendar;

	var sess = document.createElement( 'div' );
	sess.className = 'ActiveSessions';
	sess.innerHTML = d;
	wid.dom.appendChild( sess );
	m.sessions = sess;
};

Workspace.newCalendarEvent = function()
{	
	var m = this.widget ? this.widget.target : ge( 'DoorsScreen' );
	var wid = this.widget;
	var calendar = Workspace.calendar;

	let source = new Date();
	if( calendar )
	{
		source = calendar.date;
	}
	else calendar = {};
	
	var date = source.getFullYear() + '-' + ( source.getMonth() + 1 ) + '-' + source.getDate();
	var dateForm = date.split( '-' );
	dateForm = dateForm[0] + '-' + StrPad( dateForm[1], 2, '0' ) + '-' + StrPad( dateForm[2], 2, '0' );

	calendar.eventWin = new View( {
		title: i18n( 'i18n_event_overview' ),
		width: 700,
		height: 445
	} );

	calendar.eventWin.onClose = function()
	{
		calendar.eventWin = false;
	}

	var f1 = new File( 'System:templates/calendar_event_add.html' );
	f1.replacements = { date: dateForm };
	f1.i18n();
	f1.onLoad = function( data1 )
	{
		calendar.eventWin.setContent( data1 );
	}
	f1.load();

	// Just close the widget
	if( m && wid )
		wid.hide();

}

Workspace.removeCalendarEvent = function( id )
{
	Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_evt_delete_desc' ), function( ok )
	{
		if( ok )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e )
			{
				if( e == 'ok' )
				{
					// Refresh
					if( Workspace.calendar ) Workspace.calendar.render();
					return;
				}
				Notify( { title: i18n( 'i18n_evt_delete_failed' ), text: i18n( 'i18n_evt_delete_failed_desc' ) } );
			}
			m.execute( 'deletecalendarevent', { id: id } );
		}
	} );
};
Workspace.addCalendarEvent = function()
{
	let date = ge( 'calDateField' ).value;
	let tmto = ge( 'calTimeTo' ).value;
	let tmfr = ge( 'calTimeFrom' ).value;
	let dfro = ge( 'calDateTo' ).value;
	
	let timefrom = new Date( date + ' ' + tmfr ).getTime();
	let timeto   = new Date( ( Trim( dfro ) ? dfro : date ) + ' ' + tmto ).getTime();
	if( timeto < timefrom )
	{
		Notify( { title: i18n( 'i18n_to_not_in_past' ), text: i18n( 'i18n_to_not_in_past_desc' ) } );
		ge( 'calTimeFrom' ).focus();
		return;
	}
	
	
	let evt = {
		Title: ge( 'calTitle' ).value,
		Description: ge( 'calDescription' ).value,
		TimeFrom: ge( 'calTimeFrom' ).value,
		TimeTo: ge( 'calTimeTo' ).value,
		Date: ge( 'calDateField' ).value,
		DateTo: ge( 'calDateTo' ).value
	};
	
	if( ge( 'calendarEventParticipants' ) )
	{
		evt.Participants = ge( 'calendarEventParticipants' ).value;
		if( !evt.Participants ) evt.Participants = '';
	}
	let metadata = {};
	let metadataset = 0;
	
	if( ge( 'CalEvtMeetingLocation' ) )
	{
		metadata.Location = ge( 'CalEvtMeetingLocation' ).value;
		metadataset++;
	}
	
	if( ge( 'CalEvtMeetingLink' ) )
	{
		metadata.Link = ge( 'CalEvtMeetingLink' ).value;
		metadataset++;
	}
	
	if( metadataset > 0 )
		evt.MetaData = JSON.stringify( metadata );

	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Notify( { title: i18n( 'i18n_evt_added' ), text: i18n( 'i18n_evt_addeddesc' ) } );
			if( Workspace.calendar && Workspace.calendar.eventWin )
				Workspace.calendar.eventWin.close();
			if( Workspace.calendar && Workspace.calendar.render )
				Workspace.calendar.render();
		}
	}
	m.execute( 'addcalendarevent', { event: evt } );
};
// Edit a calendar event
Workspace.editCalendarEvent = function( id )
{
	let calendar = Workspace.calendar;
	
	if( calendar.editWin ) return;
	
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			let row = JSON.parse( d );
			
			let date = row.Date;
			
			calendar.editWin = new View( {
				title: i18n( 'i18n_event_overview' ),
				width: 500,
				height: 445
			} );

			calendar.editWin.onClose = function()
			{
				calendar.editWin = false;
			}

			let f1 = new File( 'System:templates/calendar_event_edit.html' );
			f1.replacements = { 
				date:         date,
				timefrom:     row.TimeFrom,
				timeto:       row.TimeTo,
				timedisabled: row.TimeFrom == '00:00' && time.TimeTo == '00:00' ? ' disabled="disabled"' : '',
				title:        row.Title,
				type:         row.Type,
				description:  row.Description,
				id:           id
			};
			f1.i18n();
			f1.onLoad = function( data1 )
			{
				calendar.editWin.setContent( data1 );
			}
			f1.load();
		}
	}
	m.execute( 'getcalendarevent', { cid: id } );
};
Workspace.saveCalendarEvent = function( id )
{
	if( !Workspace.calendar.editWin ) return;
	var w = Workspace.calendar.editWin;
	var fields = {};
	var inps = w.content.getElementsByTagName( 'input' );
	for( var a = 0; a < inps.length; a++ )
		fields[ inps[ a ].id ] = inps[ a ].value;
	var txts = w.content.getElementsByTagName( 'textarea' );
	for( var a = 0; a < txts.length; a++ )
		fields[ txts[ a ].id ] = txts[ a ].value;
	var sels = w.content.getElementsByTagName( 'select' );
	for( var a = 0; a < txts.length; a++ )
		fields[ sels[ a ].id ] = sels[ a ].value;
	
	var evt = {
		Title: fields.calTitle,
		TimeFrom: fields.calTimeFrom,
		TimeTo: fields.calTimeTo,
		Description: fields.calDescription,
		Date: fields.calDateField
	};
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			// Refresh
			if( Workspace.calendar ) Workspace.calendar.render();
			if( Workspace.calendar.editWin )
			{
				Workspace.calendar.editWin.close();
			}
			return;
		}
	}
	m.execute( 'savecalendarevent', { cid: id, event: evt } );
};
// Poll the calendar gui to change depending on user choices
Workspace.pollCalendarEventGui = function()
{
	if( ge( 'calType' ) )
	{
		if( ge( 'calType' ).value == 'meeting' )
		{
			var f = new File( 'System:templates/calendar_event_type_meeting.html' );
			f.i18n();
			f.onLoad = function( data )
			{
				if( ge( 'calType' ) && ge( 'calType' ).value == 'meeting' )
				{
					let participants = [];
					let loaded = false;
					function removeParticipant( id )
					{
						let out = [];
						for( let c = 0; c < participants.length; c++ )
						{
							if( participants[ c ].ID == id )
								continue;
							out.push( participants[ c ] );
						}
						participants = out;
						redrawParticipants();
					}
					function addParticipant( id )
					{
						let o = new Module( 'system' );
						o.onExecuted = function( e, d )
						{
							if( e == 'ok' )
							{
								participants.push( JSON.parse( d ) );
								redrawParticipants();
							}
						}
						o.execute( 'getcontact', { contactid: id } );
					}
					function redrawParticipants()
					{
						if( !loaded )
						{
							var m = new Module( 'system' );
							m.onExecuted = function( e, d )
							{
								if( e == 'ok' )
								{
									participants = JSON.parse( d );
								}
								else
								{
									participants = [];
								}
								redrawParticipants();
							}
							m.execute( 'getcalendareventparticipants', { eventid: false } );
							loaded = true;
						}
						else
						{
							if( ge( 'CalEvtMeetingParticipants' ) )
							{
								let gstr = '';
								let parts = [];
								if( participants.length )
								{
									gstr += '<div class="List">';
									let sw = 2;
									for( let c = 0; c < participants.length; c++ )
									{
										parts.push( participants[ c ].ID );
										sw = sw == 2 ? 1 : 2;
										gstr += '<div class="HRow sw' + sw + '">';
										gstr += '<div class="PaddingSmall HContent45 FloatLeft Ellipsis">' + participants[c].Firstname + ' ' + participants[c].Lastname + '</div>';
										gstr += '<div class="BorderLeft PaddingSmall HContent45 FloatLeft Ellipsis">' + participants[c].Email + '</div>';
										gstr += '<div class="PaddingSmall HContent10 FloatLeft Ellipsis TextRight"><span attrid="' + participants[c].ID + '" class="IconSmall fa-remove"></span></div>';
										gstr += '</div>';
									}
									gstr += '</div>';
									// Just add the participants
									ge( 'calendarEventParticipants' ).value = parts.join( ',' );
								}
								else
								{
									gstr += '<div class="PaddingSmall">' + i18n( 'i18n_no_participants_here' ) + '</div>';
								}
								ge( 'CalEvtMeetingParticipants' ).innerHTML = gstr;
								let spans = ge( 'CalEvtMeetingParticipants' ).getElementsByTagName( 'span' );
								for( let c = 0; c < spans.length; c++ )
								{
									spans[ c ].onclick = function()
									{
										removeParticipant( this.getAttribute( 'attrid' ) );
									}
								}
							}
						}
					}
				
					// Set the template
					ge( 'calTypeGui' ).innerHTML = data;
					
					redrawParticipants();
					
					let timeo = null;
					let selection = ge( 'CalEvtMeetingParticipantsSelection' );
					ge( 'calTypeGui' ).onclick = function()
					{
						selection.classList.remove( 'Showing', 'List' );
						ge( 'CalEvtMeetingContacts' ).value = '';
					}
					ge( 'CalEvtMeetingContacts' ).onkeyup = function()
					{
						if( timeo ) clearTimeout( timeo );
						timeo = setTimeout( function()
						{
							if( ge( 'CalEvtMeetingContacts' ) )
							{
								var m = new Module( 'system' );
								m.onExecuted = function( e, d )
								{
									if( e == 'ok' )
									{
										let list = JSON.parse( d );
										selection.classList.add( 'Showing', 'List' );
										let sw = 2, str = '';
										for( let c = 0; c < list.length; c++ )
										{
											sw = sw == 2 ? 1 : 2;
											str += '<div class="HRow sw' + sw + ' "attrid="' + list[c].ID + '">';
											str += '<div class="PaddingSmall HContent45 FloatLeft Ellipsis">' + list[c].Firstname + ' ' + list[c].Lastname + '</div>';
											str += '<div class="BorderLeft PaddingSmall HContent45 FloatLeft Ellipsis">' + list[c].Email + '</div>';
											str += '<div class="PaddingSmall HContent10 FloatLeft Ellipsis TextRight"><span></span></div>';
											str += '</div>';
										}
										selection.innerHTML = str;
										var eles = selection.getElementsByClassName( 'HRow' );
										for( let c = 0; c < eles.length; c++ )
										{
											eles[ c ].onclick = function( e )
											{
												if( this.classList && this.classList.contains( 'Selected' ) )
												{
													this.classList.remove( 'Selected' );
													let sp = this.getElementsByTagName( 'span' );
													sp[0].className = '';
													removeParticipant( this.getAttribute( 'attrid' ) );
												}
												else
												{
													this.classList.add( 'Selected' );
													let sp = this.getElementsByTagName( 'span' );
													sp[0].className = 'IconSmall fa-check';
													addParticipant( this.getAttribute( 'attrid' ) );
												}
												return cancelBubble( e );
											}
										}
									}
									else
									{
										selection.classList.remove( 'Showing' );
									}
								}
								m.execute( 'getcontacts', { search: ge( 'CalEvtMeetingContacts' ).value } );
							}
						}, 250 );
					}
				}
			}
			f.load();
		}
		else
		{
			ge( 'calTypeGui' ).innerHTML = '';
		}
	}
};
