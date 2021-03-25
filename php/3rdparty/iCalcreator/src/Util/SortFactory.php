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
use Kigkonsult\Icalcreator\CalendarComponent;
use DateInterval;

use function array_slice;
use function is_null;
use function key;
use function reset;
use function strcmp;

/**
 * iCalcreator SortFactory class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.26.7 - 2018-12-02
 */
class SortFactory
{
    /**
     * Vcalendar sort callback function
     *
     * @since 2.26 - 2018-11-10
     * @param CalendarComponent $a
     * @param CalendarComponent $b
     * @return int
     * @static
     */
    public static function cmpfcn(
        CalendarComponent $a,
        CalendarComponent $b
    ) {
        if( empty( $a )) {
            return -1;
        }
        if( empty( $b )) {
            return 1;
        }
        if( Vcalendar::VTIMEZONE == $a->getCompType()) {
            if( Vcalendar::VTIMEZONE != $b->getCompType()) {
                return -1;
            }
            elseif( $a->srtk[0] <= $b->srtk[0] ) {
                return -1;
            }
            else {
                return 1;
            }
        }
        elseif( Vcalendar::VTIMEZONE == $b->getCompType()) {
            return 1;
        }
        for( $k = 0; $k < 4; $k++ ) {
            if( empty( $a->srtk[$k] )) {
                return -1;
            }
            elseif( empty( $b->srtk[$k] )) {
                return 1;
            }
            $sortStat = strcmp( $a->srtk[$k], $b->srtk[$k] );
            if( 0 == $sortStat ) {
                continue;
            }
            return ( 0 < $sortStat ) ? 1 : -1;
        }
        return 0;
    }

    /**
     * Set sort arguments/parameters in component
     *
     * @since 2.27.14 - 2019-02-19
     * @param CalendarComponent $c valendar component
     * @param string            $sortArg
     * @static
     */
    public static function setSortArgs(
        CalendarComponent $c,
        $sortArg = null
    ) {
        static $INITARR = [ '0', '0', '0', '0' ];
        $c->srtk  = $INITARR;
        $compType = $c->getCompType();
        if( Vcalendar::VTIMEZONE == $compType ) {
            if( false === ( $c->srtk[0] = $c->getTzid())) {
                $c->srtk[0] = $c->cno; // set order
            }
            return;
        }
        elseif( ! is_null( $sortArg )) {
            if( Util::isPropInList( $sortArg, Vcalendar::$MPROPS1 )) { // all string
                $propValues = [];
                $c->getProperties( $sortArg, $propValues );
                if( ! empty( $propValues )) {
                    $c->srtk[0] = key( array_slice( $propValues, 0, 1, true ));
                }
                if( Vcalendar::RELATED_TO == $sortArg ) {
                    $c->srtk[0] = $c->getUid();
                }
            } // end if( Util::isPropInList( $sortArg, Util::$MPROPS1 ))
            else {
                $method = Vcalendar::getGetMethodName( $sortArg );
                if( false !== ( $d = $c->{$method}())) {
                    $c->srtk[0] = ( DateTimeFactory::isArrayDate( $d )) ? self::arrDate2str( $d ) : $d;
                    if( Vcalendar::UID == $sortArg ) {
                        if(( Vcalendar::VFREEBUSY != $compType  ) &&
                            ( false !== ( $d = $c->getRecurrenceid()))) {
                            $c->srtk[1] = self::arrDate2str( $d );
                            if( false === ( $c->srtk[2] = $c->getSequence())) {
                                $c->srtk[2] = 0; // missing sequence equals sequence:0 in comb. with recurr.-id
                            }
                        }
                        else {
                            $c->srtk[1] = $c->srtk[2] = PHP_INT_MAX;
                        }
                    } // end if( Vcalendar::UID == $sortArg )
                }
            } // end elseif( false !== ( $d = $c->getProperty( $sortArg )))
            return;
        } // end elseif( $sortArg )
        switch( true ) { // sortkey 0 : dtstart
            case ( false !== ( $d = $c->getXprop( Vcalendar::X_CURRENT_DTSTART ))) :
                $c->srtk[0] = $d[1];
                break;
            case ( false !== ( $d = $c->getDtstart())) :
                $c->srtk[0] = self::arrDate2str( $d );
                break;
        }
        switch( true ) { // sortkey 1 : dtend/due(/duration)
            case ( false !== ( $d = $c->getXprop( Vcalendar::X_CURRENT_DTEND ))) :
                $c->srtk[1] = $d[1];
                break;
            case ((( Vcalendar::VEVENT == $compType ) ||
                   ( Vcalendar::VFREEBUSY == $compType  )) &&
                ( false !== ( $d = $c->getDtend()))) :
                $c->srtk[1] = self::arrDate2str( $d );
                break;
            case ( false !== ( $d = $c->getXprop( Vcalendar::X_CURRENT_DUE ))) :
                $c->srtk[1] = $d[1];
                break;
            case (( Vcalendar::VTODO == $compType  ) && ( false !== ( $d = $c->getDue()))) :
                $c->srtk[1] = self::arrDate2str( $d );
                break;
            case ( (( Vcalendar::VEVENT == $compType  ) ||
                    ( Vcalendar::VTODO == $compType )) &&
                ( false !== ( $d = $c->getDuration( null, true )))) :
                $c->srtk[1] = self::arrDate2str( $d );
                break;
        }
        switch( true ) { // sortkey 2 : created/dtstamp
            case (( Vcalendar::VFREEBUSY != $compType  ) && ( false !== ( $d = $c->getCreated()))) :
                $c->srtk[2] = self::arrDate2str( $d );
                break;
            case ( false !== ( $d = $c->getDtstamp())) :
                $c->srtk[2] = self::arrDate2str( $d );
                break;
        }
        // sortkey 3 : uid
        if( false === ( $c->srtk[3] = $c->getUid())) {
            $c->srtk[3] = 0;
        }
    }

    /**
     * Return formatted string from (array) date/datetime
     *
     * @param array $aDate
     * @return string
     * @access private
     * @static
     */
    private static function arrDate2str( array $aDate ) {
        $str = DateTimeFactory::getYMDString( $aDate );
        if( isset( $aDate[Util::$LCHOUR] )) {
            $str .= DateTimeFactory::getHisString( $aDate );
        }
        if( isset( $aDate[Util::$LCtz] ) && ! empty( $aDate[Util::$LCtz] )) {
            $str .= $aDate[Util::$LCtz];
        }
        return $str;
    }

    /**
     * Sort callback function for exdate
     *
     * @param array $a
     * @param array $b
     * @return int
     * @static
     */
    public static function sortExdate1( array $a, array $b ) {
        $as  = DateTimeFactory::getYMDString( $a );
        $as .= ( isset( $a[Util::$LCHOUR] )) ? DateTimeFactory::getHisString( $a ) : null;
        $bs  = DateTimeFactory::getYMDString( $b );
        $bs .= ( isset( $b[Util::$LCHOUR] )) ? DateTimeFactory::getHisString( $b ) : null;
        return strcmp( $as, $bs );
    }

    /**
     * Sort callback function for exdate
     *
     * @param array $a
     * @param array $b
     * @return int
     * @static
     */
    public static function sortExdate2( array $a, array $b ) {
        $val = reset( $a[Util::$LCvalue] );
        $as  = DateTimeFactory::getYMDString( $val );
        $as .= ( isset( $val[Util::$LCHOUR] )) ? DateTimeFactory::getHisString( $val ) : null;
        $val = reset( $b[Util::$LCvalue] );
        $bs  = DateTimeFactory::getYMDString( $val );
        $bs .= ( isset( $val[Util::$LCHOUR] )) ? DateTimeFactory::getHisString( $val ) : null;
        return strcmp( $as, $bs );
    }

    /**
     * Sort callback function for freebusy and rdate, sort single property (inside values)
     *
     * @param array|DateInterval $a
     * @param array|DateInterval $b
     * @return int
     * @static
     * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
     * @since  2.26.7 - 2018-12-03
     */
    public static function sortRdate1( $a, $b ) {
        $as = null;
        if( $a instanceof DateInterval ) {
            $as = DateIntervalFactory::dateInterval2String( $a, true );
        }
        elseif( isset( $a[Util::$LCYEAR] )) {
            $as = self::formatdatePart( $a );
        }
        elseif( isset( $a[0][Util::$LCYEAR] )) {
            $as  = self::formatdatePart( $a[0] );
            if( isset( $a[1] )) {
                $as .= self::formatdatePart( $a[1] );
            }
        }
        else {
            return 1;
        }
        $bs = null;
        if( $b instanceof DateInterval ) {
            $bs = DateIntervalFactory::dateInterval2String( $b, true );
        }
        elseif( isset( $b[Util::$LCYEAR] )) {
            $bs = self::formatdatePart( $b );
        }
        elseif( isset( $b[0][Util::$LCYEAR] )) {
            $bs  = self::formatdatePart( $b[0] );
            if( isset( $b[1] )) {
                $bs .= self::formatdatePart( $b[1] );
            }
        }
        else {
            return -1;
        }
        return strcmp( $as, $bs );
    }

    /**
     * Sort callback function for rdate, sort multiple RDATEs in order (after 1st datetime/date/period)
     *
     * @param array|DateInterval $a
     * @param array|DateInterval $b
     * @return int
     * @static
     * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
     * @since  2.26.7 - 2018-12-03
     */
    public static function sortRdate2( $a, $b ) {
        $as = null;
        if( $a instanceof DateInterval ) {
            $as  = DateIntervalFactory::dateInterval2String( $a, true );
        }
        elseif( isset( $a[Util::$LCvalue][0][Util::$LCYEAR] )) {
            $as  = self::formatdatePart( $a[Util::$LCvalue][0] );
        }
        elseif( isset( $a[Util::$LCvalue][0][0][Util::$LCYEAR] )) {
            $as  = self::formatdatePart( $a[Util::$LCvalue][0][0] );
            if( isset( $a[Util::$LCvalue][0][1] )) {
                $as .= self::formatdatePart( $a[Util::$LCvalue][0][1] );
            }
        }
        else {
            return 1;
        }
        $bs = null;
        if( $b instanceof DateInterval ) {
            $bs  = DateIntervalFactory::dateInterval2String( $b, true );
        }
        elseif( isset( $b[Util::$LCvalue][0][Util::$LCYEAR] )) {
            $bs  = self::formatdatePart( $b[Util::$LCvalue][0] );
        }
        elseif( isset( $a[Util::$LCvalue][0][0][Util::$LCYEAR] )) {
            $bs  = self::formatdatePart( $b[Util::$LCvalue][0][0] );
            if( isset( $b[Util::$LCvalue][0][1] )) {
                $bs .= self::formatdatePart( $b[Util::$LCvalue][0][1] );
            }
        }
        else {
            return -1;
        }
        return strcmp( $as, $bs );
    }

    /**
     * Format date
     *
     * @param array|DateInterval $part
     * @return string
     * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
     * @since  2.26.7 - 2018-11-29
     */
    private static function formatdatePart( $part ) {
        if( $part instanceof DateInterval ) {
            $str = DateIntervalFactory::dateInterval2String( $part, true );
        }
        elseif( isset( $part[Util::$LCYEAR] )) {
            $str  = DateTimeFactory::getYMDString( $part );
            $str .= ( isset( $part[Util::$LCHOUR] )) ? DateTimeFactory::getHisString( $part ) : null;
        }
        else {
            $str = DateIntervalFactory::durationArray2string( $part );
        }
        return $str;
    }
}
