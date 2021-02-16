<?php
/**
  * iCalcreator, the PHP class package managing iCal (rfc2445/rfc5445) calendar information.
 *
 * copyright (c) 2007-2019 Kjell-Inge Gustafsson, kigkonsult, All rights reserved
 * Link      https://kigkonsult.se
 * Package   iCalcreator
 * Version   2.28
 * License   Subject matter of licence is the software iCalcreator.
 *           The above copyright, link, package and version notices,
 *           this licence notice and the invariant [rfc5545] PRODID result use
 *           as implemented and invoked in iCalcreator shall be included in
 *           all copies or substantial portions of the iCalcreator.
 *
 *           iCalcreator is free software: you can redistribute it and/or modify
 *           it under the terms of the GNU Lesser General Public License as published
 *           by the Free Software Foundation, either version 3 of the License,
 *           or (at your option) any later version.
 *
 *           iCalcreator is distributed in the hope that it will be useful,
 *           but WITHOUT ANY WARRANTY; without even the implied warranty of
 *           MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *           GNU Lesser General Public License for more details.
 *
 *           You should have received a copy of the GNU Lesser General Public License
 *           along with iCalcreator. If not, see <https://www.gnu.org/licenses/>.
 *
 * This file is a part of iCalcreator.
*/

namespace Kigkonsult\Icalcreator;

/**
 * interface IcalInterface
 *
 * @author      Kjell-Inge Gustafsson <ical@kigkonsult.se>
 * @since  2.27.11 - 2019-01-02
 */
interface IcalInterface
{
    /**
     * Class constants, components
     */
    const VTIMEZONE        = 'Vtimezone';
    const STANDARD         = 'Standard';
    const DAYLIGHT         = 'Daylight';
    const VEVENT           = 'Vevent';
    const VTODO            = 'Vtodo';
    const VJOURNAL         = 'Vjournal';
    const VFREEBUSY        = 'Vfreebusy';
    const VALARM           = 'Valarm';

    /**
     * Class constants, iCal component property names
     */
    const ACTION           = 'ACTION';
    const ATTACH           = 'ATTACH';
    const ATTENDEE         = 'ATTENDEE';
    const CALSCALE         = 'CALSCALE';
    const CATEGORIES       = 'CATEGORIES';
    const KLASS            = 'CLASS';        // note CLASS
    const COMMENT          = 'COMMENT';
    const COMPLETED        = 'COMPLETED';
    const CONTACT          = 'CONTACT';
    const CREATED          = 'CREATED';
    const DESCRIPTION      = 'DESCRIPTION';
    const DTEND            = 'DTEND';
    const DTSTAMP          = 'DTSTAMP';
    const DTSTART          = 'DTSTART';
    const DUE              = 'DUE';
    const DURATION         = 'DURATION';
    const EXDATE           = 'EXDATE';
    const EXRULE           = 'EXRULE';
    const FREEBUSY         = 'FREEBUSY';
    const GEO              = 'GEO';
    const GEOLOCATION      = 'GEOLOCATION';
    const LAST_MODIFIED    = 'LAST-MODIFIED';
    const LOCATION         = 'LOCATION';
    const METHOD           = 'METHOD';
    const ORGANIZER        = 'ORGANIZER';
    const PERCENT_COMPLETE = 'PERCENT-COMPLETE';
    const PRIORITY         = 'PRIORITY';
    const PRODID           = 'PRODID';
    const RECURRENCE_ID    = 'RECURRENCE-ID';
    const RELATED_TO       = 'RELATED-TO';
    const REPEAT           = 'REPEAT';
    const REQUEST_STATUS   = 'REQUEST-STATUS';
    const RESOURCES        = 'RESOURCES';
    const RDATE            = 'RDATE';
    const RRULE            = 'RRULE';
    const SEQUENCE         = 'SEQUENCE';
    const STATUS           = 'STATUS';
    const SUMMARY          = 'SUMMARY';
    const TRANSP           = 'TRANSP';
    const TRIGGER          = 'TRIGGER';
    const TZID             = 'TZID';
    const TZNAME           = 'TZNAME';
    const TZOFFSETFROM     = 'TZOFFSETFROM';
    const TZOFFSETTO       = 'TZOFFSETTO';
    const TZURL            = 'TZURL';
    const UID              = 'UID';
    const URL              = 'URL';
    const VERSION          = 'VERSION';
    const X_PROP           = 'X-PROP';


    /**
     * iCal property METHOD types
     */
    const PUBLISH        = 'PUBLISH';
    const REQUEST        = 'REQUEST';
    const REPLY          = 'REPLY';
    const ADD            = 'ADD';
    const CANCEL         = 'CANCEL';
    const REFRESH        = 'REFRESH';
    const COUNTER        = 'COUNTER';
    const DECLINECOUNTER = 'DECLINECOUNTER';


    /**
     * iCal property CALSCALE default value
     */
    const GREGORIAN      = 'GREGORIAN';


    /**
     * iCal global component parameter keywords
     */
    const ALTREP           = 'ALTREP';           // Alternate Text Representation
    const LANGUAGE         = 'LANGUAGE';         // values defined in [RFC5646]
    const VALUE            = 'VALUE';

    /**
     * iCal component properties  VALUE parameter key values
     *
     * DURATION, set above,                      // TRIGGERtrait
     */
    const BINARY           = 'BINARY';
    const BOOLEAN          = 'BOOLEAN';
    const CAL_ADDRESS      = 'CAL_ADDRESS';
    const DATE             = 'DATE';             // YYYYMMDD
    const DATE_TIME        = 'DATE-TIME';        // YYYYMMDDTHHMMDD[Z/timezone]
    const FLOAT            = 'FLOAT';
    const INTEGER          = 'INTEGER';
    const PERIOD           = 'PERIOD';           // date-time / date-time  or  date-time / dur-value
    const RECUR            = 'RECUR';
    const TEXT             = 'TEXT';
    const TIME             = 'TIME';             // HHMMSS
    const URI              = 'URI';              // Section 3 of [RFC3986]
    const UTC_OFFSET       = 'UTC-OFFSET';       // ("+" / "-") time-hour time-minute [time-second


    /**
     * iCal component properties ATTENDEE/ORGANIZER parameter keywords
     */
    const CUTYPE           = 'CUTYPE';           // Calendar User Type
    const MEMBER           = 'MEMBER';           // Group or List Membership
    const ROLE             = 'ROLE';             // Participation Role
    const PARTSTAT         = 'PARTSTAT';         // Participation Status
    const RSVP             = 'RSVP';             // 'reply expected'
    const DELEGATED_TO     = 'DELEGATED-TO';     // Delegatees
    const DELEGATED_FROM   = 'DELEGATED-FROM';   // Delegators
    const SENT_BY          = 'SENT-BY';
    const CN               = 'CN';               // Common name
    const DIR              = 'DIR';              // Directory Entry Reference

    /**
     * iCal component properties ATTENDEE/ORGANIZER CUTYPE parameter key values
     */
    const GROUP            = 'GROUP';
    const INDIVIDUAL       = 'INDIVIDUAL';       // (default)
    const RESOURCE         = 'RESOURCE';
    const ROOM             = 'ROOM';
    const UNKNOWN          = 'UNKNOWN';

    /**
     * iCal component properties ATTENDEE PARTSTAT parameter key values
     *
     * COMPLETED, Vtodo, set above
     */
    const NEEDS_ACTION     = 'NEEDS-ACTION';     // Vevent, Vtodo, Vjournal (default)
    const ACCEPTED         = 'ACCEPTED';         // Vevent, Vtodo, Vjournal
    const DECLINED         = 'DECLINED';         // Vevent, Vtodo, Vjournal
    const TENTATIVE        = 'TENTATIVE';        // Vevent, Vtodo
    const DELEGATED        = 'DELEGATED';        // Vevent, Vtodo
    const IN_PROCESS       = 'IN-PROCESS';       // Vtodo


    /**
     * iCal component properties ATTENDEE ROLE parameter keywords
     */
    const CHAIR            = 'CHAIR';
    const REQ_PARTICIPANT  = 'REQ-PARTICIPANT';   // (default)
    const OPT_PARTICIPANT  = 'OPT-PARTICIPANT';
    const NON_PARTICIPANT  = 'NON-PARTICIPANT';

    /**
     * iCal component property param value, VALUE=BOOLEAN, ex ATTENDEE  param key RSVP
     */
    const FALSE            = 'FALSE';
    const TRUE             = 'TRUE';


    /**
     * iCal component properties RRULE, EXRULE 'RECUR' keywords
     */
    const FREQ             = 'FREQ';
    const UNTIL            = 'UNTIL';
    const COUNT            = 'COUNT';
    const INTERVAL         = 'INTERVAL';
    const BYSECOND         = 'BYSECOND';
    const BYMINUTE         = 'BYMINUTE';
    const BYHOUR           = 'BYHOUR';
    const BYDAY            = 'BYDAY';
    const BYMONTHDAY       = 'BYMONTHDAY';
    const BYYEARDAY        = 'BYYEARDAY';
    const BYWEEKNO         = 'BYWEEKNO';
    const BYMONTH          = 'BYMONTH';
    const BYSETPOS         = 'BYSETPOS';
    const WKST             = 'WKST';
    const SECONDLY         = 'SECONDLY';         // FREQ value
    const MINUTELY         = 'MINUTELY';         // FREQ value
    const HOURLY           = 'HOURLY';           // FREQ value
    const DAILY            = 'DAILY';            // FREQ value
    const WEEKLY           = 'WEEKLY';           // FREQ value
    const MONTHLY          = 'MONTHLY';          // FREQ value
    const YEARLY           = 'YEARLY';           // FREQ value
    const DAY              = 'DAY';
    const SU               = 'SU';               // SUNDAY
    const MO               = 'MO';               // MONDAY
    const TU               = 'TU';               // TUESDAY
    const WE               = 'WE';               // WEDNESDAY
    const TH               = 'TH';               // THURSDAY
    const FR               = 'FR';               // FRIDAY
    const SA               = 'SA';               // SATURDAY


    /**
     * iCal component property ACTION values
     */
    const AUDIO            = 'AUDIO';
    const DISPLAY          = 'DISPLAY';
    const EMAIL            = 'EMAIL';
    const PROCEDURE        = 'PROCEDURE';        // Deprecated in rfc5545

    /**
     * iCal component property ATTACH parameter keywords
     *
     * VALUE, set above
     */
    const ENCODING         = 'ENCODING';         // Inline Encoding
    const FMTTYPE          = 'FMTTYPE';          // (Inline ) Format Type (media type [RFC4288])

    /**
     * iCal component property ATTACH parameter key ENCODING values
     */
    const EIGHTBIT         = '8BIT';             // e.i 8BIT...
    const BASE64           = 'BASE64';

    /**
     * iCal component property CLASS values
     */
    const P_BLIC           = 'PUBLIC';           // note PUBLIC
    const P_IVATE          = 'PRIVATE';          // note PRIVATE
    const CONFIDENTIAL     = 'CONFIDENTIAL';

    /**
     * iCal component property FREEBUZY parameter keyword
     */
    const FBTYPE           = 'FBTYPE';           // Free/Busy Time Type

    /**
     * iCal component property FREEBUZY parameter key FBTYPE values
     */
    const FREE             = 'FREE';
    const BUSY             = 'BUSY';
    const BUSY_UNAVAILABLE = 'BUSY-UNAVAILABLE';
    const BUSY_TENTATIVE   = 'BUSY-TENTATIVE';

    /**
     * iCal component property RECURRENCE-ID parameter keyword
     */
    const RANGE            = 'RANGE';            // Recurrence Identifier Range

    /**
     * iCal component property RECURRENCE-ID parameter key value
     */
    const THISANDFUTURE    = 'THISANDFUTURE';    // RANGE value


    /**
     * iCal component property RELATED-TO parameter keyword
     */
    const RELTYPE          = 'RELTYPE';          //  Relationship Type

    /**
     * iCal component property RELATED-TO parameter key RELTYPE value
     */
    const PARENT           = 'PARENT';           // (default)
    const CHILD            = 'CHILD';
    const SIBLING          = 'SIBLING';

    /**
     * iCal component property TRIGGER parameter keyword
     */
    const RELATED          = 'RELATED';

    /**
     * iCal component property TRIGGER parameter key TRIGGER values
     */
    const START            = 'START';
    const END              = 'END';

    /**
     * iCal component property GEO parts
     */
    const LATITUDE         = 'latitude';
    const LONGITUDE        = 'longitude';

    /**
     * iCal component property Request-status  parts
     */
    const STATCODE         = 'statcode';
    const STATDESC         = 'statdesc';
    const EXTDATA          = 'extdata';

    /**
     * iCal component property STATUS values
     *
     * NEEDS_ACTION, set above                   // Vtodo
     * TENTATIVE, set above                      // Vevent
     * COMPLETED, set above                      // Vtodo
     * IN_PROCESS                                // Vtodo
     */
    const CONFIRMED        = 'CONFIRMED';        // Vevent
    const CANCELLED        = 'CANCELLED';        // Vevent, Vtodo, Vjournal
    const DRAFT            = 'DRAFT';            // Vjournal
    const F_NAL            = 'FINAL';            // Vjournal


    /**
     * iCal component property TRANSP values
     */
    const OPAQUE           = 'OPAQUE';           // default
    const TRANSPARENT      = 'TRANSPARENT';


    /**
     * UTC DateTimezones
     */
    const Z                = 'Z';
    const UTC              = 'UTC';
    const GMT              = 'GMT';

    /**
     * Calendar extension x-properties, some...
     * @link http://en.wikipedia.org/wiki/ICalendar#Calendar_extensions
     */
    const X_WR_CALNAME     = 'X-WR-CALNAME';
    const X_WR_CALDESC     = 'X-WR-CALDESC';
    const X_WR_RELCALID    = 'X-WR-RELCALID';
    const X_WR_TIMEZONE    = 'X-WR-TIMEZONE';
    const X_LIC_LOCATION   = 'X-LIC-LOCATION';

    /**
     * Vcalendar::selectComponents() added component x-property names
     */
    const X_CURRENT_DTSTART = 'X-CURRENT-DTSTART';
    const X_CURRENT_DTEND   = 'X-CURRENT-DTEND';
    const X_CURRENT_DUE     = 'X-CURRENT-DUE';
    const X_RECURRENCE      = 'X-RECURRENCE';
    const X_OCCURENCE       = 'X-OCCURENCE';

    /**
     * Class constants, config keys
     *
     * LANGUAGE, TZID and URL, set above
     *   deprecated : DELIMITER, DIRECTORY, FILENAME, DIRFILE, FILESIZE, FILEINFO
     */
    const ALLOWEMPTY       = 'ALLOWEMPTY';
    const COMPSINFO        = 'COMPSINFO';
    const UNIQUE_ID        = 'UNIQUE_ID';

    const DELIMITER        = 'DELIMITER';
    const DIRECTORY        = 'DIRECTORY';
    const FILENAME         = 'FILENAME';
    const DIRFILE          = 'DIRFILE';
    const FILESIZE         = 'FILESIZE';
    const FILEINFO         = 'FILEINFO';

    const PROPINFO         = 'PROPINFO';
    const SETPROPERTYNAMES = 'SETPROPERTYNAMES';

}
