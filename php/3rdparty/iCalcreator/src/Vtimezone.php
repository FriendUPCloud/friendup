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

use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\DateTimeZoneFactory;
use Kigkonsult\Icalcreator\Util\StringFactory;
use DateTime;
use Exception;
use InvalidArgumentException;

use function array_keys;
use function sprintf;
use function strtolower;
use function strtoupper;
use function ucfirst;

/**
 * iCalcreator VTIMEZONE component class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.15 - 2019-02-23
 */
final class Vtimezone extends CalendarComponent
{
    use Traits\COMMENTtrait,
        Traits\DTSTARTtrait,
        Traits\LAST_MODIFIEDtrait,
        Traits\RDATEtrait,
        Traits\RRULEtrait,
        Traits\TZIDtrait,
        Traits\TZNAMEtrait,
        Traits\TZOFFSETFROMtrait,
        Traits\TZOFFSETTOtrait,
        Traits\TZURLtrait;

    /**
     * @var string
     * @access protected
     * @static
     */
    protected static $compSgn = 'tz';

    /*
     * @var string  for populate method (and descendents)
     * @access private
     * @static
     */
    private static $OFFSET  = 'offset';
    private static $TIME    = 'time';
    private static $YMD     = 'Ymd';
    private static $TS      = 'ts';
    private static $SECONDS = 'seconds';
    private static $ABBR    = 'abbr';
    private static $ISDST   = 'isdst';

    /**
     * Destructor
     *
     * @since  2.26 - 2018-11-10
     */
    public function __destruct() {
        if( ! empty( $this->components )) {
            foreach( $this->components as $cix => $component ) {
                $this->components[$cix]->__destruct();
            }
        }
        unset(
            $this->compType,
            $this->xprop,
            $this->components,
            $this->unparsed,
            $this->config,
            $this->propIx,
            $this->compix,
            $this->propDelIx
        );
        unset(
            $this->cno,
            $this->srtk
        );
        unset(
            $this->comment,
            $this->dtstart,
            $this->lastmodified,
            $this->rdate,
            $this->rrule,
            $this->tzid,
            $this->tzname,
            $this->tzoffsetfrom,
            $this->tzoffsetto,
            $this->tzurl,
            $this->timezonetype
        );
    }

    /**
     * Return formatted output for calendar component VTIMEZONE object instance
     *
     * @return string
     * @throws Exception  (on Rdate err)
     * @since  2.27.2 - 2018-12-21
     */
    public function createComponent() {
        $compType    = strtoupper( $this->getCompType());
        $component   = sprintf( self::$FMTBEGIN, $compType );
        $component  .= $this->createTzid();
        $component  .= $this->createLastModified();
        $component  .= $this->createTzurl();
        $component  .= $this->createDtstart();
        $component  .= $this->createTzoffsetfrom();
        $component  .= $this->createTzoffsetto();
        $component  .= $this->createComment();
        $component  .= $this->createRdate();
        $component  .= $this->createRrule();
        $component  .= $this->createTzname();
        $component  .= $this->createXprop();
        $component  .= $this->createSubComponent();
        return $component . sprintf( self::$FMTEND, $compType );
    }

    /**
     * Return formatted output for subcomponents
     *
     * @return string
     * @since  2.27.2 - 2018-12-21
     * @throws Exception  (on Valarm/Standard/Daylight) err)
     */
    public function createSubComponent() {
        if( self::VTIMEZONE == $this->getCompType()) {
            $this->sortVtimezonesSubComponents();
        }
        return parent::createSubComponent();
    }

    /**
     * Sort Vtimezones subComponents
     *
     * sort : standard, daylight, in dtstart order
     * @access private
     * @since  2.27.6 - 2018-12-29
     */
    private function sortVtimezonesSubComponents() {
        if( empty( $this->components )) {
            return;
        }
        $stdArr = $dlArr = [];
        foreach( array_keys( $this->components ) as $cix ) {
            if( empty( $this->components[$cix] )) {
                continue;
            }
            $key = $this->components[$cix]->getDtstart();
            if( empty( $key )) {
                $key = $cix * 10;
            }
            else {
                $key = DateTimeFactory::getYMDHISEString( $key );
            }
            if( self::STANDARD == $this->components[$cix]->getCompType()) {
                while( isset( $stdArr[$key] )) {
                    $key += 1;
                }
                $stdArr[$key] = $this->components[$cix];
            }
            elseif( self::DAYLIGHT == $this->components[$cix]->getCompType()) {
                while( isset( $dlArr[$key] )) {
                    $key += 1;
                }
                $dlArr[$key] = $this->components[$cix];
            }
        } // end foreach(...
        $this->components = [];
        ksort( $stdArr, SORT_NUMERIC );
        foreach( $stdArr as $std ) {
            $this->components[] = $std;
        }
        unset( $stdArr );
        ksort( $dlArr, SORT_NUMERIC );
        foreach( $dlArr as $dl ) {
            $this->components[] = $dl;
        }
        unset( $dlArr );
    }

    /**
     * Return new calendar component, included in component
     *
     * @param string $compType component type
     * @return CalendarComponent
     * @throws InvalidArgumentException
     * @deprecated in favor of new<component> methods
     * @since  2.27.2 - 2018-12-21
     */
    public function newComponent( $compType ) {
        static $ERRMSG = 'Unknown component %s';
        switch( ucfirst( strtolower( $compType ))) {
            case self::STANDARD :
                return $this->newStandard();
                break;
            case self::DAYLIGHT :
                return $this->newDaylight();
                break;
            default:
                break;
        }
        throw new InvalidArgumentException( sprintf( $ERRMSG, $compType ));
    }

    /**
     * Return timezone standard object instance
     *
     * @return Standard
     * @since  2.27.2 - 2018-12-21
     */
    public function newStandard() {
        array_unshift( $this->components, new Standard( $this->getConfig()));
        return $this->components[0];
    }

    /**
     * Return timezone daylight object instance
     *
     * @return Daylight
     * @since  2.27.2 - 2018-12-21
     */
    public function newDaylight() {
        $ix = ( empty( $this->components ))
            ? 0
            : key( array_slice( $this->components, -1, 1, true )) + 1;
        $this->components[$ix] = new Daylight( $this->getConfig());
        return $this->components[$ix];
    }

    /**
     * Return calendar with timezone and standard/daylight components
     *
     * Result when 'Europe/Stockholm' and no from/to arguments is used as timezone:
     * BEGIN:VTIMEZONE
     * TZID:Europe/Stockholm
     * BEGIN:STANDARD
     * DTSTART:20101031T020000
     * TZOFFSETFROM:+0200
     * TZOFFSETTO:+0100
     * TZNAME:CET
     * END:STANDARD
     * BEGIN:DAYLIGHT
     * DTSTART:20100328T030000
     * TZOFFSETFROM:+0100
     * TZOFFSETTO:+0200
     * TZNAME:CEST
     * END:DAYLIGHT
     * END:VTIMEZONE
     *
     * Contributors :
     *   Yitzchok Lavi <icalcreator@onebigsystem.com>
     *   jpirkey
     *
     * @param Vcalendar $calendar iCalcreator calendar instance
     * @param string    $timezone valid timezone acceptable by PHP5 DateTimeZone
     * @param array     $xProp    *[x-propName => x-propValue]
     * @param DateTime|int  $start    .. or unix timestamp
     * @param DateTime|int  $end      .. or unix timestamp
     * @return Vcalendar
     * @throws Exception
     * @throws InvalidArgumentException;
     * @static
     * @since  2.27.15 - 2019-03-10
     */
    public static function populate(
        Vcalendar $calendar,
        $timezone = null,
        $xProp    = [],
        $start    = null,
        $end      = null
    ) {
        static $ERR = 'Invalid argument xProp';
        $timezone   = self::getTimezone( $calendar, $timezone, $xProp );
        if( ! empty( $xProp ) && ! is_array( $xProp )) {
            throw new InvalidArgumentException( $ERR );
        }
        $foundTrans = [];
        if( ! DateTimeZoneFactory::isUTCtimeZone( $timezone )) {
            list( $start, $end ) = self::ensureStartAndEnd( $calendar, $timezone, $start, $end );
            $foundTrans          = self::findTransitions( $timezone, $start, $end );
        }
        while( false !== $calendar->deleteComponent( Vcalendar::VTIMEZONE )) {
            continue;
        }
        $timezoneComp = $calendar->newVtimezone();
        $timezoneComp->setTzid( $timezone );
        if( ! empty( $xProp )) {
            foreach( $xProp as $xPropName => $xPropValue ) {
                if( StringFactory::isXprefixed( $xPropName )) {
                    $timezoneComp->setXprop( $xPropName, $xPropValue );
                }
            }
        }
        foreach( $foundTrans as $tix => $trans ) {
            // create standard/daylight subcomponents
            $subComp = ( true !== $trans[self::$ISDST] )
                ? $timezoneComp->newStandard()
                : $timezoneComp->newDaylight();
            $subComp->setDtstart( $trans[self::$TIME] );
            if( ! empty( $trans[self::$ABBR] )) {
                $subComp->setTzname( $trans[self::$ABBR] );
            }
            if( isset( $trans[Vcalendar::TZOFFSETFROM] )) {
                $subComp->setTzoffsetfrom( DateTimeZoneFactory::secondsToOffset( $trans[Vcalendar::TZOFFSETFROM] ));
            }
            $subComp->setTzoffsetto( DateTimeZoneFactory::secondsToOffset( $trans[self::$OFFSET] ));
            if( isset( $trans[Vcalendar::RDATE] )) {
                foreach( $trans[Vcalendar::RDATE] as $rDate ) {
                    // single RDATEs, each with one date
                    $subComp->setRdate( $rDate );
                }
            }
        }
        return $calendar;
    }

    /**
     * Return timezone
     *
     * @param Vcalendar $calendar iCalcreator calendar instance
     * @param string    $timezone valid timezone acceptable by PHP5 DateTimeZone
     * @param array     $xProp    *[x-propName => x-propValue]
     * @return string
     * @access private
     * @static
     * @since  2.27.15 - 2019-03-10
     */
    private static function getTimezone( Vcalendar $calendar, $timezone = null, $xProp = [] ) {
        if( empty( $timezone )) {
            if(( false === ( $timezone = $calendar->getXprop( Vcalendar::X_WR_TIMEZONE )[1] )) &&
                ( Util::issetAndNotEmpty( $xProp, Vcalendar::X_LIC_LOCATION ))) {
                $timezone = $xProp[Vcalendar::X_LIC_LOCATION];
            }
        }
        if( empty( $timezone )) {
            return Vcalendar::UTC;
        }
        DateTimeZoneFactory::assertDateTimeZone( $timezone );
        return $timezone;
    }

    /**
     * Return valid (ymd-)from/tom
     *
     * @param Vcalendar     $calendar
     * @param string        $timezone  valid timezone acceptable by PHP5 DateTimeZone
     * @param DateTime|int  $start    .. or unix timestamp
     * @param DateTime|int  $end      .. or unix timestamp
     * @return array
     * @access private
     * @throws  InvalidArgumentException
     * @throws  Exception
     * @static
     * @since  2.27.15 - 2019-03-21
     */
    private static function ensureStartAndEnd(
        Vcalendar $calendar,
        $timezone,
        $start = null,
        $end   = null
    ) {
        static $NUMBEROFDAYSBEFORE = 365;
        static $FMTBEFORE          = '-%d days';
        static $NUMBEROFDAYSAFTER  = 548;
        static $FMTAFTER           = '+%d days';
        static $ERRMSG = 'Date are not in order: %d - %d';
        if( ! empty( $start )) {
            if( $start instanceof DateTime ) {
                $start = $start->getTimestamp();
            }
            else {
                parent::assertIsInteger( $start, __METHOD__ );
            }
        }
        if( ! empty( $end )) {
            if( $end instanceof DateTime ) {
                $end = $end->getTimestamp();
            }
            else {
                parent::assertIsInteger( $end, __METHOD__ );
            }
        }
        switch( true ) {
            case ( ! empty( $start ) && ! empty( $end )) :
                break;
            case ( ! empty( $start )) : //  set to = +18 month (i.e 548 days)
                $end = $start + ( 3600 * 24 * $NUMBEROFDAYSAFTER );
                break;
            case ( ! empty( $end )) :  // set from = -12 month (i.e 365 days)
                $start = $end - ( 3600 * 24 * $NUMBEROFDAYSBEFORE );
                break;
            default :
                $dtstarts = array_keys( $calendar->getProperty( Vcalendar::DTSTART ));
                switch( true ) {
                    case ( empty( $dtstarts ) ) :
                        $start = DateTimeFactory::getDateTimeFromDateArrayTimestamp(
                            [ Util::$LCTIMESTAMP => time(), Util::$LCtz => $timezone ]
                        );
                        $end   = ( clone $start );
                        break;
                    case ( 1 == count( $dtstarts )) :
                        $start = DateTimeFactory::factory( reset( $dtstarts ), $timezone );
                        $end   = ( clone $start );
                        break;
                    default :
                        $start = DateTimeFactory::factory( reset( $dtstarts ), $timezone );
                        $end   = DateTimeFactory::factory( end(   $dtstarts ), $timezone );
                        break;
                }
                $start = $start->modify( sprintf( $FMTBEFORE, $NUMBEROFDAYSBEFORE ))->getTimestamp();
                $end   = $end->modify( sprintf( $FMTAFTER, $NUMBEROFDAYSAFTER ))->getTimestamp();
                break;
        } // end switch
        if( $start > $end ) {
            throw new InvalidArgumentException( sprintf( $ERRMSG, $start, $end ));
        }
        return [
            $start,
            $end
        ];
    }

    /**
     * Return (prep'd) datetimezone transitions
     *
     * @param string $timezone
     * @param int    $start
     * @param int    $end
     * @return array
     * @throws InvalidArgumentException
     * @throws Exception
     * @access private
     * @static
     * @since  2.27.15 - 2019-02-23
     */
    private static function findTransitions( $timezone, $start, $end ) {
        static $Y       = 'Y';
        $foundTrans     = [];
        $prevOffsetFrom = 0;
        $stdIx          = $dlghtIx = -1;
        $backupTrans    = false;
        $dateFromYmd    = DateTimeFactory::getYmdFromTimestamp( $start, $timezone );
        $dateToYmd      = DateTimeFactory::getYmdFromTimestamp( $end, $timezone );
        // extend search-args to assure we start/end at daylight shifts
        $start -= ( 3600 * 24 * 275 );
        $end   += ( 3600 * 24 * 185 );
        $transitions    = DateTimeZoneFactory::getDateTimeZoneTransitions( $timezone, $start, $end );
        // all transitions in date-time order!!
        foreach( $transitions as $tix => $trans ) {
            if( 0 > (int) date( $Y, $trans[self::$TS] )) {
                // skip negative year... but save offset
                $prevOffsetFrom = $trans[self::$OFFSET];
                // previous trans offset will be 'next' trans offsetFrom
                continue;
            }
            $transDate = DateTimeFactory::getDateTimeFromDateArrayTimestamp( [
                Util::$LCTIMESTAMP => $trans[self::$TS]
            ]);
            $transDateYmd = $transDate->format( self::$YMD );
            if( $transDateYmd < $dateFromYmd ) {
                // previous trans offset will be 'next' trans offsetFrom
                $prevOffsetFrom = $trans[self::$OFFSET];
                // we save it in case we don't find any match
                $backupTrans = $trans;
                $backupTrans[Vcalendar::TZOFFSETFROM] = ( 0 < $tix ) ? $transitions[$tix - 1][self::$OFFSET] : 0;
                continue;
            }
            if(( $transDateYmd > $dateToYmd ) && ( -1 < ( $stdIx + $dlghtIx ))) {
                // loop always (?) breaks here with, at least, one standard/daylight
                break;
            }
            if( ! empty( $prevOffsetFrom ) || ( 0 == $prevOffsetFrom )) {
                // set previous offsetto as offsetFrom
                $trans[Vcalendar::TZOFFSETFROM] = $prevOffsetFrom;
                // convert utc time to local time
                $transDate->modify( $trans[Vcalendar::TZOFFSETFROM] . self::$SECONDS );
                $trans[self::$TIME]             = $transDate;
            }
            $prevOffsetFrom = $trans[self::$OFFSET];
            if( true !== $trans[self::$ISDST] ) {
                // standard timezone, build RDATEs (in date order)
                if(( -1 < $stdIx ) &&
                    self::matchTrans( $foundTrans[$stdIx], $trans )) {
                    $foundTrans[$stdIx][Vcalendar::RDATE][] = clone $trans[self::$TIME];
                    continue;
                }
                $stdIx = $tix;
            } // end standard timezone
            else {
                // daylight timezone, build RDATEs (in date order)
                if(( -1 < $dlghtIx ) &&
                    self::matchTrans( $foundTrans[$dlghtIx], $trans )) {
                    $foundTrans[$dlghtIx][Vcalendar::RDATE][] = clone $trans[self::$TIME];
                    continue;
                }
                $dlghtIx = $tix;
            } // end daylight timezone
            $foundTrans[$tix] = $trans;
        } // end foreach( $transitions as $tix => $trans )
        if( empty( $foundTrans )) {
            $foundTrans[0] = self::buildTrans( $backupTrans, $timezone );
        }
        return $foundTrans;
    }

    /**
     * return bool true if foundTrans matches trans
     *
     * @param array $foundTrans
     * @param array $trans
     * @return bool
     * @access private
     * @static
     * @since  2.27.15 - 2019-02-23
     */
    private static function matchTrans( array $foundTrans, array $trans ) {
        return
            ((  isset( $foundTrans[Vcalendar::TZOFFSETFROM] )) &&
             ( $foundTrans[self::$ABBR]   == $trans[self::$ABBR] ) &&
             ( $foundTrans[Vcalendar::TZOFFSETFROM]
                                          == $trans[Vcalendar::TZOFFSETFROM] ) &&
             ( $foundTrans[self::$OFFSET] == $trans[self::$OFFSET] )
            );
    }

    /**
     * return (array build 'found'-trans
     *
     * @param array|bool $backupTrans
     * @param string     $timezone
     * @return array
     * @throws InvalidArgumentException
     * @throws Exception
     * @access private
     * @static
     * @since  2.27.15 - 2019-02-23
     */
    private static function buildTrans( $backupTrans, $timezone ) {
        static $NOW = 'now';
        if( is_array( $backupTrans )) {
            // we use the last transition (i.e. before startdate) for the tz info
            $prevDate = DateTimeFactory::getDateTimeFromDateArrayTimestamp( [
                Util::$LCTIMESTAMP => $backupTrans[self::$TS],
                Util::$LCtz        => Vcalendar::UTC
            ] );
            // convert utc date to 'local' date
            $prevDate->modify( $backupTrans[Vcalendar::TZOFFSETFROM] . self::$SECONDS );
            $backupTrans[self::$TIME] = $prevDate;
        } // end if( $backupTrans )
        else {
            // or we use the timezone identifier to BUILD the standard tz info (?)
            $prevDate    = DateTimeFactory::factory( $NOW, $timezone );
            $backupTrans = [
                self::$TIME             => $prevDate,
                self::$OFFSET           => $prevDate->format( Vcalendar::Z ),
                Vcalendar::TZOFFSETFROM => $prevDate->format( Vcalendar::Z ),
                self::$ISDST            => false,
            ];
        }
        return $backupTrans;
    }

}
