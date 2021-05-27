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

namespace Kigkonsult\Icalcreator\Util;

use Kigkonsult\Icalcreator\Vcalendar;

use function array_key_exists;
use function in_array;
use function is_array;
use function strtolower;
use function strtoupper;
use function ucfirst;

/**
 * iCalcreator utility/support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.2 - 2018-12-21
 */
class Util
{

    /**
     * @var string  some common X-properties
     * @see http://en.wikipedia.org/wiki/ICalendar#Calendar_extensions
     * @static
     * @deprecated in favor of IcalInterface constants
     */
    public static $X_WR_CALNAME    = 'X-WR-CALNAME';
    /* @deprecated in favor of IcalInterface constants */
    public static $X_WR_CALDESC    = 'X-WR-CALDESC';
    /* @deprecated in favor of IcalInterface constants */
    public static $X_WR_RELCALID   = 'X-WR-RELCALID';
    /* @deprecated in favor of IcalInterface constants */
    public static $X_WR_TIMEZONE   = 'X-WR-TIMEZONE';
    /* @deprecated in favor of IcalInterface constants */
    public static $X_LIC_LOCATION  = 'X-LIC-LOCATION';

    /**
     * @var string  iCal property names
     * @static
     * @deprecated in favor of IcalInterface constants
     */
    public static $ACTION           = 'ACTION';
    /* @deprecated in favor of IcalInterface constants */
    public static $ATTACH           = 'ATTACH';
    /* @deprecated in favor of IcalInterface constants */
    public static $ATTENDEE         = 'ATTENDEE';
    /* @deprecated in favor of IcalInterface constants */
    public static $CALSCALE         = 'CALSCALE';
    /* @deprecated in favor of IcalInterface constants */
    public static $CATEGORIES       = 'CATEGORIES';
    /* @deprecated in favor of IcalInterface constants */
    public static $CLASS            = 'CLASS';
    /* @deprecated in favor of IcalInterface constants */
    public static $COMMENT          = 'COMMENT';
    /* @deprecated in favor of IcalInterface constants */
    public static $COMPLETED        = 'COMPLETED';
    /* @deprecated in favor of IcalInterface constants */
    public static $CONTACT          = 'CONTACT';
    /* @deprecated in favor of IcalInterface constants */
    public static $CREATED          = 'CREATED';
    /* @deprecated in favor of IcalInterface constants */
    public static $DESCRIPTION      = 'DESCRIPTION';
    /* @deprecated in favor of IcalInterface constants */
    public static $DTEND            = 'DTEND';
    /* @deprecated in favor of IcalInterface constants */
    public static $DTSTAMP          = 'DTSTAMP';
    /* @deprecated in favor of IcalInterface constants */
    public static $DTSTART          = 'DTSTART';
    /* @deprecated in favor of IcalInterface constants */
    public static $DUE              = 'DUE';
    /* @deprecated in favor of IcalInterface constants */
    public static $DURATION         = 'DURATION';
    /* @deprecated in favor of IcalInterface constants */
    public static $EXDATE           = 'EXDATE';
    /* @deprecated in favor of IcalInterface constants */
    public static $EXRULE           = 'EXRULE';
    /* @deprecated in favor of IcalInterface constants */
    public static $FREEBUSY         = 'FREEBUSY';
    /* @deprecated in favor of IcalInterface constants */
    public static $GEO              = 'GEO';
    /* @deprecated in favor of IcalInterface constants */
    public static $GEOLOCATION      = 'GEOLOCATION';
    /* @deprecated in favor of IcalInterface constants */
    public static $LAST_MODIFIED    = 'LAST-MODIFIED';
    /* @deprecated in favor of IcalInterface constants */
    public static $LOCATION         = 'LOCATION';
    /* @deprecated in favor of IcalInterface constants */
    public static $METHOD           = 'METHOD';
    /* @deprecated in favor of IcalInterface constants */
    public static $ORGANIZER        = 'ORGANIZER';
    /* @deprecated in favor of IcalInterface constants */
    public static $PERCENT_COMPLETE = 'PERCENT-COMPLETE';
    /* @deprecated in favor of IcalInterface constants */
    public static $PRIORITY         = 'PRIORITY';
    /* @deprecated in favor of IcalInterface constants */
    public static $PRODID           = 'PRODID';
    /* @deprecated in favor of IcalInterface constants */
    public static $RECURRENCE_ID    = 'RECURRENCE-ID';
    /* @deprecated in favor of IcalInterface constants */
    public static $RELATED_TO       = 'RELATED-TO';
    /* @deprecated in favor of IcalInterface constants */
    public static $REPEAT           = 'REPEAT';
    /* @deprecated in favor of IcalInterface constants */
    public static $REQUEST_STATUS   = 'REQUEST-STATUS';
    /* @deprecated in favor of IcalInterface constants */
    public static $RESOURCES        = 'RESOURCES';
    /* @deprecated in favor of IcalInterface constants */
    public static $RDATE            = 'RDATE';
    /* @deprecated in favor of IcalInterface constants */
    public static $RRULE            = 'RRULE';
    /* @deprecated in favor of IcalInterface constants */
    public static $SEQUENCE         = 'SEQUENCE';
    /* @deprecated in favor of IcalInterface constants */
    public static $STATUS           = 'STATUS';
    /* @deprecated in favor of IcalInterface constants */
    public static $SUMMARY          = 'SUMMARY';
    /* @deprecated in favor of IcalInterface constants */
    public static $TRANSP           = 'TRANSP';
    /* @deprecated in favor of IcalInterface constants */
    public static $TRIGGER          = 'TRIGGER';
    /* @deprecated in favor of IcalInterface constants */
    public static $TZID             = 'TZID';
    /* @deprecated in favor of IcalInterface constants */
    public static $TZNAME           = 'TZNAME';
    /* @deprecated in favor of IcalInterface constants */
    public static $TZOFFSETFROM     = 'TZOFFSETFROM';
    /* @deprecated in favor of IcalInterface constants */
    public static $TZOFFSETTO       = 'TZOFFSETTO';
    /* @deprecated in favor of IcalInterface constants */
    public static $TZURL            = 'TZURL';
    /* @deprecated in favor of IcalInterface constants */
    public static $UID              = 'UID';
    /* @deprecated in favor of IcalInterface constants */
    public static $URL              = 'URL';
    /* @deprecated in favor of IcalInterface constants */
    public static $VERSION          = 'VERSION';
    /* @deprecated in favor of IcalInterface constants */
    public static $X_PROP           = 'X-PROP';

    /**
     * @var array  iCal V*-component collection
     * @static
     * @deprecated moved to IcalBase
     */
    public static $VCOMPS   = [
        Vcalendar::VEVENT,
        Vcalendar::VTODO,
        Vcalendar::VJOURNAL,
        Vcalendar::VFREEBUSY
    ];

    /**
     * @var array  iCal component collection
     * @static
     * @deprecated moved to IcalBase
     * @usedby IcalBase+Vcalendar
     */
    public static $MCOMPS   = [
        Vcalendar::VEVENT,
        Vcalendar::VTODO,
        Vcalendar::VJOURNAL,
        Vcalendar::VFREEBUSY,
        Vcalendar::VALARM,
        Vcalendar::VTIMEZONE
    ];

    /**
     * @var array  iCal sub-component collection
     * @static
     * @deprecated moved to IcalBase
     * @usedby CalendarComponent+IcalBase+DTSTAMPtrait
     */
    public static $SUBCOMPS = [
        Vcalendar::VALARM,
        Vcalendar::VTIMEZONE,
        Vcalendar::STANDARD,
        Vcalendar::DAYLIGHT
    ];

    /**
     * @var array  iCal timezone component collection
     * @static
     * @deprecated moved to IcalBase
     * @usedby DTSTARTtrait+RexdateFactory
     */
    public static $TZCOMPS  = [
        Vcalendar::VTIMEZONE,
        Vcalendar::STANDARD,
        Vcalendar::DAYLIGHT
    ];

    /**
     * @var array  iCal component misc. property collection
     * @static
     * @deprecated moved to IcalBase
     * @usedby Vcalendar + SelectFactory
     */
    public static $OTHERPROPS = [
        Vcalendar::ATTENDEE, Vcalendar::CATEGORIES, Vcalendar::CONTACT, Vcalendar::LOCATION,
        Vcalendar::ORGANIZER, Vcalendar::PRIORITY, Vcalendar::RELATED_TO, Vcalendar::RESOURCES,
        Vcalendar::STATUS, Vcalendar::SUMMARY, Vcalendar::UID, Vcalendar::URL,
    ];

    /**
     * @var array  iCal component multiple property sub-collection
     * @static
     * @deprecated moved to IcalBase
     * @usedby CalendarComponent + Vcalendar + SelectFactory + SortFactory
     */
    public static $MPROPS1    = [
        Vcalendar::ATTENDEE, Vcalendar::CATEGORIES, Vcalendar::CONTACT,
        Vcalendar::RELATED_TO, Vcalendar::RESOURCES,
    ];

    /**
     * @var array  iCal component multiple property collection
     * @static
     * @usedby CalendarComponent(deprecated) + IcalBase
     * @deprecated moved to IcalBase
     */
    public static $MPROPS2    = [
        Vcalendar::ATTACH, Vcalendar::ATTENDEE, Vcalendar::CATEGORIES,
        Vcalendar::COMMENT, Vcalendar::CONTACT, Vcalendar::DESCRIPTION,
        Vcalendar::EXDATE, Vcalendar::EXRULE, Vcalendar::FREEBUSY, Vcalendar::RDATE,
        Vcalendar::RELATED_TO, Vcalendar::RESOURCES, Vcalendar::RRULE,
        Vcalendar::REQUEST_STATUS, Vcalendar::TZNAME, Vcalendar::X_PROP,
    ];

    /**
     * @var string  iCalcreator config keys
     * @static
     * @deprecated in favor of IcalInterface constants
     */
    public static $ALLOWEMPTY       = 'ALLOWEMPTY';
    /* @deprecated in favor of IcalInterface constants */
    public static $COMPSINFO        = 'COMPSINFO';
    /* @deprecated in favor of IcalInterface constants */
    public static $DELIMITER        = 'DELIMITER';
    /* @deprecated in favor of IcalInterface constants */
    public static $DIRECTORY        = 'DIRECTORY';
    /* @deprecated in favor of IcalInterface constants */
    public static $FILENAME         = 'FILENAME';
    /* @deprecated in favor of IcalInterface constants */
    public static $DIRFILE          = 'DIRFILE';
    /* @deprecated in favor of IcalInterface constants */
    public static $FILESIZE         = 'FILESIZE';
    /* @deprecated in favor of IcalInterface constants */
    public static $FILEINFO         = 'FILEINFO';
    /* @deprecated in favor of IcalInterface constants */
    public static $LANGUAGE         = 'LANGUAGE';
    /* @deprecated in favor of IcalInterface constants */
    public static $PROPINFO         = 'PROPINFO';
    /* @deprecated in favor of IcalInterface constants */
    public static $SETPROPERTYNAMES = 'SETPROPERTYNAMES';
    /* @deprecated in favor of IcalInterface constants */
    public static $UNIQUE_ID        = 'UNIQUE_ID';

    /**
     * @var string  iCal date/time parameter key values
     * @static
     * @deprecated in favor of IcalInterface constants
     */
    public static $VALUE                = 'VALUE';
    /* @deprecated in favor of IcalInterface constants */
    public static $DATE                 = 'DATE';
    /* @deprecated in favor of IcalInterface constants */
    public static $PERIOD               = 'PERIOD';
    /* @deprecated in favor of IcalInterface constants */
    public static $DATE_TIME            = 'DATE-TIME';

    /**
     * @var string  iCal date/time parameter key values
     * @static
     */
    /* @deprecated in favor of IcalInterface constants */
    public static $Z                    = 'Z';
    public static $LCYEAR               = 'year';
    public static $LCMONTH              = 'month';
    public static $LCDAY                = 'day';
    public static $LCHOUR               = 'hour';
    public static $LCMIN                = 'min';
    public static $LCSEC                = 'sec';
    public static $LCtz                 = 'tz';
    public static $LCWEEK               = 'week';
    public static $LCTIMESTAMP          = 'timestamp';
    /* @deprecated in favor of IcalInterface constants */
    public static $UTC                  = 'UTC';
    /* @deprecated in favor of IcalInterface constants */
    public static $GMT                  = 'GMT';

    /**
     * @var string  iCal ATTENDEE, ORGANIZER etc param keywords
     * @static
     * @deprecated in favor of IcalInterface constants
     */
    public static $CUTYPE          = 'CUTYPE';
    /* @deprecated in favor of IcalInterface constants */
    public static $MEMBER          = 'MEMBER';
    /* @deprecated in favor of IcalInterface constants */
    public static $ROLE            = 'ROLE';
    /* @deprecated in favor of IcalInterface constants */
    public static $PARTSTAT        = 'PARTSTAT';
    /* @deprecated in favor of IcalInterface constants */
    public static $RSVP            = 'RSVP';
    /* @deprecated in favor of IcalInterface constants */
    public static $DELEGATED_TO    = 'DELEGATED-TO';
    /* @deprecated in favor of IcalInterface constants */
    public static $DELEGATED_FROM  = 'DELEGATED-FROM';
    /* @deprecated in favor of IcalInterface constants */
    public static $SENT_BY         = 'SENT-BY';
    /* @deprecated in favor of IcalInterface constants */
    public static $CN              = 'CN';
    /* @deprecated in favor of IcalInterface constants */
    public static $DIR             = 'DIR';
    /* @deprecated in favor of IcalInterface constants */
    public static $INDIVIDUAL      = 'INDIVIDUAL';
    /* @deprecated in favor of IcalInterface constants */
    public static $NEEDS_ACTION    = 'NEEDS-ACTION';
    /* @deprecated in favor of IcalInterface constants */
    public static $REQ_PARTICIPANT = 'REQ-PARTICIPANT';
    /* @deprecated in favor of IcalInterface constants */
    public static $false           = 'false';

    /**
     * @var string  iCal RRULE, EXRULE etc param keywords
     * @static
     * @deprecated in favor of IcalInterface constants
     */
    public static $FREQ       = 'FREQ';
    /* @deprecated in favor of IcalInterface constants */
    public static $UNTIL      = 'UNTIL';
    /* @deprecated in favor of IcalInterface constants */
    public static $COUNT      = 'COUNT';
    /* @deprecated in favor of IcalInterface constants */
    public static $INTERVAL   = 'INTERVAL';
    /* @deprecated in favor of IcalInterface constants */
    public static $WKST       = 'WKST';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYMONTHDAY = 'BYMONTHDAY';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYYEARDAY  = 'BYYEARDAY';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYWEEKNO   = 'BYWEEKNO';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYMONTH    = 'BYMONTH';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYSETPOS   = 'BYSETPOS';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYDAY      = 'BYDAY';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYHOUR     = 'BYHOUR';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYMINUTE   = 'BYMINUTE';
    /* @deprecated in favor of IcalInterface constants */
    public static $BYSECOND   = 'BYSECOND';
    /* @deprecated in favor of IcalInterface constants */
    public static $DAY        = 'DAY';
    /* @deprecated in favor of IcalInterface constants */
    public static $DAILY      = 'DAILY';
    /* @deprecated in favor of IcalInterface constants */
    public static $WEEKLY     = 'WEEKLY';
    /* @deprecated in favor of IcalInterface constants */
    public static $MONTHLY    = 'MONTHLY';
    /* @deprecated in favor of IcalInterface constants */
    public static $YEARLY     = 'YEARLY';

    /**
     * @var string  misc. values
     * @static
     * @deprecated in favor of IcalInterface constants
     */
    public static $BINARY     = 'BINARY';

    /**
     * @var string  misc. values
     * @static
     */
    public static $LCvalue       = 'value';
    public static $LCparams      = 'params';
    public static $CRLF          = "\r\n";
    public static $COMMA         = ',';
    public static $COLON         = ':';
    public static $QQ            = '"';
    public static $SEMIC         = ';';
    public static $MINUS         = '-';
    public static $PLUS          = '+';
    public static $SP0           = '';
    public static $SP1           = ' ';
    public static $ZERO          = '0';
    public static $DOT           = '.';
    public static $L             = '/';
    /* @deprecated in favor of IcalInterface constants */
    public static $UNPARSEDTEXT  = 'unparsedtext';

    /**
     * Return bool true if compType is in array
     *
     * @param string $compType   component name
     * @param array  $compList   list of components
     * @return bool
     * @static
     * @since  2.26 - 2018-11-03
     */
    public static function isCompInList( $compType, array $compList ) {
        if( empty( $compType )) {
            return false;
        }
        return in_array( ucfirst( strtolower( $compType )), $compList);
    }

    /**
     * Return bool true if property is in array
     *
     * @param string $propName   property name
     * @param array  $propList   list of properties
     * @return bool
     * @static
     * @since  2.26 - 2018-11-04
     */
    public static function isPropInList( $propName, array $propList ) {
        return in_array( strtoupper( $propName ), $propList);
    }

    /**
     * Return bool true if array key is isset and not empty
     *
     * @param mixed  $array
     * @param string $key
     * @return bool
     * @static
     * @since  2.26.14 - 2019-01-28
     */
    public static function issetAndNotEmpty( $array = null, $key = null) {
        if( empty( $array ) ||
            ! is_array( $array ) ||
            ! array_key_exists( $key, $array )) {
            return false;
        }
        return ( isset( $array[$key] ) && ! empty( $array[$key] ));
    }

    /**
     * Return bool true if array key is set and equals value
     *
     * @param mixed  $base
     * @param string $key
     * @param string $value
     * @return bool
     * @static
     * @since  2.26.14 - 2019-03-01
     */
    public static function issetKeyAndEquals( $base, $key, $value ) {
        if( empty( $base ) || ! is_array( $base ) || ! array_key_exists( $key, $base )) {
            return false;
        }
        return ( $value == $base[$key] );
    }

}

