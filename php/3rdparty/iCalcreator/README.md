# iCalcreator

is the PHP class package managing

> iCal (rfc2445/rfc5545) calendar information

operating on calendar and
calendar events, reports, todos and journaling data.

~~~~~~~~

iCalcreator supports systems like

* calendars
* CMS
* project management systems
* other applications...

~~~~~~~~
__Builds__

Please review the releaseNotes for a brief overview, 
docs/summary and docs/using for details.

Stable 2.28 *(master)*.

Release 2.30 candidate (tag 2.29.8)

Unsupported (tags): 
- 2.26.9
- 2.26
- 2.24.2
- 2.24
- 2.22.5


Brief 2.28 demo :

``` php
<?php

use Kigkonsult\Icalcreator\Vcalendar;
use DateTime;
use DateTimezone;

    // create a new calendar
$vcalendar = Vcalendar::factory( [ Vcalendar::UNIQUE_ID => "kigkonsult.se", ] )

    // with calendaring info
                 ->setMethod( Vcalendar::PUBLISH )
                 ->setXprop(
                      Vcalendar::X_WR_CALNAME,
                      "Calendar Sample"
                 )
                 ->setXprop(
                      Vcalendar::X_WR_CALDESC,
                      "This is a demo calendar"
                 )
                 ->setXprop(
                      Vcalendar::X_WR_RELCALID,
                      "3E26604A-50F4-4449-8B3E-E4F4932D05B5"
                 )
                 ->setXprop(
                      Vcalendar::X_WR_TIMEZONE,
                      "Europe/Stockholm"
                 );

    // create a new event
$event1 = $vcalendar->newVevent()
              ->setTransp( Vcalendar::OPAQUE )
              ->setClass( Vcalendar::P_BLIC )
              ->setSequence( 1 )
    // describe the event
              ->setSummary( 'Scheduled meeting with five occurrences' )
              ->setDescription(
                   'Agenda for the the meeting...',
                   [ Vcalendar::ALTREP => 
                       'CID:<FFFF__=0ABBE548DFE235B58f9e8a93d@coffeebean.com>' ]
              )
              ->setComment( 'It\'s going to be fun..' )
    // place the event
              ->setLocation( 'Kafé Ekorren Stockholm' )
              ->setGeo( '59.32206', '18.12485' )
    // set the time
              ->setDtstart(
                  new DateTime(
                      '20190421T090000',
                      new DateTimezone( 'Europe/Stockholm' )
                  )
              )
              ->setDtend(
                  new DateTime(
                      '20190421T100000',
                      new DateTimezone( 'Europe/Stockholm' )
                  )
              )
    // with recurrence rule
              ->setRrule( 
                  [
                      Vcalendar::FREQ  => Vcalendar::WEEKLY,
                      Vcalendar::COUNT => 5,
                  ]
              )
    // and set another on a specific date
              ->setRdate(
                  [
                      new DateTime(
                          '20190609T090000',
                          new DateTimezone( 'Europe/Stockholm' )
                      ),
                      new DateTime(
                          '20190609T110000',
                          new DateTimezone( 'Europe/Stockholm' )
                      ),
                  ],
                  [ Vcalendar::VALUE => Vcalendar::PERIOD ]
              )
    // and revoke a recurrence date
              ->setExdate(
                  new DateTime(
                      '2019-05-12 09:00:00',
                      new DateTimezone( 'Europe/Stockholm' )
                  )
              )
    // organizer, chair and some participants
              ->setOrganizer(
                  'secretary@coffeebean.com',
                  [ Vcalendar::CN => 'Secretary CoffeeBean' ]
              )
              ->setAttendee(
                  'president@coffeebean.com',
                  [
                      Vcalendar::ROLE     => Vcalendar::CHAIR,
                      Vcalendar::PARTSTAT => Vcalendar::ACCEPTED,
                      Vcalendar::RSVP     => Vcalendar::FALSE,
                      Vcalendar::CN       => 'President CoffeeBean',
                  ]
              )
              ->setAttendee(
                  'participant1@coffeebean.com',
                  [
                      Vcalendar::ROLE     => Vcalendar::REQ_PARTICIPANT,
                      Vcalendar::PARTSTAT => Vcalendar::NEEDS_ACTION,
                      Vcalendar::RSVP     => Vcalendar::TRUE,
                      Vcalendar::CN       => 'Participant1 CoffeeBean',
                  ]
              )
              ->setAttendee(
                  'participant2@coffeebean.com',
                  [
                      Vcalendar::ROLE     => Vcalendar::REQ_PARTICIPANT,
                      Vcalendar::PARTSTAT => Vcalendar::NEEDS_ACTION,
                      Vcalendar::RSVP     => Vcalendar::TRUE,
                      Vcalendar::CN       => 'Participant2 CoffeeBean',
                  ]
              );
              
    // add alarm for the event
$alarm = $event1->newValarm()
             ->setAction( Vcalendar::DISPLAY )
    // copy description from event
             ->setDescription( $event1->getDescription())
    // fire off the alarm one day before
             ->setTrigger( '-P1D' );

    // alter day and time for one event in recurrence set
$event2 = $vcalendar->newVevent()
              ->setTransp( Vcalendar::OPAQUE )
              ->setClass( Vcalendar::P_BLIC )
    // reference to event in recurrence set
              ->setUid( $event1->getUid())
              ->setSequence( 2 )
    // pointer to event in the recurrence set
              ->setRecurrenceid( '20190505T090000 Europe/Stockholm' )
    // reason text 
              ->setDescription(
                  'Altered day and time for event 2019-05-05',
                  [ Vcalendar::ALTREP => 
                      'CID:<FFFF__=0ABBE548DFE235B58f9e8a93d@coffeebean.com>' ]
              )
              ->setComment( 'Now we are working hard for two hours' )
    // the altered day and time with duration 
              ->setDtstart(
                  new DateTime(
                      '20190504T100000',
                      new DateTimezone( 'Europe/Stockholm' )
                  )
              )
              ->setDuration( 'PT2H' )
    // add alarm (copy from event1)
              ->setComponent( 
                  $event1->getComponent( Vcalendar::VALARM )
              );

$vcalendarString = 
    // apply appropriate Vtimezone with Standard/DayLight components 
    $vcalendar->vtimezonePopulate()
    // and create the (string) calendar
    ->createCalendar();
```

And the content of the ```$vcalendarString``` :

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//kigkonsult.se//NONSGML kigkonsult.se iCalcreator 2.27.16//
METHOD:PUBLISH
X-WR-CALNAME:Calendar Sample
X-WR-CALDESC:This is a demo calendar
X-WR-RELCALID:3E26604A-50F4-4449-8B3E-E4F4932D05B5
X-WR-TIMEZONE:Europe/Stockholm
BEGIN:VTIMEZONE
TZID:Europe/Stockholm
BEGIN:STANDARD
TZNAME:CET
DTSTART:20181028T030000
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
RDATE:20191027T030000
RDATE:20201025T030000
END:STANDARD
BEGIN:DAYLIGHT
TZNAME:CEST
DTSTART:20190331T020000
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
RDATE:20200329T020000
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
UID:20190312T194303CET-3879fa226b@kigkonsult.se
DTSTAMP:20190312T184303Z
ATTENDEE;ROLE=CHAIR;PARTSTAT=ACCEPTED;CN=President CoffeeBean:MAILTO:presid
 ent@coffeebean.com
ATTENDEE;RSVP=TRUE;CN=Participant1 CoffeeBean:MAILTO:participant1@coffeebea
 n.com
ATTENDEE;RSVP=TRUE;CN=Participant2 CoffeeBean:MAILTO:participant2@coffeebea
 n.com
COMMENT:It's going to be fun..
CLASS:PUBLIC
DESCRIPTION;ALTREP="CID:<FFFF__=0ABBE548DFE235B58f9e8a93d@coffeebean.com>":
 Agenda for the the meeting...
DTSTART;TZID=Europe/Stockholm:20190421T090000
DTEND;TZID=Europe/Stockholm:20190421T100000
EXDATE;TZID=Europe/Stockholm:20190512T090000
GEO:+59.32206;+18.12485
LOCATION:Kafé Ekorren Stockholm
ORGANIZER;CN=Secretary CoffeeBean:MAILTO:secretary@coffeebean.com
RDATE;VALUE=PERIOD;TZID=Europe/Stockholm:20190609T090000/20190609T110000
RRULE:FREQ=WEEKLY;COUNT=5
SEQUENCE:1
SUMMARY:Scheduled meeting with six occurrences
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Agenda for the the meeting...
TRIGGER:-P1D
END:VALARM
END:VEVENT
BEGIN:VEVENT
UID:20190312T194303CET-3879fa226b@kigkonsult.se
DTSTAMP:20190312T184303Z
COMMENT:Now we are working hard for two hours
CLASS:PUBLIC
DESCRIPTION;ALTREP="CID:<FFFF__=0ABBE548DFE235B58f9e8a93d@coffeebean.com>":
 Altered day and time for event 2019-05-05
DTSTART;TZID=Europe/Stockholm:20190504T100000
DURATION:PT2H
RECURRENCE-ID;TZID=Europe/Stockholm:20190505T090000
SEQUENCE:2
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Agenda for the the meeting...
TRIGGER:-P1D
END:VALARM
END:VEVENT
END:VCALENDAR
```
